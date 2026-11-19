# Tasks

## 1. Workspace scaffold

- [x] 1.1 Under Node 24, generate an Angular (standalone) Nx workspace with app `web`, npm and Vitest as unit-test runner in a scratch directory; verify `nx.json` and `apps/web` exist there and `vitest` is configured (no Jest dependencies)
- [x] 1.2 Move the scaffold into the repo root, keeping `LICENSE`, `.claude/` and `openspec/`; verify `git status` shows the new files, no deleted files, and hidden files (`.gitignore`, `.prettierrc`, `.editorconfig`) are present
- [x] 1.3 Add `.nvmrc` (`24`) and `engines.node` in `package.json`; verify `nvm use` selects Node 24 and `npm install` succeeds with a committed lockfile

## 2. Zoneless app shell with routing

- [x] 2.1 Configure zoneless change detection and remove `zone.js` from dependencies and polyfills; verify `grep -r zone.js` over `apps/` and `package.json` finds nothing
- [x] 2.2 Add `app.routes.ts` with a lazy root route rendering a placeholder page and a wildcard redirect to root; verify with a router unit test covering root and unknown-route behavior
- [x] 2.3 Verify `nx serve web` serves the shell: open the root URL, check no console errors and that navigating to an unknown URL does not crash

## 3. Lint, format and tests

- [x] 3.1 Confirm the ESLint config covers `apps/web`; verify `nx lint web` exits 0, and that a deliberately introduced violation makes it fail (revert afterwards)
- [x] 3.2 Add a `format:check` script using Prettier; verify it exits 0 on the scaffold
- [x] 3.3 Ensure a smoke test for the app component renders the shell; verify `nx test web` runs at least one test via Vitest and exits 0

## 4. Documentation and integration

- [x] 4.1 Add a README section with Node requirement, Nx/Angular/Vitest versions and the `serve`, `lint`, `test`, `build` commands; verify each documented command runs as written
- [x] 4.2 Run `nx serve web`, `nx lint web`, `nx test web` and `nx build web` from a clean clone with `npm ci`; verify all succeed and match issue #1 acceptance criteria

## Workflow follow-up

- Archive the change after review (`/opsx:archive`) so `web-app-shell` becomes a main spec.
- Check off the acceptance criteria on issue #1 once merged.
