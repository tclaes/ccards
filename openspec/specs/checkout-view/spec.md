# checkout-view Specification

## Purpose
Shows a card's barcode full screen so it can be scanned at the till, and keeps the screen on while it is shown.

## Requirements

### Requirement: Full-screen barcode
The web app SHALL provide a checkout page at `/cards/:id` that shows the card's barcode large on a white frame, the card number readable below it, and the card name. The page SHALL offer a way back to the card overview.

#### Scenario: Barcode is shown
- **WHEN** the user opens the checkout page of an existing card
- **THEN** the card's barcode is shown on a white frame with the card number readable beneath it

#### Scenario: Frame stays white in dark mode
- **WHEN** the app is in dark mode and the checkout page is open
- **THEN** the barcode is still shown on a white background so it can be scanned

#### Scenario: Back to the overview
- **WHEN** the user selects the back link
- **THEN** the card overview is shown

### Requirement: Open from the overview
Selecting a card tile on the overview SHALL open that card's checkout page.

#### Scenario: Tile opens checkout
- **WHEN** the user selects a card tile on the overview
- **THEN** the checkout page of that card opens

### Requirement: Screen stays on
While the checkout page is open the web app SHALL ask the browser to keep the screen on, and SHALL release that request when the user leaves the page.

#### Scenario: Screen kept awake
- **WHEN** the checkout page is open and the browser supports the Screen Wake Lock API
- **THEN** a screen wake lock is held

#### Scenario: Released on leaving
- **WHEN** the user leaves the checkout page
- **THEN** the wake lock is released

#### Scenario: Re-acquired after the tab was hidden
- **WHEN** the user switches away from the page and back while the checkout page is open
- **THEN** the wake lock is held again

#### Scenario: Wake lock unavailable
- **WHEN** the browser does not support the Screen Wake Lock API or the request is refused
- **THEN** the barcode and number are shown as usual and no error is shown to the user

### Requirement: Checkout page states
The page SHALL show a loading indicator while the card loads, an unobtrusive "card not found" message with a link to the overview for an unknown id, and an error message with a retry action when loading fails.

#### Scenario: Loading
- **WHEN** the card has not loaded yet
- **THEN** a loading indicator is shown and no barcode

#### Scenario: Unknown card
- **WHEN** the user opens the checkout page of an id that does not exist
- **THEN** a "card not found" message with a link back to the overview is shown

#### Scenario: Load failure
- **WHEN** loading the card fails for another reason
- **THEN** an error message with a "Try again" action is shown and no global error notification is raised

### Requirement: Barcode that cannot be drawn
When the server cannot draw the card's barcode, the page SHALL still show the card name and number so the number can be keyed in.

#### Scenario: Unrenderable barcode
- **WHEN** the barcode image cannot be loaded for a card
- **THEN** the card number remains readable and a short message says the barcode could not be shown
