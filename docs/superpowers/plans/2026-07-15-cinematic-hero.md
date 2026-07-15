# Cinematic Hero Block — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-screen immersive video hero block (`cinematic-hero`) that renders a cinematic background reel, an interactive sentence-based item selector with WAAPI animations, a mode toggle, custom cursor, and sound control.

**Architecture:** Multi-file block under `src/blocks/cinematic-hero/` with a `lib/` subfolder for internal modules. Entry point `cinematic-hero.ts` orchestrates parsing, DOM construction, and module wiring. All animations use the Web Animations API; the cursor uses a vanilla RAF loop. No external animation library.

**Tech Stack:** TypeScript, Web Animations API, CSS custom properties, AEM EDS Universal Editor content model (container + item pattern).

## Global Constraints

- All imports use `@/*` alias (e.g. `@/app/scripts`), never relative paths across modules
- `decorate` must be `export default async function decorate(block: HTMLElement): Promise<void>`
- DOM mutation: build all elements, then call `block.replaceChildren(...newElements)` once
- `moveInstrumentation()` from `@/app/scripts` must be called for each item row before `replaceChildren`
- `strictNullChecks` is on — guard all `querySelector` / `querySelectorAll` results
- Sanitize any dynamic HTML with `DOMPurify` before assigning to `innerHTML`
- Only `transform` and `opacity` are animated — never `top`, `left`, `width`, `height`, `margin`, `padding`
- CSS class naming: `.cinematic-hero`, `.cinematic-hero-{element}`, `.cinematic-hero-{element}--{modifier}`
- No GSAP, no ScrollTrigger, no Three.js
- Video starts muted, `playsinline`, no native controls
- `min-height: 100svh` (not `100vh`) for the root container
- Run `npm run lint` before every commit; fix all errors

---

## File Map

| File                                             | Action | Responsibility                                               |
| ------------------------------------------------ | ------ | ------------------------------------------------------------ |
| `src/blocks/cinematic-hero/cinematic-hero.ts`    | Create | Entry: parse DOM, orchestrate modules, lifecycle             |
| `src/blocks/cinematic-hero/cinematic-hero.css`   | Create | All block styles, CSS tokens, responsive                     |
| `src/blocks/cinematic-hero/_cinematic-hero.json` | Create | UE content model (block + item definitions)                  |
| `src/blocks/cinematic-hero/lib/types.ts`         | Create | Shared interfaces: HeroItem, HeroMode, HeroState, HeroConfig |
| `src/blocks/cinematic-hero/lib/media-manager.ts` | Create | 2 video layers, crossfade, sequence ID, sound, pause/resume  |
| `src/blocks/cinematic-hero/lib/selector-ui.ts`   | Create | Item list DOM, WAAPI prefix/suffix anchor movement           |
| `src/blocks/cinematic-hero/lib/intro.ts`         | Create | Intro animation sequence (WAAPI + Promise chaining)          |
| `src/blocks/cinematic-hero/lib/cursor.ts`        | Create | Custom cursor RAF loop (fine pointer only)                   |
| `src/blocks/cinematic-hero/lib/analytics.ts`     | Create | CustomEvent emitter for all 6 hero events                    |
| `component-definition.json`                      | Modify | Register cinematic-hero + cinematic-hero-item                |
| `component-models.json`                          | Modify | Add cinematic-hero and cinematic-hero-item models            |
| `component-filters.json`                         | Modify | Add cinematic-hero filter + add to section filter            |

---

## Task 1: Scaffold — Types, Content Model, Stubs

**Files:**

- Create: `src/blocks/cinematic-hero/lib/types.ts`
- Create: `src/blocks/cinematic-hero/_cinematic-hero.json`
- Create: `src/blocks/cinematic-hero/cinematic-hero.ts` (stub)
- Create: `src/blocks/cinematic-hero/cinematic-hero.css` (stub)
- Modify: `component-definition.json`
- Modify: `component-models.json`
- Modify: `component-filters.json`

**Interfaces:**

- Produces: `HeroItem`, `HeroMode`, `HeroConfig`, `HeroState` — used by all subsequent tasks

- [ ] **Step 1.1: Create `lib/types.ts`**

```typescript
// src/blocks/cinematic-hero/lib/types.ts

export type HeroMode = 'experiences' | 'destinations';

export interface HeroConfig {
  prefix: string;
  suffix: string;
  experiencesLabel: string;
  destinationsLabel: string;
}

export interface HeroItem {
  label: string;
  mode: HeroMode;
  videoUrl: string;
  posterUrl: string;
  link: string | null;
  focalDesktop: string;
  focalMobile: string;
  hasAudio: boolean;
  /** Original row element for moveInstrumentation */
  sourceRow: HTMLElement;
}

export interface HeroState {
  activeMode: HeroMode;
  activeIndex: Record<HeroMode, number>;
  introComplete: boolean;
  muted: boolean;
}

export interface IntroElements {
  prefix: HTMLElement;
  suffix: HTMLElement;
  itemList: HTMLElement;
  controls: HTMLElement;
}
```

- [ ] **Step 1.2: Create `_cinematic-hero.json` content model**

```json
{
  "definitions": [
    {
      "title": "Cinematic Hero",
      "id": "cinematic-hero",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "Cinematic Hero",
              "model": "cinematic-hero",
              "filter": "cinematic-hero"
            }
          }
        }
      }
    },
    {
      "title": "Cinematic Hero Item",
      "id": "cinematic-hero-item",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block/item",
            "template": {
              "name": "Cinematic Hero Item",
              "model": "cinematic-hero-item"
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "cinematic-hero",
      "fields": [
        {
          "component": "text",
          "valueType": "string",
          "name": "prefix",
          "label": "Prefix",
          "value": "See"
        },
        {
          "component": "text",
          "valueType": "string",
          "name": "suffix",
          "label": "Suffix",
          "value": "with new eyes"
        },
        {
          "component": "text",
          "valueType": "string",
          "name": "experiencesLabel",
          "label": "Experiences Label",
          "value": "Experiences"
        },
        {
          "component": "text",
          "valueType": "string",
          "name": "destinationsLabel",
          "label": "Destinations Label",
          "value": "Destinations"
        }
      ]
    },
    {
      "id": "cinematic-hero-item",
      "fields": [
        {
          "component": "text",
          "valueType": "string",
          "name": "label",
          "label": "Label"
        },
        {
          "component": "select",
          "valueType": "string",
          "name": "mode",
          "label": "Mode",
          "options": [
            { "name": "Experiences", "value": "experiences" },
            { "name": "Destinations", "value": "destinations" }
          ]
        },
        {
          "component": "aem-content",
          "valueType": "string",
          "name": "video",
          "label": "Video"
        },
        {
          "component": "reference",
          "valueType": "string",
          "name": "poster",
          "label": "Poster Image",
          "multi": false
        },
        {
          "component": "aem-content",
          "valueType": "string",
          "name": "link",
          "label": "Navigation Link"
        },
        {
          "component": "select",
          "valueType": "string",
          "name": "focalDesktop",
          "label": "Focal Position (Desktop)",
          "value": "center",
          "options": [
            { "name": "Center", "value": "center" },
            { "name": "Top", "value": "top" },
            { "name": "Bottom", "value": "bottom" },
            { "name": "Left", "value": "left" },
            { "name": "Right", "value": "right" },
            { "name": "Top Left", "value": "top left" },
            { "name": "Top Right", "value": "top right" },
            { "name": "Bottom Left", "value": "bottom left" },
            { "name": "Bottom Right", "value": "bottom right" }
          ]
        },
        {
          "component": "select",
          "valueType": "string",
          "name": "focalMobile",
          "label": "Focal Position (Mobile)",
          "value": "center",
          "options": [
            { "name": "Center", "value": "center" },
            { "name": "Top", "value": "top" },
            { "name": "Bottom", "value": "bottom" },
            { "name": "Left", "value": "left" },
            { "name": "Right", "value": "right" },
            { "name": "Top Left", "value": "top left" },
            { "name": "Top Right", "value": "top right" },
            { "name": "Bottom Left", "value": "bottom left" },
            { "name": "Bottom Right", "value": "bottom right" }
          ]
        },
        {
          "component": "boolean",
          "valueType": "boolean",
          "name": "hasAudio",
          "label": "Has Audio"
        }
      ]
    }
  ],
  "filters": [
    {
      "id": "cinematic-hero",
      "components": ["cinematic-hero-item"]
    }
  ]
}
```

- [ ] **Step 1.3: Register block in `component-definition.json`**

Open `component-definition.json`. Find the `"Blocks"` group's `"components"` array and append:

