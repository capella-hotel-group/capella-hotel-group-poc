## Purpose

Defines the required structure, retained upstream content, and content obligations for the root `README.md` of the Capella Hotel Group AEM EDS PoC repository. Covers the architecture showcase, developer workflow, SDD skills inventory, and the open-problems roadmap checklist.

---

## Requirements

### Requirement: README Retains Upstream Boilerplate Guidance

The `README.md` SHALL preserve the content that the current file inherits from the `aem-boilerplate` / `aem-boilerplate-xwalk` template — specifically the Environments, Documentation, Prerequisites, Installation, Linting, and Local development sections — so that readers who already know the upstream template can still locate familiar instructions.

#### Scenario: Upstream sections remain accessible

- **WHEN** a reader opens the root `README.md`
- **THEN** sections titled "Environments", "Documentation", "Prerequisites", "Installation", "Linting", and "Local development" are present with content equivalent to (or superseding) the current upstream text, either at the top level or grouped under a clearly labeled upstream/reference heading.

### Requirement: README Introduces the Project and Its Position Relative to the xwalk Template

The `README.md` SHALL open with a project overview that identifies the repository as a team-evolved derivative of the `aem-boilerplate-xwalk` template and states the two stated goals of the evolution: maximizing final-output quality and improving the developer experience and workflow throughput.

#### Scenario: Project overview is present

- **WHEN** a reader opens the README
- **THEN** within the first visible section after the title, the document states that the project is built on top of the Adobe `aem-boilerplate-xwalk` template and has been improved by the team, and names "output quality", "developer experience", and "workflow" (or equivalent phrasing) as the goals of the evolution.

### Requirement: README Documents the Build & Bundle Pipeline

The `README.md` SHALL document the Vite + Rollup build pipeline, calling out at minimum: auto-discovered per-block entries from `src/blocks/<name>/<name>.ts`, stable infrastructure chunks (`aem-core`, `dompurify`, `three`, `env`) emitted under `chunks/`, the `scripts/scripts.js` and `scripts/aem.js` entry outputs, the version-banner plugin, and the watch-mode sync from `dist/` back to the repository root.

#### Scenario: Build pipeline is described

- **WHEN** a reader reaches the architecture section of the README
- **THEN** the section explicitly mentions Vite, per-block entries, the fixed-path infrastructure chunks, and the watch-mode behavior, in prose, bullets, or a short table — at a level of detail sufficient for a new engineer to understand the shape of the build output without reading `vite.config.ts`.

### Requirement: README Documents the src/-First Development Model

The `README.md` SHALL document the `src/`-first source layout and its modern-frontend affordances, including: the `@/*` path alias mapping to `src/*`, the top-level folders (`src/app`, `src/blocks`, `src/configs`, `src/models`, `src/styles`, `src/types`, `src/utils`), TypeScript strict-null-checks, the `decorate(block)` block contract, and the convention that only `src/` is edited while root `blocks/`, `scripts/`, `styles/`, and `chunks/` are build outputs.

#### Scenario: Source layout is described

- **WHEN** a reader reaches the architecture or source-layout section
- **THEN** the README names each top-level `src/` folder with a one-line description, states the `@/*` alias, and warns that root-level `blocks/`, `scripts/`, `styles/`, and `chunks/` are generated and must not be edited by hand.

### Requirement: README States the EDS Compatibility Guarantee

The `README.md` SHALL explicitly state that despite the modernized development stack, the production output preserves the core AEM Edge Delivery Services contracts — specifically the two-phase loading model (eager `scripts/scripts.js` / lazy `scripts/aem.js`), per-block colocated JS + CSS under `blocks/<name>/`, and the Universal Editor JSON contracts at the repository root (`component-definition.json`, `component-models.json`, `component-filters.json`).

#### Scenario: EDS compatibility statement is present

- **WHEN** a reader reads the architecture section
- **THEN** at least one paragraph or callout confirms that the output remains EDS-compatible and names the two-phase loading split, block output layout, and UE component JSON files.

### Requirement: README Documents the Developer Workflow Scripts

The `README.md` SHALL document the npm scripts a contributor uses day-to-day: `npm run start`, `npm run build`, `npm run build:watch`, `npm run build:json`, `npm run lint`, `npm run lint:fix`, `npm run format`, and `npm run format:check`, each with a one-line description of what it does.

#### Scenario: Scripts table is present

- **WHEN** a reader reaches the developer-workflow section
- **THEN** each of the listed scripts appears in a table, bullet list, or equivalent structure with a short description of its purpose.

### Requirement: README Inventories the Spec-Driven Development (SDD) Skills and Prompts

The `README.md` SHALL document the SDD workflow used in this repository and inventory the skills and prompts that ship under `.github/skills/` and `.github/prompts/`, grouped into at minimum: (a) AEM EDS skills, (b) OpenSpec workflow skills/prompts, and (c) Figma-to-block tooling.

#### Scenario: AEM EDS skills are listed

- **WHEN** a reader reaches the SDD section
- **THEN** the following skill names are listed with a one-line description each: `aem-skill-content-driven-development`, `aem-skill-content-modeling`, `aem-skill-building-blocks`, `aem-skill-testing-blocks`, `aem-skill-code-review`, `aem-skill-ue-component-model`, `aem-skill-docs-search`, and `aem-skill-create-block-from-figma`.

#### Scenario: OpenSpec workflow prompts are listed

- **WHEN** a reader reaches the SDD section
- **THEN** the OpenSpec prompts shipped under `.github/prompts/` are listed — at minimum `opsx-propose`, `opsx-apply`, `opsx-continue`, `opsx-verify`, `opsx-archive`, `opsx-explore`, `opsx-ff`, `opsx-new`, `opsx-sync`, `opsx-bulk-archive`, and `opsx-onboard` — with a short description of the workflow they drive.

#### Scenario: Figma-to-block workflow is described

- **WHEN** a reader reaches the SDD section
- **THEN** the README describes the Figma MCP integration and the `/aem-create-block-from-figma` prompt/skill, names it as the path from a Figma node to a standards-compliant xwalk block, and calls out that it supports a one-engineer-per-block delivery model.

### Requirement: README Includes a Roadmap & Open Problems Checklist

The `README.md` SHALL include a checklist-style section that documents workflow areas the team has identified but not yet solved, so that contributors understand what is intentionally out of scope today.

#### Scenario: Checklist is present

- **WHEN** a reader reaches the end of the README
- **THEN** a section (titled "Roadmap", "Open Problems", "Known Gaps", or equivalent) contains a Markdown task list (`- [ ]` entries) covering at minimum: Figma-to-block fidelity constraints, component classification based on design and functional analysis, component performance evaluation tooling, formalization of the two-phase loading contract beyond its current planning stage, and a placeholder for further optimizations.

### Requirement: README Links to Project-Specific Contributor Instructions

The `README.md` SHALL link to the repository's own instruction files under `.github/instructions/` so that contributors can find the authoritative rules for commit messages, block authoring, coding style, and UE layout conflicts.

#### Scenario: Instruction links are present

- **WHEN** a reader reaches the "Further Reading" (or equivalent) section
- **THEN** the section contains relative Markdown links to `.github/instructions/commit-conventions.instructions.md`, `.github/instructions/block-authoring.instructions.md`, `.github/instructions/coding-style.instructions.md`, and `.github/instructions/ue-layout-conflicts.instructions.md`.
