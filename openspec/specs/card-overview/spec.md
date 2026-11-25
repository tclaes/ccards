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
The page SHALL show a loading indicator while the cards are being fetched and there are no cards on screen yet, and SHALL NOT show the empty or error state at that time. While cards are fetched again after a change of sort order or favourite, the page SHALL keep showing the current cards and the sort control.

#### Scenario: Request in flight
- **WHEN** the page is opened and the API has not responded yet
- **THEN** a loading indicator is visible, and neither the grid, the empty state nor the error state is shown

#### Scenario: Fetching again
- **WHEN** the grid is shown and the cards are fetched again for a new sort order or a changed favourite
- **THEN** the grid and the sort control stay visible until the new list arrives

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

### Requirement: Choose the sort order
The page SHALL offer a control labelled "Sort by" with the options Name, Last used and Most used, shown with the grid. Choosing an option SHALL show the cards in the order the API returns for it. The default SHALL be Name.

#### Scenario: Default order
- **WHEN** the user opens the overview for the first time
- **THEN** the control shows Name and the cards are requested ordered by name

#### Scenario: Change the order
- **WHEN** the user chooses "Most used"
- **THEN** the cards are fetched again with that order and shown as the API returns them

#### Scenario: Changing the order fails
- **WHEN** fetching the cards for a newly chosen order fails
- **THEN** the page shows its error state, and retry fetches the cards in the chosen order

### Requirement: The sort order is remembered
The web app SHALL remember the chosen sort order on the device and use it the next time the overview is shown. When nothing usable is stored, or the browser does not allow storage, it SHALL use Name and the page SHALL keep working.

#### Scenario: Return to the overview
- **WHEN** the user chose "Last used", opens a card and goes back to the overview
- **THEN** the control shows "Last used" and the cards are requested in that order

#### Scenario: Reload
- **WHEN** the user chose "Most used" and reloads the app
- **THEN** the control shows "Most used"

#### Scenario: Unknown stored value
- **WHEN** the stored value is not one of the offered orders
- **THEN** the overview uses Name

#### Scenario: Storage unavailable
- **WHEN** reading or writing the browser storage fails
- **THEN** the overview shows the cards, the order can still be changed for the current visit and no error is shown to the user

### Requirement: A new sort order is announced
After the user chooses another sort order, the page SHALL tell screen readers once, when the new list is on screen, which order it is and how many cards it has, without moving focus. The first load, a return to the overview and a favourite change SHALL NOT be announced this way.

#### Scenario: Order is announced
- **WHEN** the user chooses "Most used" and the list of four cards arrives
- **THEN** "Sorted by most used, 4 cards" is announced politely and focus stays where it was

#### Scenario: Not before the list arrives
- **WHEN** the user has chosen another order and the list has not arrived yet
- **THEN** nothing is announced

#### Scenario: Every change is announced
- **WHEN** the user chooses "Last used" and later "Name" again
- **THEN** each new list is announced

#### Scenario: Nothing to announce
- **WHEN** the overview is opened, or the list is fetched again after a favourite change
- **THEN** no sort order is announced

#### Scenario: Fetching the new order fails
- **WHEN** the list for a newly chosen order cannot be fetched
- **THEN** only the error message is announced, and the order is announced once a retry succeeds
