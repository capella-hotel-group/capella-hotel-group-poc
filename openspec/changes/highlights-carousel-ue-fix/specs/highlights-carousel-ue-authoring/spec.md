## ADDED Requirements

### Requirement: Card items visible in UE content tree

After `decorate()` runs, each Carousel Card item SHALL be traceable in the Universal Editor content tree via its `data-aue-resource` URN.

#### Scenario: Author adds a card in UE

- **WHEN** an author clicks "Add" inside the Highlights Carousel block in UE and fills in the card fields
- **THEN** the new card SHALL appear as a child item in the content tree immediately after save

#### Scenario: Author deletes a card in UE

- **WHEN** an author selects a Carousel Card in the content tree and deletes it
- **THEN** the card SHALL be removed from both the content tree and the rendered carousel

### Requirement: Card fields map correctly to rendered output

Each Carousel Card SHALL render its fields in the correct visual position: image in the image slot, title in the heading, description in the body.

#### Scenario: Card authored with all fields filled

- **WHEN** a card is authored with an image, title, and description in UE
- **THEN** the rendered card SHALL display the image in the `cc-card-image` div, the title in the `h3`, and the description text in the `p` inside `cc-card-body`

#### Scenario: Card authored with only image and title

- **WHEN** a card is authored with image and title but no description
- **THEN** the rendered card SHALL display image and title with no `hr` divider and no `p` element in the body
