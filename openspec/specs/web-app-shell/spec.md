# web-app-shell Specification

## Purpose
Defines the baseline behavior of the ccards web application: a routed, empty shell that developers can serve locally, lint and test through the workspace tooling. All later features build on this shell.

## Requirements

### Requirement: Dev server serves a routed empty shell
Running `nx serve web` SHALL start a local development server that serves the web application as an empty shell with client-side routing active.

#### Scenario: Root route renders the shell
- **WHEN** a developer runs `nx serve web` and opens the root URL in a browser
- **THEN** the page loads without console errors and shows the application shell with no feature content

#### Scenario: Navigation stays client-side
- **WHEN** a user navigates between routes defined in the shell
- **THEN** the URL changes and the matching view renders without a full page reload

#### Scenario: Unknown route
- **WHEN** a user opens a URL that matches no defined route
- **THEN** the application does not crash and shows a defined fallback (redirect to root or a not-found view)

### Requirement: Lint command passes on a clean workspace
`nx lint web` SHALL run the workspace lint rules against the web app and exit with status 0 when the code conforms.

#### Scenario: Lint on fresh scaffold
- **WHEN** a developer runs `nx lint web` on the unmodified workspace
- **THEN** the command exits with status 0 and reports no errors

#### Scenario: Lint violation is reported
- **WHEN** the web app contains code that violates a configured lint rule
- **THEN** `nx lint web` exits with a non-zero status and names the violating file and rule

### Requirement: Test command passes on a clean workspace
`nx test web` SHALL execute the web app's unit tests and exit with status 0 when all tests pass.

#### Scenario: Tests on fresh scaffold
- **WHEN** a developer runs `nx test web` on the unmodified workspace
- **THEN** at least one test runs, all tests pass and the command exits with status 0

#### Scenario: Failing test is reported
- **WHEN** a unit test in the web app fails
- **THEN** `nx test web` exits with a non-zero status and shows the failing test

### Requirement: Code formatting is enforced by tooling
The workspace SHALL provide a Prettier configuration so formatting can be checked and applied consistently.

#### Scenario: Format check on fresh scaffold
- **WHEN** a developer runs the Prettier check across the workspace on the unmodified scaffold
- **THEN** it reports no formatting differences
