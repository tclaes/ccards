# Tasks

## 1. Palette and lint

- [ ] 1.1 Add `apps/web/src/palette.css` with the `--palette-*` entries for the colours in use, import it in `styles.css` before `tokens.css`, and rebase the colour tokens in `tokens.css` on it (shadow via `color-mix`); verify no colour literal remains outside `palette.css` and the app looks unchanged
- [ ] 1.2 Add the stylelint colour rules (`color-no-hex`, `color-named`, `function-disallowed-list`) with the `palette.css` override; verify with a throwaway file that a hex, an `rgb()` and a named colour are all reported, and that `npx nx lint web` passes

## 2. Web Awesome

- [ ] 2.1 Install `@awesome.me/webawesome` (pinned), load one theme stylesheet in the web build, and map the Web Awesome colour variables the app uses onto palette entries; verify against the official docs for the installed version
- [ ] 2.2 Render one Web Awesome component in the app with the custom elements schema configured, covered by a component test; verify no console errors and `npx nx build web` stays within the bundle budgets

## 3. Existing components

- [ ] 3.1 Assess `Button` and `Toast` against Web Awesome equivalents, replace only where simpler with their existing specs still passing, and record the outcome per component in `design.md`
- [ ] 3.2 Migrate colours from CC-11 (`--color-tile-*`, `StateMessage`) onto the palette, or note in the PR that CC-11 must use palette entries if this change merges first

## 4. Docs and check

- [ ] 4.1 Update `docs/ARCHITECTURE.md` and `docs/CODING_STYLES.md` (palette-only colour rule, how Web Awesome components are used from `ui/`)
- [ ] 4.2 Run `npx nx affected -t lint test build` and check the app in the browser
