## ADDED Requirements

### Requirement: Three-zone sticky header layout

The header block SHALL render as a full-width, fixed-height (~70px) bar with `position: sticky; top: 0`, using a three-zone horizontal layout: left (language selector), center (brand navigation), and right (CTA button). The background SHALL be white with a subtle bottom box-shadow. The header SHALL not shrink or change appearance on scroll.

#### Scenario: Header sticks to top on scroll

- **WHEN** the user scrolls the page down
- **THEN** the header remains visible at the top of the viewport at all times

#### Scenario: Header height remains constant

- **WHEN** the page is scrolled to any position
- **THEN** the header height remains ~70px and does not animate or shrink

#### Scenario: Header spans full viewport width

- **WHEN** the header is rendered on any desktop viewport
- **THEN** it occupies the full width with a white background and a subtle bottom shadow/divider

---

### Requirement: Language selector dropdown

The left zone SHALL contain an uppercase text trigger (e.g. "ENGLISH ▾") with wide letter-spacing. On click, a dropdown SHALL appear with white background, soft box-shadow, and the following text-only items: ENGLISH, 简体中文, 日本語. The dropdown SHALL animate in with a CSS fade-in/slide-down transition. No flag icons SHALL be displayed. Pressing Escape or clicking outside SHALL close the dropdown.

#### Scenario: Dropdown opens on trigger click

- **WHEN** the user clicks the language selector trigger
- **THEN** the dropdown list becomes visible with a fade-in animation

#### Scenario: Dropdown closes on Escape key

- **WHEN** the dropdown is open and the user presses the Escape key
- **THEN** the dropdown closes and focus returns to the trigger button

#### Scenario: Dropdown closes on outside click

- **WHEN** the dropdown is open and the user clicks anywhere outside the dropdown
- **THEN** the dropdown closes

#### Scenario: Dropdown contains correct language options

- **WHEN** the dropdown is open
- **THEN** it shows exactly three text-only items: ENGLISH, 简体中文, 日本語 with no icons

---

### Requirement: Center brand navigation with emblem

The center zone SHALL contain exactly two navigation text links in uppercase (DESTINATIONS and EXPERIENCES) flanking a small monochrome brand emblem image. Typography SHALL use a refined serif or elegant sans-serif with generous horizontal spacing. The emblem SHALL be rendered from an authored icon/image asset.

#### Scenario: Center nav links render correctly

- **WHEN** the header is rendered
- **THEN** "DESTINATIONS" appears to the left of the emblem and "EXPERIENCES" appears to the right, all in uppercase

#### Scenario: Emblem renders from authored image

- **WHEN** the header block has an emblem image field set in the Universal Editor
- **THEN** a small monochrome image/icon appears centered between the two nav links

#### Scenario: Emblem missing gracefully handled

- **WHEN** no emblem image is authored
- **THEN** the center zone still renders the two nav links without layout breakage

---

### Requirement: Book Your Stay CTA button

The right zone SHALL contain a rectangular button labelled "BOOK YOUR STAY" (or as authored) in white uppercase text with wide letter-spacing. The button background SHALL be a warm muted gray/taupe color. The button SHALL have no border-radius. On hover, the background SHALL darken slightly. The button SHALL link to an authored URL.

#### Scenario: CTA button renders with correct style

- **WHEN** the header is rendered
- **THEN** the CTA button appears with a taupe/warm-gray background, white uppercase text, no border-radius, and wide letter-spacing

#### Scenario: CTA button hover state activates

- **WHEN** the user hovers over the CTA button
- **THEN** the background color darkens slightly with no transition animation beyond a simple color change

#### Scenario: CTA button links to authored URL

- **WHEN** the user clicks the CTA button
- **THEN** the browser navigates to the URL set in the block's content model

---

### Requirement: CSS design token compliance

All header styles SHALL use CSS custom properties defined in `src/styles/styles.css`. No hardcoded hex values, pixel sizes belonging to the design system, or inline styles SHALL appear in the block CSS file.

#### Scenario: No hardcoded color values

- **WHEN** the header CSS is linted or reviewed
- **THEN** all color values reference `var(--token-name)` CSS custom properties, not raw hex or RGB literals

#### Scenario: Spacing uses tokens

- **WHEN** the header CSS is linted or reviewed
- **THEN** margin, padding, and gap values that belong to the design system reference CSS tokens
