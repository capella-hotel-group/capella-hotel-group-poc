# SDD Onboarding Guide — AI-Assisted Development for Capella Hotel Group

## TL;DR

This project uses **Spec-Driven Development (SDD)** — a structured methodology for working with AI coding agents. Instead of prompting an AI and hoping for the best ("vibe coding"), you define proposals, specifications, and tasks that give the AI agent full context, strict rules, and testable acceptance criteria. The result is professional-grade code that matches design intent, follows project conventions, and is reproducible across team members.

**Quick start:** Install prerequisites → clone repo → `npm i` → `npm run start` → use `/opsx:propose` in Copilot Chat to start your first change.

---

## Table of Contents

1. [Why Spec-Driven Development](#1-why-spec-driven-development)
2. [Prerequisites](#2-prerequisites)
3. [Environment Setup](#3-environment-setup)
4. [The SDD Workflow — Phase by Phase](#4-the-sdd-workflow--phase-by-phase)
5. [End-to-End Example: Building a Block from Figma](#5-end-to-end-example-building-a-block-from-figma)
6. [Limitations & Iteration](#6-limitations--iteration)
7. [Glossary](#7-glossary)

---

## 1. Why Spec-Driven Development

### The Inevitable Reality

AI-assisted development is no longer optional — it is a force multiplier that every competitive team must leverage. The question is not _whether_ to use AI, but _how_ to use it.

### The Problem with Vibe Coding

"Vibe coding" — prompting an AI without structure, iterating through trial and error, and accepting whatever output looks close enough — produces results that:

- **Lack consistency**: Every prompt yields different patterns, naming conventions, and architectural decisions
- **Drift from design intent**: Without explicit acceptance criteria, the AI interprets ambiguity however its training bias suggests
- **Resist maintenance**: Code generated without context of project conventions becomes technical debt immediately
- **Cannot be reproduced**: If the output is wrong, there's no systematic path to correct it — only more prompting and hoping
- **Scale poorly**: What works for a quick prototype collapses when applied to a production system with 20+ components

The effort required to elevate vibe-coded output to production quality often exceeds the effort of writing it from scratch with proper tooling.

### Why SDD Works

Spec-Driven Development solves these problems by giving the AI agent what it actually needs to produce world-class output:

| SDD Advantage                    | How It Works in This Project                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Context retention**            | Proposals and specs persist across sessions — the AI never loses track of what it's building or why                                               |
| **Enforced standards**           | Instruction files (`.github/instructions/`) encode coding style, block authoring patterns, and commit conventions as hard rules the agent follows |
| **Reproducible quality**         | Skills (`.github/skills/`) package domain expertise into reusable workflows — any team member invoking the same skill gets the same quality bar   |
| **Testable acceptance criteria** | Spec scenarios (WHEN/THEN) define exactly what "done" looks like — no ambiguity, no subjective judgment                                           |
| **Auditable decisions**          | Every change is archived with its proposal, design rationale, specs, and tasks — the _why_ is always recoverable                                  |
| **Iterative refinement**         | When output doesn't match intent, SDD provides a systematic path: verify → identify spec gaps → refine → re-apply                                 |

**The bottom line:** SDD transforms AI from a unpredictable assistant into a deterministic engineering tool. The specifications _are_ the product — the code is just their execution.

---

## 2. Prerequisites

Before setting up your development environment, ensure you have access to the following tools and accounts.

### Required Software

| Tool             | Version                           | Cost | Notes                                                    |
| ---------------- | --------------------------------- | ---- | -------------------------------------------------------- |
| **Node.js**      | 18.3.x or newer (LTS recommended) | Free | Required for build pipeline and AEM CLI                  |
| **npm**          | Bundled with Node.js              | Free | Package manager                                          |
| **Git**          | Latest                            | Free | Version control                                          |
| **VS Code**      | Latest stable                     | Free | Primary editor — required for Copilot integration        |
| **AEM CLI**      | Latest (`@adobe/aem-cli`)         | Free | Local development proxy: `npm install -g @adobe/aem-cli` |
| **OpenSpec CLI** | Latest                            | Free | SDD artifact management: `npm install -g openspec`       |

### Required Accounts & Licenses

| Account               | Cost                                   | Access Level Required                       | Purpose                               |
| --------------------- | -------------------------------------- | ------------------------------------------- | ------------------------------------- |
| **GitHub**            | Free (account)                         | Write access to this repository             | Code, prompts, skills, instructions   |
| **GitHub Copilot**    | Paid (Individual $10/mo or Enterprise) | Active subscription                         | AI agent that executes SDD workflows  |
| **Figma**             | Paid (team plan)                       | **Dev mode access** to project design files | Design extraction via MCP             |
| **AEM Cloud Service** | Enterprise license                     | Author/Developer access                     | Content authoring in Universal Editor |

### Required VS Code Extensions

| Extension               | ID                             | Purpose                      |
| ----------------------- | ------------------------------ | ---------------------------- |
| **GitHub Copilot**      | `github.copilot`               | AI code completion           |
| **GitHub Copilot Chat** | `github.copilot-chat`          | Agent mode for SDD prompts   |
| **Figma for VS Code**   | `figma.figma-vscode-extension` | Figma MCP server integration |
| **ESLint**              | `dbaeumer.vscode-eslint`       | Real-time lint feedback      |
| **Prettier**            | `esbenp.prettier-vscode`       | Format on save               |

### MCP Server Configuration

The Figma MCP server must be configured in VS Code settings for the Figma-to-block workflow to function. This is configured in `.vscode/mcp.json` or your VS Code user settings under `github.copilot.chat.mcpServers`.

> **Note**: If you don't have Figma Dev access, you can still use SDD for non-Figma workflows — the Figma MCP integration is one path into the workflow, not the only one.

---

## 3. Environment Setup

### Step 1: Clone and Install

```bash
git clone <repository-url>
cd capella-hotel-group-poc
npm install
```

### Step 2: Install Global Tools

```bash
# AEM CLI — local development proxy
npm install -g @adobe/aem-cli

# OpenSpec CLI — SDD artifact management
npm install -g openspec
```

### Step 3: Configure VS Code

1. Install all required extensions listed in [Prerequisites](#required-vs-code-extensions)
2. Ensure GitHub Copilot is signed in and active (look for the Copilot icon in the status bar)
3. Open Copilot Chat (⌘⇧I on macOS / Ctrl+Shift+I on Windows) and verify agent mode is available

### Step 4: Configure Figma MCP (if applicable)

The Figma MCP server allows Copilot to read design context directly from Figma files. Configuration is stored in the project's `.vscode/mcp.json`. If this file exists, the MCP server should activate automatically when you open the workspace.

To verify: Open Copilot Chat and type `@figma` — if the MCP server is connected, you'll see Figma-related tool suggestions.

### Step 5: Verify Development Environment

```bash
# Start the full development loop
npm run start
```

This runs TypeScript watch + Vite watch + AEM proxy in parallel. When successful, you'll see:

- TypeScript compilation: no errors
- Vite build: outputs to `dist/` and syncs to root
- AEM proxy: serving at `http://localhost:3000`

Open `http://localhost:3000` in your browser. If you see the site loading, your environment is ready.

### Step 6: Verify OpenSpec

```bash
# Check OpenSpec recognizes the project
openspec status
```

This should show the project's active changes (if any) and confirm the CLI can read `openspec/config.yaml`.

---

## 4. The SDD Workflow — Phase by Phase

Every code change in this project follows the SDD lifecycle. Whether you're building a new block, fixing a bug, or refactoring, the process is the same.

### Phase 1: Propose (`/opsx:propose`)

**What happens:** You describe what you want to build. The AI creates a structured proposal covering _why_ the change is needed, _what_ will change, and which specifications need to be written.

**What the AI produces:**

- `proposal.md` — motivation, scope, capability list
- `design.md` — technical decisions, trade-offs, architecture choices
- `specs/<capability>/spec.md` — testable requirements with WHEN/THEN scenarios
- `tasks.md` — implementation checklist

**Your role:** Review each artifact. Does the proposal capture your intent? Are the specs testing the right behavior? Are the tasks scoped correctly? Approve or request changes before proceeding.

**Why this beats vibe coding:** The AI now has explicit, written context about _what_ it's building, _why_ it's building it, _how_ it should approach the implementation, and _what "done" looks like_. Vibe coding provides none of this — it relies on the AI inferring all of it from a single prompt.

### Phase 2: Apply (`/opsx:apply`)

**What happens:** The AI reads all artifacts (proposal, specs, design, tasks) and implements the code changes task by task.

**What the AI produces:** Actual code — TypeScript, CSS, AEM model JSON — following the project's instruction files and skills automatically.

**Your role:** Watch the implementation progress. The AI marks tasks complete as it goes. Review the code it produces — does it match the specs? Does it follow conventions?

**Why this beats vibe coding:** The AI isn't guessing what conventions to follow. It has `.github/instructions/coding-style.instructions.md` enforcing `@/*` imports, `replaceChildren()` patterns, and TypeScript strict mode. It has `.github/instructions/block-authoring.instructions.md` defining the exact block structure. It has the specs defining acceptance criteria. None of this exists in a vibe coding session.

### Phase 3: Verify (`/opsx:verify`)

**What happens:** The AI cross-references the implementation against the specs, checking that every requirement and scenario is satisfied.

**What the AI produces:** A verification report identifying any gaps between specs and implementation.

**Your role:** If gaps are found, decide whether to refine the specs (the requirement was wrong) or fix the implementation (the code is wrong). Then re-apply or manually correct.

**Why this beats vibe coding:** Vibe coding has no concept of verification beyond "does it look right?" SDD provides a deterministic checklist of acceptance criteria that can be mechanically verified.

### Phase 4: Archive (`/opsx:archive`)

**What happens:** The completed change is moved to `openspec/changes/archive/`, and delta specs are synced to the canonical spec directory.

**What this provides:** A permanent record of what was built, why, and how — searchable and referenceable for future changes.

---

## 5. End-to-End Example: Building a Block from Figma

This section walks through building a hypothetical **"feature-highlight"** block from a Figma design. The block displays a heading, description, image, and call-to-action — a common pattern in the project.

### Step 1: Receive the Design

You receive a Figma URL from the design team:

```
https://figma.com/design/ABC123/capella-blocks?node-id=456:789
```

### Step 2: Propose the Change

Open Copilot Chat and run:

```
/opsx:propose feature-highlight-block
```

Describe what you're building when prompted:

> "A new feature-highlight block based on the Figma design at [URL]. It shows a heading, body text, an image, and a CTA link. Should support both left-image and right-image layouts."

The AI creates all artifacts. Review them:

- **proposal.md**: Confirms the block's purpose and scope
- **design.md**: Decides on content model structure, CSS approach
- **specs/feature-highlight-block/spec.md**: Defines requirements like "block SHALL render heading from first cell" with WHEN/THEN scenarios
- **tasks.md**: Lists implementation steps (create TS file, create CSS, create model JSON, etc.)

### Step 3: Scaffold from Figma (Optional Accelerator)

Before applying, you can use the Figma MCP integration to get a head start:

```
/aem-create-block-from-figma
```

Provide the Figma node URL. The AI uses the MCP server to:

1. Fetch the design context (component structure, colors, spacing, typography)
2. Generate a standards-compliant `decorate()` function
3. Create matching CSS with design tokens
4. Scaffold the UE model JSON

This output becomes the starting point that `/opsx:apply` refines against your specs.

### Step 4: Implement

```
/opsx:apply
```

The AI reads your specs and tasks, then implements each task:

1. Creates `src/blocks/feature-highlight/feature-highlight.ts`
2. Creates `src/blocks/feature-highlight/feature-highlight.css`
3. Creates `src/blocks/feature-highlight/_feature-highlight.json`
4. Runs `npm run build:json` to merge the model
5. Verifies TypeScript compiles without errors

Each task is marked complete as it finishes.

### Step 5: Verify

```
/opsx:verify
```

The AI checks:

- Does the heading render from the correct content cell? ✓
- Does the image use `<picture>` with responsive sources? ✓
- Does the CTA link use the correct semantic markup? ✓
- Are CSS values using design tokens, not hardcoded hex? ✓
- Is the block lint-clean and type-safe? ✓

If any check fails, you'll see exactly which spec scenario wasn't met and can iterate.

### Step 6: Test with Content

1. Open the Universal Editor at your AEM Cloud Service instance
2. Navigate to a test page
3. Add the "Feature Highlight" block from the component picker
4. Fill in the content fields (heading, description, image, CTA)
5. Preview the page — verify it matches the Figma design

### Step 7: Archive

Once satisfied:

```
/opsx:archive
```

The change is archived, specs are synced, and the block is ready for production.

---

## 6. Limitations & Iteration

SDD dramatically improves AI output quality, but it is not infallible. Understanding its limitations helps you work effectively within the framework.

### Known Limitations

| Limitation                      | Impact                                                                                                                         | Mitigation                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **First-pass design fidelity**  | The AI may not perfectly match pixel-level Figma details (spacing, animation timing, complex responsive behavior)              | Use `/opsx:verify` to identify gaps, then refine specs or manually adjust CSS                               |
| **Figma MCP extraction limits** | Complex Figma components (nested auto-layout, variants, interactive states) may not translate cleanly                          | Simplify the design extraction scope; handle complex interactions manually                                  |
| **Context window limits**       | Very large changes with many specs can exceed the AI's context window                                                          | Break large features into multiple smaller changes                                                          |
| **Novel patterns**              | If the project hasn't seen a pattern before (no existing skill or instruction covers it), the AI may improvise poorly          | Write a new instruction file or skill to encode the pattern for future use                                  |
| **AEM-specific quirks**         | Universal Editor content tree constraints, EDS loading phases, and block DOM structure have nuances the AI occasionally misses | The `ue-layout-conflicts` and `block-authoring` instruction files exist specifically to guard against these |

### The Iteration Path

When first-pass output doesn't match requirements:

```
1. Run /opsx:verify
   → Identifies which spec scenarios are NOT satisfied

2. Diagnose the gap:
   a) Spec was incomplete → update specs/<capability>/spec.md with missing requirements
   b) Design was ambiguous → update design.md with clearer decisions
   c) Implementation bug → the AI simply made an error

3. Re-apply or fix:
   a) For spec/design gaps: run /opsx:apply again (it reads updated artifacts)
   b) For implementation bugs: fix directly and mark task complete
   c) For persistent issues: add an instruction file to prevent recurrence

4. Re-verify: /opsx:verify
   → Confirm all scenarios now pass
```

### When to Manually Intervene

- **Pixel-perfect CSS adjustments** — when the AI gets 90% right but the last 10% needs human eyes on a browser
- **Complex animations** — keyframe timing and easing curves often need manual tuning
- **AEM content model edge cases** — when the Universal Editor behavior is undocumented
- **Performance optimization** — when LCP/CLS budgets require specific loading strategies the AI hasn't been trained on

Manual intervention is not a failure of SDD — it's the expected final refinement step. The SDD workflow handles the 80-90% that would otherwise be tedious boilerplate; you apply craft to the remaining 10-20%.

---

## 7. Glossary

| Term                           | Definition                                                                                                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SDD**                        | Spec-Driven Development — a methodology where AI agents are guided by structured specifications (proposals, designs, specs, tasks) rather than ad-hoc prompts                 |
| **Vibe Coding**                | Unstructured AI-assisted development where the developer prompts an AI without formal specifications, iterating through trial and error                                       |
| **MCP**                        | Model Context Protocol — a standard that allows AI agents to connect to external tools (like Figma) and read contextual data during generation                                |
| **OpenSpec**                   | An open-source CLI tool that manages the SDD artifact lifecycle (propose → design → specs → tasks → apply → verify → archive)                                                 |
| **xwalk**                      | Short for "crosswalk" — the AEM Edge Delivery Services authoring mode that uses the Universal Editor (WYSIWYG) rather than document-based authoring                           |
| **Universal Editor (UE)**      | Adobe's WYSIWYG editor for AEM content — authors interact with blocks visually, and the editor writes structured content to the repository                                    |
| **EDS**                        | Edge Delivery Services — Adobe's CDN-first content delivery platform that serves pre-rendered HTML from edge locations                                                        |
| **Block**                      | The fundamental UI component unit in AEM EDS — a folder containing a `.ts` implementation, `.css` styling, and a `_*.json` content model                                      |
| **`decorate()`**               | The standard export function every block implements: `async function decorate(block: HTMLElement): Promise<void>` — transforms authored DOM into the final rendered structure |
| **Content-Driven Development** | The AEM EDS development workflow: model content → build block → test with real content → iterate                                                                              |
| **Skills**                     | Reusable AI workflow packages (`.github/skills/`) that encode domain expertise — e.g., how to build blocks, how to test, how to review code                                   |
| **Instructions**               | Rule files (`.github/instructions/`) that constrain AI behavior — e.g., coding style, commit format, block authoring patterns                                                 |
| **Prompts**                    | Invocable commands (`.github/prompts/`) that trigger specific SDD workflow phases — e.g., `/opsx:propose`, `/opsx:apply`                                                      |
