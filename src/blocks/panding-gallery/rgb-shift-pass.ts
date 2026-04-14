import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import type { Vector2 } from 'three';

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec2 uPointerUV;
uniform float uInfluenceRadius;
uniform float uMaxShift;
uniform float uEnergy;
varying vec2 vUv;

void main() {
  vec2 delta = vUv - uPointerUV;
  float dist = length(delta);

  // Radial direction from pointer to current pixel; zero-safe
  vec2 dir = dist > 0.0001 ? delta / dist : vec2(0.0);

  // distFactor: 0 at pointer, 1 at influenceRadius (clamped beyond)
  float distFactor = clamp(dist / uInfluenceRadius, 0.0, 1.0);

  float shiftMag = uMaxShift * distFactor * uEnergy;

  // Red   — unchanged
  float r = texture2D(tDiffuse, vUv).r;
  // Green — shifted outward (away from pointer)
  float g = texture2D(tDiffuse, vUv + dir * shiftMag).g;
  // Blue  — shifted inward  (toward pointer)
  float b = texture2D(tDiffuse, vUv - dir * shiftMag).b;

  float a = texture2D(tDiffuse, vUv).a;

  gl_FragColor = vec4(r, g, b, a);
}
`;

/**
 * Radial RGB-shift post-processing pass.
 *
 * Green channel is shifted outward (away from pointer),
 * blue channel is shifted inward (toward pointer), and
 * red channel is left unchanged.
 *
 * Effect magnitude scales with scrollEnergy (0→1).
 */
export class RadialRGBShiftPass extends ShaderPass {
  constructor(influenceRadius = 0.4, maxShift = 0.01) {
    super({
      uniforms: {
        tDiffuse: { value: null },
        uPointerUV: { value: null },
        uInfluenceRadius: { value: influenceRadius },
        uMaxShift: { value: maxShift },
        uEnergy: { value: 0 },
      },
      vertexShader,
      fragmentShader,
    });
    // uPointerUV needs a default Vector2; will be replaced on first update()
    this.uniforms['uPointerUV'].value = { x: 0.5, y: 0.5 };
  }

  /**
   * Update per-frame uniforms. Call this before composer.render().
   * @param pointerUV  Pointer position in UV space [0,1]²
   * @param energy     Current scroll energy in [0,1]
   */
  update(pointerUV: Vector2, energy: number): void {
    this.uniforms['uPointerUV'].value = pointerUV;
    this.uniforms['uEnergy'].value = energy;
  }
}
