## ADDED Requirements

### Requirement: Foreground plane has a dedicated pointer strength constant

A new constant `ADVANCE_FG_POINTER_STRENGTH` SHALL be defined in `scene.ts` alongside the existing `ADVANCE_POINTER_STRENGTH`. The `updateForegroundLayer` function SHALL accept a `fgPointerStrength` parameter (replacing the previously shared `pointerStrength`). The `debugConfig` object SHALL include an optional `fgPointerStrength?: number` field that overrides `ADVANCE_FG_POINTER_STRENGTH` at runtime.

#### Scenario: Foreground pointer strength differs from decor

- **WHEN** advance mode is running and the pointer moves
- **THEN** the foreground plane's response magnitude is governed by `ADVANCE_FG_POINTER_STRENGTH`, which can be tuned independently of `ADVANCE_POINTER_STRENGTH` used by the decors

#### Scenario: Debug override for foreground pointer strength

- **WHEN** `debugConfig.fgPointerStrength` is set to a concrete value
- **THEN** that value is used in place of `ADVANCE_FG_POINTER_STRENGTH` for the current scene session

#### Scenario: Foreground default strength does not change existing decor behaviour

- **WHEN** `ADVANCE_FG_POINTER_STRENGTH` is introduced
- **THEN** `ADVANCE_POINTER_STRENGTH` value and usage for decor planes are unchanged
