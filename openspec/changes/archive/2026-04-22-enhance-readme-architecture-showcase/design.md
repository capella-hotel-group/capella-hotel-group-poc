## Context

The current root `README.md` is the unmodified placeholder shipped by `aem-boilerplate-xwalk` ("Your Project's Title…", "Your project's description…"). Meanwhile the repository has diverged substantially from that template: it adds a Vite + Rollup build pipeline (`vite.config.ts`, `vite.helpers.ts`), a strict-TypeScript `src/`-first layout with an `@/*` alias, per-block auto-discovered entries, stable infrastructure chunks, a `build:json` model-merge step, and a Spec-Driven Development workflow driven by OpenSpec and a catalog of `.github/skills/` and `.github/prompts/` (including a Figma-MCP-backed block generator).

None of that is visible from the README today, so the project's differentiators are undiscoverable to anyone who hasn't pair-programmed with the team. This change rewrites the README as a single source of truth that (a) keeps upstream guidance readable and (b) accurately advertises the local architecture and workflow.

This is a **documentation-only** change — no build, lint, runtime, or AEM-facing behavior is modified.

## Goals / Non-Goals

**Goals:**

- Preserve the substance of the upstream aem-boilerplate sections currently in `README.md` so teams already familiar with that template can still find what they expect.
- Introduce the project as an improved derivative of `aem-boilerplate-xwalk`, with output quality and developer experience as the stated goals.
- Document the two headline architectural improvements — the Vite/Rollup build pipeline and the `src/`-first development model — at a level of detail that lets a new engineer orient without reading config files.
- Assert the EDS compatibility guarantee (two-phase loading, per-block colocation, UE JSON contracts at the root) so readers do not assume the modernized stack breaks EDS semantics.
- Inventory the SDD workflow: AEM EDS skills, OpenSpec prompts, and the Figma-to-block prompt/skill, framed as the enabler for a one-engineer-per-block delivery model.
- Publish a "Roadmap / Open Problems" checklist so contributors know which workflow gaps are intentionally unsolved today.

**Non-Goals:**

- Rewriting or relocating any instruction files under `.github/instructions/` or skill files under `.github/skills/`; the README only links to them.
- Adding screenshots, diagrams, or video embeds — text-only in this iteration.
- Documenting individual blocks under `src/blocks/`; block-level documentation stays in the block folders and instruction files.
- Translating the README into multiple languages; English only.
- Producing external marketing collateral or a public-facing landing page.
- Changing any build configuration, lint rule, or runtime code.

## Decisions

### Decision 1: Keep upstream content, append project-specific content

Rather than replacing the current README wholesale, the rewrite keeps the upstream sections (Environments, Documentation, Prerequisites, Installation, Linting, Local development) and **adds** the project-specific sections above and around them. The upstream block is grouped under a clearly labeled heading (e.g., "Upstream aem-boilerplate Reference" or kept near the bottom as "Boilerplate Reference").

**Why:** Readers arriving from Adobe documentation should still recognize the familiar landmarks; removing them would create churn for no benefit.

**Alternative considered:** Replace the upstream content entirely and rely on links back to Adobe docs. Rejected because the current Prerequisites / Local development steps are already tailored (references to `aem up`, the AEM Code Sync app, nodejs 18.3.x, AEM Cloud Service 2024.8) and are the fastest path to a working local setup.

### Decision 2: Section order optimized for the new reader

Final top-level section order:

1. Title + one-paragraph overview
2. Project Overview (what this repo is and how it differs from `aem-boilerplate-xwalk`)
3. Architecture Highlights (build pipeline + src/-first layout)
4. EDS Compatibility Guarantee
5. Developer Workflow (scripts table + watch-mode note)
6. Spec-Driven Development (skills + prompts inventory, including Figma-to-block)
7. Roadmap & Open Problems (checklist)
8. Further Reading (links to `.github/instructions/*`)
9. Upstream aem-boilerplate Reference (Environments, Documentation, Prerequisites, Installation, Linting, Local development)

**Why:** New engineers and reviewers get the "what and how" of this project first; upstream reference material is still one scroll away but does not dominate the top of the page.

**Alternative considered:** Put upstream content at the top (current state). Rejected — this is what leaves every project-specific improvement invisible.

### Decision 3: Tabular scripts section

