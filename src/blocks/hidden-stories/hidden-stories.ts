import { moveInstrumentation } from '@/app/scripts';
import { createOptimizedPicture } from '@/app/aem';

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children];

  const wrapper = document.createElement('div');
  wrapper.className = 'hidden-stories-inner';

  rows.forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell) return;

    if (cell.querySelector('picture')) {
      const figure = document.createElement('figure');
      figure.className = 'hidden-stories-image';
      moveInstrumentation(cell, figure);
      figure.append(...cell.children);
      wrapper.append(figure);
    } else {
      const body = document.createElement('div');
      body.className = 'hidden-stories-body';
      moveInstrumentation(cell, body);
      body.append(...cell.children);
      wrapper.append(body);
    }
  });

  wrapper.querySelectorAll<HTMLImageElement>('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '800' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture')?.replaceWith(optimized);
  });

  block.replaceChildren(wrapper);
}
