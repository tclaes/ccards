# Spec Delta

## Purpose
Lets the user add a loyalty card, change its details and remove it from the web app, with clear feedback on every field that is wrong, whether the problem is found in the browser or reported by the server.

## ADDED Requirements

### Requirement: Create a card
The web app SHALL provide a form at `/cards/new` with fields for name, store, card number, barcode type, colour and note, and SHALL create the card through the API when the user submits a valid form.

#### Scenario: Valid card is created
- **WHEN** the user fills in name, store, a valid number and a barcode type and submits
- **THEN** the card is created, the user returns to the card overview and sees a success message

#### Scenario: Optional fields can stay empty
- **WHEN** the user leaves colour and note empty and submits an otherwise valid form
- **THEN** the card is created without a colour and without a note

#### Scenario: Entry point from the overview
- **WHEN** the user is on the card overview
- **THEN** an "Add card" link opens the empty form

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
- **WHEN** the user selects a card tile on the overview
- **THEN** that card's edit form opens

#### Scenario: Card changed elsewhere
- **WHEN** the server answers a save with 409 because the card was changed in the meantime
- **THEN** the user sees a message that the card changed and must be reloaded, and the entered values are not silently overwritten

### Requirement: Validation matches the API
The form SHALL apply the same rules as the API and SHALL show each error next to its field, without calling the API while the form is invalid.

Rules: name, store and card number are required and not blank; name, store and card number have at most 100 characters; colour at most 32; note at most 1000. For `EAN_13`, `EAN_8` and `UPC_A` the card number SHALL be exactly 13, 8 or 12 digits with a correct GS1 check digit. For `CODE_128` and `QR_CODE` any non-blank text is accepted.

#### Scenario: Required fields
- **WHEN** the user submits with an empty name and an empty store
- **THEN** both fields show a "required" error and no request is sent

#### Scenario: Field too long
- **WHEN** the user enters a name of 101 characters
- **THEN** the name field shows a maximum-length error

#### Scenario: Wrong check digit
- **WHEN** the barcode type is `EAN_13` and the number is `4006381333932`
- **THEN** the card number field shows an error and no request is sent

#### Scenario: Valid GS1 numbers
- **WHEN** the number is `4006381333931` for `EAN_13`, `96385074` for `EAN_8` or `036000291452` for `UPC_A`
- **THEN** the card number field shows no error

#### Scenario: Free-form types
- **WHEN** the barcode type is `CODE_128` and the number is `AB-1234`
- **THEN** the card number field shows no error

#### Scenario: Changing the type re-checks the number
- **WHEN** the number `AB-1234` is entered and the user changes the barcode type to `EAN_13`
- **THEN** the card number field now shows an error

### Requirement: Server errors are shown per field
When the API rejects a save with a validation problem, the form SHALL show each message next to the field it names, and SHALL NOT also show a global notification for that response.

#### Scenario: Server rejects a field
- **WHEN** the server answers 400 with an error for `cardNumber`
- **THEN** the card number field shows the server's message, the other entered values are kept, and no toast is shown

#### Scenario: Server error is cleared on edit
- **WHEN** the user changes a field that showed a server error
- **THEN** that server error disappears

#### Scenario: Error for a field that is not on the form
- **WHEN** the server names a field that the form does not show
- **THEN** its message is shown in a general error area of the form

#### Scenario: Other failures
- **WHEN** the save fails with a network error or a 5xx response
- **THEN** the usual global error notification is shown and the entered values are kept

### Requirement: Saving is guarded
The form SHALL disable the submit action while a save is in flight, so a card cannot be created twice by a double click.

#### Scenario: Double submit
- **WHEN** the user presses save twice quickly on a valid create form
- **THEN** only one request is sent

### Requirement: Delete with confirmation
The edit page SHALL offer a delete action that asks for confirmation in a dialog before anything is deleted, and SHALL delete the card only after the user confirms.

#### Scenario: Confirm
- **WHEN** the user chooses delete and confirms in the dialog
- **THEN** the card is deleted, the user returns to the overview and the card is no longer listed

#### Scenario: Cancel
- **WHEN** the user chooses delete and cancels the dialog (button or Escape)
- **THEN** no request is sent and the form stays as it was

#### Scenario: Dialog names the card
- **WHEN** the confirmation dialog is open
- **THEN** it shows the card's name and states that the action cannot be undone

#### Scenario: Delete fails
- **WHEN** the delete request fails
- **THEN** the dialog closes, the user stays on the edit page and sees the global error notification

#### Scenario: No delete on create
- **WHEN** the user is on the create form
- **THEN** no delete action is shown

### Requirement: Accessible form
Every field SHALL have a visible label, errors SHALL be tied to their field for assistive technology and the confirmation dialog SHALL move focus into the dialog and return it on close.

#### Scenario: Error announced with its field
- **WHEN** a field has an error
- **THEN** the field is marked invalid and its error text is associated with it
