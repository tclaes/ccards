# Design

## Context

The web app (Angular 22.2, zoneless, signals) has the overview page, the generated `CardsService`, an error interceptor with a `SKIP_ERROR_NOTIFICATION` opt-out and a `ui/` library of dumb components (`Button`, `Toast`, `StateMessage`). The API returns RFC 9457 problems; validation failures carry `errors: [{field, message}]` (`ValidationProblem`). Backend rules live in `CardInput`/`CardPatch` (max lengths) and `CardNumberValidator` (GS1 check digit). `docs/ARCHITECTURE.md` requires smart containers in `features/` and dumb parts in `ui/` or the feature folder. See proposal.md for scope.

## Goals / Non-Goals

**Goals:**
- One form component for create and edit.
- Client rules identical to the backend, with a test that pins the shared examples.
- Server field errors rendered at the field.

**Non-Goals:**
- Generating validators from the OpenAPI document.
- A generic form framework or reusable field components beyond what this form needs (YAGNI).

## Decisions

1. **Signal Forms over typed reactive forms.** `form()` over a `signal` model gives typed fields, built-in `required`/`maxLength` validators, custom validators and server errors via the submit helper, all signal-based like the rest of the app. Alternative: `FormGroup` with `NonNullableFormBuilder`, stable and well known, but it brings observables back into a signals-first app. Risk is the API still being young (see below).
2. **Route layout.** `cards/new` and `cards/:id/edit` both load `CardFormPage` (smart, `features/cards/card-form`). The `id` comes from the router with `withComponentInputBinding()` (an `id` input, absent on create). Edit loads the card with `resource()` keyed on `id`, like the overview.
3. **Card number rule as a pure function** (`isValidCardNumber(type, number)`) in the feature folder, used by a cross-field validator on the form so the number is re-validated when `barcodeType` changes. Alternative: call the API to validate; rejected, since it needs a round trip per keystroke. Duplication of the rule is accepted and guarded by unit tests that use the backend's examples.
4. **Empty strings.** Colour and note map `''` to `null` when sending (create: omitted; patch: `null`), so clearing a field clears it on the server. Required fields are trimmed-blank checked like the backend's `@NotBlank`.
5. **Patch body.** On edit, compare the form value with the loaded card and send only changed fields plus `version`. If nothing changed, save is a no-op that returns to the overview. The generated client must send `application/merge-patch+json`; verify when implementing (task 1.1) and set the header explicitly via the call's options if the generator uses `application/json`.
6. **Server errors.** The save call sets `SKIP_ERROR_NOTIFICATION`. In the component: `400` with `errors` maps `field` to the matching form field's error (cleared when that field changes); unknown fields go to a form-level alert; `409` shows a form-level "changed elsewhere, reload" message with a reload action; anything else is re-raised through `NotificationService.error` because the opt-out also hid the toast. Mapping lives in a small pure function (`toFieldErrors`) so it is testable without the DOM.
7. **Delete confirmation.** A dumb `ui/ConfirmDialog` wraps a native `<dialog>` opened with `showModal()` (focus trap, Escape and focus return for free). Inputs: `open`, `title`, `message`, `confirmLabel`; outputs: `confirmed`, `cancelled`. The page owns the `open` signal and calls `deleteCard`. Delete failures use the normal global toast.
8. **Entry points.** Overview gets an "Add card" link; tiles are wrapped in a `routerLink` by the smart page, so `CardTile` stays dumb.
9. **Styling.** Pico styles native inputs; only tokens, no raw colours. Colour is a native `<input type="color">` plus a "no colour" state (the API's colour is a free string up to 32 characters, tiles already handle `null`).

## Risks / Trade-offs

- [Signal Forms API may differ from what is assumed or change in minor releases] → check the `@angular/forms/signals` types in 22.2 first (task 1.2) and keep form wiring inside one component; fall back to typed reactive forms if a needed piece (server errors, cross-field validation) is missing, and note it in the PR.
- [Client and server rules can drift] → shared examples in tests on both sides; the server stays the authority and its errors are always displayed.
- [Generated `updateCard` may not set the merge-patch content type] → verify early, override per call.
- [Tile links to the edit page are a stopgap] → CC-13 introduces the detail page and can repoint the link.
- [Native `<dialog>` in jsdom/test environment lacks `showModal`] → test through the component's outputs and a small stub where needed.
