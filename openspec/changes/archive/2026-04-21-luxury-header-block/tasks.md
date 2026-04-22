## 1. CSS Design Tokens

- [x] 1.1 Add header-specific CSS custom properties to `src/styles/styles.css` (header height, taupe CTA color, letter-spacing values, dropdown shadow)
- [x] 1.2 Verify all token names follow the existing `--token-name` convention and do not duplicate existing tokens

## 2. Content Model (Universal Editor)

- [x] 2.1 Define the header block component model in `src/models/_header.json` with three row types: language-selector, center-nav, and cta-button
- [x] 2.2 Run `npm run build:json` to merge the model fragment into `component-models.json` and verify the output
- [x] 2.3 Update `component-definition.json` if the header block entry needs new field groups
- [x] 2.4 Update `component-filters.json` to allow the new row types inside the header block

## 3. Block Markup & TypeScript

- [x] 3.1 Rewrite `src/blocks/header/header.ts` — remove fragment loading, implement self-contained `decorate()` that reads three authored rows
- [x] 3.2 Build the language selector: `<button>` trigger + `<ul>` dropdown, wire `aria-expanded`, Escape key, and click-outside close logic
- [x] 3.3 Build the center nav zone: parse left link, emblem `<img>`, right link from the authored row
- [x] 3.4 Build the CTA button zone: `<a>` element styled as a button, read label and href from authored row
- [x] 3.5 Guard all `querySelector` / `querySelectorAll` results with null checks (strictNullChecks compliance)
- [x] 3.6 Replace all children in a single `block.replaceChildren(...els)` call — no incremental DOM mutation

## 4. Block CSS

- [x] 4.1 Rewrite `src/blocks/header/header.css` — three-zone flex layout, `position: sticky; top: 0`, `z-index: 100`, white background, bottom shadow
- [x] 4.2 Style the language selector trigger: uppercase, wide letter-spacing, lightweight sans-serif
- [x] 4.3 Style the language dropdown: absolute-positioned, white background, soft shadow, `opacity`/`visibility` CSS transition for fade-in
- [x] 4.4 Style center nav links: uppercase, refined serif or elegant sans-serif, generous horizontal gap
- [x] 4.5 Style emblem image: fixed small size (e.g. 32px), monochrome (`filter: grayscale(1)` or authored as monochrome SVG)
- [x] 4.6 Style CTA button: warm taupe background (`var(--color-cta-bg)`), white uppercase text, no border-radius, hover darkens background
- [x] 4.7 Ensure all color/spacing values reference CSS tokens — no hardcoded hex or pixel values from the design system

## 5. Emblem Asset

- [x] 5.1 Add the monochrome Capella emblem SVG to `/icons/capella-emblem.svg`

## 6. Lint & Type Check

- [x] 6.1 Run `npm run lint` — fix any ESLint errors in the new header files
- [x] 6.2 Run `npm run build` (tsc type-check + Vite build) — resolve all TypeScript errors
- [x] 6.3 Confirm no `no-param-reassign` or `strictNullChecks` violations remain

## 7. Manual Verification

- [ ] 7.1 Start `npm run start`, navigate to a page with the header block, verify three-zone layout renders correctly
- [ ] 7.2 Verify header stays sticky at top when scrolling — height does not change
- [ ] 7.3 Open and close the language dropdown via click, Escape key, and click-outside
- [ ] 7.4 Confirm dropdown shows ENGLISH, 简体中文, 日本語 with no icons and correct fade-in animation
- [ ] 7.5 Hover over the CTA button and verify the background darkens slightly
- [ ] 7.6 Verify emblem renders between DESTINATIONS and EXPERIENCES
- [ ] 7.7 Open the Universal Editor and confirm all three authoring rows are editable
