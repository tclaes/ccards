# Design

## Context

`LoyaltyCard` (CC-08) has a UUID id, audit timestamps and `ownerId` as a plain UUID; there are no cards endpoints, services or DTOs yet, and the contract only has `/api/health`. `GlobalExceptionHandler` already maps validation failures to a 400 problem with `errors`. The architecture rule is contract first, then controller (generated interface) -> service -> repository. No users exist until CC-16. See proposal.md for scope.

## Goals / Non-Goals

**Goals:**
- Smallest write API that meets the three acceptance criteria and teaches validation, custom constraints and `@Transactional`.
- One place that knows how to validate a card number per barcode type.

**Non-Goals:**
- Read endpoints, pagination, MapStruct (CC-09). Mapping is done by hand in the service/controller for now; CC-09 may replace it.
- Authentication, per-owner access checks, ETag/If-Match headers.

## Decisions

1. **Contract first.** Add `Card` (response), `CardInput` (create request) and `CardPatch` (merge-patch request, all fields optional plus required `version`) and a `Conflict` response to `openapi.yaml`; implement the generated `CardsApi`. Alternative: hand-written controller, rejected because it breaks the generated-clients rule.
2. **Version in the request body, not `If-Match`.** `PATCH` bodies carry `version`; a missing version is a 400. Simpler to generate and to test than header handling; ETags can be added later without breaking this.
3. **Optimistic locking via `@Version`** (`Long` column `version`, migration `V3__add_loyalty_card_version.sql`, `not null default 0`). The service loads the card, compares the client version with the loaded one and throws on mismatch (so the conflict is caught even without a concurrent flush); Hibernate's `ObjectOptimisticLockingFailureException` covers the true race. Both map to 409 in `GlobalExceptionHandler`. Alternative: rely only on Hibernate's check, rejected because with a detached version the loaded entity's version would simply be used and stale input would pass.
4. **Custom constraint at class level.** A `@ValidCardNumber` constraint on the input DTO with a `ConstraintValidator` that switches on `BarcodeType`; check-digit maths in a small pure helper (GS1 mod 10, shared by EAN-13/EAN-8/UPC-A with different lengths). Violations are attached to the `cardNumber` property node so `errors[].field` is `cardNumber`. When `barcodeType` is null the validator returns valid and lets `@NotNull` report it. Alternative: field-level constraint, rejected because it needs the sibling field.
5. **`@Transactional` on the service**, one transaction per write; read-only lookups use the same methods. No transaction in controllers.
6. **Placeholder owner.** `POST` sets `ownerId` from a configuration property (fixed UUID) until CC-16; `ownerId` is not in `CardInput`. `PATCH`/`DELETE` do not check ownership yet (CC-19).
7. **JSON Merge Patch.** `PATCH` consumes only `application/merge-patch+json` (other types give 415). The body is read as a `JsonNode`, so the three cases are distinguishable: absent (keep), `null` (clear; allowed only for `color`/`note`, otherwise 400) and value (set). Jackson's `JsonNode` is used instead of a generated patch DTO because DTOs cannot tell absent from `null`; the OpenAPI schema documents the fields as optional/nullable and the generated interface takes the body as a generic object. Alternative: JSON Patch (RFC 6902), rejected as heavier than needed; `Optional`/`JsonNullable` wrapper (needs a new dependency), rejected for YAGNI.
8. **Validate the merged state.** The service applies the patch to the loaded entity's values and validates the result with the same Bean Validation rules as `POST` (including the cross-field card number check), so changing only `barcodeType` or only `cardNumber` is checked against the other. Violations use the existing 400 problem format.
9. **Status codes.** 201 + `Location`, 200, 204, 400, 404, 409, 415. Unknown id uses a small `CardNotFoundException` mapped to 404 in the existing advice (the 404 mapping CC-09 needs too).

10. **Default profile stays database-free.** `CardService` and `CardController` are `@ConditionalOnProperty("spring.datasource.url")`, so the existing rule that the default profile starts without a database (`database-migrations`, `local-dev-stack`) still holds; the card endpoints exist only where a datasource is configured. Alternatives: require a database everywhere (changes two specs, makes `nx test api` need Docker), or an in-memory repository fallback (second behaviour to maintain).

## Risks / Trade-offs

- [Any client can edit any card until CC-16/CC-19] -> placeholder owner and documented as temporary in README.
- [Hand-parsing merge-patch is easy to get subtly wrong (unknown fields, wrong types)] -> reject unknown fields and non-scalar values with 400 and cover each with a test.
- [Hand-written mapping is replaced in CC-09] -> keep it in one place (service-level mapper method) so the swap is local.
- [Existing rows get `version` 0 by default] -> migration uses `default 0`; no data backfill needed.
- [A new 409 mapping could shadow other conflicts] -> map only the two locking exceptions, not `DataIntegrityViolationException`.

## Migration Plan

Flyway `V3` adds the column with a default, so it is safe to apply on a populated database. Rollback: drop the column in a follow-up migration (migrations are never edited).
