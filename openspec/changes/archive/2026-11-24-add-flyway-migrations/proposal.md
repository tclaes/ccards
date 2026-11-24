# Proposal

## Why

The backend now has a local PostgreSQL (CC-03) but no controlled way to create or change its schema. Every upcoming persistence story (LoyaltyCard, users, categories, ...) needs the schema to be versioned, reviewable and reproducible on every machine and environment. Setting this up before the first table exists means no story ever relies on `ddl-auto=update`, which silently alters schemas without a history and cannot be reviewed or rolled forward safely.

## What Changes

- Add Flyway to the backend so versioned SQL migrations in `src/main/resources/db/migration` run automatically at application startup whenever a database is configured (the `local` profile).
- Add a first baseline migration `V1__init.sql`. It creates no tables (there is no domain model yet; CC-08 adds the first one) and only establishes the migration history.
- Add JPA/Hibernate and set `spring.jpa.hibernate.ddl-auto=validate`, so Hibernate never creates or changes schema, and a mismatch between entities and the migrated schema fails startup.
- Keep the default profile database-free: no Flyway, no JPA initialisation, `nx test api` stays Docker-free.
- Add a migration test that starts a real PostgreSQL, runs Flyway and checks the history table; it is skipped when Docker is unavailable.
- Document the migration workflow (naming, never edit an applied migration, how to reset locally) and why `ddl-auto=update` is not used.

Out of scope: any domain table or entity (CC-08), repeatable migrations, CI database setup (CC-06), production migration strategy (CC-37).

## Capabilities

### New Capabilities
- `database-migrations`: schema changes are applied through versioned Flyway migrations at startup, and Hibernate only validates, never alters, the schema.

### Modified Capabilities
<!-- None. `local-dev-stack` (CC-03, change `add-local-docker-stack`, not yet archived) keeps all of its requirements; the `local` profile just gains migrations on startup. -->

## Impact

- New: `apps/api/src/main/resources/db/migration/V1__init.sql`, a migration integration test.
- Changed: `apps/api/pom.xml` (Flyway + its PostgreSQL module, Spring Data JPA, Testcontainers for tests), `apps/api/src/main/resources/application.yml` (`ddl-auto=validate`), `apps/api/src/test/.../LocalProfileTests.java` (must not require a running database once Flyway is on the classpath), `README.md`.
- With the `local` profile the API now requires the compose PostgreSQL to be running at startup, as it already did for datasource health; the migration runs on first start.
- Dependency: CC-03 (`apps/api/compose.yaml`, `local` profile) is merged on `main`.
