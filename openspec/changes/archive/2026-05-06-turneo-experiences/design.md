## Context

The project is an AEM Edge Delivery Services site using TypeScript + Vite. Blocks follow the `decorate(block)` pattern where authored content is restructured into the final DOM. The Turneo Experiences API provides hotel guest experiences (tours, tastings, wellness) via a RESTful JSON endpoint. The block needs to fetch data client-side (no SSR in EDS), render a card grid, and provide a detail popup — all without a frontend framework.

Existing blocks (`cards`, `activities`) establish patterns for grid layouts, responsive images, and interactive carousels. The project uses CSS custom properties from `:root`, BEM-adjacent naming, and `DOMPurify` for any dynamic HTML.

## Goals / Non-Goals

**Goals:**

- Fetch experiences from Turneo API on block load and render as a card grid
- Provide a fullscreen detail popup with image slider and structured product info
- Follow existing block conventions (decorate pattern, CSS tokens, `@/*` imports)
- Work with the Turneo mock server for development and production API for live
- Responsive: mobile-first card layout (1 col → 2 col → 3 col)

**Non-Goals:**

- Full booking flow (rates, availability, order creation) — only listing + detail view
- Server-side rendering or caching layer
- Pagination / infinite scroll (render all results from single API call)
- Search/filter UI within the block (future enhancement)
- Integration with AEM authored content cells (block is data-driven, model only stores config like `storeId`)

## Decisions

### 1. Client-side fetch in `decorate()` with loading state

**Decision:** Fetch experiences inside `decorate()` using native `fetch()`. Show a skeleton/loading state while data loads.

**Rationale:** EDS blocks execute client-side; there's no server rendering layer. The `activities` block uses a similar pattern. Native fetch avoids added dependencies.

**Alternative considered:** Pre-rendering via AEM content — rejected because experience data is dynamic and comes from a third-party API.

### 2. API configuration via block model fields (`storeId`, `apiBaseUrl`)

**Decision:** The AEM content model (`_turneo-experiences.json`) stores `storeId` as an authored field. The API base URL is determined by the environment config (`src/configs/environments.ts` pattern) with a fallback to the mock server.

**Rationale:** Different hotel properties have different Turneo store IDs. Authors configure per-page. API key is stored in a project-level config (not authored).

**Alternative considered:** Hardcoded store ID — rejected for multi-property support.

### 3. Turneo API service module at `src/utils/turneo-api.ts`

**Decision:** Create a reusable service module that wraps fetch calls to the Turneo API with proper headers (`x-api-key`, `Accept: application/json`). Exposes `fetchExperiences(params)` function.

**Rationale:** Separates API concerns from block DOM logic. Enables future reuse if other blocks need Turneo data (rates, bookings).

### 4. Fullscreen popup as DOM overlay (not a separate route/page)

**Decision:** Detail popup is a `position: fixed; inset: 0` overlay appended to `document.body` on CTA click. Closed via a close button or Escape key. Body scroll locked while open.

**Rationale:** EDS has no router. Overlays are the standard pattern for detail views in single-page blocks. The `video-photo-player` block uses similar viewport-filling overlays.

**Alternative considered:** Navigate to a fragment page — rejected because it requires additional AEM content setup and doesn't match the single-block-experience requirement.

### 5. Image slider using CSS scroll-snap (no JS carousel library)

**Decision:** Thumbnail slider in the detail popup uses native CSS `scroll-snap-type: x mandatory` with indicator dots. Minimal JS for dot sync and optional swipe arrows.

**Rationale:** Avoids adding a carousel library. CSS scroll-snap is well-supported, performant, and aligns with the project's "no framework" approach. The `activities` block's RAF-driven carousel is overkill for a simple image gallery.

### 6. Sanitization with DOMPurify for description HTML

**Decision:** Experience `description` and `highlight` fields from the API may contain HTML. Sanitize with `DOMPurify` before rendering.

**Rationale:** Project convention requires DOMPurify for all external HTML. Turneo descriptions may include basic formatting.

## Risks / Trade-offs

- **API latency on initial load** → Show skeleton cards (CSS shimmer animation) while fetching. Block renders instantly with placeholders, then populates.
- **API key exposure in client-side code** → Acceptable for this PoC. Production would use a proxy/edge function. Key stored in environment config, not hardcoded.
- **Large image arrays from API** → Only load first image in card view (lazy-load others in detail popup). Use `loading="lazy"` on popup images.
- **No pagination** → If store has 100+ experiences, all render at once. Acceptable for PoC scope (most hotel stores have 10-30 experiences). Can add pagination later.
- **Popup accessibility** → Must trap focus, handle Escape key, restore focus on close, add `aria-modal` and proper roles.
