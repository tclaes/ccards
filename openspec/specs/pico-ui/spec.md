# pico-ui Specification

## Purpose
Gives the web app a consistent default look for plain HTML elements by loading Pico CSS, without any JavaScript.

## Requirements

### Requirement: Pico CSS is installed and loaded
The web app SHALL depend on `@picocss/pico` and load its stylesheet globally from `styles.css`.

#### Scenario: Native elements are themed
- **WHEN** the app renders a native element such as a heading or button
- **THEN** it is styled by Pico (for example the `--pico-*` variables resolve on `:root`), with no console errors

#### Scenario: Production build stays within budget
- **WHEN** `nx build web` runs for production
- **THEN** it succeeds within the configured bundle budgets

### Requirement: Own components stay usable under Pico
Components in `ui/` SHALL look as intended with Pico loaded; where Pico's styling of a native element gets in the way, the component resets it in its own CSS using tokens.

#### Scenario: Dismiss button stays plain
- **WHEN** the `Toast` renders its dismiss `button[appButton]`
- **THEN** it has no Pico margin, padding or background chrome beyond the component's own tokens
