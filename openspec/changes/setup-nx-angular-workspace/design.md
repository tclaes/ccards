# Design

## Context

The repository is greenfield: it holds only `LICENSE`, `.claude/` and `openspec/`, on branch `main` tracking `tclaes/ccards`. See proposal.md for motivation.

Observed environment constraints:
- This machine has many Node versions under nvm. In the project directory the default `node` resolved to v12.22.1, which cannot run current Nx/Angular tooling (and broke the OpenSpec CLI). Node 24.21.0 is installed and works.
- `create-nx-workspace` expects an empty target directory, but the repo root already contains files that must be kept.

## Goals / Non-Goals

**Goals:**
- A workspace that satisfies the web-app-shell spec using generator defaults wherever possible, so later upgrades via `nx migrate` stay straightforward.
- Pin the Node version so every shell and CI picks a compatible runtime.

**Non-Goals:**
- Extra apps or libraries (`libs/`, shared UI, API) – added by later issues when needed.
- CI, deployment, SSR, PWA, styling frameworks, state libraries.

## Decisions

1. **Scaffold in a scratch directory, then move into the repo root.** Generate with `create-nx-workspace` (preset: Angular, standalone, app name `web`, no SSR, CSS styles, npm) in a temporary directory, then copy the result into the repo root, merging with the existing `LICENSE`, `.claude/` and `openspec/`. Alternative: `nx init` inside the existing repo – rejected because it targets adding Nx to existing projects and would not generate the Angular app.
2. **Layout: `apps/web` with Nx integrated-style workspace, single app, no `libs/` yet.** Matches the issue wording. Alternative: package-based monorepo – rejected, the issue explicitly asks for `nx serve web`.
3. **Zoneless + signals + standalone.** Use `provideZonelessChangeDetection()` and omit `zone.js` from polyfills and dependencies. Use the Angular version the current Nx generator targets, as long as it supports zoneless. Verify the generated app has no zone.js reference.
4. **Routing shell.** `app.routes.ts` with a root route lazily loading a placeholder page component and a wildcard route redirecting to root. Keeps the shell "empty" yet proves routing.
5. **Lint and format.** ESLint flat config via Nx/angular-eslint; Prettier with the generator's `.prettierrc`; add a `format:check` npm script. Alternative: Biome – rejected, issue says ESLint and Prettier.
6. **Unit test runner: Vitest** (chosen by the user), selected via the generator's unit-test-runner option. Alternative: Jest (older Nx default) – rejected per user preference. If the generator cannot produce a Vitest setup for Angular, add it with the Nx Vitest/analog integration rather than falling back to Jest.
7. **Package manager: npm**, with the lockfile committed. Assumption, since the issue does not state one.
8. **Node pin:** add `.nvmrc` containing `24` and set `engines.node` in `package.json`, so `nvm use` selects a working runtime.

## Risks / Trade-offs

- Shell defaults to Node 12 in this directory → `.nvmrc` plus README note; run commands under Node 24 until the shell default is fixed.
- Generator defaults change between Nx versions → record the generated Nx/Angular versions in the README and commit the lockfile.
- Copying a scratch scaffold can drop hidden files (`.gitignore`, `.editorconfig`, `.vscode`) → verify with a directory listing after the move.
- Zoneless apps break libraries that rely on zone.js → none are used yet; revisit when adding dependencies.
