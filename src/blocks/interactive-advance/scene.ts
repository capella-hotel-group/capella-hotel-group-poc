import {
    AmbientLight,
    BoxGeometry,
    DirectionalLight,
    Mesh,
    MeshStandardMaterial,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
} from 'three';

export interface SceneConfig {
    // Extensible: add fields here as the scene grows, e.g.:
    // modelSrc?: string;
    // backgroundColor?: number;
    // cameraPosition?: [number, number, number];
    [key: string]: never;
}

let animationId: number | null = null;
let resizeObserver: ResizeObserver | null = null;

export function cleanupScene(): void {
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }
}

export async function initScene(canvas: HTMLCanvasElement, _config: SceneConfig): Promise<void> {
    const renderer = new WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    const scene = new Scene();

    const camera = new PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 3);

    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshStandardMaterial({ color: 0xc9a96e, roughness: 0.4, metalness: 0.3 });
    const cube = new Mesh(geometry, material);
    scene.add(cube);

    const ambientLight = new AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    function animate() {
        animationId = requestAnimationFrame(animate);
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.008;
        renderer.render(scene, camera);
    }

    resizeObserver = new ResizeObserver(() => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    });
    resizeObserver.observe(canvas.parentElement ?? canvas);

    animate();
}
