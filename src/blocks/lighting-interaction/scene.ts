import {
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

// --- Hardcoded config (promote to UE-authored fields in a future change) ---
const INFLUENCE_RADIUS = 0.8; // local-space radius of pointer influence (plane half-height = 1 unit)
const DISPLACEMENT_STRENGTH = 0.1; // impulse multiplier per frame
const VELOCITY_DECAY = 0.2; // per-frame decay applied to the smoothed pointer delta
const SPRING_DAMPING = 0.8; // per-frame decay that springs vertices back to rest
const Z_FACTOR = 0.1; // z-displacement magnitude relative to xy displacement

export interface SceneConfig {
  imageUrl: string;
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

  // --- Plane geometry: 2×2 local units, 64×64 subdivisions ---
  const geometry = new PlaneGeometry(2, 2, 64, 64);
  const posAttr = geometry.attributes.position;
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

  // Per-vertex displacement accumulators (local space)
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

  // --- Animation loop ---
  function animate(): void {
    animationId = requestAnimationFrame(animate);

    // Consume pending delta into smoothDelta with per-frame momentum decay
    smoothDelta.x = smoothDelta.x * VELOCITY_DECAY + pendingDelta.x;
    smoothDelta.y = smoothDelta.y * VELOCITY_DECAY + pendingDelta.y;
    pendingDelta.set(0, 0);

    const sMag = Math.sqrt(smoothDelta.x * smoothDelta.x + smoothDelta.y * smoothDelta.y);

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
  });
  resizeObserver.observe(container);

  animate();
}