```json
{
  "title": "Cinematic Hero",
  "id": "cinematic-hero",
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block",
        "template": {
          "name": "Cinematic Hero",
          "model": "cinematic-hero",
          "filter": "cinematic-hero"
        }
      }
    }
  }
},
{
  "title": "Cinematic Hero Item",
  "id": "cinematic-hero-item",
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block/item",
        "template": {
          "name": "Cinematic Hero Item",
          "model": "cinematic-hero-item"
        }
      }
    }
  }
}
```

- [ ] **Step 1.4: Add models to `component-models.json`**

Open `component-models.json`. Append both model objects (`cinematic-hero` and `cinematic-hero-item` from Step 1.2) to the top-level array.

- [ ] **Step 1.5: Add filter to `component-filters.json`**

Open `component-filters.json`. Append to the top-level array:

```json
{
  "id": "cinematic-hero",
  "components": ["cinematic-hero-item"]
}
```

Then find the `"section"` filter entry and add `"cinematic-hero"` to its `"components"` array.

- [ ] **Step 1.6: Create `cinematic-hero.ts` stub**

```typescript
// src/blocks/cinematic-hero/cinematic-hero.ts
export default async function decorate(_block: HTMLElement): Promise<void> {
  // TODO: implement in Task 2
}
```

- [ ] **Step 1.7: Create `cinematic-hero.css` stub**

```css
/* src/blocks/cinematic-hero/cinematic-hero.css */
.cinematic-hero-container .cinematic-hero-wrapper {
  max-width: unset;
  padding: 0;
}

.cinematic-hero {
  position: relative;
  width: 100%;
  min-height: 100svh;
  overflow: hidden;
  background: #000;
  contain: layout style;
}
```

- [ ] **Step 1.8: Run build to verify scaffolding**

```bash
npm run lint
```

Expected: no errors. If TypeScript errors, fix before proceeding.

- [ ] **Step 1.9: Commit**

```bash
git add src/blocks/cinematic-hero/ component-definition.json component-models.json component-filters.json
git commit -m "feat(cinematic-hero): scaffold block structure, types, and UE content model"
```

---

## Task 2: DOM Parsing & HTML Structure

**Files:**

- Modify: `src/blocks/cinematic-hero/cinematic-hero.ts`
- Modify: `src/blocks/cinematic-hero/cinematic-hero.css`

**Interfaces:**

- Consumes: `HeroItem`, `HeroConfig`, `HeroState` from `lib/types.ts`
- Produces: `buildDOM(config, items, state)` → returns the full block DOM tree; used by Task 3+

- [ ] **Step 2.1: Implement DOM parser in `cinematic-hero.ts`**

```typescript
// src/blocks/cinematic-hero/cinematic-hero.ts
import { moveInstrumentation } from '@/app/scripts';
import { resolveDAMUrl } from '@/utils/env';
import type { HeroConfig, HeroItem, HeroMode, HeroState } from './lib/types';

// ── DOM parsing ───────────────────────────────────────────────────────────────

function parseConfig(configRow: HTMLElement): HeroConfig {
  const cells = [...configRow.children] as HTMLElement[];
  return {
    prefix: cells[0]?.textContent?.trim() || 'See',
    suffix: cells[1]?.textContent?.trim() || 'with new eyes',
    experiencesLabel: cells[2]?.textContent?.trim() || 'Experiences',
    destinationsLabel: cells[3]?.textContent?.trim() || 'Destinations',
  };
}

function parseItems(itemRows: HTMLElement[]): HeroItem[] {
  return itemRows
    .map((row): HeroItem | null => {
      const cells = [...row.children] as HTMLElement[];
      const label = cells[0]?.textContent?.trim() ?? '';
      const modeRaw = cells[1]?.textContent?.trim().toLowerCase() ?? '';
      const mode: HeroMode = modeRaw === 'destinations' ? 'destinations' : 'experiences';
      const videoAnchor = cells[2]?.querySelector<HTMLAnchorElement>('a');
      const videoUrl = resolveDAMUrl(videoAnchor?.href ?? cells[2]?.textContent?.trim() ?? '');
      const poster = cells[3]?.querySelector('picture') ?? null;
      const posterUrl = poster?.querySelector<HTMLImageElement>('img')?.src ?? '';
      const linkAnchor = cells[4]?.querySelector<HTMLAnchorElement>('a');
      const link = linkAnchor?.href ?? null;
      const focalDesktop = cells[5]?.textContent?.trim() || 'center';
      const focalMobile = cells[6]?.textContent?.trim() || 'center';
      const hasAudio = cells[7]?.textContent?.trim().toLowerCase() === 'true';

      if (!label || !videoUrl) return null;

      return { label, mode, videoUrl, posterUrl, link, focalDesktop, focalMobile, hasAudio, sourceRow: row };
    })
    .filter((item): item is HeroItem => item !== null);
}
```

- [ ] **Step 2.2: Implement `buildDOM` in `cinematic-hero.ts`**

Add after the parse functions:

```typescript
// ── DOM builder ───────────────────────────────────────────────────────────────

function buildItemEl(item: HeroItem, index: number): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'cinematic-hero-item';
  li.setAttribute('role', 'option');
  li.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
  li.dataset.index = String(index);
  li.dataset.mode = item.mode;

  moveInstrumentation(item.sourceRow, li);

  const btn = document.createElement('button');
  btn.className = 'cinematic-hero-item-btn';
  btn.type = 'button';
  btn.textContent = item.label;
  li.append(btn);

  if (item.link) {
    btn.dataset.href = item.link;
  }

  return li;
}

export function buildDOM(
  config: HeroConfig,
  items: HeroItem[],
  state: HeroState,
): {
  root: DocumentFragment;
  mediaEl: HTMLElement;
  posterEl: HTMLElement;
  videoA: HTMLVideoElement;
  videoB: HTMLVideoElement;
  overlayEl: HTMLElement;
  prefixEl: HTMLElement;
  suffixEl: HTMLElement;
  itemListEl: HTMLUListElement;
  controlsEl: HTMLElement;
  soundBtn: HTMLButtonElement;
  modeBtns: HTMLButtonElement[];
  indicatorEl: HTMLElement;
  cursorEl: HTMLElement;
} {
  const fragment = document.createDocumentFragment();

  // ── Media layer ──────────────────────────────────────────────────────────
  const mediaEl = document.createElement('div');
  mediaEl.className = 'cinematic-hero-media';

  const posterEl = document.createElement('div');
  posterEl.className = 'cinematic-hero-poster';
  const firstItem = items.find((i) => i.mode === state.activeMode) ?? items[0];
  if (firstItem?.posterUrl) {
    posterEl.style.backgroundImage = `url(${firstItem.posterUrl})`;
    posterEl.style.backgroundPosition = firstItem.focalDesktop;
  }

  const videoA = document.createElement('video');
  videoA.className = 'cinematic-hero-video cinematic-hero-video--a';
  videoA.muted = true;
  videoA.playsInline = true;
  videoA.loop = true;
  videoA.setAttribute('aria-hidden', 'true');

  const videoB = document.createElement('video');
  videoB.className = 'cinematic-hero-video cinematic-hero-video--b';
  videoB.muted = true;
  videoB.playsInline = true;
  videoB.loop = true;
  videoB.setAttribute('aria-hidden', 'true');

  mediaEl.append(posterEl, videoA, videoB);

  // ── Contrast overlay ──────────────────────────────────────────────────────
  const overlayEl = document.createElement('div');
  overlayEl.className = 'cinematic-hero-overlay';
  overlayEl.setAttribute('aria-hidden', 'true');

  // ── Selector UI ───────────────────────────────────────────────────────────
  const selectorEl = document.createElement('div');
  selectorEl.className = 'cinematic-hero-selector';
  selectorEl.setAttribute('aria-label', 'Experience selector');

  const prefixEl = document.createElement('div');
  prefixEl.className = 'cinematic-hero-prefix';
  prefixEl.textContent = config.prefix;
  prefixEl.setAttribute('aria-hidden', 'true');

  const itemListEl = document.createElement('ul');
  itemListEl.className = 'cinematic-hero-items';
  itemListEl.setAttribute('role', 'listbox');
  itemListEl.setAttribute('aria-label', 'Select content');

  const modeItems = items.filter((i) => i.mode === state.activeMode);
  modeItems.forEach((item, idx) => {
    itemListEl.append(buildItemEl(item, idx));
  });

  const suffixEl = document.createElement('div');
  suffixEl.className = 'cinematic-hero-suffix';
  suffixEl.textContent = config.suffix;
  suffixEl.setAttribute('aria-hidden', 'true');

  selectorEl.append(prefixEl, itemListEl, suffixEl);

  // ── Bottom controls ───────────────────────────────────────────────────────
  const controlsEl = document.createElement('div');
  controlsEl.className = 'cinematic-hero-controls';

  const soundBtn = document.createElement('button');
  soundBtn.className = 'cinematic-hero-sound';
  soundBtn.type = 'button';
  soundBtn.setAttribute('aria-label', 'Unmute video');
  soundBtn.setAttribute('aria-pressed', 'false');
  const hasAnyAudio = items.some((i) => i.hasAudio);
  if (!hasAnyAudio) soundBtn.hidden = true;

  const modeEl = document.createElement('div');
  modeEl.className = 'cinematic-hero-mode';
  modeEl.setAttribute('role', 'tablist');
  modeEl.setAttribute('aria-label', 'Content mode');

  const expBtn = document.createElement('button');
  expBtn.className = 'cinematic-hero-mode-btn';
  expBtn.type = 'button';
  expBtn.setAttribute('role', 'tab');
  expBtn.dataset.mode = 'experiences';
  expBtn.textContent = config.experiencesLabel;

  const trackEl = document.createElement('div');
  trackEl.className = 'cinematic-hero-mode-track';
  trackEl.setAttribute('aria-hidden', 'true');

  const indicatorEl = document.createElement('div');
  indicatorEl.className = 'cinematic-hero-mode-indicator';
  trackEl.append(indicatorEl);

  const destBtn = document.createElement('button');
  destBtn.className = 'cinematic-hero-mode-btn';
  destBtn.type = 'button';
  destBtn.setAttribute('role', 'tab');
  destBtn.dataset.mode = 'destinations';
  destBtn.textContent = config.destinationsLabel;

  // Set initial active state on mode buttons
  const modeBtns = [expBtn, destBtn];
  modeBtns.forEach((btn) => {
    const isActive = btn.dataset.mode === state.activeMode;
    btn.setAttribute('aria-selected', String(isActive));
    btn.classList.toggle('cinematic-hero-mode-btn--active', isActive);
  });

  modeEl.append(expBtn, trackEl, destBtn);
  controlsEl.append(soundBtn, modeEl);

  // ── Custom cursor ─────────────────────────────────────────────────────────
  const cursorEl = document.createElement('div');
  cursorEl.className = 'cinematic-hero-cursor';
  cursorEl.setAttribute('aria-hidden', 'true');

  fragment.append(mediaEl, overlayEl, selectorEl, controlsEl, cursorEl);

  return {
    root: fragment,
    mediaEl,
    posterEl,
    videoA,
    videoB,
    overlayEl,
    prefixEl,
    suffixEl,
    itemListEl,
    controlsEl,
    soundBtn,
    modeBtns,
    indicatorEl,
    cursorEl,
  };
}
```

