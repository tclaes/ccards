# Architecture

How the code is organised and the rules that keep it that way. Coding conventions (KISS, YAGNI, SOLID, CSS tokens) are in `CODING_STYLES.md`; planned changes are in `openspec/`.

## Overview

An Nx monorepo with a Spring Boot API and an Angular web app that talk over HTTP. One OpenAPI document is the source of truth for that conversation.

```text
apps/api            Spring Boot 4 / Java 21: controllers -> services -> repositories
apps/web            Angular 22 (zoneless, signals)
libs/api-contract   openapi.yaml, the contract (hand-written)
libs/api-client     TypeScript client generated from the contract (never committed)
```

Both sides generate their types from `libs/api-contract/openapi.yaml`. Change the contract first, then the code. Errors cross the wire as RFC 9457 problem details (see the README section "Error handling").

## Backend (`apps/api`)

- Dependencies point one way: `controller` -> `service` -> `repository`. A controller never touches a repository; a service knows nothing about HTTP.
- Controllers implement the interfaces generated from the contract and only translate between HTTP and service calls.
- Services return entities; the controller maps them to the generated DTOs with MapStruct (`CardMapper`), so entities and generated HTTP types never mix.
- The database schema is owned by Flyway migrations; Hibernate only validates.
- Failures are mapped to problem details in one place (`GlobalExceptionHandler`), not in controllers.

## Frontend (`apps/web/src/app`)

```text
ui/         Dumb, reusable components (the UI library)
core/       App-wide singletons and smart components: services, interceptors, shells
features/   One folder per feature: smart container + its feature-specific dumb parts
```

### Rule: smart / dumb components

Every component is one of two kinds. Do not mix them.

**Dumb (presentational) components** render data and report what the user did.

- Get everything through `input()`/`model()` and report through `output()`.
- Never inject a service that fetches data or holds application state, never call HTTP, never read the router or global state. Injecting purely presentational helpers (for example `ElementRef`) is fine.
- Have no knowledge of where the data comes from or what happens with an event, so they can be reused, tested with plain inputs, and shown in isolation.
- Live in `ui/` when they are generic (`Button`, `Toast`), or inside their feature folder when they are specific to one feature.

**Smart (container) components** wire the application together.

- Inject services, read signals, call the API, handle routing.
- Pass data down to dumb components through inputs and handle their outputs by calling services.
- Contain little markup of their own: mostly a composition of dumb components.
- Live in `core/` (app-wide, like `NotificationHost`) or as the entry point of a feature (`features/<name>`, usually the routed component).

Direction of dependencies: `features` and `core` may import from `ui`; `ui` never imports from `features` or `core`. Data flows down through inputs, events flow up through outputs.

Example in this repo: `NotificationHost` (smart, `core/notification`) reads `NotificationService` and renders one `Toast` (dumb, `ui/toast`) per message. `Toast` knows nothing about the service; it emits `dismissed`, `paused` and `resumed`, and the host turns those into service calls.

When unsure, ask: "could I use this component on another screen with different data and no providers?" If yes, it is dumb and belongs in `ui/`. If it needs a service, it is smart.

### The UI library (`ui/`)

- Every component in `ui/` is dumb. The public surface is `ui/index.ts`; import from there (`from '../../ui'`), never from a component file.
- Build a `ui/` component when a second place needs it (YAGNI); until then keep it in its feature.
- Styling uses the design tokens in `src/tokens.css`; stylelint enforces tokens and alphabetical property order.
- Wrap native elements by attribute selector (`button[appButton]`) so native semantics and accessibility are kept.

### Other frontend rules

- State lives in services as signals; components read them.
- HTTP errors are handled centrally by the interceptor; a caller only handles an error itself when it opts out (`SKIP_ERROR_NOTIFICATION`).
- Types for API data come from `@ccards/api-client`, never hand-written copies.

## Making changes

Every change starts as an OpenSpec change in `openspec/changes/`. When picking up an issue, create it with the `openspec-propose` skill (`/opsx:propose`) before writing code, then implement it with `openspec-apply-change`. The steps for moving the issue on the board are in `AGENTS.md`.
