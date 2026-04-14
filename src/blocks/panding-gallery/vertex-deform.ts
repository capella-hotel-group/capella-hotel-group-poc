import type { BufferGeometry } from 'three';

/**
 * Applies a "bendy card" deformation to a PlaneGeometry each frame.
 *
 * Effect:
 *   Vertices that are CLOSE to the pointer get displaced MORE in the scroll
 *   direction, creating the illusion of a flexible/elastic card rather than a
 *   rigid rectangle.  Vertices far from the pointer are unaffected.
 *
 *   proximityFactor = 1 - dist/deformRadius  (1 at pointer, 0 at edge)
 *   displacement = deformStrength × proximityFactor × energy × scrollDirection (XY only, Z = 0)
 *
 * The displacement is applied relative to `restPositions` — the original
 * undisplaced local-space vertex positions stored at geometry creation time.
 * This prevents accumulated drift across frames.
 *
 * @param geometry        PlaneGeometry whose position attribute to mutate
 * @param restPositions   Original vertex positions as a packed Float32Array (x,y,z per vertex)
 * @param pointerWorldX   Pointer X in world (pixel) space
 * @param pointerWorldY   Pointer Y in world (pixel) space
 * @param meshWorldX      Mesh center X in world space
 * @param meshWorldY      Mesh center Y in world space
 * @param deformRadius    Influence radius in CSS pixels
 * @param deformStrength  Maximum XY displacement in CSS pixels (at energy=1, dist=0)
 * @param scrollDx        Current-frame scroll velocity X (CSS px/frame)
 * @param scrollDy        Current-frame scroll velocity Y (CSS px/frame, DOM convention: +up)
 */
export function applyVertexDeform(
  geometry: BufferGeometry,
  restPositions: Float32Array,
  pointerWorldX: number,
  pointerWorldY: number,
  meshWorldX: number,
  meshWorldY: number,
  deformRadius: number,
  deformStrength: number,
  scrollDx: number,
  scrollDy: number,
): void {
  const posAttr = geometry.attributes['position'];
  if (!posAttr) return;

  const count = posAttr.count;
  const mag = Math.hypot(scrollDx, scrollDy);

  if (mag < 0.001) {
    // No motion — reset all vertices to rest positions
    for (let i = 0; i < count; i++) {
      posAttr.setXYZ(i, restPositions[i * 3], restPositions[i * 3 + 1], 0);
    }
    posAttr.needsUpdate = true;
    return;
  }

  const energy = Math.tanh(mag / 15); // normalise to [0, 1]
  const invMag = 1 / mag;

  // Scroll direction in Three.js world space (Y axis flipped vs DOM convention)
  // DOM +scrollDy = content moves up = world -Y; DOM +scrollDx = world +X
  const dirX = scrollDx * invMag;
  const dirY = -scrollDy * invMag;

  const maxDeform = deformStrength * energy;

  for (let i = 0; i < count; i++) {
    const restX = restPositions[i * 3];
    const restY = restPositions[i * 3 + 1];

    // Vertex absolute world position (local + mesh center, Z ignored)
    const vWorldX = restX + meshWorldX;
    const vWorldY = restY + meshWorldY;

    const dx = vWorldX - pointerWorldX;
    const dy = vWorldY - pointerWorldY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < deformRadius) {
      // Inverted proximity: 1 at pointer (max deform), 0 at radius edge (no deform)
      const proximityFactor = 1 - dist / deformRadius;
      const deform = maxDeform * proximityFactor;
      posAttr.setXYZ(i, restX + dirX * deform, restY + dirY * deform, 0);
    } else {
      posAttr.setXYZ(i, restX, restY, 0);
    }
  }

  posAttr.needsUpdate = true;
}
