# Tasks

## 1. Groundwork

- [x] 1.1 Check how the generated `CardsService` sends `createCard`/`updateCard` (content type, body type) and fix the call if PATCH is not `application/merge-patch+json`; verify with a `HttpTestingController` assertion on the content type.
- [x] 1.2 Confirm Signal Forms in `@angular/forms` 22.2 cover required/maxLength, a cross-field validator and server-error injection; verify with a throwaway spec that is deleted afterwards, or note the fallback to typed reactive forms in `design.md`.

## 2. Validation

- [x] 2.1 Add `cardNumberError(type, number)` with GS1 length and check digit; verify with unit tests using `4006381333931`, `4006381333932`, `96385074`, `036000291452`, a 9-digit EAN-8, letters in UPC-A and `AB-1234` for `CODE_128`.
- [x] 2.2 Add `splitViolations(violations, fields)` separating violations for form fields from the rest; verify with unit tests for known, unknown and empty `errors`.

## 3. UI library

- [x] 3.1 Add `ui/confirm-dialog` (dumb, native `<dialog>`, `open`/`title`/`message`/`confirmLabel` inputs, `confirmed`/`cancelled` outputs, Escape cancels) and export it from `ui/index.ts`; verify with a component test for confirm, cancel and Escape.

## 4. Card form

- [x] 4.1 Add `CardFormPage` for create: fields with labels, required/maxLength/number rules, barcode type select, submit disabled while saving; verify with component tests for valid create, required errors, wrong check digit, type change re-check and double submit.
- [x] 4.2 Add edit mode: load the card with `resource()`, pre-fill, send only changed fields plus `version`, map empty colour/note to `null`, not-found state; verify with component tests for pre-fill, changed-fields-only body, clearing the note and unknown id.
- [x] 4.3 Show server errors: `SKIP_ERROR_NOTIFICATION` on save, field errors at their fields and cleared on edit, unknown-field message area, 409 message with reload, other failures through `NotificationService`; verify with component tests for 400, unknown field, 409 and 500.
- [x] 4.4 Add delete on the edit page with `ConfirmDialog` (shows card name, cannot be undone), delete then navigate to the overview; verify with component tests for confirm, cancel and failed delete, and that create mode has no delete.
- [x] 4.5 Make errors accessible (`aria-invalid`, `aria-describedby`, form-level `role="alert"`); verify in the component tests by querying those attributes.

## 5. Routing and entry points

- [x] 5.1 Add routes `cards/new` and `cards/:id/edit` (lazy, with component input binding) and an "Add card" link plus tile links on the overview; verify with a router test and an updated `cards-page` spec.

## 6. Verification

- [x] 6.1 Run `npx nx affected -t lint test build` and fix failures; verify all targets pass.
- [x] 6.2 Run the app against the local stack and walk through create, edit, a server-side validation error, delete with cancel and confirm; verify nothing regresses on the overview.
