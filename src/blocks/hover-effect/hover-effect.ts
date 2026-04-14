import { createOptimizedPicture } from '@/app/aem';
import { moveInstrumentation } from '@/app/scripts';

export default function decorate(block: HTMLElement): void {
  let logoEl: HTMLElement | null = null;
  const ul = document.createElement('ul');
  ul.className = 'hover-effect-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children] as HTMLElement[];

    // Logo row: hover-effect-logo model renders a single cell (just the image reference)
    if (cells.length === 1) {
      const div = document.createElement('div');
      div.className = 'hover-effect-logo';
      moveInstrumentation(row as HTMLElement, div);
      const picture = cells[0].querySelector<HTMLPictureElement>('picture');
      if (picture) {
        const img = picture.querySelector<HTMLImageElement>('img');
        if (img) {
          const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]);
          moveInstrumentation(picture, optimized);
          div.append(optimized);
        }
      }
      logoEl = div;
      return;
    }

    // Venue item row
    const [imageCell, labelCell, linkCell] = cells;

    const li = document.createElement('li');
    li.className = 'hover-effect-item';
    moveInstrumentation(row as HTMLElement, li);

    const anchor = document.createElement('a');
    anchor.className = 'hover-effect-link';
    const existingLink = linkCell?.querySelector<HTMLAnchorElement>('a');
    if (existingLink) {
      anchor.href = existingLink.href;
    }

    // Hover background layer (decorative)
    const bg = document.createElement('div');
    bg.className = 'hover-effect-item-bg';
    bg.setAttribute('aria-hidden', 'true');

    const picture = imageCell?.querySelector<HTMLPictureElement>('picture');
    if (picture) {
      const img = picture.querySelector<HTMLImageElement>('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
        moveInstrumentation(picture, optimized);
        bg.append(optimized);
      }
    }

    // Venue label
    const label = document.createElement('span');
    label.className = 'hover-effect-item-label';
    label.textContent = labelCell?.querySelector('p')?.textContent?.trim() ?? labelCell?.textContent?.trim() ?? '';

    anchor.append(bg, label);
    li.append(anchor);
    ul.append(li);
  });

  const inner = document.createElement('div');
  inner.className = 'hover-effect-inner';
  inner.append(ul);

  block.replaceChildren(inner);
  if (logoEl) block.append(logoEl);
}
