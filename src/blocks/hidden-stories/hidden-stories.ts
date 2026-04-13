import { moveInstrumentation } from '@/app/scripts';
import { createOptimizedPicture } from '@/app/aem';

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children];

  const wrapper = document.createElement('div');
  wrapper.className = 'hidden-stories-inner';

  rows.forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell) return;

    const anchor = cell.querySelector<HTMLAnchorElement>('a[href]');
    const picture = cell.querySelector('picture');

    if (anchor && !picture) {
      // video row
      const videoWrapper = document.createElement('div');
      videoWrapper.className = 'hidden-stories-video';
      moveInstrumentation(cell, videoWrapper);
      videoWrapper.append(...cell.children);
      wrapper.append(videoWrapper);
    } else if (picture) {
      // image row
      const figure = document.createElement('figure');
      figure.className = 'hidden-stories-image';
      moveInstrumentation(cell, figure);
      figure.append(...cell.children);
      wrapper.append(figure);
    }
  });

  wrapper.querySelectorAll<HTMLImageElement>('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '800' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture')?.replaceWith(optimized);
  });

  block.replaceChildren(wrapper);
}
