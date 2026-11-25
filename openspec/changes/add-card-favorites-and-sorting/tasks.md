# Tasks

## 1. Favourite mark in the API

- [x] 1.1 Add `PUT` / `DELETE /api/cards/{id}/favorite` (`markCardFavorite`, `unmarkCardFavorite`, 204/400/404/500) and the required `Card.favorite` to `libs/api-contract/openapi.yaml`; verify `npx nx run api-contract:validate` passes and both operations and the field are generated for backend and web
- [x] 1.2 Add Flyway `V5__add_loyalty_card_favorite.sql` and the read-only `favorite` column on `LoyaltyCard`; verify migration/repository tests show existing and new cards as not favourite
- [x] 1.3 Add `LoyaltyCardRepository.setFavorite`, the service method (404 for an unknown id) and both controller operations; verify controller and `CardApiTests` cover mark, unmark, repeat, 404, bad id, unchanged `version`/`updatedAt`, a patch with the old version keeping the favourite, and a patch with `favorite` giving 400

## 2. Sorting in the API

- [x] 2.1 Add the `sort` query parameter (`name` default, `lastUsed`, `mostUsed`) to `GET /api/cards` in the contract, with its description updated; verify `npx nx run api-contract:validate` passes
- [x] 2.2 Add `CardSort` and `UnsupportedSortException` (400 naming `sort`) and use it in `CardController.listCards`; verify controller tests cover the default, each value and an unknown value
- [x] 2.3 Verify the orders against PostgreSQL (Testcontainers): favourites first in all three, never-used last for `lastUsed`, ties by name, and order across pages
- [x] 2.4 Update the "Cards" line and the data model fields in `README.md` and document the favourite endpoints; verify the documented URLs match the contract

## 3. Sort order in the web app

- [x] 3.1 Add the sort model constants and `CardSortPreference`; verify specs cover the default, a remembered value, an unknown stored value and failing storage
- [x] 3.2 Add the "Sort by" control and pass the order to `listCards`, keeping the cards visible while fetching again; verify specs cover the default request, a changed order, the grid staying visible, the error state with retry in the chosen order, and the existing overview scenarios

## 4. Favourite button in the web app

- [x] 4.1 Add the star button to each tile (top-right, `aria-pressed`, outline/filled), keep the tile name clear of it and the edit button bottom-right; verify specs cover its name and state, that it is outside the card link, and `npx nx lint web` passes (stylelint tokens)
- [x] 4.2 Toggle through the API, reload the list, keep focus on the toggled star and handle a failure; verify specs cover mark, unmark, reload without a loading indicator, focus, and a failed request leaving the cards shown with a notification

## 5. Check

- [x] 5.1 Run `npx nx affected -t lint test build` with Docker running, so the database tests are not skipped
- [x] 5.2 Run the API on the local stack and the web app, and verify in the browser at phone and desktop width: mark and unmark, all three orders, the choice surviving a reload, and a long card name not overlapping the buttons
- [x] 5.3 Run `/sentry-skills:code-simplifier` and then `/sentry-skills:code-review` on the changed files, fix correct findings and re-run 5.1

## 6. Announcement and focus ring

- [x] 6.1 Announce a newly chosen sort order from a visually hidden status element on the overview; verify specs cover the text and count, one card, nothing before the list arrives, on first load or after a favourite change, repeated changes, and a failed fetch followed by a retry
- [x] 6.2 Add the global `:focus-visible` ring with its tokens and round the tile link; verify `npx nx lint web` passes and, in the browser, that the ring shows on a star and edit button over light and dark tiles, on a tile, on "Add card", on the sort control and on a form field
- [x] 6.3 Run `npx nx affected -t lint test build`, then `/sentry-skills:code-simplifier` and `/sentry-skills:code-review` on the new changes, and re-run the checks
