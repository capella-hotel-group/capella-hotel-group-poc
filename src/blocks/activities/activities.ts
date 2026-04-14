import { moveInstrumentation } from '@/app/scripts';

export default async function decorate(block: HTMLElement): Promise<void> {
  const ul = document.createElement('ul');
  ul.className = 'activities-list';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'activities-item';
    moveInstrumentation(row, li);

    [...row.children].forEach((cell, idx) => {
      if (idx === 0 && cell.querySelector('picture')) {
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'activities-item-image';
        imageWrapper.append(...cell.children);
        li.append(imageWrapper);
      } else {
        const body = document.createElement('div');
        body.className = 'activities-item-body';
        body.append(...cell.children);
        li.append(body);
      }
    });

    ul.append(li);
  });

  block.replaceChildren(ul);
}
