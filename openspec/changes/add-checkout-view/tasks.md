# Tasks

## 1. Wake lock

- [x] 1.1 Add `core/wake-lock` with `keepScreenAwake()` (request on call, re-request on `visibilitychange` to visible, release and remove the listener on destroy, ignore missing API and rejection); verify its spec covers acquire, release on destroy, re-acquire after hidden, unsupported API and rejected request

## 2. Checkout page

- [x] 2.1 Add tokens `--color-barcode-frame` and `--size-barcode-max` to `apps/web/src/tokens.css`; verify `npx nx lint web` (stylelint) passes
- [x] 2.2 Add the dumb `features/cards/checkout/checkout-barcode` (inputs `src`, `number`, `name`; white frame in light theme; fallback message when the image fails); verify its spec covers image shown, number readable, and the failed-image fallback keeping the number
- [x] 2.3 Add the smart `features/cards/checkout/checkout-page` with `resource()` around `CardsService.getCard` (`SKIP_ERROR_NOTIFICATION`), loading, not-found, error with retry and ready states, a back link, and `keepScreenAwake()`; verify specs cover the `checkout-view` scenarios (barcode shown, loading, unknown card, load failure with retry and no toast, back link, wake lock held)
- [x] 2.4 Add the lazy route `cards/:id` after `cards/new` in `app.routes.ts`; verify opening `/cards/<id>` shows the checkout page and `/cards/new` still shows the add form

## 3. Overview links

- [x] 3.1 Change the tile link in `cards-page` to open the checkout and add a separate "Edit" link per card to `/cards/:id/edit`; update the overview specs and verify both links go to the right routes (`checkout-view` "Tile opens checkout", `card-form` "Entry point from the overview")

## 4. Check

- [x] 4.1 Run `npx nx affected -t lint test build`, then open the page against the local stack and check in the browser: barcode on white in light and dark mode, number readable, not-found and error states, and the Edit link
- [ ] 4.2 Check on a phone or a mobile emulation over HTTPS or localhost that the screen stays on and the wake lock is released when leaving the page
