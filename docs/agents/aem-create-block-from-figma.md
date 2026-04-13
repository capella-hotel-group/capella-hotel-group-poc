# aem-create-block-from-figma

Scaffold a complete AEM EDS xwalk block from a Figma design. The agent reads the component's visual structure via Figma MCP and generates all three required block files automatically.

## Prerequisites

1. **Figma MCP server** must be configured in VS Code. Add it to your MCP settings so the `mcp_com_figma_mcp_*` tools are available in Copilot Agent mode.
2. Run in **Agent mode** — this skill uses external tools (Figma MCP, file system) that are not available in Ask or Edit modes.
3. Open the Figma file and copy the URL of the specific frame or component you want to build.

## Generated files

```
src/blocks/<block-name>/
  <block-name>.ts       TypeScript decorator
  <block-name>.css      Block-scoped styles
  _<block-name>.json    AEM xwalk component model
```

The block is auto-registered by the Vite build. After generation, the skill also adds the block to `src/models/_section.json` and runs `npm run build:json` to make it selectable in the Universal Editor.

## Invocation

```
/aem-create-block-from-figma <block-name> <figma-url> [description]
```

| Argument | Required | Description |
|---|---|---|
| `<block-name>` | Yes | Kebab-case name (e.g., `dining-nav`, `hero-video`) |
| `<figma-url>` | Yes | Full Figma URL including `node-id` query param |
| `[description]` | No | Free-text brief \u2014 see section below |

**Example \u2014 simple block:**
```
/aem-create-block-from-figma dining-nav https://figma.com/design/AbCdEf/Capella?node-id=123-456
```

**Example \u2014 with description:**
```
/aem-create-block-from-figma room-card https://figma.com/design/AbCdEf/Capella?node-id=789-012
"On hover the card flips to show a booking CTA. The back face is not visible in the default Figma frame."
```

---

## Description / brief

The Figma MCP reads visual structure \u2014 layers, text, images, and variants \u2014 but it cannot infer:

- Interaction semantics (hover reveals, click-to-expand, scroll-triggered)
- Animation timing or sequencing
- Accessibility labels or ARIA requirements
- Dependencies on other blocks or shared state
- Editorial intent behind field names

Use the optional `description` argument to supply this context. The agent uses it throughout analysis, code generation, and the pre-write confirmation summary.

**When to add a description:**
- The component has interactions that are not obvious from static layers
- A Figma frame only shows one state but the block has multiple
- You want a specific field named or labelled a certain way
- The block depends on or communicates with another block

**When you can skip it:**
- Simple, visual-only blocks (image + text + CTA with no interaction logic)
- The Figma frame already has clear, self-explanatory layer names

---

## Multi-state components

When a component has multiple display states \u2014 different visual frames for `loading`, `expanded`, `step-1/step-2/step-3` \u2014 the agent needs to know about them to generate matching TypeScript and CSS.

There are three ways to communicate states:

### 1. Figma frame naming (auto-detected)

Name your Figma child frames with recognisable state labels. The agent detects these automatically and asks for confirmation before generating.

| Frame names | How the agent treats them |
|---|---|
| `default`, `hover`, `active`, `focus`, `disabled` | CSS pseudo-class states \u2014 **no TS logic needed**, handled in CSS only |
| `loading`, `empty`, `expanded`, `open`, `closed` | JS-driven states \u2014 generates `data-state` attribute code |
| `step-1`, `step-2`, `step-3` (or `Step 1`, `step_1`) | Multi-step sequence \u2014 generates `data-step` attribute + `goToStep()` helper |

### 2. Description / brief (any naming)

If your Figma frames use non-standard names, describe the states in the `description` argument. The agent parses the state names from your text and confirms before generating.

```
/aem-create-block-from-figma menus https://figma.com/design/AbCdEf/Capella?node-id=200-300
"The menu has 3 display states:
- closed: only the hamburger icon is visible
- open: full-width overlay with navigation links
- submenu: second level links slide in from the right"
```

### 3. Multiple Figma URLs (explicit, one URL per state)

Provide separate Figma URLs for each state frame. The agent fetches them sequentially, uses each frame's layers as the definition for that state, and merges the field analysis.

```
/aem-create-block-from-figma menus \
  https://figma.com/design/AbCdEf/Capella?node-id=200-300 \
  https://figma.com/design/AbCdEf/Capella?node-id=200-301 \
  https://figma.com/design/AbCdEf/Capella?node-id=200-302
"State 1 = closed, State 2 = open, State 3 = submenu"
```

### How the agent decides what to generate

When multiple Figma frames are detected — from auto-detection, description text, or multiple URLs — the agent **always asks** which trigger type applies before generating any code:

> "These frames show different visual states. How are they triggered?"
> 1. **CSS-only** — hover, focus, transition, or animation; no JavaScript needed
> 2. **JS-driven** — click, scroll, timer, or external event; JavaScript manages transitions
> 3. **Visual reference only** — these frames are just to show the full design; generate a single CSS implementation with no state logic

The agent never assumes trigger type from frame names alone — a frame named `hover` could be JS-triggered; `expanded` could be a pure CSS transition.

| Your answer | What gets generated |
|---|---|
| CSS-only | Standard TS (no-op) + CSS with pseudo-class / transition rules |
| JS-driven | TS with `data-state` transitions + CSS `[data-state]` selectors |
| Visual reference only | Standard TS (no-op) + comprehensive CSS covering all frames; no state logic |

### Generated code for JS-driven states

**TypeScript** \u2014 `data-state` attribute transitions:
```typescript
block.dataset.state = 'loading';   // set a state
block.dataset.state = 'expanded';  // transition to another
```

**CSS** \u2014 per-state selectors:
```css
.my-block[data-state="loading"]  { /* loading styles */ }
.my-block[data-state="expanded"] { /* expanded styles */ }
```

**TypeScript** \u2014 multi-step sequence with `goToStep()`:
```typescript
let currentStep = 1;
function goToStep(n: number): void {
  currentStep = n;
  block.dataset.step = String(n);
}
```

**CSS** \u2014 step visibility:
```css
.my-block[data-step] .my-block-panel { display: none; }
.my-block[data-step="1"] .my-block-panel:nth-child(1) { display: block; }
.my-block[data-step="2"] .my-block-panel:nth-child(2) { display: block; }
```

---

## Guardrails

| Situation | What happens |
|---|---|
| Figma MCP not connected | Agent stops and shows setup instructions |
| Block folder already exists | Agent asks: overwrite or abort |
| More than 4 fields inferred | Agent asks you to prioritise before generating |
| Multiple frames / states detected | Agent asks: CSS-only, JS-driven, or visual reference? Never assumes |
| More than 3 JS-driven states confirmed | Agent asks for confirmation or list reduction |
| Trigger type not confirmed | Falls back to CSS-only template, no state logic |
| `:hover`, `:focus` frames | Only exception — always CSS-only, no question needed |

---

## Skill vs prompt

This skill exists in two forms:

| Form | When to use |
|---|---|
| `/aem-create-block-from-figma` prompt | Direct developer invocation in Copilot Chat (Agent mode) |
| `aem-create-block-from-figma` skill | Invoked by other agents (e.g., `/opsx:apply` implementing a change that includes a new block) |

Both forms produce identical output. The skill form returns a JSON result to the calling agent:
```json
{
  "blockName": "my-block",
  "files": [
    "src/blocks/my-block/my-block.ts",
    "src/blocks/my-block/my-block.css",
    "src/blocks/my-block/_my-block.json"
  ],
  "sectionJsonUpdated": true,
  "jsonRegenerated": true
}
```
