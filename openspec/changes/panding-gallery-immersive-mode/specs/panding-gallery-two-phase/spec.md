## MODIFIED Requirements

### Requirement: Phase 2 activates on a user trigger and bootstraps the scroll-motion layer

Phase 2 SHALL be triggered by a user click anywhere on the block. On trigger:

1. The block SHALL add a loading modifier class (`panding-gallery--loading`).
2. The scroll-motion module SHALL be dynamically imported.
3. On successful import, the motion controller SHALL be initialised with the column elements and configuration.
4. **If `immersiveMode` is `true`:**
   a. The `immersive-scene` module SHALL be dynamically imported.
   b. The immersive scene SHALL be initialised, receiving the `ScrollMotionController` instance, the block element, `deformRadius`, and `deformStrength` configuration values.
   c. On successful immersive init, the DOM columns container SHALL have `visibility: hidden` applied.
5. The block SHALL replace the loading class with an active class (`panding-gallery--active`).

If either the scroll-motion import or the immersive scene import throws, the block SHALL remove the loading class, restore `visibility: ''` on the columns container (if modified), log the error, and reset the trigger so the user can retry.

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

#### Scenario: Immersive scene initialised when flag is true

- **WHEN** `immersiveMode = true` and Phase 2 completes successfully
- **THEN** the immersive scene module SHALL be imported and initialised with the `ScrollMotionController` reference
- **AND** the DOM columns container SHALL have `visibility: hidden`

#### Scenario: Immersive scene NOT initialised when flag is false

- **WHEN** `immersiveMode = false` and Phase 2 completes successfully
- **THEN** no dynamic import for `./immersive-scene` SHALL be issued
- **AND** the DOM columns container SHALL NOT have `visibility: hidden` applied

#### Scenario: Immersive init error restores DOM

- **WHEN** the immersive scene module import or initialisation throws
- **THEN** `panding-gallery--loading` is removed
- **AND** the columns container `visibility` is reset to `''`
- **AND** the block does NOT have `panding-gallery--active`
- **AND** a subsequent click re-attempts both imports
