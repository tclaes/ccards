# Tasks

## 1. Tokens and shared UI

- [x] 1.1 Add the tile and state tokens to `apps/web/src/tokens.css`; verify `npx nx lint web` (stylelint) passes
- [x] 1.2 Add the dumb `ui/state-message` component (text input, optional action label, `action` output, `role` input for status/alert) and export it from `ui/index.ts`; verify its spec covers text, with and without action, and the emitted event

## 2. Card tile

- [x] 2.1 Add a pure helper that returns a readable text colour for a background colour (fallback for missing/invalid colours) with unit tests for light, dark, missing and invalid colours
- [x] 2.2 Add the dumb `features/cards/card-tile` component (name, store, colour) and verify its spec covers name, store, background colour and the default colour

## 3. Cards page

- [x] 3.1 Add the smart `features/cards/cards-page` with `resource()` around `CardsService.listCards` (page size 100, `SKIP_ERROR_NOTIFICATION`) and a template switching on status for loading, error with retry (`reload()`), empty and grid; verify specs cover the scenarios in `card-overview` (grid, colour, no colour, loading, empty, error, retry, no toast)
- [x] 3.2 Route `/` and `/cards` to the page lazily, remove the `Home` placeholder and update `app.routes` / `app.spec.ts`; verify the root URL shows the overview

## 4. Check

- [x] 4.1 Run `npx nx affected -t lint test build`, then open the page against the local stack (`docker`/API) and check the loading, empty, error and card states in the browser

- [x] 4.2 Found while checking in the browser: the dev server could not reach the API (cross-origin, no CORS). Serve `/api` through a dev proxy (`apps/web/proxy.conf.json`) and point the generated client at the same origin with `provideApi('')`
