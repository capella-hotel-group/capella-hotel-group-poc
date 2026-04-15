## 1. Update the prompt

- [x] 1.1 Replace the prompt body with a delegation pattern: parse `<block-name>`, `<figma-url>`, and optional `[description]` from user input, then invoke the `aem-skill-create-block-from-figma` skill with those arguments
- [x] 1.2 Add a one-line purpose comment at the top of the prompt body: "Developer-facing slash command — delegates to the `aem-skill-create-block-from-figma` skill"
- [x] 1.3 Update the `description:` frontmatter to reflect the delegation role

## 2. Update the skill

- [x] 2.1 Add a two-sentence purpose header to the skill body: state that it is the canonical implementation invoked by both the prompt (human entry point) and agents (machine entry point)

## 3. Update developer documentation

- [x] 3.1 Add an "Architecture" section to `docs/agents/aem-create-block-from-figma.md` explaining the prompt-vs-skill two-entry-point model and when each path is used
- [x] 3.2 Add dual invocation examples to the docs: developer slash command and agent-to-agent (programmatic) invocation

## 4. Verify

- [x] 4.1 Confirm the prompt file contains no duplicated workflow logic (no step tables, no field-mapping rules, no code generation templates)
- [x] 4.2 Confirm the skill file logic is unchanged — only the purpose header was added
- [x] 4.3 Confirm the docs cover both invocation paths clearly
