# Spec Delta

## Purpose
Makes Web Awesome components available to the web app with one consistent theme, so screens can use them instead of hand-written equivalents.

## ADDED Requirements

### Requirement: Web Awesome is installed and themed
The web app SHALL depend on `@awesome.me/webawesome`, load one Web Awesome theme stylesheet globally, and register only the components it uses.

#### Scenario: A component renders with the theme
- **WHEN** the app renders a Web Awesome component (for example a button)
- **THEN** it is upgraded to its custom element and styled by the loaded theme, with no console errors

#### Scenario: Production build stays within budget
- **WHEN** `nx build web` runs for production
- **THEN** it succeeds within the configured bundle budgets

### Requirement: Web Awesome follows the project palette
Web Awesome's colour variables used by the app SHALL resolve to the project palette, so Web Awesome components and the app's own components show the same colours.

#### Scenario: Brand colour is shared
- **WHEN** a Web Awesome component and an app component both use the primary colour
- **THEN** both render the same colour, defined once in `palette.css`

### Requirement: Replace own components only where simpler
An existing `ui/` component SHALL be replaced by a Web Awesome component only if the replacement is simpler and keeps the behaviour its tests describe; `ui/` components stay dumb (inputs and outputs only).

#### Scenario: Equivalent behaviour kept
- **WHEN** a `ui/` component is replaced
- **THEN** its previous spec scenarios still pass against the new implementation

#### Scenario: No clear gain
- **WHEN** the Web Awesome equivalent would need more code or wrapper logic than the existing component
- **THEN** the existing component is kept
