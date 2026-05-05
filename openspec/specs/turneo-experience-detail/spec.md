## ADDED Requirements

### Requirement: Fullscreen detail popup opens on CTA click

When the user clicks the "Book" CTA on an experience card, the block SHALL open a fullscreen popup overlay (`position: fixed; inset: 0`) displaying the full experience details. The popup SHALL be appended to `document.body`.

#### Scenario: Popup opens on CTA click

- **WHEN** user clicks the "Book" button on an experience card
- **THEN** a fullscreen overlay appears covering the entire viewport with the experience details

#### Scenario: Body scroll is locked while popup is open

- **WHEN** the popup is open
- **THEN** the document body scroll is disabled (e.g., `overflow: hidden` on body)

### Requirement: Popup displays image slider with all experience images

The detail popup SHALL include an image slider showing all images from the experience's `images` array. The slider SHALL use CSS scroll-snap for smooth swiping. Navigation dots SHALL indicate the current slide position.

#### Scenario: All images shown in slider

- **WHEN** the popup opens for an experience with multiple images
- **THEN** all images are rendered in a horizontal scroll-snap slider with navigation dots

#### Scenario: Single image experience

- **WHEN** the experience has only one image
- **THEN** the slider shows the single image without navigation dots

#### Scenario: Dot navigation reflects current slide

- **WHEN** the user scrolls/swipes to a different image in the slider
- **THEN** the corresponding navigation dot is highlighted as active

### Requirement: Popup displays complete experience information

The detail popup SHALL render all available experience information in a structured product-detail layout including: name (title), full description, highlight, location (city, country, address), duration, categories/themes, included items, excluded items, organizer details, languages, and minimum price.

#### Scenario: Full experience info displayed

- **WHEN** the popup opens for an experience
- **THEN** the popup shows the experience name as heading, full description, location info, categories, included/excluded lists, duration, organizer name, languages, and minimum price (if available)

#### Scenario: Missing optional fields handled gracefully

- **WHEN** an experience is missing optional fields (e.g., no minPrice, no duration)
- **THEN** those sections are simply not rendered (no empty labels or "N/A" placeholders)

### Requirement: Popup layout resembles e-commerce product detail

The popup detail layout SHALL follow an e-commerce product detail structure: image slider occupying the top/left portion, product info (title, price, description) on the right/below, and supplementary details (included, excluded, location) in structured sections below.

#### Scenario: Desktop layout

- **WHEN** viewport width is 900px or above
- **THEN** the popup displays a two-column layout with image slider on the left and product info on the right

#### Scenario: Mobile layout

- **WHEN** viewport width is below 900px
- **THEN** the popup displays a single-column layout with image slider on top and product info below

### Requirement: Popup can be closed via close button

The popup SHALL include a visible close button (X icon) in the top-right corner. Clicking the close button SHALL remove the popup from the DOM and restore body scroll.

#### Scenario: Close button dismisses popup

- **WHEN** user clicks the close button
- **THEN** the popup is removed from the DOM and body scroll is restored

### Requirement: Popup can be closed via Escape key

The popup SHALL close when the user presses the Escape key.

#### Scenario: Escape key dismisses popup

- **WHEN** the popup is open and user presses Escape
- **THEN** the popup is removed from the DOM and body scroll is restored

### Requirement: Popup is accessible

The popup SHALL have `role="dialog"`, `aria-modal="true"`, and an `aria-label` referencing the experience name. Focus SHALL be trapped within the popup while open. On close, focus SHALL return to the CTA that opened it.

#### Scenario: Focus trapped in popup

- **WHEN** the popup is open and user presses Tab
- **THEN** focus cycles only through focusable elements within the popup

#### Scenario: Focus restored on close

- **WHEN** the popup is closed
- **THEN** focus returns to the "Book" button that triggered the popup

### Requirement: Popup content is sanitized

All text content rendered in the popup from the API response SHALL be sanitized with DOMPurify before DOM insertion.

#### Scenario: Popup description sanitized

- **WHEN** the popup renders experience description and other text fields
- **THEN** all content is sanitized through DOMPurify before being inserted into the DOM
