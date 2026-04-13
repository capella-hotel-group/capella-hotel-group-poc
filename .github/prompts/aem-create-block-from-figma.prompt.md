---
description: Create an AEM EDS xwalk block from a Figma design — reads the Figma node via MCP and scaffolds all three block files (TypeScript, CSS, JSON model)
---

Create an AEM EDS xwalk block from a Figma design.

I'll scaffold:
- `src/blocks/<block-name>/<block-name>.ts`
- `src/blocks/<block-name>/<block-name>.css`
- `src/blocks/<block-name>/_<block-name>.json`

---

**Input**: `/aem-create-block-from-figma <block-name> <figma-url> [description]`

`<block-name>` and `<figma-url>` are required. `<block-name>` must be kebab-case. `<figma-url>` must be a valid `figma.com` URL. `[description]` is optional free text — use it to describe interactions, states, animation timing, or cross-block context that Figma MCP cannot infer visually.

---

## Step 1 — Parse and validate inputs

**Block name:**
- If no name is provided, use the **AskUserQuestion tool** to ask for it.
- Convert to kebab-case if not already (e.g., "My Hero Section" → `my-hero-section`). Confirm the converted name with the developer before proceeding.
- Valid pattern: `/^[a-z][a-z0-9-]*$/`

**Figma URL parsing:**
- Extract `fileKey` from the URL path: `figma.com/design/<fileKey>/...`
- Extract `nodeId` from the query string: `node-id=<nodeId>` — convert any `-` separators to `:` (e.g., `123-456` → `123:456`)
- If no `node-id` is present, `nodeId` is null — handle in Step 2

**Block collision check:**
- Check if `src/blocks/<block-name>/` already exists in the workspace.
- If it does, ask the developer: "Block `<block-name>` already exists. Overwrite all three files, or abort?" Do NOT proceed without confirmation.

---

## Step 2 — Fetch Figma design data

**Check Figma MCP availability first:**
Look for the `mcp_com_figma_mcp_get_design_context` tool in your available tool set. If it is NOT available, stop immediately and display:

> Figma MCP is not connected. Please ensure the Figma MCP server is configured and running in your VS Code MCP settings (`.vscode/mcp.json`). See: https://www.figma.com/developers/mcp

**Fetch the node:**

- If `nodeId` is present → call `mcp_com_figma_mcp_get_design_context` with `fileKey` and `nodeId`
- If `nodeId` is null → call `mcp_com_figma_mcp_get_metadata` with `fileKey` to list top-level frames, then use **AskUserQuestion** to let the developer select which frame to use. Then call `mcp_com_figma_mcp_get_design_context` with the selected node.

---

## Step 3 — Analyse the Figma node

### 3a. Detect structure type (simple vs container+filter)

Inspect the immediate children of the target node:

| Signal | Pattern to generate |
|---|---|
| Children are all instances of the same component, OR 3+ visually similar sibling frames | **Container + filter** (like `_cards.json`) |
| Single content area with no repeating children | **Simple model** (like `_hero.json`) |
| Ambiguous (e.g., 2 children, mixed types) | **Ask the developer** which pattern to use before proceeding |

### 3b. Map Figma layers to AEM xwalk field types

Apply this mapping to each content layer in the node:

| Figma element | AEM `component` | `valueType` | Notes |
|---|---|---|---|
| Short text / label (≤80 chars, no formatting) | `text` | `string` | Alt text, subtitles, single-line fields |
| Long text / body copy / heading (>80 chars or styled) | `richtext` | `string` | Must include `"value": ""` |
| Image fill / asset frame | `reference` | `string` | Set `"multi": false`; gallery → `"multi": true` |
| Link / CTA button | `aem-content` | `string` | Internal links; do NOT use for external URLs |
| Toggle / boolean property | `boolean` | `boolean` | Feature flags, display toggles |
| Variant / style selector | `select` | `string` | Block display variants |

### 3c. Enforce the 4-field limit

The xwalk model enforces a maximum of **4 fields per model row**.

- If analysis yields **4 or fewer fields** → proceed.
- If analysis yields **more than 4 fields** → stop and inform the developer:

  > "I found N fields from the Figma design, but xwalk models support a maximum of 4 fields per row. Please tell me which 4 to include, or if any should be optional/omitted."

  Wait for their response before generating.

---

## Step 4 — Generate the three block files

Use the templates below. Substitute `<block-name>` with the actual kebab-case name throughout.

### `_<block-name>.json` — AEM component model

**Simple model** (use when Step 3a detected a single content area):

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
        /* Insert mapped fields here — max 4 */
      ]
    }
  ],
  "filters": []
}
```

**Container + filter model** (use when Step 3a detected repeating children):

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
        /* Insert mapped fields here — max 4 */
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
{ "component": "select", "valueType": "string", "name": "variant", "label": "Variant", "options": [{ "name": "Default", "value": "default" }, { "name": "Dark", "value": "dark" }] }
```

---

### `<block-name>.ts` — TypeScript decorator

**CSS-only block** (no DOM restructuring needed — layout handled entirely by CSS):

```typescript
export default function decorate(_block: HTMLElement): void {
  // <Block Title> block — decoration handled via CSS
}
```

**DOM-restructuring block** (when images, links, or complex nesting need to be reorganised):

