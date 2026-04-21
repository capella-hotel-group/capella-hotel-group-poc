## 1. SVG Asset

- [x] 1.1 Create `/icons/capella-emblem.svg` with the two-polygon crest SVG (the exact markup provided by the brand team, viewBox="0 0 48 79", two `<polygon>` elements)
- [x] 1.2 Verify the fill value: keep `#242F3A` hardcoded for now (dark brand color); add a TODO comment for future `currentColor` upgrade

## 2. Header TypeScript

- [x] 2.1 In `src/blocks/header/header.ts`, inside the center-nav zone builder, create an `<img>` element with `src="/icons/capella-emblem.svg"`, `class="header-emblem"`, and `alt=""`
- [x] 2.2 Insert the emblem `<img>` between the DESTINATIONS `<a>` and the EXPERIENCES `<a>` elements when building the center nav DOM
- [x] 2.3 Guard the emblem element with a null check — center nav renders correctly even if the src path ever changes

## 3. Header CSS

- [x] 3.1 Add `.header-emblem` rule in `src/blocks/header/header.css`: `width: 16px; height: auto; display: block`
- [x] 3.2 Ensure the center nav container has `display: flex; align-items: center; gap: var(--nav-gap, 24px)` so the emblem and links are vertically centered on the same axis

## 4. Lint & Type Check

- [x] 4.1 Run `npm run lint` — fix any ESLint errors in the modified header files
- [x] 4.2 Run `npm run build` — confirm tsc type-check and Vite build pass with no errors

## 5. Manual Verification

- [ ] 5.1 Start `npm run start`, open a page with the header block, and confirm the crest icon appears centered between DESTINATIONS and EXPERIENCES
- [ ] 5.2 Inspect the emblem in DevTools — confirm computed width is 16px and height is auto-proportional (~26px)
- [ ] 5.3 Confirm the crest color matches the brand dark color and is visible against the white header background
- [ ] 5.4 Confirm DESTINATIONS, emblem, and EXPERIENCES are vertically aligned on the same axis
