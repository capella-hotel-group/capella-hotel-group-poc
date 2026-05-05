## 1. Image Fallback & Section Layout

- [x] 1.1 Add `onerror` fallback handler to all `<img>` elements in card and popup (inline SVG data URI placeholder)
- [x] 1.2 Add `min-height: 100vh` and standard padding to `.turneo-experiences` in CSS
- [x] 1.3 Add section headline: update content model `_turneo-experiences.json` with headline field, read first cell in `decorate()`, render `<h2>` above grid

## 2. Fullscreen Popup

- [x] 2.1 Update `.turneo-experiences-popup-content` CSS to `width: 100vw; height: 100vh; max-width: none; border-radius: 0` for full viewport coverage

## 3. Date Range Filter

- [x] 3.1 Create date filter UI (two `<input type="date">` elements) rendered above the experience grid
- [x] 3.2 Wire Filter button click to re-fetch experiences with `from`/`until` params
- [x] 3.3 Handle clearing of date inputs (re-fetch without date params when Filter clicked)

## 4. API Enhancements

- [x] 4.1 Add `Prefer: 'code=200, dynamic=true'` header to `fetchExperiences()` in `turneo-api.ts`
- [x] 4.2 Add `fetchRates(params)` with 2-step flow (list rate IDs → retrieve each rate detail) to `turneo-api.ts`

## 5. Availability Display in Popup

- [x] 5.1 Call `fetchRates()` when detail popup opens (default: today → today+30 days)
- [x] 5.2 Render rate availability (rateName, rateStatus, startDate, startTime, availableQuantity)
- [x] 5.3 Handle empty results (show "No availability found" message)
- [x] 5.4 Handle fetch errors gracefully (show error message without breaking popup)

## 6. Validation

- [x] 6.1 Run `npm run lint` and fix any errors
- [x] 6.2 Verify block renders correctly with dev server (`npm run start`)