- [ ] **Step 2.3: Wire `decorate()` to use the parser and builder**

Replace the stub `decorate` with:

```typescript
export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children] as HTMLElement[];
  if (rows.length < 2) return; // no config row or no items

  // Model fields → column indices (block config row):
  //   rows[0].children[0] = prefix (text)
  //   rows[0].children[1] = suffix (text)
  //   rows[0].children[2] = experiencesLabel (text)
  //   rows[0].children[3] = destinationsLabel (text)
  const config = parseConfig(rows[0]);

  // Item rows: rows[1..n]
  //   row.children[0] = label, [1] = mode, [2] = video, [3] = poster,
  //   [4] = link, [5] = focalDesktop, [6] = focalMobile, [7] = hasAudio
  const items = parseItems(rows.slice(1));
  if (items.length === 0) return;

  const state: HeroState = {
    activeMode: 'experiences',
    activeIndex: { experiences: 0, destinations: 0 },
    introComplete: false,
    muted: true,
  };

  const dom = buildDOM(config, items, state);
  block.replaceChildren(dom.root);
}
```

- [ ] **Step 2.4: Add full CSS layer structure**

```css
/* src/blocks/cinematic-hero/cinematic-hero.css — replace stub */

.cinematic-hero-container .cinematic-hero-wrapper {
  max-width: unset;
  padding: 0;
}

/* ── Root ────────────────────────────────────────────────────────────── */
.cinematic-hero {
  position: relative;
  width: 100%;
  min-height: 100svh;
  overflow: hidden;
  background: #000;
  contain: layout style;
  isolation: isolate;
}

/* ── Media layer ─────────────────────────────────────────────────────── */
.cinematic-hero-media {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.cinematic-hero-poster {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
}

.cinematic-hero-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  will-change: opacity;
}

/* ── Contrast overlay ────────────────────────────────────────────────── */
.cinematic-hero-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(ellipse at center, transparent 30%, rgba(0 0 0 / 0.45) 100%),
    linear-gradient(to bottom, rgba(0 0 0 / 0.2) 0%, transparent 40%);
  pointer-events: none;
}

/* ── Selector UI ─────────────────────────────────────────────────────── */
.cinematic-hero-selector {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0 2rem;
  pointer-events: none;
}

.cinematic-hero-prefix,
.cinematic-hero-suffix {
  font-family: var(--heading-font-family);
  font-size: clamp(1.4rem, 1.8vw, 2rem);
  font-weight: 400;
  color: #fff;
  white-space: nowrap;
  will-change: transform;
  pointer-events: none;
}

.cinematic-hero-items {
  list-style: none;
  margin: 0;
  padding: 0;
  min-width: 14rem;
  pointer-events: auto;
}

.cinematic-hero-item {
  display: block;
}

.cinematic-hero-item-btn {
  display: block;
  width: 100%;
  background: none;
  border: none;
  padding: 0.4rem 0;
  font-family: var(--heading-font-family);
  font-size: clamp(1.4rem, 1.8vw, 2rem);
  font-weight: 400;
  color: #fff;
  opacity: 0.35;
  cursor: pointer;
  text-align: left;
  line-height: 1.3;
  will-change: opacity;
  transition: none;
}

.cinematic-hero-item[aria-selected='true'] .cinematic-hero-item-btn {
  opacity: 1;
}

.cinematic-hero-item-btn:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
  border-radius: 2px;
}

/* ── Bottom controls ─────────────────────────────────────────────────── */
.cinematic-hero-controls {
  position: absolute;
  bottom: calc(2rem + env(safe-area-inset-bottom));
  left: 0;
  right: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  pointer-events: none;
}

.cinematic-hero-sound {
  background: none;
  border: none;
  width: 2.5rem;
  height: 2.5rem;
  cursor: pointer;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  border-radius: 50%;
  padding: 0;
}

.cinematic-hero-sound:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

.cinematic-hero-mode {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  pointer-events: auto;
}

.cinematic-hero-mode-btn {
  background: none;
  border: none;
  font-family: var(--body-font-family);
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255 255 255 / 0.5);
  cursor: pointer;
  padding: 0.25rem 0;
}

.cinematic-hero-mode-btn--active {
  color: #fff;
}

.cinematic-hero-mode-btn:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

.cinematic-hero-mode-track {
  width: 2.5rem;
  height: 1rem;
  border: 1px solid rgba(255 255 255 / 0.5);
  border-radius: 0.5rem;
  position: relative;
  overflow: hidden;
}

.cinematic-hero-mode-indicator {
  position: absolute;
  top: 0.1rem;
  left: 0.1rem;
  width: calc(50% - 0.15rem);
  height: calc(100% - 0.2rem);
  background: #fff;
  border-radius: 0.4rem;
  will-change: transform;
}

/* ── Custom cursor ───────────────────────────────────────────────────── */
.cinematic-hero-cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid rgba(255 255 255 / 0.7);
  background: rgba(255 255 255 / 0.08);
  pointer-events: none;
  z-index: 4;
  opacity: 0;
  transform: translate(-50%, -50%);
  will-change: transform;
}

.cinematic-hero--cursor-visible .cinematic-hero-cursor {
  opacity: 1;
}

/* ── Reduced motion ──────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .cinematic-hero-prefix,
  .cinematic-hero-suffix,
  .cinematic-hero-item-btn,
  .cinematic-hero-mode-indicator,
  .cinematic-hero-cursor {
    will-change: auto;
    transition: none !important;
  }
}

/* ── Mobile ──────────────────────────────────────────────────────────── */
@media (width < 768px) {
  .cinematic-hero-selector {
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 0;
    padding: 0 1.5rem;
  }

  .cinematic-hero-items {
    min-width: unset;
    width: 100%;
  }

  .cinematic-hero-cursor {
    display: none;
  }
}
```

- [ ] **Step 2.5: Start dev server and verify structure**

```bash
npm run start
```

