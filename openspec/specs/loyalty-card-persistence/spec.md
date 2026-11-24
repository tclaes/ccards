# loyalty-card-persistence Specification

## Purpose
Defines how loyalty cards are stored: which data a card holds, who owns it, and which rules the database enforces. Later features (API, sharing) build on this storage.

## Requirements

### Requirement: A loyalty card is stored with its details
The system SHALL persist a loyalty card with a generated UUID `id`, a `name`, a `store`, a `cardNumber`, a `barcodeType`, an optional `color`, an optional `note` and an `ownerId`.

#### Scenario: Save and read back a card
- **WHEN** a card with all fields is saved and then loaded by its id
- **THEN** every field has the saved value and the id is a UUID assigned by the system

#### Scenario: Optional fields may be empty
- **WHEN** a card is saved without `color` and `note`
- **THEN** the save succeeds and both fields are empty when loaded

### Requirement: Required fields are enforced by the database
The database SHALL reject a card that has no `name`, `store`, `cardNumber`, `barcodeType` or `ownerId`, and SHALL reject a `barcodeType` that is not one of the supported types.

#### Scenario: Missing required field
- **WHEN** a card is saved without a `cardNumber`
- **THEN** the save fails with a constraint violation and nothing is stored

#### Scenario: Unknown barcode type
- **WHEN** a row with a `barcodeType` outside the supported types is inserted directly with SQL
- **THEN** the database rejects it

### Requirement: Supported barcode types
The system SHALL support the barcode types `CODE_128`, `EAN_13`, `EAN_8`, `UPC_A` and `QR_CODE`, stored by name so that adding a type later does not change existing rows.

#### Scenario: Each type round-trips
- **WHEN** a card is saved for each supported barcode type
- **THEN** each loads back with the same type

### Requirement: Audit timestamps are maintained automatically
The system SHALL set `createdAt` when a card is first saved and `updatedAt` on every save, without callers providing them. `createdAt` MUST NOT change on later saves.

#### Scenario: Timestamps on create
- **WHEN** a new card is saved
- **THEN** `createdAt` and `updatedAt` are set and equal

#### Scenario: Timestamps on update
- **WHEN** an existing card is changed and saved again
- **THEN** `updatedAt` moves forward and `createdAt` keeps its original value

### Requirement: Cards are looked up by owner
The system SHALL return the cards belonging to a given `ownerId`, and only those. Ownership is a plain identifier on the card; the card does not depend on a user record or on a one-to-one link with its owner.

#### Scenario: Only the owner's cards are returned
- **GIVEN** cards owned by owner A and owner B
- **WHEN** the cards of owner A are requested
- **THEN** only owner A's cards are returned

#### Scenario: Owner without cards
- **WHEN** the cards of an owner with no cards are requested
- **THEN** the result is empty

### Requirement: Schema is created by a versioned migration
The `loyalty_card` table SHALL be created by migration `V2` and match the entity, so that startup validation passes on a database built from the migrations alone.

#### Scenario: Application starts on a migrated database
- **WHEN** the application starts against an empty PostgreSQL
- **THEN** migrations `V1` and `V2` are applied and schema validation succeeds
