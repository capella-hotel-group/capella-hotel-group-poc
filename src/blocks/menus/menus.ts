import { moveInstrumentation } from '@/app/scripts';
import { createOptimizedPicture } from '@/app/aem';

export default function decorate(block: HTMLElement): void {
  const ul = document.createElement('ul');
  ul.className = 'menus-list';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'menus-item';
    moveInstrumentation(row, li);

    const cols = row.querySelectorAll<HTMLElement>(':scope > div');
    if (cols.length < 3) return;

    // Text
    const textCol = cols[0];
    const text = textCol.textContent?.trim() || '';
    const textEl = document.createElement('span');
    textEl.className = 'menus-text';
    textEl.textContent = text;
    moveInstrumentation(textCol, textEl);
    li.append(textEl);

    // Link
    const linkCol = cols[1];
    const linkUrl = linkCol.textContent?.trim() || '';
    const linkEl = document.createElement('a');
    linkEl.className = 'menus-link';
    linkEl.href = linkUrl;
    linkEl.setAttribute('aria-label', text || 'Menu link');
    moveInstrumentation(linkCol, linkEl);
    li.append(linkEl);

    // Image
    const imageCol = cols[2];
    const picture = imageCol.querySelector<HTMLImageElement>('picture > img');
    if (picture) {
      const optimizedPic = createOptimizedPicture(picture.src, picture.alt || text, false, [
        { width: '300' }
      ]);
      optimizedPic.className = 'menus-image';
      moveInstrumentation(imageCol, optimizedPic);
      li.append(optimizedPic);
    }

    ul.append(li);
  });

  block.replaceChildren(ul);
}
