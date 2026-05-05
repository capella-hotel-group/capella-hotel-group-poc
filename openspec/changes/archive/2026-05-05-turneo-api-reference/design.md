## Context

The project integrates with the Turneo Experiences API (v0.3) to provide experience booking capabilities for Capella Hotel Group guests. The API follows a sequential booking flow: search experiences → get rates/availabilities → create order → confirm. Currently, developers have no local reference and must repeatedly consult the online Stoplight docs, leading to inconsistent usage patterns and wasted time.

The project already has a `.github/instructions/` directory for Copilot instruction files and a `docs/` directory for project documentation.

## Goals / Non-Goals

**Goals:**

- Provide a single-source-of-truth local markdown doc covering all Turneo API endpoints, flow, and schemas
- Create a Copilot instruction that enforces a "local first, online second" lookup pattern for Turneo
- Ensure all API flow steps (experiences, rates, availabilities, orders, bookings, confirm) are documented with endpoints, methods, parameters, and example payloads
- Include mock server URL for development/testing

**Non-Goals:**

- No runtime code or API client implementation in this change
- No SDK wrapper or utility functions — this is documentation only
- No exhaustive schema replication — reference online docs for full schema details, document key fields only

## Decisions

### 1. Local reference as `docs/turneo-api-reference.md`

**Choice**: Single markdown file in `docs/` consolidating the full booking flow.

**Rationale**: The `docs/` folder already exists for project documentation. A single file keeps the API reference easy to find and maintain. The booking flow is linear and fits well in one document with sections per step.

**Alternative considered**: Multiple files per flow step — rejected because the total content is manageable in one file and cross-referencing between steps is easier inline.

### 2. Copilot instruction at `.github/instructions/turneo-api.instructions.md`

**Choice**: An instruction file with `applyTo: "**"` that activates for any file in the workspace.

**Rationale**: Turneo API concerns may arise in blocks, utils, specs, or any file. The instruction enforces the lookup hierarchy: local doc → online doc → ask user. It also embeds the base URL, auth pattern, and mock server info so the agent can act without repeated doc lookups.

**Alternative considered**: A full SKILL.md — rejected because this is a reference/instruction concern, not a multi-step workflow skill. An instruction file is lighter and always loaded in context.

### 3. Document structure follows the booking flow

**Choice**: Organize the reference by flow steps (1. Experiences, 2. Rates & Availability, 3. Orders & Bookings) mirroring the official Getting Started guide.

**Rationale**: This matches how developers think about the integration — sequentially through the booking journey. Each section includes endpoints, HTTP methods, parameters, and key response fields.

## Risks / Trade-offs

- [API version drift] → The local doc references v0.3. If Turneo updates their API, the local doc may become stale. Mitigation: include a "Last synced" date and online doc URL at the top for cross-reference.
- [Incomplete schema info] → We document key fields only, not full schemas. Mitigation: link to the online Schemas section for exhaustive details.
- [Instruction scope too broad] → `applyTo: "**"` means the instruction loads for all files. Mitigation: The instruction content is concise and only triggers behavior when Turneo is mentioned in context.
