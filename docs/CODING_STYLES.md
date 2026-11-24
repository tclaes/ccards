# Coding styles

Conventions for everyone writing code in this repository, human or AI agent. They apply to both `apps/api` (Java, Spring Boot) and `apps/web` (TypeScript, Angular). When a rule here conflicts with a requirement in `openspec/`, the spec wins; say so and propose a change to one of them.

The order matters: **KISS and YAGNI first, SOLID where it earns its keep.** When the principles pull in different directions, choose the simpler code.

## KISS: keep it simple

Write the simplest code that satisfies the spec and is easy to read in six months.

- Prefer plain language features over clever ones. A readable `for` loop beats a dense chain nobody can step through.
- One function does one thing and fits on a screen. Extract when a block needs a comment to explain what it does; name the extraction instead.
- Use the framework's own mechanism before writing your own (`ResponseEntityExceptionHandler`, Bean Validation, Angular signals, `HttpInterceptorFn`).
- Keep the control flow flat: early returns instead of nested `if`s, no boolean flag parameters that switch behaviour.
- Avoid `if / else` (and `else if` chains). Handle the special or failing case first and `return` (or `throw`), then let the normal case continue unindented. Prefer a guard clause, a lookup map, polymorphism, or a `switch` over `else` branches; never nest ternaries.

```ts
// Avoid
function label(count: number): string {
  if (count > 0) {
    return `${count} items`;
  } else {
    return 'empty';
  }
}

// Prefer
function label(count: number): string {
  if (count === 0) return 'empty';
  return `${count} items`;
}
```

- A new dependency needs a reason a few lines of code cannot answer.

In this repo: `GlobalExceptionHandler` extends Spring's base class and overrides only what differs; `NotificationService` is one signal and a timer map, not an event bus.

## YAGNI: you aren't gonna need it

Build what the current task and spec require, nothing more.

- No code for hypothetical future requirements: no unused parameters, options, config flags, extension points, or "we will need this in CC-20" methods.
- No abstraction until the second real use. The third copy is the signal to extract, not the first.
- Do not generalise a solution to a problem that has one case. Duplication is cheaper than the wrong abstraction.
- Delete dead code instead of commenting it out; git has the history.
- If a task seems to need more than the spec says, stop and ask or update the spec (see the OpenSpec apply workflow), rather than quietly adding it.

In this repo: the error format has no custom error-code hierarchy because no endpoint needs one yet; notifications have only an `error` severity.

## SOLID

Apply these to classes, services and components that have real collaborators. Do not create interfaces or layers just to satisfy a letter.

**S, single responsibility.** A unit has one reason to change. Controllers translate HTTP to calls and back; services hold business rules; repositories talk to the database. An Angular component renders and forwards events; state and HTTP live in services.

**O, open/closed.** Add behaviour by adding code, not by editing a growing `switch`. Use polymorphism, strategy-style collaborators or a registry when a second variant actually appears (YAGNI applies until then). Spring `@ExceptionHandler` methods and Angular interceptors are examples: new cases are new handlers.

**L, Liskov substitution.** A subtype must work wherever its parent is expected without surprising callers: no stricter preconditions, no weaker guarantees, no `UnsupportedOperationException` overrides. If a subclass cannot honour the contract, it should not extend it.

**I, interface segregation.** Small, focused interfaces. Callers depend only on the methods they use. Do not add methods to a shared interface for one consumer; add a separate one. The generated API interfaces follow the contract per tag, which keeps them narrow.

**D, dependency inversion.** Depend on abstractions at real seams (an external system, email, clock, a boundary that tests replace). Use constructor injection in Java and `inject()` in Angular; never `new` a collaborator or reach for a static/global inside business code. A class with one implementation and no seam does not need an interface.

## Applying them in the stack

- **Java:** constructor injection, `final` fields, no field injection. Controllers implement the generated interfaces from `libs/api-contract`. Business rules do not live in controllers or entities' setters. Validation lives in Bean Validation annotations on DTOs. Never leak exception messages to clients.
- **TypeScript/Angular:** standalone components, `inject()`, signals for state, `@Service()` (not `@Injectable({ providedIn: 'root' })`) for app-wide services, interfaces and types in `<name>.model.ts` and injection tokens in `<name>.tokens.ts` next to the service, never inside it, `OnPush`-friendly immutable updates. Keep templates free of logic beyond simple conditions. Types come from `@ccards/api-client`, not hand-written copies.
- **HTML, CSS and browser APIs:** before writing or changing markup, styles or client-side browser code, run the `/modern-web-guidance` skill and follow it. Web APIs evolve quickly, so prefer what it recommends over patterns from memory.
- **CSS tokens:** component CSS never contains raw colors, spacing or font sizes. Colours come from Pico's `--pico-*` variables: `tokens.css` references them (`--color-danger: var(--pico-...)`) and stylelint reports hex, named and `rgb()`/`hsl()`-style colours in every file (`transparent` and `currentColor` stay allowed). Use the custom properties in `apps/web/src/tokens.css` (`var(--space-3)`, `var(--color-danger)`, `var(--font-size-lg)`). Font sizes derive from `--font-size-base` (`1rem`), for example `calc(var(--font-size-base) * 1.25)`. Add a new token to `tokens.css` instead of a literal. Stylelint enforces this (`npx nx stylelint web`, also part of `nx lint web`) for `color`, `background`, `border`, `outline`, `box-shadow`, `font-size`, `padding`, `margin` and `gap`.
- **CSS order:** write the properties of every rule in alphabetical order (stylelint enforces it; `npx stylelint "apps/web/src/**/*.css" --fix` sorts them).
- **Overlays:** toasts, menus and similar overlays use the Popover API (`popover` attribute, `showPopover()`), which puts them in the top layer; do not use `z-index` for stacking them.
- **Components:** follow the smart / dumb rule in `ARCHITECTURE.md`. Generic dumb components go in `apps/web/src/app/ui` and are imported through its `index.ts`.
- **Component CSS:** style the component's own element with `:host` instead of a wrapper `<div>`, and keep styles in a `styleUrl` CSS file so they are linted.
- **Naming:** say what it is or does (`NotificationService`, `errorInterceptor`), not how (`Manager`, `Helper`, `Util`).
- **Tests:** test behaviour through the public surface, one reason to fail per test, write the failing test first when the task asks for it. Simple code needs simple tests; do not mock what you can use for real.
- **Comments:** explain why, never what. If a comment restates the code, delete it or rename the code.

## Checklist before finishing a change

1. Could this be simpler without losing required behaviour? (KISS)
2. Is every added line demanded by the task or spec? Anything speculative removed? (YAGNI)
3. Does each class or component have one job, and are its dependencies injected? (SOLID)
4. Are lint, tests and build green (`npx nx run-many -t lint test build --parallel=1`)?
