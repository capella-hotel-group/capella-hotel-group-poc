import { createOptimizedPicture } from '@/app/aem';
import { moveInstrumentation } from '@/app/scripts';

export default function decorate(block: HTMLElement): void {
  const ul = document.createElement('ul');
  ul.className = 'hover-effect-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children] as HTMLElement[];
    const [imageCell, imageAltCell, labelCell, linkCell] = cells;

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
        const altText = imageAltCell?.textContent?.trim() ?? '';
        const optimized = createOptimizedPicture(img.src, altText, false, [{ width: '750' }]);
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

  block.replaceChildren(ul);
}
