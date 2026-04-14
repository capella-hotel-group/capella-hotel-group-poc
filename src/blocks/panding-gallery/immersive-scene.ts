import {
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { RadialRGBShiftPass } from './rgb-shift-pass';
import { applyVertexDeform } from './vertex-deform';
import type { ScrollMotionController } from './scroll-motion';

export interface ImmersiveSceneConfig {
  block: HTMLElement;
  columns: HTMLElement[];
  controller: ScrollMotionController;
  deformRadius: number;
  deformStrength: number;
}

interface PlaneInfo {
  mesh: Mesh;
  /** Base position before any scroll-motion offset (pixel-space world coords) */
  baseX: number;
  baseY: number;
  colIndex: number;
  itemIndex: number;
}

const loader = new TextureLoader();

export class ImmersiveScene {
  private readonly block: HTMLElement;
  private readonly columns: HTMLElement[];
  private readonly controller: ScrollMotionController;
  private readonly deformRadius: number;
  private readonly deformStrength: number;

  private canvas: HTMLCanvasElement | null = null;
  private renderer: WebGLRenderer | null = null;
  private camera: OrthographicCamera | null = null;
  private composer: EffectComposer | null = null;
  private rgbShiftPass: RadialRGBShiftPass | null = null;
  private planes: PlaneInfo[] = [];

  // Pointer in normalised block coords [-1, 1]
  private pointerNDX = 0;
  private pointerNDY = 0;
  private pointerUV = new Vector2(0.5, 0.5);
  private pointerWorldX = 0;
  private pointerWorldY = 0;

  private animationId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private pointerHandler: ((e: PointerEvent) => void) | null = null;
  private columnsContainer: HTMLElement | null = null;

  constructor(config: ImmersiveSceneConfig) {
    this.block = config.block;
    this.columns = config.columns;
    this.controller = config.controller;
    this.deformRadius = config.deformRadius;
    this.deformStrength = config.deformStrength;
  }

  async init(): Promise<void> {
    // Find the columns container to hide it
    this.columnsContainer = this.block.querySelector<HTMLElement>('.panding-gallery-columns');

    const W = this.block.clientWidth;
    const H = this.block.clientHeight;

    // --- Canvas ---
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    this.canvas = canvas;
    this.block.insertBefore(canvas, this.block.firstChild);

    // --- Renderer ---
    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W, H, false);
    this.renderer = renderer;

    // --- Camera (1 world unit = 1 CSS pixel) ---
    const camera = new OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -1000, 1000);
    camera.position.z = 1;
    this.camera = camera;

    // --- Scene ---
    const scene = new Scene();

    // --- Build planes from DOM ---
    const blockRect = this.block.getBoundingClientRect();
    this.planes = [];

    const planesToLoad: Array<{ planeInfo: PlaneInfo; src: string }> = [];

    for (let c = 0; c < this.columns.length; c++) {
      const col = this.columns[c];
      const items = col.children;
      for (let i = 0; i < items.length; i++) {
        const el = items[i] as HTMLElement;
        const pic = el.querySelector<HTMLPictureElement>('picture');
        const img = pic?.querySelector<HTMLImageElement>('img');

        const elRect = el.getBoundingClientRect();
        const cellW = elRect.width;
        const cellH = elRect.height;

        // Convert cell top-left (relative to block) to pixel-space world coords
        // (camera origin = block center; Y flipped)
        const relX = elRect.left - blockRect.left;
        const relY = elRect.top - blockRect.top;
        const baseX = relX + cellW / 2 - W / 2;
        const baseY = -(relY + cellH / 2 - H / 2);

        const geometry = new PlaneGeometry(cellW, cellH, 8, 8);
        const material = new MeshBasicMaterial({ transparent: true });
        const mesh = new Mesh(geometry, material);
        mesh.position.set(baseX, baseY, 0);
        scene.add(mesh);

        const planeInfo: PlaneInfo = { mesh, baseX, baseY, colIndex: c, itemIndex: i };
        this.planes.push(planeInfo);

        if (img?.src) {
          planesToLoad.push({ planeInfo, src: img.src });
        }
      }
    }

    // Load textures asynchronously (non-blocking for render start)
    for (const { planeInfo, src } of planesToLoad) {
      loader.load(
        src,
        (tex) => {
          (planeInfo.mesh.material as MeshBasicMaterial).map = tex;
          (planeInfo.mesh.material as MeshBasicMaterial).needsUpdate = true;
        },
        undefined,
        () => {
          // texture load failed — keep transparent material
        },
      );
    }

    // --- Post-processing ---
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const rgbShiftPass = new RadialRGBShiftPass();
    composer.addPass(rgbShiftPass);
    this.composer = composer;
    this.rgbShiftPass = rgbShiftPass;
  }

  start(): void {
    // Hide DOM grid
    if (this.columnsContainer) {
      this.columnsContainer.style.visibility = 'hidden';
    }

    // Pointer tracking
    this.pointerHandler = (e: PointerEvent): void => {
      const rect = this.block.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      // NDC: [-1, 1]
      this.pointerNDX = (relX / W) * 2 - 1;
      this.pointerNDY = -((relY / H) * 2 - 1);
      // UV: [0, 1]
      this.pointerUV.set(relX / W, 1 - relY / H);
      // World-space
      this.pointerWorldX = this.pointerNDX * (W / 2);
      this.pointerWorldY = this.pointerNDY * (H / 2);
    };
    this.block.addEventListener('pointermove', this.pointerHandler);

    // Resize
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.block);

    // RAF
    this.animate();
  }

  cleanup(): void {
    // Cancel RAF
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Disconnect observers
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    // Remove pointer listener
    if (this.pointerHandler) {
      this.block.removeEventListener('pointermove', this.pointerHandler);
      this.pointerHandler = null;
    }

    // Restore DOM grid
    if (this.columnsContainer) {
      this.columnsContainer.style.visibility = '';
    }

    // Dispose Three.js resources
    for (const { mesh } of this.planes) {
      mesh.geometry.dispose();
      const mat = mesh.material as MeshBasicMaterial;
      mat.map?.dispose();
      mat.dispose();
    }
    this.planes = [];

    this.renderer?.dispose();
    this.renderer = null;

    // Remove canvas
    this.canvas?.remove();
    this.canvas = null;
  }

  private onResize(): void {
    const W = this.block.clientWidth;
    const H = this.block.clientHeight;

    if (!this.renderer || !this.camera || !this.composer) return;

    this.renderer.setSize(W, H, false);
    this.composer.setSize(W, H);

    this.camera.left = -W / 2;
    this.camera.right = W / 2;
    this.camera.top = H / 2;
    this.camera.bottom = -H / 2;
    this.camera.updateProjectionMatrix();

    // Recompute base positions from live DOM
    const blockRect = this.block.getBoundingClientRect();
    for (const plane of this.planes) {
      const col = this.columns[plane.colIndex];
      const el = col.children[plane.itemIndex] as HTMLElement | undefined;
      if (!el) continue;
      const elRect = el.getBoundingClientRect();
      const cellW = elRect.width;
      const cellH = elRect.height;
      const relX = elRect.left - blockRect.left;
      const relY = elRect.top - blockRect.top;
      plane.baseX = relX + cellW / 2 - W / 2;
      plane.baseY = -(relY + cellH / 2 - H / 2);
    }
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const energy = this.controller.scrollEnergy;
    const offsetY = this.controller.currentOffsetY;
    const itemOffsetY = this.controller.currentItemOffsetY;
    const globalOffsetX = this.controller.currentGlobalOffsetX;
    const colLogicalX = this.controller.currentColLogicalX;

    // Update plane world positions from scroll-motion state
    for (const plane of this.planes) {
      const c = plane.colIndex;
      const i = plane.itemIndex;

      // X: global offset + per-column logical (teleport correction)
      const scrollX = globalOffsetX + colLogicalX[c];
      // Y: per-column + per-item teleport correction
      const colY = offsetY[c] ?? 0;
      const itemY = itemOffsetY[c]?.[i] ?? 0;
      const scrollY = colY + itemY;

      const worldX = plane.baseX + scrollX;
      // Y axis is flipped (Three.js Y up, DOM Y down)
      const worldY = plane.baseY - scrollY;

      plane.mesh.position.set(worldX, worldY, 0);

      // Apply vertex deformation
      applyVertexDeform(
        plane.mesh.geometry as PlaneGeometry,
        this.pointerWorldX,
        this.pointerWorldY,
        worldX,
        worldY,
        this.deformRadius,
        this.deformStrength,
        energy,
      );
    }

    // Update RGB-shift uniforms & render only when there's motion
    if (energy >= 0.001) {
      this.rgbShiftPass?.update(this.pointerUV, energy);
      this.composer?.render();
    }
  };
}
