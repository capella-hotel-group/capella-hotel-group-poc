## 1. Block Scaffold

- [x] 1.1 Create `src/blocks/about-intro/about-intro.ts` with a stub `decorate()` function
- [x] 1.2 Create `src/blocks/about-intro/about-intro.css` with placeholder selectors

## 2. Component Model (Universal Editor)

- [x] 2.1 Create `src/models/_about-intro.json` with field definitions: heading (text), subtitle (text), image (reference), body (richtext), cta (text + href)
- [x] 2.2 Run `npm run build:json` and verify `component-definition.json`, `component-models.json`, `component-filters.json` are updated
- [ ] 2.3 Confirm "About Intro" appears in the Universal Editor block picker

## 3. TypeScript — decorate()

- [x] 3.1 Extract heading text from row 0 and render as `<h2>`
- [x] 3.2 Extract subtitle text from row 1 and render as a `<p>` in the header row
- [x] 3.3 Extract `<picture>` element from row 2 and place in image wrapper div
- [x] 3.4 Extract body rich-text from row 3, sanitize with DOMPurify, and render in synopsis div
- [x] 3.5 Extract CTA link from row 4; render `<a>` only when `href` is non-empty
- [x] 3.6 Call `block.replaceChildren()` once with the constructed DOM tree

## 4. CSS — Layout

- [x] 4.1 Define `--about-intro-text-indent` custom property (≈ 8.3% of container width)
- [x] 4.2 Implement two-column header row with CSS Grid (title ~25% | gap | subtitle ~33%)
- [x] 4.3 Style full-width image wrapper (`width: 100%`, `margin-bottom` spacing)
- [x] 4.4 Apply `--about-intro-text-indent` left margin to synopsis and CTA areas
- [x] 4.5 Add mobile breakpoint (< 768 px): stack header columns, remove indent, set image `min-height: 220px` with `object-fit: cover`
- [x] 4.6 Style CTA link to match project text-button convention (uppercase, underline, letter-spacing)

## 5. Visual Verification

- [ ] 5.1 Start dev server (`npm run start`) and verify block renders correctly at desktop width
- [ ] 5.2 Check mobile layout at < 768 px viewport
- [ ] 5.3 Verify empty CTA row produces no broken anchor element in the DOM
- [x] 5.4 Run `npm run lint` and fix any lint errors
