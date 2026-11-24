# Proposal

## Why

CI on PR #49 failed once with `Unable to access jarfile .../openapi-generator-cli/versions/7.27.0.jar` and passed on a plain re-run of the same commit. `nx affected --parallel=3` starts several generator tasks at once on a fresh runner; each one downloads the generator JAR, so a task can run while another is still writing it. Flaky checks cost re-runs and erode trust in the required `CI` status.

## What Changes

- Add a CI step before the parallel `nx` run that downloads the generator JAR once.
- Cache the JAR between runs, keyed on `openapitools.json`, so it is not fetched on every run.
- Record the reliability requirement in the CI pipeline spec.

## Capabilities

### New Capabilities
- `ci-pipeline`: the delta adds one requirement (generator JAR fetched once, cached). The capability itself is introduced by the unarchived `add-ci-pipeline` change; see design.md for archive order.

### Modified Capabilities

## Impact

- `.github/workflows/ci.yml` only (the `CI` job; its name and the branch protection stay unchanged).
- No application code, no Nx project config, no dependency changes.
