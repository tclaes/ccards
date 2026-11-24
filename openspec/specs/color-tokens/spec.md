# color-tokens Specification

## Purpose
Keeps every colour of the web app coming from Pico's CSS variables, so colours are defined once and everything else derives from them.

## Requirements

### Requirement: Colours come from Pico variables
The web app SHALL NOT write colour values by hand, with one exception: `apps/web/src/theme.css` MAY hold raw colour values, and SHALL use them only to set Pico's CSS variables. Colour tokens in `apps/web/src/colors.css` SHALL reference Pico CSS variables (`var(--pico-*)`), and all other styles SHALL reference colours through `var(--...)`.

#### Scenario: Token derives from Pico
- **WHEN** `colors.css` defines a colour token such as `--color-danger`
- **THEN** its value is a `var(--pico-*)` reference, not a colour literal

#### Scenario: Pico theme changes
- **WHEN** Pico's light or dark values change (for example the palette in `theme.css` is edited)
- **THEN** every token and component that uses them changes colour without any other file being edited

#### Scenario: Palette lives in the theme file
- **WHEN** a developer searches `apps/web/src` for colour literals outside the Pico stylesheet
- **THEN** they are only found in `theme.css`

### Requirement: Lint rejects colour literals
Stylelint SHALL report an error for hex colours, named colours and colour functions (`rgb`, `rgba`, `hsl`, `hsla`, `hwb`, `lab`, `lch`, `oklab`, `oklch`, `color`, `light-dark`) in every CSS file under `apps/web/src` except `theme.css`.

#### Scenario: Hex colour in a component
- **WHEN** a component stylesheet contains `color: #123456`
- **THEN** `nx lint web` fails

#### Scenario: Colour function in tokens
- **WHEN** `colors.css` contains `--color-shadow: rgb(0 0 0 / 0.2)`
- **THEN** `nx lint web` fails

#### Scenario: Keywords stay allowed
- **WHEN** a stylesheet uses `transparent` or `currentColor`
- **THEN** `nx lint web` does not report it

#### Scenario: Theme file is exempt
- **WHEN** `theme.css` contains a hex colour
- **THEN** `nx lint web` does not report it

### Requirement: Colour tokens live in colors.css
The web app SHALL define every `--color-*` design token in `apps/web/src/colors.css` and none in `tokens.css`. `colors.css` SHALL be loaded before `tokens.css`. This applies to the global stylesheets: a component may still re-declare a `--color-*` custom property inside its own `:host` rule to re-resolve it for that component (for example under a forced light scheme), because that is a scoped override, not a design token.

#### Scenario: Colours are defined in one file
- **WHEN** a developer searches the global stylesheets in `apps/web/src` for `--color-` declarations
- **THEN** they are all in `colors.css`

#### Scenario: Rendering is unchanged
- **WHEN** the app is built and opened after the move
- **THEN** every page looks the same as before, in light and dark mode
