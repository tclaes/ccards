# card-usage Specification

## Purpose
Records every time a loyalty card is used at the till, as the basis for sorting cards by how often they are used.

## Requirements

### Requirement: Register a use of a card
The API SHALL provide `POST /api/cards/{id}/usage`, which increases the card's usage count by one, sets its last-used time to now and answers 204 without a body.

#### Scenario: First use
- **WHEN** a client posts to the usage endpoint of a card that has never been used
- **THEN** the response is 204, the usage count is 1 and the last-used time is set

#### Scenario: Repeated use
- **WHEN** a client posts to the usage endpoint of the same card three times
- **THEN** the usage count is 3 and the last-used time is that of the last post

#### Scenario: Unknown card
- **WHEN** a client posts to the usage endpoint of an id that does not exist
- **THEN** the response is 404 as a problem response and nothing is stored

#### Scenario: Invalid id
- **WHEN** a client posts to `/api/cards/not-a-uuid/usage`
- **THEN** the response is 400 as a problem response

### Requirement: Usage does not look like an edit
Registering a use SHALL NOT change the card's `version`, `updatedAt`, barcode ETag or any other card field.

#### Scenario: Card is unchanged by use
- **WHEN** a card is used and then fetched
- **THEN** its `version` and `updatedAt` equal the values from before the use

#### Scenario: Edit form still saves
- **WHEN** a user opens the edit form, the card is used, and the user saves
- **THEN** the save succeeds without a 409 conflict and the usage count is kept

### Requirement: Uses are counted exactly
Concurrent uses of one card SHALL all be counted, and a card edit SHALL NOT overwrite the usage count.

#### Scenario: Concurrent uses
- **WHEN** 20 clients register a use of the same card at the same time
- **THEN** the usage count afterwards is 20

#### Scenario: Edit after use
- **WHEN** a card is used and a client then patches its name with the version it read before the use
- **THEN** the patch succeeds and the usage count is still the one recorded

### Requirement: Usage is stored with the card
Each card SHALL have a usage count that starts at 0 for new and existing cards, and a last-used time that is empty until the first use. The `Card` response SHALL NOT contain them yet.

#### Scenario: New card
- **WHEN** a card is created
- **THEN** its usage count is 0 and its last-used time is empty

#### Scenario: Existing cards after migration
- **WHEN** the migration runs on a database with cards
- **THEN** every card has usage count 0 and no last-used time

### Requirement: The usage endpoint is part of the API contract
The OpenAPI contract SHALL describe `POST /api/cards/{id}/usage` with its 204, 400, 404 and 500 responses, so the generated backend interface and the web client expose it.

#### Scenario: Contract describes the endpoint
- **WHEN** a developer opens the contract
- **THEN** it defines `POST /api/cards/{id}/usage` with operation id `registerCardUsage`

### Requirement: Checkout registers a use
The checkout page SHALL register one use of the card when it is opened, and SHALL NOT let a failure of that call disturb the page.

#### Scenario: Opening the checkout
- **WHEN** the user opens the checkout page of a card
- **THEN** one request to the card's usage endpoint is made

#### Scenario: Registering fails
- **WHEN** the usage request fails (for example no network or a server error)
- **THEN** the barcode and number are still shown, no error notification or error state appears, and the failure is logged

#### Scenario: Not repeated while open
- **WHEN** the user stays on the checkout page, or retries a failed card load
- **THEN** no further usage request is made
