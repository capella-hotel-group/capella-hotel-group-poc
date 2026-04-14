## Purpose

Defines the two-phase loading contract for the `panding-gallery` block. Phase 1 produces an accessible static image grid synchronously from the block's raw DOM. Phase 2 bootstraps the interactive scroll-motion layer on a user trigger.

---

## Requirements

### Requirement: Phase 1 renders a static accessible grid immediately on decorate

When `decorate(block)` is called, `panding-gallery` SHALL synchronously produce a fully-rendered static HTML grid from the block's raw DOM — no async imports, no Three.js — and replace the block's children with it.

Phase 1 output SHALL include:

- A `div.panding-gallery-columns` container.
- Exactly 5 `div.panding-gallery-column` children, each holding the images for that column.
- All `<picture>` / `<img>` elements from the block's rows distributed column-first.

#### Scenario: Static grid visible without JavaScript interaction

- **WHEN** `decorate` completes (synchronous return)
- **THEN** the block renders a visible image grid in the browser
- **AND** no Three.js or async modules have been requested

#### Scenario: Images distributed across 5 columns

- **WHEN** 20 image rows are present in the block
- **THEN** column 0 holds images 0, 5, 10, 15; column 1 holds 1, 6, 11, 16; etc.
- **AND** each column has exactly 4 images

### Requirement: Phase 2 activates on a user trigger and bootstraps the scroll-motion layer

Phase 2 SHALL be triggered by a user click anywhere on the block. On trigger:

1. The block SHALL add a loading modifier class (`panding-gallery--loading`).
2. The scroll-motion module SHALL be dynamically imported.
3. On successful import, the motion controller SHALL be initialised with the column elements and configuration.
4. The block SHALL replace the loading class with an active class (`panding-gallery--active`).

If the import throws, the block SHALL remove the loading class, log the error, and reset the trigger so the user can retry.

#### Scenario: Click triggers phase 2 once

- **WHEN** the user clicks the block for the first time
- **THEN** the scroll-motion module is dynamically imported
- **AND** subsequent clicks do not re-trigger the import

#### Scenario: Loading class applied during import

- **WHEN** phase 2 import is in progress
- **THEN** the block element has the class `panding-gallery--loading`

#### Scenario: Active class set on success

- **WHEN** the motion module initialises without error
- **THEN** `panding-gallery--loading` is removed
- **AND** `panding-gallery--active` is added

#### Scenario: Error during import allows retry

- **WHEN** the dynamic import rejects
- **THEN** `panding-gallery--loading` is removed
- **AND** the block does NOT have `panding-gallery--active`
- **AND** a subsequent click re-attempts the import

### Requirement: Phase 1 does not depend on Three.js or external async modules

Phase 1 SHALL NOT import or reference Three.js, the `pointer-velocity-util`, or any dynamic import. All phase 1 logic SHALL be synchronous and self-contained within `panding-gallery.ts`.

#### Scenario: Phase 1 bundle is free of Three.js

- **WHEN** the block's entry chunk is inspected
- **THEN** Three.js symbols are absent from it
- **AND** Three.js is only present in the dynamically-loaded scroll-motion module
