## ADDED Requirements

### Requirement: Document must open with philosophical framing

The onboarding guide SHALL begin with a "Why" section that frames the necessity of structured AI-assisted development. It MUST argue that the question is not whether to use AI, but how to use it effectively. It SHALL contrast SDD (Specification-Driven Development) with unstructured "vibe coding" and present evidence-based arguments for SDD's superiority in producing professional-quality output.

#### Scenario: Developer reads the Why section

- **WHEN** a new team member opens the onboarding guide
- **THEN** the first substantive section explains why AI usage is inevitable, why vibe coding produces inconsistent results, and why SDD is the chosen methodology for this project

### Requirement: Complete prerequisites checklist

The guide SHALL list every tool, account, license, and system dependency required to work on this project. Each prerequisite MUST indicate whether it requires payment or a specific access level. The list SHALL include at minimum: VS Code, GitHub Copilot (paid/enterprise), Figma (with dev access to project files), Node.js (version), AEM CLI, and any MCP server configurations.

#### Scenario: Developer checks prerequisites before setup

- **WHEN** a developer reads the prerequisites section
- **THEN** they can identify every tool they need to install, every account they need access to, and every license or subscription required — with no ambiguity about what is paid vs free

#### Scenario: Developer has all prerequisites installed

- **WHEN** a developer has satisfied every item in the checklist
- **THEN** they can proceed through the rest of the guide without encountering missing-dependency errors

### Requirement: Environment setup walkthrough

The guide SHALL provide step-by-step instructions for configuring the local development environment. This MUST cover: cloning the repo, installing dependencies, configuring VS Code extensions (Copilot, Figma MCP), verifying the AEM CLI, and running the dev server successfully.

#### Scenario: Developer follows setup steps

- **WHEN** a developer follows the environment setup section from start to finish
- **THEN** they have a working local dev server at localhost:3000 and can confirm the project builds without errors

### Requirement: End-to-end SDD workflow example

The guide SHALL include a complete worked example demonstrating every phase of the SDD workflow: from receiving a Figma design, through proposal → design → specs → tasks → implementation → verification. The example MUST use the Figma MCP integration to extract design context and MUST show actual OpenSpec CLI commands at each step.

#### Scenario: Developer follows the worked example

- **WHEN** a developer reads the end-to-end example section
- **THEN** they understand the complete sequence of steps to go from a Figma design URL to a deployed, content-authored block

#### Scenario: Each SDD phase is demonstrated

- **WHEN** the worked example progresses through each SDD phase
- **THEN** it shows the specific prompt command, explains what the AI agent produces, and describes how the developer reviews and approves before moving to the next phase

### Requirement: SDD arguments and evidence

The guide SHALL present concrete arguments for why SDD produces better results than vibe coding. Arguments MUST include: better context retention through specs, enforced coding standards via instruction files, reproducible quality through skills, explicit acceptance criteria through scenarios, and auditable decision history through archived changes.

#### Scenario: Skeptical developer reads SDD justification

- **WHEN** a developer who is skeptical of structured AI workflows reads the arguments section
- **THEN** they encounter specific, falsifiable claims about SDD advantages with references to how the project's configuration enforces them

### Requirement: Limitations and iteration guidance

The guide SHALL honestly document the limitations of the SDD + AI workflow. It MUST cover: cases where first-pass output doesn't match design intent, how to iterate within the SDD framework (verify → refine → re-apply), when to manually intervene, and known failure modes of the Figma MCP extraction.

#### Scenario: First implementation doesn't match design

- **WHEN** the AI-generated block doesn't perfectly match the Figma design after the first apply cycle
- **THEN** the guide describes the SDD iteration path: run verify, identify gaps in specs or design, refine artifacts, and re-apply

### Requirement: Glossary of terms

The guide SHALL include a glossary defining all domain-specific terms used throughout the document. Terms MUST include at minimum: SDD, MCP, OpenSpec, xwalk, Universal Editor, EDS, block, decorate(), Content-Driven Development, vibe coding.

#### Scenario: Developer encounters unfamiliar term

- **WHEN** a developer reads a term they don't recognize (e.g., "MCP", "xwalk", "SDD")
- **THEN** they can find a clear, concise definition in the glossary section

### Requirement: Document structure supports navigation

The guide SHALL use clear heading hierarchy, a table of contents (or navigable heading structure), and progressive disclosure — moving from concepts to prerequisites to setup to example to advanced topics. TL;DR or quick-start summary SHALL appear near the top.

#### Scenario: Experienced developer needs quick reference

- **WHEN** a developer who has already onboarded returns to the guide for a specific section
- **THEN** they can navigate directly to the relevant section via heading structure without reading the entire document
