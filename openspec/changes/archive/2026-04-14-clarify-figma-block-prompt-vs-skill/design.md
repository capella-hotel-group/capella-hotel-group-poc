## Context

VS Code Copilot has two distinct extension mechanisms for packaging AI instructions:

- **`.prompt.md` files** under `.github/prompts/` — appear as slash commands (e.g., `/aem-create-block-from-figma`) in Copilot Chat. Invoked by humans. No structured return value.
- **`SKILL.md` files** under `.github/skills/` — agent-to-agent interface. Invoked programmatically by other agents (e.g., `openspec-apply-change` uses a `runSubagent` call). Returns a structured result that the caller can act on.

Both entry points are legitimately needed. Neither can be removed without breaking a workflow. The problem is that they have drifted into parallel implementations after the v2.0 skill upgrade. The skill is now the richer, more correct version and the spec requires them to "mirror" each other — a maintenance contract that nobody is enforcing.

## Goals / Non-Goals

**Goals:**

- Make the prompt a thin delegation wrapper: it parses inputs and invokes the skill
- Make the skill the single source of logic: canonical implementation, no duplication
- Update the developer docs to explain both entry points and why both exist
- Remove the "skill mirrors the prompt" spec requirement and replace with "skill is the canonical implementation"

**Non-Goals:**

- Changing any workflow logic in the skill
- Changing the developer-visible command syntax (`/aem-create-block-from-figma <name> <url> [desc]`)
- Modifying how `openspec-apply-change` or other agents invoke the skill
- Adding any new block-creation capabilities

## Decisions

### Decision 1: Prompt delegates to the skill rather than re-implementing logic

The prompt should contain exactly: "parse these inputs then invoke the `aem-skill-create-block-from-figma` skill with them." No step tables, no field-mapping rules, no code generation templates.

**Alternatives considered:**

- **Merge into one file** — rejected. `.prompt.md` and `SKILL.md` have different metadata schemas, different invocation contexts, and different return conventions (skill returns JSON flags; prompt does not). A single file cannot serve both roles.
- **Remove the prompt, have developers invoke the skill directly** — rejected. Skills do not appear as slash commands in the VS Code UI; devs would lose the discoverable chat entry point.
- **Keep both as parallel implementations and commit to backport discipline** — rejected. History shows upgrades are not reliably backported (v2.0 skill was shipped April 2026, prompt never updated). The duplication will re-emerge.

### Decision 2: The spec `figma-to-block-prompt` gets a single new requirement replacing the step-by-step ones

Rather than carrying the full 7-step workflow in the prompt spec, the spec for the prompt collapses to two requirements: (1) invocable via slash command, (2) delegates to the skill with parsed inputs. The skill spec already owns all workflow requirements; the prompt spec should not duplicate them.

### Decision 3: The skill spec removes "mirrors the prompt" and gains "canonical implementation" language

The `figma-to-block-skill` spec requirement "Skill logic mirrors the prompt" is replaced with "Skill is the canonical implementation, invoked by both developers (via prompt) and agents (directly)." This reflects reality after v2.0.

## Risks / Trade-offs

- **Prompt becomes a thin shim** — if the skill cannot be loaded (e.g., agent customization not enabled), the developer gets no useful error from the prompt. Mitigation: the skill already handles the Figma MCP unavailability case; the prompt inherits those guardrails via delegation.
- **Spec delta removes detail** — the prompt spec will be much shorter. If a future developer looks only at the prompt spec, they won't see the workflow details. Mitigation: the prompt spec explicitly references the skill spec as the authoritative source.
