# Spec Delta

## Purpose
Keeps every colour of the web app coming from Pico's CSS variables, so colours are defined once and everything else derives from them.

## ADDED Requirements

### Requirement: Colours come from Pico variables
The web app SHALL NOT write colour values by hand. Colour tokens in `apps/web/src/tokens.css` SHALL reference Pico CSS variables (`var(--pico-*)`), and all other styles SHALL reference colours through `var(--...)`.

#### Scenario: Token derives from Pico
- **WHEN** `tokens.css` defines a colour token such as `--color-danger`
- **THEN** its value is a `var(--pico-*)` reference, not a colour literal

#### Scenario: Pico theme changes
- **WHEN** Pico's light or dark values change (for example the system switches to dark mode)
- **THEN** every token and component that uses them changes colour without any other file being edited

### Requirement: Lint rejects colour literals
Stylelint SHALL report an error for hex colours, named colours and colour functions (`rgb`, `rgba`, `hsl`, `hsla`, `hwb`, `lab`, `lch`, `oklab`, `oklch`, `color`, `light-dark`) in every CSS file under `apps/web/src`.

#### Scenario: Hex colour in a component
- **WHEN** a component stylesheet contains `color: #123456`
- **THEN** `nx lint web` fails

#### Scenario: Colour function in tokens
- **WHEN** `tokens.css` contains `--color-shadow: rgb(0 0 0 / 0.2)`
- **THEN** `nx lint web` fails

#### Scenario: Keywords stay allowed
- **WHEN** a stylesheet uses `transparent` or `currentColor`
- **THEN** `nx lint web` does not report it
