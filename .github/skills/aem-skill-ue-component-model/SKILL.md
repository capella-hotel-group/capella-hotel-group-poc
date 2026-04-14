---
name: aem-skill-ue-component-model
description: Create or edit the Universal Editor component configuration (component-definition.json, component-models.json, component-filters.json) for AEM Edge Delivery Services blocks. Use this skill whenever the user mentions component models, component definitions, component filters, block configuration for the Universal Editor, UE block setup, adding a new block to UE, configuring block properties, block authoring fields, or any task involving the three JSON config files that control how blocks appear in the Universal Editor. Also trigger when the user wants to create a new EDS/Franklin block with UE support, modify block fields, add a block to the section filter, or asks about how blocks connect to the Universal Editor.
license: Apache-2.0
metadata:
  source: https://github.com/adobe/skills/tree/main/skills/aem/edge-delivery-services/skills/ue-component-model
  adapted-for: TypeScript + Vite project (capella-hotel-group-poc)
---

# Universal Editor Component Model Configuration

This skill helps you create or edit the three JSON configuration files that control how AEM Edge Delivery Services (EDS) blocks appear and behave in the Universal Editor (UE):

1. **component-definition.json** — Registers blocks in the UE component palette
2. **component-models.json** — Defines property panel fields for each block
3. **component-filters.json** — Controls where blocks can be placed

## Project Architecture

This project uses a **centralized config pipeline**:

- Source fragments live in `src/models/` as `_*.json` files
- Root JSON files (`component-definition.json`, `component-models.json`, `component-filters.json`) are the **actual configs** used by AEM
- Run `npm run build:json` to merge `src/models/` fragments into the root JSON files

**Do not edit the root JSON files manually for fragment-based blocks.** Edit `src/models/` fragments, then run `npm run build:json`.

## When to Use

- Creating a new block that needs UE authoring support
- Adding/modifying fields on an existing block's property panel
- Registering a block so it appears in the author's component palette
- Setting up container blocks with child items
- Adding block variants/style options

## Workflow

### Step 1: Understand the Block

Before generating any configuration, read and analyze:

1. **The block's TypeScript file** (`src/blocks/<name>/<name>.ts`) — understand what content the `decorate(block: HTMLElement)` function expects:
   - What does it read from the block div? (images, links, text, classes)
   - Does it expect a flat structure or rows of items?
   - Does it use `block.querySelector('a')` (links/URLs), `block.querySelector('picture')` (images), etc.?
   - Does it check for CSS classes/variants?

2. **The block's CSS file** (`src/blocks/<name>/<name>.css`) — look for variant-specific styles.

3. **Existing config** — check if entries already exist:
   - Search `component-definition.json` for the block ID
   - Search `component-models.json` for the model ID
   - Search `component-filters.json` for the block in the `section` components list
   - Check for a `src/models/_<name>.json` fragment file

### Step 2: Determine the Block Type

Based on the TypeScript analysis:

- **Simple block**: One component with its own fields. Most blocks are this type.
  - Example: Hero, Video — single model, no children

- **Container block**: Has repeatable child items (cards, slides, tabs).
  - Clue: TS iterates over `block.children` or creates items from rows
  - Needs: container definition + item definition + filter

- **Key-value block**: Configuration-style block (2-column key-value pairs).
  - Clue: Each property is independent, not a grid of content
  - Needs: `"key-value": true` in template

### Step 3: Design the Model Fields

Map the block's content expectations to component model fields. Read `references/field-types.md` for the full field type reference.

**Common field mappings:**

| Block expects...         | Use component type                    | Notes                                                 |
| ------------------------ | ------------------------------------- | ----------------------------------------------------- |
| An image                 | `reference` (name: `image`)           | Pair with `text` field named `imageAlt`               |
| A URL/link               | `aem-content` (name: `link` or `url`) | For page links and external URLs                      |
| Rich text content        | `richtext`                            | For formatted text with headings, lists, links        |
| Plain text (single line) | `text`                                | For titles, labels, short strings                     |
| Plain text (multi-line)  | `textarea`                            | For descriptions, notes, long text without formatting |
| Heading level choice     | `select` with h1-h6 options           | Name it `titleType` to auto-collapse with title       |
| Style variants           | `multiselect` (name: `classes`)       | Values become CSS classes on block div                |
| Multiple toggles         | `checkbox-group`                      | For multiple independent boolean options              |
| Boolean toggle           | `boolean`                             | For show/hide options                                 |
| Number value             | `number`                              | For counts, limits                                    |

