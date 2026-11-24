# Proposal

## Why

The web app's UI is built from a few hand-written components (`Button`, `Toast`, and soon `StateMessage`), and colour values are spread over `tokens.css`. Upcoming screens (forms in CC-12, dialogs, the checkout view) need accessible, themeable building blocks, and colours need one source of truth so a theme or palette change touches one file. Web Awesome provides web components, themes and a colour palette to build on.

## What Changes

- Install `@awesome.me/webawesome` in `apps/web` and load one Web Awesome theme (stylesheet) plus the components the app uses.
- Add `apps/web/src/palette.css` as the **only** file where colour values may be written. Palette entries are `--palette-*` custom properties, aligned with the Web Awesome palette so Web Awesome components and our tokens share colours.
- Rebase every colour in `tokens.css` (`--color-surface`, `--color-danger`, `--color-on-danger-surface`, `--color-shadow`) on palette entries; no colour literal remains in `tokens.css`.
- Extend stylelint: hex colours, named colours and colour functions (`rgb()`, `hsl()`, ...) are errors in every CSS file except `palette.css`.
- Assess `Button`, `Toast` (and `StateMessage` once CC-11 is merged) against Web Awesome equivalents; replace one only where the Web Awesome component is simpler and keeps the same behaviour and tests, otherwise keep ours (YAGNI).
- Update `docs/ARCHITECTURE.md` and `docs/CODING_STYLES.md` (palette rule, how Web Awesome components are used from `ui/`).

Out of scope: dark mode, custom theme authoring beyond choosing palette values, replacing components that are not yet needed, Web Awesome Pro features.

Assumptions:
- The free Web Awesome package is enough; no Pro-only theme is used.
- Palette values are copied/mapped from Web Awesome's palette rather than imported wholesale, so the app ships only the colours it uses. To be confirmed against the official docs (webawesome.com/docs) during implementation: exact stylesheet paths and variable names differ between versions in the mirrors found while researching.
- CC-11 (`feat/card-overview-cc-11`) adds tile colour tokens (`--color-tile-default`, `--color-tile-text-light`, `--color-tile-text-dark`) with raw hex values and `ui/state-message`. When CC-11 is merged first, those tokens move onto the palette in this change; if this change merges first, CC-11 must use palette entries instead.

## Capabilities

### New Capabilities
- `color-palette`: where colour values live, how tokens derive from them, and how the lint rules enforce it.
- `web-awesome-ui`: the Web Awesome library is installed and themed, and its components render in the app.

### Modified Capabilities
None.

## Impact

- `apps/web`: `package.json` / lockfile (new dependency), `project.json` or `angular.json` styles, `src/styles.css`, new `src/palette.css`, `src/tokens.css`, component CSS that uses colours, possibly `ui/` components.
- `stylelint.config.mjs`, `docs/ARCHITECTURE.md`, `docs/CODING_STYLES.md`.
- Bundle size: new dependency; the production budget (500 kB warning / 1 MB error) must still pass.
- No API or contract change.
