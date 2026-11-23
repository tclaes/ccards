# Spec Delta

## Purpose

Defines the automated quality gate for the ccards repository: which checks run on a change, when, and how a failing check keeps the change out of `main`.

## ADDED Requirements

### Requirement: Generator tooling is fetched once per run
The pipeline SHALL obtain the OpenAPI generator JAR in a single step that completes before any lint, test or build task starts, and SHALL reuse a cached copy when `openapitools.json` is unchanged. Parallel tasks SHALL NOT download it themselves.

#### Scenario: Cold runner
- **WHEN** a run starts with no cached generator JAR
- **THEN** the JAR is downloaded once, before the affected tasks start, and no task downloads it again

#### Scenario: Warm cache
- **WHEN** a run starts and the cache holds the JAR for the current `openapitools.json`
- **THEN** no download takes place

#### Scenario: Generator version changes
- **WHEN** a pull request changes the generator version in `openapitools.json`
- **THEN** the cache is missed and the new JAR is downloaded once before the affected tasks start

#### Scenario: Parallel generator tasks
- **WHEN** several affected projects run generator tasks in parallel
- **THEN** none fails with a missing or unreadable generator JAR