Open `http://localhost:3000` in browser. Add a `cinematic-hero` block to a test page with at least 2 items (one `experiences`, one `destinations`). Verify:

- Block renders at full viewport height
- DOM contains `.cinematic-hero-media`, `.cinematic-hero-selector`, `.cinematic-hero-controls`
- No JS errors in console

- [ ] **Step 2.6: Lint and commit**

```bash
npm run lint
git add src/blocks/cinematic-hero/
git commit -m "feat(cinematic-hero): implement DOM parsing and full HTML/CSS structure"
```

---

## Task 3: Media Manager

**Files:**

- Create: `src/blocks/cinematic-hero/lib/media-manager.ts`
- Modify: `src/blocks/cinematic-hero/cinematic-hero.ts`

**Interfaces:**

- Consumes: `HeroItem` from `lib/types.ts`
- Produces: `MediaManager` class with `switchTo(item)`, `setMuted(muted)`, `pause()`, `resume()`, `destroy()`

- [ ] **Step 3.1: Create `lib/media-manager.ts`**

```typescript
// src/blocks/cinematic-hero/lib/media-manager.ts
import type { HeroItem } from './types';

const CROSSFADE_MS = 360;

export class MediaManager {
  private videoA: HTMLVideoElement;
  private videoB: HTMLVideoElement;
  private posterEl: HTMLElement;
  private activeLayer: 'a' | 'b' = 'a';
  private sequenceId = 0;
  private muted = true;

  constructor(videoA: HTMLVideoElement, videoB: HTMLVideoElement, posterEl: HTMLElement) {
    this.videoA = videoA;
    this.videoB = videoB;
    this.posterEl = posterEl;

    // Start both fully transparent; active layer will be faded in on first switchTo
    videoA.style.opacity = '0';
    videoB.style.opacity = '0';
  }

  get activeVideo(): HTMLVideoElement {
    return this.activeLayer === 'a' ? this.videoA : this.videoB;
  }

  get inactiveVideo(): HTMLVideoElement {
    return this.activeLayer === 'a' ? this.videoB : this.videoA;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.videoA.muted = muted;
    this.videoB.muted = muted;
  }

  pause(): void {
    this.videoA.pause();
    this.videoB.pause();
  }

  resume(): void {
    if (parseFloat(this.activeVideo.style.opacity ?? '0') > 0) {
      this.activeVideo.play().catch(() => {
        // Autoplay rejected — poster remains visible
      });
    }
  }

  /** Switch to a new item's video with opacity crossfade. */
  async switchTo(item: HeroItem): Promise<void> {
    this.sequenceId += 1;
    const mySeq = this.sequenceId;

    const incoming = this.inactiveVideo;
    const outgoing = this.activeVideo;

    // Update poster fallback immediately
    this.posterEl.style.backgroundImage = `url(${item.posterUrl})`;
    this.posterEl.style.backgroundPosition = this.getFocalPosition(item);

    // Load video into incoming layer
    incoming.src = item.videoUrl;
    incoming.muted = this.muted;
    incoming.style.objectPosition = this.getFocalPosition(item);

    // Wait until browser has first frame
    await new Promise<void>((resolve, reject) => {
      const onLoaded = (): void => {
        cleanup();
        resolve();
      };
      const onError = (): void => {
        cleanup();
        reject(new Error(`Video load error: ${item.videoUrl}`));
      };
      const cleanup = (): void => {
        incoming.removeEventListener('loadeddata', onLoaded);
        incoming.removeEventListener('error', onError);
      };
      incoming.addEventListener('loadeddata', onLoaded, { once: true });
      incoming.addEventListener('error', onError, { once: true });
      incoming.load();
    }).catch(() => {
      // Video failed — poster already updated, skip crossfade
    });

    // Stale request guard: another switchTo() was called while we were loading
    if (this.sequenceId !== mySeq) return;

    // Start playback before fade
    incoming.play().catch(() => {
      // Autoplay blocked — poster visible already
    });

    // Crossfade: incoming fades in, outgoing fades out simultaneously
    const fadeIn = incoming.animate([{ opacity: '0' }, { opacity: '1' }], {
      duration: CROSSFADE_MS,
      easing: 'linear',
      fill: 'forwards',
    });
    const fadeOut = outgoing.animate([{ opacity: '1' }, { opacity: '0' }], {
      duration: CROSSFADE_MS,
      easing: 'linear',
      fill: 'forwards',
    });

    await Promise.all([fadeIn.finished, fadeOut.finished]).catch(() => {
      // Animation interrupted (e.g. rapid switching) — that's fine
    });

    // Guard again after await
    if (this.sequenceId !== mySeq) return;

    // Commit final opacity via style (remove fill: forwards)
    incoming.style.opacity = '1';
    outgoing.style.opacity = '0';
    fadeIn.cancel();
    fadeOut.cancel();

    // Cleanup outgoing
    outgoing.pause();
    outgoing.removeAttribute('src');
    outgoing.load();

    // Swap active layer
    this.activeLayer = this.activeLayer === 'a' ? 'b' : 'a';
  }

  private getFocalPosition(item: HeroItem): string {
    const isMobile = window.matchMedia('(width < 768px)').matches;
    return isMobile ? item.focalMobile : item.focalDesktop;
  }

  destroy(): void {
    this.sequenceId = Number.MAX_SAFE_INTEGER; // invalidate any pending switchTo
    this.videoA.pause();
    this.videoB.pause();
    this.videoA.removeAttribute('src');
    this.videoB.removeAttribute('src');
    this.videoA.load();
    this.videoB.load();
  }
}
```

- [ ] **Step 3.2: Wire `MediaManager` into `decorate()`**

In `cinematic-hero.ts`, add import and integrate after `buildDOM`:

```typescript
import { MediaManager } from './lib/media-manager';

// Inside decorate(), after block.replaceChildren(dom.root):

const media = new MediaManager(dom.videoA, dom.videoB, dom.posterEl);

// Load first item immediately
const firstItem = items.find((i) => i.mode === state.activeMode) ?? items[0];
if (firstItem) {
  media.switchTo(firstItem).catch(() => {
    // Silent: poster already displayed
  });
}

// Sound toggle
dom.soundBtn.addEventListener('click', () => {
  state.muted = !state.muted;
  media.setMuted(state.muted);
  dom.soundBtn.setAttribute('aria-pressed', String(!state.muted));
  dom.soundBtn.setAttribute('aria-label', state.muted ? 'Unmute video' : 'Mute video');
});

// Pause/resume on visibility
const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].intersectionRatio >= 0.25) {
      media.resume();
    } else {
      media.pause();
    }
  },
  { threshold: [0, 0.25] },
);
observer.observe(block);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    media.pause();
  } else {
    media.resume();
  }
});
```

- [ ] **Step 3.3: Verify in browser**

With dev server running:

- Block shows poster immediately
- After ~1s, video fades in over poster
- Clicking sound button toggles muted state
- Switching browser tabs pauses video

- [ ] **Step 3.4: Lint and commit**

```bash
npm run lint
git add src/blocks/cinematic-hero/
git commit -m "feat(cinematic-hero): add MediaManager with dual-layer crossfade and sequence ID guard"
```

---

## Task 4: Selector UI & WAAPI Anchor Movement

**Files:**

- Create: `src/blocks/cinematic-hero/lib/selector-ui.ts`
- Modify: `src/blocks/cinematic-hero/cinematic-hero.ts`

**Interfaces:**

- Consumes: `HeroItem`, `HeroState` from `lib/types.ts`; `MediaManager.switchTo()` from Task 3
- Produces: `SelectorUI` class with `activateItem(index, animate)`, `measureRows()`, `onSelect(cb)`, `renderItems(items, activeIndex)`, `destroy()`

- [ ] **Step 4.1: Create `lib/selector-ui.ts`**

