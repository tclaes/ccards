# Proposal

## Why

`apps/web/src/tokens.css` mixes colour tokens (mapped onto Pico's `--pico-*` variables) with spacing, typography, shape and size tokens. Colours change for different reasons (theming, light/dark, a possible palette later), so they deserve their own file. Doing it now, while there are only eight colour tokens, keeps the move trivial.

## What Changes

- Add `apps/web/src/colors.css` holding every `--color-*` token, moved unchanged from `tokens.css` (`--color-surface`, `--color-danger`, `--color-on-danger-surface`, `--color-success`, `--color-on-success-surface`, `--color-tile-default`, `--color-tile-text-light`, `--color-tile-text-dark`).
- Import it in `apps/web/src/styles.css` before `tokens.css`.
- `tokens.css` keeps spacing, typography, shape/elevation and size tokens.
- Extend the stylelint override that allows raw values where tokens are defined so it covers `colors.css` too.
- Update the places in `docs/ARCHITECTURE.md`, `docs/CODING_STYLES.md` and the stylelint config comment that name `tokens.css` as the home of colours.

Out of scope: renaming tokens or changing values, a custom palette (colours keep coming from Pico), moving non-colour tokens such as `--shadow-md`.

Assumptions:
- The issue's list of colour tokens omits `--color-success` and `--color-on-success-surface`; both are `--color-*` tokens in `tokens.css` today, so they move too (the requirement is "every `--color-*` token").
- Component-local `--color-*` custom properties declared inside a component's `:host` (for example `--color-tile-text-dark` re-resolved in `card-tile.css`) are not design tokens and stay where they are.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `color-tokens`: colour tokens are defined in `colors.css` instead of `tokens.css`, and the lint scenarios name the new file.

## Impact

- Web app: `apps/web/src/styles.css`, `apps/web/src/tokens.css`, new `apps/web/src/colors.css`; component CSS untouched.
- Tooling and docs: `stylelint.config.mjs`, `docs/ARCHITECTURE.md`, `docs/CODING_STYLES.md`.
- Not breaking: token names and values are identical, so rendering does not change in light or dark mode.
