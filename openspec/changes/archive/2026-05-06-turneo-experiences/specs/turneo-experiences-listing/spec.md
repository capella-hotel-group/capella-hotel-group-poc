## ADDED Requirements

### Requirement: Block fetches experiences from Turneo API on load

The `turneo-experiences` block SHALL fetch experiences from the Turneo API `GET /experiences` endpoint when `decorate()` is called. The block SHALL use the `storeId` configured in the AEM content model to filter results. The block SHALL include `x-api-key` and `Accept: application/json` headers in all API requests.

#### Scenario: Successful fetch with storeId

- **WHEN** the block loads with a configured `storeId` value
- **THEN** the block fetches `GET /experiences?storeId={storeId}` from the Turneo API and renders the results

#### Scenario: Fetch with no storeId (all experiences)

- **WHEN** the block loads without a `storeId` value
- **THEN** the block fetches `GET /experiences` without storeId filter and renders all active experiences

#### Scenario: API request failure

- **WHEN** the API request fails (network error or non-2xx response)
- **THEN** the block SHALL display an error state message and not crash

### Requirement: Block displays loading skeleton during fetch

The block SHALL render a skeleton loading state immediately on `decorate()` call before API data is available. The skeleton SHALL match the card grid layout dimensions to prevent layout shift.

#### Scenario: Loading state visible during fetch

- **WHEN** the block initializes and the API call is in progress
- **THEN** the block displays animated skeleton placeholder cards in the grid layout

#### Scenario: Skeleton replaced by real content

- **WHEN** the API response is received successfully
- **THEN** the skeleton cards are replaced with actual experience cards

### Requirement: Experiences render as responsive card grid

The block SHALL render experiences as a CSS Grid card layout. Cards SHALL display: the first image from the experience `images` array as thumbnail, the `name` as title/headline, the `highlight` or `description` as description text (truncated), and a "Book" CTA button.

#### Scenario: Card grid renders with correct content

- **WHEN** the API returns a list of experiences
- **THEN** each experience renders as a card showing thumbnail image, name, description, and a Book CTA button

#### Scenario: Responsive grid columns

- **WHEN** viewport width is below 600px
- **THEN** the grid displays 1 column

#### Scenario: Responsive grid columns tablet

- **WHEN** viewport width is between 600px and 899px
- **THEN** the grid displays 2 columns

#### Scenario: Responsive grid columns desktop

- **WHEN** viewport width is 900px or above
- **THEN** the grid displays 3 columns

### Requirement: Card images use lazy loading

The block SHALL render card thumbnail images with `loading="lazy"` attribute. Images SHALL use `object-fit: cover` and maintain a consistent aspect ratio.

#### Scenario: Images lazy loaded

- **WHEN** experience cards are rendered
- **THEN** each card image has `loading="lazy"` attribute and displays with cover fit at a fixed aspect ratio

### Requirement: CTA click logs experience data to console

When a user clicks the "Book" CTA on a card, the block SHALL `console.log` the full experience object for that item.

#### Scenario: Console log on CTA click

- **WHEN** user clicks the "Book" button on an experience card
- **THEN** the full experience data object is logged to the browser console

### Requirement: Description text is sanitized before rendering

The block SHALL sanitize all HTML content from the API response (description, highlight) using DOMPurify before inserting into the DOM.

#### Scenario: HTML in description is sanitized

- **WHEN** an experience description contains HTML markup
- **THEN** the content is sanitized with DOMPurify before being rendered in the card
