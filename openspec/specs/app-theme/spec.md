# app-theme Specification

## Purpose
Defines the visual identity of the ccards web app: the dark Wallet theme, the logo and favicon, and the brand header, so the app looks the same everywhere and stays simple and legible.

## Requirements

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

### Requirement: Visible keyboard focus
A control with visible keyboard focus SHALL show a ring in the accent colour with a band of the page colour on both sides, so the ring stands out on the page, on accent-coloured buttons and on a card tile of any colour. This SHALL apply to every control in the app.

#### Scenario: Button on a tile
- **WHEN** the user moves with the keyboard to the star or edit button on a tile of any colour
- **THEN** a lime ring with a dark band inside and outside it is shown around the button

#### Scenario: Accent-coloured button
- **WHEN** the user moves with the keyboard to "Add card"
- **THEN** a dark band separates the lime ring from the lime button

#### Scenario: Card tile
- **WHEN** the user moves with the keyboard to a card tile
- **THEN** the ring follows the tile's rounded corners

#### Scenario: Links and form fields
- **WHEN** a link, text field or select has visible keyboard focus
- **THEN** it shows the same ring

#### Scenario: Forced colours
- **WHEN** the operating system forces its own colours
- **THEN** the focused control still has a visible outline
