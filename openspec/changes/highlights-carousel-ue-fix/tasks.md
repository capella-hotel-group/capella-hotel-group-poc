## 1. JSON Model Fix

- [x] 1.1 Remove the `alt` field from the `carousel-cards` model in `src/blocks/highlights-carousel/_highlights-carousel.json`
- [x] 1.2 Run `npm run build:json` to regenerate root `component-models.json`

## 2. TypeScript Fix

- [x] 2.1 Add `import { moveInstrumentation } from '@/app/scripts';` to `highlights-carousel.ts`
- [x] 2.2 Call `moveInstrumentation(row, li)` inside the `itemRows.forEach` loop, after `li` is created and before appending to `track`
- [x] 2.3 Verify cell-index mapping is correct after `alt` field removal: `cells[0]` = image, `cells[1]` = title, `cells[2+]` = content paragraphs
