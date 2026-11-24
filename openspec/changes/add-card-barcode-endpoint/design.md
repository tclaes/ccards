# Design

## Context

- `LoyaltyCard` has `cardNumber`, `barcodeType` (`CODE_128, EAN_13, EAN_8, UPC_A, QR_CODE`) and a JPA `@Version` that increases on every update. `CardNumberValidator` already guarantees GS1 digits and check digit for EAN-13, EAN-8 and UPC-A on write; Code 128 and QR accept any text up to 100 characters.
- Interfaces and DTOs are generated from `libs/api-contract/openapi.yaml`; `CardController` implements `CardsApi` (docs/ARCHITECTURE.md). `CardService.get` throws `CardNotFoundException`, mapped to a 404 problem by `GlobalExceptionHandler`.
- The default profile has no DataSource; card beans carry `@ConditionalOnProperty("spring.datasource.url")` and tests use `@WebMvcTest` with a mocked service.
- The enum names in `BarcodeType` match ZXing's `BarcodeFormat` constants.

## Goals / Non-Goals

**Goals:**
- A correct, scannable barcode for every stored type, in PNG and SVG.
- Cheap revalidation: a repeat request is a 304 without rendering.
- Show how binary responses work with `ResponseEntity`.

**Non-Goals:**
- Size/colour/margin parameters, previews for unsaved numbers, shared or long-lived caching, scanning.

## Decisions

### D1. Contract first: one operation, binary 200, two media types
`GET /api/cards/{id}/barcode`, operationId `getCardBarcode`, tag `Cards`, query `format` (enum `png`, `svg`, default `png`). The 200 response lists `image/png` and `image/svg+xml` with `type: string, format: binary`, so the generator emits `ResponseEntity<Resource>`. Other responses: 304 (no content), 400 (`BadRequest`), 404 (`NotFound`), 422 (new `Unprocessable` component, `application/problem+json`), 500. The generator emits `format` as a plain `String` (no enum check), so `ImageFormat.fromParameter` parses it and throws `UnsupportedFormatException`, which `GlobalExceptionHandler` maps to a 400 with an `errors` entry for `format`. *Alternative: two paths (`/barcode.png`, `/barcode.svg`)* — rejected: the issue specifies the `format` parameter.

### D2. Rendering in a service, HTTP in the controller
`BarcodeService.render(LoyaltyCard card, ImageFormat format)` returns the image bytes; `ImageFormat` (`PNG`, `SVG`) is a small enum in `service`. It knows nothing about HTTP or generated types, so the controller maps the generated `format` enum to `ImageFormat`, builds the `ResponseEntity` and sets headers. The controller gets the card from `CardService.get`, so unknown ids reuse the existing 404.

### D3. ZXing: one `MultiFormatWriter` for all types, PNG via `ImageIO`
Add `com.google.zxing:core` 3.5.4 (the Boot parent does not manage it). The `javase` module is not needed: PNG is drawn with `BufferedImage`/`ImageIO`, and tests decode with core's `RGBLuminanceSource`. `BarcodeType` maps to `BarcodeFormat` by name. Encode to a `BitMatrix` at its natural module size (width/height 0 for QR, a fixed bar height for 1D codes) so the quiet zone ZXing adds is kept, then:
- **PNG**: scale each module to 8 whole pixels (so bars stay crisp and scannable) in a `BufferedImage` and write it with `ImageIO`.
- **SVG**: ZXing has no SVG writer, so write one `<svg>` with a `viewBox` equal to the matrix size, a white background rect and one black `<path>` built from horizontal runs of dark modules, with `shape-rendering="crispEdges"`. No fixed width/height, so the client scales it with CSS. Output contains only numbers and constants, never the card number, so there is no injection surface.
*Alternative: a third-party SVG library* — rejected: the matrix-to-path loop is about 20 lines (KISS).

### D4. Unrenderable numbers become a 422
ZXing throws `IllegalArgumentException`/`WriterException` for text a type cannot encode (non-ASCII in Code 128, bad GS1 length). `BarcodeService` wraps these in `BarcodeNotRenderableException`; it also rejects U+00F1 to U+00F4 in Code 128 up front, because ZXing would draw them as function codes (FNC1-4) and a scan would return a different number; `GlobalExceptionHandler` maps it to a 422 problem with a generic detail ("The card number cannot be drawn as <type>.", no number echoed). The exception message carries the card id for the log only. *Alternative: 500* — rejected: it is bad stored data the client can fix, not a server fault. *Alternative: validate on write* — a worthwhile follow-up for Code 128, but changing write validation is out of scope here.

### D5. ETag from `version` and format; no rendering for 304
The ETag is a strong validator `"<version>-<format>"` (for example `"3-png"`). `version` increases on every card update, and `cardNumber` and `barcodeType` can only change through an update, so any change that alters the image changes the ETag, and the two formats never share one. The contract declares the `If-None-Match` header, so the generated method receives it. The controller loads the card and compares the tags in the header (a list, weak `W/` tags and `*` are understood) with the current ETag; on a match it answers 304 and never calls the renderer. The 304 still passes through the card lookup, which is one primary-key read. *Alternative: Spring's `ShallowEtagHeaderFilter`* — rejected: it renders the full body on every request just to hash it, defeating the point.

### D6. `Cache-Control: no-cache, private`
`no-cache` lets clients and the later service worker store the image but forces a conditional request before reuse, so an edited number can never show a stale barcode at the checkout (the worst failure for this feature). `private` because cards will be per user (CC-19). A `max-age` is deliberately left out until offline behaviour (CC-28) is designed. *Alternative: `max-age=86400`* — rejected: stale barcode for up to a day after an edit.

### D7. Tests
- `BarcodeServiceTests` (plain unit tests): for each of the five types render a PNG, decode it with ZXing's `MultiFormatReader` and assert the text and format match; SVG output is well-formed XML with a `viewBox`; a non-ASCII Code 128 number throws `BarcodeNotRenderableException`.
- `CardBarcodeControllerTests` (`@WebMvcTest` with mocked `CardService`/`BarcodeService`): default PNG and `svg` content types, `ETag` and `Cache-Control` headers, 304 on a matching `If-None-Match` with the renderer not called, new `ETag` after a version change, different `ETag` per format, 404, 400 for `format=gif` and a malformed uuid, 422 problem body without the number.
- The existing contract tests cover the generated interface; no database test is needed.

## Risks / Trade-offs

- **Accept header vs. `format`** → the generated interface may declare `produces` for both media types, so `Accept: image/png` with `format=svg` could give 406. That is acceptable (the client asked for something inconsistent); a controller test pins whichever behaviour results, and `Accept: */*` and no `Accept` work.
- **Renderer changes without a version bump** → a deployed change to the drawing code (scale, margin) keeps old ETags, so a client could keep an older but still valid image until the card is edited. Acceptable now; if it matters, add a renderer revision to the ETag.
- **Code 128 accepts text ZXing cannot encode** → shows up as 422 at read time. Tightening write validation is a possible follow-up.
- **`BufferedImage`/`ImageIO` need `java.desktop` (AWT)** → used headless (no windows); the tests run without a display.
