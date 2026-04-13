import {
  BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  Vector2,
  WebGLRenderer,
} from 'three';
import { debugConfig } from './debug-config';
import { loadTextureCoverUV, loadOverlayPlane, createHeadlinePlane } from './scene-loader';
import type { OverlayLayer, HeadlinePlane } from './scene-loader';
import {
  applySpringBack,
  applyStandardDisplacement,
  updateDecorLayer,
  updateForegroundLayer,
} from './scene-animation';
import { createDebugOverlayCanvas, drawVelocityVector } from './scene-debug';

// --- Standard mode config ---
const INFLUENCE_RADIUS = 0.2; // 0.8 local-space radius of pointer influence (plane half-height = 1 unit)
const DISPLACEMENT_STRENGTH = 0.18; // impulse multiplier per frame
const VELOCITY_DECAY_RATE = 0.032; // exponential decay rate per frame (0–1); higher = faster fade
const VELOCITY_DECAY_THRESHOLD = 0.0001; // snap smoothDelta to zero below this magnitude
const SPRING_DAMPING = 0.8; // per-frame decay that springs vertices back to rest
const Z_FACTOR = 0.3; // 0.16 z-displacement magnitude relative to xy displacement

// --- Advance mode config ---
const ADVANCE_SIN_AMPLITUDE = 0.08; // peak Y displacement for a decor vertex at dist=1 from anchor
const ADVANCE_SIN_FREQ = 0.015; // angle increment per frame (radians); controls wave speed
const ADVANCE_FG_AMPLITUDE = 0.03; // peak X displacement for foreground vertices
const ADVANCE_POINTER_STRENGTH = 0.45; // uniform pointer-velocity scale for all overlay planes
const ADVANCE_FG_POINTER_STRENGTH = 0.06; // separate foreground pointer-velocity scale
const ADVANCE_DECOR_POINTER_RADIUS = 1.2; // Gaussian influence radius around pointer for decor layers (local units)
const DECOR_PHASE_RIGHT = Math.PI * 0.7; // phase offset applied to right decor wave

export interface SceneConfig {
  imageUrl: string;
  advance?: boolean;
  decorLeftUrl?: string;
  decorRightUrl?: string;
  foregroundUrl?: string;
  headingEl?: HTMLElement | null;
  taglineEl?: HTMLElement | null;
  headlineInteraction?: boolean;
}

let animationId: number | null = null;
let resizeObserver: ResizeObserver | null = null;
let boundPointerMove: ((e: PointerEvent) => void) | null = null;
let boundContainer: Element | null = null;
let moduleDebugCanvas: HTMLCanvasElement | null = null;

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
  moduleDebugCanvas?.remove();
  moduleDebugCanvas = null;
}

