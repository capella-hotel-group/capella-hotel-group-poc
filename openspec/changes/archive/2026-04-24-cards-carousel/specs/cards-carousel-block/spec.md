## ADDED Requirements

### Requirement: Horizontal card carousel display

The block SHALL render authored card items as a horizontal scrollable strip of uniformly-sized cards. Each card SHALL display an image (portrait 5:7 aspect ratio), a title, a subtitle, and link to an external URL. Cards SHALL be rendered as `<a>` elements wrapping the card content.

#### Scenario: Block with multiple cards renders horizontal strip

- **WHEN** a `cards-carousel` block contains 8 card items
- **THEN** cards are laid out in a single horizontal row inside a scrollable track, with only the first N cards visible (where N = cards-per-view based on viewport width)

#### Scenario: Card displays all authored fields

- **WHEN** a card item has image, title "Capella Bangkok", subtitle "Thailand / 101 Rooms", and link "https://capellahotels.com/en/capella-bangkok"
- **THEN** the card renders a portrait image, an `<h3>` with the title, a `<p>` with the subtitle, and the entire card is wrapped in an `<a>` pointing to the link URL

### Requirement: Drag-to-scroll with snap-on-release

The carousel SHALL support pointer drag to scroll the track horizontally. On pointer release, the track SHALL animate (tween) to the nearest snap position aligned to a card edge.

#### Scenario: User drags cards to the left and releases

- **WHEN** user drags the track 200px to the left and releases
- **THEN** the track animates to the nearest valid snap position (aligned to a card boundary)

#### Scenario: Small drag snaps back

- **WHEN** user drags 10px and releases
- **THEN** the track snaps to the nearest position (which may be the original position if closer)

#### Scenario: Drag does not trigger card link navigation

- **WHEN** user drags across a card and releases
- **THEN** the card's link navigation is NOT triggered

#### Scenario: Click without drag navigates

- **WHEN** user clicks a card without dragging
- **THEN** the card's link opens as normal

### Requirement: Prev/next arrow navigation

The carousel SHALL display prev and next arrow buttons. Clicking prev SHALL scroll the track one card to the left. Clicking next SHALL scroll one card to the right. Transitions SHALL be animated with cubic-out easing.

#### Scenario: Click next arrow

- **WHEN** user clicks the next arrow and the track is not at the last position
- **THEN** the track animates one card width to the left, revealing the next card

#### Scenario: Click prev arrow

- **WHEN** user clicks the prev arrow and the track is not at the first position
- **THEN** the track animates one card width to the right, revealing the previous card

### Requirement: Edge clamping — no infinite loop

The carousel SHALL NOT loop. When the track is at the first position, the prev arrow SHALL be disabled. When the track is at the last valid position (last card visible), the next arrow SHALL be disabled.

#### Scenario: At first position

- **WHEN** the carousel is at position 0
- **THEN** the prev arrow has `disabled` attribute and reduced visual opacity

#### Scenario: At last position

- **WHEN** the carousel is at the last valid position (vIdx = N - cardsPerView)
- **THEN** the next arrow has `disabled` attribute and reduced visual opacity

#### Scenario: All cards fit in viewport

- **WHEN** the number of cards is less than or equal to cards-per-view
- **THEN** both arrows are hidden and drag scrolling is disabled

### Requirement: Responsive cards-per-view

Card width SHALL remain fixed (~300px). The number of visible cards SHALL adjust based on the viewport width. A ResizeObserver SHALL recalculate cards-per-view on viewport width changes and reinitialize the track position without animation.

#### Scenario: Viewport shrinks

- **WHEN** the viewport width decreases from 1200px to 800px
- **THEN** fewer cards are visible per view, and the track repositions instantly (no animation) to maintain the current card in view

#### Scenario: Viewport expands

- **WHEN** the viewport width increases
- **THEN** more cards become visible, vIdx is clamped to the new maximum, and the track repositions instantly

### Requirement: Floating "Drag" cursor label

The carousel SHALL display a custom floating label with text "Drag" that follows the pointer when hovering over the card track area. The label SHALL hide when the pointer leaves the track.

#### Scenario: Pointer enters track area

- **WHEN** the pointer enters the carousel track
- **THEN** a floating "Drag" label appears near the pointer position

#### Scenario: Pointer moves within track

- **WHEN** the pointer moves within the carousel track
- **THEN** the "Drag" label follows the pointer with smooth interpolation

#### Scenario: Pointer leaves track

- **WHEN** the pointer leaves the carousel track
- **THEN** the "Drag" label fades out or hides
