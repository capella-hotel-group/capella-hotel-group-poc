import { createOptimizedPicture } from '@/app/aem';
import { moveInstrumentation } from '@/app/scripts';
import { isUniversalEditor } from '@/utils/env';
import { PointerTooltip } from './pointer-tooltip';

const COLS = 5;
const MAX_IMAGES = 20;
const VISIBLE_COLS = 3.2;
const GAP = 10; // matches var(--spacing-xs, 10px)

export default async function decorate(block: HTMLElement): Promise<void> {
  // In the Universal Editor the raw DOM is sufficient for authoring;
  // skip the heavy WebGL / scroll-interaction setup to avoid rendering errors.
  if (isUniversalEditor()) return;
  const rows = [...block.querySelectorAll<HTMLElement>(':scope > div')];

  // xwalk container blocks: block-level properties are each in their own single-cell
  // row BEFORE child item rows (per AEM EDS content-modeling docs on container blocks).
  // Model field order: inputMode [0], immersiveMode [1], deformRadius [2], deformStrength [3]
  const NUM_CONFIG_ROWS = 4;
  const [inputModeRow, immersiveModeRow, deformRadiusRow, deformStrengthRow] = rows;

  const inputMode: 'scroll' | 'pointer' =
    inputModeRow?.querySelector<HTMLElement>(':scope > div')?.textContent?.trim() === 'pointer' ? 'pointer' : 'scroll';

  const immersiveMode = immersiveModeRow?.querySelector<HTMLElement>(':scope > div')?.textContent?.trim() === 'true';

  const deformRadius = Number(deformRadiusRow?.querySelector<HTMLElement>(':scope > div')?.textContent?.trim()) || 200;
  const deformStrength =
    Number(deformStrengthRow?.querySelector<HTMLElement>(':scope > div')?.textContent?.trim()) || 40;

  // --- Phase 1: Build static grid synchronously ---
  const imageRows = rows.slice(NUM_CONFIG_ROWS, NUM_CONFIG_ROWS + MAX_IMAGES);
  const columns: HTMLElement[] = [];
  for (let c = 0; c < COLS; c++) {
    const col = document.createElement('div');
    col.className = 'panding-gallery-column';
    columns.push(col);
  }

  imageRows.forEach((row, i) => {
    const col = columns[i % COLS];
    const pic = row.querySelector<HTMLPictureElement>('picture');
    if (pic) {
      const img = pic.querySelector<HTMLImageElement>('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, img.alt, true, [{ width: '600' }]);
        moveInstrumentation(pic, optimized);
        col.append(optimized);
      }
    }
  });

  const columnsContainer = document.createElement('div');
  columnsContainer.className = 'panding-gallery-columns';
  columnsContainer.append(...columns);

  // Glass overlays
  const glassTop = document.createElement('div');
  glassTop.className = 'panding-gallery-glass panding-gallery-glass--top';
  const glassBottom = document.createElement('div');
  glassBottom.className = 'panding-gallery-glass panding-gallery-glass--bottom';

  // Navigation overlay (keep original nav items if present)
  const navItems = imageRows
    .map((row) => {
      const cells = [...row.querySelectorAll<HTMLElement>(':scope > div')];
      const titleCell = cells[1]; // second cell: title
      const subtitleCell = cells[2]; // third cell: subtitle
      const linkCell = cells[3]; // fourth cell: link
      if (!titleCell) return null;

      const link = linkCell?.querySelector<HTMLAnchorElement>('a');
      const navItem = document.createElement(link ? 'a' : 'div');
      navItem.className = 'panding-gallery-nav-item';
      if (link && navItem instanceof HTMLAnchorElement) {
        navItem.href = link.href;
      }

      const title = document.createElement('span');
      title.className = 'panding-gallery-nav-title';
      title.append(...titleCell.childNodes);
      navItem.append(title);

      if (subtitleCell?.textContent?.trim()) {
        const subtitle = document.createElement('span');
        subtitle.className = 'panding-gallery-nav-subtitle';
        subtitle.textContent = subtitleCell.textContent.trim();
        navItem.append(subtitle);
      }

      return navItem;
    })
    .filter(Boolean);

  let nav: HTMLElement | null = null;
  if (navItems.length > 0) {
    nav = document.createElement('nav');
    nav.className = 'panding-gallery-nav';
    nav.append(...(navItems as HTMLElement[]));
  }

  // Tooltip
  const children: Node[] = [columnsContainer, glassTop, glassBottom];
  if (nav) children.push(nav);
  block.replaceChildren(...children);

  // --- Compute column widths ---
  function applyColumnWidths(): void {
    const containerW = block.clientWidth;
    const colWidth = (containerW - GAP * (COLS - 1)) / VISIBLE_COLS;
    block.style.setProperty('--pg-col-width', `${colWidth}px`);
    for (const col of columns) {
      col.style.width = `${colWidth}px`;
    }
  }
  applyColumnWidths();

  const ro = new ResizeObserver(() => applyColumnWidths());
  ro.observe(block);

  // --- Tooltip: follows pointer with lerp, fades on scroll ---
  const tooltip = new PointerTooltip(block, 'SCROLL OR CLICK');
  const tooltipObserver = new MutationObserver(() => {
    if (!document.contains(block)) {
      tooltip.destroy();
      tooltipObserver.disconnect();
    }
  });
  tooltipObserver.observe(document.body, { childList: true, subtree: true });

  // --- Phase 2: interactive scroll layer on click ---
  let initialized = false;

  block.addEventListener('click', async () => {
    if (initialized) return;
    initialized = true;

    block.classList.add('panding-gallery--loading');

    try {
      const { ScrollMotionController } = await import('./scroll-motion');
      const controller = new ScrollMotionController({
        block,
        columns,
        inputMode,
      });
      controller.start();

      // --- Immersive mode: mount Three.js scene over the DOM grid ---
      if (immersiveMode) {
        const { ImmersiveScene } = await import('./immersive-scene');
        const scene = new ImmersiveScene({
          block,
          columns,
          controller,
          deformRadius,
          deformStrength,
        });
        await scene.init();
        scene.start();

        const motionObserver = new MutationObserver(() => {
          if (!document.contains(block)) {
            scene.cleanup();
            controller.cleanup();
            motionObserver.disconnect();
          }
        });
        motionObserver.observe(document.body, { childList: true, subtree: true });
      } else {
        const motionObserver = new MutationObserver(() => {
          if (!document.contains(block)) {
            controller.cleanup();
            motionObserver.disconnect();
          }
        });
        motionObserver.observe(document.body, { childList: true, subtree: true });
      }

      block.classList.remove('panding-gallery--loading');
      block.classList.add('panding-gallery--active');
    } catch (err) {
      console.error('panding-gallery: failed to start scroll-motion', err);
      initialized = false;
      block.classList.remove('panding-gallery--loading');
      // Restore columns visibility in case immersive mount partially ran
      const colsCont = block.querySelector<HTMLElement>('.panding-gallery-columns');
      if (colsCont) colsCont.style.visibility = '';
    }
  });
}
