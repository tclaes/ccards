# Design

## Context

- Nx 24 workspace with two projects: `web` (Angular, Vitest, `lint` inferred by `@nx/eslint/plugin`, `build`, `test`) and `api` (Spring Boot / Maven, hand-written `build` and `test` targets that shell out to `./mvnw`). `api` has **no** `lint` target.
- `.nvmrc` pins Node 24; `apps/api/pom.xml` targets Java 21.
- `nx test api` is cached and its inputs include a runtime hash of whether Docker is up, because `FlywayMigrationTests` (Testcontainers, `disabledWithoutDocker = true`) runs only with Docker (CC-04).
- The repo is public, has no branch protection or rulesets on `main`, and the current user has admin rights, so protection can be set with `gh api`.
- Squash-merge PR flow is used (see git history), so `main` receives one commit per PR.

## Goals / Non-Goals

**Goals:**
- One workflow that is fast on small changes (affected-only) and correct on all of them.
- A single required status check name that does not change when jobs are added or renamed.
- CI runs the same commands a developer runs locally.

**Non-Goals:**
- Nx Cloud / remote caching, matrix builds, e2e, format checks, deployment.
- Adding Java linting (Checkstyle/Spotless). `api` has no lint target today; adding one is its own change.

## Decisions

### D1. One workflow, one `nx affected` job, one aggregate gate
`.github/workflows/ci.yml` triggers on `pull_request` and `push` to `main`. A `check` job runs `npx nx affected -t lint test build --parallel=3`. Jobs per project (matrix) were rejected: they duplicate checkout/install/cache work and Nx already orchestrates dependencies and parallelism.

The required status check is the job's name (`CI`). With one job there is no need for a separate "gate" job; if the workflow is later split into several jobs, a final `needs: [...]` + `if: always()` job named `CI` keeps the required name stable. `nx affected` with no affected projects exits 0, which gives the "no project affected" scenario for free.

### D2. Affected base via `nrwl/nx-set-shas` with full history
Checkout uses `fetch-depth: 0` and `nrwl/nx-set-shas@v4` sets `NX_BASE`/`NX_HEAD`: for PRs the merge-base with the target branch, for `main` pushes the last successful CI run's commit. Alternative: `--base=origin/main` by hand — rejected because it checks too much after a failed main run and needs manual fetch logic. Note: on `main`, if there is no earlier successful run, the action falls back to the previous commit, which is acceptable.

### D3. Toolchain and caching
`actions/setup-node` with `node-version-file: .nvmrc` and `cache: npm`; `npm ci`. `actions/setup-java` Temurin 21 with `cache: maven`. The Maven wrapper is used by the Nx targets, so no separate Maven install. GitHub-hosted `ubuntu-latest` already ships Docker, so Testcontainers needs no extra setup (spec: backend tests run against real infrastructure). The Nx local cache is not persisted between runs (no remote cache); the Docker-state input on `api:test` is identical on every runner, so no stale-cache risk.

Alternative considered: pin the runner image (`ubuntu-24.04`) rather than `ubuntu-latest`. Chosen: pin to `ubuntu-24.04` for reproducibility; bumping is a one-line change.

### D4. No `api` lint target in this change
The issue says lint, test and build "of web and api". `nx affected -t lint` simply skips projects without the target, so `api` is covered by test and build (compile) only. Adding Checkstyle/Spotless would add a build plugin, a ruleset to agree on and likely a pile of violations to fix; that is a separate decision and is listed as a follow-up in the README rather than smuggled into CI setup.

### D5. Branch protection through `gh api`, documented, not code
Protection is repository state, not a file, so it is applied once with `gh api -X PUT repos/tclaes/ccards/branches/main/protection` (required check `CI`, `strict: false`, PRs required, no force pushes/deletions, `enforce_admins: false`) and the exact command is recorded in the README. `enforce_admins: false` keeps the owner able to recover from a broken pipeline; `strict: false` avoids forcing a rebase on every merge in a single-developer repo. Alternative: GitHub Rulesets — equivalent, but classic protection has a simpler single-command API. The required check only becomes selectable after the workflow has run once, so the protection is applied **after** the first CI run on the PR branch.

### D6. Concurrency and permissions
`concurrency: group: ci-${{ github.ref }}, cancel-in-progress: true` for PRs only (not on `main`, so every main commit is checked). `permissions: contents: read` at workflow level (least privilege; no secrets are needed).

## Risks / Trade-offs

- [Docker-dependent API test is slow or flaky on a cold runner (image pull of `postgres:17`)] → job timeout of 20 minutes; failure surfaces clearly; revisit caching only if it becomes a problem.
- [Required check name `CI` is renamed by accident and merges are blocked] → name is called out in the workflow with a comment and in the README; the spec scenario "Merge with passing checks" is verified after setup.
- [`nx affected` misses a dependency, so a real break is not checked] → `sharedGlobals` in `nx.json` is currently empty; root config changes (`package.json`, `nx.json`, `tsconfig.base.json`, `.github/**`) should affect everything. Add them to `sharedGlobals` as part of this change.
- [Branch protection blocks the owner's direct pushes] → intended; `enforce_admins: false` leaves an emergency escape hatch.
- [Protection applied before the check has ever run makes PRs unmergeable] → apply it only after a green run exists (ordering in tasks).

## Migration Plan

1. Merge the workflow PR (it runs against itself).
2. Apply branch protection with the documented command once the `CI` check has run.
3. Rollback: delete the protection rule (`gh api -X DELETE .../protection`) and revert the workflow file.
