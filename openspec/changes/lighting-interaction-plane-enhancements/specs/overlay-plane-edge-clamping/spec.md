## ADDED Requirements

### Requirement: Overlay plane border vertices are pinned to zero displacement
Each advance-mode overlay plane (decor-left, decor-right, foreground, headline) SHALL compute a `borderMask` Float32Array at load time. Vertices whose rest position lies on the geometric boundary of the plane (the outermost X or Y coordinate in the PlaneGeometry) SHALL have `borderMask[i] = 0`. All interior vertices SHALL have `borderMask[i] = 1`. All displacement values SHALL be multiplied by `borderMask[i]` before being applied to `posAttr`, so border vertices never leave their rest position.

#### Scenario: Border vertex does not move during animation
- **WHEN** the advance animation loop runs and pointer velocity is non-zero
- **THEN** vertices on the outer edge of any overlay plane remain at their rest position

#### Scenario: Interior vertex displaces normally
- **WHEN** the advance animation loop runs
- **THEN** interior vertices (those not on the outer boundary) displace according to their sin-wave and pointer functions as before

#### Scenario: Border remains flush with viewport edge
- **WHEN** the plane is resized via ResizeObserver
- **THEN** the border vertices remain at rest position (no displacement accumulated across resize events)
