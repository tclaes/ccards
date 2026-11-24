# Design

## Context

- `apps/web` is Angular 22, zoneless, signals. The cards overview (`features/cards/cards-page`) fetches with `resource()` around the generated `CardsService`; the edit page (`card-form-page`) does the same for one card and already has dumb `card-loading`, `card-not-found` and `card-load-error` parts, plus a `ownErrors()` helper that sets `SKIP_ERROR_NOTIFICATION`.
- The contract already has `getCard` and `GET /api/cards/{id}/barcode?format=png|svg` with an `ETag` and `Cache-Control: no-cache`; it answers 422 when the number cannot be drawn in the card's barcode type.
- `docs/ARCHITECTURE.md`: smart container as the routed entry point, dumb parts in the feature folder, tokens only in CSS (stylelint rejects raw colours), types from `@ccards/api-client`.
- The tile currently sits inside a link to `/cards/:id/edit`.

## Goals / Non-Goals

**Goals:**
- A routed checkout page with a large barcode on a white frame and a readable number.
- Wake lock held while the page is open, with graceful fallback.
- Keep the edit form reachable.

**Non-Goals:**
- Usage registration (issue #63), camera scanning, brightness control, offline use, pagination.

## Decisions

1. **Route `cards/:id`, lazy.** Placed after `cards/new` so `new` is not read as an id (the edit route `cards/:id/edit` has more segments, so there is no clash). The page reads `id` from the route like `CardFormPage`.
2. **Barcode as `<img src="/api/cards/{id}/barcode?format=svg">`.** The browser then caches with the `ETag` and the app has no blob URLs to revoke. SVG scales to any screen. The URL is built from the card id; the generated client's `getCardBarcode` returns a `Blob` and would add blob handling for no benefit. Alternative considered: PNG; rejected, it blurs when scaled up to full screen. The image `(error)` event switches the view to the "barcode could not be shown" message while the number stays visible (covers the 422 case without a second request).
3. **Card data via `resource()` + `CardsService.getCard`.** Needed for name and number. Status switch like the edit page: loading, 404 not-found, other error with retry, ready. Errors are shown inline (`SKIP_ERROR_NOTIFICATION`). The card-form's `card-loading`, `card-not-found` and `card-load-error` are not imported across features; the checkout uses small equivalents built on `ui/state-message` (already generic, `announce` + action). A third use would justify moving them to `ui/`.
4. **Component split.** `features/cards/checkout/checkout-page` (smart: route id, resource, wake lock) composes a dumb `checkout-barcode` (inputs `src`, `number`, `name`; owns only its own "image failed" state; no services). The wake lock lives in a function `keepScreenAwake()` in `core/wake-lock` that must be called in an injection context, so it ties itself to the component's destroy.
5. **Wake lock helper.** `keepScreenAwake()` uses `navigator.wakeLock.request('screen')` if present. The browser releases the lock when the tab is hidden, so it listens to `visibilitychange` and requests again when visible. On destroy it removes the listener and calls `release()`. Rejection (battery saver, permissions policy) and a missing API are swallowed: the barcode must work without it. `navigator` and `document` are injected through the `DOCUMENT` token (`document.defaultView?.navigator`) so tests can pass fakes without patching globals.
6. **White frame ignores the theme.** The frame sets `data-theme="light"` and uses a token mapped to Pico's light background (same trick as `card-tile`), so scanners always see black on white in dark mode. New tokens: `--color-barcode-frame` and `--size-barcode-max`.
7. **Overview change.** The tile link goes to `['/cards', id]` with `aria-label="Open {name}"`; a separate `Edit` link (`/cards/:id/edit`, `aria-label="Edit {name}"`) sits next to each tile, outside the tile link so no interactive element is nested in another. The existing overview tests that expect the tile to open the edit form are updated.

## Risks / Trade-offs

- The image src bypasses the Angular HTTP client, so the dev proxy and the same-origin `/api` base are the only things making it work. Both already exist (`proxy.conf.json`, `provideApi('')`); a deployment that serves the API from another origin would need to build the URL from the client's configured base path.
- A failing barcode `<img>` gives no reason (404 vs 422); the message stays generic ("could not be shown"). Acceptable: the number is still readable.
- Wake Lock needs a secure context; on plain-HTTP LAN access it is simply unavailable and the page degrades silently.
- No usage registration yet, so sorting by usage (CC-24) waits for issue #63.