```typescript
// src/blocks/cinematic-hero/lib/selector-ui.ts
import type { HeroItem } from './types';

const ANCHOR_MS = 310;
const OPACITY_MS = 190;
const HOVER_DELAY_MS = 120;

export class SelectorUI {
  private prefixEl: HTMLElement;
  private suffixEl: HTMLElement;
  private itemListEl: HTMLUListElement;
  private items: HeroItem[] = [];
  private rowOffsets: number[] = [];
  private activeIndex = 0;
  private selectCallbacks: Array<(index: number) => void> = [];
  private hoverTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingAnchorAnimations: Animation[] = [];
  private introComplete = false;

  constructor(prefixEl: HTMLElement, suffixEl: HTMLElement, itemListEl: HTMLUListElement) {
    this.prefixEl = prefixEl;
    this.suffixEl = suffixEl;
    this.itemListEl = itemListEl;
  }

  setIntroComplete(complete: boolean): void {
    this.introComplete = complete;
  }

  onSelect(cb: (index: number) => void): void {
    this.selectCallbacks.push(cb);
  }

  private emitSelect(index: number): void {
    this.selectCallbacks.forEach((cb) => cb(index));
  }

  /** Render the item list for the given items, preserving pointer listeners. */
  renderItems(items: HeroItem[], activeIndex: number): void {
    this.items = items;
    this.activeIndex = activeIndex;

    this.itemListEl.innerHTML = '';
    items.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'cinematic-hero-item';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', idx === activeIndex ? 'true' : 'false');
      li.dataset.index = String(idx);

      const btn = document.createElement('button');
      btn.className = 'cinematic-hero-item-btn';
      btn.type = 'button';
      btn.textContent = item.label;

      // Pointer interaction
      btn.addEventListener('pointerenter', () => this.handlePointerEnter(idx));
      btn.addEventListener('pointerleave', () => this.handlePointerLeave());

      // Keyboard interaction
      btn.addEventListener('keydown', (e) => this.handleKeyDown(e, idx));
      btn.addEventListener('click', () => this.handleClick(idx));

      li.append(btn);
      this.itemListEl.append(li);
    });
  }

  private handlePointerEnter(index: number): void {
    if (!this.introComplete) return;
    this.clearHoverTimer();
    this.hoverTimer = setTimeout(() => {
      this.activateItem(index, true);
      this.emitSelect(index);
    }, HOVER_DELAY_MS);
  }

  private handlePointerLeave(): void {
    this.clearHoverTimer();
  }

  private handleKeyDown(e: KeyboardEvent, currentIndex: number): void {
    if (!this.introComplete) return;
    const count = this.items.length;
    let next = currentIndex;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      next = Math.min(count - 1, currentIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      next = Math.max(0, currentIndex - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      next = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      next = count - 1;
    } else return;

    if (next !== currentIndex) {
      this.activateItem(next, true);
      this.emitSelect(next);
      // Move focus to new item button
      const btn = this.itemListEl.children[next]?.querySelector<HTMLButtonElement>('button');
      btn?.focus();
    }
  }

  private handleClick(index: number): void {
    if (!this.introComplete) return;
    this.clearHoverTimer();
    const item = this.items[index];
    if (index === this.activeIndex && item?.link) {
      window.location.href = item.link;
      return;
    }
    this.activateItem(index, true);
    this.emitSelect(index);
  }

  private clearHoverTimer(): void {
    if (this.hoverTimer !== null) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
  }

  /** Cache the Y offset (relative to item list) of each row. Call after font load and on resize. */
  measureRows(): void {
    const listTop = this.itemListEl.getBoundingClientRect().top;
    this.rowOffsets = [...this.itemListEl.children].map((li) => {
      const rect = li.getBoundingClientRect();
      return rect.top + rect.height / 2 - listTop;
    });
  }

  /** Move prefix/suffix to align with the given item row, and update opacity states. */
  activateItem(index: number, animate: boolean): void {
    const prev = this.activeIndex;
    this.activeIndex = index;

    // Update aria-selected
    const lis = [...this.itemListEl.children] as HTMLElement[];
    lis.forEach((li, i) => {
      li.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });

    // Opacity transitions
    const prevBtn = lis[prev]?.querySelector<HTMLElement>('.cinematic-hero-item-btn');
    const nextBtn = lis[index]?.querySelector<HTMLElement>('.cinematic-hero-item-btn');

    if (prevBtn && prev !== index) {
      prevBtn.animate([{ opacity: 1 }, { opacity: 0.35 }], {
        duration: animate ? OPACITY_MS : 0,
        fill: 'forwards',
      });
    }
    if (nextBtn) {
      nextBtn.animate([{ opacity: 0.35 }, { opacity: 1 }], {
        duration: animate ? OPACITY_MS : 0,
        fill: 'forwards',
      });
    }

    // Anchor movement
    if (this.rowOffsets.length === 0) this.measureRows();
    const targetOffset = this.rowOffsets[index];
    if (targetOffset === undefined) return;

    // Cancel pending anchor animations (overwrite — latest wins)
    this.pendingAnchorAnimations.forEach((a) => a.cancel());
    this.pendingAnchorAnimations = [];

    const listRect = this.itemListEl.getBoundingClientRect();
    const prefixRect = this.prefixEl.getBoundingClientRect();
    const suffixRect = this.suffixEl.getBoundingClientRect();

    // Target Y: align midpoint of prefix/suffix with item row midpoint
    const listTop = listRect.top;
    const prefixMidY = prefixRect.top + prefixRect.height / 2;
    const suffixMidY = suffixRect.top + suffixRect.height / 2;

    const targetY = listTop + targetOffset;
    const prefixDelta = targetY - prefixMidY;
    const suffixDelta = targetY - suffixMidY;

    const prefixCurrentY = this.getCurrentTranslateY(this.prefixEl);
    const suffixCurrentY = this.getCurrentTranslateY(this.suffixEl);

    const prefixAnim = this.prefixEl.animate(
      [
        { transform: `translateY(${prefixCurrentY}px)` },
        { transform: `translateY(${prefixCurrentY + prefixDelta}px)` },
      ],
      { duration: animate ? ANCHOR_MS : 0, easing: 'ease-out', fill: 'forwards' },
    );
    const suffixAnim = this.suffixEl.animate(
      [
        { transform: `translateY(${suffixCurrentY}px)` },
        { transform: `translateY(${suffixCurrentY + suffixDelta}px)` },
      ],
      { duration: animate ? ANCHOR_MS : 0, easing: 'ease-out', fill: 'forwards' },
    );

    this.pendingAnchorAnimations = [prefixAnim, suffixAnim];

    // Commit on finish
    prefixAnim.finished
      .then(() => {
        this.prefixEl.style.transform = `translateY(${prefixCurrentY + prefixDelta}px)`;
        prefixAnim.cancel();
      })
      .catch(() => {
        /* cancelled by next activation */
      });

    suffixAnim.finished
      .then(() => {
        this.suffixEl.style.transform = `translateY(${suffixCurrentY + suffixDelta}px)`;
        suffixAnim.cancel();
      })
      .catch(() => {
        /* cancelled */
      });
  }

  private getCurrentTranslateY(el: HTMLElement): number {
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    return matrix.m42;
  }

  destroy(): void {
    this.clearHoverTimer();
    this.pendingAnchorAnimations.forEach((a) => a.cancel());
  }
}
```

- [ ] **Step 4.2: Wire `SelectorUI` into `decorate()`**

In `cinematic-hero.ts`, import and add after the MediaManager wiring:

```typescript
import { SelectorUI } from './lib/selector-ui';

// Inside decorate(), after media wiring:

const selectorUI = new SelectorUI(dom.prefixEl, dom.suffixEl, dom.itemListEl);
const modeItems = items.filter((i) => i.mode === state.activeMode);
selectorUI.renderItems(modeItems, state.activeIndex[state.activeMode]);

// Recalculate row offsets after fonts load and on resize
if (document.fonts) {
  document.fonts.ready.then(() => selectorUI.measureRows());
} else {
  selectorUI.measureRows();
}

const ro = new ResizeObserver(() => {
  selectorUI.measureRows();
});
ro.observe(block);

// Wire item selection to media switch
selectorUI.onSelect((index) => {
  state.activeIndex[state.activeMode] = index;
  const item = items.filter((i) => i.mode === state.activeMode)[index];
  if (item) {
    media.switchTo(item).catch(() => {});
  }
});
```

- [ ] **Step 4.3: Verify in browser**

- Hover over items — prefix and suffix should smoothly translate to align with the hovered item
- Rapid hover should not queue transitions — the anchor should snap to the latest target
- Keyboard: Tab to item list, use Arrow Up/Down to navigate items
- Active item should be opacity 1, others ~0.35

- [ ] **Step 4.4: Lint and commit**

```bash
npm run lint
git add src/blocks/cinematic-hero/
git commit -m "feat(cinematic-hero): add SelectorUI with WAAPI anchor movement and keyboard navigation"
```

---

## Task 5: Intro Animation

**Files:**

- Create: `src/blocks/cinematic-hero/lib/intro.ts`
- Modify: `src/blocks/cinematic-hero/cinematic-hero.ts`

**Interfaces:**

- Consumes: `IntroElements` from `lib/types.ts`
- Produces: `runIntro(elements): Promise<void>`, `skipIntro(elements): void`

- [ ] **Step 5.1: Create `lib/intro.ts`**

