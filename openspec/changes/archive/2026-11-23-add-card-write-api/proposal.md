# Proposal

## Why

The backend stores loyalty cards (CC-08) but offers no way to create, change or delete them over HTTP, so neither the web app nor any other client can manage cards. Card numbers are barcode data: an invalid EAN-13 produces a barcode that no scanner accepts, so it must be rejected on the way in. Two clients editing the same card must not silently overwrite each other.

## What Changes

- Add `POST /api/cards`, `PATCH /api/cards/{id}` (JSON Merge Patch, RFC 7396, content type `application/merge-patch+json`) and `DELETE /api/cards/{id}` to the OpenAPI contract (CC-05) and implement them (controller -> service -> repository).
- Validate request bodies with Bean Validation (required fields, maximum lengths matching the database columns); violations are returned as the existing validation problem (400 with `errors`).
- Validate `cardNumber` against `barcodeType` with a custom constraint: EAN-13, EAN-8 and UPC-A need the right length, digits only and a correct check digit; CODE_128 and QR_CODE accept any non-blank text.
- Add optimistic locking: a `version` column (migration `V3`) and `@Version` on `LoyaltyCard`. `PATCH` carries the `version` the client last saw; a stale version gives 409 as a problem response.
- Service methods are `@Transactional`; `PATCH` and `DELETE` of an unknown id return 404 (problem).
- **BREAKING (internal only)**: `LoyaltyCard` gains a `version` field; nothing outside the API reads the entity yet.

Issue #10 names `PUT` for updates; this change deliberately provides `PATCH` (JSON Merge Patch) instead, as decided with the issue owner, and does not add `PUT`.

Out of scope: `GET` list/detail and DTO mapping libraries (CC-09), authentication and real ownership checks (CC-16, CC-19), sharing (CC-29/CC-30), barcode rendering (CC-13), web UI.

Assumption: until users exist (CC-16), `POST` assigns cards to a fixed placeholder owner id taken from configuration; `ownerId` is never accepted from the client.

## Capabilities

### New Capabilities
- `card-write-api`: creating, partially updating and deleting loyalty cards over HTTP, including optimistic locking and the status codes returned.
- `card-number-validation`: when a card number is acceptable for a given barcode type.

### Modified Capabilities
- `api-error-handling`: adds the 409 conflict case to the problem-details rules.

## Impact

- Contract: `libs/api-contract/openapi.yaml` (new `/api/cards` paths, `Card`/`CardInput` schemas, `Conflict` response); generated Java interfaces and TypeScript client change accordingly.
- API code: new controller, service, `@CardNumber`-style constraint + validator, `GlobalExceptionHandler` (409 mapping), `LoyaltyCard` (`@Version`), migration `V3__add_loyalty_card_version.sql`, placeholder-owner config.
- Tests: validator unit tests, service/repository tests (Testcontainers), `@WebMvcTest` controller tests, a concurrency/conflict test; `FlywayMigrationTests` updated for three migrations.
- No new dependencies expected (`spring-boot-starter-validation` to be confirmed in `pom.xml`).
