# api-service Specification

## Purpose
Defines the baseline behavior of the ccards backend API service: developers can start, build and test it through the workspace tooling, and it reports whether it is up over HTTP. All later backend features run inside this service.

## Requirements

### Requirement: Serve command starts the API on port 8080
Running `nx serve api` from the workspace root SHALL start the backend API service locally, listening for HTTP on port 8080. It SHALL need only a JDK 21 on the machine, with no global Maven install.

#### Scenario: Start the service
- **WHEN** a developer with JDK 21 runs `nx serve api` on a fresh checkout
- **THEN** the service starts, logs that it is listening on port 8080, and keeps running until stopped

#### Scenario: Port already in use
- **WHEN** another process already listens on port 8080 and a developer runs `nx serve api`
- **THEN** the service fails to start and the output states that port 8080 is in use

### Requirement: Health endpoint reports service status
The service SHALL answer `GET /api/health` with HTTP 200 and the JSON body `{"status":"UP"}` while it is running normally. The response SHALL NOT include component details (for example disk space or database state).

#### Scenario: Healthy service
- **WHEN** a client sends `GET http://localhost:8080/api/health` to a running service
- **THEN** the response has status 200, content type `application/json` (or a JSON vendor type), and body `{"status":"UP"}`

#### Scenario: Service not running
- **WHEN** a client sends `GET http://localhost:8080/api/health` and the service is not running
- **THEN** the connection is refused, so callers can treat it as down

### Requirement: Only the health management endpoint is exposed
The service SHALL expose no management or monitoring endpoints over HTTP other than the health endpoint.

#### Scenario: Other management endpoints are not reachable
- **WHEN** a client requests a management path other than health on a running service (for example `/api/env`, `/api/beans` or `/actuator/env`)
- **THEN** the response has status 404 and contains no configuration or environment data

### Requirement: Test command verifies the service
`nx test api` SHALL run the backend's automated tests and exit with status 0 when they pass. The tests SHALL include a check that the application starts and the health endpoint returns `{"status":"UP"}`.

#### Scenario: Tests on a fresh checkout
- **WHEN** a developer runs `nx test api` on the unmodified workspace
- **THEN** at least one test starts the application and checks the health endpoint, all tests pass and the command exits with status 0

#### Scenario: Failing test is reported
- **WHEN** a backend test fails
- **THEN** `nx test api` exits with a non-zero status and the output names the failing test

### Requirement: Build command produces a runnable artifact
`nx build api` SHALL compile the backend and produce a self-contained executable JAR that starts the same service with `java -jar`.

#### Scenario: Build and run the JAR
- **WHEN** a developer runs `nx build api` and then starts the produced JAR with `java -jar`
- **THEN** the service starts on port 8080 and `GET /api/health` returns `{"status":"UP"}`
