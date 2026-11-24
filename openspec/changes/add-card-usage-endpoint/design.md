# Design

## Context

- `LoyaltyCard` has `@Version` (Hibernate bumps it on every entity update) and `@LastModifiedDate`. The barcode ETag is `"{version}-{format}"`, and the edit form sends the `version` it loaded; a mismatch is a 409. `CardService` is class-level `readOnly` with `@Transactional` on writes, and throws `CardNotFoundException` (mapped to 404 in `GlobalExceptionHandler`).
- Contract first: `CardsApi` and the web `CardsService` are generated from `libs/api-contract/openapi.yaml`. Schema changes go through Flyway (V1 to V3 exist); Hibernate only validates.
- The checkout page (`features/cards/checkout/checkout-page.ts`) reads the id from the route as a signal and loads the card with `resource()`. Its HTTP errors are shown inline, with `SKIP_ERROR_NOTIFICATION` opting out of the interceptor's toast.
- There is no `Clock` bean and no user model yet (owner is a default id), so no per-user usage or access check.

## Goals / Non-Goals

**Goals:**
- Exact counting under concurrency, without side effects on editing or on the barcode cache.
- A usage call that can never break the checkout view.

**Non-Goals:**
- Exposing or sorting by usage (#24), per-user usage, statistics, reset.

## Decisions

1. **One atomic JPQL update, not read-modify-write.** `LoyaltyCardRepository` gets
   `@Modifying @Query("update LoyaltyCard c set c.usageCount = c.usageCount + 1, c.lastUsedAt = :now where c.id = :id") int recordUse(UUID id, Instant now)`.
   The database does the increment, so concurrent uses cannot lose updates, and no lock is held across a read. The service throws `CardNotFoundException` when it returns 0. Alternative: load the entity and call `card.use()`; rejected, it races and would bump `@Version` (below).
2. **No version bump.** A JPQL bulk update bypasses entity versioning, `@LastModifiedDate` and listeners, which is what we want: a use is not an edit. Bumping the version would (a) change the barcode ETag on every use, defeating the `If-None-Match` cache, and (b) make an open edit form fail with 409 after the card is used at the till.
3. **Entity maps the columns read-only.** `usageCount` and `lastUsedAt` are `@Column(insertable = false, updatable = false)` with getters only. `insertable = false` lets the database default (0) apply on create; `updatable = false` stops Hibernate from writing a stale count back when a card is patched (it updates all mapped columns by default). #24 can then read and sort on them without remapping. Alternative: leave them unmapped and use SQL in tests; rejected, #24 would have to add the mapping anyway.
4. **Migration `V4__add_loyalty_card_usage.sql`.** `usage_count bigint not null default 0` and `last_used_at timestamptz` (null until first use). Existing rows get 0 from the default.
5. **Transaction and time.** `CardService.recordUse(UUID id)` is `@Transactional` and passes `Instant.now()`. A `Clock` bean is not introduced for one call (YAGNI); tests assert the timestamp lies between two instants taken around the call.
6. **Contract.** `POST /api/cards/{id}/usage`, `operationId: registerCardUsage`, tag `Cards`, no request body, `204`, `400` (bad id), `404`, `500`. Controller returns `ResponseEntity.noContent().build()`.
7. **`Card` DTO unchanged.** Exposing usage is #24's decision (which shape, which sort). Keeping it out also keeps the existing contract and mapper tests untouched.
8. **Web: one effect on the route id.** `CheckoutPage` registers the use in an `effect` that reads the id signal and runs the call inside `untracked`, so it fires once per id and not on `reload()`. It runs in parallel with the card load rather than after it, so it also fires when the load fails; an unknown id gives a 404 that is only logged. The call is wrapped so it can never surface: `SKIP_ERROR_NOTIFICATION` suppresses the toast, and a `catch` logs with `console.warn` (project rule: every catch handles its error), never touching the view state. Alternative: call from inside the card `resource()` loader after success; rejected, a side effect in a loader reruns on reload and mixes two concerns.

## Risks / Trade-offs

- Every checkout page open counts, including a browser refresh or back/forward navigation; accepted, "opened at the till" is the definition for now.
- Usage is global to the (single) default owner; per-user usage arrives with the user model.
- The JPQL update skips `updated_at` on purpose; anything that later sorts "recently changed" must not read it as "recently used" (that is `last_used_at`).
- Registering in parallel means the 404 for an unknown id costs one extra, harmless request.
