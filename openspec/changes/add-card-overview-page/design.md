# Design

## Context

- `apps/web` is Angular 22, zoneless, signals. `provideHttpClient(withInterceptors([errorInterceptor]))` is already configured; the interceptor raises a toast for every failed call unless the request sets `SKIP_ERROR_NOTIFICATION`.
- `@ccards/api-client` is generated (`CardsService.listCards(page?, size?)` returns `Observable<CardPage>`; `Card` has `name`, `store`, `color?`, ...). `libs/api-client/src/generated` is not committed and is produced by `nx codegen api-client`.
- `docs/ARCHITECTURE.md`: dumb components in `ui/` or their feature folder, smart container as feature entry point; state as signals; types only from the generated client.
- The only route today is `Home` (a heading).

## Goals / Non-Goals

**Goals:**
- A routed smart container that fetches cards with `resource()` and renders loading, empty, error and grid states.
- Dumb components that take plain inputs, testable without providers.
- Learn the `resource()` API: `params`, `loader`, `status`/`value`/`error`/`isLoading`, `reload()`.

**Non-Goals:**
- Pagination, search, sorting, card detail, mutations, a shared card store/service (YAGNI until a second screen needs the cards).

## Decisions

1. **`resource()` + generated `CardsService`, not `httpResource()`.** The issue allows either. `httpResource()` builds its own request from a URL and would bypass the generated client and its types. `resource({ loader: () => firstValueFrom(cards.listCards(0, 100, 'body', false, { context })) })` keeps one source of truth (the contract). Alternative considered: `rxResource` with the Observable directly; it avoids `firstValueFrom` and is a fine alternative if it is stable in Angular 22, to be confirmed while implementing.
2. **Template switches on `resource.status()`.** Loading, error, empty (`value().content.length === 0`) and grid are mutually exclusive branches, so the states cannot overlap. Retry calls `resource.reload()`; a reload keeps the previous value but status is `reloading`, so the error branch is left and the loading branch is shown for `loading | reloading`.
3. **Errors shown in the page, not as a toast.** The request sets `SKIP_ERROR_NOTIFICATION` via `HttpContext`, because the page has its own error state with retry; otherwise the user would get a toast and an inline message for one failure. The inline message reuses wording consistent with the interceptor (status 0: cannot reach server; otherwise a generic "could not load your cards").
4. **Component split.** `features/cards/cards-page` (smart: injects `CardsService`, owns the resource, template `@switch`) composes dumb `features/cards/card-tile` (inputs `name`, `store`, `color`) and generic `ui/state-message` (inputs for text, optional action label, output `action`) used for empty and error. `ui/state-message` is created now because two states use it (rule: a second place needs it). Loading is a small inline element in the container, not a component.
5. **Colour on the tile.** `color` is set through a style binding (`[style.background-color]`) on the tile with the CSS custom property fallback `var(--color-tile-default)`. Text colour: a CSS-only approach is not possible for arbitrary colours, so the tile computes a readable text colour (black or white) from the colour's luminance in a small pure function, tested on its own. Invalid or unparsable colour strings fall back to the default tile colour. Alternative considered: always white text with a dark overlay; rejected, it dulls the card colour that makes cards recognisable.
6. **Routing.** `''` loads `CardsPage` lazily; `Home` is removed; the wildcard still redirects to `''`. A `cards` path is added as the canonical URL and `''` redirects to it.
7. **Tokens.** New tokens in `tokens.css` (`--color-tile-default`, `--color-on-tile-light/dark`, `--size-tile-min`, `--space-*` reuse). Component CSS uses tokens only (stylelint).
8. **Accessibility.** The grid is a `<ul>` of tiles; the loading element has `role="status"`; the error message has `role="alert"`; the retry action is a real `<button appButton>`.

## Risks / Trade-offs

- Only the first 100 cards are shown; more cards would be silently hidden until pagination is added. Accepted for the MVP; follow-up issue.
- Luminance-based text colour handles hex and named CSS colours only if parsed; unsupported formats fall back to the default tile, so a user-chosen exotic colour is not shown. The contract does not restrict `color` format, so this limitation is documented rather than solved.
- `resource()` is still marked experimental in some Angular versions; confirm its status in Angular 22 while implementing and note it in the code if so.
