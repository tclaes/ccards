# Spec Delta

## Purpose

Lets the user mark loyalty cards as favourites, so the cards they care about most stay at the top of the list.

## ADDED Requirements

### Requirement: Mark and unmark a favourite
The API SHALL provide `PUT /api/cards/{id}/favorite` to mark a card as favourite and `DELETE /api/cards/{id}/favorite` to remove the mark. Both SHALL answer 204 without a body, also when the card already has the requested state.

#### Scenario: Mark a card
- **WHEN** a client puts the favourite of a card that is not a favourite and then fetches the card
- **THEN** the put answers 204 and the card has `favorite` true

#### Scenario: Remove the mark
- **WHEN** a client deletes the favourite of a favourite card and then fetches the card
- **THEN** the delete answers 204, the card still exists and has `favorite` false

#### Scenario: Repeated request
- **WHEN** a client puts the favourite of a card that is already a favourite
- **THEN** the response is 204 and the card is still a favourite

#### Scenario: Unknown card
- **WHEN** a client puts or deletes the favourite of an id that does not exist
- **THEN** the response is 404 as a problem response and nothing is stored

#### Scenario: Invalid id
- **WHEN** a client puts or deletes `/api/cards/not-a-uuid/favorite`
- **THEN** the response is 400 as a problem response

### Requirement: Marking a favourite is not an edit
Marking or unmarking a favourite SHALL NOT change the card's `version`, `updatedAt`, barcode ETag, usage or any other card field. Only the favourite endpoints SHALL change the mark.

#### Scenario: Card is otherwise unchanged
- **WHEN** a card is marked as favourite and then fetched
- **THEN** its `version` and `updatedAt` equal the values from before

#### Scenario: Edit form still saves
- **WHEN** a user opens the edit form, the card is marked as favourite, and the user saves
- **THEN** the save succeeds without a 409 conflict and the card is still a favourite

#### Scenario: Favourite cannot be set through an edit
- **WHEN** a client patches a card with a `favorite` field
- **THEN** the response is 400, `errors` names `favorite` and the stored card is unchanged

### Requirement: The favourite mark is stored with the card
Each card SHALL have a favourite mark that is false for new cards and for cards that existed before the mark was introduced.

#### Scenario: New card
- **WHEN** a card is created
- **THEN** the response has `favorite` false

#### Scenario: Existing cards after migration
- **WHEN** the migration runs on a database with cards
- **THEN** no card is a favourite

### Requirement: The favourite endpoints are part of the API contract
The OpenAPI contract SHALL describe both favourite operations with their 204, 400, 404 and 500 responses, so the generated backend interface and the web client expose them.

#### Scenario: Contract describes the endpoints
- **WHEN** a developer opens the contract
- **THEN** it defines `PUT` and `DELETE /api/cards/{id}/favorite` with operation ids `markCardFavorite` and `unmarkCardFavorite`

### Requirement: Favourite button on the tile
Each tile on the overview SHALL have a star button in its top-right corner that shows whether the card is a favourite, by shape and not by colour alone, and toggles it when selected. Selecting it SHALL NOT open the card. After a successful change the list SHALL show the new order. Until then that card's star SHALL ignore further selections.

#### Scenario: Mark from the overview
- **WHEN** the user selects the star of a card that is not a favourite
- **THEN** the card is marked, its star is shown filled and it moves up among the favourites

#### Scenario: Unmark from the overview
- **WHEN** the user selects the star of a favourite card
- **THEN** the mark is removed, its star is shown as an outline and it takes its place among the other cards

#### Scenario: Button is accessible
- **WHEN** a screen reader reaches the star of the card "Groceries"
- **THEN** it is announced as a toggle button named "Favorite Groceries" with its pressed state

#### Scenario: Keyboard focus is kept
- **WHEN** the user toggles a star with the keyboard and the card moves
- **THEN** focus is on that card's star button

#### Scenario: Name and star do not overlap
- **WHEN** a card has a long name
- **THEN** the name wraps clear of the star button, and the edit button stays in the bottom-right corner

#### Scenario: Saving fails
- **WHEN** the favourite request fails
- **THEN** an error notification is shown, the cards stay on screen, the star keeps showing the stored state and can be selected again

#### Scenario: Selected again while saving
- **WHEN** the user selects a star again before the list shows the change
- **THEN** no second request is sent, and the star is shown dimmed, is reported as unavailable and keeps keyboard focus

#### Scenario: Available again
- **WHEN** the list with the change is shown
- **THEN** the star can be selected again

#### Scenario: Other cards stay available
- **WHEN** the favourite of one card is being saved
- **THEN** the stars of the other cards can be selected
