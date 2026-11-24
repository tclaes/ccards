# Design

## Context

- `apps/api` is Spring Boot 4.2 / Java 21 / Maven. `application.yml` excludes `DataSourceAutoConfiguration` so the default profile and `nx test api` need no database; `application-local.yml` clears that exclusion and points at the compose PostgreSQL (CC-03).
- `pom.xml` has `spring-boot-starter-jdbc` and the PostgreSQL driver, but no JPA and no Flyway. There are no entities and no tables yet.
- `LocalProfileTests` boots the `local` profile and asserts a `DataSource` bean exists **without opening a connection**, so it currently passes without Docker. Once Flyway is on the classpath it migrates at context startup and would fail without a database.
- Spring Boot 4 splits auto-configuration into modules, so Flyway and JPA are enabled through their own starters (`spring-boot-starter-flyway`, `spring-boot-starter-data-jpa`), not just by adding the library. Exact artifact names are confirmed against the Boot 4.2 BOM when applying.

## Goals / Non-Goals

**Goals:**
- Versioned SQL migrations applied automatically at startup in `local`, with `V1__init.sql` as the first.
- Hibernate set to `validate`, so the schema has exactly one author: the migrations.
- Default profile and `nx test api` remain Docker-free.

**Non-Goals:**
- Any real table or entity, repeatable migrations, undo migrations, CI/production database handling.

## Decisions

### D1. Flyway over Liquibase
Flyway migrations are plain SQL files named `V<n>__<description>.sql`, which matches the learning goal (see the actual DDL, no XML/YAML abstraction) and is the Spring Boot default integration. Liquibase's changelog formats and rollback features add concepts we do not need yet. *Alternative: Liquibase* — rejected for the extra abstraction.

### D2. `ddl-auto=validate` set in `application.yml`, not only in `local`
The setting is a project rule ("never `update`"), so it lives in the shared config where no profile can silently override it. It is harmless in the default profile because JPA does not initialise without a `DataSource`. *Alternative: only in `application-local.yml`* — rejected, a future `prod` profile could forget it.

### D3. `V1__init.sql` is an empty baseline
There is no domain model until CC-08, and inventing a placeholder table would leave a table to remove later. `V1__init.sql` contains only a comment explaining that it establishes the migration history. Flyway still records it (version 1, success), which satisfies "first migration runs at startup" and gives the first real migration a stable `V2`. *Alternative: seed a throwaway table* — rejected as dead schema. *Alternative: start numbering at the first real table* — rejected, the issue asks for `V1__init.sql`.

### D4. Default profile keeps its `DataSource` exclusion
Flyway and JPA auto-configurations back off when no `DataSource` bean exists, so no new exclusions are needed. `DefaultProfileTests` guards this and must keep passing.

### D5. Migration test uses Testcontainers, skipped without Docker
`LocalProfileTests` is changed to set `spring.flyway.enabled=false` (it only checks wiring). A new `FlywayMigrationTests` starts a PostgreSQL Testcontainer, runs the real migrations and asserts the history table contains `V1` with `success = true`, plus a `validate` startup check. It uses `@Testcontainers(disabledWithoutDocker = true)` so `nx test api` still passes on a machine or CI step without Docker, while migrations are really exercised wherever Docker exists. *Alternative: test against the compose stack* — rejected, it depends on mutable local state. *Alternative: H2* — rejected, different SQL dialect than production PostgreSQL. *Alternative: make Docker mandatory for tests* — rejected, it breaks the CC-03 guarantee.

### D6. Migration location and naming
Default Flyway location `classpath:db/migration`; names `V<n>__<snake_case>.sql`. No config needed, which keeps the convention discoverable. `baseline-on-migrate` stays off: every database is created by Flyway from empty.

## Risks / Trade-offs

- **Test silently skipped without Docker** → the skip is visible in the surefire report, and CC-06 (CI) is expected to run with Docker; noted in the README.
- **Testcontainers + Spring Boot 4 version coupling** → use the Boot-managed `spring-boot-testcontainers` and Testcontainers versions from the BOM; if the BOM does not manage them, pin and note it in the task.
- **`local` now needs a reachable database at startup (migrations)** → already true for datasource use; README keeps the "start the stack first" instruction and the failure message is Flyway's connection error.
- **An empty baseline proves little about real SQL** → covered by the history assertion and the failing-migration scenario in tests; real DDL arrives with CC-08.

## Migration Plan

1. Developer starts the compose stack and `nx serve api --configuration=local`; Flyway applies `V1` to the empty database.
2. Existing local databases from CC-03 are empty, so no baselining is needed. Reset with `docker compose down -v` if a local schema gets into a bad state.
3. Rollback: revert the change; the `flyway_schema_history` table is dropped with `down -v` locally. There is no shared/production database yet.
