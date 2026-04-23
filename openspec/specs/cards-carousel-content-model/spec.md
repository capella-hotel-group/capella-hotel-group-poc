## Purpose

Defines the Universal Editor component model for the `cards-carousel` block: component definitions, card item model fields, and the block filter restricting children to `carousel-card` components.

---

## Requirements

### Requirement: Block and item component definitions

The component model SHALL define a `cards-carousel` block definition using `core/franklin/components/block/v1/block` resource type and a `carousel-card` item definition using `core/franklin/components/block/v1/block/item` resource type.

#### Scenario: Block appears in Universal Editor

- **WHEN** an author opens the Universal Editor section panel
- **THEN** "Cards Carousel" is available as an insertable block (after adding to section filter)

#### Scenario: Author adds a card item

- **WHEN** an author clicks Add inside a Cards Carousel block
- **THEN** a new "Card" item is added with the `carousel-card` model fields

---

### Requirement: Card item model fields

Each card item SHALL have four fields: `image` (reference, for DAM asset), `title` (text), `subtitle` (text), and `link` (aem-content or text for URL).

#### Scenario: Author fills card fields

- **WHEN** an author selects a card item in the Universal Editor
- **THEN** the properties panel shows Image (asset picker), Title (text input), Subtitle (text input), and Link (URL/content reference input)

---

### Requirement: Block filter for card items

A filter with id `cards-carousel` SHALL restrict the block's children to only `carousel-card` components.

#### Scenario: Only card items allowed

- **WHEN** an author tries to add content inside a Cards Carousel block
- **THEN** only the "Card" component type is available for insertion
