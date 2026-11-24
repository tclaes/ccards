# Design

## Context

- `apps/web` is Angular 22 (zoneless, signals). Styles: `src/styles.css` imports `src/tokens.css`; component CSS is linted by stylelint (`stylelint.config.mjs`) which already forces `var(--...)` for colour, spacing and font-size properties and exempts `tokens.css`.
- Colours used to live as literals in `tokens.css` (`#fff`, `#b00020`, `#5c0011`, `rgb(0 0 0 / 0.2)`).
- `ui/` holds dumb components (`Button` as `button[appButton]`, `Toast`). CC-11 adds `StateMessage` and tile colour tokens.
- How Pico CSS 2.1.1 implements colours (checked in the package): the SCSS source holds a palette (`scss/colors/_index.scss`, 19 hues in steps from 50 to 950) that is compiled into one prebuilt stylesheet per primary colour (`pico.css` is the default; `pico.red.css`, ... exist). The stylesheet defines semantic `--pico-*` variables once for light (`:root:not([data-theme=dark])`, `[data-theme=light]`) and once for dark (`@media (prefers-color-scheme: dark)` and `[data-theme=dark]`); every component rule uses `var(--pico-*)`. The raw palette is only available through the separate optional `pico.colors.css` (`--pico-color-red-550`, 75 kB).

## Goals / Non-Goals

**Goals:**
- One source for colours (Pico's variables), enforced by lint.
- Plain HTML elements look reasonable without custom CSS.

**Non-Goals:**
- Custom theme authoring, other Pico colour themes, `pico.colors.css`, forcing light or dark mode, a component library.

## Decisions

1. **Use Pico's semantic variables, no palette file of our own.** Our tokens (`--color-surface`, `--color-danger`, `--color-on-danger-surface`, `--shadow-md`) are aliases for `--pico-*` variables, so a Pico theme change or dark mode flows through without edits. Alternative considered: load `pico.colors.css` and keep a `--palette-*` layer on top; rejected because it adds 75 kB and an extra indirection with no current need (KISS, YAGNI).
2. **Token mapping:** `--color-surface` = `--pico-card-background-color`; `--color-danger` = `--pico-form-element-invalid-active-border-color`; `--color-on-danger-surface` = `--pico-del-color`; `--shadow-md` = `--pico-card-box-shadow` (replaces `--color-shadow`, which had no other user).
3. **Lint rules (core stylelint, no new plugin):** `color-no-hex`, `color-named: never`, `function-disallowed-list` for colour functions, applied to every CSS file including `tokens.css` (no exemption). Verified: a throwaway file with a hex colour is reported.
4. **Loading Pico:** `@import '@picocss/pico/css/pico.css'` at the top of `styles.css`; no JavaScript, no Angular configuration.
5. **Reset button chrome:** Pico styles every `button` (padding, margin-bottom, width), which would enlarge the dismiss button of the `Toast`. `Button`'s `:host` resets margin and padding.
6. **Order with CC-11:** whichever merges second migrates the CC-11 tile tokens (`--color-tile-*`) and `StateMessage` colours onto Pico variables.

## Risks / Trade-offs

- Pico restyles every native element globally; components that render native elements may need small resets (as with `Button`). Checked in the browser for `Toast`.
- Pico variable names can change between major versions; the version is pinned.
- Pico follows the system dark mode; tokens follow it automatically, but screens have only been checked for the existing toast.
- If CC-11 merges first, `tokens.css` gains colour literals that this change must migrate; if this change merges first, CC-11 needs a rebase onto Pico variables.
