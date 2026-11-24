# Spec Delta

## MODIFIED Requirements

### Requirement: Edit a card
The web app SHALL provide a form at `/cards/:id/edit` that is pre-filled with the card's current values and SHALL save only the changed fields, together with the version that was loaded.

#### Scenario: Form is pre-filled
- **WHEN** the user opens the edit page of an existing card
- **THEN** every field shows the card's current value

#### Scenario: Only changes are sent
- **WHEN** the user changes only the name and saves
- **THEN** the request contains the new name and the loaded version, and no other card field

#### Scenario: Clearing an optional field
- **WHEN** the user empties the note of a card that had one and saves
- **THEN** the request sets the note to `null` and the card has no note afterwards

#### Scenario: Unknown card
- **WHEN** the user opens the edit page of an id that does not exist
- **THEN** a "card not found" message with a link back to the overview is shown instead of the form

#### Scenario: Entry point from the overview
- **WHEN** the user selects the "Edit" link of a card on the overview
- **THEN** that card's edit form opens

#### Scenario: Card changed elsewhere
- **WHEN** the server answers a save with 409 because the card was changed in the meantime
- **THEN** the user sees a message that the card changed and must be reloaded, and the entered values are not silently overwritten
