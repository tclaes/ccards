# Tasks

## 1. Contract and dependency

- [x] 1.1 Add `GET /api/cards/{id}/barcode` (`getCardBarcode`, `format` enum `png|svg` default `png`, `If-None-Match` header, binary `image/png` and `image/svg+xml` 200, 304, 400, 404, 422, 500) and the `Unprocessable` response component to `libs/api-contract/openapi.yaml`; verify `nx run api-contract:validate` passes and `getCardBarcode` appears in the generated `CardsApi` (`apps/api/target/generated-sources/openapi`) and in `libs/api-client` after `nx run api-client:codegen`
- [x] 1.2 Add `com.google.zxing:core` to `apps/api/pom.xml`; verify `./mvnw compile` in `apps/api` succeeds

## 2. Rendering service

- [x] 2.1 Add `ImageFormat`, `BarcodeNotRenderableException` and `BarcodeService` (all five types, PNG with whole-pixel module scale, SVG path from dark-module runs); verify `BarcodeServiceTests` pass: PNG round-trips through the ZXing reader for every barcode type, SVG is well-formed with a `viewBox`, a non-ASCII Code 128 number throws `BarcodeNotRenderableException`

## 3. Controller and error handling

- [x] 3.1 Add the `BarcodeNotRenderableException` handler (422 problem, generic detail, no card number in the body) to `GlobalExceptionHandler`; verify a test shows 422 `application/problem+json` with `status`, `detail` and `instance`
- [x] 3.2 Implement `getCardBarcode` in `CardController` (card lookup, `ETag` `"<version>-<format>"`, `If-None-Match` comparison before rendering, `Cache-Control: no-cache, private`, correct content type); verify `CardBarcodeControllerTests` pass for: default PNG, SVG, headers, 304 without calling the renderer, new ETag after a version change, different ETag per format, unknown id (404), `format=gif` and malformed uuid (400), and unrenderable number (422)
- [x] 3.3 Run the full API test suite (`npx nx test api`) and verify it stays green and Docker-free

## 4. Documentation and integration check

- [x] 4.1 Mention the barcode endpoint (formats, caching headers, 422) in `README.md` where endpoints are listed; verify the text matches the implemented path and parameters
- [x] 4.2 Run `npx nx affected -t lint test build` and verify it passes; with the `local` profile and a seeded card, verify `curl -i` on `/api/cards/{id}/barcode` and `?format=svg` return the images with `ETag`/`Cache-Control`, a repeat with `If-None-Match` returns 304, and a phone camera or barcode reader scans the PNG
