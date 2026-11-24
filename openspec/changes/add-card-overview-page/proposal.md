# Proposal

## Why

The API can list and manage loyalty cards (CC-09, CC-10), but the web app only shows a heading. Users cannot see their cards yet. This is the first screen that fetches data, and it is the place to learn signals-based data fetching in Angular (`resource()`).

## What Changes

- Add a card overview page at `/cards` (the default route) that lists the cards returned by `GET /api/cards`.
- Show each card as a tile in the card's own colour, with its name and store.
- Show a loading state while the request is in flight, an empty state when there are no cards, and an error state with a retry action when the request fails.
- Fetch the data with `resource()` wrapped around the generated `CardsService` from `@ccards/api-client`, so request and response types come from the OpenAPI contract.
- Split the page into a smart container (`features/cards`) and dumb parts (card tile, state messages), following `docs/ARCHITECTURE.md`.
- Add design tokens for the grid and tile (no raw colours or spacing in component CSS).

Out of scope: pagination controls (only the first page is requested), creating/editing/deleting cards (UI), card detail and barcode rendering (CC-13), search and filtering, authentication.

Assumptions:
- `httpResource()` cannot call the generated client (it takes a URL, not an Observable), so `resource()` with `firstValueFrom(cardsService.listCards(...))` is used to keep the generated types and client.
- A card without a `color` is shown with a neutral default tile colour. Text colour is chosen so it stays readable on the tile.
- The page requests the maximum page size (100) so one request covers a normal wallet; showing "more cards" is a later issue.

## Capabilities

### New Capabilities
- `card-overview`: what the user sees on the card overview page: the card grid, and the loading, empty and error states.

### Modified Capabilities
None.

## Impact

- Web app (`apps/web`): new `features/cards` folder (smart container + dumb tile and state components), route change in `app.routes.ts`, new tokens in `tokens.css`; the `Home` placeholder is replaced.
- Uses the existing generated client and error interceptor; no contract or API change.
- Tests: component tests for the tile and the container (loading, success, empty, error, retry) with `HttpTestingController` or a stubbed `CardsService`.
