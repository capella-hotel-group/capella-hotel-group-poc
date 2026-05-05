## 1. Setup & Configuration

- [x] 1.1 Create block directory structure: `src/blocks/turneo-experiences/turneo-experiences.ts`, `turneo-experiences.css`, `_turneo-experiences.json`
- [x] 1.2 Create Turneo API service module at `src/utils/turneo-api.ts` with `fetchExperiences()` function, headers config, and TypeScript interfaces for the API response
- [x] 1.3 Add Turneo API config (base URL, API key) to environment/config pattern — mock server for dev, production for live
- [x] 1.4 Register block in `src/models/_section.json` and run `npm run build:json`

## 2. Card Grid - Core Block

- [x] 2.1 Implement `decorate()` function: render skeleton loading state, call `fetchExperiences()`, handle success/error
- [x] 2.2 Build card rendering logic: iterate experiences array, create card elements (image, title, description, CTA button) per item
- [x] 2.3 Sanitize description/highlight text with DOMPurify before rendering
- [x] 2.4 Add `console.log` of full experience object on CTA click
- [x] 2.5 Style card grid CSS: responsive columns (1/2/3), card layout, image aspect ratio, typography using design tokens

## 3. Skeleton Loading State

- [x] 3.1 Create skeleton card HTML structure with shimmer animation
- [x] 3.2 Style skeleton cards to match final card dimensions (prevent layout shift)

## 4. Detail Popup - Structure

- [x] 4.1 Create popup overlay function: append fixed overlay to `document.body`, lock body scroll, set ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-label`)
- [x] 4.2 Build popup content layout: two-column desktop (image left, info right), single-column mobile
- [x] 4.3 Render all experience info fields: name, full description, highlight, location, duration, categories, included/excluded lists, organizer, languages, minPrice
- [x] 4.4 Sanitize all popup text content with DOMPurify

## 5. Detail Popup - Image Slider

- [x] 5.1 Implement CSS scroll-snap image slider with all experience images
- [x] 5.2 Add navigation dots that sync with scroll position (IntersectionObserver or scroll event)
- [x] 5.3 Handle single-image case (no dots, no scroll)

## 6. Detail Popup - Interactions & Accessibility

- [x] 6.1 Implement close button (X) in top-right corner — removes popup, restores scroll
- [x] 6.2 Implement Escape key handler to close popup
- [x] 6.3 Implement focus trap: Tab cycles within popup, focus returns to trigger on close
- [x] 6.4 Clean up event listeners on popup close (keyboard, scroll observers)

## 7. Styling & Polish

- [x] 7.1 Style detail popup: overlay backdrop, content container, responsive layout, typography
- [x] 7.2 Style image slider: scroll-snap, dots, image sizing
- [x] 7.3 Style included/excluded lists, location info, organizer section, price display
- [x] 7.4 Ensure all styles use CSS custom properties from design system tokens
- [x] 7.5 Add hover/active states for CTA buttons consistent with project patterns

## 8. Validation

- [x] 8.1 Run `npm run lint` and fix any issues
- [x] 8.2 Verify block loads and renders with Turneo mock server
- [x] 8.3 Test responsive behavior at mobile/tablet/desktop breakpoints
- [x] 8.4 Test popup open/close, keyboard navigation, and focus management
