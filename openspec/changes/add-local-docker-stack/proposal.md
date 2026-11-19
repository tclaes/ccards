# Proposal

## Why

Epic 0 needs a repeatable local environment before any persistence or email feature (later stories) can be built. Today the backend (CC-02) has no database and no mail server to talk to, so developers would each have to install and configure PostgreSQL and an SMTP sink by hand. One `docker compose up` removes that setup and gives the backend a defined `local` Spring profile to connect with.

## What Changes

- Add a Docker Compose file in `apps/api` that starts PostgreSQL and Mailpit with fixed local ports, a named volume for database data and a health check on PostgreSQL.
- Add `.env.example` with the local credentials/ports the compose file and the `local` profile share; the real `.env` is git-ignored.
- Add a Spring `local` profile (`application-local.yml`) that configures the datasource for the compose PostgreSQL and the SMTP host/port for Mailpit.
- Add the JDBC starter and PostgreSQL driver, and the Spring mail starter, to the backend. The default profile (and `nx test api`) keeps working without a database or mail server running.
- With the `local` profile active, the existing health endpoint also reflects database connectivity.
- Add an Nx `serve` configuration `local` so `nx serve api --configuration=local` starts the backend with the `local` profile.
- Document the local stack (start, stop, reset, ports, UIs) in the README.

Out of scope: JPA/Hibernate, Flyway or any schema, sending mail from code, production/CI database setup, compose Nx targets (`docker compose` is run directly).

## Capabilities

### New Capabilities
- `local-dev-stack`: the local PostgreSQL + Mailpit stack started via Docker Compose, and the `local` backend profile that connects to it.

### Modified Capabilities
<!-- None in main specs. This change builds on the `api-service` capability from CC-02 (change `add-spring-boot-api`, not yet archived) and keeps all of its requirements true under the default profile; it does not modify them. -->

## Impact

- New: `apps/api/compose.yaml`, `apps/api/.env.example`, `apps/api/src/main/resources/application-local.yml`.
- Changed: `apps/api/pom.xml` (JDBC, PostgreSQL driver, mail starter, datasource handling in default profile), `apps/api/src/main/resources/application.yml`, `apps/api/project.json` (`local` serve configuration), `.gitignore`, `README.md`, backend tests.
- Requires Docker (with Compose v2) on the developer machine; JDK 21 as before.
- Dependency: assumes CC-02 (`apps/api`, `/api/health`, Nx `serve`/`build`/`test`) is merged to `main` before this change is applied.
