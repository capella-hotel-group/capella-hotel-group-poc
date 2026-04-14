## ADDED Requirements

### Requirement: Skill runs npm run lint before browser validation

The skill SHALL run `npm run lint` (ESLint + TypeScript-aware config from `eslint.config.js`) and `npm run lint:fix` for auto-fixable issues before browser testing.

#### Scenario: Linting after implementation

- **WHEN** the skill is invoked after block implementation
- **THEN** it SHALL run `npm run lint`; if errors exist, run `npm run lint:fix` then re-run to confirm clean

### Requirement: Browser validation is strongly recommended and should include screenshots

The skill SHOULD strongly encourage browser testing — at minimum one screenshot at desktop width, and one at mobile (<600px). Browser validation is not a hard gate; developers may proceed without it when tooling is unavailable, but the skill SHALL explicitly flag the risk.

#### Scenario: Testing a new block

- **WHEN** validating a new block implementation
- **THEN** the skill SHOULD navigate to the test content URL at `http://localhost:3000/{path}`, capture screenshots at 375px, 768px, and 1200px widths, and confirm no console errors
- **IF** browser tooling is unavailable, the skill SHALL note that browser validation was skipped and recommend running it manually before opening a PR

### Requirement: Skill provides three options for browser testing

The skill SHALL describe three browser testing approaches: (1) MCP browser/Playwright tools if available, (2) Playwright automation script, (3) manual browser with DevTools — and guide the developer to use the most capable option available.

#### Scenario: MCP browser tools available

- **WHEN** MCP browser or Playwright tools are available in the agent context
- **THEN** the skill SHALL use them to navigate, take snapshots/screenshots, and validate directly

#### Scenario: No MCP tools available

- **WHEN** MCP tools are not available
- **THEN** the skill SHALL generate a temporary Playwright script (to be deleted after use) and guide the developer to run `node test-{block}.js`

### Requirement: Unit tests only for logic-heavy utilities

The skill SHALL NOT require unit tests for simple DOM manipulation blocks. Unit tests are only required when the block contains logic-heavy functions (calculations, transformations, data processing). If unit tests ARE needed, they use Vitest.

#### Scenario: Simple decorator block

- **WHEN** a block only rearranges DOM elements and applies classes
- **THEN** the skill SHALL skip unit test creation and mark that step as "not applicable"

#### Scenario: Utility function with calculations

- **WHEN** a block contains a utility function that transforms data
- **THEN** the skill SHALL create a test file in `test/` using Vitest syntax (`import { describe, it, expect } from 'vitest'`)
