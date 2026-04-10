---
name: create-block-from-figma
description: Given a block name and a Figma URL, scaffold a complete AEM EDS xwalk block (TypeScript decorator, CSS stylesheet, and JSON component model). Reads the Figma design via MCP to infer field types and structure. Use when asked to create a new block from a Figma design, or when an agent needs to generate block files automatically.
license: MIT
compatibility: Requires the Figma MCP server to be configured in VS Code (`mcp_com_figma_mcp_*` tools must be available).
metadata:
  author: doson-ogilvy
  version: "1.0"
---

Create an AEM EDS xwalk block from a Figma design.

Scaffold three files at `src/blocks/<block-name>/`:
- `<block-name>.ts` — TypeScript decorator
- `<block-name>.css` — Block-scoped styles
- `_<block-name>.json` — AEM xwalk component model

---

**Input**: A `blockName` (kebab-case) and a `figmaUrl` (valid `figma.com` URL).

When invoked by another agent, these should be passed as arguments. When invoked directly by a developer, read them from the user's message.

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

---

## Step 3 — Analyse the Figma node

### Structure type detection

| Signal | Pattern |
|---|---|
| 3+ visually similar child frames or instances of same component | Container + filter (like `_cards.json`) |
| Single content area, no repeating children | Simple model (like `_hero.json`) |
| Ambiguous (2 children, mixed types) | Ask the developer |

### Field-type mapping

| Figma element | AEM `component` | `valueType` | Notes |
|---|---|---|---|
| Short text / label (≤80 chars, no formatting) | `text` | `string` | Alt, subtitle, single-line |
| Long text / body copy / heading | `richtext` | `string` | Include `"value": ""` |
| Image fill / asset frame | `reference` | `string` | `"multi": false`; gallery → `"multi": true` |
| Link / CTA button | `aem-content` | `string` | Internal links only |
| Toggle / boolean property | `boolean` | `boolean` | Flags, display toggles |
| Variant / style selector | `select` | `string` | Block display variants |

### 4-field limit

If more than 4 fields are inferred, stop and ask the developer to prioritize before generating.

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
      "fields": [ /* mapped fields, max 4 */ ]
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
      "fields": [ /* mapped fields, max 4 */ ]
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

### `<block-name>.css`

```css
/* <block-name> block */
.<block-name> {
    /* container styles */
}

.<block-name>-item {
    /* item styles */
}

.<block-name>-image {
    width: 100%;
}

.<block-name>-image img {
    width: 100%;
    height: auto;
    object-fit: cover;
}

.<block-name>-body {
    color: var(--text-color);
    background-color: var(--background-color);
}

@media (width >= 900px) {
    .<block-name> {
        /* desktop overrides */
    }
}
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

Write all three files. When invoked by another agent, return:
```json
{ "blockName": "<block-name>", "files": ["src/blocks/<block-name>/<block-name>.ts", "src/blocks/<block-name>/<block-name>.css", "src/blocks/<block-name>/_<block-name>.json"] }
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

## Guardrails

- Figma MCP unavailable → stop with setup message, no files generated
- Block folder exists → ask before overwriting
- Ambiguous structure → ask before choosing pattern
- >4 fields → ask before truncating
- Block name not kebab-case → auto-convert and confirm
- No hardcoded hex/px in CSS → use `var(--token-name)`
- No relative `../../` imports → use `@/` alias
- No `innerHTML =` → use `replaceChildren()`
- Generated code must pass `npm run lint` and `npm run build`
