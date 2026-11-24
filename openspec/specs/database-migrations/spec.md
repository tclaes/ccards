# database-migrations Specification

## Purpose
Defines how the ccards backend creates and evolves its database schema: through versioned, reviewable migrations applied automatically at startup, with the ORM only validating the result. It gives every environment a reproducible schema and a history of how it got there.

## Requirements

### Requirement: Migrations run at startup
When the backend starts with a database configured, it SHALL apply every pending versioned migration before it accepts requests, and SHALL record each applied migration in a schema history. Applying migrations to an up-to-date database SHALL change nothing.

#### Scenario: First start on an empty database
- **WHEN** the backend starts with the `local` profile against an empty PostgreSQL database
- **THEN** the initial migration `V1__init.sql` is applied and recorded as successful in the schema history, and the backend reports healthy

#### Scenario: Restart on an up-to-date database
- **WHEN** the backend starts again against a database that already has all migrations applied
- **THEN** no migration is applied again and the schema history is unchanged

#### Scenario: A migration fails
- **WHEN** a pending migration contains invalid SQL
- **THEN** the backend fails to start and the error identifies the failing migration

### Requirement: Applied migrations are immutable
The backend SHALL refuse to start when the content of an already applied migration differs from what was recorded, so that all environments share one schema history.

#### Scenario: Edited migration
- **WHEN** a developer changes the contents of `V1__init.sql` after it has been applied to a database and starts the backend against that database
- **THEN** startup fails with a checksum mismatch naming that migration

### Requirement: The ORM never changes the schema
The schema SHALL be created and changed only by migrations. The persistence layer SHALL validate entity mappings against the migrated schema at startup and SHALL NOT create, update or drop schema objects.

#### Scenario: Entity does not match the schema
- **WHEN** an entity maps to a table or column that no migration has created
- **THEN** the backend fails to start with a validation error naming the missing object, and the database is left unchanged

#### Scenario: Entities match the schema
- **WHEN** all entity mappings correspond to objects created by migrations
- **THEN** the backend starts normally

### Requirement: Default profile stays database-free
Starting the backend without the `local` profile, as `nx test api` does, SHALL NOT require a database, run migrations or validate the schema.

#### Scenario: Start without a database
- **WHEN** the backend starts with the default profile and no database is running
- **THEN** it starts successfully and `/api/health` returns `{"status":"UP"}`
