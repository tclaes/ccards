# Spec Delta

## Purpose
Keeps every colour value of the web app in one palette file, so colours are defined once and everything else derives from them.

## ADDED Requirements

### Requirement: Palette is the only place for colour values
The web app SHALL define colour values only in `apps/web/src/palette.css`, as `--palette-*` custom properties. All other styles, including `tokens.css`, SHALL reference colours through `var(--...)`.

#### Scenario: Token derives from the palette
- **WHEN** `tokens.css` defines a colour token such as `--color-danger`
- **THEN** its value is a `var(--palette-*)` reference (or a `color-mix()` of such references), not a colour literal

#### Scenario: Changing a palette entry
- **WHEN** a `--palette-*` value is changed
- **THEN** every token and component that uses it changes colour without any other file being edited

### Requirement: Lint rejects colour values outside the palette
Stylelint SHALL report an error for hex colours, named colours and colour functions (`rgb`, `rgba`, `hsl`, `hsla`, `hwb`, `lab`, `lch`, `oklab`, `oklch`) in every CSS file except `palette.css`.

#### Scenario: Hex colour in a component
- **WHEN** a component stylesheet contains `color: #123456`
- **THEN** `nx lint web` fails

#### Scenario: Colour function in tokens
- **WHEN** `tokens.css` contains `--color-shadow: rgb(0 0 0 / 0.2)`
- **THEN** `nx lint web` fails

#### Scenario: Keywords stay allowed
- **WHEN** a stylesheet uses `transparent` or `currentColor`
- **THEN** `nx lint web` does not report it

#### Scenario: Palette file is exempt
- **WHEN** `palette.css` contains hex values
- **THEN** `nx lint web` passes
