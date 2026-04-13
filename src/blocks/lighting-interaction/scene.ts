import {
  BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Raycaster,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  WebGLRenderer,
  type Texture,
} from 'three';

// --- Standard mode config (promote to UE-authored fields in a future change) ---
const INFLUENCE_RADIUS = 0.8; // local-space radius of pointer influence (plane half-height = 1 unit)
const DISPLACEMENT_STRENGTH = 0.1; // impulse multiplier per frame
const VELOCITY_DECAY = 0.2; // per-frame decay applied to the smoothed pointer delta
const SPRING_DAMPING = 0.8; // per-frame decay that springs vertices back to rest
const Z_FACTOR = 0.1; // z-displacement magnitude relative to xy displacement

// --- Advance mode config ---
const ADVANCE_SIN_AMPLITUDE = 0.06; // peak Y displacement for a decor vertex at dist=1 from anchor
const ADVANCE_SIN_FREQ = 0.015; // angle increment per frame (radians); controls wave speed
const ADVANCE_PHASE_SCALE = 2.5; // distance-to-phase multiplier; larger = tighter wave spacing
const ADVANCE_DECOR_VELOCITY_SCALE = 1.0; // final amplitude scale on the distance-proportional decor wave
const ADVANCE_FG_AMPLITUDE = 0.03; // peak X displacement for foreground vertices
const ADVANCE_POINTER_STRENGTH = 0.05; // uniform pointer-velocity scale for all overlay planes

export interface SceneConfig {
  imageUrl: string;
  advance?: boolean;
  decorLeftUrl?: string;
  decorRightUrl?: string;
  foregroundUrl?: string;
}

interface OverlayLayer {
  posAttr: BufferAttribute;
  restX: Float32Array;
  restY: Float32Array;
  vertCount: number;
  dispX: Float32Array;
  dispY: Float32Array;
  onResize: (newAspect: number) => void;
}

let animationId: number | null = null;
let resizeObserver: ResizeObserver | null = null;
let boundPointerMove: ((e: PointerEvent) => void) | null = null;
let boundContainer: Element | null = null;

export function cleanupScene(): void {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (boundPointerMove && boundContainer) {
    boundContainer.removeEventListener('pointermove', boundPointerMove as EventListener);
    boundPointerMove = null;
    boundContainer = null;
  }
}

// Loads a transparent overlay plane, adds it to the scene, and returns its animation state.
// Draw order is controlled via renderOrder: background=0, decor-left=1, decor-right=2, foreground=3.
async function loadOverlayPlane(
  url: string,
  threeScene: Scene,
  initAspect: number,
  renderOrder: number,
): Promise<OverlayLayer> {
  const texture = await new Promise<Texture>((resolve, reject) => {
    new TextureLoader().load(url, resolve, undefined, reject);
  });

  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;

  const rawImg = texture.image as HTMLImageElement;
  const imgAspect = rawImg.naturalWidth > 0 ? rawImg.naturalWidth / rawImg.naturalHeight : 1;

  // Adjust UV repeat/offset so the texture behaves like CSS object-fit: cover
  function updateCoverUV(canvasAspect: number): void {
    if (canvasAspect > imgAspect) {
      const rY = imgAspect / canvasAspect;
      texture.repeat.set(1, rY);
      texture.offset.set(0, (1 - rY) / 2);
    } else {
      const rX = canvasAspect / imgAspect;
      texture.repeat.set(rX, 1);
      texture.offset.set((1 - rX) / 2, 0);
    }
    texture.needsUpdate = true;
  }

  updateCoverUV(initAspect);

  // transparent: true + depthTest: false ensures alpha-blended draw order is governed by renderOrder
  const material = new MeshBasicMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
  const geometry = new PlaneGeometry(2, 2, 32, 32);
  const posAttr = geometry.attributes.position as BufferAttribute;
  const vertCount = posAttr.count;

  const restX = new Float32Array(vertCount);
  const restY = new Float32Array(vertCount);
  for (let i = 0; i < vertCount; i++) {
    restX[i] = posAttr.getX(i);
    restY[i] = posAttr.getY(i);
  }

  const dispX = new Float32Array(vertCount);
  const dispY = new Float32Array(vertCount);

  const mesh = new Mesh(geometry, material);
  mesh.scale.x = initAspect;
  mesh.renderOrder = renderOrder;
  threeScene.add(mesh);

  return {
    posAttr,
    restX,
    restY,
    vertCount,
    dispX,
    dispY,
    onResize: (newAspect: number) => {
      mesh.scale.x = newAspect;
      updateCoverUV(newAspect);
    },
  };
}