```typescript
// src/blocks/cinematic-hero/lib/intro.ts
import type { IntroElements } from './types';

// Intro timing (seconds from block-visible)
const T_SENTENCE_FADEIN = 700; // sentence fades in
const T_SENTENCE_SPLIT = 2750; // prefix/suffix split horizontally
const T_ITEMS_REVEAL = 3500; // items fade in
const T_INTRO_DONE = 3750; // interaction unlocks

// Horizontal distance prefix/suffix travel to their "separated" position
const SPLIT_TRANSLATE_PX = 120;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run the full intro animation (~3.75s).
 * Prefix and suffix start visually centered (as if one sentence),
 * then split horizontally, then settle vertically to first item row.
 * The SelectorUI will handle the vertical anchor placement for item 0
 * after introComplete is set.
 */
export async function runIntro(elements: IntroElements): Promise<void> {
  const { prefix, suffix, itemList, controls } = elements;

  // Initial state: UI invisible
  prefix.style.opacity = '0';
  suffix.style.opacity = '0';
  itemList.style.opacity = '0';
  controls.style.opacity = '0';

  // Initial centering transform (make prefix/suffix appear as one phrase)
  prefix.style.transform = `translateX(${SPLIT_TRANSLATE_PX}px)`;
  suffix.style.transform = `translateX(-${SPLIT_TRANSLATE_PX}px)`;

  // 0.70s: fade in sentence
  await delay(T_SENTENCE_FADEIN);
  await Promise.all([
    prefix.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'linear', fill: 'forwards' }).finished,
    suffix.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'linear', fill: 'forwards' }).finished,
  ]).catch(() => {});
  prefix.style.opacity = '1';
  suffix.style.opacity = '1';

  // 2.75s: split horizontally
  await delay(T_SENTENCE_SPLIT - T_SENTENCE_FADEIN - 300);
  await Promise.all([
    prefix.animate([{ transform: `translateX(${SPLIT_TRANSLATE_PX}px)` }, { transform: 'translateX(0)' }], {
      duration: 250,
      easing: 'ease-out',
      fill: 'forwards',
    }).finished,
    suffix.animate([{ transform: `translateX(-${SPLIT_TRANSLATE_PX}px)` }, { transform: 'translateX(0)' }], {
      duration: 250,
      easing: 'ease-out',
      fill: 'forwards',
    }).finished,
    itemList.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'forwards' })
      .finished,
  ]).catch(() => {});
  prefix.style.transform = 'translateX(0)';
  suffix.style.transform = 'translateX(0)';
  itemList.style.opacity = '1';

  // 3.50s: controls fade in
  await delay(T_ITEMS_REVEAL - T_SENTENCE_SPLIT - 250);
  controls
    .animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'linear', fill: 'forwards' })
    .finished.then(() => {
      controls.style.opacity = '1';
    })
    .catch(() => {});

  // 3.75s: intro done
  await delay(T_INTRO_DONE - T_ITEMS_REVEAL);
}

/**
 * Skip intro and jump directly to final state.
 * Call when: prefers-reduced-motion, editor context, or config flag.
 */
export function skipIntro(elements: IntroElements): void {
  const { prefix, suffix, itemList, controls } = elements;
  prefix.style.opacity = '1';
  prefix.style.transform = 'translateX(0)';
  suffix.style.opacity = '1';
  suffix.style.transform = 'translateX(0)';
  itemList.style.opacity = '1';
  controls.style.opacity = '1';
}
```

- [ ] **Step 5.2: Detect editor context and reduced motion**

In `cinematic-hero.ts`, add a helper before `decorate`:

```typescript
function shouldSkipIntro(): boolean {
  // Reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  // AEM Universal Editor context
  if (document.documentElement.classList.contains('adobe-ue-edit')) return true;
  if (window.self !== window.top) return true; // inside iframe (UE)
  return false;
}
```

- [ ] **Step 5.3: Wire intro into `decorate()`**

In `cinematic-hero.ts`, import and integrate after selectorUI wiring:

```typescript
import { runIntro, skipIntro } from './lib/intro';

// Inside decorate(), after selectorUI wiring:

const introElements: IntroElements = {
  prefix: dom.prefixEl,
  suffix: dom.suffixEl,
  itemList: dom.itemListEl,
  controls: dom.controlsEl,
};

if (shouldSkipIntro()) {
  skipIntro(introElements);
  selectorUI.measureRows();
  selectorUI.activateItem(state.activeIndex[state.activeMode], false);
  selectorUI.setIntroComplete(true);
  state.introComplete = true;
} else {
  runIntro(introElements).then(() => {
    selectorUI.measureRows();
    selectorUI.activateItem(state.activeIndex[state.activeMode], false);
    selectorUI.setIntroComplete(true);
    state.introComplete = true;
  });
}
```

- [ ] **Step 5.4: Verify in browser**

- Refresh page with block in viewport
- Observe: sentence fades in ~0.7s, splits ~2.75s, items appear ~3.5s
- Enable "Emulate CSS media feature" → `prefers-reduced-motion: reduce` in DevTools → block should show final state immediately, no animation
- Verify no spring or bounce in transitions

- [ ] **Step 5.5: Lint and commit**

```bash
npm run lint
git add src/blocks/cinematic-hero/
git commit -m "feat(cinematic-hero): add intro animation sequence with reduced-motion skip"
```

---

## Task 6: Mode Selector

**Files:**

- Modify: `src/blocks/cinematic-hero/cinematic-hero.ts`

**Interfaces:**

- Consumes: `SelectorUI.renderItems()`, `MediaManager.switchTo()`, `HeroState`, all DOM elements from `buildDOM`
- Produces: mode switch sequence wired to mode buttons

- [ ] **Step 6.1: Add `switchMode()` orchestrator in `cinematic-hero.ts`**

Add this function before `decorate()` (it will use closures — wire it inside decorate instead):

Inside `decorate()`, after all module wiring, add:

```typescript
let modeLocked = false;

async function switchMode(newMode: HeroMode): Promise<void> {
  if (modeLocked || newMode === state.activeMode) return;
  modeLocked = true;

  const prevMode = state.activeMode;
  state.activeMode = newMode;

  // 1. Update mode button states
  dom.modeBtns.forEach((btn) => {
    const isActive = btn.dataset.mode === newMode;
    btn.setAttribute('aria-selected', String(isActive));
    btn.classList.toggle('cinematic-hero-mode-btn--active', isActive);
  });

  // 2. Slide indicator toward new mode
  const indicatorTargetX = newMode === 'destinations' ? '50%' : '0%';
  dom.indicatorEl
    .animate(
      [
        { transform: `translateX(${newMode === 'destinations' ? 0 : 50}%)` },
        { transform: `translateX(${newMode === 'destinations' ? 50 : 0}%)` },
      ],
      { duration: 280, easing: 'ease-out', fill: 'forwards' },
    )
    .finished.then(() => {
      dom.indicatorEl.style.transform = `translateX(${indicatorTargetX})`;
    })
    .catch(() => {});

  // 3. Fade out current item list
  await dom.itemListEl
    .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'linear', fill: 'forwards' })
    .finished.catch(() => {});
  dom.itemListEl.style.opacity = '0';

  // 4. Swap list content
  const newModeItems = items.filter((i) => i.mode === newMode);
  const newActiveIndex = state.activeIndex[newMode];
  selectorUI.renderItems(newModeItems, newActiveIndex);
  selectorUI.measureRows();

  // 5. Move anchors to new active row (no animation — they'll fade in at correct position)
  selectorUI.activateItem(newActiveIndex, false);

  // 6. Fade in new list + update media in parallel
  const newActiveItem = newModeItems[newActiveIndex];
  if (newActiveItem) {
    media.switchTo(newActiveItem).catch(() => {});
  }

  await dom.itemListEl
    .animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out', fill: 'forwards' })
    .finished.catch(() => {});
  dom.itemListEl.style.opacity = '1';

  modeLocked = false;
}

// Wire mode buttons
dom.modeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const newMode = btn.dataset.mode as HeroMode;
    if (newMode) switchMode(newMode);
  });
});

// Keyboard: Arrow Left/Right on mode buttons
dom.modeBtns.forEach((btn, idx) => {
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const targetIdx = e.key === 'ArrowLeft' ? 0 : 1;
      dom.modeBtns[targetIdx]?.focus();
      const newMode = dom.modeBtns[targetIdx]?.dataset.mode as HeroMode;
      if (newMode && newMode !== state.activeMode) switchMode(newMode);
    }
  });
});
```

- [ ] **Step 6.2: Set initial indicator position**

Just after building DOM and before intro (in `decorate()`), set indicator to initial position:

