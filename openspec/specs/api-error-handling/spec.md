# api-error-handling Specification

## Purpose

Defines how the ccards API reports failures and how the web app shows them to the user: one machine-readable error format (RFC 9457 problem details) on the wire and one central place in the UI where error messages appear.

## Requirements

### Requirement: Failed API requests return RFC 9457 problem details
Every failed request to the API (any 4xx or 5xx produced by the application) SHALL be answered with content type `application/problem+json` and a body containing `title`, `status`, `detail` and `instance`, where `status` equals the HTTP status code of the response. `type` is omitted while no specific problem type is defined, which RFC 9457 defines as `about:blank`.

#### Scenario: Unknown resource path
- **WHEN** a client requests an API path that does not exist
- **THEN** the response is 404 with content type `application/problem+json` and a body whose `status` is 404

#### Scenario: Method not allowed
- **WHEN** a client calls an existing path with an unsupported HTTP method
- **THEN** the response is 405 with content type `application/problem+json`

#### Scenario: Malformed request body
- **WHEN** a client sends a request body that is not valid JSON
- **THEN** the response is 400 with content type `application/problem+json`

### Requirement: Validation failures list every violated field
When request validation fails, the API SHALL respond 400 with a problem body that additionally contains an `errors` list. Each entry SHALL contain the name of the offending field and a human-readable message. All violations of one request SHALL be reported together.

#### Scenario: One invalid field
- **WHEN** a client submits a request with a blank required field `title`
- **THEN** the response is 400 and `errors` contains one entry with field `title` and a non-empty message

#### Scenario: Several invalid fields
- **WHEN** a client submits a request in which two fields are invalid
- **THEN** `errors` contains an entry for each of the two fields

#### Scenario: Invalid parameter outside the body
- **WHEN** a client sends an invalid path or query parameter that has a validation constraint
- **THEN** the response is 400 and `errors` names that parameter

### Requirement: Unexpected errors do not leak internals
When an unhandled exception occurs, the API SHALL respond 500 with a problem body that has a generic `title`/`detail` and SHALL NOT include the exception message, class name or stack trace. The full error SHALL be logged server-side.

#### Scenario: Unhandled exception
- **WHEN** request handling throws an unexpected exception whose message contains internal details
- **THEN** the response is 500 with content type `application/problem+json`, the body does not contain that message, and the exception is logged

### Requirement: The problem format is part of the API contract
The OpenAPI contract SHALL define the problem and validation-problem schemas and the standard error responses, so the generated backend models and the generated web client expose them as types.

#### Scenario: Contract describes errors
- **WHEN** a developer opens the contract
- **THEN** it defines a problem schema with `type`, `title`, `status`, `detail`, `instance` and a validation-problem schema that adds the `errors` list with field and message

#### Scenario: Web client has the types
- **WHEN** the web client is generated from the contract
- **THEN** the problem and validation-problem types can be imported from the client library

### Requirement: Failed HTTP calls in the web app are shown through one notification service
The web app SHALL intercept every failed HTTP response and pass a user-readable message to a central notification service, which makes the message visible to the user. Feature code SHALL NOT need to handle errors itself to get a message shown.

#### Scenario: Server returns a problem response
- **WHEN** a call fails with a problem body
- **THEN** the user sees a notification containing the problem's `detail` (or `title` when no `detail` is present)

#### Scenario: Validation problem
- **WHEN** a call fails with a validation problem
- **THEN** the notification includes the field names and messages from `errors`

#### Scenario: Server not reachable
- **WHEN** a call fails because no response was received (network error)
- **THEN** the user sees a notification saying the server cannot be reached

#### Scenario: Response without a problem body
- **WHEN** a call fails with an error response that is not a problem body (for example an HTML 502 page)
- **THEN** the user sees a generic notification for that HTTP status, and no raw HTML is displayed

#### Scenario: Caller still receives the error
- **WHEN** a call fails and a notification was shown
- **THEN** the error is still propagated to the caller so it can react (for example reset a form)

#### Scenario: Caller opts out of the notification
- **WHEN** a caller marks a request as handling its own errors
- **THEN** no notification is shown for that request's failure

### Requirement: Notifications are accessible, dismissible and auto-dismiss
The notification host SHALL announce new messages to assistive technology and SHALL let the user dismiss a message. Each message SHALL disappear on its own after a fixed time (8 seconds by default), but not while the user hovers over it or has keyboard focus within it. Messages SHALL NOT pile up unbounded.

#### Scenario: Announced to screen readers
- **WHEN** a notification appears
- **THEN** it is rendered in a live region (`role="alert"`) so screen readers announce it

#### Scenario: Dismissing
- **WHEN** the user activates the dismiss control of a notification
- **THEN** that notification is removed

#### Scenario: Auto-dismiss
- **WHEN** a notification has been visible for the auto-dismiss time without hover or focus
- **THEN** it is removed

#### Scenario: Paused while hovered or focused
- **WHEN** the user hovers over a notification or focus is inside it when the auto-dismiss time would elapse
- **THEN** it stays, and the full time starts again once hover and focus leave

#### Scenario: Notification limit
- **WHEN** more notifications arrive than the configured maximum are visible
- **THEN** the oldest ones are removed so that no more than the maximum are shown
