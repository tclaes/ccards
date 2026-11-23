# Tasks

## 1. CI workflow

- [x] 1.1 In `.github/workflows/ci.yml`, add an `actions/cache@v4` step after `npm ci` for `node_modules/@openapitools/openapi-generator-cli/versions`, keyed on `hashFiles('openapitools.json')`; verify the workflow YAML parses (e.g. `actionlint` or `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml'))"`)
- [x] 1.2 Add a step after the cache step running `npx openapi-generator-cli version`, before the `nx affected` step; verify locally that it downloads the JAR when `versions/` is empty and is a no-op when present
- [ ] 1.3 Verify on the PR: the first run shows a cache miss with one download, a re-run shows a cache hit, and `nx affected` tasks log no download

## 2. Documentation

- [x] 2.1 Note the prefetch and cache in the CI section of `README.md` (if one exists) and verify the text matches `ci.yml`

## Workflow follow-up

- Archive `add-ci-pipeline` before archiving this change.
- Over the next PR runs, confirm the jarfile error does not recur (issue acceptance criterion).
