## Context

The project currently has a detailed `README.md` covering architecture, build pipeline, and SDD overview — but it's written for someone already embedded in the workflow. New team members (particularly AEM EDS developers who haven't used AI-assisted tooling) face a steep onboarding curve because there's no single document that walks them from "I just got repo access" to "I just shipped my first block using SDD + Figma MCP."

The upstream AEM boilerplate setup section in the README is outdated for this project's evolved stack and should be replaced.

## Goals / Non-Goals

**Goals:**

- Provide a zero-to-productive onboarding path for developers new to this project's AI-assisted workflow
- Make a compelling, evidence-based case for SDD over unstructured AI usage (vibe coding)
- Document every prerequisite (tools, accounts, licenses, system dependencies) explicitly
- Walk through a complete end-to-end example: Figma design → SDD artifacts → block implementation → content authoring
- Cover failure modes and iteration patterns within SDD
- Serve as a living reference that can be updated as the workflow evolves

**Non-Goals:**

- Replacing the README (the README remains the architectural overview; the guide is the "how to work here" companion)
- Teaching AEM EDS fundamentals from scratch (assumes existing EDS knowledge)
- Documenting every block that exists in the project
- Covering CI/CD pipeline setup or infrastructure provisioning
- Being a Figma design tutorial

## Decisions

### 1. Standalone doc at `docs/sdd-onboarding-guide.md`

**Rationale:** Keeps the README focused on architecture. The onboarding guide is long-form (estimated 1500-2500 words) and benefits from being its own navigable document. The `docs/` directory already exists with API references.

**Alternatives considered:**

- Expanding the README → rejected: would make it unwieldy
- Wiki pages → rejected: not version-controlled with the code, easy to drift

### 2. Structure follows the SDD workflow phases

**Rationale:** The document's worked example will mirror the actual workflow phases (propose → design → specs → tasks → apply → verify). This reinforces learning by showing the reader exactly what they'll do in practice.

### 3. Vietnamese/English — write in English

**Rationale:** The codebase, instructions, and all existing documentation are in English. Even though the request was phrased in Vietnamese, the artifact should match existing documentation language for consistency and accessibility to all team members.

### 4. Argumentative framing for SDD adoption

**Rationale:** The document needs to convince, not just inform. Developers resistant to structured AI workflows need to understand _why_ SDD produces superior results to vibe coding — context retention, rule enforcement, reproducibility, and quality gates. This isn't a neutral technical spec; it's a persuasive onboarding document.

### 5. End-to-end example uses a hypothetical "feature-highlight" block

**Rationale:** A realistic but simple block type that demonstrates all phases without requiring domain-specific knowledge. It exercises Figma MCP extraction, content modeling, TypeScript implementation, and UE integration — the full pipeline.

## Risks / Trade-offs

- **[Staleness]** → Mitigation: Keep the guide focused on workflow patterns rather than exact CLI outputs. Link to instruction files for specifics that may change.
- **[Too long for quick reference]** → Mitigation: Add a TL;DR section at the top and clear heading structure for navigation.
- **[Assumes GitHub Copilot specifically]** → Mitigation: Note that the workflow is editor-agnostic via OpenSpec, but the guide targets Copilot as the primary tool since that's what the project is configured for.
- **[Example block may not match real complexity]** → Mitigation: Explicitly state the example is simplified; reference existing blocks for real-world patterns.
