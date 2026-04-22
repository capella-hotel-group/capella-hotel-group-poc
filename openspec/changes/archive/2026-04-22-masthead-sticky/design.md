## Context

AEM EDS pages use a `<header>` element with `position: sticky; top: 0; z-index: 100`. The masthead-sticky block must:

- Appear **above** the header visually (full viewport, renders before the header in the DOM scroll context)
- Let page content **scroll over** it (the masthead is consumed by scroll — not fixed)
- Allow the header to become sticky once the masthead has scrolled off

This is the standard "sticky masthead under sticky header" pattern: the masthead is `position: sticky; top: 0` with a lower z-index than the header, so the header stacks on top when both are in the sticky zone simultaneously.

## Goals / Non-Goals

**Goals:**

- Full-viewport (`100vw × 100vh`) background video: `autoplay`, `muted`, `loop`, `playsinline`, `object-fit: cover`
- Single authored field: video URL (aem-content link)
- "WATCH VIDEO" CTA — bottom-right, white, uppercase, underlined — opens fullscreen modal
- Modal: fullscreen overlay (`position: fixed; inset: 0; z-index: 200`), video with native `controls`, ✕ close button top-right
- Closing modal: pause + reset modal video; resume background video autoplay
- Sticky stacking: masthead `z-index: 50` (below header's 100), content scrolls over both

**Non-Goals:**

- Authored CTA label (always "WATCH VIDEO")
- Mobile-specific video fallback / poster image
- Multiple videos or carousel
- Captions or transcript support

## Decisions

### 1. Stacking order: masthead below header

**Decision**: `masthead-sticky { position: sticky; top: 0; z-index: 50 }`. Header keeps `z-index: 100`.

**Rationale**: When the user scrolls, the page content flows over the masthead first (z-index 50 → 0 in normal flow), then the header "catches" at the top (z-index 100 sits above everything). This creates the natural luxury editorial effect where content rises over the cinematic intro.

**Alternative considered**: `position: fixed` for masthead. Rejected — fixed elements don't scroll away, breaking the intended "content rises over masthead" behavior.

---

### 2. Modal implementation: `position: fixed` overlay

**Decision**: Modal is a `<div class="masthead-modal">` appended to `document.body` at decorate time, toggled via `.is-open` class. Uses `position: fixed; inset: 0; z-index: 200`.

**Rationale**: Appending to `body` avoids stacking context issues with the sticky masthead and sticky header. z-index 200 places it above all other page elements. Same pattern as the header lang dropdown.

**Alternative considered**: `<dialog>` element. Rejected — `<dialog>` has inconsistent backdrop z-index behavior across browsers and complicates the close/resume video lifecycle.

---

### 3. Video source: authored aem-content link

**Decision**: The block reads a single `<a>` from the authored row. `a.href` is the video URL passed to `<video src>`.

**Rationale**: Matches the project's existing aem-content field pattern (same as CTA links in header). No separate DAM resolver needed for direct video URLs.

---

### 4. Background video vs. modal video: two separate `<video>` elements

**Decision**: Two `<video>` elements sharing the same `src`. Background video: `autoplay muted loop playsinline`. Modal video: no autoplay, has `controls`.

**Rationale**: Simplest lifecycle management — pause one, play the other. No need to move a single video element between DOM positions (which causes a reload).

---

### 5. Block structure

```
.masthead-sticky          ← position: sticky; top: 0; height: 100vh; z-index: 50
  .masthead-bg-video      ← <video> autoplay muted loop; position: absolute; inset: 0; object-fit: cover
  .masthead-cta           ← position: absolute; bottom/right; "WATCH VIDEO"

.masthead-modal           ← appended to body; position: fixed; inset: 0; z-index: 200; hidden by default
  .masthead-modal-video   ← <video> with controls; width: 100%; height: 100%
  .masthead-modal-close   ← ✕ button; position: absolute; top/right
```

## Risks / Trade-offs

- **Autoplay policy**: Browsers block autoplay unless muted. Background video is muted — safe. Modal video is unmuted — will only autoplay if user gesture triggered it (click on CTA satisfies this). → No mitigation needed; modal only opens on click.
- **Mobile viewport height**: `100vh` can be unstable on mobile (address bar resize). → Use `100dvh` as a progressive enhancement with `100vh` fallback.
- **Two video elements, same src**: Minor extra memory. → Acceptable for a single masthead block per page.
- **z-index 50 conflicts**: Other blocks using z-index > 50 may render over the masthead. → Document z-index convention: masthead = 50, header = 100, modal = 200.
