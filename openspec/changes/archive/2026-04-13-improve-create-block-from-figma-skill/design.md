## Context

The `create-block-from-figma` prompt and skill are the primary scaffolding tools for creating AEM EDS blocks. They work by reading Figma design data via MCP and generating three files: a TypeScript decorator, a CSS stylesheet, and a JSON component model. The current skill (Step 1) accepts only two inputs — `blockName` and `figmaUrl` — and has no structured way for a developer to communicate what the Figma MCP cannot see: interaction intent, animation sequencing, component relationships, or the fact that multiple Figma frames represent one block's state machine.

Two naming issues also need resolving: the prompt/skill use `create-block-from-figma` rather than the `aem-*` prefix convention, and there is no developer-facing doc explaining how to use them.

## Goals / Non-Goals

**Goals:**
- Rename prompt and skill to `aem-create-block-from-figma` (reserves `aem-create-block` for a future basic-scaffolding variant)
- Add optional `description` input: collected at invocation start; re-offered after Figma fetch only when the fetched node is visually ambiguous (unlabelled interaction, unclear state)
- Add multi-state detection: auto-detect from Figma child frame naming → confirm → generate; also accept states declared via description text or multiple Figma node IDs
- Add `data-state` attribute pattern for JS-driven states and CSS `[data-state]` selectors to the code templates
- Create `docs/agents/aem-create-block-from-figma.md` as a standalone developer guide

**Non-Goals:**
- Renaming `opsx-*` prompts — they are workflow tooling, not AEM-specific
- Adding `description` to any other skill or prompt
- CSS pseudo-class states (`:hover`, `:focus-visible`) are not "multi-state" — they need no skill change
- Updating archived history in `openspec/changes/archive/`

## Decisions

### Decision 1: `description` is an optional third input, collected at start

The developer may pass it alongside `blockName` and `figmaUrl`. If not given, the skill skips it silently. After Figma fetch, if the node is structurally ambiguous (e.g., a frame with no child naming convention, or the description mentions "step" behaviour that isn't visible), the skill re-offers the description prompt.

**Alternatives considered:**
- Always ask for description — rejected; adds friction for simple components where Figma data is sufficient
- Only ask after fetch — rejected; developers often know the interaction intent upfront and providing it early improves the analysis in Step 3

### Decision 2: Multi-state delivery via three paths (hybrid)

Detection can come from:
1. **Auto-detect** — Figma child frames with state-naming patterns (`default/hover/active`, `step-1/step-2/step-N`, `state=loading`) are detected automatically; the skill shows the detected list and asks for confirmation before generating
2. **Description-driven** — developer mentions states in the brief ("3 steps: closed, submenu open, full overlay"); the skill parses these and confirms
3. **Multiple node IDs** — developer provides separate Figma URLs for each state frame; the skill fetches them sequentially and merges the field analysis

All three paths converge on the same confirmation step: show detected states → developer confirms → generate.

**Alternatives considered:**
- Only path 1 (auto-detect) — rejected; frame naming is inconsistent across Figma files and designers
- Only path 3 (explicit URLs) — rejected; too much friction for simple cases where names are obvious

### Decision 3: JS-driven states use `data-state` attribute, not CSS class toggles

`block.dataset.state = 'loading'` with CSS `[data-state="loading"]` selectors.

**Rationale:** A single attribute cleanly encodes the current state (one active state at a time is the common case). Class toggling requires managing add/remove pairs and is harder to read at a glance. For multi-value states (e.g., `data-step="2"`) the dataset approach is equally direct.

**Exception:** CSS pseudo-class states (`:hover`, `:focus-visible`) require no JS and no `data-state` — they are handled via CSS only, so they do not appear in the state detection protocol.

### Decision 4: `>3 JS-driven states` triggers a confirmation guardrail

Mirrors the existing `>4 fields` guardrail. If the auto-detected or description-parsed state list has more than 3 JS-driven states, the skill pauses and asks the developer to confirm or trim before generating.

### Decision 5: `docs/agents/aem-create-block-from-figma.md` — dedicated file, not README

A per-skill file at `docs/agents/` scales gracefully as more skills are added (future `aem-create-block.md`, `aem-migrate-block.md`). A monolithic `docs/agents/README.md` would become hard to maintain.

## Risks / Trade-offs

- **Figma frame naming is inconsistent** — state auto-detection relies on naming heuristics. If a Figma file uses non-standard names, detection misses. → Mitigation: the confirmation step always fires before generating; developer can correct.
- **Description is free text, not structured** — parsing states from text is heuristic. The skill must show its interpretation and ask for confirmation. → Mitigation: confirmation step is mandatory for all multi-state paths.
- **Multi Figma node fetch is sequential** — fetching N node IDs takes N round-trips. For >5 states this could be slow. → Mitigation: document limit of 5 state frames; developer should merge visually similar states before sharing URLs.
