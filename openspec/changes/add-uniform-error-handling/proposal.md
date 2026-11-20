# Proposal

## Why

Every endpoint from CC-08 onwards can fail (invalid input, missing resource, unexpected bug). Without one error format the API leaks Spring's default error JSON or stack traces, and each Angular screen invents its own way to show failures. Fixing the error shape now, in the contract, keeps all later stories consistent. Issue: CC-07 (tclaes/ccards#7).

## What Changes

- Add a global `@RestControllerAdvice` that answers every failed API request with `application/problem+json` following RFC 9457 (`ProblemDetail`): `type`, `title`, `status`, `detail`, `instance`.
- Validation failures (400) add an `errors` list with the field name and message of every violation.
- Unexpected exceptions become a 500 problem response with a generic message; stack traces and exception messages never reach the client but are logged.
- Describe the problem format in `libs/api-contract/openapi.yaml` (`Problem` and `ValidationProblem` schemas plus reusable error responses) so the generated Java models and TypeScript client carry the types.
- Add an Angular `HttpInterceptor` that catches failed HTTP calls, turns them into a user-readable message and hands it to a central `NotificationService`; a notification host component in the app shell renders the messages. Messages auto-dismiss after 8 seconds (paused while hovered or focused) and can be dismissed manually.
- Register `provideHttpClient(withInterceptors([...]))` in the app config (not present yet).

Out of scope: authentication/authorization errors (401/403 handling, redirects), retry logic, i18n of messages, error tracking/telemetry (CC-37+), localized field labels, notification styling beyond a minimal accessible toast, rate limiting responses.

## Capabilities

### New Capabilities
- `api-error-handling`: how the API reports failures (RFC 9457 problem details, per-field validation errors, safe 500s) and how the web app surfaces them to the user through one notification service.

### Modified Capabilities
<!-- None. `api-contract` exists only as a delta in the not-yet-archived change `add-openapi-contract-and-clients`, not under `openspec/specs/`, so no delta can target it. The contract additions are covered by a requirement in `api-error-handling`. -->


## Impact

- New backend code: `com.ccards.api.error` (advice) and tests with a test-only controller; no new dependency (`spring-boot-starter-validation` is already present).
- Changed: `libs/api-contract/openapi.yaml` (schemas, responses), `apps/web/src/app/app.config.ts` (`provideHttpClient`), `apps/web/src/app/app.ts`/`app.html` (notification host).
- New web code: `apps/web/src/app/core/` (interceptor, `NotificationService`, notification component) with Vitest specs.
- Changes the wire format of every error response (there are no business endpoints yet, so nothing existing breaks). Actuator's own responses are unchanged.
- Depends on: CC-05 contract-first setup (on `main`).
