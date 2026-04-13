import type { BufferAttribute } from 'three';

// ---- Advance mode: decoration layer update ----

export interface UpdateDecorLayerParams {
  posAttr: BufferAttribute;
  restX: Float32Array;
  restY: Float32Array;
  vertCount: number;
  dispX: Float32Array;
  dispY: Float32Array;
  anchorX: number;
  anchorY: number;
  advAngle: number;
  sinAmplitude: number;
  phaseScale: number;
  velocityScale: number;
  smoothDeltaX: number;
  smoothDeltaY: number;
  pointerStrength: number;
}

/**
 * Applies sin-loop rotation animation to a decoration plane.
 * Vertices further from the anchor point swing with proportionally greater amplitude.
 * Pointer velocity is stacked additively on top of the sin displacement.
 */
export function updateDecorLayer(p: UpdateDecorLayerParams): void {
  for (let i = 0; i < p.vertCount; i++) {
    const ax = p.restX[i] - p.anchorX;
    const ay = p.restY[i] - p.anchorY;
    const dist = Math.sqrt(ax * ax + ay * ay);

    // Sin wave: amplitude scales with vertex distance from anchor
    p.dispY[i] = Math.sin(p.advAngle + dist * p.phaseScale) * p.sinAmplitude * dist * p.velocityScale;

    // Additive pointer influence, stacked after the sin displacement
    p.dispX[i] = p.smoothDeltaX * p.pointerStrength;
    p.dispY[i] += p.smoothDeltaY * p.pointerStrength;

    p.posAttr.setXYZ(i, p.restX[i] + p.dispX[i], p.restY[i] + p.dispY[i], 0);
  }
  p.posAttr.needsUpdate = true;
}

// ---- Advance mode: foreground layer update ----

export interface UpdateForegroundLayerParams {
  posAttr: BufferAttribute;
  restX: Float32Array;
  restY: Float32Array;
  vertCount: number;
  dispX: Float32Array;
  dispY: Float32Array;
  fgSeeds: Float32Array;
  advAngle: number;
  fgAmplitude: number;
  smoothDeltaX: number;
  smoothDeltaY: number;
  pointerStrength: number;
}

/**
 * Applies X-only sin wave to the foreground plane.
 * Each vertex has a unique phase seed for wave undulation.
 * Pointer velocity is stacked additively on both axes.
 */
export function updateForegroundLayer(p: UpdateForegroundLayerParams): void {
  for (let i = 0; i < p.vertCount; i++) {
    // Sin displacement on X only, seeded per-vertex for wave phasing
    p.dispX[i] = Math.sin(p.advAngle + p.fgSeeds[i]) * p.fgAmplitude;

    // Additive pointer influence on both axes
    p.dispX[i] += p.smoothDeltaX * p.pointerStrength;
    p.dispY[i] = p.smoothDeltaY * p.pointerStrength;

    p.posAttr.setXYZ(i, p.restX[i] + p.dispX[i], p.restY[i] + p.dispY[i], 0);
  }
  p.posAttr.needsUpdate = true;
}

// ---- Standard mode: pointer displacement on background ----

export interface ApplyStandardDisplacementParams {
  vertCount: number;
  restX: Float32Array;
  restY: Float32Array;
  dispX: Float32Array;
  dispY: Float32Array;
  dispZ: Float32Array;
  hitLocalX: number;
  hitLocalY: number;
  smoothDeltaX: number;
  smoothDeltaY: number;
  sMag: number;
  influenceRadius: number;
  displacementStrength: number;
  zFactor: number;
}

/**
 * Accumulates Gaussian-weighted pointer displacement onto background vertices.
 * Call this only when `sMag > 0.0001` and the pointer has a valid raycasted hit.
 */
export function applyStandardDisplacement(p: ApplyStandardDisplacementParams): void {
  const r2 = p.influenceRadius * p.influenceRadius;
  for (let i = 0; i < p.vertCount; i++) {
    const dx = p.restX[i] - p.hitLocalX;
    const dy = p.restY[i] - p.hitLocalY;
    const d2 = dx * dx + dy * dy;
    // Gaussian falloff: vertices close to the hit point are influenced strongly
    const influence = Math.exp(-d2 / (2 * r2));
    p.dispX[i] += p.smoothDeltaX * p.displacementStrength * influence;
    p.dispY[i] += p.smoothDeltaY * p.displacementStrength * influence;
    p.dispZ[i] += p.sMag * p.displacementStrength * p.zFactor * influence;
  }
}

// ---- Standard mode: spring-back ----

export interface ApplySpringBackParams {
  posAttr: BufferAttribute;
  vertCount: number;
  restX: Float32Array;
  restY: Float32Array;
  restZ: Float32Array;
  dispX: Float32Array;
  dispY: Float32Array;
  dispZ: Float32Array;
  springDamping: number;
}

/**
 * Springs all displaced background vertices back toward their rest positions.
 * Snaps displacements to zero once they fall below 1e-5.
 *
 * @returns `true` if at least one vertex is still displaced, `false` when at rest.
 */
export function applySpringBack(p: ApplySpringBackParams): boolean {
  let stillActive = false;
  for (let i = 0; i < p.vertCount; i++) {
    p.dispX[i] *= p.springDamping;
    p.dispY[i] *= p.springDamping;
    p.dispZ[i] *= p.springDamping;

    if (Math.abs(p.dispX[i]) < 1e-5) p.dispX[i] = 0;
    else stillActive = true;
    if (Math.abs(p.dispY[i]) < 1e-5) p.dispY[i] = 0;
    else stillActive = true;
    if (Math.abs(p.dispZ[i]) < 1e-5) p.dispZ[i] = 0;
    else stillActive = true;

    p.posAttr.setXYZ(i, p.restX[i] + p.dispX[i], p.restY[i] + p.dispY[i], p.restZ[i] + p.dispZ[i]);
  }
  p.posAttr.needsUpdate = true;
  return stillActive;
}
