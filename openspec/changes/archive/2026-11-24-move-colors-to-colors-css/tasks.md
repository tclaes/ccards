# Tasks

## 1. Move the colour tokens

- [x] 1.1 Create `apps/web/src/colors.css` with the eight `--color-*` tokens (and their comment) and remove them from `tokens.css`; verify `grep -- '--color-' apps/web/src/tokens.css` finds nothing
- [x] 1.2 Import `colors.css` in `apps/web/src/styles.css` before `tokens.css`
- [x] 1.3 Extend the stylelint override in `stylelint.config.mjs` to `colors.css` and update its header comment; verify `npx nx lint web` passes and that a temporary `rgb(...)` colour in `colors.css` is still rejected

## 2. Docs

- [x] 2.1 Update `docs/ARCHITECTURE.md` and `docs/CODING_STYLES.md` so colours point at `colors.css` and the other tokens at `tokens.css`

## 3. Check

- [x] 3.1 Run `npx nx affected -t lint test build`
- [x] 3.2 Open the app in the browser in light and dark mode and verify the eight `--color-*` custom properties on `:root` resolve to the same values as on `main`, and that the overview and edit pages look unchanged
