# Proposal

## Why

The API can create, update and delete cards (CC-09, CC-10) and the web app can list them (CC-11), but users cannot add, correct or remove a card from the UI. This issue (CC-12, GitHub #12) adds the form, and is the place to learn Angular Signal Forms with server-side validation feedback.

## What Changes

- Add a card form page used for both creating (`/cards/new`) and editing (`/cards/:id/edit`) a card.
- Fields: name, store, card number, barcode type (select), colour and note. Only the fields the API accepts are shown.
- Validate in the browser with the same rules as the API: required fields, maximum lengths (name/store/number 100, colour 32, note 1000) and the GS1 length and check-digit rule for `EAN_13`, `EAN_8` and `UPC_A`. The number rule is re-checked when the barcode type changes.
- Show validation errors from the server (`400` with `errors[]`) next to the field they name, instead of a toast. Other server failures still show the global toast; a `409` (card changed elsewhere) gets a clear message.
- Create with `POST /api/cards`; edit with `PATCH /api/cards/{id}` (merge-patch, sends only the changed fields plus the loaded `version`).
- Add a delete action on the edit page that first asks for confirmation in a dialog, then calls `DELETE /api/cards/{id}` and returns to the overview.
- Add entry points on the overview: an "Add card" link, and each tile links to its edit page.
- Add a reusable `ConfirmDialog` to `ui/` (dumb, native `<dialog>`).

Out of scope: card detail page and barcode rendering (CC-13), a colour picker beyond a basic colour input, search, authentication, offline support, optimistic updates, changing the API or contract.

Assumptions:
- Signal Forms (`@angular/forms/signals`, available in Angular 22.2) are used rather than reactive forms, since the issue allows either and the app is signals-first.
- The card number rule is implemented once in the web app as a pure function and unit-tested against the backend's examples (valid `4006381333931`, `96385074`, `036000291452`).
- Until CC-13 adds a detail page, tapping a tile opens the edit form.
- After a successful save the user returns to `/cards` and sees a success toast.

## Capabilities

### New Capabilities
- `card-form`: creating, editing and deleting a card from the web app, including client-side validation, per-field server errors and the delete confirmation.

### Modified Capabilities
None.

## Impact

- Web app (`apps/web`): new `features/cards/card-form` (smart container plus dumb field parts if needed), card-number validation helper, routes `cards/new` and `cards/:id/edit` in `app.routes.ts`, "Add card" link and tile links in the overview, new `ui/confirm-dialog`, tokens in `tokens.css` if needed.
- Uses the generated `CardsService` (`createCard`, `getCard`, `updateCard`, `deleteCard`) and the `SKIP_ERROR_NOTIFICATION` opt-out; no contract or API change.
- Tests: validator unit tests, form component tests (create, edit, field errors, 409, delete confirm/cancel), `ConfirmDialog` test.
