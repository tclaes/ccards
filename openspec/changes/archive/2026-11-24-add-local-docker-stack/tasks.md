# Tasks

Prerequisite: CC-02 (`apps/api` with `/api/health`, Nx `serve`/`build`/`test`) is merged into the base branch. Re-check file paths against the merged code first.

## 1. Compose stack

- [x] 1.1 Add `apps/api/compose.yaml` with `postgres` (pinned tag, named volume, `pg_isready` healthcheck) and `mailpit` (pinned tag), loopback-bound ports and `${VAR:-default}` substitution; verify with `docker compose -f apps/api/compose.yaml config` and `docker compose up -d` showing both services running and PostgreSQL `healthy`
- [x] 1.2 Add `apps/api/.env.example` documenting the variables and add `apps/api/.env` to `.gitignore`; verify `cp .env.example .env && git status` does not list `.env` and the stack still starts
- [x] 1.3 Verify persistence and reset: create a table via `psql`, `docker compose down` + `up -d` keeps it, `down -v` empties the DB; verify Mailpit UI answers on its port and that the DB port is refused from a non-loopback address (`lsof`/`docker compose ps` shows `127.0.0.1` binding)

## 2. Backend dependencies and profiles

- [x] 2.1 Add `spring-boot-starter-jdbc`, the PostgreSQL driver and `spring-boot-starter-mail` to `apps/api/pom.xml`; verify `./mvnw -B compile` succeeds
- [x] 2.2 Configure the default profile in `application.yml` to start without a datasource and without mail health (spec: Default profile needs no infrastructure); verify `nx test api` passes with the stack stopped and the existing health test still returns exactly `{"status":"UP"}`
- [x] 2.3 Add `application-local.yml` with datasource (URL/user/password from env with compose defaults) and `spring.mail` host/port for Mailpit, re-enabling the datasource auto-configuration; add an `@ActiveProfiles("local")` test asserting the datasource URL and mail host/port, and verify `nx test api` passes without Docker
- [x] 2.4 Add the `local` configuration to the `serve` target in `apps/api/project.json` (`SPRING_PROFILES_ACTIVE=local`); verify `nx serve api` (default) still starts without Docker and `nx serve api --configuration=local` starts against the running stack

## 3. End-to-end verification

- [x] 3.1 With the stack up, run `nx serve api --configuration=local` and verify `GET /api/health` returns 200 `{"status":"UP"}`; stop PostgreSQL and verify health is not UP; verify `/api/health` shows no component details
- [x] 3.2 Send a test mail to `localhost:1025` (e.g. `curl --url smtp://localhost:1025 --mail-from a@b.test --mail-rcpt c@d.test -T <(printf 'Subject: t\n\nhi')`) and verify it appears in the Mailpit UI
- [x] 3.3 Document the local stack in `README.md` (start/stop/reset, ports, credentials, Mailpit UI, `--configuration=local`, port-conflict hint) and verify by following only the README from a clean state (`down -v`, fresh `.env`) to a healthy backend
- [x] 3.4 Run `openspec validate add-local-docker-stack --strict`, `nx test api`, `nx lint web` and `npm run format:check`; verify all pass
