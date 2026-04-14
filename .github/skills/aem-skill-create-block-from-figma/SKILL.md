---
name: aem-skill-create-block-from-figma
description: Scaffold a complete AEM EDS xwalk block from a Figma design. Use when an agent or workflow task requires block scaffolding from a Figma URL. Developers: use the /aem-create-block-from-figma prompt instead.
license: MIT
compatibility: Requires the Figma MCP server to be configured in VS Code (`mcp_com_figma_mcp_*` tools must be available).
metadata:
  author: doson-ogilvy
  version: '2.0'
---

<!-- Canonical implementation — invoked by developers via the `/aem-create-block-from-figma` prompt slash command and by agents programmatically (as `aem-skill-create-block-from-figma`). All workflow logic lives here; the prompt is a thin delegation wrapper that parses inputs and calls this skill. -->

Create an AEM EDS xwalk block from a Figma design.

Scaffold three files at `src/blocks/<block-name>/`:

- `<block-name>.ts` — TypeScript decorator
- `<block-name>.css` — Block-scoped styles
- `_<block-name>.json` — AEM xwalk component model

---

**Input**: A `blockName` (kebab-case), a `figmaUrl` (valid `figma.com` URL), and an optional `description` (free text).

When invoked by another agent, these should be passed as arguments. When invoked directly by a developer, read them from the user's message.

The `description` is a free-text brief — use it to describe interactions, animation timing, component state sequences, accessibility requirements, or cross-block context that Figma MCP cannot infer visually. It is optional; the skill works without it.

---

## Step 1 — Parse and validate inputs

**Block name:**

- If no name is provided, use the **AskUserQuestion tool** to ask for it.
- Convert to kebab-case if needed (e.g., "My Hero Section" → `my-hero-section`). Confirm the converted name before proceeding.
- Valid pattern: `/^[a-z][a-z0-9-]*$/`

**Figma URL parsing:**

- Extract `fileKey` from the path: `figma.com/design/<fileKey>/...`
- Extract `nodeId` from the query: `node-id=<nodeId>` — convert `-` separators to `:` (e.g., `123-456` → `123:456`)
- If no `node-id` is present, `nodeId` is null
- Multiple URLs may be provided (one per state frame) — collect all and process sequentially in Step 2

**Description / brief (optional):**

- If a `description` is provided, store it as `devBrief` for reference throughout Steps 3, 4, and 5
- If not provided, skip silently — do NOT ask unless the component turns out to be ambiguous after Step 2

**Block collision check:**

- Check if `src/blocks/<block-name>/` already exists.
- If it does, ask the developer: "Block `<block-name>` already exists. Overwrite all three files, or abort?" Do NOT proceed without confirmation.

---

## Step 2 — Fetch Figma design data

**Check Figma MCP availability:**

- If `mcp_com_figma_mcp_get_design_context` is NOT in the available tool set, stop and return:
  > "Figma MCP is not connected. Please ensure the Figma MCP server is configured in your VS Code MCP settings."

**Fetch:**

- `nodeId` present → `mcp_com_figma_mcp_get_design_context` with `fileKey` and `nodeId`
- `nodeId` null → `mcp_com_figma_mcp_get_metadata` with `fileKey` to list frames, ask developer to select, then call `mcp_com_figma_mcp_get_design_context` with the selected node
- Multiple URLs provided → call `mcp_com_figma_mcp_get_design_context` for each node sequentially; label results by the URL order (state-1, state-2, …) for use in Step 3

**Post-fetch ambiguity check:**

- If the fetched node has no recognisable child naming convention, no state indicators, and no `devBrief` was provided, offer: "This component may have interaction states or multi-step behaviour. Would you like to add a brief description to improve the output?"
- If the developer declines or the component is clearly self-contained, proceed to Step 3 without a brief

---

## Step 3 — Analyse the Figma node

### Structure type detection

| Signal                                                          | Pattern                                 |
| --------------------------------------------------------------- | --------------------------------------- |
| 3+ visually similar child frames or instances of same component | Container + filter (like `_cards.json`) |
| Single content area, no repeating children                      | Simple model (like `_hero.json`)        |
| Ambiguous (2 children, mixed types)                             | Ask the developer                       |

