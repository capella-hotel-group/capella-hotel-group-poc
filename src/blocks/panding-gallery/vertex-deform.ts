import type { BufferGeometry } from 'three';

/**
 * Applies per-vertex Z-displacement to a PlaneGeometry based on pointer proximity
 * and current scroll energy.
 *
 * Displacement rule:
 *   - proximityFactor = dist / deformRadius  (0 = at pointer, 1 = at radius edge)
 *   - position.z = deformStrength × proximityFactor × scrollEnergy
 *   - vertices beyond deformRadius: z = 0
 *
 * @param geometry      The PlaneGeometry whose `position` attribute to mutate
 * @param pointerWorldX Pointer X in world (pixel) space
 * @param pointerWorldY Pointer Y in world (pixel) space
 * @param meshWorldX    Mesh center X in world space (for vertex offset calculation)
 * @param meshWorldY    Mesh center Y in world space
 * @param deformRadius  Influence radius in CSS pixels
 * @param deformStrength Maximum Z displacement in CSS pixels
 * @param scrollEnergy  Normalised energy scalar in [0, 1]
 */
export function applyVertexDeform(
  geometry: BufferGeometry,
  pointerWorldX: number,
  pointerWorldY: number,
  meshWorldX: number,
  meshWorldY: number,
  deformRadius: number,
  deformStrength: number,
  scrollEnergy: number,
): void {
  if (scrollEnergy < 0.001) return;

  const posAttr = geometry.attributes['position'];
  if (!posAttr) return;

  const count = posAttr.count;

  for (let i = 0; i < count; i++) {
    const vx = (posAttr.getX(i) as number) + meshWorldX;
    const vy = (posAttr.getY(i) as number) + meshWorldY;

    const dx = vx - pointerWorldX;
    const dy = vy - pointerWorldY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let z = 0;
    if (dist < deformRadius) {
      const proximityFactor = dist / deformRadius;
      z = deformStrength * proximityFactor * scrollEnergy;
    }

    posAttr.setZ(i, z);
  }

  posAttr.needsUpdate = true;
}
