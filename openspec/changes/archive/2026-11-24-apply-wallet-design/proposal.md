# Proposal

## Why

ccards has no identity and uses stock Pico styling. A simple, functional look (logo, dark theme, one accent colour) makes the app recognisable and easy to read at the till. Three proposals were drawn up in `docs/design/proposals.html` and proposal B (Wallet) was chosen. See issue #69; the implementation is in PR #68.

## What Changes

- Add the ccards logo (two stacked cards with a cut-out C), an SVG favicon and the page title "ccards".
- Apply the Wallet theme: always dark, lime accent. The palette is set as Pico variables in a new `theme.css`.
- Add a `--radius-lg` token (1.25rem) used by card tiles, the barcode panel and Pico buttons and fields.
- Show a brand header (logo and name) on the card list.
- Allow raw colour values in `theme.css` only; stylelint keeps rejecting them everywhere else.

## Capabilities

### New Capabilities
- `app-theme`: the visual identity of the web app: the always-dark Wallet theme, logo, favicon, page title and the brand header on the card list.

### Modified Capabilities
- `color-tokens`: raw colour values are now allowed in the single theme file; the lint requirement and the "colours come from Pico variables" requirement gain that exception.

## Impact

- `apps/web/src/theme.css` (new), `styles.css`, `tokens.css`, `index.html`, `apps/web/public/favicon.svg`
- `card-tile`, `cards-page` and `checkout-barcode` components (radius, header)
- `stylelint.config.mjs` (theme file exception)
- `docs/design/` (logo and the three proposals)
- No API, data or dependency changes. Light mode is no longer used by the app.
