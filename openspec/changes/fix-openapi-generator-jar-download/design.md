# Design

## Context

`libs/api-contract:validate` and `libs/api-client:generate` call `openapi-generator-cli`, which downloads the JAR named in `openapitools.json` (7.27.0) into `node_modules/@openapitools/openapi-generator-cli/versions/` on first use. `ci.yml` runs `npx nx affected -t lint test build --parallel=3` right after `npm ci`, so concurrent tasks race on that download. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- One download, before the parallel run.
- Cache hit skips the download entirely.

**Non-Goals:**
- No change to Nx targets, `dependsOn` or parallelism (local runs keep working as today).
- The Maven generator plugin is unaffected (it uses its own artifact, cached by `setup-java`).

## Decisions

- **Prefetch step in `ci.yml`, after `npm ci`:** run `npx openapi-generator-cli version`, which resolves and downloads the JAR without generating anything. Alternative: make one Nx task a dependency of the others. Rejected: it couples unrelated projects and leaves local `nx` runs racing too.
- **`actions/cache@v4` on `node_modules/@openapitools/openapi-generator-cli/versions`, key `openapi-generator-${{ hashFiles('openapitools.json') }}`,** placed after `npm ci` (which wipes `node_modules`) and before the prefetch step. On a hit the prefetch is a no-op.
- Caches are saved only when the job succeeds, so a failed or partial download is never stored.

## Risks / Trade-offs

- [Corrupt JAR restored from cache] → the key changes with the version, and a failed run never saves; delete the cache entry if it ever happens.
- [The capability `ci-pipeline` is created by the unarchived `add-ci-pipeline`] → archive `add-ci-pipeline` first; otherwise archiving this change creates the main spec with only this requirement.
