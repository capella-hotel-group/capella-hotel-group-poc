## Why

The current `README.md` is the unmodified `aem-boilerplate` placeholder (“Your Project's Title…”, “Your project's description…”) and carries none of the architectural work this team has layered on top of the xwalk starter. New engineers, reviewers, and stakeholders landing on the repository have no way to discover the Vite-based build pipeline, the modern `src/`-first development model, the Spec-Driven Development (SDD) workflow, or the Figma → block automation — all of which are differentiators of this project. We need a README that accurately documents what the repository is today and sets expectations for how to contribute to it.

## What Changes

- Preserve the existing `README.md` sections (Environments, Documentation, Prerequisites, Installation, Linting, Local development) as the baseline, relocating them under a clear heading so the upstream aem-boilerplate guidance remains intact.
- Add a **Project Overview** section introducing the repository as a team-hardened evolution of the `aem-boilerplate-xwalk` template, tuned for output quality, developer experience (DX), and workflow throughput.
- Add an **Architecture Highlights** section documenting the two headline improvements over the stock template:
  1. A Vite + Rollup build/bundle pipeline that produces EDS-compatible output (per-block entries, stable infrastructure chunks, version-banner plugin, watch-mode root sync, auto-discovered block entries).
  2. A `src/`-first, TypeScript-strict source layout (`@/*` alias, `src/app`, `src/blocks`, `src/configs`, `src/models`, `src/styles`, `src/utils`) that enables modern frontend patterns (strict null checks, composition, shared utilities, design tokens) without compromising EDS runtime semantics.
- Add an **EDS Compatibility Guarantee** paragraph clarifying that the production bundle still honors the core AEM EDS contracts (two-phase loading split between `scripts/scripts.js` and `scripts/aem.js`, per-block CSS/JS colocation under `blocks/<name>/`, Universal Editor component JSON at the repo root).
- Add a **Developer Workflow** section describing the npm scripts (`start`, `build`, `build:watch`, `build:json`, `lint`, `format`) and the watch-mode `dist/` → root sync behavior.
- Add a **Spec-Driven Development (SDD)** section listing the skills and prompts that ship with the repo:
  - AEM EDS skills: `aem-skill-content-driven-development`, `aem-skill-content-modeling`, `aem-skill-building-blocks`, `aem-skill-testing-blocks`, `aem-skill-code-review`, `aem-skill-ue-component-model`, `aem-skill-docs-search`, `aem-skill-create-block-from-figma`.
  - OpenSpec workflow skills/prompts: `opsx-propose`, `opsx-apply`, `opsx-continue`, `opsx-verify`, `opsx-archive`, `opsx-explore`, `opsx-ff`, `opsx-new`, `opsx-sync`, `opsx-bulk-archive`, `opsx-onboard`.
  - Figma MCP integration and the `/aem-create-block-from-figma` prompt that converts a Figma node into a standards-compliant xwalk block, enabling a one-engineer-per-block delivery model.
- Add a **Roadmap & Open Problems** checklist documenting workflow areas still under exploration, so contributors know what is intentionally out of scope today.
- Keep the commit-conventions pointer (link to `.github/instructions/commit-conventions.instructions.md`) and a short **Further Reading** block linking to the project-specific instruction files.

## Capabilities

### New Capabilities

- `project-readme-documentation`: Defines the required structure, retained upstream content, and content obligations for the root `README.md`, including architecture showcase, developer workflow, SDD skills inventory, and the open-problems checklist.

### Modified Capabilities

<!-- No existing capability governs README content; none to modify. -->

## Impact

- **Files changed**: `README.md` only (content update; no structural repo changes).
- **Code/runtime**: none — this is a documentation-only change. No build, lint, or AEM runtime behavior is affected.
- **Contributors**: new engineers gain an accurate entry point; existing contributors get a canonical reference for architecture talking points, SDD skills, and the Figma-to-block workflow.
- **Dependencies**: none added or removed.
