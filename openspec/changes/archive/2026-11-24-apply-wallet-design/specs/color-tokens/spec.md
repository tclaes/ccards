# Spec Delta

## MODIFIED Requirements

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
