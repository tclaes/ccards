# api-contract Specification

## Purpose
Defines how the ccards HTTP API is specified: a single OpenAPI document is the source of truth, the backend and frontend code that depends on it is generated from it, and the running API exposes interactive documentation of it. It keeps frontend and backend from drifting apart.

## Requirements

### Requirement: The OpenAPI document is the source of truth
The project SHALL define the HTTP API in one OpenAPI document at `libs/api-contract/openapi.yaml`. The build SHALL fail when that document is not valid OpenAPI.

#### Scenario: Contract describes the existing endpoint
- **WHEN** a developer opens the contract
- **THEN** it describes `GET /api/health` returning a `Health` object with a `status` field

#### Scenario: Invalid contract
- **WHEN** the contract contains an invalid OpenAPI construct and the project is built
- **THEN** the build fails and the error identifies the problem in the contract

### Requirement: Backend interfaces and DTOs are generated from the contract
The backend build SHALL generate the Java controller interfaces and DTOs from the contract, without generating implementations, and SHALL NOT require generated files to be committed. Controllers implement the generated interfaces.

#### Scenario: Contract change reaches the backend
- **WHEN** a developer adds a field to a schema in the contract and builds the API
- **THEN** the generated DTO contains that field without any hand edit

#### Scenario: Breaking contract change fails the backend build
- **WHEN** an operation is renamed in the contract and a controller still implements the old generated interface
- **THEN** the backend build fails to compile

### Requirement: A TypeScript client is generated from the contract
The workspace SHALL provide a library `libs/api-client` whose typed TypeScript client for the web app is generated from the contract at build time. Generated files SHALL NOT be committed, and the web app SHALL import the client through a single workspace import path.

#### Scenario: Client is available after a clean checkout
- **WHEN** a developer clones the repository, installs dependencies and builds the web app
- **THEN** the client is generated first and the web app compiles against its types

#### Scenario: Contract change reaches the frontend
- **WHEN** a developer renames a schema field in the contract and rebuilds the web app
- **THEN** the generated client has the new name, and web code still using the old name fails to compile

### Requirement: Interactive API documentation is served at /swagger-ui
The API SHALL serve Swagger UI at `/swagger-ui`, rendering the same contract document the code is generated from, in every profile and without a database.

#### Scenario: Open the documentation
- **WHEN** a client requests `/swagger-ui` on a running API
- **THEN** the Swagger UI page is served and lists `GET /api/health`

#### Scenario: Documentation matches the contract
- **WHEN** a client requests the served contract document
- **THEN** its content is the same as `libs/api-contract/openapi.yaml`
