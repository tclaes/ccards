# loyalty-card-api Specification

## Purpose
Defines how clients read loyalty cards over HTTP: a paginated list, the detail of one card and the representation of a card. It is the read side of the card API; creating and changing cards is specified separately.

## Requirements

### Requirement: Cards can be listed page by page
`GET /api/cards` SHALL return one page of cards as JSON, ordered by card name (ascending, ties broken by id so the order is stable). The request SHALL accept `page` (zero-based, default 0) and `size` (default 20, between 1 and 100). The response SHALL contain the page's cards in `content` together with `page`, `size`, `totalElements` and `totalPages`.

#### Scenario: Default page
- **WHEN** a client requests `GET /api/cards` and 25 cards exist
- **THEN** the response is 200, `content` holds 20 cards, `page` is 0, `size` is 20, `totalElements` is 25 and `totalPages` is 2

#### Scenario: Second page
- **WHEN** a client requests `GET /api/cards?page=1&size=20` and 25 cards exist
- **THEN** `content` holds the remaining 5 cards and `page` is 1

#### Scenario: No cards
- **WHEN** a client requests `GET /api/cards` and no cards exist
- **THEN** the response is 200 with an empty `content`, `totalElements` 0 and `totalPages` 0

#### Scenario: Cards are ordered by name
- **WHEN** cards named "Delhaize", "Albert Heijn" and "Colruyt" exist and a client lists them
- **THEN** `content` is ordered "Albert Heijn", "Colruyt", "Delhaize"

#### Scenario: Invalid page parameters
- **WHEN** a client requests `GET /api/cards?size=0` or `?size=101` or `?page=-1`
- **THEN** the response is 400 `application/problem+json` and `errors` names the offending parameter

### Requirement: A single card can be fetched by id
`GET /api/cards/{id}` SHALL return the card with that id as JSON.

#### Scenario: Existing card
- **WHEN** a client requests `GET /api/cards/{id}` for a stored card
- **THEN** the response is 200 and the body is that card

#### Scenario: Unknown id
- **WHEN** a client requests `GET /api/cards/{id}` with a well-formed id for which no card exists
- **THEN** the response is 404 with content type `application/problem+json`, `status` 404 and an `instance` equal to the request path

#### Scenario: Malformed id
- **WHEN** a client requests `GET /api/cards/not-a-uuid`
- **THEN** the response is 400 with content type `application/problem+json`

### Requirement: A card is represented without internal fields
A card in a response SHALL contain `id`, `name`, `store`, `cardNumber`, `barcodeType`, `color`, `note`, `createdAt` and `updatedAt`. The response SHALL NOT contain the owner id or any other storage detail.

#### Scenario: Card fields
- **WHEN** a client fetches a card that has a color and a note
- **THEN** the body contains all of the listed fields with the stored values and `barcodeType` is one of `CODE_128`, `EAN_13`, `EAN_8`, `UPC_A`, `QR_CODE`

#### Scenario: Optional fields absent
- **WHEN** a client fetches a card that has no color and no note
- **THEN** the response is 200 and `color` and `note` are null or omitted

#### Scenario: Owner is not exposed
- **WHEN** a client fetches or lists any card
- **THEN** the body contains no `ownerId` field

### Requirement: The card endpoints are part of the API contract
The OpenAPI contract SHALL define both card operations, the `Card` and page schemas, and the 400, 404 and 500 problem responses, so the generated backend interface and web client expose them as types.

#### Scenario: Contract describes the card API
- **WHEN** a developer opens the contract
- **THEN** it defines `GET /api/cards` and `GET /api/cards/{id}` with their parameters, response schemas and problem responses

#### Scenario: Web client has the types
- **WHEN** the web client is generated from the contract
- **THEN** the card and card page types and the list and detail calls can be imported from the client library