Document npm scripts in a Markdown table (`| Script | Purpose |`) rather than a bulleted prose list.

**Why:** Scripts are a reference lookup; tables are the shortest route from "which command do I run?" to answer.

**Alternative considered:** Prose paragraphs grouped by workflow phase. Rejected as verbose and harder to scan.

### Decision 4: SDD section groups skills by purpose

Skills and prompts are grouped under three subheadings — "AEM EDS skills", "OpenSpec workflow prompts", and "Figma → Block workflow" — not listed alphabetically.

**Why:** Readers evaluate workflows, not skill names. Grouping answers "which of these do I reach for when…?" at a glance. The Figma-to-block workflow is highlighted because it is the team's most distinctive automation and the enabler of the one-engineer-per-block delivery model called out in the proposal.

**Alternative considered:** A flat alphabetical list. Rejected — it buries the Figma workflow and obscures the OpenSpec lifecycle order.

### Decision 5: Roadmap expressed as a Markdown task list

Open problems are written as `- [ ]` task-list entries rather than prose so they render as an interactive checklist on GitHub and can be mentally ticked off as items graduate into implemented specs.

**Items to include (minimum):**

- [ ] Formalize Figma-to-block fidelity constraints (which design affordances translate cleanly, which require manual negotiation).
- [ ] Component classification based on design and functional analysis (how to decide "is this a new block or a variant?").
- [ ] Component performance evaluation tooling and budgets (how we measure a block's LCP / CLS / TBT contribution).
- [ ] Formalize the two-phase loading contract (currently planned on paper and in trial; needs enforceable rules and tests).
- [ ] Further build/bundle optimizations (deferred chunks, shared vendor policy, CSS budgeting).
- [ ] Any additional items surfaced by the team during review.

**Why:** A checklist communicates honestly that the work is ongoing, invites contribution, and survives as a living document — contributors can open PRs that tick items and reference matching OpenSpec changes.

### Decision 6: No diagrams in this iteration

The README stays text-only. If a Mermaid or ASCII diagram is warranted later, it will be proposed as a separate change.

**Why:** Keeps this change reviewable in a single pass and avoids bike-shedding on diagram style during the first rewrite.

## Risks / Trade-offs

- **Risk: README drifts as the architecture evolves.** → Mitigation: pair future architecture-changing specs with a README update task in their `tasks.md`; link the README's Architecture section to specific capability spec names where it helps.
- **Risk: Script table goes stale when `package.json` changes.** → Mitigation: the `aem-skill-code-review` skill reviewer and the commit-conventions instruction already require matching documentation updates; reviewers check the README when script names change.
- **Risk: The "Roadmap & Open Problems" list becomes a graveyard.** → Mitigation: entries name the concern, not a person; as items graduate into accepted specs under `openspec/specs/`, they are ticked and can link to the spec.
- **Risk: Over-claiming EDS compatibility.** → Mitigation: the compatibility statement is scoped to three concrete invariants (two-phase loading, block colocation, UE JSON at root), all of which are already enforced by the build configuration and can be verified at any time.
- **Trade-off: Length.** The new README is meaningfully longer than the current placeholder. This is accepted because the extra length is navigable (each section is independently scannable) and no reader is forced to read past the section relevant to them.

## Migration Plan

1. Replace `README.md` with the new content in a single commit on a feature branch.
2. Run `npm run format` (or `npm run format:check`) to confirm Prettier normalization of the file.
3. Open a PR; reviewers confirm that (a) each requirement in `specs/project-readme-documentation/spec.md` is satisfied and (b) upstream sections are still present.
4. No rollback concern beyond `git revert` — the change is documentation-only and has no runtime impact.

## Open Questions

- Should the "Upstream aem-boilerplate Reference" section remain inline at the bottom of the README, or move to `docs/upstream-reference.md` with only a link from the README? Leaning toward **inline** for this iteration to avoid spreading setup information across files; revisit if the README exceeds a comfortable length.
- Should the `three.js`-related skills (`threejs-*`) be mentioned in the SDD section? Leaning toward **no** — they are general-purpose assistant skills, not part of the AEM/EDS workflow story this README is selling. Revisit if Three.js becomes a first-class architectural concern.
- Final wording for the section titled "Project Overview" vs. alternatives such as "About This Project" or "What Is This Repo?" — decided at authoring time; consistency with existing instruction-file voice is the tiebreaker.
