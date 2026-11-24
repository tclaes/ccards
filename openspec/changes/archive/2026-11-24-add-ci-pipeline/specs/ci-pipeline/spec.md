# Spec Delta

## Purpose

Defines the automated quality gate for the ccards repository: which checks run on a change, when, and how a failing check keeps the change out of `main`.

## ADDED Requirements

### Requirement: Checks run on every pull request
The repository SHALL automatically run lint, test and build for the projects affected by a change whenever a pull request is opened or updated, and whenever a commit lands on `main`. A project is affected when it, or something it depends on, changed relative to the pull request's base.

#### Scenario: Pull request touches the web app
- **WHEN** a pull request changes only files under `apps/web`
- **THEN** lint, test and build run for `web`, and the result is reported on the pull request

#### Scenario: Pull request touches the API
- **WHEN** a pull request changes files under `apps/api`
- **THEN** test and build run for `api`, and the result is reported on the pull request

#### Scenario: Change affects no project
- **WHEN** a pull request changes only files outside any project (for example `README.md`)
- **THEN** the checks complete successfully without running project tasks

#### Scenario: New commits are pushed
- **WHEN** a new commit is pushed to a pull request while an earlier check run for it is still in progress
- **THEN** the earlier run is cancelled and the new commit is checked

### Requirement: A failing check fails the pipeline
The pipeline SHALL report failure when any lint, test or build task of an affected project fails, and SHALL report success only when all of them pass. It SHALL expose one aggregate result under a stable name.

#### Scenario: A test fails
- **WHEN** a pull request breaks a unit test in an affected project
- **THEN** the pipeline result for that pull request is failed and names the failing task

#### Scenario: All tasks pass
- **WHEN** every lint, test and build task of the affected projects succeeds
- **THEN** the aggregate pipeline result is successful

### Requirement: Backend tests run against real infrastructure in CI
The pipeline SHALL run the API tests in an environment where Docker is available, so tests that need a real PostgreSQL are executed and not skipped.

#### Scenario: Migration test in CI
- **WHEN** the API tests run in the pipeline
- **THEN** `FlywayMigrationTests` is executed against a real PostgreSQL and is not reported as skipped

### Requirement: Main requires passing checks
The `main` branch SHALL accept changes only through pull requests whose aggregate pipeline result is successful. Direct pushes to `main` and merges with a failing or missing result SHALL be rejected.

#### Scenario: Merge with failing checks
- **WHEN** a pull request has a failed aggregate pipeline result
- **THEN** it cannot be merged into `main`

#### Scenario: Merge with passing checks
- **WHEN** a pull request has a successful aggregate pipeline result
- **THEN** it can be merged into `main`

#### Scenario: Direct push
- **WHEN** someone attempts to push a commit directly to `main`
- **THEN** the push is rejected