**Field naming rules (semantic collapsing):**

- `image` + `imageAlt` → collapsed into `<picture><img alt="...">`
- `link` + `linkText` + `linkTitle` + `linkType` → collapsed into `<a href="..." title="...">text</a>` with optional class
- `title` + `titleType` → collapsed into `<h2>title</h2>` (level from titleType)
- Fields prefixed with `group_` (underscore separator) are grouped into a single cell

### Step 4: Generate the Configuration

Generate entries for all three files. This project uses **centralized config** — edit all three root JSON files directly.

**component-definition.json** — Add to the `"Blocks"` group's `components` array:

```json
{
  "title": "<Block Display Name>",
  "id": "<block-id>",
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block",
        "template": {
          "name": "<Block Name>",
          "model": "<model-id>"
        }
      }
    }
  }
}
```

For container blocks, add both the container AND item definitions. The container gets `"filter"` instead of `"model"`, and the item uses `"core/franklin/components/block/v1/block/item"` as resourceType.

For key-value blocks, add `"key-value": true` to the template.

**component-models.json** — Add a new model entry:

```json
{
  "id": "<model-id>",
  "fields": [
    {
      "component": "<field-type>",
      "name": "<property-name>",
      "label": "<Display Label>",
      "valueType": "string"
    }
  ]
}
```

**component-filters.json** — Add the block ID to the `section` filter's `components` array. For container blocks, also add a new filter entry defining allowed children.

**After editing root JSON files, run:**

```bash
npm run build:json
```

### Step 5: Validate

After generating the config, verify:

1. **ID consistency**: The `id` in the definition matches what's used in `component-filters.json`. The `template.model` value matches the `id` in `component-models.json`.
2. **Filter registration**: The block's ID appears in the `section` filter's `components` array (otherwise authors can't add it to pages).
3. **Field names match block TS**: The `name` properties in the model fields should produce HTML that the block's `decorate()` function can consume.
4. **Semantic collapsing**: Paired fields use correct suffixes (e.g., `image`/`imageAlt`, not `image`/`altText` unless intentional).
5. **Valid JSON**: All three files remain valid JSON after edits.
6. **No duplicate IDs**: No model or filter ID conflicts with existing entries.
7. **Build succeeds**: Run `npm run build:json` — it must complete without errors.

## Reference Files

For detailed information, read these reference files as needed:

- **`references/architecture.md`** — How the three files connect, the full AEM→Markdown→HTML pipeline, resource types, field naming conventions, semantic collapsing rules, and RTE filter configuration
- **`references/field-types.md`** — Complete reference for all 17 field component types, valueType constraints, required properties, field properties, validation types, conditional fields, and option formats
- **`references/examples.md`** — Real examples from this project: Hero (simple), Cards (container), Menus (navigation), Video-Photo-Player (media)

## Common Pitfalls

- **Forgetting to add to section filter**: The block won't appear in the author's add menu unless it's in the `section` filter's components list.
- **Wrong resourceType**: Almost all custom blocks use `core/franklin/components/block/v1/block`. Don't invent custom resource types.
- **Mismatched model/filter IDs**: The `template.model` must exactly match the model `id`, and `template.filter` must exactly match the filter `id`.
- **Choosing the wrong text field type**: Use `text` for single-line strings, `textarea` for multi-line plain text, and `richtext` for formatted content. For URLs and page links, use `aem-content` so authors get the content picker.
- **Wrong valueType**: Most components enforce a specific `valueType`. Always include `valueType` and check `references/field-types.md`.
- **Container without filter**: Container blocks need a `filter` (not a `model`) in their template, and a corresponding filter entry in component-filters.json.
- **Forgetting `npm run build:json`**: Root JSON files must be regenerated after editing `src/models/` fragments.
