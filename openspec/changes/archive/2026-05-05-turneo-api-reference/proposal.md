## Why

This project integrates with the Turneo Experiences API to power experience booking flows for Capella Hotel Group. Currently there is no local reference documentation or Copilot skill to guide API usage, meaning developers must manually search the online Stoplight docs for every Turneo-related task. A local reference and a dedicated skill will ensure consistent, accurate, and efficient API integration across all Turneo-related work.

## What Changes

- Create a comprehensive local markdown reference (`docs/turneo-api-reference.md`) consolidating the Turneo Experiences API documentation: endpoints, booking flow, schemas, authentication, and mock server details.
- Create a Copilot instruction file (`.github/instructions/turneo-api.instructions.md`) that enforces consulting the local reference first, then falling back to the online documentation for any Turneo-related task.
- The instruction will apply to all files (`**`) and guide the agent through the correct booking flow (experiences → rates/availabilities → orders → bookings → confirm).

## Capabilities

### New Capabilities

- `turneo-api-local-reference`: Local markdown documentation consolidating the Turneo Experiences API — endpoints, flow steps, authentication, schemas, and mock server info.
- `turneo-api-instruction`: Copilot instruction file that mandates referencing local docs first, online docs second, and enforces accurate API usage patterns for all Turneo-related work.

### Modified Capabilities

<!-- No existing capabilities are being modified -->

## Impact

- New files: `docs/turneo-api-reference.md`, `.github/instructions/turneo-api.instructions.md`
- All future Turneo-related specs, blocks, or integrations will reference these docs
- No runtime code changes — documentation and tooling only