### Field-type mapping

| Figma element                                 | AEM `component` | `valueType` | Notes                                       |
| --------------------------------------------- | --------------- | ----------- | ------------------------------------------- |
| Short text / label (≤80 chars, no formatting) | `text`          | `string`    | Alt, subtitle, single-line                  |
| Long text / body copy / heading               | `richtext`      | `string`    | Include `"value": ""`                       |
| Image fill / asset frame                      | `reference`     | `string`    | `"multi": false`; gallery → `"multi": true` |
| Link / CTA button                             | `aem-content`   | `string`    | Internal links only                         |
| Toggle / boolean property                     | `boolean`       | `boolean`   | Flags, display toggles                      |
| Variant / style selector                      | `select`        | `string`    | Block display variants                      |

### 4-field limit

If more than 4 fields are inferred, stop and ask the developer to prioritize before generating.

### State detection

After structure and field analysis, check for multi-state signals from **all three sources** — first auto-detect from Figma, then check `devBrief`, then check whether multiple node IDs were provided. All paths converge on the same confirmation step.

**Detection signals:**

| Signal                                                                  | Source | Action                                                             |
| ----------------------------------------------------------------------- | ------ | ------------------------------------------------------------------ |
| Child frames named `default`, `hover`, `active`, `focus`, `disabled`    | Figma  | Likely CSS-only → ask trigger type before deciding                 |
| Child frames named `loading`, `empty`, `expanded`, `open`, `closed`     | Figma  | Likely JS-driven → ask trigger type before deciding                |
| Child frames named `step-1`, `step-2`, `step-N` (or `step_1`, `Step 1`) | Figma  | Likely multi-step sequence → ask trigger type before deciding      |
| Figma variant property with ≥2 non-pseudo-class values                  | Figma  | Ask trigger type before deciding                                   |
| `devBrief` mentions state words: "step", "state", "phase", "screen"     | Brief  | Parse state names from text → ask trigger type                     |
| Multiple Figma node IDs provided                                        | Input  | Frames are visual references for this component → ask trigger type |

**Trigger type question (mandatory before any state-aware code is generated):**

When multiple states or frames are detected — regardless of source — always ask the developer:

> "These frames show different visual states of the component. How are they triggered?"
>
> 1. **CSS-only** — hover, focus, transition, or animation; no JavaScript needed
> 2. **JS-driven** — click, scroll, timer, or external event; JavaScript manages state transitions
> 3. **Visual reference only** — these frames are just to show the full design; generate a single CSS implementation that covers all the visual rules, no state logic

Do NOT assume a trigger type from frame names alone. A frame named `hover` might still be JS-triggered; a frame named `expanded` might be a pure CSS transition. Only the developer knows.

**Generating based on the answer:**

| Answer                | What to generate                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| CSS-only              | Standard `.ts` (CSS-only template) + CSS with pseudo-class rules and/or transition blocks per visual frame              |
| JS-driven             | TS with `block.dataset.state` transitions + CSS `[data-state]` selectors                                                |
| Visual reference only | Standard `.ts` (CSS-only template) + comprehensive CSS that incorporates visual details from all frames; no state logic |

If >3 JS-driven states are selected, additionally ask: "This will generate code for N states. Are you sure, or would you like to reduce the list?"

**CSS pseudo-class states (`:hover`, `:focus-visible`, `:disabled`):**

- These are the only states that can be confirmed as CSS-only without asking — they are structurally tied to browser events, not JS
- All other state names require trigger type confirmation

---

## Step 4 — Generate files

### `_<block-name>.json`

**Simple model:**

```json
{
  "definitions": [
    {
      "title": "<Block Title>",
      "id": "<block-name>",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "<Block Title>",
              "model": "<block-name>"
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "<block-name>",
      "fields": [
        /* mapped fields, max 4 */
      ]
    }
  ],
  "filters": []
}
```

**Container + filter model:**

```json
{
  "definitions": [
    {
      "title": "<Block Title>",
      "id": "<block-name>",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "<Block Title>",
              "filter": "<block-name>"
            }
          }
        }
      }
    },
    {
      "title": "<Item Title>",
      "id": "<block-name>-item",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block/item",
            "template": {
              "name": "<Item Title>",
              "model": "<block-name>-item"
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "<block-name>-item",
      "fields": [
        /* mapped fields, max 4 */
      ]
    }
  ],
  "filters": [
    {
      "id": "<block-name>",
      "components": ["<block-name>-item"]
    }
  ]
}
```

