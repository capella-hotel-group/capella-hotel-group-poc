## 1. Component Model Update

- [x] 1.1 Update `_masthead-sticky.json`: change `video` to `reference` component, add `image` (reference) and `content` (richtext) fields
- [x] 1.2 Run `npm run build:json` to merge model fragments

## 2. Block Decorator Update

- [x] 2.1 Update `masthead-sticky.ts` to read new DOM rows (row 0 video, row 1 image, row 2 content)
- [x] 2.2 Add placeholder image overlay with fade-out on video `loadeddata`
- [x] 2.3 Add richtext content overlay div
- [x] 2.4 Update `block.replaceChildren()` to include all new elements

## 3. CSS Styles

- [x] 3.1 Add placeholder image styles (`.masthead-placeholder`, `.masthead-placeholder--hidden`)
- [x] 3.2 Add content overlay styles (`.masthead-content`)

## 4. Validation

- [x] 4.1 Run `npm run lint` — no errors
- [x] 4.2 Run `npm run build` — no errors
