import { createOptimizedPicture } from '@/app/aem';
import { moveInstrumentation } from '@/app/scripts';
import { PointerTooltip } from './pointer-tooltip';

const COLS = 5;
const MAX_IMAGES = 20;
const VISIBLE_COLS = 3.2;
const GAP = 10; // matches var(--spacing-xs, 10px)

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.querySelectorAll<HTMLElement>(':scope > div')];

  // --- Parse input mode from second row (or default "scroll") ---
  const configRow = rows.length > MAX_IMAGES ? rows[MAX_IMAGES] : null;
  const inputMode: 'scroll' | 'pointer' =
    configRow?.querySelector<HTMLElement>(':scope > div')?.textContent?.trim() === 'pointer' ? 'pointer' : 'scroll';

  // --- Phase 1: Build static grid synchronously ---
  const imageRows = rows.slice(0, MAX_IMAGES);
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
  const navItems = rows
    .slice(0, MAX_IMAGES)
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
  new PointerTooltip(block, 'SCROLL OR CLICK');

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
      block.classList.remove('panding-gallery--loading');
      block.classList.add('panding-gallery--active');
    } catch (err) {
      console.error('panding-gallery: failed to start scroll-motion', err);
      initialized = false;
      block.classList.remove('panding-gallery--loading');
    }
  });
}
