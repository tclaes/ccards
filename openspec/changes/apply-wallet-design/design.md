# Design

## Context

The web app uses Pico CSS, with colour tokens in `colors.css` derived from Pico variables and a stylelint rule that bans colour literals (see the color-tokens spec). Pico switches scheme with `data-theme` on the root element.

## Goals / Non-Goals

**Goals:**
- One dark theme, defined by overriding Pico variables so existing tokens and components follow automatically.
- Keep the "no hand-written colours" rule for everything except one clearly marked file.

**Non-Goals:**
- A light theme or a theme switch.
- Redrawing the logo as a full lockup, or brand guidelines.

## Decisions

- **Force dark with `data-theme="dark"` on `<html>` and override the Pico variables under `:root[data-theme='dark']`.** Tokens in `colors.css` already point at Pico variables, so nothing else changes. Alternative: a custom palette of `--color-*` tokens; rejected because it would duplicate Pico's variables.
- **Raw colours live in `theme.css`, exempted in `stylelint.config.mjs`.** `colors.css` stays literal-free, as the colour-tokens spec requires. Alternative: allow literals in `colors.css`; rejected because it weakens that file's purpose.
- **`--radius-lg` token, also assigned to `--pico-border-radius`.** Buttons and fields follow Pico, tiles and the barcode panel use the token directly.
- **Header only on the card list.** It is part of the page template, not an app-wide shell, so the checkout view keeps the full screen for the barcode.
- **`favicon.svg` doubles as the header logo image.** One asset, no duplication.

## Risks / Trade-offs

- [Card tile colours were picked for the light scheme] → each tile already forces `data-theme="light"` on itself; check contrast visually (task 1.5).
- [A second place with raw colours] → limited to `theme.css` by the stylelint override.
