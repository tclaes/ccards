# local-dev-stack Specification

## Purpose
Defines the local development environment for the ccards backend: a Docker Compose stack with PostgreSQL and Mailpit, and a `local` Spring profile through which the backend connects to it. It lets a developer run the backend against real infrastructure without installing anything besides Docker.

## Requirements

### Requirement: Compose starts PostgreSQL and Mailpit
Running `docker compose up` in `apps/api` SHALL start a PostgreSQL service and a Mailpit service, each reachable from the host on its documented port. PostgreSQL SHALL report healthy once it accepts connections.

#### Scenario: Start the stack
- **WHEN** a developer with Docker runs `docker compose up -d` in `apps/api` on a fresh checkout
- **THEN** PostgreSQL and Mailpit containers are running, PostgreSQL accepts connections on its documented host port, and the Mailpit web UI answers over HTTP on its documented port

#### Scenario: Start without a custom env file
- **WHEN** a developer starts the stack without creating a `.env` file
- **THEN** the services start with the default local values from the compose file

#### Scenario: Port already in use
- **WHEN** a host port required by the stack is already taken and the developer runs `docker compose up`
- **THEN** compose fails for that service and the output names the conflicting port

### Requirement: Database data persists across restarts
PostgreSQL data SHALL be kept in a named volume so that stopping and restarting the stack does not lose data. Removing the volume SHALL reset the database to empty.

#### Scenario: Restart keeps data
- **WHEN** a developer creates a table, runs `docker compose down` and then `docker compose up -d`
- **THEN** the table still exists

#### Scenario: Reset the database
- **WHEN** a developer runs `docker compose down -v` and starts the stack again
- **THEN** the database is empty

### Requirement: Local credentials are for local use only
The compose file and `.env.example` SHALL contain only development credentials, and a developer's own `.env` SHALL NOT be tracked by git. Database and mail ports SHALL be published only on the loopback interface.

#### Scenario: Env file is ignored
- **WHEN** a developer copies `.env.example` to `.env`
- **THEN** `git status` does not list `.env`

#### Scenario: Not reachable from the network
- **WHEN** the stack is running and another machine on the network connects to the host's PostgreSQL port
- **THEN** the connection is refused

### Requirement: Local profile connects the backend to the stack
When the Spring profile `local` is active, the backend SHALL connect to the compose PostgreSQL database using the `.env.example` defaults and SHALL be configured to send mail to the Mailpit SMTP port. The health endpoint SHALL report `{"status":"UP"}` only while the database is reachable.

#### Scenario: Backend starts against running stack
- **WHEN** the stack is running and a developer runs `nx serve api --configuration=local`
- **THEN** the backend starts with the `local` profile and `GET /api/health` returns 200 with `{"status":"UP"}`

#### Scenario: Database unavailable
- **WHEN** the `local` profile is active and PostgreSQL is not running
- **THEN** `GET /api/health` returns a non-200 status with `{"status":"DOWN"}` (or the backend fails to start and logs the connection error)

#### Scenario: Mail goes to Mailpit
- **WHEN** the `local` profile is active and the backend sends a test email to the configured SMTP port
- **THEN** the message appears in the Mailpit web UI and is not delivered to any external address

### Requirement: Default profile needs no infrastructure
Without the `local` profile, the backend SHALL start and pass `nx test api` with neither the compose stack nor any database or mail server running.

#### Scenario: Tests without Docker
- **WHEN** a developer without a running stack runs `nx test api`
- **THEN** the tests pass and the application context starts without trying to connect to a database

#### Scenario: Default serve unchanged
- **WHEN** a developer without a running stack runs `nx serve api` (no configuration)
- **THEN** the service starts on port 8080 and `GET /api/health` returns `{"status":"UP"}`

### Requirement: Local stack is documented
The README SHALL describe how to start, stop and reset the stack, the host ports and credentials, where the Mailpit UI is, and how to start the backend with the `local` profile.

#### Scenario: Follow the README
- **WHEN** a new developer follows only the README's local stack section on a machine with Docker and JDK 21
- **THEN** they reach a running backend with `/api/health` returning `{"status":"UP"}` and can open the Mailpit UI
