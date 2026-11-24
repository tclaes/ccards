# card-overview Specification

## Purpose
Shows the user their loyalty cards on one page, and tells them clearly while cards are loading, when there are none and when loading failed.

## Requirements

### Requirement: Card grid
The web app SHALL show the cards returned by the API as a grid of tiles at `/cards`, which is also the page shown for the root URL. Each tile SHALL display the card's name and store. When the card's `color` is a `#rgb` or `#rrggbb` value, the tile SHALL use it as its background. Otherwise, including when `color` is absent, the tile SHALL use the default tile background.

#### Scenario: Cards are shown
- **WHEN** the API returns three cards
- **THEN** the page shows three tiles, each with the card's name and store

#### Scenario: Tile uses the card colour
- **WHEN** a card has the colour `#e30613`
- **THEN** its tile has that background colour

#### Scenario: Colour that is not a hex value
- **WHEN** a card has the colour `red`
- **THEN** its tile uses the default tile colour and its name and store are still readable

#### Scenario: Card without a colour
- **WHEN** a card has no `color`
- **THEN** its tile uses the default tile colour and its name and store are still readable

#### Scenario: Root URL
- **WHEN** the user opens `/`
- **THEN** the card overview page is shown

### Requirement: Loading state
The page SHALL show a loading indicator while the cards are being fetched and SHALL NOT show the empty or error state at that time.

#### Scenario: Request in flight
- **WHEN** the page is opened and the API has not responded yet
- **THEN** a loading indicator is visible, and neither the grid, the empty state nor the error state is shown

### Requirement: Empty state
The page SHALL show an empty-state message when the API returns no cards.

#### Scenario: No cards
- **WHEN** the API returns an empty list
- **THEN** the page shows a message that there are no cards yet, and no grid

### Requirement: Error state with retry
When fetching the cards fails, the page SHALL show an error message in the page and a retry action. Retrying SHALL fetch the cards again and show the loading state.

#### Scenario: Request fails
- **WHEN** the API responds with a 500 or cannot be reached
- **THEN** the page shows an error message and a retry button, and no grid or empty state

#### Scenario: Retry succeeds
- **WHEN** the user presses retry and the API now returns cards
- **THEN** the loading state is shown first and then the grid

#### Scenario: Failure is reported once
- **WHEN** fetching the cards fails
- **THEN** the error is shown in the page only, and no extra toast notification is raised for the same failure
