# Proposal

## Why

`LoyaltyCard` can be stored (CC-08), but nothing exposes it over HTTP, so the web app has nothing to show. A read-only list and detail endpoint is the smallest slice that makes the stack end to end (controller → service → repository) and gives the contract its first real resource, before write endpoints (CC-10) are added.

## What Changes

- Add `GET /api/cards` (paginated with `page` and `size`) and `GET /api/cards/{id}` to the OpenAPI contract, with `Card` and `CardPage` schemas and the shared `BadRequest` / `NotFound` problem responses.
- Add a `CardController` implementing the generated `CardsApi` interface, a `CardService` (read-only transactions) and a `CardNotFoundException`.
- Map `LoyaltyCard` entities to the generated `Card` DTO with a MapStruct mapper, so entities never reach the wire (`ownerId` is not exposed).
- Map `CardNotFoundException` to a 404 `application/problem+json` response in the existing `GlobalExceptionHandler`.
- Add `@WebMvcTest` tests for the controller (service mocked) and a unit test for the mapper.
- Add the `mapstruct` dependency and annotation processor to `apps/api/pom.xml`.

Out of scope: create/update/delete (CC-10), filtering by owner or any authentication (users arrive with CC-16, so for now the list returns all cards), search and custom sorting, web UI that consumes the endpoints.

## Capabilities

### New Capabilities
- `loyalty-card-api`: how clients read loyalty cards over HTTP: the paginated list, the detail by id, the card representation and the not-found behavior.

### Modified Capabilities
<!-- None. The 404 problem format is already required by `api-error-handling`; this change only reuses it. -->

## Impact

- Contract: `libs/api-contract/openapi.yaml` (new paths and schemas); the generated Java interfaces and the TypeScript client gain `CardsApi` / `Card` / `CardPage` automatically.
- New: `CardController`, `CardService`, `CardNotFoundException`, `CardMapper` under `apps/api/src/main/java/com/ccards/api/`, plus tests.
- Changed: `GlobalExceptionHandler` (one handler method), `apps/api/pom.xml` (MapStruct), `README.md` if it lists endpoints.
- No database migration: the `loyalty_card` table from CC-08 is used as is.
