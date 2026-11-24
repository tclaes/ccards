# Tasks

## 1. Contract and MapStruct setup

- [x] 1.1 Add `GET /api/cards`, `GET /api/cards/{id}`, the `Card` and `CardPage` schemas and the `Cards` tag to `libs/api-contract/openapi.yaml`; verify `nx run api-contract:validate` passes and the generated `CardsApi`, `Card` and `CardPage` appear under `apps/api/target/generated-sources/openapi` and in `libs/api-client` after `nx run api-client:codegen`
- [x] 1.2 Add `mapstruct` and the `mapstruct-processor` annotation processor path to `apps/api/pom.xml`; verify `./mvnw compile` in `apps/api` succeeds with the generated OpenAPI sources and the MapStruct processor on the build path

## 2. Service and mapping

- [x] 2.1 Add `CardNotFoundException` and `CardService` (`list(Pageable)`, `get(UUID)`, read-only transactions); verify `CardServiceTests` passes (found card, unknown id throws `CardNotFoundException`)
- [x] 2.2 Add `CardMapper` (`componentModel = "spring"`, `unmappedTargetPolicy = ERROR`, `Instant` → `OffsetDateTime`); verify `CardMapperTests` passes (all fields mapped, optional fields null, no owner id)

## 3. Controller and error handling

- [x] 3.1 Add the 404 `CardNotFoundException` handler to `GlobalExceptionHandler`; verify a test shows 404 `application/problem+json` with `status`, `detail` and `instance` set and no exception message in the body
- [x] 3.2 Add `CardController` implementing `CardsApi` (page request sorted by name then id, mapping to `CardPage`); verify `@WebMvcTest` `CardControllerTests` pass for: default and explicit paging, empty page, ordering arguments, detail, unknown id (404 problem), `size=0`, `size=101`, `page=-1` and malformed uuid (400 problem) and no `ownerId` in any body
- [x] 3.3 Run the full API test suite (`npx nx test api`) and verify it stays green and Docker-free

## 4. Documentation and integration check

- [x] 4.1 Mention the card endpoints and the entity/DTO/MapStruct approach in `README.md` / `docs/ARCHITECTURE.md` where endpoints or layering are described; verify the text matches the implemented paths and parameters
- [ ] 4.2 Run `npx nx affected -t lint test build` and verify it passes; with the `local` profile and a seeded card, verify `GET /api/cards` and `GET /api/cards/{id}` respond as specified (also visible in Swagger UI)
