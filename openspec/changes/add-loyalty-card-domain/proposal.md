# Proposal

## Why

The backend has migrations (CC-04) but no domain data yet. Every card feature that follows (REST API CC-09/CC-10, barcode rendering CC-13, ownership checks CC-19) needs a stored `LoyaltyCard`. Settling the data model now, with ownership as a separate field, keeps later sharing (CC-29/CC-30) from forcing a schema rewrite.

## What Changes

- Add the `LoyaltyCard` JPA entity with: `id` (UUID), `name`, `store`, `cardNumber`, `barcodeType` (enum), `color`, `note`, `createdAt`, `updatedAt` and `ownerId`.
- Add migration `V2__create_loyalty_card.sql` creating the `loyalty_card` table (the empty `V1` baseline stays untouched).
- Add `LoyaltyCardRepository` (Spring Data `JpaRepository`) with a lookup of cards by owner.
- Turn on JPA auditing so `createdAt` and `updatedAt` are filled automatically.
- Add `@DataJpaTest` tests against a real PostgreSQL via Testcontainers (skipped without Docker, like the existing migration tests).
- Update `FlywayMigrationTests`, which currently asserts exactly one migration.

Out of scope: REST endpoints and contract changes (CC-09, CC-10), the users table and a foreign key on `ownerId` (CC-16), sharing/households (CC-29, CC-30), categories, barcode generation (CC-13).

## Capabilities

### New Capabilities
- `loyalty-card-persistence`: how a loyalty card and its owner are stored and retrieved, including the audit timestamps and the constraints the database enforces.

### Modified Capabilities
<!-- None. `database-migrations` (add-flyway-migrations, not yet archived) is unchanged; V2 simply follows its rules. -->

## Impact

- New: `LoyaltyCard`, `BarcodeType`, `LoyaltyCardRepository` and an auditing config in `apps/api/src/main/java/com/ccards/api/`, `db/migration/V2__create_loyalty_card.sql`, a repository test.
- Changed: `FlywayMigrationTests` (history now has two entries), `README.md` (data model note).
- No API, contract or web changes; no new dependencies (JPA and Testcontainers are already in `pom.xml`).
