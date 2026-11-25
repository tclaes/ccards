# Proposal

## Why

Every use of a card is already recorded (`card-usage`), but the list ignores it: it is always ordered by name, so the card you need at the till can be far down. Issue #24 lets users keep their favourite cards on top and order the list by how they use it.

## What Changes

- Database: a Flyway migration adds `favorite` (not null, default false) to `loyalty_card`.
- Contract: `PUT /api/cards/{id}/favorite` marks a card as favourite and `DELETE /api/cards/{id}/favorite` removes the mark. Both answer 204, and 400 / 404 / 500 problem responses. Like a use, marking is not an edit: `version`, `updatedAt` and the barcode ETag stay as they are.
- Contract: `Card` gains a required `favorite` boolean.
- Contract: `GET /api/cards` gains `sort` (`name` | `lastUsed` | `mostUsed`, default `name`); an unknown value is a 400. **Behaviour change:** favourite cards come first in every order. Existing clients that send no `sort` still get name order, as long as no card is a favourite.
- Web: each tile gets a star button in its top-right corner that marks or unmarks the card.
- Web: the overview gets a "Sort by" control (Name, Last used, Most used). The choice is remembered on the device; the default is Name.
- Web: re-fetching after a new sort order or a changed favourite keeps the current cards on screen instead of showing the loading indicator.

Out of scope: search and categories (#25), usage counts or last-used times in the `Card` response or on the tile, per-user favourites (CC-16 to CC-19), paging in the overview, setting a favourite through the add or edit form, manual ordering of favourites.

## Capabilities

### New Capabilities

- `card-favorites`: marking a card as favourite: the endpoints, how it is stored, and the star button on the overview.

### Modified Capabilities

- `loyalty-card-api`: the list takes a `sort` parameter and puts favourites first; a card response contains `favorite`.
- `card-overview`: the user chooses the sort order, the choice is remembered, and a re-fetch keeps the cards visible.

## Impact

- API (`apps/api`): `libs/api-contract/openapi.yaml`, migration `V5__add_loyalty_card_favorite.sql`, `LoyaltyCard` (read-only column), `LoyaltyCardRepository`, `CardService`, `CardController`, a new `CardSort`, `GlobalExceptionHandler`.
- Web (`apps/web`): `features/cards/cards-page`, `features/cards/card-tile` (name keeps clear of the star), a sort control and the remembered sort preference. The generated `CardsService.listCards` gains an argument and the `Card` type a field.
- No new dependencies.
- #25 can reuse the `sort` parameter next to its `q` and `category` filters.
