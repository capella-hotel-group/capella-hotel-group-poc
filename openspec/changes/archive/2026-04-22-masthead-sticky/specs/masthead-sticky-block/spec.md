## ADDED Requirements

### Requirement: Block renders full-viewport background video

The block SHALL render a `<video>` element that fills the full viewport (`100vw × 100vh`) with `object-fit: cover`. The video SHALL autoplay, be muted, loop continuously, and include `playsinline` for mobile compatibility. The video source SHALL be read from the single authored video field.

#### Scenario: Background video autoplays on page load

- **WHEN** the page loads and the masthead-sticky block is in the DOM
- **THEN** a muted, looping video fills the entire viewport and begins playing automatically

#### Scenario: Block reads video URL from authored field

- **WHEN** the authored content contains a link in the first row
- **THEN** the block uses the `href` of that link as the `<video src>`

---

### Requirement: Block is sticky and positioned below the header

The block SHALL use `position: sticky; top: 0` with `z-index: 50` (below the header's z-index of 100) and a height of `100vh`. As the user scrolls, page content SHALL scroll over the block. Once the block is fully scrolled past, the header SHALL become the sticky element at the top.

#### Scenario: Content scrolls over masthead

- **WHEN** the user scrolls down the page
- **THEN** the content sections rise over the masthead block visually (masthead remains in its sticky position until scrolled past)

#### Scenario: Header becomes sticky after masthead scrolls away

- **WHEN** the masthead has been fully scrolled out of view
- **THEN** the header is the topmost visible sticky element at `top: 0`

---

### Requirement: Watch Video CTA is visible in the lower-right corner

The block SHALL display a "WATCH VIDEO" CTA as an anchor or button element, positioned absolutely at the lower-right of the block. The CTA text SHALL be white, uppercase, and underlined. No other label is used.

#### Scenario: CTA is always visible over background video

- **WHEN** the masthead block is visible in the viewport
- **THEN** the "WATCH VIDEO" CTA is visible in the bottom-right corner with white text, uppercase, and underline

---

### Requirement: Clicking Watch Video CTA opens fullscreen modal

The block SHALL open a fullscreen overlay modal when the CTA is clicked. The modal SHALL contain a `<video>` element with native `controls` and the same video source. The modal SHALL cover the entire viewport (`position: fixed; inset: 0; z-index: 200`).

#### Scenario: Modal opens on CTA click

- **WHEN** the user clicks the "WATCH VIDEO" CTA
- **THEN** a fullscreen modal overlay becomes visible with the video ready to play (with controls)

#### Scenario: Modal video is distinct from background video

- **WHEN** the modal opens
- **THEN** the background video continues playing in the masthead while the modal video starts from the beginning (or paused state)

---

### Requirement: Modal has a close button that stops modal video

The modal SHALL display an ✕ close button in the upper-right corner. Clicking the close button SHALL hide the modal, pause and reset the modal video, and leave the background video unaffected.

#### Scenario: Close button hides modal

- **WHEN** the user clicks the ✕ button
- **THEN** the modal is hidden and is no longer visible

#### Scenario: Modal video pauses on close

- **WHEN** the user closes the modal
- **THEN** the modal video is paused and its current time is reset to 0

#### Scenario: Background video unaffected by modal close

- **WHEN** the user closes the modal
- **THEN** the background video in the masthead continues playing (or remains in its current autoplay state)
