import { createOptimizedPicture } from '@/app/aem';
import { moveInstrumentation } from '@/app/scripts';
import { debugConfig } from './debug-config';
import type { SceneConfig } from './scene';

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.querySelectorAll<HTMLElement>(':scope > div')];
  const [backgroundRow, headingRow, taglineRow, advanceRow, decorLeftRow, decorRightRow, foregroundRow] = rows;

  // Background image
  const background = document.createElement('div');
  background.className = 'lighting-interaction-background';

  let imageUrl = '';
  const pic = backgroundRow?.querySelector<HTMLPictureElement>('picture');
  if (pic) {
    const img = pic.querySelector<HTMLImageElement>('img');
    if (img) {
      imageUrl = img.src;
      const optimized = createOptimizedPicture(img.src, img.alt, true, [{ width: '1440' }]);
      moveInstrumentation(pic, optimized);
      background.append(optimized);
    }
  }

  // Canvas for the 3D scene (hidden until activated)
  const canvas = document.createElement('canvas');
  canvas.className = 'lighting-interaction-canvas';

  // Content overlay
  const content = document.createElement('div');
  content.className = 'lighting-interaction-content';

  if (headingRow) {
    const headingCell = headingRow.querySelector<HTMLElement>(':scope > div');
    const heading = document.createElement('div');
    heading.className = 'lighting-interaction-heading';
    moveInstrumentation(headingRow, heading);
    if (headingCell) heading.append(...headingCell.childNodes);
    content.append(heading);
  }

  if (taglineRow) {
    const taglineCell = taglineRow.querySelector<HTMLElement>(':scope > div');
    const tagline = document.createElement('div');
    tagline.className = 'lighting-interaction-tagline';
    moveInstrumentation(taglineRow, tagline);
    if (taglineCell) tagline.append(...taglineCell.childNodes);
    content.append(tagline);
  }

  // DOM stack: background (z=0) → canvas (z=0, above bg by DOM order) → ::before (z=1) → content (z=2)
  block.replaceChildren(background, canvas, content);

  // No image means no 3D scene to load
  if (!imageUrl) return;

  // --- Advance mode: read flag and overlay image URLs ---
  const cmsAdvanceText = advanceRow?.querySelector<HTMLElement>(':scope > div')?.textContent?.trim();
  const advance = debugConfig.advance ?? cmsAdvanceText === 'true';
  const decorLeftUrl = decorLeftRow?.querySelector<HTMLImageElement>('img')?.src;
  const decorRightUrl = decorRightRow?.querySelector<HTMLImageElement>('img')?.src;
  const foregroundUrl = foregroundRow?.querySelector<HTMLImageElement>('img')?.src;

  let initialized = false;

  block.addEventListener('click', async () => {
    if (initialized) return;
    initialized = true;

    block.classList.add('lighting-interaction--loading');

    try {
      const { initScene } = await import('./scene');
      const sceneConfig: SceneConfig = {
        imageUrl,
        advance,
        decorLeftUrl,
        decorRightUrl,
        foregroundUrl,
        headingEl: block.querySelector<HTMLElement>('.lighting-interaction-heading'),
        taglineEl: block.querySelector<HTMLElement>('.lighting-interaction-tagline'),
      };
      await initScene(canvas, sceneConfig);
      block.classList.remove('lighting-interaction--loading');
      block.classList.add('lighting-interaction--active');
    } catch (err) {
      console.error('lighting-interaction: failed to start scene', err);
      // Reset so the user can retry
      initialized = false;
      block.classList.remove('lighting-interaction--loading');
    }
  });
}
