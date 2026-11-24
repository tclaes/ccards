# Design

## Context

- `apps/web` is Angular 22 (zoneless, signals). Styles: `src/styles.css` imports `src/tokens.css`; component CSS is linted by stylelint (`stylelint.config.mjs`) which already forces `var(--...)` for colour, spacing and font-size properties and exempts `tokens.css`.
- Colours today live as literals in `tokens.css` (`#fff`, `#b00020`, `#5c0011`, `rgb(0 0 0 / 0.2)`).
- `ui/` holds dumb components (`Button` as `button[appButton]`, `Toast`). CC-11 adds `StateMessage` and tile colour tokens.
- Web Awesome is distributed as web components (`@awesome.me/webawesome`); themes are CSS plus classes on `<html>`; Angular needs the custom elements schema or standalone `CUSTOM_ELEMENTS_SCHEMA` in components that use them.

## Goals / Non-Goals

**Goals:**
- One file (`palette.css`) owns all colour values; everything else references it, enforced by lint.
- Web Awesome installed with one theme and visually consistent with our tokens.
- A documented, small rule for when to wrap or replace a `ui/` component.

**Non-Goals:**
- Dark mode, multiple themes, Pro themes, replacing all components up front.

## Decisions

1. **Palette = our own `--palette-*` names, not Web Awesome's variables.** Keeping our names makes the lint rule and tokens independent of Web Awesome's versioned variable names. Web Awesome's variables that the app needs are *set from* palette entries (e.g. `--wa-color-brand-fill-loud: var(--palette-...)`) in a small mapping block, so Web Awesome follows the palette (spec: "follows the project palette"). Alternative considered: use Web Awesome's palette variables directly everywhere; rejected because tokens would then depend on a third-party naming scheme and the lint exemption would have to cover node_modules CSS.
2. **Lint rules (core stylelint, no new plugin):** `color-no-hex`, `color-named: never`, `function-disallowed-list` for colour functions; an `overrides` block turns them off for `**/palette.css`. `tokens.css` stays exempt from the strict-value rule (it holds spacing/size literals) but is **not** exempt from the colour rules. Verified approach: a throwaway CSS file with a hex, `rgb()` and a named colour is reported by all three rules.
3. **Shadow colour:** `--color-shadow` becomes `color-mix(in srgb, var(--palette-black) 20%, transparent)` so no colour function with literal values remains in tokens.
4. **Loading Web Awesome:** add the theme stylesheet to the `styles` of the web build target and import component definitions per component (`@awesome.me/webawesome/dist/components/<name>/<name>.js`) from the place that uses them, so unused components are not bundled. Exact paths are confirmed against the installed version's docs while implementing.
5. **Replace-or-keep assessment is a task, not a decision made now.** `Button` (a thin attribute directive over the native button) likely stays; `Toast` is the candidate if a Web Awesome callout/dialog is simpler. The task records the outcome per component.
6. **Order with CC-11:** whichever merges second migrates the CC-11 tile tokens (`--color-tile-*`) and `StateMessage` colours onto the palette; the task list includes this step explicitly.

## Risks / Trade-offs

- New third-party dependency and bundle growth; mitigated by per-component imports and the existing budgets.
- Web Awesome variable names and file paths vary by version; pin the version and verify against its docs while implementing.
- Mapping Web Awesome variables onto our palette adds a small mapping block to maintain; accepted for the single source of truth.
- If CC-11 merges first, `tokens.css` gains colour literals that this change must migrate; if this change merges first, CC-11 needs a rebase onto palette entries.
