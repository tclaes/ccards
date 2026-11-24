# Tasks

## 1. Contract and storage

- [x] 1.1 Add `POST /api/cards/{id}/usage` (`registerCardUsage`, 204/400/404/500) to `libs/api-contract/openapi.yaml`; verify `npx nx run api-contract:validate` and that the generated `CardsApi` and web `CardsService` expose it
- [x] 1.2 Add Flyway `V4__add_loyalty_card_usage.sql` (`usage_count bigint not null default 0`, `last_used_at timestamptz`) and map both columns read-only on `LoyaltyCard`; verify a migration test shows existing rows at 0 and no last-used time, and that a new card starts at 0

## 2. Backend

- [x] 2.1 Add the atomic `recordUse` update to `LoyaltyCardRepository` and `CardService.recordUse(id)` throwing `CardNotFoundException` for an unknown id; verify service/repository tests cover first use, repeated use, unknown card, `version`/`updatedAt` unchanged, and a patch after a use keeping the count
- [x] 2.2 Implement `registerCardUsage` in `CardController` (204); verify controller tests cover 204, 404 problem, 400 for a non-UUID id, and a concurrency test with 20 parallel uses ending at 20

## 3. Web

- [x] 3.1 Register one use from `CheckoutPage` (effect on the route id, `untracked` call, `SKIP_ERROR_NOTIFICATION`, failure logged with `console.warn`); verify specs cover one request on open, no extra request on retry, and that a failing request leaves the barcode shown with no notification

## 4. Check

- [x] 4.1 Run `npx nx run-many -t lint test build` for `api` and `web`
- [x] 4.2 Run the API against the local stack (`docker compose up -d`), open a card's checkout page and verify the count in the database goes up by one per open and the edit form still saves afterwards
