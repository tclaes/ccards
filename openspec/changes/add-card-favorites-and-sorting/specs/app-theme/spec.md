# Spec Delta

## ADDED Requirements

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
