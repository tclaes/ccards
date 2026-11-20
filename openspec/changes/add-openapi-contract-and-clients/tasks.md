# Tasks

Prerequisite: CC-01 (Nx workspace) and CC-02 (`/api/health`) are on the base branch; JDK 21 and Node 24 installed.

## 1. Contract

- [x] 1.1 Create `libs/api-contract/openapi.yaml` (OpenAPI 3.x) with `GET /api/health` returning a `Health` schema (`status` string, example `UP`) and `servers` pointing at `http://localhost:8080`; add `libs/api-contract/project.json` with a `validate` target; verify `npx nx validate api-contract` passes
- [x] 1.2 Verify an invalid contract fails: temporarily break `openapi.yaml` (e.g. bad `$ref`) and check `npx nx validate api-contract` exits non-zero naming the problem; revert the edit

## 2. Backend generation

- [x] 2.1 Check Spring Boot 4.2 compatibility of `openapi-generator-maven-plugin` (spring generator) and pick a pinned version; add the plugin to `apps/api/pom.xml` with `interfaceOnly`, `skipDefaultInterface`, packages `com.ccards.api.generated.{api,model}`; verify `cd apps/api && ./mvnw -B compile` produces `target/generated-sources/openapi/.../HealthApi.java` and `Health.java` and compiles
- [x] 2.2 Add `{workspaceRoot}/libs/api-contract/**/*` to the `build` and `test` `inputs` in `apps/api/project.json`; verify editing the contract makes `npx nx build api` a cache miss
- [x] 2.3 Add a test source that implements `HealthApi` (compile-time guard that interfaces are usable with Boot 4); verify it compiles, then verify that renaming the operation in the contract makes `./mvnw -B test-compile` fail (spec: Breaking contract change fails the backend build); revert the rename

## 3. Swagger UI

- [x] 3.1 Confirm the springdoc version compatible with Spring Boot 4.2 (else use the swagger-ui webjar fallback from design D5), add the dependency, copy `libs/api-contract/openapi.yaml` to `static/api-docs/` through the Maven resources config, and set `springdoc.swagger-ui.path=/swagger-ui`, `springdoc.swagger-ui.url`, no `api-docs.enabled=false` (it disables Swagger UI); verify `./mvnw -B package -DskipTests` puts `api-docs/openapi.yaml` in the JAR
- [x] 3.2 Add `SwaggerUiTests` (random port, default profile, no database): `GET /swagger-ui` ends on a 200 HTML page, and `GET /api-docs/openapi.yaml` equals `libs/api-contract/openapi.yaml`; verify `npx nx test api` passes with Docker stopped
- [x] 3.3 Confirm existing `HealthEndpointTests` still pass unchanged and `/api` and `/actuator/env` remain 404 (no new management exposure)

## 4. TypeScript client

- [x] 4.1 Add `@openapitools/openapi-generator-cli` as a dev dependency with the generator version pinned in `openapitools.json`; generate the Nx library `libs/api-client` (no unit test runner needed beyond a spec) and add `libs/api-client/src/generated/` to `.gitignore`; verify `git status` shows no generated files after generation
- [x] 4.2 Add the `codegen` target (`typescript-angular`, output `libs/api-client/src/generated`, depends on `api-contract:validate`, cached with the contract as input), `src/index.ts` re-export, and the `@ccards/api-client` path in `tsconfig.base.json`; verify `npx nx codegen api-client` creates a `HealthService`/model and `npx nx codegen api-client` a second time is a cache hit
- [x] 4.3 Declare `web` → `api-client` dependency so generation runs before `web:build`, `web:test` and `web:lint`; verify a clean checkout (`git clean -fdx libs/api-client/src/generated`) then `npx nx build web` generates first and succeeds
- [x] 4.4 Prove contract drift is caught: rename `status` in the contract, run `npx nx build web` with a temporary import of `Health['status']`, and verify it fails to compile; revert both edits (spec: Contract change reaches the frontend)

## 5. Docs and final verification

- [x] 5.1 Document in `README.md`: contract location, "edit `openapi.yaml`, never generated code", the codegen/validate commands, how backend interfaces and the client are produced, and `/swagger-ui`; verify by following the README from a clean clone
- [x] 5.2 Run `openspec validate add-openapi-contract-and-clients --strict`, `npx nx run-many -t lint test build`, and `npm run format:check`; verify all pass, then start `npx nx serve api` and open `http://localhost:8080/swagger-ui` to see `GET /api/health`
