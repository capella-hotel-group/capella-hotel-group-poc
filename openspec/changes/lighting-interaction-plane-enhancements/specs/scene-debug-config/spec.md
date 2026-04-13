## MODIFIED Requirements

### Requirement: Debug config file exports typed overrides
A file `src/blocks/lighting-interaction/debug-config.ts` SHALL export a single `const debugConfig` object. Every field in the object SHALL be typed as `T | undefined`. When a field is `undefined`, the runtime SHALL ignore it and fall back to the CMS value or hardcoded constant. When a field is set to a concrete value, the runtime SHALL use that value instead. The object SHALL include a `fgPointerStrength?: number` field that overrides `ADVANCE_FG_POINTER_STRENGTH` when set.

#### Scenario: All fields undefined — no behaviour change
- **WHEN** every field in `debugConfig` is `undefined`
- **THEN** the block behaves identically to a build with no debug-config file at all

#### Scenario: advance override set to true
- **WHEN** `debugConfig.advance` is set to `true`
- **THEN** the block activates advance mode regardless of what the CMS `advance` row contains

#### Scenario: advance override set to false
- **WHEN** `debugConfig.advance` is set to `false`
- **THEN** the block runs in standard mode regardless of what the CMS `advance` row contains

#### Scenario: fgPointerStrength override active
- **WHEN** `debugConfig.fgPointerStrength` is set to a number
- **THEN** that value is used as the foreground pointer strength instead of `ADVANCE_FG_POINTER_STRENGTH`
