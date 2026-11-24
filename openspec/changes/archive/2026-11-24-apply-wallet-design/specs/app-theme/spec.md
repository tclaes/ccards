# Spec Delta

## Purpose
Defines the visual identity of the ccards web app: the dark Wallet theme, the logo and favicon, and the brand header, so the app looks the same everywhere and stays simple and legible.

## ADDED Requirements

### Requirement: Wallet theme
The web app SHALL always use the dark colour scheme with a lime accent as Pico's primary colour, regardless of the system colour scheme.

#### Scenario: App loads
- **WHEN** the web app is opened
- **THEN** the page uses the dark scheme and primary buttons and links use the lime accent

#### Scenario: System prefers light
- **WHEN** the operating system is set to light mode
- **THEN** the app is still shown in the dark theme

### Requirement: Shared corner radius
Card tiles, the barcode panel and Pico's buttons and form fields SHALL use the same large corner radius, defined once as a design token.

#### Scenario: Radius changes in one place
- **WHEN** the radius token value is changed
- **THEN** tiles, the barcode panel, buttons and fields change together

### Requirement: Identity assets
The web app SHALL use the ccards logo as its favicon and "ccards" as its page title.

#### Scenario: Browser tab
- **WHEN** the web app is open in a browser tab
- **THEN** the tab shows the ccards favicon and the title "ccards"

### Requirement: Brand header on the card list
The card list SHALL show the logo and the name "ccards" above its heading. The checkout view SHALL NOT show this header, so the barcode keeps the full screen.

#### Scenario: Card list
- **WHEN** the card list is shown
- **THEN** the logo and "ccards" appear above "My cards"

#### Scenario: Checkout
- **WHEN** a card's checkout view is shown
- **THEN** no brand header is shown