export async function initScene(canvas: HTMLCanvasElement, config: SceneConfig): Promise<void> {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);

  const container = canvas.parentElement ?? canvas;
  const W = container.clientWidth;
  const H = container.clientHeight;
  renderer.setSize(W, H, false);

  // Orthographic camera with an aspect-corrected frustum: X spans (-aspect, aspect), Y spans (-1, 1).
  // This way plane.scale.x = aspect fills the frustum exactly edge-to-edge, so the plane UVs
  // run 0→1 across the full visible area — matching CSS object-fit: cover behaviour.
  const initAspect = W / H;
  const camera = new OrthographicCamera(-initAspect, initAspect, 1, -1, -10, 10);
  camera.position.z = 1;

  const scene = new Scene();

  // --- Background plane geometry: minimal in advance mode (static, no deformation), full otherwise ---
  const bgSegments = config.advance ? 4 : 64;
  const geometry = new PlaneGeometry(2, 2, bgSegments, bgSegments);
  const posAttr = geometry.attributes.position as BufferAttribute;
  const vertCount = posAttr.count;

  // Cache rest (undeformed) positions so vertices can spring back
  const restX = new Float32Array(vertCount);
  const restY = new Float32Array(vertCount);
  const restZ = new Float32Array(vertCount);
  for (let i = 0; i < vertCount; i++) {
    restX[i] = posAttr.getX(i);
    restY[i] = posAttr.getY(i);
    restZ[i] = posAttr.getZ(i);
  }

  // Per-vertex displacement accumulators (standard mode only)
  const dispX = new Float32Array(vertCount);
  const dispY = new Float32Array(vertCount);
  const dispZ = new Float32Array(vertCount);

  // --- Load background texture ---
  const texture = await new Promise<Texture>((resolve, reject) => {
    new TextureLoader().load(config.imageUrl, resolve, undefined, reject);
  });

  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;

  const rawImg = texture.image as HTMLImageElement;
  const imgAspect = rawImg.naturalWidth > 0 ? rawImg.naturalWidth / rawImg.naturalHeight : 1;

  // Adjust UV repeat/offset so the texture behaves like CSS object-fit: cover
  function updateCoverUV(canvasAspect: number): void {
    if (canvasAspect > imgAspect) {
      // Canvas is wider than the image → crop top/bottom
      const rY = imgAspect / canvasAspect;
      texture.repeat.set(1, rY);
      texture.offset.set(0, (1 - rY) / 2);
    } else {
      // Canvas is taller than the image → crop left/right
      const rX = canvasAspect / imgAspect;
      texture.repeat.set(rX, 1);
      texture.offset.set((1 - rX) / 2, 0);
    }
    texture.needsUpdate = true;
  }

  updateCoverUV(initAspect);

  const material = new MeshBasicMaterial({ map: texture });
  const plane = new Mesh(geometry, material);
  plane.scale.x = initAspect; // fills the aspect-corrected frustum exactly
  scene.add(plane);

  // --- Overlay layers (advance mode only) ---
  const overlayLayers: OverlayLayer[] = [];
  let decorLeft: OverlayLayer | null = null;
  let decorRight: OverlayLayer | null = null;
  let foreground: OverlayLayer | null = null;
  let fgSeeds: Float32Array | null = null;

  if (config.advance) {
    const loadPromises: Promise<void>[] = [];

    if (config.decorLeftUrl) {
      loadPromises.push(
        loadOverlayPlane(config.decorLeftUrl, scene, initAspect, 1).then((layer) => {
          decorLeft = layer;
          overlayLayers.push(layer);
        }),
      );
    }
    if (config.decorRightUrl) {
      loadPromises.push(
        loadOverlayPlane(config.decorRightUrl, scene, initAspect, 2).then((layer) => {
          decorRight = layer;
          overlayLayers.push(layer);
        }),
      );
    }
    if (config.foregroundUrl) {
      loadPromises.push(
        loadOverlayPlane(config.foregroundUrl, scene, initAspect, 3).then((layer) => {
          foreground = layer;
          overlayLayers.push(layer);
          // Assign random phase seeds once so each vertex has a unique wave offset
          fgSeeds = new Float32Array(layer.vertCount);
          for (let i = 0; i < layer.vertCount; i++) {
            fgSeeds[i] = Math.random() * Math.PI * 2;
          }
        }),
      );
    }

    await Promise.all(loadPromises);
  }

  // --- Pointer tracking ---
  // NDC pointer accumulated since the last animation frame
  const lastNDC = new Vector2(0, 0);
  const pendingDelta = new Vector2(0, 0);
  const smoothDelta = new Vector2(0, 0);
  const currentNDC = new Vector2(0, 0); // kept in sync for raycasting

  const raycaster = new Raycaster();
  let hitLocalX = 0;
  let hitLocalY = 0;
  let hasHit = false;

  // Tracks whether any vertex is still displaced (skip the heavy loop when at rest)
  let hasActiveDisplacement = false;

  boundContainer = container;
  boundPointerMove = (e: PointerEvent): void => {
    const rect = container.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    currentNDC.set(nx, ny);
    pendingDelta.x += nx - lastNDC.x;
    pendingDelta.y += ny - lastNDC.y;
    lastNDC.set(nx, ny);
  };

  container.addEventListener('pointermove', boundPointerMove as EventListener);

  // Advance mode: accumulated sin angle (incremented each frame for a smooth infinite loop)
  let advAngle = 0;

  // --- Animation loop ---
  function animate(): void {
    animationId = requestAnimationFrame(animate);

    // Consume pending delta into smoothDelta with per-frame momentum decay
    smoothDelta.x = smoothDelta.x * VELOCITY_DECAY + pendingDelta.x;
    smoothDelta.y = smoothDelta.y * VELOCITY_DECAY + pendingDelta.y;
    pendingDelta.set(0, 0);

    const sMag = Math.sqrt(smoothDelta.x * smoothDelta.x + smoothDelta.y * smoothDelta.y);

    if (config.advance) {
      // --- Advance mode: overlay planes animate; background plane is static ---
      advAngle += ADVANCE_SIN_FREQ;

      // Decoration left — anchor at left-center (-1, 0)
      // Vertices further from the anchor swing with proportionally greater amplitude
      if (decorLeft) {
        const { posAttr: dPos, restX: dRX, restY: dRY, vertCount: dN, dispX: dDX, dispY: dDY } = decorLeft;
        for (let i = 0; i < dN; i++) {
          const ax = dRX[i] - (-1);
          const ay = dRY[i] - 0;
          const dist = Math.sqrt(ax * ax + ay * ay);
          // Sin wave: amplitude scales with vertex distance from anchor
          dDY[i] =
            Math.sin(advAngle + dist * ADVANCE_PHASE_SCALE) *
            ADVANCE_SIN_AMPLITUDE *
            dist *
            ADVANCE_DECOR_VELOCITY_SCALE;
          // Additive pointer influence stacked on top of sin displacement
          dDX[i] = smoothDelta.x * ADVANCE_POINTER_STRENGTH;
          dDY[i] += smoothDelta.y * ADVANCE_POINTER_STRENGTH;
          dPos.setXYZ(i, dRX[i] + dDX[i], dRY[i] + dDY[i], 0);
        }
        dPos.needsUpdate = true;
      }

      // Decoration right — anchor at right-center (1, 0)
      if (decorRight) {
        const { posAttr: dPos, restX: dRX, restY: dRY, vertCount: dN, dispX: dDX, dispY: dDY } = decorRight;
        for (let i = 0; i < dN; i++) {
          const ax = dRX[i] - 1;
          const ay = dRY[i] - 0;
          const dist = Math.sqrt(ax * ax + ay * ay);
          dDY[i] =
            Math.sin(advAngle + dist * ADVANCE_PHASE_SCALE) *
            ADVANCE_SIN_AMPLITUDE *
            dist *
            ADVANCE_DECOR_VELOCITY_SCALE;
          dDX[i] = smoothDelta.x * ADVANCE_POINTER_STRENGTH;
          dDY[i] += smoothDelta.y * ADVANCE_POINTER_STRENGTH;
          dPos.setXYZ(i, dRX[i] + dDX[i], dRY[i] + dDY[i], 0);
        }
        dPos.needsUpdate = true;
      }

      // Foreground — X-only sin wave; per-vertex phase seeds create a rolling wave undulation
      if (foreground && fgSeeds) {
        const { posAttr: fPos, restX: fRX, restY: fRY, vertCount: fN, dispX: fDX, dispY: fDY } = foreground;
        for (let i = 0; i < fN; i++) {
          // Sin displacement on X, seeded per-vertex for wave phase variety
          fDX[i] = Math.sin(advAngle + fgSeeds[i]) * ADVANCE_FG_AMPLITUDE;
          // Additive pointer influence on both axes
          fDX[i] += smoothDelta.x * ADVANCE_POINTER_STRENGTH;
          fDY[i] = smoothDelta.y * ADVANCE_POINTER_STRENGTH;
          fPos.setXYZ(i, fRX[i] + fDX[i], fRY[i] + fDY[i], 0);
        }
        fPos.needsUpdate = true;
      }
    } else {
      // --- Standard mode: pointer-driven vertex displacement on background ---

      // Raycast pointer onto the plane to find world-space hit point
      raycaster.setFromCamera(currentNDC, camera);
      const hits = raycaster.intersectObject(plane);
      if (hits.length > 0) {
        // Convert world hit X back to local space (plane.scale.x stretches world X)
        hitLocalX = hits[0].point.x / plane.scale.x;
        hitLocalY = hits[0].point.y;
        hasHit = true;
      }

      // Apply displacement impulse when the pointer is moving
      if (hasHit && sMag > 0.0001) {
        hasActiveDisplacement = true;
        const r2 = INFLUENCE_RADIUS * INFLUENCE_RADIUS;
        for (let i = 0; i < vertCount; i++) {
          const dx = restX[i] - hitLocalX;
          const dy = restY[i] - hitLocalY;
          const d2 = dx * dx + dy * dy;
          // Gaussian falloff: vertices close to the hit point are influenced strongly
          const influence = Math.exp(-d2 / (2 * r2));
          dispX[i] += smoothDelta.x * DISPLACEMENT_STRENGTH * influence;
          dispY[i] += smoothDelta.y * DISPLACEMENT_STRENGTH * influence;
          dispZ[i] += sMag * DISPLACEMENT_STRENGTH * Z_FACTOR * influence;
        }
      }

      // Spring all displaced vertices back toward rest, skip loop when plane is at rest
      if (hasActiveDisplacement) {
        let stillActive = false;
        for (let i = 0; i < vertCount; i++) {
          dispX[i] *= SPRING_DAMPING;
          dispY[i] *= SPRING_DAMPING;
          dispZ[i] *= SPRING_DAMPING;
          // Snap to zero once below threshold to terminate decay cleanly
          if (Math.abs(dispX[i]) < 1e-5) dispX[i] = 0;
          else stillActive = true;
          if (Math.abs(dispY[i]) < 1e-5) dispY[i] = 0;
          else stillActive = true;
          if (Math.abs(dispZ[i]) < 1e-5) dispZ[i] = 0;
          else stillActive = true;
          posAttr.setXYZ(i, restX[i] + dispX[i], restY[i] + dispY[i], restZ[i] + dispZ[i]);
        }
        posAttr.needsUpdate = true;
        hasActiveDisplacement = stillActive;
      }
    }

    renderer.render(scene, camera);
  }

  // --- Resize ---
  resizeObserver = new ResizeObserver(() => {
    const newW = container.clientWidth;
    const newH = container.clientHeight;
    renderer.setSize(newW, newH, false);
    const newAspect = newW / newH;
    // Keep camera frustum in sync with canvas aspect ratio
    camera.left = -newAspect;
    camera.right = newAspect;
    camera.updateProjectionMatrix();
    plane.scale.x = newAspect;
    updateCoverUV(newAspect);
    // Update all overlay planes
    for (const layer of overlayLayers) {
      layer.onResize(newAspect);
    }
  });
  resizeObserver.observe(container);

  animate();
}
