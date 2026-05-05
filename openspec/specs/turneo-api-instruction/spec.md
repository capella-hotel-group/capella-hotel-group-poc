### Requirement: Copilot instruction file exists for Turneo API guidance

The project SHALL contain a Copilot instruction file at `.github/instructions/turneo-api.instructions.md` that activates for all workspace files.

#### Scenario: Instruction file location and scope

- **WHEN** a developer works on any file in the project
- **THEN** the Turneo API instruction is available in the Copilot context with `applyTo: "**"`

### Requirement: Instruction enforces local-first documentation lookup

The instruction SHALL mandate that for any Turneo-related task, the agent MUST first consult the local reference at `docs/turneo-api-reference.md` before attempting to fetch online documentation.

#### Scenario: Agent receives Turneo-related request

- **WHEN** a task involves Turneo API endpoints, booking flow, or data structures
- **THEN** the agent reads `docs/turneo-api-reference.md` first for the needed information

#### Scenario: Local doc insufficient

- **WHEN** the local reference does not contain sufficient detail for a Turneo task
- **THEN** the agent fetches the online documentation at `https://turneo.stoplight.io/docs/turneo-experiences-api/` for additional information

### Requirement: Instruction includes API base URLs and auth pattern

The instruction SHALL embed the production base URL, mock server URL, and authentication header format so the agent can construct correct API calls without additional lookups.

#### Scenario: Agent constructs API call

- **WHEN** the agent needs to suggest or implement a Turneo API call
- **THEN** it uses `https://api.pro.turneo.co` as base URL, `x-api-key` header for auth, and can reference the mock server for testing

### Requirement: Instruction describes the booking flow sequence

The instruction SHALL describe the correct sequential flow (experiences → rates/availabilities → orders → confirm) so the agent never suggests out-of-order API calls.

#### Scenario: Agent suggests API integration

- **WHEN** the agent is asked to implement a Turneo booking feature
- **THEN** it follows the correct flow sequence and does not skip steps (e.g., never suggests creating an order without first checking availability)

### Requirement: Instruction enforces accurate and standardized API usage

The instruction SHALL require that all API suggestions use correct HTTP methods, endpoint paths, and required parameters as documented, with no fabricated endpoints or parameters.

#### Scenario: Agent suggests an endpoint

- **WHEN** the agent recommends a Turneo API endpoint
- **THEN** the endpoint, method, and parameters match exactly what is documented in the local reference or online docs — no hallucinated endpoints
