import type { BufferAttribute } from 'three';

// ---- Advance mode: decoration layer update ----

export interface UpdateDecorLayerParams {
  posAttr: BufferAttribute;
  restX: Float32Array;
  restY: Float32Array;
  vertCount: number;
  dispX: Float32Array;
  dispY: Float32Array;
  borderMask: Float32Array;
  anchorX: number;
  anchorY: number;
  advAngle: number;
  phaseOffset: number;
  sinAmplitude: number;
  smoothDeltaX: number;
  smoothDeltaY: number;
  pointerStrength: number;
  /** Pointer position in plane local space (NDC x/y). Used for proximity weighting. */
  hitLocalX: number;
  hitLocalY: number;
  /** Gaussian influence radius around the pointer (local units). Larger = wider spread. */
  pointerInfluenceRadius: number;
}

/**
 * Applies a rigid-body rotation animation to a decoration plane (branch-bending model).
 * All vertices share a single frame angle θ = sinAmplitude × sin(advAngle + phaseOffset).
 * Each vertex is displaced by rotating its offset vector (ax, ay) from the anchor:
 *   dispX = ax*(cosθ−1) − ay*sinθ
 *   dispY = ax*sinθ  + ay*(cosθ−1)
 * Tangential displacement naturally scales with distance, producing the "branch tip moves
 * further than the base" effect.
 * Pointer influence is weighted by a Gaussian falloff from the pointer position:
 * vertices close to the pointer receive full velocity influence; far vertices receive little.
 */
export function updateDecorLayer(p: UpdateDecorLayerParams): void {
  const theta = p.sinAmplitude * Math.sin(p.advAngle + p.phaseOffset);
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);
  const r2 = p.pointerInfluenceRadius * p.pointerInfluenceRadius;

  for (let i = 0; i < p.vertCount; i++) {
    const ax = p.restX[i] - p.anchorX;
    const ay = p.restY[i] - p.anchorY;

    // Rotation displacement — tangential to radius, scales naturally with distance
    const rotDispX = ax * (cosT - 1) - ay * sinT;
    const rotDispY = ax * sinT + ay * (cosT - 1);

    // Gaussian proximity weight from pointer: 1 at pointer, falls off with distance
    const dpx = p.restX[i] - p.hitLocalX;
    const dpy = p.restY[i] - p.hitLocalY;
    const pointerWeight = Math.exp(-(dpx * dpx + dpy * dpy) / r2);

    // Combine rotation with pointer-proximity-weighted influence; pin border vertices
    p.dispX[i] = (rotDispX + p.smoothDeltaX * p.pointerStrength * pointerWeight) * p.borderMask[i];
    p.dispY[i] = (rotDispY + p.smoothDeltaY * p.pointerStrength * pointerWeight) * p.borderMask[i];

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
  borderMask: Float32Array;
  fgSeeds: Float32Array;
  advAngle: number;
  fgAmplitude: number;
  smoothDeltaX: number;
  smoothDeltaY: number;
  fgPointerStrength: number;
}

/**
 * Applies X-only sin wave to the foreground plane.
 * Each vertex has a unique phase seed for wave undulation.
 * Pointer velocity is stacked additively and edge-clamped.
 */
export function updateForegroundLayer(p: UpdateForegroundLayerParams): void {
  for (let i = 0; i < p.vertCount; i++) {
    // Sin displacement on X only, seeded per-vertex for wave phasing
    const sinX = Math.sin(p.advAngle + p.fgSeeds[i]) * p.fgAmplitude;

    // Additive pointer influence on both axes, edge-clamped
    p.dispX[i] = (sinX + p.smoothDeltaX * p.fgPointerStrength) * p.borderMask[i];
    p.dispY[i] = p.smoothDeltaY * p.fgPointerStrength * p.borderMask[i];

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
