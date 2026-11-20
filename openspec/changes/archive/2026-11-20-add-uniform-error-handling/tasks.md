# Tasks

Prerequisite: CC-05 (contract-first setup) on the base branch; JDK 21 and Node 24 installed. Backend tests run Docker-free.

## 1. Contract

- [x] 1.1 Add `Problem`, `ValidationProblem` (`allOf` Problem + `errors`), `FieldViolation` schemas and `BadRequest`, `NotFound`, `InternalServerError` responses (media type `application/problem+json`) to `libs/api-contract/openapi.yaml`, and reference a `500` response from `GET /api/health`; verify `npx nx validate api-contract` passes
- [x] 1.2 Verify generation: `cd apps/api && ./mvnw -B compile` produces the Java models and `npx nx codegen api-client` produces TypeScript types for `Problem`, `ValidationProblem`, `FieldViolation`; verify `GeneratedContractTests` still compiles (adjust the stub if `HealthApi` changed)

## 2. Backend error handling

- [x] 2.1 Add test-only controller + DTO under `apps/api/src/test/java` (`@Valid` body with two constrained fields, constrained query/path param, endpoint that throws `IllegalStateException("secret internals")`); verify it compiles
- [x] 2.2 Write failing `ErrorHandlingTests` (RANDOM_PORT, `RestTestClient`) for: 404, 405, malformed JSON → `application/problem+json` with `status`; one invalid field → `errors` entry with field+message; two invalid fields → two entries; invalid query param → `errors` names it; unexpected exception → 500 without `secret internals` in the body; verify the tests fail for the right reason
- [x] 2.3 Implement `com.ccards.api.error.GlobalExceptionHandler` (extends `ResponseEntityExceptionHandler`, overrides for body/handler-method validation, `ConstraintViolationException`, fixed `detail` text for unreadable body, logged generic 500 fallback); verify `./mvnw -B test` passes for all of `ErrorHandlingTests`
- [x] 2.4 Add a test asserting the 400 and 500 response JSON member names match the contract's `ValidationProblem`/`Problem` schemas (parse into the generated models); verify it passes and that existing `HealthEndpointTests`, `SwaggerUiTests` still pass via `npx nx test api` with Docker stopped
- [x] 2.5 Check what an unmapped path under `/api/` (Actuator base path) returns; if it is not `problem+json`, handle it or document the exception in design.md; verify with a test or a noted result

## 3. Web error handling

- [x] 3.1 Write failing Vitest specs (fake timers) for `NotificationService` (add, dismiss, cap of 3 drops oldest, auto-dismiss after the configured time, pause/resume restarts the full time, manual dismiss clears the timer) then implement `apps/web/src/app/core/notification/notification.service.ts` with signals; verify `npx nx test web` passes
- [x] 3.2 Write failing specs for `errorInterceptor` using `provideHttpClientTesting` (problem body → `detail`; falls back to `title`; validation problem lists `field: message`; status 0 → unreachable text; HTML 502 body → generic text, no HTML; error still reaches the caller; `SKIP_ERROR_NOTIFICATION` suppresses the notification), then implement `core/http/error.interceptor.ts` typed with `@ccards/api-client` models; verify specs pass
- [x] 3.3 Implement `NotificationHost` component (`role="alert"` per message, dismiss button with accessible name, pause on hover/focus and resume on leave) with a spec for render, dismiss and pause; add it to `app.html`/`app.ts`; verify the spec and the existing `app.spec.ts` pass
- [x] 3.4 Register `provideHttpClient(withInterceptors([errorInterceptor]))` in `app.config.ts`; verify with a spec that an `HttpClient` call failing in the real app config shows a notification

## 4. Wrap-up

- [x] 4.1 Update `README.md` with a short "Error handling" section (problem format, how to add a field-error test, `SKIP_ERROR_NOTIFICATION`); verify the section renders and commands in it work
- [x] 4.2 Run the full workspace check (`npx nx run-many -t lint test build`) and confirm all issue #7 acceptance criteria: `ProblemDetail` responses, field name + message in validation errors, interceptor shows errors via the notification service; verify all targets pass
