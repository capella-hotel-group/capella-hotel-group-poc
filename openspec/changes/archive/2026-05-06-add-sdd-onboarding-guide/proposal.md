## Why

The current README documents the project architecture and build commands but lacks a dedicated onboarding guide that teaches new team members **how to work with this project's AI-assisted workflow**. The upstream AEM boilerplate setup instructions are still present but irrelevant to this evolved stack. A developer joining the team — especially one experienced in AEM EDS but unfamiliar with SDD, MCP, or AI-assisted tooling — has no single resource to go from zero to productive. This gap slows onboarding, risks inconsistent practices, and undercuts the efficiency gains the workflow was designed to deliver.

## What Changes

- **New documentation file** (`docs/sdd-onboarding-guide.md`): a comprehensive, self-contained onboarding guide covering:
  - Philosophical framing: why AI-assisted development matters and why SDD (not vibe coding) is the chosen approach
  - Full prerequisites checklist (paid tools, accounts, system dependencies)
  - Environment setup walkthrough (Node, AEM CLI, VS Code extensions, Figma MCP)
  - End-to-end worked example: building a block from Figma design through SDD workflow to deployed content
  - SDD workflow deep-dive with arguments for its superiority over unstructured AI usage
  - Limitations, failure modes, and how to iterate within the SDD framework
  - Glossary of terms (SDD, MCP, OpenSpec, xwalk, Universal Editor, etc.)
- **README update**: replace the upstream boilerplate installation section with a pointer to the new onboarding guide

## Capabilities

### New Capabilities

- `sdd-onboarding-guide`: Comprehensive project onboarding documentation covering prerequisites, environment setup, SDD philosophy, end-to-end Figma-to-block workflow example, and troubleshooting guidance for developers new to AI-assisted development

### Modified Capabilities

- `project-readme-documentation`: README's "Upstream aem-boilerplate Reference" section is replaced with a link to the new onboarding guide

## Impact

- **Files created**: `docs/sdd-onboarding-guide.md`
- **Files modified**: `README.md` (replace upstream boilerplate section with onboarding guide link)
- **No code changes** — documentation only
- **No dependency changes**
- **No breaking changes** to any runtime behavior