**Field object examples:**

```json
{ "component": "reference", "valueType": "string", "name": "image", "label": "Image", "multi": false }
{ "component": "text", "valueType": "string", "name": "imageAlt", "label": "Alt", "value": "" }
{ "component": "richtext", "name": "text", "value": "", "label": "Text", "valueType": "string" }
{ "component": "aem-content", "valueType": "string", "name": "link", "label": "Link" }
{ "component": "boolean", "valueType": "boolean", "name": "showOverlay", "label": "Show Overlay" }
{ "component": "select", "valueType": "string", "name": "variant", "label": "Variant", "options": [{ "name": "Default", "value": "default" }] }
```

### `<block-name>.ts`

CSS-only (default — use unless design requires DOM restructuring):

```typescript
export default function decorate(_block: HTMLElement): void {
  // <Block Title> block — decoration handled via CSS
}
```

DOM-restructuring (async, imports `moveInstrumentation`):

```typescript
import { moveInstrumentation } from '@/app/scripts';

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.querySelectorAll<HTMLElement>(':scope > div')];
  rows.forEach((row) => {
    const cells = [...row.querySelectorAll<HTMLElement>(':scope > div')];
    // restructure cells into semantic elements
    // call moveInstrumentation(source, target) when moving AEM-instrumented nodes
    // call block.replaceChildren(...newElements) once at the end
  });
}
```

With images (imports `createOptimizedPicture`):

```typescript
import { createOptimizedPicture } from '@/app/aem';
import { moveInstrumentation } from '@/app/scripts';

export default async function decorate(block: HTMLElement): Promise<void> {
  const pictures = [...block.querySelectorAll<HTMLPictureElement>('picture')];
  pictures.forEach((pic) => {
    const img = pic.querySelector<HTMLImageElement>('img');
    if (!img) return;
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(pic, optimized);
    pic.replaceWith(optimized);
  });
}
```

JS-driven states (use when multi-state is confirmed — `data-state` attribute pattern):

```typescript
export default async function decorate(block: HTMLElement): Promise<void> {
  // Build DOM, then call block.replaceChildren(...) once

  // Set initial state
  block.dataset.state = 'default';

  // Example: toggle to expanded on button click
  const trigger = block.querySelector<HTMLButtonElement>('.\<block-name\>-trigger');
  trigger?.addEventListener('click', () => {
    const current = block.dataset.state;
    block.dataset.state = current === 'expanded' ? 'default' : 'expanded';
  });
}
```

Multi-step sequence (use when `step-N` states are confirmed):

```typescript
export default async function decorate(block: HTMLElement): Promise<void> {
  // Build DOM, then call block.replaceChildren(...) once

  const totalSteps = 3; // replace with actual count
  let currentStep = 1;

  function goToStep(n: number): void {
    if (n < 1 || n > totalSteps) return;
    currentStep = n;
    block.dataset.step = String(n);
  }

  goToStep(1); // initialise

  block.querySelector<HTMLButtonElement>('.\<block-name\>-next')?.addEventListener('click', () => {
    goToStep(currentStep + 1);
  });
  block.querySelector<HTMLButtonElement>('.\<block-name\>-prev')?.addEventListener('click', () => {
    goToStep(currentStep - 1);
  });
}
```

### `<block-name>.css`

```css
/* <block-name> block */
.<block-name > {
  /* container styles */
}

.<block-name > -item {
  /* item styles */
}

.<block-name > -image {
  width: 100%;
}

.<block-name > -image img {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.<block-name > -body {
  color: var(--text-color);
  background-color: var(--background-color);
}

@media (width >= 900px) {
  .<block-name > {
    /* desktop overrides */
  }
}
```

JS-driven state selectors (append when multi-state is confirmed):

```css
/* <block-name> — JS-driven states */
.<block-name > [data-state='default'] {
  /* default state styles */
}

.<block-name > [data-state='loading'] {
  /* loading state styles */
}

.<block-name > [data-state='expanded'] {
  /* expanded state styles */
}
```

