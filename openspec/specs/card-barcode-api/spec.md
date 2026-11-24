# card-barcode-api Specification

## Purpose
Defines how clients fetch the barcode of a stored loyalty card as an image, so it can be shown and scanned at a checkout, and how clients can cache that image.

## Requirements

### Requirement: Fetch a card's barcode as an image
`GET /api/cards/{id}/barcode` SHALL return the card's `cardNumber` drawn as a barcode of the card's `barcodeType`. The `format` query parameter SHALL select `png` (`image/png`, the default) or `svg` (`image/svg+xml`). The response body SHALL be the image only. EAN-13, EAN-8, UPC-A, Code 128 and QR code SHALL all be supported.

#### Scenario: PNG by default
- **WHEN** a client requests the barcode of an existing card without a `format`
- **THEN** the response is 200 with content type `image/png` and the body is a PNG image

#### Scenario: SVG
- **WHEN** a client requests the barcode of an existing card with `format=svg`
- **THEN** the response is 200 with content type `image/svg+xml` and the body is an SVG image

#### Scenario: Image encodes the card number
- **WHEN** a client requests the PNG barcode of a card for each of the five barcode types
- **THEN** reading the image with a barcode reader returns the card's `cardNumber` in the card's barcode type

#### Scenario: Unknown card
- **WHEN** a client requests the barcode of an id that does not exist
- **THEN** the response is 404 as a problem response

#### Scenario: Unknown format
- **WHEN** a client requests `format=gif`
- **THEN** the response is 400 as a problem response

#### Scenario: Number cannot be drawn
- **WHEN** a card's number contains characters its barcode type cannot encode (for example a non-ASCII character in a Code 128 card)
- **THEN** the response is 422 as a problem response and no image is returned

### Requirement: Barcode responses are cacheable and revalidatable
Every successful barcode response SHALL carry an `ETag` that changes whenever the card or the requested format changes, and a `Cache-Control` header that lets a client store the image but requires it to revalidate before reuse. A request whose `If-None-Match` matches the current `ETag` SHALL be answered with 304 and no body.

#### Scenario: ETag and Cache-Control present
- **WHEN** a client requests a card's barcode
- **THEN** the 200 response has an `ETag` header and a `Cache-Control` header that contains `no-cache`

#### Scenario: Unchanged card
- **WHEN** a client repeats the request with the `ETag` it received in `If-None-Match`
- **THEN** the response is 304 with an empty body and the same `ETag`

#### Scenario: Card edited
- **WHEN** a card's number is changed and a client repeats the request with the old `ETag`
- **THEN** the response is 200 with a new `ETag` and an image of the new number

#### Scenario: Different format, different ETag
- **WHEN** a client requests the same card as `png` and as `svg`
- **THEN** the two responses have different `ETag` values
