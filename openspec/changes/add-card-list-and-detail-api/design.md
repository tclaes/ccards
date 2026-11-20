# Design

## Context

- `LoyaltyCard` (entity), `BarcodeType` and `LoyaltyCardRepository` exist in `com.ccards.api.repository` (CC-08). The `controller` and `service` packages are empty (`package-info` only).
- Backend interfaces and DTOs are generated from `libs/api-contract/openapi.yaml` (`interfaceOnly`, `useTags`, packages `com.ccards.api.generated.api` / `.model`). Controllers implement the generated `*Api` interface (docs/ARCHITECTURE.md). The `Problem`, `BadRequest` and `NotFound` components already exist in the contract.
- `GlobalExceptionHandler` turns failures into problem details and adds `instance`. Failures are mapped there, not in controllers.
- The default profile has no DataSource, so `nx test api` is Docker-free; a `@WebMvcTest` with a mocked service keeps it that way.
- Users and ownership checks come later (CC-16, CC-19), so there is no authenticated user to scope by yet. See proposal.md - Why.

## Goals / Non-Goals

**Goals:**
- A thin controller → service → repository slice that shows the entity/DTO split and uses MapStruct.
- Reusable pagination in the contract that CC-10 and later lists can follow.

**Non-Goals:**
- Owner filtering or auth, search, client-chosen sorting, caching, or `ETag`s.

## Decisions

### D1. Contract first: `cards` tag, `Card` and `CardPage` schemas
`GET /api/cards` (operationId `listCards`, query `page` int default 0 min 0, `size` int default 20 min 1 max 100) and `GET /api/cards/{id}` (operationId `getCard`, `id` as `format: uuid`), both tagged `Cards` so the generator emits `CardsApi`. `Card` has `id`, `name`, `store`, `cardNumber`, `barcodeType` (enum of the five values), `color`, `note`, `createdAt`, `updatedAt` (`date-time`). `CardPage` has `content` (array of `Card`), `page`, `size`, `totalElements` (int64), `totalPages`. Responses: 200, 400 (`BadRequest`), 404 (`NotFound`, detail only), 500. *Alternative: return Spring's `Page<>` serialisation* — rejected: its JSON shape is not a stable contract and leaks framework types.

### D2. Pagination via validated `page` / `size`, fixed sort
The generated interface carries `@Min`/`@Max` on the parameters, so violations arrive through the existing `HandlerMethodValidationException`/`ConstraintViolationException` handlers as a 400 with `errors`, with no new handling. The controller builds `PageRequest.of(page, size, Sort.by("name", "id"))`; sorting is fixed (name, then id for a stable order) because the issue asks for no sort parameter. The generated `CardPage` is filled from the repository's `Page<LoyaltyCard>`. *Alternative: accept a Spring `Pageable`* — rejected: bypasses the contract-first interface and exposes sort-by-any-column.

### D3. Layering: service returns entities, controller maps to DTOs
`CardService` (`@Service`, `@Transactional(readOnly = true)`) has `Page<LoyaltyCard> list(Pageable)` and `LoyaltyCard get(UUID)`, throwing `CardNotFoundException` when `findById` is empty. It knows nothing about HTTP or generated types. The controller maps with `CardMapper` and builds the page DTO. Mapping in the controller (not the service) keeps generated web types out of business code and the entity from leaving the service as JSON. Because the read-only transaction ends in the service, the entity must be fully loaded there; it has no lazy associations (`ownerId` is a plain column), so this is safe. *Alternative: service returns DTOs* — rejected: couples the service to the generated HTTP model.

### D4. MapStruct for entity → `Card`
Add `org.mapstruct:mapstruct` and the `mapstruct-processor` via `maven-compiler-plugin` `annotationProcessorPaths` (Spring Boot's parent manages no MapStruct version, so one is pinned in `pom.xml`; the newest stable release is chosen when applying). `CardMapper` is a `@Mapper(componentModel = "spring")` interface in the `controller` package mapping `LoyaltyCard` to the generated `Card`; `ownerId` is simply not a target property, and the build fails on unmapped target properties (`unmappedTargetPolicy = ERROR`) so a field added to the contract cannot be silently left out. The generated `Card` uses `OffsetDateTime` for `date-time` while the entity uses `Instant`, so the mapper declares that conversion. *Alternative: hand-written mapping* — rejected: MapStruct is the stated learning goal. The annotation processor must run after the OpenAPI generator's output is on the source path; verified by the first compile when applying (task 1.2).

### D5. 404 via a domain exception and the global handler
`CardNotFoundException extends RuntimeException` (message includes the id, for the log only). `GlobalExceptionHandler` gets one `@ExceptionHandler` returning `ProblemDetail.forStatusAndDetail(NOT_FOUND, "Card not found.")` through `handleExceptionInternal`, which already sets `instance`. The id appears only in the generic detail text if at all, never an exception message, per the coding style. *Alternative: `ResponseStatusException` in the service* — rejected: puts HTTP in the service layer.

### D6. Tests
- `CardControllerTests`: `@WebMvcTest(CardController.class)` with `@MockitoBean CardService`, importing `GlobalExceptionHandler` and the mapper (the Spring-generated `CardMapperImpl`), asserting status, JSON body, ordering/paging arguments passed to the service, 404 problem body, 400 for `size=0`/`size=101`/malformed uuid, and absence of `ownerId`. Docker-free.
- `CardMapperTests`: plain unit test of the mapping including the `Instant` conversion and optional fields.
- `CardServiceTests`: unit test with a mocked repository for the not-found path.
- No repository integration test is added; the existing Testcontainers tests cover the repository, and paging with sort is a Spring Data feature. A smoke call on the `local` profile is done manually when applying.

## Risks / Trade-offs

- **MapStruct processor vs. generated sources** → order/config problems surface on the first compile; task 1.2 isolates that.
- **`@WebMvcTest` and the generated interface** → controller-level validation annotations come from the interface; if they are not applied by MVC in tests, the 400 scenarios fail and show it early.
- **All cards visible to every caller** → acceptable only until CC-16; recorded as a non-goal and revisited with ownership. Nothing is deployed publicly yet.
- **`offset` pagination on a growing table** → fine at this scale; keyset pagination is not needed (YAGNI).

## Migration Plan

Additive only: new endpoints, no schema change. Rollback is reverting the change.
