# Proposal

## Why

The Angular web app and the Spring Boot API will exchange many DTOs (cards, categories, users, ...). If each side hand-writes its own types they drift apart and mismatches only surface at runtime. Making one OpenAPI document the source of truth, and generating both the Java interfaces/DTOs and the TypeScript client from it during the build, means a contract change breaks the build on the side that did not follow. Doing this before the first real endpoint (CC-08+) keeps every later story contract-first.

## What Changes

- Add `libs/api-contract/openapi.yaml` (OpenAPI 3.x) as the single source of truth for the HTTP API. It starts minimal: `GET /api/health` and the shared `Health` schema. Real resources arrive with later stories.
- Generate Java API interfaces and DTOs from the contract at build time with `openapi-generator` (`spring` generator, `interfaceOnly`) into `apps/api/target/generated-sources`; nothing generated is committed.
- Add an Nx library `libs/api-client` whose TypeScript client (`typescript-angular`) is generated from the contract by an Nx target. The web app depends on it through a TypeScript path alias; nothing generated is committed.
- Serve Swagger UI at `/swagger-ui` in the API, rendering the contract file (not annotations scanned from controllers).
- Add a contract validation target so an invalid `openapi.yaml` fails the build.
- Document the contract-first workflow in `README.md`.

Out of scope: real business endpoints, authentication in the contract, contract-breaking-change detection in CI (CC-06), wiring the client into a web feature, publishing the client as a package.

## Capabilities

### New Capabilities
- `api-contract`: one OpenAPI document defines the HTTP API; the backend interfaces/DTOs and the frontend client are generated from it, and the API serves interactive documentation of it.

### Modified Capabilities
<!-- None. `openspec/specs/` has no capabilities yet; earlier changes are not archived. The health endpoint behavior (CC-02) is unchanged, it is only described in the contract. -->

## Impact

- New: `libs/api-contract/` (`openapi.yaml`, `project.json`), `libs/api-client/` (Nx project, generated sources git-ignored), a `@ccards/api-client` path alias in `tsconfig.base.json`.
- Changed: `apps/api/pom.xml` (openapi-generator Maven plugin, springdoc/Swagger UI dependency, contract copied onto the classpath), `apps/api/project.json` (build/test inputs include the contract), `package.json` (generator CLI dev dependency), `.gitignore`, `README.md`.
- New runtime endpoint: `GET /swagger-ui` (and the served contract file). Available in every profile; no database needed.
- Build now needs a JDK for the TypeScript generator too (already required for `apps/api`).
- Dependency: CC-02 (health endpoint), CC-01 (Nx workspace) on the base branch.
