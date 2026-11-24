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

1. **Scaffold in a scratch directory, then move into the repo root.** Create an empty workspace with `create-nx-workspace` (preset `apps`, npm) in a temporary directory, add the Angular plugin (`nx add @nx/angular`) and generate the app with `nx g @nx/angular:application` (name `web`, standalone, routing, CSS, zoneless, no SSR, no e2e, Vitest). Copy the result into the repo root, merging with the existing `LICENSE`, `.claude/` and `openspec/`, and leave out generator extras that are out of scope (AI-agent folders, `AGENTS.md`/`CLAUDE.md`, `.github` CI). Alternatives: (a) `create-nx-workspace` with the Angular preset – rejected, the current CLI ignores the app-level flags and produces a full-stack template (shop app, API, e2e, SSR, `zone.js`); (b) `nx init` inside the existing repo – rejected because it targets adding Nx to existing projects and would not generate the Angular app.
2. **TypeScript setup: path-based, not project references.** The empty preset uses TypeScript project references, which `@nx/angular` rejects. Replace the root `tsconfig.base.json` with a plain path-based base config, drop the `@nx/js/typescript` plugin and the `packages/*` workspaces entry. Do not use `NX_IGNORE_UNSUPPORTED_TS_SETUP`; it only silences the error.
3. **Layout: `apps/web` with Nx integrated-style workspace, single app, no `libs/` yet.** Matches the issue wording. Alternative: package-based monorepo – rejected, the issue explicitly asks for `nx serve web`.
4. **Zoneless + signals + standalone.** Generate with `--zoneless`: Angular 22 apps are zoneless by default, so no `provideZonelessChangeDetection()` call is needed and `zone.js` is absent from polyfills and dependencies. Use the Angular version the current Nx generator targets. Verify the generated app has no zone.js reference.
5. **Routing shell.** `app.routes.ts` with a root route lazily loading a placeholder page component and a wildcard route redirecting to root. Keeps the shell "empty" yet proves routing.
6. **Lint and format.** ESLint flat config via Nx/angular-eslint; Prettier with the generator's `.prettierrc`; add a `format:check` npm script. Alternative: Biome – rejected, issue says ESLint and Prettier.
7. **Unit test runner: Vitest** (chosen by the user), selected with `--unitTestRunner=vitest-angular` (Angular's own `unit-test` builder running Vitest). Alternatives: `vitest-analog` – not chosen, the Angular builder is the framework-native option; Jest (older Nx default) – rejected per user preference.
8. **Package manager: npm**, with the lockfile committed. Assumption, since the issue does not state one.
9. **Node pin:** add `.nvmrc` containing `24` and set `engines.node` in `package.json`, so `nvm use` selects a working runtime.

## Risks / Trade-offs

- Shell defaults to Node 12 in this directory → `.nvmrc` plus README note; run commands under Node 24 until the shell default is fixed.
- Generator defaults change between Nx versions → record the generated Nx/Angular versions in the README and commit the lockfile.
- Copying a scratch scaffold can drop hidden files (`.gitignore`, `.editorconfig`, `.vscode`) → verify with a directory listing after the move.
- Zoneless apps break libraries that rely on zone.js → none are used yet; revisit when adding dependencies.
