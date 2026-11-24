# Tasks

## 1. Colour tokens and lint

- [x] 1.1 Rebase the colour tokens in `tokens.css` on Pico variables (`--color-surface`, `--color-danger`, `--color-on-danger-surface`, `--shadow-md`), drop `--color-shadow`; verify no colour literal remains in `apps/web/src`
- [x] 1.2 Add the stylelint colour rules (`color-no-hex`, `color-named`, `function-disallowed-list`) for all CSS files; verify with a throwaway file that a hex colour is reported and that `npx nx lint web` passes

## 2. Pico CSS

- [x] 2.1 Install `@picocss/pico` (pinned) and import `pico.css` in `styles.css`; verify the variables used in the token mapping exist in the installed stylesheet
- [x] 2.2 Reset Pico's button chrome in `Button`; verify `Toast` in the browser (light and dark) and that `npx nx build web` stays within the bundle budgets

## 3. Docs and check

- [x] 3.1 Update `docs/ARCHITECTURE.md` and `docs/CODING_STYLES.md` (colours come from Pico variables, how to add a colour token)
- [x] 3.2 Run `npx nx affected -t lint test build` and check the app in the browser
- [ ] 3.3 CC-11: note in the PR that `--color-tile-*` and `StateMessage` must use Pico variables if this change merges first
