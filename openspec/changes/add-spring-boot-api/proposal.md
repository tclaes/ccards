# Proposal

## Why

The monorepo has only a front end (`apps/web`, from CC-01). Every backend issue (domain model, card REST API, barcodes, auth) needs a running Java service to build on. Issue #2 (CC-02, Epic 0 – Fundament) asks for that service: a Spring Boot backend in `apps/api`, driven through the same Nx commands as the web app, with a health endpoint to show it is up.

## What Changes

- Add `apps/api`: a Spring Boot 4.2 application on Java 21, built with Maven through the Maven Wrapper (`mvnw`), so no global Maven install is needed.
  - The issue text says "Spring Boot 3". We use 4.2 instead because it is the current release and 3.x no longer gets free security patches. Recorded in design.md.
- Register `apps/api` as an Nx project (`project.json`) with `serve`, `build` and `test` targets that call the Maven Wrapper, so `nx serve api` starts the backend.
- Configure the service in `application.yml`: port 8080 and Spring Boot Actuator with only the health endpoint exposed. `GET /api/health` returns `{"status":"UP"}`.
- Set up the package layout `controller` / `service` / `repository` under one base package, and describe it in the README (the layers stay empty for now).
- Add a test that starts the application context and checks the health endpoint, so `nx test api` passes.
- Update the root README: requirements (JDK 21), stack table and the `api` commands.

Out of scope: database and persistence (CC-08), domain features, security and auth, CORS, a dev proxy from `apps/web` to the API, CI, containers.

## Capabilities

### New Capabilities

- `api-service`: The backend API service runs locally through the workspace tooling on a known port and reports its health over HTTP.

### Modified Capabilities

(none – `openspec/specs/` has no specs yet)

## Impact

- New project `apps/api`: `pom.xml`, Maven Wrapper (`mvnw`, `mvnw.cmd`, `.mvn/wrapper/`), `project.json`, `src/main/java/...`, `src/main/resources/application.yml`, `src/test/java/...`.
- New toolchain requirement: JDK 21. Maven and dependencies download on first run into `~/.m2`.
- `.gitignore`: ignore Maven `target/` output.
- `README.md`: backend section, project structure, commands.
- No changes to `apps/web` or existing Nx targets. `nx.json` gets at most cache settings for the new targets.
- Later backend issues depend on the project name `api`, the base package, port 8080 and the `/api` prefix used for the health path.