export async function initScene(canvas: HTMLCanvasElement, config: SceneConfig): Promise<void> {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);

  const container = canvas.parentElement ?? canvas;
  const W = container.clientWidth;
  const H = container.clientHeight;
  renderer.setSize(W, H, false);

  // Orthographic camera with an aspect-corrected frustum: X spans (-aspect, aspect), Y spans (-1, 1).
  // plane.scale.x = aspect fills the frustum exactly edge-to-edge, so UVs run 0→1 across the
  // full visible area — matching CSS object-fit: cover behaviour.
  const initAspect = W / H;
  const camera = new OrthographicCamera(-initAspect, initAspect, 1, -1, -10, 10);
  camera.position.z = 1;

  const scene = new Scene();

  // --- Background plane geometry: minimal in advance mode (static), full in standard mode ---
  const bgSegments = config.advance ? 4 : 64;
  const geometry = new PlaneGeometry(2, 2, bgSegments, bgSegments);
  const posAttr = geometry.attributes.position as BufferAttribute;
  const vertCount = posAttr.count;

  const restX = new Float32Array(vertCount);
  const restY = new Float32Array(vertCount);
  const restZ = new Float32Array(vertCount);
  for (let i = 0; i < vertCount; i++) {
    restX[i] = posAttr.getX(i);
    restY[i] = posAttr.getY(i);
    restZ[i] = posAttr.getZ(i);
  }

  const dispX = new Float32Array(vertCount);
  const dispY = new Float32Array(vertCount);
  const dispZ = new Float32Array(vertCount);

  // --- Background texture ---
  const { texture, updateCoverUV } = await loadTextureCoverUV(config.imageUrl);
  updateCoverUV(initAspect);

  const bgMaterial = new MeshBasicMaterial({ map: texture });
  const plane = new Mesh(geometry, bgMaterial);
  plane.scale.x = initAspect;
  scene.add(plane);

  // --- Overlay layers (advance mode only) ---
  const overlayLayers: OverlayLayer[] = [];
  let decorLeft: OverlayLayer | null = null;
  let decorRight: OverlayLayer | null = null;
  let foreground: OverlayLayer | null = null;
  let fgSeeds: Float32Array | null = null;
  let headlinePlane: HeadlinePlane | null = null;

  if (config.advance) {
    const loadPromises: Promise<void>[] = [];

    if (config.decorLeftUrl) {
      loadPromises.push(
        loadOverlayPlane(
          config.decorLeftUrl,
          scene,
          initAspect,
          1,
          debugConfig.wireframeDecorLeft ?? false,
        ).then((layer) => {
          layer.mesh.visible = debugConfig.showDecorLeft ?? true;
          decorLeft = layer;
          overlayLayers.push(layer);
        }),
      );
    }
    if (config.decorRightUrl) {
      loadPromises.push(
        loadOverlayPlane(
          config.decorRightUrl,
          scene,
          initAspect,
          2,
          debugConfig.wireframeDecorRight ?? false,
        ).then((layer) => {
          layer.mesh.visible = debugConfig.showDecorRight ?? true;
          decorRight = layer;
          overlayLayers.push(layer);
        }),
      );
    }
    if (config.foregroundUrl) {
      loadPromises.push(
        loadOverlayPlane(
          config.foregroundUrl,
          scene,
          initAspect,
          3,
          debugConfig.wireframeForeground ?? false,
        ).then((layer) => {
          layer.mesh.visible = debugConfig.showForeground ?? true;
          foreground = layer;
          overlayLayers.push(layer);
          fgSeeds = new Float32Array(layer.vertCount);
          for (let i = 0; i < layer.vertCount; i++) {
            // Map vertex X position (-1..1) to a phase offset spanning 0..0.5*PI so
            // the total phase difference across the entire plane is ~π/2 — a gentle
            // horizontal wave sweep rather than chaotic per-vertex ripples.
            fgSeeds[i] = ((layer.restX[i] + 1) / 2) * (Math.PI * 0.5);
          }
        }),
      );
    }

    await Promise.all(loadPromises);

    if (debugConfig.headlineInteraction ?? config.headlineInteraction) {
      headlinePlane = createHeadlinePlane(
        config.headingEl ?? null,
        config.taglineEl ?? null,
        scene,
        container,
        initAspect,
      );
      if (headlinePlane) {
        const block = canvas.closest('.lighting-interaction');
        block?.classList.add('lighting-interaction--text-swapped');
      }
    }
  }

  // --- Debug velocity overlay ---
  let debugCanvas: HTMLCanvasElement | null = null;
  let debugCtx: CanvasRenderingContext2D | null = null;
  if (debugConfig.showVelocityVector) {
    debugCanvas = createDebugOverlayCanvas(container);
    moduleDebugCanvas = debugCanvas;
    debugCtx = debugCanvas.getContext('2d');
  }

  // --- Pointer tracking ---
  const lastNDC = new Vector2(0, 0);
  const pendingDelta = new Vector2(0, 0);
  const smoothDelta = new Vector2(0, 0);
  const currentNDC = new Vector2(0, 0);
  let pointerScreenX = 0;
  let pointerScreenY = 0;

  const raycaster = new Raycaster();
  let hitLocalX = 0;
  let hitLocalY = 0;
  let hasHit = false;
  let hasActiveDisplacement = false;

  boundContainer = container;
  boundPointerMove = (e: PointerEvent): void => {
    const rect = container.getBoundingClientRect();
    pointerScreenX = e.clientX - rect.left;
    pointerScreenY = e.clientY - rect.top;
    const nx = (pointerScreenX / rect.width) * 2 - 1;
    const ny = -(pointerScreenY / rect.height) * 2 + 1;
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

    // Exponential velocity momentum decay — natural ease-out of pointer inertia
    const decayRate = debugConfig.velocityDecayRate ?? VELOCITY_DECAY_RATE;
    const decayThreshold = debugConfig.velocityDecayThreshold ?? VELOCITY_DECAY_THRESHOLD;
    smoothDelta.x = (smoothDelta.x + pendingDelta.x) * (1 - decayRate);
    smoothDelta.y = (smoothDelta.y + pendingDelta.y) * (1 - decayRate);
    pendingDelta.set(0, 0);
    if (Math.abs(smoothDelta.x) < decayThreshold) smoothDelta.x = 0;
    if (Math.abs(smoothDelta.y) < decayThreshold) smoothDelta.y = 0;

    const sMag = Math.sqrt(smoothDelta.x * smoothDelta.x + smoothDelta.y * smoothDelta.y);

    if (config.advance) {
      // Overlay planes animate; background is static
      advAngle += ADVANCE_SIN_FREQ;

      if (decorLeft) {
        updateDecorLayer({
          posAttr: decorLeft.posAttr,
          restX: decorLeft.restX,
          restY: decorLeft.restY,
          vertCount: decorLeft.vertCount,
          dispX: decorLeft.dispX,
          dispY: decorLeft.dispY,
          borderMask: decorLeft.borderMask,
          anchorX: -1,
          anchorY: 0,
          advAngle,
          phaseOffset: 0,
          sinAmplitude: ADVANCE_SIN_AMPLITUDE,
          smoothDeltaX: smoothDelta.x,
          smoothDeltaY: smoothDelta.y,
          pointerStrength: ADVANCE_POINTER_STRENGTH,
          hitLocalX: currentNDC.x,
          hitLocalY: currentNDC.y,
          pointerInfluenceRadius: debugConfig.decorPointerInfluenceRadius ?? ADVANCE_DECOR_POINTER_RADIUS,
        });
      }

      if (decorRight) {
        updateDecorLayer({
          posAttr: decorRight.posAttr,
          restX: decorRight.restX,
          restY: decorRight.restY,
          vertCount: decorRight.vertCount,
          dispX: decorRight.dispX,
          dispY: decorRight.dispY,
          borderMask: decorRight.borderMask,
          anchorX: 1,
          anchorY: 0,
          advAngle,
          phaseOffset: DECOR_PHASE_RIGHT,
          sinAmplitude: ADVANCE_SIN_AMPLITUDE,
          smoothDeltaX: smoothDelta.x,
          smoothDeltaY: smoothDelta.y,
          pointerStrength: ADVANCE_POINTER_STRENGTH,
          hitLocalX: currentNDC.x,
          hitLocalY: currentNDC.y,
          pointerInfluenceRadius: debugConfig.decorPointerInfluenceRadius ?? ADVANCE_DECOR_POINTER_RADIUS,
        });
      }

      if (foreground && fgSeeds) {
        updateForegroundLayer({
          posAttr: foreground.posAttr,
          restX: foreground.restX,
          restY: foreground.restY,
          vertCount: foreground.vertCount,
          dispX: foreground.dispX,
          dispY: foreground.dispY,
          borderMask: foreground.borderMask,
          fgSeeds,
          advAngle,
          fgAmplitude: ADVANCE_FG_AMPLITUDE,
          smoothDeltaX: smoothDelta.x,
          smoothDeltaY: smoothDelta.y,
          fgPointerStrength: debugConfig.fgPointerStrength ?? ADVANCE_FG_POINTER_STRENGTH,
        });
      }

      if (headlinePlane) {
        // Headline plane uses standard Gaussian displacement, driven by NDC pointer position
        // (NDC x == local x for a full-frustum plane scaled by aspect).
        if (sMag > 0.0001) {
          headlinePlane.hasActiveDisplacement = true;
          applyStandardDisplacement({
            vertCount: headlinePlane.vertCount,
            restX: headlinePlane.restX,
            restY: headlinePlane.restY,
            dispX: headlinePlane.dispX,
            dispY: headlinePlane.dispY,
            dispZ: headlinePlane.dispZ,
            hitLocalX: currentNDC.x,
            hitLocalY: currentNDC.y,
            smoothDeltaX: smoothDelta.x,
            smoothDeltaY: smoothDelta.y,
            sMag,
            influenceRadius: INFLUENCE_RADIUS,
            displacementStrength: DISPLACEMENT_STRENGTH,
            zFactor: Z_FACTOR,
          });
        }
        if (headlinePlane.hasActiveDisplacement) {
          headlinePlane.hasActiveDisplacement = applySpringBack({
            posAttr: headlinePlane.posAttr,
            vertCount: headlinePlane.vertCount,
            restX: headlinePlane.restX,
            restY: headlinePlane.restY,
            restZ: headlinePlane.restZ,
            dispX: headlinePlane.dispX,
            dispY: headlinePlane.dispY,
            dispZ: headlinePlane.dispZ,
            springDamping: SPRING_DAMPING,
          });
        }
      }
    } else {
      // Standard mode: pointer-driven vertex displacement on background
      raycaster.setFromCamera(currentNDC, camera);
      const hits = raycaster.intersectObject(plane);
      if (hits.length > 0) {
        hitLocalX = hits[0].point.x / plane.scale.x;
        hitLocalY = hits[0].point.y;
        hasHit = true;
      }

      if (hasHit && sMag > 0.0001) {
        hasActiveDisplacement = true;
        applyStandardDisplacement({
          vertCount,
          restX,
          restY,
          dispX,
          dispY,
          dispZ,
          hitLocalX,
          hitLocalY,
          smoothDeltaX: smoothDelta.x,
          smoothDeltaY: smoothDelta.y,
          sMag,
          influenceRadius: INFLUENCE_RADIUS,
          displacementStrength: DISPLACEMENT_STRENGTH,
          zFactor: Z_FACTOR,
        });
      }

      if (hasActiveDisplacement) {
        hasActiveDisplacement = applySpringBack({
          posAttr,
          vertCount,
          restX,
          restY,
          restZ,
          dispX,
          dispY,
          dispZ,
          springDamping: SPRING_DAMPING,
        });
      }
    }

    // Debug: draw pointer velocity vector overlay
    if (debugCtx && debugConfig.showVelocityVector) {
      const scale = debugConfig.velocityVectorScale ?? 200;
      drawVelocityVector(debugCtx, pointerScreenX, pointerScreenY, smoothDelta.x, smoothDelta.y, scale);
    }

    renderer.render(scene, camera);
  }

  // --- Resize ---
  resizeObserver = new ResizeObserver(() => {
    const newW = container.clientWidth;
    const newH = container.clientHeight;
    renderer.setSize(newW, newH, false);
    const newAspect = newW / newH;
    camera.left = -newAspect;
    camera.right = newAspect;
    camera.updateProjectionMatrix();
    plane.scale.x = newAspect;
    updateCoverUV(newAspect);
    for (const layer of overlayLayers) {
      layer.onResize(newAspect);
    }
    headlinePlane?.onResize(newAspect);
    if (debugCanvas) {
      debugCanvas.width = newW;
      debugCanvas.height = newH;
    }
  });
  resizeObserver.observe(container);

  animate();
}
