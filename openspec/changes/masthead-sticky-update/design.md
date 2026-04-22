## Context

The `masthead-sticky` block currently has a single `video` field using `aem-content` component. The block renders a fullscreen sticky video with a "WATCH VIDEO" CTA and modal. The DOM structure from AEM delivers one row per field, each in a `<div>` cell.

Current model fields: `video` (aem-content → renders as `<a>` link in DOM).

The block at `src/blocks/video-photo-player` already uses `reference` component for video/image fields — this is the established pattern for asset picker fields.

## Goals / Non-Goals

**Goals:**

- Add placeholder image that covers the video area until video loads
- Add richtext content overlay with specific typography
- Switch to `reference` component for asset fields

**Non-Goals:**

- Changing the scroll-snap behavior (separate change)
- Changing the modal or CTA functionality
- Adding mobile-specific content variants

## Decisions

### 1. DOM row reading order: video (row 0), image (row 1), content (row 2)

**Choice:** Read fields from DOM rows in the order they appear in the model JSON. Row 0 = video `<a>`, Row 1 = image `<picture>`, Row 2 = content richtext `<p>` elements.

**Rationale:** AEM EDS renders model fields as sequential rows in the block DOM. The `reference` component for images renders as `<picture>` elements; for video it renders as `<a>` links. Richtext renders as `<p>` tags (AEM's `wrapTextNodes` pre-wraps loose text).

### 2. Placeholder image: `<img>` overlay with CSS fade-out transition

**Choice:** Create an `<img>` element positioned absolute over the video. Listen for `loadeddata` event on the `<video>` element, then add a class that triggers CSS `opacity` transition to fade out. Remove the image element after transition ends.

**Rationale:** `loadeddata` fires when the first frame is available — the video is ready to display. CSS transition for fade-out is smoother than JS animation and simpler to implement.

### 3. Content overlay: render authored richtext as-is inside a positioned container

**Choice:** Create a `<div class="masthead-content">` and move the authored `<p>` elements into it. Position absolutely at `bottom: 110px`, full width, center-aligned, with the specified font styles.

**Rationale:** Preserving the authored `<p>` elements maintains AEM instrumentation for UE editing. Using `moveInstrumentation` isn't needed since we're moving the original elements, not creating new ones.

### 4. Video field: switch from `aem-content` to `reference` component

**Choice:** Change the `video` field's `component` from `aem-content` to `reference`. This changes the DOM output from a plain `<a>` tag to AEM's reference rendering (still an `<a>` tag for non-image assets).

**Rationale:** Consistency with `video-photo-player` block and other blocks that use asset picker. The `reference` component provides the DAM asset picker in Universal Editor.

## Risks / Trade-offs

**[Risk] Existing authored content may break** → The `video` field component change from `aem-content` to `reference` may require re-authoring the video field in existing pages. This is acceptable for a PoC.

**[Risk] `loadeddata` may not fire if video fails to load** → The placeholder image stays visible indefinitely, which is acceptable fallback behavior (user sees the image instead of a blank screen).

**[Trade-off] Richtext content has no max-width constraint** → The spec says full width with `padding-left/right: 20px`. On ultra-wide screens the text may look stretched, but this matches the provided design spec.
