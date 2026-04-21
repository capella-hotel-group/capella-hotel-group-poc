## 1. Block Scaffold

- [x] 1.1 Create `src/blocks/masthead-sticky/` directory
- [x] 1.2 Create `src/blocks/masthead-sticky/masthead-sticky.ts` with default export `decorate(block)` stub
- [x] 1.3 Create `src/blocks/masthead-sticky/masthead-sticky.css` with base selector
- [x] 1.4 Create `src/blocks/masthead-sticky/_masthead-sticky.json` with a single `video` aem-content field

## 2. Component Model

- [x] 2.1 Define component model in `_masthead-sticky.json`: model id `masthead-sticky`, one field `video` (component: `aem-content`, label: `Video`)
- [x] 2.2 Run `npm run build:json` to merge the model into `component-models.json`, `component-definition.json`, and `component-filters.json`
- [x] 2.3 Verify the block appears in the Universal Editor component list

## 3. TypeScript Implementation

- [x] 3.1 Read authored video URL: find `<a>` in first row, extract `href`
- [x] 3.2 Create background `<video>` element: `src`, `autoplay`, `muted`, `loop`, `playsinline`, `class="masthead-bg-video"`
- [x] 3.3 Create "WATCH VIDEO" CTA `<a>` element: `class="masthead-cta"`, text `WATCH VIDEO`, `href="#"`
- [x] 3.4 Build modal `<div class="masthead-modal">` with a modal `<video controls>` and `<button class="masthead-modal-close">✕</button>`, append to `document.body`
- [x] 3.5 Wire CTA click → show modal (`modal.classList.add('is-open')`), play modal video
- [x] 3.6 Wire close button click → hide modal (`modal.classList.remove('is-open')`), pause + reset modal video (`modalVideo.pause(); modalVideo.currentTime = 0`); ensure background video is unaffected
- [x] 3.7 Replace block contents with background video + CTA (`block.replaceChildren(bgVideo, cta)`)

## 4. CSS Implementation

- [x] 4.1 `.masthead-sticky`: `position: sticky; top: 0; height: 100vh; overflow: hidden; z-index: 50`
- [x] 4.2 `.masthead-bg-video`: `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover`
- [x] 4.3 `.masthead-cta`: `position: absolute; bottom: 32px; right: var(--header-padding-x, 40px); color: #fff; text-transform: uppercase; text-decoration: underline; letter-spacing: var(--header-letter-spacing, 0.12em); font-size: var(--body-font-size-xs)`
- [x] 4.4 `.masthead-modal`: `position: fixed; inset: 0; z-index: 200; background: #000; display: flex; align-items: center; justify-content: center; visibility: hidden; opacity: 0` — transition opacity
- [x] 4.5 `.masthead-modal.is-open`: `visibility: visible; opacity: 1`
- [x] 4.6 `.masthead-modal video`: `width: 100%; height: 100%; object-fit: contain`
- [x] 4.7 `.masthead-modal-close`: `position: absolute; top: 16px; right: 16px; color: #fff; background: transparent; border: none; font-size: 1.5rem; cursor: pointer`
- [x] 4.8 Add `100dvh` fallback alongside `100vh` for `.masthead-sticky` height (mobile viewport stability)

## 5. Validation

- [ ] 5.1 Verify background video autoplays muted and loops in browser
- [ ] 5.2 Verify "WATCH VIDEO" CTA is visible bottom-right, white, uppercase, underlined
- [ ] 5.3 Verify clicking CTA opens modal with video controls
- [ ] 5.4 Verify closing modal pauses + resets modal video; background video continues playing
- [ ] 5.5 Verify page content scrolls over the masthead and header becomes sticky after masthead scrolls away
- [x] 5.6 Run `npm run lint` and resolve any errors
