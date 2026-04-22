## MODIFIED Requirements

### Requirement: Block renders full-viewport background video

The block SHALL render a `<video>` element that fills the full viewport (`100vw × 100vh`) with `object-fit: cover`. The video SHALL autoplay, be muted, loop continuously, and include `playsinline` for mobile compatibility. The video source SHALL be read from the authored `video` reference field (row 0, `<a>` element).

#### Scenario: Background video autoplays on page load

- **WHEN** the page loads and the masthead-sticky block is in the DOM
- **THEN** a muted, looping video fills the entire viewport and begins playing automatically

#### Scenario: Block reads video URL from reference field

- **WHEN** the authored content contains a reference link in row 0
- **THEN** the block uses the `href` of that `<a>` element as the video source, resolved via `resolveDAMUrl`

---

### Requirement: Block model uses reference components for asset fields

The `masthead-sticky` AEM component model SHALL define three fields:

1. `video` — `component: "reference"`, `valueType: "string"`, label "Video"
2. `image` — `component: "reference"`, `valueType: "string"`, label "Placeholder Image"
3. `content` — `component: "richtext"`, `valueType: "string"`, label "Content"

#### Scenario: Author picks video via asset picker

- **WHEN** an author opens the Universal Editor and selects the video field
- **THEN** the DAM asset picker SHALL be displayed for video selection

#### Scenario: Author picks placeholder image via asset picker

- **WHEN** an author opens the Universal Editor and selects the image field
- **THEN** the DAM asset picker SHALL be displayed for image selection

#### Scenario: Author enters richtext content

- **WHEN** an author opens the Universal Editor and edits the content field
- **THEN** a richtext editor SHALL be displayed for text input

---

## ADDED Requirements

### Requirement: Placeholder image overlays video and fades out when video loads

The block SHALL render a placeholder image from the authored `image` reference field (row 1, `<picture>` element). The image SHALL be positioned absolutely to cover the full block area (`position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover`) and rendered above the video.

When the background video's `loadeddata` event fires, the placeholder image SHALL fade out via a CSS opacity transition and be removed from the DOM after the transition completes.

If no image is authored, the placeholder SHALL not be rendered.

#### Scenario: Placeholder visible while video loads

- **WHEN** the block renders and the video has not yet loaded its first frame
- **THEN** the placeholder image SHALL be visible, covering the entire block area

#### Scenario: Placeholder fades out after video loads

- **WHEN** the video's `loadeddata` event fires
- **THEN** the placeholder image SHALL fade out with a CSS opacity transition
- **AND** the image element SHALL be removed from the DOM after the transition ends

#### Scenario: No image authored

- **WHEN** the authored content does not contain an image in row 1
- **THEN** no placeholder image SHALL be rendered

---

### Requirement: Richtext content is displayed as centered overlay above masthead

The block SHALL render authored richtext content (row 2) inside a `<div class="masthead-content">` element positioned absolutely within the block. The content SHALL be styled with:

- `position: absolute`
- `bottom: 110px`
- `width: 100%`
- `padding-left: 20px; padding-right: 20px`
- `text-align: center`
- `font-size: 1.625rem`
- `font-family: "Goudy Regular", Times, "Times New Roman", serif`
- `line-height: 1.2em`
- `color: #fff` (white text over video/image)

The content SHALL render above both the video and the placeholder image (higher z-index within the block).

If no content is authored, the content overlay SHALL not be rendered.

#### Scenario: Content visible over video

- **WHEN** the block renders with authored richtext content
- **THEN** the content SHALL be visible centered at 110px from the bottom, with white serif text

#### Scenario: Content renders above placeholder image

- **WHEN** both placeholder image and content are present
- **THEN** the content text SHALL render visually above the placeholder image

#### Scenario: No content authored

- **WHEN** the authored content does not contain richtext in row 2
- **THEN** no content overlay SHALL be rendered
