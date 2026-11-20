# Design

## Context

- Spring Boot 4.2 (Spring Framework 7), Java 21, `spring-boot-starter-webmvc` and `spring-boot-starter-validation` are already on the classpath. No controller exists yet: `GET /api/health` is served by Actuator. Controllers will implement interfaces generated from `libs/api-contract/openapi.yaml` (CC-05).
- The default profile has no database; tests run Docker-free with `@SpringBootTest(RANDOM_PORT)` + `RestTestClient` (see `HealthEndpointTests`). Test-only helper classes live under `src/test/java` (precedent: `com.ccards.ghost`).
- Web: Angular 22, zoneless, Vitest, standalone components. `app.config.ts` provides only the router; `provideHttpClient` is not set up. The generated client is imported via `@ccards/api-client`.
- See proposal.md - Why for motivation.

## Goals / Non-Goals

**Goals:**
- One error shape for all API failures, defined in the contract and consumable as types on both sides.
- Feature code in the web app gets visible error feedback without writing error handling.
- Nothing internal (stack traces, exception messages) leaves the server.

**Non-Goals:**
- Domain-specific exception hierarchy or error codes (added when real use cases appear in CC-08+).
- Handling Actuator's own error output or Spring Security errors.
- A full design-system toast; the host stays minimal.

## Decisions

### D1. `@RestControllerAdvice` extending `ResponseEntityExceptionHandler`
`GlobalExceptionHandler` in `com.ccards.api.error` extends `ResponseEntityExceptionHandler`, which already maps Spring MVC's standard exceptions (404 no-handler/no-resource, 405, 415, 400 for unreadable body or type mismatch) to `ProblemDetail` with `application/problem+json`. We override only what we customise: `handleMethodArgumentNotValid` and `handleHandlerMethodValidationException` (add `errors`), plus an `@ExceptionHandler(Exception.class)` fallback for 500. `ConstraintViolationException` (for `@Validated` services/params) is mapped to 400 with the same `errors` shape. *Alternative: only set `spring.mvc.problemdetails.enabled=true`* — rejected, it gives the shape but not the `errors` list nor the safe 500. *Alternative: one `@ExceptionHandler` per exception without the base class* — rejected, re-implements what the base class gives for free and misses cases.

### D2. `errors` as a ProblemDetail extension member
The validation body is a `ProblemDetail` with a property `errors: [{field, message}]` set via `setProperty`, serialised as a top-level member (RFC 9457 extension). Field names are the Java property path as seen by the client JSON (`title`, `items[0].name`); global (object-level) violations use `field` = object name. Messages are the constraint messages, not localized. `type` stays `about:blank` (Spring omits the member in that case, which RFC 9457 treats as the default) until we have documented problem types; `title` is the HTTP reason phrase. Standard `instance` is the request path.

### D3. 500 responses are generic and logged
The fallback handler logs the exception at ERROR with the request path and returns `ProblemDetail.forStatusAndDetail(500, "An unexpected error occurred.")`. Messages of exceptions the base class maps (e.g. `HttpMessageNotReadableException`) are replaced with fixed text where they would expose parser internals (Jackson location info), so `detail` is always one of our own strings, never `ex.getMessage()`.

### D4. Contract-first schemas
`openapi.yaml` gains `Problem` (`type`, `title`, `status`, `detail`, `instance`; all optional except `status`/`title`), `ValidationProblem` (`allOf` Problem + `errors: FieldViolation[]`) and `FieldViolation` (`field`, `message`, both required). Reusable `components/responses` (`BadRequest` → `ValidationProblem`, `NotFound`, `InternalServerError` → `Problem`) use media type `application/problem+json`. Names avoid `ProblemDetail`/`FieldError`, which collide with Spring classes in generated Java. Health gets a `500` reference so the contract exercises the pattern. Generated Java models are used by tests to parse responses; the advice itself builds Spring's `ProblemDetail` (it is the framework's type and serialises to the same JSON), and a test checks the JSON matches the contract schema shape.

### D5. Test-only controller to exercise the advice
Because no real endpoint takes input yet, tests add a `@RestController` under `src/test/java` (imported by the tests via `@Import`) with a `@Valid @RequestBody` DTO, a constrained `@RequestParam`/`@PathVariable`, and an endpoint that throws. It is not part of the production app and not in the contract. *Alternative: wait for CC-08* — rejected, the acceptance criteria must be verifiable now.

### D6. Angular: functional interceptor + `NotificationService` + host component
- `core/notification/notification.service.ts`: `@Injectable({providedIn: 'root'})` holding a `signal<Notification[]>` (`id`, `message`, `severity`), `error(message)`, `dismiss(id)`, `pause(id)`/`resume(id)`, auto-dismiss (see D7), max 3 visible (oldest dropped). Signals match the zoneless setup.
- `core/http/error.interceptor.ts`: `HttpInterceptorFn` registered with `provideHttpClient(withInterceptors([errorInterceptor]))`. On `HttpErrorResponse` it builds a message: status 0 → "cannot reach the server"; body looks like a problem (`status`/`title` fields, shape checked at runtime, typed with the generated `Problem`/`ValidationProblem`) → `detail ?? title`, plus `field: message` lines for `errors`; anything else → generic text per status class (4xx/5xx). It always rethrows (`throwError`) so callers can still react.
- Opt-out via an `HttpContextToken` `SKIP_ERROR_NOTIFICATION` for callers (e.g. a form that renders field errors itself).
- `core/notification/notification-host.ts` renders the list in `App` (`app.html`) with `role="alert"` per item and a dismiss `<button>` with an accessible name.
*Alternative: `ErrorHandler`/global error listener* — rejected, HTTP errors are not uncaught exceptions and the caller usually catches them. *Alternative: Angular Material snackbar* — rejected, new dependency for a minimal need.

### D7. Auto-dismiss with pause on hover/focus
`NotificationService` schedules a `setTimeout` per notification (default 8000 ms, injectable via an `InjectionToken` so tests can shorten it) that calls `dismiss(id)`. The host calls `pause(id)` on `mouseenter`/`focusin` and `resume(id)` on `mouseleave`/`focusout`, which clears the timer and restarts the full duration. Timers are cleared on manual dismiss and when a notification is evicted by the cap. Pausing addresses WCAG 2.2.1 (timing adjustable) and the risk of a message vanishing while being read; the dismiss button remains. Tests use Vitest fake timers. *Alternative: no auto-dismiss* — rejected on request; errors would otherwise linger until manually closed. *Alternative: CSS animation-based expiry* — rejected, state must live in the service so it is testable and the list stays consistent.

## Risks / Trade-offs

- [Base class maps exceptions we did not look at, with Spring default text] → test the main ones (404, 405, 400 unreadable body) and assert fixed `detail` text; add overrides when a case leaks something.
- [Double notification when a caller also shows an error] → `SKIP_ERROR_NOTIFICATION` token; documented in the interceptor.
- [Long validation messages may disappear before being read] → pause on hover/focus; 8 s default is a single constant to tune.
- [Field names in the notification are JSON paths, not user labels] → acceptable for now; localized labels are out of scope.
- [Actuator 404 (`/api/unknown`) is produced before MVC for some paths and may not be `problem+json`] → tests use paths under the MVC dispatcher; verify and note actual behavior of `/api/*` unmapped paths when applying.
- [`ProblemDetail` JSON vs contract drift] → one test validates a real response against the schema field set.

## Open Questions

- Whether `type` should become a URI under a project domain once problem types are documented (can wait; clients must not depend on it yet).
