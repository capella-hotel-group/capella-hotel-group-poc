import { moveInstrumentation } from '@/app/scripts';
import { createOptimizedPicture } from '@/app/aem';

export default async function decorate(block: HTMLElement): Promise<void> {
  const ul = document.createElement('ul');
  ul.className = 'hidden-stories-list';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'hidden-stories-item';
    moveInstrumentation(row, li);

    [...row.children].forEach((cell) => {
      if (cell.querySelector('picture')) {
        const figure = document.createElement('figure');
        figure.className = 'hidden-stories-item-image';
        figure.append(...cell.children);
        li.append(figure);
      } else {
        const body = document.createElement('div');
        body.className = 'hidden-stories-item-body';
        body.append(...cell.children);
        li.append(body);
      }
    });

    ul.append(li);
  });

  ul.querySelectorAll<HTMLImageElement>('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '800' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture')?.replaceWith(optimized);
  });

  block.replaceChildren(ul);
}
