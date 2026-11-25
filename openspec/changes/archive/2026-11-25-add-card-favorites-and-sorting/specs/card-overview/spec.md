# Spec Delta

## MODIFIED Requirements

### Requirement: Loading state
The page SHALL show a loading indicator while the cards are being fetched and there are no cards on screen yet, and SHALL NOT show the empty or error state at that time. While cards are fetched again after a change of sort order or favourite, the page SHALL keep showing the current cards and the sort control.

#### Scenario: Request in flight
- **WHEN** the page is opened and the API has not responded yet
- **THEN** a loading indicator is visible, and neither the grid, the empty state nor the error state is shown

#### Scenario: Fetching again
- **WHEN** the grid is shown and the cards are fetched again for a new sort order or a changed favourite
- **THEN** the grid and the sort control stay visible until the new list arrives

## ADDED Requirements

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
