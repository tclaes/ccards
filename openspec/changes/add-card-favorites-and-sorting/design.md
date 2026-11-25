# Design

## Context

See proposal.md for motivation. What shapes the approach:

- `CardController.listCards` builds a `PageRequest` with a fixed `Sort.by("name", "id")`; `CardService.list` passes it to `findAll`.
- `usage_count` and `last_used_at` exist (V4) and are mapped read-only on `LoyaltyCard`; only `LoyaltyCardRepository.recordUse`, a bulk update, changes them, so a use bumps neither `@Version` nor `updatedAt`.
- The generator turns an inline query enum into a `String`; the barcode `format` is checked by `ImageFormat.fromParameter`, and its exception is mapped to a 400 with `errors` in `GlobalExceptionHandler`.
- `CardsPage` loads one page of 100 cards with `resource()` and shows the loading indicator for both `loading` and `reloading`. The edit button is a sibling of the tile link, positioned over the tile's bottom-right corner.
- The app is always dark (`theme.css`); tiles switch to Pico's light scheme inside.

## Goals / Non-Goals

**Goals:**

- The order is decided by the database, so it is right across pages and #25 can combine it with filters.
- Marking a favourite never interferes with editing or the barcode cache.
- Re-ordering the list does not blank it or lose the user's place.

**Non-Goals:**

- Search, categories and JPA Specifications (#25).
- Optimistic updates in the web app.
- Syncing the sort preference between devices.

## Decisions

1. **Sort in the database, as a named order.** A `CardSort` enum (`name`, `lastUsed`, `mostUsed`) in `service` maps each value to a Spring `Sort`, with `favorite desc` first and `name, id` last; `lastUsedAt` uses `nullsLast()` (supported by Spring Data JPA 4.2 through JPA 3.2 null precedence; a database test proves it). The controller puts that `Sort` in the `PageRequest`; `CardService.list` does not change, and #25 can pass the same `Pageable` to `findAll(Specification, Pageable)`. Alternatives: sort in the browser (wrong beyond one page, and puts usage data on the wire; rejected by the user), a free `sort=field,direction` parameter (exposes entity fields and allows orders nobody asked for), one JPQL query per order (does not combine with Specifications).
2. **`sort` is an inline enum in the contract, validated like `format`.** `CardSort.fromParameter` throws `UnsupportedSortException`, mapped to a 400 naming `sort`. A named schema generating a Java enum would give a 400 without `errors`. A shared "unsupported value" exception is not extracted for a second case.
3. **Favourite is its own sub-resource, not a patch field.** `PUT` / `DELETE /api/cards/{id}/favorite` are idempotent and need no `version`. In `CardPatch` the toggle would need the current version, bump it (new barcode ETag, 409 in an open edit form) and still be a one-field edit. This follows the usage endpoint's rule that using or organising a card is not editing it.
4. **Same write pattern as usage.** `@Modifying` JPQL `update LoyaltyCard c set c.favorite = :favorite where c.id = :id`; 0 rows means `CardNotFoundException`. The entity maps `favorite` with `insertable = false, updatable = false` and a getter only, so the database default applies on create and a patch can never write a stale value back.
5. **Migration `V5__add_loyalty_card_favorite.sql`:** `favorite boolean not null default false`. No index: the list is read per page from a small table.
6. **`Card.favorite` is required in the response**; `CardInput` and `CardPatch` do not get it. MapStruct fills it from `isFavorite()`.
7. **Sort preference in a small service.** `CardSortPreference` (`@Service()`, in the cards feature) holds a signal, reads `localStorage` once and writes on change, both in `try/catch` with `console.warn`; an unknown value falls back to `name`. The key and the allowed values are constants in a `.model.ts`, typed from the generated client. Alternatives: a query parameter (lost via "Back to cards"), a generic storage service (one use).
8. **Sort control is a dumb component** around a native `<select>` (input: current value, output: chosen value) in the cards feature, rendered above the grid. `ui/SelectField` is bound to Signal Forms and is not a fit for one stand-alone value.
9. **Keep cards on screen while fetching again.** The resource takes the sort as `params`. A new `params` value clears a resource's value, so the page keeps the last loaded list in a `linkedSignal` and shows the loading indicator only when it has none (first load, retry). An error still shows the existing error state. A newer request supersedes an older one through the resource.
10. **Star button beside the link**, like the edit button: a `<button type="button">` with `aria-pressed` and the fixed name "Favorite {name}", positioned top-right, sharing the corner-button style, with Pico's button styling reset. Outline or filled inline SVG shows the state. `.name` gets inline-end padding equal to the button so they never overlap. It stays in the page: one use, no `ui/` component yet.
11. **Toggle, then reload.** The page calls mark or unmark and on success reloads the resource, so the server stays the only place that knows the order. A failure is shown by the error interceptor's notification and logged by the caller. Moving a DOM node drops its focus, so after the new list renders the page focuses the toggled card's star again.

Before writing markup and CSS, run `/modern-web-guidance` (project rule).

## Risks / Trade-offs

- [A second tap before the list reloads repeats the first request instead of undoing it] → harmless because the calls are idempotent; the next tap after the reload undoes it.
- [`lastUsed` and `mostUsed` move cards as they are used] → intended; the default stays `name`.
- [Name order follows the database collation, as today] → unchanged by this change.
- [`listCards` and `Card` change in the generated client] → both sides are in this repo and updated together; tests that build a `Card` need `favorite`.
- [More than 100 cards] → the overview still shows one page, but it is now the right first page for the chosen order.

## Migration Plan

Flyway applies V5 on API start; the column has a default, so existing rows need no backfill. Rolling back the application is safe: an older API ignores the extra column.
