import {
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  Texture,
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
    //
    // Plane base positions are computed structurally (same arithmetic as scroll-motion)
    // rather than via offsetLeft/offsetTop to guarantee pixel-perfect alignment:
    //
    //   colLeft[c] = c * (colWidth + GAP)
    //   itemTop[c][i] = sum_{j<i} (items[j].offsetHeight + GAP)
    //
    // scroll-motion applies CSS transforms as DELTAS on top of these layout positions,
    // and we apply the same deltas in the animate loop.  Using the same arithmetic
    // avoids any discrepancy from CSS flex rounding, offsetParent chains, or
    // intermediate element transforms.
    //
    // Camera convention: origin = block center, 1 world unit = 1 CSS pixel, Y axis up.
    //   worldX = (colLeft + cellW/2) - W/2
    //   worldY = -((itemTop + cellH/2) - H/2)  ← negate because DOM Y is down

    const GAP = 10; // must match the CSS gap and scroll-motion's this.gap

    // colWidth from col[0].offsetWidth (set by applyColumnWidths in panding-gallery.ts)
    const colWidth = this.columns[0]?.offsetWidth ?? 0;

    this.planes = [];
    const planesToLoad: Array<{ planeInfo: PlaneInfo; src: string; material: MeshBasicMaterial }> = [];

    for (let c = 0; c < this.columns.length; c++) {
      const col = this.columns[c];
      const items = col.children;
      const colLeft = c * (colWidth + GAP); // layout-space left edge of this column
      let itemTop = 0; // accumulates as we descend through items

      for (let i = 0; i < items.length; i++) {
        const el = items[i] as HTMLElement;
        // el IS the <picture> element — query the <img> directly inside it
        const img = el.querySelector<HTMLImageElement>('img');

        const cellW = colWidth; // pictures fill column width exactly
        const cellH = el.offsetHeight; // actual rendered height (aspect-ratio driven)

        // Camera origin = block center; Y axis flipped (Three.js Y up, DOM Y down)
        // 1 world unit = 1 CSS pixel
        const baseX = colLeft + cellW / 2 - W / 2;
        const baseY = -(itemTop + cellH / 2 - H / 2);

        const geometry = new PlaneGeometry(cellW, cellH, 8, 8);

        // Re-use the already-decoded browser image directly — avoids CORS and a
        // second network round-trip. needsUpdate = true flags Three.js to upload
        // it to the GPU on the first render.
        let material: MeshBasicMaterial;
        if (img && img.complete && img.naturalWidth > 0) {
          const tex = new Texture(img);
          tex.needsUpdate = true;
          material = new MeshBasicMaterial({ map: tex });
        } else if (img) {
          // Image not yet decoded — queue async load
          material = new MeshBasicMaterial({ transparent: true });
          planesToLoad.push({ planeInfo: null as unknown as PlaneInfo, src: img.src, material });
        } else {
          material = new MeshBasicMaterial({ transparent: true });
        }

        const mesh = new Mesh(geometry, material);
        mesh.position.set(baseX, baseY, 0);
        scene.add(mesh);

        const planeInfo: PlaneInfo = { mesh, baseX, baseY, colIndex: c, itemIndex: i };
        this.planes.push(planeInfo);

        // Fix the null placeholder now that planeInfo exists
        const queued = planesToLoad.at(-1);
        if (queued && queued.planeInfo === null) {
          queued.planeInfo = planeInfo;
        }

        // Advance vertical cursor (same formula as scroll-motion's totalColumnHeight)
        itemTop += cellH + GAP;
      }
    }

    // Async fallback for images not yet decoded at init time
    for (const { planeInfo, src } of planesToLoad) {
      const tmpImg = new Image();
      tmpImg.crossOrigin = 'anonymous';
      tmpImg.onload = () => {
        const tex = new Texture(tmpImg);
        tex.needsUpdate = true;
        (planeInfo.mesh.material as MeshBasicMaterial).map = tex;
        (planeInfo.mesh.material as MeshBasicMaterial).transparent = false;
        (planeInfo.mesh.material as MeshBasicMaterial).needsUpdate = true;
      };
      tmpImg.src = src;
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

    // Recompute base positions using the same structural arithmetic as init()
    const GAP = 10;
    const colWidth = this.columns[0]?.offsetWidth ?? 0;
    for (const plane of this.planes) {
      const col = this.columns[plane.colIndex];
      const el = col.children[plane.itemIndex] as HTMLElement | undefined;
      if (!el) continue;
      const cellW = colWidth;
      const cellH = el.offsetHeight;
      const colLeft = plane.colIndex * (colWidth + GAP);
      // itemTop: re-accumulate for this plane's item index
      let itemTop = 0;
      for (let j = 0; j < plane.itemIndex; j++) {
        const prev = col.children[j] as HTMLElement;
        itemTop += prev.offsetHeight + GAP;
      }
      plane.baseX = colLeft + cellW / 2 - W / 2;
      plane.baseY = -(itemTop + cellH / 2 - H / 2);
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

    // Update RGB-shift uniforms only when there is motion
    if (energy >= 0.001) {
      this.rgbShiftPass?.update(this.pointerUV, energy);
    } else {
      // Zero out energy so post-process pass is a no-op copy
      this.rgbShiftPass?.update(this.pointerUV, 0);
    }

    // Always render so textures appear even when the grid is stationary
    this.composer?.render();
  };
}
