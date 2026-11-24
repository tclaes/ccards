# Proposal

## Why

The point of the app is to show a card's barcode at the checkout. Today a card only stores its number and `barcodeType`, so there is nothing to scan. Rendering the barcode on the server gives one tested implementation for every client (checkout view CC-14, the card list, later offline caching) and keeps the barcode library out of the web bundle. It also lets clients cache the image cheaply, because it only changes when the card changes.

## What Changes

- Add `GET /api/cards/{id}/barcode?format=png|svg` to the OpenAPI contract. It returns the card's barcode as an image: PNG (`image/png`, default) or SVG (`image/svg+xml`).
- Render every stored `barcodeType` (`EAN_13`, `EAN_8`, `UPC_A`, `CODE_128`, `QR_CODE`) with the ZXing library.
- Send an `ETag` (derived from the card's `version` and the format) and `Cache-Control` so clients can revalidate and receive `304 Not Modified` without the image being rendered again.
- Answer 404 for an unknown card, 400 for an unknown `format`, and 422 when the stored number cannot be drawn as its barcode type.
- Add the ZXing dependency to `apps/api/pom.xml`.

Out of scope: choosing image size, colours or margins, rendering a barcode for a number that is not stored on a card (for example a preview while adding a card), scanning (CC-15), and long-lived or shared caching (`max-age`, CDN), which wait for auth and PWA caching decisions.

## Capabilities

### New Capabilities
- `card-barcode-api`: how clients fetch a card's barcode image over HTTP: formats, supported barcode types, caching headers and error behaviour.

### Modified Capabilities
<!-- None. Errors reuse the problem format from `api-error-handling`; the card itself is unchanged. -->

## Impact

- Contract: `libs/api-contract/openapi.yaml` (new path, `format` parameter, `422` response); the generated Java interface and TypeScript client gain a `getCardBarcode` operation automatically.
- New: a barcode service and an image-format enum in `com.ccards.api.service`, a not-renderable exception, a controller method on `CardController`, plus tests.
- Changed: `GlobalExceptionHandler` (one handler method), `apps/api/pom.xml` (ZXing), `README.md` where endpoints are listed.
- No database migration and no change to existing endpoints.
