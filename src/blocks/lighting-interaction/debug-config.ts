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

  // --- Foreground pointer strength ---
  /** Override ADVANCE_FG_POINTER_STRENGTH for the foreground plane. Default 0.03. */
  fgPointerStrength?: number;

  // --- Decor pointer influence radius ---
  /** Gaussian radius (local units, 0.0–2.0) controlling how far from the pointer decor vertices react. Default 0.8. */
  decorPointerInfluenceRadius?: number;

  // --- Headline plane ---
  /** Enable the canvas-texture headline plane in advance mode (hides DOM text). Default false. */
  headlineInteraction?: boolean;
} = {
  advance: true,
  showDecorLeft: true,
  showDecorRight: true,
  showForeground: true,
  wireframeDecorLeft: undefined,
  wireframeDecorRight: undefined,
  wireframeForeground: undefined,
  showVelocityVector: undefined,
  velocityVectorScale: undefined,
  velocityDecayRate: undefined,
  velocityDecayThreshold: undefined,
  fgPointerStrength: undefined,
  decorPointerInfluenceRadius: undefined,
  headlineInteraction: true,
};
