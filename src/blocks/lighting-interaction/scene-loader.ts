import {
  BufferAttribute,
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
    new TextureLoader().load(url, resolve, undefined, reject);
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
    onResize: (newAspect: number) => {
      mesh.scale.x = newAspect;
      updateCoverUV(newAspect);
    },
  };
}
