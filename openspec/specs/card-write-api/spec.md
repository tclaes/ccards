# card-write-api Specification

## Purpose
Lets clients create, partially update and delete loyalty cards over HTTP, and protects cards from silent lost updates when two clients edit the same card.

## Requirements

### Requirement: Create a card
The API SHALL accept `POST /api/cards` with `name`, `store`, `cardNumber`, `barcodeType` and optional `color` and `note`, store the card and respond 201 with the stored card (including `id` and `version`) and a `Location` header pointing to `/api/cards/{id}`.

#### Scenario: Valid card
- **WHEN** a client posts a card with all required fields and a valid number for its barcode type
- **THEN** the response is 201, the body contains the generated `id` and `version`, and `Location` ends with `/api/cards/{id}`

#### Scenario: Missing required fields
- **WHEN** a client posts a card without `name` and without `store`
- **THEN** the response is 400 and `errors` contains an entry for each of the two fields

#### Scenario: Field too long
- **WHEN** a client posts a `name` longer than 100 characters
- **THEN** the response is 400 and `errors` names `name`

#### Scenario: Owner cannot be chosen by the client
- **WHEN** a client includes an `ownerId` in the request body
- **THEN** the field is ignored and the card is stored with the server-assigned owner

### Requirement: Partially update a card
The API SHALL accept `PATCH /api/cards/{id}` with content type `application/merge-patch+json` (RFC 7396) and a `version`. Fields present in the body are changed, absent fields are kept, and a `null` clears an optional field (`color`, `note`). The API SHALL respond 200 with the updated card and its new `version`.

#### Scenario: Valid partial update
- **WHEN** a client patches only `name` together with the version it last read
- **THEN** the response is 200, `name` has the new value, all other fields are unchanged and `version` is higher

#### Scenario: Null clears an optional field
- **WHEN** a client patches `note` to `null`
- **THEN** the response is 200 and the card has no `note`

#### Scenario: Null on a required field
- **WHEN** a client patches `name` to `null`
- **THEN** the response is 400 and `errors` names `name`

#### Scenario: Unknown field
- **WHEN** a client patches a field that is not part of a card (for example `ownerId`)
- **THEN** the response is 400 and `errors` names that field

#### Scenario: Unsupported media type
- **WHEN** a client sends a PATCH with content type `application/json`
- **THEN** the response is 415 as a problem response

#### Scenario: Unknown id
- **WHEN** a client patches an id that does not exist
- **THEN** the response is 404 as a problem response

#### Scenario: Invalid update
- **WHEN** a client patches a value that fails validation, or a change that makes the merged card invalid (for example `barcodeType` to `EAN_13` while the stored number is not a valid EAN-13)
- **THEN** the response is 400 with `errors` and the stored card is unchanged

### Requirement: Concurrent edits are detected
The API SHALL reject a `PATCH` whose `version` differs from the stored version with 409, and SHALL leave the stored card unchanged.

#### Scenario: Stale version
- **WHEN** two clients read the same card and both patch the card, the second one still sending the original version
- **THEN** the first patch succeeds with 200 and the second gets 409 as a problem response

#### Scenario: Missing version
- **WHEN** a client patches without `version`
- **THEN** the response is 400 and `errors` names `version`

### Requirement: Delete a card
The API SHALL accept `DELETE /api/cards/{id}` and respond 204 with no body when the card existed and is now removed.

#### Scenario: Existing card
- **WHEN** a client deletes an existing card
- **THEN** the response is 204 and the card no longer exists in the database

#### Scenario: Unknown id
- **WHEN** a client deletes an id that does not exist
- **THEN** the response is 404 as a problem response

### Requirement: Write operations are atomic
Each write request SHALL either fully succeed or leave the stored data unchanged.

#### Scenario: Failure rolls back
- **WHEN** storing a card fails after the request has been validated
- **THEN** no partial change is stored and the client receives a problem response

### Requirement: The write endpoints are part of the API contract
The OpenAPI contract SHALL describe the three operations, their request and response schemas and the 400, 404 and 409 responses, so generated backend interfaces and the web client expose them.

#### Scenario: Contract describes the endpoints
- **WHEN** a developer opens the contract
- **THEN** it defines `POST /api/cards`, `PATCH /api/cards/{id}` and `DELETE /api/cards/{id}` with their success and problem responses
