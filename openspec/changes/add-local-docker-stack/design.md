# Design

## Context

CC-02 delivers `apps/api` (Spring Boot 4.x, Java 21, Maven wrapper, Nx `run-commands` targets) with `application.yml`, an Actuator health endpoint at `/api/health` that must return exactly `{"status":"UP"}` (details hidden), and tests that boot the app. It has no datasource or mail dependency. The CC-02 change is not yet merged; this design assumes it is. See proposal.md for motivation.

Spring Boot fails at startup when `spring-boot-starter-jdbc` is on the classpath but no datasource URL is configured and no embedded DB exists, and the mail health contributor and DB health contributor affect the aggregate health status. Both matter because the default profile must stay infrastructure-free.

## Goals / Non-Goals

**Goals:**
- One command (`docker compose up`) gives a working PostgreSQL + Mailpit.
- `local` profile connects to them; default profile and `nx test api` are unaffected.
- Show how Spring profiles and datasource configuration fit together (the story's learning goal).

**Non-Goals:**
- JPA, Flyway/Liquibase, schema, or entities.
- Mail-sending code.
- Testcontainers or CI database; production configuration.
- Nx targets wrapping `docker compose`.

## Decisions

1. **Compose file in `apps/api/compose.yaml`.** Chosen by the user: infra lives next to the only consumer. Alternative: repo root (visible to future services) - rejected for now; moving is cheap later. Compose runs from `apps/api`, so the project name defaults to `api`; set `name: ccards` in the file for clearer container/volume names.

2. **Images and versions pinned to a major tag**: `postgres:17` (or current stable at apply time, verified) and `axllent/mailpit` pinned to a version tag, not `latest`. Named volume `ccards-postgres-data`. PostgreSQL gets a `pg_isready` healthcheck.

3. **Ports bound to loopback**: `127.0.0.1:5432:5432` (PostgreSQL), `127.0.0.1:1025:1025` (SMTP), `127.0.0.1:8025:8025` (Mailpit UI). Ports, DB name, user and password are overridable via compose variable substitution with defaults (`${POSTGRES_PORT:-5432}` etc.), so no `.env` is needed; `.env.example` documents the variables. Alternative: required `.env` - rejected, it adds a setup step for no gain with dev-only credentials.

4. **Default credentials** `ccards` / `ccards` / database `ccards`. Dev only; documented as such.

5. **Datasource config only in `application-local.yml`.** It reads `DB_URL`/`DB_USER`/`DB_PASSWORD` style environment overrides with defaults matching compose, so the `local` profile works with zero setup but follows a custom `.env` if the developer exports it. Alternative: put a datasource in `application.yml` - rejected because the default profile would then need a database.

6. **Keep the default profile database-free by excluding DataSource auto-configuration there** (`spring.autoconfigure.exclude` for `DataSourceAutoConfiguration` and its health contributor config in `application.yml`), and re-enable in `application-local.yml` by overriding the exclude list with an empty value. Alternatives: (a) `spring.profiles.default: local` - rejected, tests would need a DB; (b) an embedded H2 for the default profile - rejected, extra dependency and different SQL behavior than PostgreSQL; (c) split into a separate Maven profile/dependency scope - rejected, over-engineered. The exact property syntax is verified during apply (see task 3); fall back to `@Profile`-guarded configuration if list override does not behave.

7. **Mail**: `spring-boot-starter-mail` with `spring.mail.host=localhost`, `port=1025` in the local profile only. Mail health contributor stays disabled (`management.health.mail.enabled=false`) so a missing SMTP server never turns `/api/health` DOWN; health keeps reflecting only the database. This also keeps the CC-02 requirement that health exposes no component details.

8. **Nx**: add a `serve` configuration `local` in `apps/api/project.json` that sets `SPRING_PROFILES_ACTIVE=local` (`nx serve api --configuration=local`). Default `serve` is unchanged, so CC-02's behavior holds.

9. **Tests**: keep CC-02's health test on the default profile (proves default needs no DB). Add a test with `@ActiveProfiles("local")` that asserts the `local` profile loads the expected datasource URL and mail host/port, without opening a connection (no Docker in unit tests). A real connection check is a manual/scripted verification task against the running stack.

## Risks / Trade-offs

- [CC-02 not merged yet; file paths or property names may differ] → Re-read `apps/api` at apply time and adjust; tasks reference files by role.
- [Auto-configuration exclusion/override behaves differently in Boot 4] → Verify with the default-profile test and a `local` run; fallback in decision 6.
- [Port 5432 conflicts with a local PostgreSQL] → Ports overridable via env; README troubleshooting line.
- [Dev credentials committed] → Loopback-only binding, labeled dev-only, no real secrets.
- [Health DOWN in `local` when DB is stopped] → Intended; documented. Non-local behavior unchanged.