```typescript
import { moveInstrumentation } from '@/app/scripts';

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.querySelectorAll<HTMLElement>(':scope > div')];

  rows.forEach((row) => {
    const cells = [...row.querySelectorAll<HTMLElement>(':scope > div')];
    // TODO: restructure cells into semantic elements
    // Example:
    // const [imageCell, textCell] = cells;
    // const container = document.createElement('div');
    // container.className = '<block-name>-item';
    // moveInstrumentation(row, container);
    // container.append(imageCell, textCell);
    // block.replaceChildren(container);
  });
}
```

**Block with images** (when the block renders `<picture>` elements):

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

Select the appropriate variant based on what the Figma design requires. Use the CSS-only variant by default unless the design clearly needs DOM manipulation.

---

### `<block-name>.css` — Block-scoped styles

```css
/* <block-name> block */
.<block-name> {
    /* container styles */
}

.<block-name>-item {
    /* item styles */
}

.<block-name>-image {
    /* image wrapper */
    width: 100%;
}

.<block-name>-image img {
    width: 100%;
    height: auto;
    object-fit: cover;
}

.<block-name>-body {
    /* text/content area */
    color: var(--text-color);
    background-color: var(--background-color);
}

/* Variant modifier example */
.<block-name>--dark .<block-name>-body {
    color: var(--color-white);
    background-color: var(--color-dark);
}

@media (width >= 900px) {
    .<block-name> {
        /* desktop overrides */
    }
}
```

**CSS rules to follow:**
- All selectors use BEM-adjacent naming: `.<block-name>`, `.<block-name>-<element>`, `.<block-name>-<element>--<modifier>`
- All color and spacing values use CSS variables: `var(--token-name)` — never hardcode hex or px values from the design
- Media queries use modern range syntax: `@media (width >= 900px)`
- 4-space indentation (CSS Prettier override)
- No nested selectors — keep selectors flat

Replace the element names (`-item`, `-image`, `-body`) with names that match the actual Figma layer structure.

---

## Step 5 — Confirm and write files

Before writing, briefly summarise what will be generated:

> **Block:** `<block-name>`
> **Structure:** Simple model / Container+filter (state which)
> **Fields:**
> - `<field-name>` (`<component>`) — `<label>`
> - ...
>
> Write these files?
> 1. `src/blocks/<block-name>/<block-name>.ts`
> 2. `src/blocks/<block-name>/<block-name>.css`
> 3. `src/blocks/<block-name>/_<block-name>.json`

If the developer confirms (or if the mapping was unambiguous and no questions were asked), write all three files.

---

## Step 6 — Register block in AEM

### 6a. Add block to section filter

Open `src/models/_section.json` and add `"<block-name>"` to the `filters[0].components` array, in alphabetical order alongside the existing block names.

Example — adding `my-block`:
```json
"filters": [
  {
    "id": "section",
    "components": [
      "button",
      "cards",
      "custom-fragment",
      "fragment",
      "hero",
      "image",
      "menus",
      "my-block",
      "text",
      "title",
      "video",
      "video-photo-player"
    ]
  }
]
```

This registers the block as an insertable component within a page section in the Universal Editor.

### 6b. Regenerate root AEM component JSON files

After updating `_section.json`, run:

```bash
npm run build:json
```

This merges all `src/blocks/*/_*.json` and `src/models/*.json` into the three root JSON files that AEM reads:
- `component-models.json`
- `component-definition.json`
- `component-filters.json`

The new block will NOT appear in the Universal Editor until both 6a and 6b are complete.

If the command succeeds, confirm:
> "`src/models/_section.json` updated, and `component-models.json`, `component-definition.json`, `component-filters.json` regenerated. The `<block-name>` block is now available in AEM."

If `build:json` fails, show the error and ask the developer to run it manually.

---

## Step 7 — Verify build

Run the full Vite build to confirm the new block compiles without errors:

```bash
npm run build
```

- If the build **passes**: confirm to the developer that the block compiled successfully and the output is at `blocks/<block-name>/<block-name>.js`
- If the build **fails**: show the compiler error, identify the likely cause (type error, missing import, invalid CSS token), fix it in the generated files, and re-run `npm run build` until it passes
- Do NOT leave a failing build — fix all errors before finishing

---

## Guardrails

- If Figma MCP is unavailable → stop with the MCP setup message; do NOT generate files
- If block folder already exists → ask before overwriting
- If structure is ambiguous → always ask before deciding between simple and container
- If >4 fields are inferred → always ask before truncating
- If block name contains uppercase or spaces → auto-convert to kebab-case and confirm
- Do NOT hardcode hex/px values in CSS — always use `var(--token-name)` placeholders
- Do NOT use relative `../../` imports in TypeScript — always use `@/` alias
- Do NOT use `block.innerHTML =` — use `block.replaceChildren()` for DOM replacement
- Generated code should pass `npm run lint` and `npm run build` without modification

---

## Reference

- [Block authoring conventions](.github/instructions/block-authoring.instructions.md)
- [Coding style guide](.github/instructions/coding-style.instructions.md)
- Example simple model: `src/blocks/hero/_hero.json`
- Example container+filter model: `src/blocks/cards/_cards.json`
