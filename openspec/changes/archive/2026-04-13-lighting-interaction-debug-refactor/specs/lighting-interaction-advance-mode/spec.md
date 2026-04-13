## MODIFIED Requirements

### Requirement: Block supports an advance mode flag
The block SHALL read a boolean `advance` field from the authored CMS content. The AEM Universal Editor field for `advance` SHALL use `"component": "boolean"` (renders as a toggle). When the field is absent or `false`, the block SHALL behave identically to the existing non-advance implementation. When `true`, the block SHALL activate the advance animation layer system. The `debug-config.ts` advance override SHALL take precedence over the CMS value when it is not `undefined`.

#### Scenario: Flag absent — existing behaviour preserved
- **WHEN** the block is rendered on a page where no `advance` field has been authored
- **THEN** the block functions exactly as the non-advance version: single background plane with pointer-driven vertex displacement, no overlay planes loaded

#### Scenario: Flag present and true — advance mode activated
- **WHEN** the block is rendered with `advance` set to `true` in the authored CMS content
- **THEN** `initScene()` is called with `config.advance === true`
- **AND** the background plane is created with minimal geometry (4×4 segments)
- **AND** no vertex displacement is applied to the background plane

#### Scenario: Debug config overrides CMS advance flag
- **WHEN** `debugConfig.advance` is set to `true` in `debug-config.ts`
- **THEN** advance mode is active regardless of the CMS row value

#### Scenario: Universal Editor shows advance toggle
- **WHEN** an author opens the block properties panel in Universal Editor
- **THEN** a boolean toggle labelled "Advance Mode" is visible and togglable