```typescript
// Set initial indicator position (experiences = left, destinations = right)
dom.indicatorEl.style.transform = state.activeMode === 'destinations' ? 'translateX(50%)' : 'translateX(0%)';
```

- [ ] **Step 6.3: Verify in browser**

- Click `Destinations` — indicator slides right, list swaps to destination items
- Click `Experiences` — indicator slides left, list swaps back
- Switching back to `Experiences` should restore the previously active experience item (not reset to index 0)
- Verify media also crossfades to new mode's active item

- [ ] **Step 6.4: Lint and commit**

```bash
npm run lint
git add src/blocks/cinematic-hero/
git commit -m "feat(cinematic-hero): add mode selector with indicator animation and per-mode state"
```

---

## Task 7: Custom Cursor

**Files:**

- Create: `src/blocks/cinematic-hero/lib/cursor.ts`
- Modify: `src/blocks/cinematic-hero/cinematic-hero.ts`

**Interfaces:**

- Consumes: container `HTMLElement`, cursor `HTMLElement`
- Produces: `CursorController` class with `mount()`, `destroy()`

- [ ] **Step 7.1: Create `lib/cursor.ts`**

```typescript
// src/blocks/cinematic-hero/lib/cursor.ts

const LERP_FACTOR = 0.12; // 0 = no follow, 1 = instant follow

export class CursorController {
  private container: HTMLElement;
  private cursorEl: HTMLElement;
  private rafId = 0;
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;
  private active = false;
  private mounted = false;

  constructor(container: HTMLElement, cursorEl: HTMLElement) {
    this.container = container;
    this.cursorEl = cursorEl;
  }

  /** Mount only if fine pointer and no reduced motion. */
  mount(): void {
    if (this.mounted) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.mounted = true;
    this.container.addEventListener('pointermove', this.onPointerMove);
    this.container.addEventListener('pointerenter', this.onPointerEnter);
    this.container.addEventListener('pointerleave', this.onPointerLeave);
    this.container.style.cursor = 'none';
  }

  private onPointerMove = (e: PointerEvent): void => {
    this.targetX = e.clientX;
    this.targetY = e.clientY;
    if (!this.active) this.startRAF();
  };

  private onPointerEnter = (): void => {
    this.active = true;
    this.cursorEl.style.opacity = '1';
    this.startRAF();
  };

  private onPointerLeave = (): void => {
    this.active = false;
    this.cursorEl.style.opacity = '0';
  };

  private startRAF(): void {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(this.tick);
  }

  private tick = (): void => {
    // LERP toward target
    this.currentX += (this.targetX - this.currentX) * LERP_FACTOR;
    this.currentY += (this.targetY - this.currentY) * LERP_FACTOR;

    this.cursorEl.style.transform = `translate(calc(${this.currentX}px - 50%), calc(${this.currentY}px - 50%))`;

    if (this.active || Math.abs(this.targetX - this.currentX) > 0.5) {
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      this.rafId = 0;
    }
  };

  destroy(): void {
    this.mounted = false;
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.container.removeEventListener('pointermove', this.onPointerMove);
    this.container.removeEventListener('pointerenter', this.onPointerEnter);
    this.container.removeEventListener('pointerleave', this.onPointerLeave);
    this.container.style.cursor = '';
  }
}
```

- [ ] **Step 7.2: Wire `CursorController` into `decorate()`**

```typescript
import { CursorController } from './lib/cursor';

// Inside decorate(), at the end (after all other wiring):
const cursor = new CursorController(block, dom.cursorEl);
cursor.mount();
```

- [ ] **Step 7.3: Verify in browser**

On a desktop with a real pointer (not touch emulation):

- Move pointer into the hero block — circular cursor appears with slight lag
- Move pointer out — cursor disappears
- Rapid movement should show the lag/lerp effect

- [ ] **Step 7.4: Lint and commit**

```bash
npm run lint
git add src/blocks/cinematic-hero/
git commit -m "feat(cinematic-hero): add custom cursor with LERP follow and fine-pointer guard"
```

---

## Task 8: Analytics, Lifecycle & Cleanup

**Files:**

- Create: `src/blocks/cinematic-hero/lib/analytics.ts`
- Modify: `src/blocks/cinematic-hero/cinematic-hero.ts`

**Interfaces:**

- Consumes: `HeroItem`, `HeroMode`, `HeroState`
- Produces: 6 emit functions; `destroy()` method on block

- [ ] **Step 8.1: Create `lib/analytics.ts`**

```typescript
// src/blocks/cinematic-hero/lib/analytics.ts
import type { HeroMode } from './types';

function emit(eventName: string, detail: Record<string, unknown>): void {
  document.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
}

export function emitHeroImpression(blockId: string, mode: HeroMode, item: string): void {
  emit('cinematic-hero:impression', { blockId, mode, item });
}

export function emitItemSelect(
  previousItem: string,
  newItem: string,
  mode: HeroMode,
  inputSource: 'pointer' | 'keyboard' | 'touch',
): void {
  emit('cinematic-hero:item-select', { previousItem, newItem, mode, inputSource });
}

export function emitModeChange(previousMode: HeroMode, newMode: HeroMode, newActiveItem: string): void {
  emit('cinematic-hero:mode-change', { previousMode, newMode, newActiveItem });
}

export function emitItemNavigation(item: string, href: string): void {
  emit('cinematic-hero:item-navigate', { item, href });
}

export function emitSoundToggle(muted: boolean): void {
  emit('cinematic-hero:sound-toggle', { muted });
}

export function emitMediaError(item: string, mediaUrl: string, errorType: string): void {
  emit('cinematic-hero:media-error', { item, mediaUrl, errorType });
}
```

- [ ] **Step 8.2: Wire analytics into `decorate()` events**

Update the `selectorUI.onSelect` callback to emit analytics, and add impression tracking and cleanup:

```typescript
import { emitHeroImpression, emitItemSelect, emitModeChange, emitSoundToggle } from './lib/analytics';

// Update selectorUI.onSelect to include analytics:
selectorUI.onSelect((index) => {
  const prevItem = items.filter((i) => i.mode === state.activeMode)[state.activeIndex[state.activeMode]];
  state.activeIndex[state.activeMode] = index;
  const item = items.filter((i) => i.mode === state.activeMode)[index];
  if (item) {
    media.switchTo(item).catch(() => {});
    emitItemSelect(prevItem?.label ?? '', item.label, state.activeMode, 'pointer');
  }
});

// Update sound button handler to emit analytics:
dom.soundBtn.addEventListener('click', () => {
  state.muted = !state.muted;
  media.setMuted(state.muted);
  dom.soundBtn.setAttribute('aria-pressed', String(!state.muted));
  dom.soundBtn.setAttribute('aria-label', state.muted ? 'Unmute video' : 'Mute video');
  emitSoundToggle(state.muted);
});

// Impression: emit after block is visible for > 2s
const impressionTimer = setTimeout(() => {
  const firstItem = items.filter((i) => i.mode === state.activeMode)[state.activeIndex[state.activeMode]];
  emitHeroImpression(block.id || 'cinematic-hero', state.activeMode, firstItem?.label ?? '');
}, 2000);
```

- [ ] **Step 8.3: Add `destroy()` / cleanup in `decorate()`**

After all wiring, add:

```typescript
// Cleanup on disconnect
const disconnectObserver = new MutationObserver(() => {
  if (!block.isConnected) {
    clearTimeout(impressionTimer);
    cursor.destroy();
    selectorUI.destroy();
    media.destroy();
    observer.disconnect();
    disconnectObserver.disconnect();
    ro.disconnect();
  }
});
disconnectObserver.observe(document.body, { childList: true, subtree: true });
```

- [ ] **Step 8.4: Lint and verify no console errors**

```bash
npm run lint
```

Open browser DevTools → Console. Interact with block (hover items, switch mode, click sound). Verify `cinematic-hero:item-select` and `cinematic-hero:mode-change` events are dispatched (check via `document.addEventListener('cinematic-hero:item-select', console.log)`).

- [ ] **Step 8.5: Commit**

```bash
git add src/blocks/cinematic-hero/
git commit -m "feat(cinematic-hero): add analytics events, lifecycle cleanup, and disconnect observer"
```

---

## Task 9: Error Handling & Performance Polish

**Files:**

- Modify: `src/blocks/cinematic-hero/lib/media-manager.ts`
- Modify: `src/blocks/cinematic-hero/cinematic-hero.ts`
- Modify: `src/blocks/cinematic-hero/cinematic-hero.css`

**Interfaces:**

- Consumes: all modules from previous tasks
- Produces: graceful error states, empty-item guard, WAAPI fallback

