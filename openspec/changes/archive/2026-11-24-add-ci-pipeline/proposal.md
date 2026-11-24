# Proposal

## Why

The repository has a web app, an API and a growing test suite (CC-01 to CC-04), but nothing runs them automatically. A broken lint rule, test or build can reach `main` unnoticed, and every upcoming story would add more surface to break. Adding CI now, while the workspace is small, gives each following PR an automatic quality gate. See GitHub issue CC-06.

## What Changes

- Add a GitHub Actions workflow that runs on every pull request and on pushes to `main`, and runs `lint`, `test` and `build` for the `web` and `api` projects via `nx affected`, so only projects touched by the change are checked.
- Set up the runner for this workspace: Node from `.nvmrc` (24), Java 21, npm and Maven dependency caching, and full git history so Nx can compute the affected set against the PR base.
- Run the API tests with Docker available on the runner, so the Testcontainers-based `FlywayMigrationTests` actually execute in CI instead of being skipped.
- Add a single aggregate job (one stable check name) that fails if any affected task failed, so branch protection needs only one required check.
- Make that check required on `main` through branch protection (repository setting, applied with `gh api`), and document the setup in `README.md`.

Out of scope: end-to-end tests (no suite yet), format checks, deployment/CD, release workflows (CC-37), Nx Cloud / remote cache, dependency update bots.

## Capabilities

### New Capabilities
- `ci-pipeline`: every pull request is automatically linted, tested and built for the affected projects, and `main` only accepts changes whose checks pass.

### Modified Capabilities
<!-- None. Existing capabilities (`web-app-shell`, `api-service`, `local-dev-stack`, `database-migrations`) keep their requirements; they are only exercised by CI. -->

## Impact

- New: `.github/workflows/ci.yml`.
- Changed: `README.md` (CI section: what runs, how to reproduce locally, branch protection). Possibly `apps/api/project.json` if an `api` `lint` target is needed (see design D4).
- Repository settings (outside the codebase): branch protection rule on `main` requiring the CI check. Needs repository admin rights.
- Depends on: CC-01 (Nx workspace), CC-02 (API), CC-04 (Flyway tests that use Docker) all merged on `main`.
