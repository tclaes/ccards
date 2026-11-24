# Proposal

## Why

The checkout view (CC-14) shows a card at the till, but nothing records that the card was used. Sorting and favourites by usage (#24) need that history. The issue was split off from #14 because neither the endpoint nor the storage exists. #14 is merged, so the checkout view can now call it.

## What Changes

- Contract: `POST /api/cards/{id}/usage` (operation `registerCardUsage`), answering 204 without a body, and 400 / 404 / 500 problem responses.
- Database: a Flyway migration adds `usage_count` (not null, default 0) and `last_used_at` (nullable) to `loyalty_card`.
- Backend: the service records one use as a single atomic update (count + 1, last-used = now). An unknown card gives 404. Recording a use does not change the card's `version`, `updated_at` or ETag.
- Web: the checkout page registers one use when it is opened. If that call fails the page is not disturbed: no toast, no error state; the failure is logged.

Out of scope: showing usage on the card (`Card` DTO, overview) and sorting by it (#24), per-user usage and access control (CC-16 to CC-19), deleting or resetting usage, statistics (CC-33).

Assumptions:
- Usage is not part of the `Card` response yet (YAGNI until #24 needs it). The entity maps the columns read-only so #24 can read them and a card edit can never write a stale count back.
- The checkout page registers usage on open, in parallel with loading the card, so a refresh or revisit counts as another use. An unknown id answers 404 and is only logged.
- The requirement for the web side lives in the new `card-usage` capability because the `checkout-view` spec is still an unarchived change; once archived it can reference this.

## Capabilities

### New Capabilities
- `card-usage`: recording that a card was used: the endpoint, its storage and its atomicity, and the checkout page registering a use without being disturbed by a failure.

### Modified Capabilities
None.

## Impact

- API (`apps/api`): contract `libs/api-contract/openapi.yaml`, migration `V4__add_loyalty_card_usage.sql`, `LoyaltyCard` (read-only columns), `LoyaltyCardRepository` (atomic update), `CardService`, `CardController`.
- Web (`apps/web`): `checkout-page.ts` calls the generated `CardsService.registerCardUsage`.
- Tests: service and controller tests (204, 404, count/timestamp, concurrency, version unchanged), repository/migration test, and checkout page tests (called once on open, failure is silent).