- [ ] **Step 9.1: Add video error dispatch in `media-manager.ts`**

In `MediaManager.switchTo()`, update the error catch block:

```typescript
// In MediaManager constructor, add a callback field:
private onError: (item: HeroItem, errorType: string) => void = () => {};

setErrorHandler(cb: (item: HeroItem, errorType: string) => void): void {
  this.onError = cb;
}
```

In the `switchTo` Promise catch:

```typescript
}).catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : 'unknown';
  this.onError(item, msg);
  // Continue — poster already updated, skip crossfade
});
```

- [ ] **Step 9.2: Wire error handler in `decorate()`**

```typescript
import { emitMediaError } from './lib/analytics';

media.setErrorHandler((item, errorType) => {
  emitMediaError(item.label, item.videoUrl, errorType);
});
```

- [ ] **Step 9.3: Guard empty items edge case in `decorate()`**

The `if (items.length === 0) return;` in Task 2 is sufficient. Add a guard for missing `rows[0]`:

```typescript
if (rows.length < 1) return; // no config row
const config = parseConfig(rows[0]);
const items = parseItems(rows.slice(1));
if (items.length === 0) {
  // No valid items authored — render nothing (block stays hidden by AEM)
  return;
}
```

- [ ] **Step 9.4: Add WAAPI availability guard**

In `cinematic-hero.ts`, add before the intro call:

```typescript
// WAAPI feature detection — if unavailable, skip all animation
if (typeof Element.prototype.animate !== 'function') {
  skipIntro(introElements);
  selectorUI.setIntroComplete(true);
  state.introComplete = true;
  return; // block is usable without animations
}
```

- [ ] **Step 9.5: Add `preload="metadata"` for next item**

After intro completes, preload the next item in the current mode:

```typescript
// In the intro completion callback:
runIntro(introElements).then(() => {
  selectorUI.measureRows();
  selectorUI.activateItem(state.activeIndex[state.activeMode], false);
  selectorUI.setIntroComplete(true);
  state.introComplete = true;

  // Preload metadata for adjacent items
  const modeItems = items.filter((i) => i.mode === state.activeMode);
  const nextIdx = (state.activeIndex[state.activeMode] + 1) % modeItems.length;
  const nextItem = modeItems[nextIdx];
  if (nextItem) {
    const preloadVideo = document.createElement('video');
    preloadVideo.preload = 'metadata';
    preloadVideo.src = nextItem.videoUrl;
  }
});
```

- [ ] **Step 9.6: Final CSS — add `@media (hover: none)` touch affordances**

Append to `cinematic-hero.css`:

```css
/* Touch devices — item tap to activate, second tap to navigate */
@media (hover: none) {
  .cinematic-hero-item-btn {
    min-height: 44px;
    display: flex;
    align-items: center;
  }

  .cinematic-hero-cursor {
    display: none !important;
  }
}
```

- [ ] **Step 9.7: Full lint and final browser pass**

```bash
npm run lint
```

Final browser checklist:

- [ ] Block renders at full viewport height on mobile and desktop
- [ ] No black flash during video transitions
- [ ] Prefix/suffix align with active item baseline
- [ ] Item column width doesn't change when active item changes
- [ ] Mode indicator slides correct direction
- [ ] Custom cursor has slight lag on desktop
- [ ] Reduced-motion: no cinematic animation, poster only, instant transitions
- [ ] Sound control hidden when no items have `hasAudio: true`
- [ ] DevTools Console: no uncaught errors

- [ ] **Step 9.8: Commit**

```bash
git add src/blocks/cinematic-hero/
git commit -m "feat(cinematic-hero): add error handling, WAAPI guard, and performance polish"
```

---

## Task 10: UE Component Model Registration & Build Validation

**Files:**

- Run: `npm run build:json`
- Run: `npm run build`

**Interfaces:**

- Consumes: `_cinematic-hero.json`, `component-definition.json`, `component-models.json`, `component-filters.json`
- Produces: merged root JSON files, production build

- [ ] **Step 10.1: Verify `_cinematic-hero.json` fields match `decorate()` cell indices**

Re-read `_cinematic-hero.json` model for `cinematic-hero`. Count fields in order:

1. `prefix` → `rows[0].children[0]` ✓
2. `suffix` → `rows[0].children[1]` ✓
3. `experiencesLabel` → `rows[0].children[2]` ✓
4. `destinationsLabel` → `rows[0].children[3]` ✓

Re-read `cinematic-hero-item` model fields in order:

1. `label` → `row.children[0]` ✓
2. `mode` → `row.children[1]` ✓
3. `video` → `row.children[2]` ✓
4. `poster` → `row.children[3]` ✓
5. `link` → `row.children[4]` ✓
6. `focalDesktop` → `row.children[5]` ✓
7. `focalMobile` → `row.children[6]` ✓
8. `hasAudio` → `row.children[7]` ✓

Any mismatch between model field order and `parseItems()` indices is a content model alignment bug — fix before proceeding.

- [ ] **Step 10.2: Run `build:json` and inspect output**

```bash
npm run build:json
```

Expected: exits with code 0. Verify `component-definition.json` now contains `"id": "cinematic-hero"` and `"id": "cinematic-hero-item"`. Verify `component-models.json` contains both model entries. Verify `component-filters.json` contains `"id": "cinematic-hero"`.

- [ ] **Step 10.3: Run full production build**

```bash
npm run build
```

Expected: exits with code 0. Verify `blocks/cinematic-hero/cinematic-hero.js` and `blocks/cinematic-hero/cinematic-hero.css` exist in output. Verify chunk size is reasonable (block JS should be < 50 KB unminified).

- [ ] **Step 10.4: Final commit**

```bash
git add component-definition.json component-models.json component-filters.json
git commit -m "build(cinematic-hero): run build:json to register block in UE component config"
```

---

## Self-Review

**Spec coverage check:**

| Spec section                                             | Covered by task                                        |
| -------------------------------------------------------- | ------------------------------------------------------ |
| §3 Block layout (100svh, overflow hidden)                | Task 2 CSS                                             |
| §4 Media background (2 layers, crossfade, poster, focal) | Task 3                                                 |
| §4.6 Request cancellation (sequenceId)                   | Task 3 `media-manager.ts`                              |
| §5 Central selector (prefix, item list, suffix)          | Task 2 + Task 4                                        |
| §5.5 Fixed column width                                  | Task 2 CSS (min-width on `.cinematic-hero-items`)      |
| §6 Typography, active/inactive opacity                   | Task 2 CSS                                             |
| §7 Intro animation timing                                | Task 5                                                 |
| §7.6 Interaction lock during intro                       | Task 4 `setIntroComplete()`                            |
| §8 Item hover intent (120ms)                             | Task 4 `HOVER_DELAY_MS`                                |
| §8.5 Rapid hover overwrite                               | Task 4 `animation.cancel()`                            |
| §9 Mode selector, indicator slide                        | Task 6                                                 |
| §9.4 Per-mode active index                               | Task 6 `state.activeIndex`                             |
| §10 Custom cursor (fine pointer, LERP)                   | Task 7                                                 |
| §11 Sound control (initial muted, state persistence)     | Task 2 + Task 3                                        |
| §12 GSAP → WAAPI                                         | Tasks 4–6                                              |
| §13 Responsive (mobile layout, touch targets)            | Task 2 CSS + Task 9                                    |
| §14 Keyboard, ARIA, reduced motion                       | Task 4 keyboard + Task 5 skipIntro + Task 2 aria attrs |
| §15 Intersection + visibilitychange                      | Task 3                                                 |
| §15.3 Cleanup                                            | Task 8                                                 |
| §16 Performance (preload metadata, decoder limit)        | Task 3 + Task 9                                        |
| §17 Error handling                                       | Task 9                                                 |
| §18 Analytics events                                     | Task 8                                                 |
| §19 Acceptance criteria                                  | Verified in each task's browser step                   |

**Placeholder scan:** None found.

**Type consistency check:**

- `HeroItem.sourceRow` used in Task 1 (`types.ts`) → used in Task 2 (`buildItemEl`) ✓
- `MediaManager.switchTo(item: HeroItem)` → called with `HeroItem` throughout ✓
- `SelectorUI.renderItems(items, activeIndex)` → called with `HeroItem[]` and `number` ✓
- `IntroElements.prefix/suffix/itemList/controls` → all `HTMLElement` ✓
- `state.activeIndex` is `Record<HeroMode, number>` → accessed as `state.activeIndex[state.activeMode]` ✓
- `emitItemSelect` signature: `(previousItem: string, newItem: string, mode: HeroMode, inputSource)` → called correctly in Task 8 ✓