Multi-step sequence selectors (append when step-N states are confirmed):

```css
/* <block-name> — step states */
.<block-name > [data-step] .<block-name > -panel {
  display: none;
}

.<block-name > [data-step='1'] .<block-name > -panel:nth-child(1),
.<block-name > [data-step='2'] .<block-name > -panel:nth-child(2) {
  display: block;
}

/* Extend for each additional step */
```

CSS rules:

- BEM-adjacent naming: `.<block-name>`, `.<block-name>-<element>`, `.<block-name>-<element>--<modifier>`
- All values use `var(--token-name)` — no hardcoded hex or px
- Modern range media queries: `@media (width >= 900px)`
- 4-space indentation
- No nested selectors — keep flat

---

## Step 5 — Confirm and write

Summarise the generation plan before writing:

> **Block:** `<block-name>`
> **Structure:** \<Simple model / Container+filter\>
> **Fields:** \<list name + component for each field\>
> **States:** \<None / list of JS-driven states or step sequence\> _(omit line if no multi-state)_
> **Brief:** \<First 100 chars of devBrief\> _(omit line if no description provided)_

Write all three files. When invoked by another agent, return:

```json
{
  "blockName": "<block-name>",
  "files": [
    "src/blocks/<block-name>/<block-name>.ts",
    "src/blocks/<block-name>/<block-name>.css",
    "src/blocks/<block-name>/_<block-name>.json"
  ]
}
```

---

## Step 6 — Register block in AEM

### 6a. Add block to section filter

Open `src/models/_section.json` and add `"<block-name>"` to the `filters[0].components` array in alphabetical order. This makes the block insertable in the Universal Editor.

### 6b. Regenerate root AEM component JSON files

Run `npm run build:json`. This regenerates:

- `component-models.json`
- `component-definition.json`
- `component-filters.json`

The new block will NOT appear in the Universal Editor until both 6a and 6b are complete.

When invoked by another agent, include this step in the returned result:

```json
{ "blockName": "<block-name>", "files": [...], "sectionJsonUpdated": true, "jsonRegenerated": true }
```

If `build:json` fails, report the error and instruct the developer to run `npm run build:json` manually.

---

## Step 7 — Verify build

Run the full Vite build to confirm the new block compiles without errors:

```bash
npm run build
```

- If the build **passes**: confirm to the developer that the block compiled successfully and output is at `blocks/<block-name>/<block-name>.js`
- If the build **fails**: show the compiler error, identify the likely cause (type error, missing import, invalid CSS token), fix it in the generated files, and re-run `npm run build` until it passes
- Do NOT leave a failing build — fix all errors before finishing

When invoked by another agent, include the result:

```json
{ "blockName": "<block-name>", "files": [...], "sectionJsonUpdated": true, "jsonRegenerated": true, "buildPassed": true }
```

---

## Optional Next Steps

After the block builds successfully, these skills are available if needed:

- **`aem-skill-testing-blocks`** — validate the block in a real browser (lint, responsive check, screenshot)
- **`aem-skill-code-review`** — self-review before opening a PR (TypeScript patterns, CSS scoping, security)

These are optional — invoke them if the developer asks or if the block is complex enough to warrant it.

---

## Guardrails

- Figma MCP unavailable → stop with setup message, no files generated
- Block folder exists → ask before overwriting
- Ambiguous structure → ask before choosing pattern
- > 4 fields → ask before truncating
- Multi-state frames detected → always ask trigger type (CSS-only / JS-driven / visual reference) before generating
- Never assume trigger type from frame names alone — a `hover` frame could be JS-triggered
- > 3 JS-driven states confirmed → ask developer to confirm or reduce list before generating
- Trigger type not confirmed → fall back to CSS-only template, no state logic generated
- Block name not kebab-case → auto-convert and confirm
- CSS pseudo-class states (`:hover`, `:focus`) → only exception that is always CSS-only without asking
- No hardcoded hex/px in CSS → use `var(--token-name)`
- No relative `../../` imports → use `@/` alias
- No `innerHTML =` → use `replaceChildren()`
- Generated code must pass `npm run lint` and `npm run build`
