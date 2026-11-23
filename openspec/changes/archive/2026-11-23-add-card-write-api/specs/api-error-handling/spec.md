# Spec Delta

## ADDED Requirements

### Requirement: Conflicting updates return a 409 problem
When a request fails because the target resource was changed by someone else since the client read it, the API SHALL respond 409 with content type `application/problem+json` and the standard problem fields. The detail SHALL be generic and SHALL NOT expose persistence internals.

#### Scenario: Optimistic locking conflict
- **WHEN** an update is rejected because its version is stale
- **THEN** the response is 409 with content type `application/problem+json`, `status` 409, and a body that contains no exception class name or SQL

#### Scenario: Contract describes the conflict
- **WHEN** a developer opens the contract
- **THEN** it defines a reusable 409 response that references the problem schema
