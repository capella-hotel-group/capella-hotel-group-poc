import {
  BufferAttribute,
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three';

export interface OverlayLayer {
  mesh: Mesh;
  posAttr: BufferAttribute;
  restX: Float32Array;
  restY: Float32Array;
  vertCount: number;
  dispX: Float32Array;
  dispY: Float32Array;
  borderMask: Float32Array;
  onResize: (newAspect: number) => void;
}

export interface HeadlinePlane {
  mesh: Mesh;
  posAttr: BufferAttribute;
  restX: Float32Array;
  restY: Float32Array;
  restZ: Float32Array;
  vertCount: number;
  dispX: Float32Array;
  dispY: Float32Array;
  dispZ: Float32Array;
  borderMask: Float32Array;
  hasActiveDisplacement: boolean;
  texture: CanvasTexture;
  repaint: () => void;
  onResize: (newAspect: number) => void;
}

export interface BackgroundTextureResult {
  texture: Texture;
  imgAspect: number;
  updateCoverUV: (canvasAspect: number) => void;
}

/**
 * Loads a texture from `url` and returns it together with a cover-UV updater.
 * The updater adjusts `texture.repeat`/`offset` so the image behaves like
 * CSS `object-fit: cover` at the given canvas aspect ratio.
 */
export async function loadTextureCoverUV(url: string): Promise<BackgroundTextureResult> {
  const texture = await new Promise<Texture>((resolve, reject) => {
    const loader = new TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(url, resolve, undefined, reject);
  });

  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;

  const rawImg = texture.image as HTMLImageElement;
  const imgAspect = rawImg.naturalWidth > 0 ? rawImg.naturalWidth / rawImg.naturalHeight : 1;

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

  return { texture, imgAspect, updateCoverUV };
}

/**
 * Loads a transparent overlay plane, adds it to the Three.js scene, and returns
 * its animation state as an `OverlayLayer`.
 *
 * @param url         Image URL (expected to be a transparent PNG).
 * @param threeScene  The Three.js scene to add the mesh to.
 * @param initAspect  Initial canvas aspect ratio (W/H).
 * @param renderOrder Draw order (background=0, decor-left=1, decor-right=2, foreground=3).
 * @param wireframe   When `true`, the material renders as wireframe.
 */
export async function loadOverlayPlane(
  url: string,
  threeScene: Scene,
  initAspect: number,
  renderOrder: number,
  wireframe = false,
): Promise<OverlayLayer> {
  const { texture, imgAspect, updateCoverUV } = await loadTextureCoverUV(url);

  updateCoverUV(initAspect);

  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    wireframe,
  });

  const geometry = new PlaneGeometry(2, 2, 32, 32);
  const posAttr = geometry.attributes.position as BufferAttribute;
  const vertCount = posAttr.count;

  const restX = new Float32Array(vertCount);
  const restY = new Float32Array(vertCount);
  for (let i = 0; i < vertCount; i++) {
    restX[i] = posAttr.getX(i);
    restY[i] = posAttr.getY(i);
  }

  // Build borderMask: 0 for outer-edge vertices, 1 for interior vertices.
  // Outer-edge vertices are pinned to zero displacement to prevent viewport coverage gaps.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < vertCount; i++) {
    if (restX[i] < minX) minX = restX[i];
    if (restX[i] > maxX) maxX = restX[i];
    if (restY[i] < minY) minY = restY[i];
    if (restY[i] > maxY) maxY = restY[i];
  }
  const borderMask = new Float32Array(vertCount);
  for (let i = 0; i < vertCount; i++) {
    borderMask[i] =
      restX[i] === minX || restX[i] === maxX || restY[i] === minY || restY[i] === maxY ? 0 : 1;
  }

  const dispX = new Float32Array(vertCount);
  const dispY = new Float32Array(vertCount);

  const mesh = new Mesh(geometry, material);
  mesh.scale.x = initAspect;
  mesh.renderOrder = renderOrder;

  // Suppress TypeScript's imgAspect unused warning — it's used inside updateCoverUV closure.
  void imgAspect;

  threeScene.add(mesh);

  return {
    mesh,
    posAttr,
    restX,
    restY,
    vertCount,
    dispX,
    dispY,
    borderMask,
    onResize: (newAspect: number) => {
      mesh.scale.x = newAspect;
      updateCoverUV(newAspect);
    },
  };
}

// ---- Headline canvas-texture plane ----

/**
 * Reads the computed text style (font, color) and screen position of a DOM element,
 * returning canvas-space rendering info.
 */
