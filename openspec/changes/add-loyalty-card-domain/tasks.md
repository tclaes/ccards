# Tasks

## 1. Schema and entity

- [x] 1.1 Add `V2__create_loyalty_card.sql` (table, NOT NULL rules, `barcode_type` CHECK, `owner_id` index); verify with `FlywayMigrationTests` once updated in 1.3 that both `V1` and `V2` apply on an empty PostgreSQL
- [x] 1.2 Add `BarcodeType`, the `LoyaltyCard` entity (UUID id, enum as string, audit fields) and the auditing config class; verify the context starts with `ddl-auto=validate` on the migrated database and `DefaultProfileTests` still passes
- [x] 1.3 Update `FlywayMigrationTests` for two migrations (history size, edited-migration test still targets `V1`); verify `npx nx test api` passes

## 2. Repository and tests

- [x] 2.1 Add `LoyaltyCardRepository` with `findAllByOwnerId`; verify it compiles and is picked up by `@DataJpaTest`
- [x] 2.2 Add `LoyaltyCardRepositoryTests` (`@DataJpaTest`, Testcontainers PostgreSQL, skipped without Docker) covering the spec scenarios: save/read, optional fields, each barcode type, missing required field, unknown barcode type via SQL, created/updated timestamps, lookup by owner; verify `npx nx test api` passes with Docker running and skips cleanly without it

## 3. Docs and wrap-up

- [x] 3.1 Add a short data-model note to `README.md` (fields, ownership as a plain id, why no FK yet); verify it matches the migration
- [x] 3.2 Run `npx nx affected -t lint test build` and the closing checklist in `docs/CODING_STYLES.md`; verify all pass
