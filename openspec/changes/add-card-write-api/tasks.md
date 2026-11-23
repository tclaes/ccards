# Tasks

## 1. Contract

- [x] 1.1 Add `/api/cards` (POST) and `/api/cards/{id}` (PATCH as `application/merge-patch+json`, DELETE) with `Card`, `CardInput`, `CardPatch`, and a `Conflict` response to `libs/api-contract/openapi.yaml`; verify the contract lint/generation succeeds and the Java interface and TypeScript client are generated (`npx nx build api`, `npx nx build api-client`)

## 2. Card number validation

- [x] 2.1 Implement the GS1 check-digit helper and the class-level card number constraint + validator (digits, length, check digit per type; free text for `CODE_128`/`QR_CODE`; null type passes); verify unit tests cover every scenario in `card-number-validation`, including the example numbers

## 3. Persistence and optimistic locking

- [x] 3.1 Add `V3__add_loyalty_card_version.sql` and `@Version` on `LoyaltyCard`; update `FlywayMigrationTests` for three migrations; verify migrations apply on an empty PostgreSQL and `ddl-auto=validate` passes
- [x] 3.2 Verify with a repository test (Testcontainers) that two stale saves of the same card raise an optimistic locking failure and that `version` increases on update

## 4. Service and controller

- [x] 4.1 Add `CardService` (`@Transactional` create/patch/delete, version comparison, `CardNotFoundException`), the placeholder owner property, and the hand-written mapping; verify service tests cover create, patch (omitted field kept, null clears optional field, null on required field rejected, cross-field number check on merged state), stale version, not found, delete
- [x] 4.2 Implement the controller from the generated interface and map `CardNotFoundException` and the locking exceptions to 404/409 problems in `GlobalExceptionHandler`; verify `@WebMvcTest` tests cover 201 + `Location`, 200, 204, 400 (several fields, bad number, missing version), 404 and 409 with `application/problem+json`
- [x] 4.3 Add one end-to-end test against PostgreSQL covering the "two clients, second gets 409" scenario and rollback on failure; verify `npx nx test api` passes

## 5. Docs and wrap-up

- [x] 5.1 Document the endpoints, the version field, the placeholder owner and the validation rules in `README.md`; verify each documented request matches one exercised in `CardApiTests`
- [x] 5.2 Run `npx nx affected -t lint test build` and the closing checklist in `docs/CODING_STYLES.md`; verify all pass
