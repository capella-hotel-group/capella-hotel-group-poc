/**
 * Local debug overrides for the lighting-interaction block.
 *
 * Set any field to a concrete value to override the CMS or hardcoded defaults.
 * Leave as `undefined` (the default) to use the authored/production value.
 *
 * IMPORTANT: Reset all fields to `undefined` before committing.
 */
export const debugConfig: {
  // --- Scene mode ---
  /** Override the CMS advance flag. `true` forces advance mode; `false` forces standard mode. */
  advance?: boolean;

  // --- Layer visibility (advance mode) ---
  showDecorLeft?: boolean;
  showDecorRight?: boolean;
  showForeground?: boolean;

  // --- Wireframe (advance mode) ---
  wireframeDecorLeft?: boolean;
  wireframeDecorRight?: boolean;
  wireframeForeground?: boolean;

  // --- Velocity debug overlay ---
  /** Draw a line from the pointer position in the direction of the velocity vector. */
  showVelocityVector?: boolean;
  /** Pixel length of the velocity vector line per unit of smoothDelta magnitude (default 200). */
  velocityVectorScale?: number;

  // --- Velocity decay ---
  /** Exponential decay rate per frame (0–1). Higher = faster fade. Default 0.05. */
  velocityDecayRate?: number;
  /** Snap smoothDelta to zero once magnitude falls below this threshold. Default 0.0001. */
  velocityDecayThreshold?: number;
} = {
  advance: undefined,
  showDecorLeft: undefined,
  showDecorRight: undefined,
  showForeground: undefined,
  wireframeDecorLeft: undefined,
  wireframeDecorRight: undefined,
  wireframeForeground: undefined,
  showVelocityVector: undefined,
  velocityVectorScale: undefined,
  velocityDecayRate: undefined,
  velocityDecayThreshold: undefined,
};
