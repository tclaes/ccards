# Tasks

Prerequisite: CC-03 (`apps/api/compose.yaml`, `application-local.yml`) is on the base branch.

## 1. Dependencies and configuration

- [x] 1.1 Add Flyway (Boot starter + `flyway-database-postgresql`), `spring-boot-starter-data-jpa`, and test dependencies (`spring-boot-testcontainers`, Testcontainers PostgreSQL + JUnit) to `apps/api/pom.xml`, using BOM-managed versions where available; verify `./mvnw -B compile` succeeds
- [x] 1.2 Set `spring.jpa.hibernate.ddl-auto: validate` in `application.yml` with a short comment on why `update` is never used; verify `grep -r "ddl-auto" apps/api/src` shows only `validate`
- [x] 1.3 Add `src/main/resources/db/migration/V1__init.sql` (comment-only baseline per design D3); verify the file is picked up by the build (`apps/api/target/classes/db/migration/V1__init.sql` exists after `./mvnw -B package -DskipTests`)

## 2. Tests

- [x] 2.1 Set `spring.flyway.enabled=false` in `LocalProfileTests` so it stays a no-Docker wiring test; verify it passes with the compose stack stopped
- [x] 2.2 Add `FlywayMigrationTests` using a PostgreSQL Testcontainer (`disabledWithoutDocker = true`) that starts the app with the migrations and asserts `flyway_schema_history` has version `1` with `success = true` and that a second startup applies nothing; verify it passes with Docker running and is reported as skipped (not failed) with Docker stopped
- [x] 2.3 Add a test (same container) proving an entity mapped to a non-existent table fails startup with a validation error and leaves the schema unchanged (spec: The ORM never changes the schema); verify it fails startup as expected
- [x] 2.4 Confirm `DefaultProfileTests` and `HealthEndpointTests` still pass with no database running (spec: Default profile stays database-free); verify `npx nx test api` is green with Docker stopped

## 3. End-to-end verification and docs

- [x] 3.1 With a fresh stack (`docker compose down -v && docker compose up -d`), run `npx nx serve api --configuration=local`; verify the log shows `V1__init.sql` applied, `psql` shows `flyway_schema_history` with one successful row, and `GET /api/health` returns `{"status":"UP"}`
- [x] 3.2 Restart the API and verify no migration is re-applied; then append a character to `V1__init.sql` and verify startup fails with a checksum mismatch naming `V1`; revert the edit
- [x] 3.3 Document in `README.md`: migration location and naming, "never edit an applied migration, add a new `V<n>`", local reset (`docker compose down -v`), and why `ddl-auto=update` is not used; verify by following the README from a clean state
- [x] 3.4 Run `openspec validate add-flyway-migrations --strict`, `npx nx test api`, `npx nx lint web` and `npm run format:check`; verify all pass
