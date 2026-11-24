# Design

## Context

- `styles.css` imports Pico, then `tokens.css`. `tokens.css` declares one `:root` block with typography, spacing, colour, shape and size tokens; the colour group is eight `--color-*` lines, each a `var(--pico-*)` reference.
- `stylelint.config.mjs` forbids raw values for `color`, `background`, `border`, `outline`, `box-shadow`, `font-size`, `padding`, `margin` and `gap`, with an override for `**/tokens.css` ("the only place raw values are allowed: where tokens are defined"). The colour-literal ban (hex, named, colour functions) applies to every file and has no override.
- Component CSS only consumes the tokens through `var(--...)`; none imports either file.

## Goals / Non-Goals

**Goals:**
- One file for colour tokens, with the same names and values.
- Lint behaviour for token files stays the same for both files.

**Non-Goals:**
- Renaming, re-valuing, a palette, or moving `--shadow-md` (a shadow, not a colour).

## Decisions

1. **Plain move, one `:root` block in `colors.css`.** Copy the eight declarations and their explanatory comment ("Pico's semantic variables, which also switch with light/dark mode"). Alternative: split by light/dark scheme now; rejected, nothing needs it (YAGNI).
2. **Import order `pico.css`, `colors.css`, `tokens.css`.** Custom properties resolve at use time, so order does not change results; colours first follows the issue and reads as "palette, then scale".
3. **Override glob `['**/tokens.css', '**/colors.css']`** rather than a looser pattern, so a stray `foo-tokens.css` does not get the exemption. The stylelint header comment is updated to name both files.
4. **Docs.** `ARCHITECTURE.md` ("design tokens in `src/tokens.css`" and "`tokens.css` maps the colour tokens onto Pico's variables") and `CODING_STYLES.md` ("`tokens.css` references them", "Use the custom properties in `tokens.css`", "Add a new token to `tokens.css`") are reworded so colours point at `colors.css` and everything else at `tokens.css`.
5. **Local custom properties stay.** `card-tile.css` and `checkout-barcode.css` (when present) re-declare `--color-*` inside `:host` to re-resolve under a forced light scheme. They are scoped overrides, not tokens, so the "none outside `colors.css`" check covers the global stylesheets only.

## Risks / Trade-offs

- A `--color-*` token left behind in `tokens.css` would silently still work, so the move is verified by searching for `--color-` in `tokens.css` and by comparing the computed values of the eight properties on `:root` before and after.
- Two token files to look at instead of one; accepted, that is the point of the issue.
