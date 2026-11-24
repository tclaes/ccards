# Proposal

## Why

The `ccards` repository contains only a LICENSE, so there is nothing to build features on. Issue #1 (CC-01, Epic 0 – Fundament) asks for the foundation every later issue depends on: an Nx monorepo with an Angular web app, plus linting and formatting.

## What Changes

- Create an Nx workspace in the repository root (monorepo layout with `apps/`).
- Add `apps/web`: an Angular application using standalone components, zoneless change detection and signals.
- Provide an empty application shell with routing in place (a root route renders a placeholder page; unknown routes are handled).
- Configure ESLint (via Nx/angular-eslint) and Prettier for the workspace, with `nx lint web` wired up.
- Configure a unit-test runner so `nx test web` runs and passes, with at least one smoke test for the shell.
- Add a short README section documenting the commands (`serve`, `lint`, `test`, `build`).

Out of scope: any card/domain features, backend, CI pipelines, deployment, styling/design system, state management beyond the signals default.

## Capabilities

### New Capabilities
- `web-app-shell`: The Angular web app runs as an empty routed shell and the workspace provides working serve, lint and test commands for it.

### Modified Capabilities

(none – no existing specs)

## Impact

- New files at repo root: `nx.json`, `package.json`, lockfile, `tsconfig.base.json`, ESLint/Prettier configs, `.gitignore`, `.editorconfig`.
- New project `apps/web` (source, project config, tests).
- Introduces Node/npm tooling and the Angular, Nx, ESLint, Prettier and test-runner dependencies.
- The existing `openspec/` and `.claude/` directories are untouched.
- Every later issue builds on this layout (project names, command names `nx serve|lint|test web`).
