# Design

## Context

- Nx 24 monorepo: `apps/web` (Angular 22, zoneless, Vitest) and `apps/api` (Spring Boot 4.2, Java 21, Maven via wrapper). There is no `libs/` directory and `tsconfig.base.json` has no `paths` yet.
- The API's only HTTP endpoint is `GET /api/health`, served by Actuator (`management.endpoints.web.base-path=/api`, exposure `health`), not by a controller. Controllers will live in `com.ccards.api.controller`.
- `apps/api/project.json` wraps Maven in `nx:run-commands` targets with `inputs` for caching. The default profile excludes `DataSourceAutoConfiguration`, so `nx test api` is Docker-free and must stay so.
- See proposal.md - Why for motivation.

## Goals / Non-Goals

**Goals:**
- One hand-written file (`openapi.yaml`) from which both sides are generated during a normal build.
- A clean checkout builds with no committed generated code.
- Swagger UI documents exactly the contract, not whatever controllers happen to expose.

**Non-Goals:**
- Designing real resources, error model, pagination or auth in the contract (later stories).
- Generating server implementations or a published npm package.

## Decisions

### D1. Contract-first with the file as the only input
`libs/api-contract/openapi.yaml` is edited by hand; everything else is derived. It starts with `GET /api/health` and a `Health` schema (`status: string`), with `servers: [{url: http://localhost:8080}]` and paths including the `/api` prefix so that generated clients and Swagger "try it out" hit real URLs. *Alternative: code-first (springdoc scanning controllers)* — rejected, it is the opposite of the learning goal and lets the contract follow the code.

### D2. Backend: `openapi-generator-maven-plugin`, `spring` generator, `interfaceOnly`
Bound to `generate-sources`, reading `../../libs/api-contract/openapi.yaml`, output in `target/generated-sources/openapi` (git-ignored via `target/`), `useSpringBoot3`-style options adapted to Boot 4 (Jakarta, `useTags`, `interfaceOnly=true`, `skipDefaultInterface=true`, `openApiNullable=false`). API package `com.ccards.api.generated.api`, models `com.ccards.api.generated.model`. Controllers implement the generated `*Api` interfaces. Exact plugin version and which generator options still emit Boot 4 compatible code (Jackson 3 vs 2 annotations) are confirmed against the generator release notes when applying; if the Spring generator does not yet support Boot 4/Jackson 3, pin the newest version that compiles and note it in the task. *Alternative: Gradle/Nx executor* — rejected, Maven is already the build tool and generation must run inside `./mvnw` so IDE and CLI builds agree.

The health endpoint stays served by Actuator; its generated `HealthApi` interface has no implementer. This is acceptable: the contract documents the endpoint, and `HealthEndpointTests` keeps asserting the real behavior.

### D3. Frontend: Nx library `libs/api-client` with a generated `typescript-angular` client
Generator `typescript-angular` produces Angular `HttpClient` services returning `Observable`s, matching the app's stack and `provideHttpClient`. It is invoked by `@openapitools/openapi-generator-cli` (dev dependency; it runs the generator JAR on the existing JDK, with the generator version pinned in `openapitools.json`) from an Nx target `codegen` (not `generate`, which clashes with the built-in `nx generate` command) on `libs/api-client`, writing to `libs/api-client/src/generated/` (git-ignored). `libs/api-client/src/index.ts` re-exports it. `tsconfig.base.json` gets `paths: {"@ccards/api-client": ["libs/api-client/src/index.ts"]}`. *Alternative: `typescript-fetch`* — rejected, the app would have to wrap fetch in rxjs/signals itself. *Alternative: orval or openapi-typescript* — rejected, a different tool for the same job and the issue names openapi-generator; one generator keeps one set of options to learn.

### D4. Nx wiring makes generation part of the build
- `libs/api-client` target `codegen`: `cache: true`, `inputs: ["{workspaceRoot}/libs/api-contract/openapi.yaml", config]`, `outputs: ["{projectRoot}/src/generated"]`.
- `web` declares `implicitDependencies: ["api-client"]` and its `build`, `test`, `serve` and `lint` targets `dependOn` `api-client:codegen`, so the client exists before the web app compiles. Paths in `tsconfig.base.json` need a leading `./` (no `baseUrl`).
- `apps/api` build/test `inputs` add `{workspaceRoot}/libs/api-contract/**/*` so a contract change invalidates the Nx cache (Maven regenerates anyway).
- `libs/api-contract` is an Nx project with a `validate` target (`openapi-generator-cli validate -i openapi.yaml`, fallback `@redocly/cli lint` if the validator is too lenient) that the `codegen` target depend on, so an invalid contract fails before generation.

### D5. Swagger UI via springdoc, rendering the static contract
Add `springdoc-openapi-starter-webmvc-ui` 3.2.0 (works with Boot 4.2) and `spring-boot-starter-validation` (the generated code imports `jakarta.validation`). Configure `springdoc.swagger-ui.path=/swagger-ui`, keep `springdoc.api-docs` enabled (setting it to false switches Swagger UI off as well) but force its code-scanned output empty with `springdoc.paths-to-match`, guarded by a test and point `springdoc.swagger-ui.url` at the contract served as a static resource (`/api-docs/openapi.yaml`). The Maven `resources` config copies `libs/api-contract/openapi.yaml` to `static/api-docs/` on the classpath, so the served file is byte-identical to the source. Works in the default profile (no DataSource). *Alternative: let springdoc generate docs from controllers* — rejected (D1). *Alternative: hand-written `swagger-ui` webjar page* — rejected, springdoc is the Spring Boot norm and less glue. *Fallback if springdoc does not support Boot 4.2 yet:* serve Swagger UI from the `org.webjars:swagger-ui` jar with a small static `index.html`.

### D6. Generated code is never committed
`.gitignore` adds `libs/api-client/src/generated/`. Java output is already under ignored `target/`. A clean clone regenerates both. *Alternative: commit generated sources* — rejected, diffs are noisy and can go stale vs. the contract, defeating the point.

## Risks / Trade-offs

- **Generator support for Spring Boot 4 / Jackson 3 / Jakarta** → verify generated code compiles early (first task); pin generator versions; fall back to manual Jackson annotation options if needed.
- **Springdoc / Boot 4 compatibility** → check the compatible springdoc version before adding; D5 fallback exists.
- **Generation needs a JDK for the TS client** → JDK 21 is already a prerequisite for `apps/api`; documented in README. First `npm ci`/generate downloads the generator JAR (cached under `node_modules`).
- **Health endpoint is documented but served by Actuator** → the contract could drift from Actuator output; mitigated by a test that compares `/api/health` against the contract's `Health` schema example, not by generating the Actuator endpoint.
- **Build time grows** → Nx caches `codegen`; Maven only regenerates when the contract changes (plugin up-to-date check).

## Migration Plan

1. Land contract, generator wiring and Swagger UI together; no existing behavior changes.
2. Rollback: revert the change. No data or runtime state is affected; generated output lives only in ignored build directories.
