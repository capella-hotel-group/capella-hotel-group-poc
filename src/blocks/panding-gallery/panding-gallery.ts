import { createOptimizedPicture } from '@/app/aem';
import { moveInstrumentation } from '@/app/scripts';

export default async function decorate(block: HTMLElement): Promise<void> {
  if (document.documentElement.classList.contains('hlx-editor')) return;

  const rows = [...block.querySelectorAll<HTMLElement>(':scope > div')];

  const galleryColumns: HTMLElement[] = [];
  const navItems: HTMLElement[] = [];

  rows.forEach((row) => {
    const cells = [...row.querySelectorAll<HTMLElement>(':scope > div')];
    const [imageCell, titleCell, subtitleCell, linkCell] = cells;

    const item = document.createElement('div');
    item.className = 'panding-gallery-item';
    moveInstrumentation(row, item);

    // Image column (parallax gallery strip)
    const colEl = document.createElement('div');
    colEl.className = 'panding-gallery-column';
    const pic = imageCell?.querySelector<HTMLPictureElement>('picture');
    if (pic) {
      const img = pic.querySelector<HTMLImageElement>('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '600' }]);
        moveInstrumentation(pic, optimized);
        pic.replaceWith(optimized);
      }
      colEl.append(pic);
    }
    galleryColumns.push(colEl);

    // Navigation overlay item
    const href = linkCell?.querySelector<HTMLAnchorElement>('a')?.href ?? '#';
    const navItem = document.createElement('a');
    navItem.className = 'panding-gallery-nav-item';
    navItem.href = href;

    const titleEl = document.createElement('span');
    titleEl.className = 'panding-gallery-nav-title';
    titleEl.innerHTML = titleCell?.innerHTML ?? '';

    const subtitleEl = document.createElement('span');
    subtitleEl.className = 'panding-gallery-nav-subtitle';
    subtitleEl.textContent = subtitleCell?.textContent?.trim() ?? '';

    navItem.append(titleEl, subtitleEl);
    item.append(navItem);
    navItems.push(item);
  });

  // Build gallery background
  const gallery = document.createElement('div');
  gallery.className = 'panding-gallery-columns';
  gallery.append(...galleryColumns);

  // Glass overlays
  const glassTop = document.createElement('div');
  glassTop.className = 'panding-gallery-glass panding-gallery-glass--top';

  const glassBottom = document.createElement('div');
  glassBottom.className = 'panding-gallery-glass panding-gallery-glass--bottom';

  // Navigation bar
  const nav = document.createElement('nav');
  nav.className = 'panding-gallery-nav';
  nav.setAttribute('aria-label', 'Gallery navigation');
  nav.append(...navItems);

  block.replaceChildren(gallery, glassTop, glassBottom, nav);

  // Parallax scroll animation
  const columns = [...block.querySelectorAll<HTMLElement>('.panding-gallery-column')];
  let ticking = false;

  const onScroll = (): void => {
    if (ticking) return;
    window.requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      columns.forEach((col, i) => {
        const direction = i % 2 === 0 ? 1 : -1;
        const speed = 0.08 + i * 0.02;
        col.style.transform = `translateY(${direction * scrollY * speed}px)`;
      });
      ticking = false;
    });
    ticking = true;
  };

  window.addEventListener('scroll', onScroll, { passive: true });
}
