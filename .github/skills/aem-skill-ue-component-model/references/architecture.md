# Architecture: How the Three JSON Files Connect

> Adapted from [adobe/skills ue-component-model/references/architecture.md](https://github.com/adobe/skills/tree/main/skills/aem/edge-delivery-services/skills/ue-component-model/references/architecture.md)

## Project Config Pipeline

This project uses a **centralized config pipeline**:

```
src/models/_*.json  ──── npm run build:json ────►  component-definition.json
                                                    component-models.json
                                                    component-filters.json
```

- **`src/models/`** contains JSON fragments (one per concern, e.g., `_hero.json`, `_cards.json`)
- **`npm run build:json`** merges all fragments into the three root JSON config files
- **Root JSON files** are what AEM/Universal Editor actually reads

> **Note**: Some blocks may also have `_<name>.json` in `src/blocks/<name>/` — check the block directory before deciding where to add config.

## The Three Files

An AEM Edge Delivery Services project using the Universal Editor (UE) requires three JSON configuration files at the project root:

1. **component-definition.json** — Registers components in the UE palette (what authors can add)
2. **component-models.json** — Defines the property panel fields (what authors can configure)
3. **component-filters.json** — Controls component hierarchy (where components can be placed)

## How They Connect

```
component-definition.json              component-models.json         component-filters.json
┌──────────────────────┐               ┌─────────────────────┐       ┌──────────────────────┐
│ {                    │               │ {                   │       │ {                    │
│   "id": "hero",      │               │   "id": "hero",     │       │   "id": "section",   │
│   "template": {      │               │   "fields": [...]   │       │   "components": [    │
│     "model": "hero"──┼──────────────►│ }                   │       │    "hero",           │
│     "filter": "cards"┼──────┐        └─────────────────────┘       │     "cards", ...     │
│   }                  │      │                                       │   ]                  │
│ }                    │      │                                       │ }                    │
└──────────────────────┘      │        ┌─────────────────────┐        │ {                    │
                              └───────►│ "id": "cards",      │        │   "id": "cards",     │
                                       │ "components":["card"]│◄──────┤ }                    │
                                       └─────────────────────┘        └──────────────────────┘
```

### Link 1: `template.model` → `component-models.json` id

The `model` property in a component definition's template references a model `id` in component-models.json. When an author selects a component, the UE renders the matching model's `fields` as the property panel.

### Link 2: `template.filter` → `component-filters.json` id

Container components (like Cards) use a `filter` to restrict which child components can be added inside them. The filter `id` in component-filters.json lists the allowed `components` array.

### Link 3: Section filter lists block IDs

The `section` filter in component-filters.json lists all block IDs that can be added to a page section. New blocks MUST be added here to appear in the author's "add component" menu.

## Full Pipeline: AEM → Markdown → HTML → Block TS

```
1. Author creates content in Universal Editor
   ├── component-definition.json tells UE what components exist
   ├── component-models.json tells UE what fields to show
   └── component-filters.json tells UE where components can go

2. AEM stores content as JCR nodes
   ├── resourceType determines the rendering component
   ├── template properties become JCR properties
   └── Block.java renders HTML table structure

3. helix-html2md converts AEM HTML → Markdown
   ├── Block div with classes → Grid table with header row
   ├── Block name from first class (title-cased)
   └── Variants from additional classes → parenthetical "(variant)"

4. helix-html-pipeline converts Markdown → HTML
   ├── Grid table → block div with CSS classes
   ├── Block name → lowercase kebab-case class
   └── Each row → nested div, each cell → inner div

5. Block TS decorates the HTML
   ├── src/blocks/<name>/<name>.ts (compiled to blocks/<name>/<name>.js)
   ├── decorate(block: HTMLElement) reads content from the div structure
   └── Transforms into interactive UI via TypeScript
```

## Block Types

### Simple Block (most common)

A block with a single model, no children. Example: Hero, Video.

- **definition**: 1 entry with `model` reference
- **model**: 1 entry with fields
- **filter**: Just add block ID to `section` components list

### Container Block

A block that contains repeatable child items. Example: Cards.

- **definition**: 2 entries (container + item). Container has `filter`, item has `model`
- **model**: 1 entry for the item
- **filter**: 1 new filter defining allowed children, plus add container to `section` list

### Key-Value Block

A block rendered as key-value pairs (2-column table). Example: configuration blocks.

- **definition**: 1 entry with `"key-value": true` in template
- **model**: 1 entry with fields
- **filter**: Add to `section` list

## Resource Types

Almost all blocks use one of these:

- `core/franklin/components/block/v1/block` — Standard block (most blocks)
- `core/franklin/components/block/v1/block/item` — Child item within a container block
- `core/franklin/components/section/v1/section` — Section component
- `core/franklin/components/text/v1/text` — Default text
- `core/franklin/components/title/v1/title` — Title
- `core/franklin/components/image/v1/image` — Image
- `core/franklin/components/button/v1/button` — Button

Custom blocks should use `core/franklin/components/block/v1/block`. Do NOT create custom resource types.

## Field Name Conventions & Semantic Collapsing

The pipeline uses naming suffixes to collapse related fields into single semantic elements:

| Suffix     | Behavior                    | Example                                                |
| ---------- | --------------------------- | ------------------------------------------------------ |
| `Alt`      | Image alt text              | `imageAlt` collapses into `image` as `<img alt="...">` |
| `Text`     | Link display text           | `linkText` collapses into `link` as `<a>text</a>`      |
| `Title`    | Link/heading title          | `linkTitle` collapses into `link` as `<a title="...">` |
| `Type`     | Heading level or link style | `titleType` → `<h2>`, `linkType` → class on `<a>`      |
| `MimeType` | File type hint              | `fileMimeType` → type attribute                        |

**Element Grouping**: Fields sharing a prefix with `_` separator are grouped into a single table cell:

- `cta_link`, `cta_text`, `cta_type` → grouped in one cell

**Block Options (`classes`)**: The `classes` field becomes CSS classes on the block wrapper:

- `"classes": ["light", "left"]` → `<div class="teaser light left">`
- Boolean sub-options: `classes_fullwidth: true` → adds `fullwidth` class

## Type Inference

The pipeline auto-detects content types:

- MIME type starting with `image/` → `<picture><img src="...">`
- Values matching URL patterns (`https://`, `#`) → `<a href="...">`
- Values starting with HTML tags → rendered as rich text
- Multi-value properties → comma-separated or `<ul><li>` lists

## RTE Filter Configuration

Filters can include an `rte` property to configure the richtext editor toolbar for components using that filter. This controls which formatting options are available to authors when editing richtext fields.

### Example: Filter with RTE Configuration

```json
{
  "id": "section",
  "components": ["text", "image", "hero"],
  "rte": {
    "toolbar": {
      "format": ["bold", "italic", "underline"],
      "blocks": ["h2", "h3", "h4", "paragraph"],
      "list": ["bullet_list", "ordered_list"],
      "insert": ["link", "image"]
    },
    "plugins": "link lists image",
    "icons": "thin",
    "icons_url": "/icons/thin/icons.js",
    "skin_url": "/skins/oxide"
  }
}
```
