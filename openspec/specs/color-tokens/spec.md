# color-tokens Specification

## Purpose
Keeps every colour of the web app coming from Pico's CSS variables, so colours are defined once and everything else derives from them.

## Requirements

### Requirement: Colours come from Pico variables
The web app SHALL NOT write colour values by hand. Colour tokens in `apps/web/src/colors.css` SHALL reference Pico CSS variables (`var(--pico-*)`), and all other styles SHALL reference colours through `var(--...)`.

#### Scenario: Token derives from Pico
- **WHEN** `colors.css` defines a colour token such as `--color-danger`
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
- **WHEN** `colors.css` contains `--color-shadow: rgb(0 0 0 / 0.2)`
- **THEN** `nx lint web` fails

#### Scenario: Keywords stay allowed
- **WHEN** a stylesheet uses `transparent` or `currentColor`
- **THEN** `nx lint web` does not report it

### Requirement: Colour tokens live in colors.css
The web app SHALL define every `--color-*` design token in `apps/web/src/colors.css` and none in `tokens.css`. `colors.css` SHALL be loaded before `tokens.css`.

#### Scenario: Colours are defined in one file
- **WHEN** a developer searches the global stylesheets in `apps/web/src` for `--color-` declarations
- **THEN** they are all in `colors.css`

#### Scenario: Rendering is unchanged
- **WHEN** the app is built and opened after the move
- **THEN** every page looks the same as before, in light and dark mode
