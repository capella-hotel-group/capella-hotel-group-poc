---
description: Scaffold an AEM EDS xwalk block from a Figma design
---

<!-- Developer-facing slash command — delegates to the `aem-skill-create-block-from-figma` skill -->

Create an AEM EDS xwalk block from a Figma design.

---

**Input**: `/aem-create-block-from-figma <block-name> <figma-url> [description]`

`<block-name>` and `<figma-url>` are required. `<block-name>` must be kebab-case. `<figma-url>` must be a valid `figma.com` URL. `[description]` is optional free text — use it to describe interactions, states, animation timing, or cross-block context that Figma MCP cannot infer visually.

---

## Step 1 — Parse inputs

**Block name:**

- If no name is provided, use the **AskUserQuestion tool** to ask for it.
- Convert to kebab-case if needed (e.g., "My Hero Section" → `my-hero-section`). Confirm with the developer before proceeding.

**Figma URL:**

- Must be a valid `figma.com` URL.
- If not provided, ask with **AskUserQuestion**.

**Description (optional):**

- If present, pass as-is to the skill. Do NOT ask for it unless the developer has not provided a URL either.

---

## Step 2 — Invoke the skill

Use the **aem-skill-create-block-from-figma** skill with the parsed inputs:

- `blockName`: the kebab-case block name
- `figmaUrl`: the validated Figma URL
- `description`: the optional developer brief (omit if not provided)

The skill handles all workflow steps: Figma MCP lookup, node analysis, field mapping, file generation, AEM registration, and build verification.
