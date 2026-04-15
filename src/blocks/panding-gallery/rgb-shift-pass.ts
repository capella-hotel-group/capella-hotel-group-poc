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

  vec4 sC = texture2D(tDiffuse, vUv);                   // center  (original)
  vec4 sO = texture2D(tDiffuse, vUv + dir * shiftMag);  // outward sample
  vec4 sI = texture2D(tDiffuse, vUv - dir * shiftMag);  // inward  sample

  // Default tint colors.
  vec3 cyanColor   = vec3(0.24, 0.82, 1.28) + sO.rgb;
  vec3 violetColor = vec3(0.88, 0.12, 0.68) + sI.rgb;

  // Tint factor: 0 at the pointer or when energy == 0;
  // grows toward 1 as the pixel moves outward to the influence boundary.
  // t == shiftMag / uMaxShift, written out so GLSL avoids a division.
  float t = distFactor * uEnergy;

  // Outward sample blends toward cyan as t increases.
  // Inward sample blends toward violet as t increases.
  // When shiftMag == 0 → sO == sI == sC and t == 0 → collapse to original.
  vec3 outTinted = mix(sO.rgb, cyanColor,   t * 0.16);
  vec3 inTinted  = mix(sI.rgb, violetColor, t * 0.16);

  // Chromatic split: G from cyan (outward) side, R from violet (inward) side,
  // B is shared between both tints via a 50/50 blend.
  float r = inTinted.r;
  float g = outTinted.g;
  float b = mix(inTinted.b, outTinted.b, 0.5);

  gl_FragColor = vec4(r, g, b, sC.a);
}
`;

/**
 * Radial RGB-shift post-processing pass.
 *
 * Pixels moving outward from the pointer blend toward a default cyan tint;
 * pixels moving inward blend toward a default violet tint.
 * Both effects are zero at the pointer and scale with distFactor × scrollEnergy.
 */
export class RadialRGBShiftPass extends ShaderPass {
  constructor(influenceRadius = 0.6, maxShift = 0.008) {
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
