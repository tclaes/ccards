# Proposal

## Why

The overview lists the user's cards, but a card is only useful at the till: the cashier has to scan its barcode. Today tapping a tile opens the edit form. CC-14 adds the checkout ("kassa") view: tap a card and its barcode fills the screen, ready to scan, and the phone does not fall asleep while the cashier scans.

## What Changes

- Add a checkout page at `/cards/:id` that shows the card's barcode full screen on a white frame, with the card number readable underneath, the card name and a way back to the overview.
- The barcode image comes from the existing `GET /api/cards/{id}/barcode` endpoint (SVG, so it stays sharp at any size).
- Keep the screen awake while the page is open with the Screen Wake Lock API; release it when the user leaves and re-acquire it when the tab becomes visible again. Browsers without the API still show the barcode.
- Tapping a tile on the overview now opens the checkout view. Editing moves to an explicit "Edit" link next to each tile, so the edit form is still reachable.
- **BREAKING (UI only)**: a tile tap no longer opens the edit form.

Out of scope: registering card usage. The issue asks for `POST /api/cards/{id}/usage`, but neither that endpoint nor usage storage exists. It is split off as issue #63 (backend endpoint plus the call from this view). Also out of scope: scanning cards with the camera (CC-15), brightness control, offline use (CC-28), sorting by usage (CC-24).

Assumptions:
- Barcode types the server cannot render (it answers 422) are not an error for the user: the view still shows the card number so the cashier can type it in.
- The SVG is requested with a plain `<img src>` so the browser can cache it using the endpoint's `ETag`; no blob handling in the app.

## Capabilities

### New Capabilities
- `checkout-view`: what the user sees when a card is opened for scanning: full-screen barcode, readable number, screen kept awake, and the not-found, load-error and unrenderable-barcode states.

### Modified Capabilities
- `card-form`: the overview entry point to the edit form changes from tapping the tile to an explicit "Edit" link.

## Impact

- Web app (`apps/web`): new `features/cards/checkout` smart page plus a dumb barcode display, route `cards/:id` added to `app.routes.ts`, a wake-lock helper, new tokens for the white frame, and an "Edit" link in `cards-page`.
- No contract or API change; uses the existing generated `CardsService.getCard` and the barcode endpoint.
- Tests: component tests for the page states, the wake-lock helper (acquire, release, re-acquire on visibility, unsupported browser) and the changed overview links.
