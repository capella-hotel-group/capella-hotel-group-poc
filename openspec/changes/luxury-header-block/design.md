## Context

The existing header block loads its content from a `/nav` document fragment and maps children into brand, sections, and tools zones. While flexible, this indirection makes it harder to enforce the precise three-zone layout — language selector · centered brand nav · CTA button — required by the luxury hospitality brand identity. The new design demands full control over DOM structure, typography, and interaction behavior.

## Goals / Non-Goals

**Goals:**

- Implement a sticky full-width header with three clearly separated zones using CSS Grid/Flexbox
- Language selector: uppercase trigger + fade-in dropdown (English, 简体中文, 日本語), no flag icons
- Center zone: DESTINATIONS link · small monochrome SVG emblem · EXPERIENCES link
- Right zone: "BOOK YOUR STAY" rectangular taupe/warm-gray CTA button
- Keyboard and focus-trap accessibility for the language dropdown
- All visual tokens (colors, spacing, typography) via CSS custom properties from `src/styles/styles.css`

**Non-Goals:**

- Mobile responsive / hamburger menu (desktop-first; mobile breakpoint deferred)
- Multi-level nav dropdowns for DESTINATIONS / EXPERIENCES
- Server-driven language switching (UI only; locale routing is out of scope)
- Animation beyond a simple CSS fade-in/slide-down for the language dropdown

## Decisions

### 1. Fragment loading vs. self-contained block

**Decision**: Remove the fragment loader. The new header reads all content directly from its own authored rows in the Universal Editor.

**Rationale**: The three-zone layout has a fixed, well-known structure. Fragment indirection adds latency (extra fetch) and complicates UE authoring. Removing it makes the block self-contained and eliminates a render-blocking network request on every page.

**Alternative considered**: Keep fragment loading, reshape the fragment's DOM in `decorate()`. Rejected because it couples two authoring surfaces and makes the DOM shape fragile to fragment edits.

---

### 2. Sticky strategy: `position: sticky` vs. `position: fixed`

**Decision**: Use `position: sticky; top: 0` on the `<header>` element.

**Rationale**: Sticky keeps the element in normal flow, so the page content below the header does not need manual `padding-top` compensation. It also works correctly inside AEM's editor iframe without special overrides.

**Alternative considered**: `position: fixed` with `body { padding-top: 70px }`. Rejected — requires global style side-effect that conflicts with hero blocks that intentionally bleed under the header.

---

### 3. Language dropdown implementation

**Decision**: Custom JS-driven dropdown using a `<button>` trigger and `<ul>` listbox, toggled via `aria-expanded` and hidden with `visibility: hidden / opacity: 0` CSS transition.

**Rationale**: Gives precise control over animation (CSS fade-in), keyboard navigation (Escape to close, click-outside), and ARIA semantics. The `<details>/<summary>` native alternative lacks cross-browser animation support and ARIA role fidelity.

---

### 4. Brand emblem delivery

**Decision**: Inline SVG rendered from a `<picture>` / `<img>` tag pointing to `/icons/capella-emblem.svg`.

**Rationale**: Keeps the emblem as an authored asset in the content model (icon field), follows the existing AEM EDS icon convention (`/icons/*.svg`), and avoids hard-coding SVG markup in TypeScript.

---

### 5. Content model structure

The header block authors three rows in the Universal Editor:

| Row | Field                                               | Purpose                                        |
| --- | --------------------------------------------------- | ---------------------------------------------- |
| 1   | Language label (text) + language items (multi-text) | Language selector trigger and dropdown options |
| 2   | Nav links (multi-link) + emblem icon (image)        | Center navigation                              |
| 3   | CTA label (text) + CTA link (link)                  | Book Your Stay button                          |

## Risks / Trade-offs

- **UE multi-value fields for language options** → Mitigation: model each language option as a separate repeating item row under the header block using the component filter pattern, keeping the authoring surface familiar.
- **SVG emblem path must exist** → Mitigation: block guards the `<img>` with a null check and falls back gracefully to an empty center zone without breaking layout.
- **Sticky header z-index conflicts with other blocks** → Mitigation: assign `z-index: 100` to the header; document this token so block authors know to stay below it.
- **No mobile behavior defined** → Known gap. The block will be hidden on viewports below 900px until a mobile design is specified in a follow-up change.
