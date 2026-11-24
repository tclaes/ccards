# Proposal

## Why

The web app's UI is a few hand-written components (`Button`, `Toast`, and soon `StateMessage`) with colour values written by hand in `tokens.css`. Upcoming screens (forms in CC-12, dialogs, the checkout view) need sensible default styling for plain HTML elements, and colours need one source of truth. For a first iteration the simplest thing that works is Pico CSS: a classless-friendly stylesheet with no JavaScript, themed through `--pico-*` CSS variables, with light and dark mode built in.

## What Changes

- Install `@picocss/pico` in the workspace and load `pico.css` globally from `styles.css`.
- Colours come from Pico's semantic variables (`--pico-background-color`, `--pico-card-background-color`, `--pico-del-color`, `--pico-form-element-invalid-active-border-color`, ...). `tokens.css` maps our colour tokens (`--color-surface`, `--color-danger`, `--color-on-danger-surface`) and `--shadow-md` onto them; no colour literal remains in `tokens.css`.
- Extend stylelint: hex colours, named colours and colour functions (`rgb()`, `hsl()`, ...) are errors in every CSS file, so colours can only come from Pico variables.
- Reset Pico's button chrome in the `Button` component so the dismiss button stays plain.
- Update `docs/ARCHITECTURE.md` and `docs/CODING_STYLES.md` (colour rule, Pico usage).

Out of scope: choosing a Pico colour theme other than the default, Pico's optional palette stylesheet (`pico.colors.css`), forcing light or dark mode, Web Awesome or any other component library.

Assumptions:
- Pico's default theme (`pico.css`) is acceptable for a first iteration; Pico follows the system light/dark preference, and our tokens follow because they reference Pico variables.
- Pico variables used here (`--pico-card-background-color`, `--pico-del-color`, `--pico-form-element-invalid-active-border-color`, `--pico-card-box-shadow`) exist in the pinned version 2.1.1; they are verified against the installed stylesheet.
- CC-11 (`feat/card-overview-cc-11`) adds tile colour tokens with raw hex values and `ui/state-message`. If this change merges first, CC-11 must map its tile colours onto Pico variables; if CC-11 merges first, those tokens move onto Pico variables in this change.

## Capabilities

### New Capabilities
- `color-tokens`: where colours come from (Pico variables), how tokens derive from them, and how the lint rules enforce it.
- `pico-ui`: Pico CSS is installed and loaded, and plain HTML elements and our components render with its theme.

### Modified Capabilities
None.

## Impact

- `apps/web`: `src/styles.css`, `src/tokens.css`, `ui/button/button.css`; `package.json` / lockfile (new dependency `@picocss/pico`).
- `stylelint.config.mjs`, `docs/ARCHITECTURE.md`, `docs/CODING_STYLES.md`.
- Bundle size: about 84 kB raw / 10 kB transferred of CSS; the production budget (500 kB warning / 1 MB error) must still pass.
- No API or contract change.
