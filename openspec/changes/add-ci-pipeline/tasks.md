# Tasks

Prerequisite: CC-01, CC-02 and CC-04 are on the base branch.

## 1. Workflow

- [x] 1.1 Add root config files that should affect every project (`package.json`, `package-lock.json`, `nx.json`, `tsconfig.base.json`, `eslint.config.mjs`, `.nvmrc`) to `sharedGlobals` in `nx.json`; verify `npx nx show projects --affected --files=package.json` lists `api` and `web`
- [x] 1.2 Create `.github/workflows/ci.yml` per design D1-D3 and D6 (triggers, `ubuntu-24.04`, `fetch-depth: 0`, `nrwl/nx-set-shas`, Node from `.nvmrc`, Java 21, npm/Maven caches, `npm ci`, `npx nx affected -t lint test build`, job named `CI`, concurrency, read-only permissions, 20 minute timeout); verify the file passes `npx prettier --check .github/workflows/ci.yml` and `actionlint` (or `npx -y @action-validator/cli`) if available
- [x] 1.3 Reproduce the CI command locally: `NX_BASE=main NX_HEAD=HEAD npx nx affected -t lint test build`; verify it exits 0 and runs `web:lint`, `web:test`, `web:build`, `api:test`, `api:build` when both projects are affected (e.g. with `--all`)
- [ ] 1.4 Open the PR and verify the `CI` check runs on it, that the API test log shows `FlywayMigrationTests` executed (not skipped), and that a docs-only commit finishes green with no project tasks
- [ ] 1.5 Prove the gate fails: push a throwaway commit that breaks a `web` unit test, verify `CI` reports failure naming `web:test`; then revert it and verify `CI` is green again

## 2. Branch protection and docs

- [x] 2.1 After a green `CI` run exists, apply protection to `main` with `gh api -X PUT repos/tclaes/ccards/branches/main/protection` (required check `CI`, PRs required, no force push/deletion, `enforce_admins: false`); verify with `gh api repos/tclaes/ccards/branches/main/protection --jq '.required_status_checks.contexts'` returning `["CI"]`
- [ ] 2.2 Verify protection works: `git push origin HEAD:main` from a scratch commit is rejected, and the PR's merge button is blocked while `CI` is failing or pending (use the throwaway failing commit from 1.5 before reverting it, or a second test PR)
- [ ] 2.3 Add a "Continuous integration" section to `README.md`: what runs and when, the local reproduction command, the required `CI` check and the exact `gh api` protection command, and the note that `api` has no lint target yet; verify the documented commands run as written
- [ ] 2.4 Run `openspec validate add-ci-pipeline --strict`, `npx nx affected -t lint test build` and `npm run format:check`; verify all pass

## Workflow follow-up

- Archive the change after the PR merges and branch protection is confirmed active.
- Possible later stories: Java lint (Checkstyle/Spotless), e2e job, Nx Cloud remote cache, Dependabot.