function getTextRenderInfo(
  el: HTMLElement,
  containerRect: DOMRect,
  dpr: number,
): { y: number; font: string; color: string; textContent: string } {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const fontSize = parseFloat(style.fontSize);
  const fontFamily = style.fontFamily;
  const fontWeight = style.fontWeight;
  const color = style.color;
  const font = `${fontWeight} ${fontSize * dpr}px ${fontFamily}`;
  const y = (rect.top - containerRect.top + rect.height / 2) * dpr;
  const textContent = el.textContent?.trim() ?? '';
  return { y, font, color, textContent };
}

/**
 * Creates a Three.js plane at renderOrder=4 whose material is a CanvasTexture
 * that composites the block's heading and tagline text at the correct on-screen position.
 * The plane responds to pointer displacement using the standard Gaussian model.
 *
 * Returns `null` if both elements are absent or empty.
 */
export function createHeadlinePlane(
  headingEl: HTMLElement | null,
  taglineEl: HTMLElement | null,
  threeScene: Scene,
  container: Element,
  initAspect: number,
): HeadlinePlane | null {
  const headingText = headingEl?.textContent?.trim() ?? '';
  const taglineText = taglineEl?.textContent?.trim() ?? '';
  if (!headingText && !taglineText) return null;

  const dpr = window.devicePixelRatio;
  const W = container.clientWidth;
  const H = container.clientHeight;

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = W * dpr;
  offscreenCanvas.height = H * dpr;
  const ctx = offscreenCanvas.getContext('2d')!;

  const canvasTexture = new CanvasTexture(offscreenCanvas);
  canvasTexture.colorSpace = SRGBColorSpace;

  function repaint(): void {
    const cW = offscreenCanvas.width;
    const cH = offscreenCanvas.height;
    ctx.clearRect(0, 0, cW, cH);

    const containerRect = container.getBoundingClientRect();
    const centerX = cW / 2;

    if (headingEl && headingEl.textContent?.trim()) {
      const info = getTextRenderInfo(headingEl, containerRect, dpr);
      ctx.font = info.font;
      ctx.fillStyle = info.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = info.textContent.split(/\n/);
      const lineHeight = parseFloat(info.font) * 1.1;
      const startY = info.y - ((lines.length - 1) * lineHeight) / 2;
      for (let l = 0; l < lines.length; l++) {
        ctx.fillText(lines[l], centerX, startY + l * lineHeight);
      }
    }

    if (taglineEl && taglineEl.textContent?.trim()) {
      const info = getTextRenderInfo(taglineEl, containerRect, dpr);
      ctx.font = info.font;
      ctx.fillStyle = info.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = info.textContent.split(/\n/);
      const lineHeight = parseFloat(info.font) * 1.3;
      const startY = info.y - ((lines.length - 1) * lineHeight) / 2;
      for (let l = 0; l < lines.length; l++) {
        ctx.fillText(lines[l], centerX, startY + l * lineHeight);
      }
    }

    canvasTexture.needsUpdate = true;
  }

  const material = new MeshBasicMaterial({
    map: canvasTexture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const geometry = new PlaneGeometry(2, 2, 64, 64);
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

  let minHX = Infinity;
  let maxHX = -Infinity;
  let minHY = Infinity;
  let maxHY = -Infinity;
  for (let i = 0; i < vertCount; i++) {
    if (restX[i] < minHX) minHX = restX[i];
    if (restX[i] > maxHX) maxHX = restX[i];
    if (restY[i] < minHY) minHY = restY[i];
    if (restY[i] > maxHY) maxHY = restY[i];
  }
  const borderMask = new Float32Array(vertCount);
  for (let i = 0; i < vertCount; i++) {
    borderMask[i] =
      restX[i] === minHX || restX[i] === maxHX || restY[i] === minHY || restY[i] === maxHY ? 0 : 1;
  }

  const dispX = new Float32Array(vertCount);
  const dispY = new Float32Array(vertCount);
  const dispZ = new Float32Array(vertCount);

  const mesh = new Mesh(geometry, material);
  mesh.scale.x = initAspect;
  mesh.renderOrder = 4;
  threeScene.add(mesh);

  repaint();

  const hl: HeadlinePlane = {
    mesh,
    posAttr,
    restX,
    restY,
    restZ,
    vertCount,
    dispX,
    dispY,
    dispZ,
    borderMask,
    hasActiveDisplacement: false,
    texture: canvasTexture,
    repaint,
    onResize: (newAspect: number) => {
      mesh.scale.x = newAspect;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      offscreenCanvas.width = newW * dpr;
      offscreenCanvas.height = newH * dpr;
      repaint();
    },
  };

  return hl;
}
