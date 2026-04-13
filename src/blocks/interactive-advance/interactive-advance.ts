import './interactive-advance.css';
import { createOptimizedPicture } from '@/app/aem';
import type { SceneConfig } from './scene';

export default async function decorate(block: HTMLElement): Promise<void> {
    const rows = [...block.children] as HTMLElement[];

    // Row 0: placeholder-text (authored as text in the first cell)
    const placeholderText =
        rows[0]?.querySelector<HTMLElement>('p, div')?.textContent?.trim() ?? 'Explore in 3D';

    // Row 1: placeholder-image (authored as an <img> in the second row)
    const sourceImg = rows[1]?.querySelector<HTMLImageElement>('img');

    // --- Build placeholder ---
    const placeholderEl = document.createElement('div');
    placeholderEl.className = 'interactive-advance-placeholder';

    if (sourceImg) {
        const optimizedPic = createOptimizedPicture(sourceImg.src, sourceImg.alt, false, [
            { width: '1200' },
            { media: '(width >= 900px)', width: '1600' },
        ]);
        placeholderEl.append(optimizedPic);
    }

    const ctaSpan = document.createElement('span');
    ctaSpan.className = 'interactive-advance-placeholder-cta';
    ctaSpan.textContent = placeholderText;
    placeholderEl.append(ctaSpan);

    // --- Build canvas (hidden via CSS until scene ready) ---
    const canvasEl = document.createElement('canvas');
    canvasEl.className = 'interactive-advance-canvas';

    // Atomic DOM swap
    block.replaceChildren(placeholderEl, canvasEl);

    // --- Lazy-load Three.js on click ---
    let initialized = false;

    placeholderEl.addEventListener(
        'click',
        async () => {
            if (initialized) return;
            initialized = true;

            placeholderEl.classList.add('interactive-advance-placeholder-loading');

            try {
                const { initScene } = await import('./scene');
                const config: SceneConfig = {};
                await initScene(canvasEl, config);
                placeholderEl.classList.add('interactive-advance-placeholder-hidden');
            } catch (error) {
                console.error('interactive-advance: failed to load scene', error);
                // Reset so user can try again
                initialized = false;
                placeholderEl.classList.remove('interactive-advance-placeholder-loading');
            }
        },
        { once: true },
    );
}
