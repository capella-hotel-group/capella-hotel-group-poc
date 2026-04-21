import { getMetadata } from '@/app/aem';
import { loadFragment } from '@/blocks/fragment/fragment';
import { moveInstrumentation } from '@/app/scripts';

/**
 * Loads and decorates the footer block.
 * Finds all <ul> elements across fragment sections and renders them
 * as columns in a 3-column grid layout.
 */
export default async function decorate(block: HTMLElement): Promise<void> {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location.href).pathname : '/footer';

  const fragment = await loadFragment(footerPath);
  if (!fragment) return;

  // Collect all <ul> elements from every section in the fragment
  const lists = [...fragment.querySelectorAll<HTMLUListElement>('ul')];

  const inner = document.createElement('div');
  inner.className = 'footer-inner';

  lists.forEach((srcList) => {
    moveInstrumentation(srcList, inner);

    // First <li> with no <a> is treated as the column heading
    const items = [...srcList.querySelectorAll<HTMLLIElement>('li')];
    items.forEach((srcItem, i) => {
      const srcA = srcItem.querySelector<HTMLAnchorElement>('a');

      if (i === 0 && !srcA) {
        // Column heading
        const heading = document.createElement('p');
        heading.className = 'footer-col-heading';
        heading.textContent = srcItem.textContent?.trim() ?? '';
        moveInstrumentation(srcItem, heading);
        inner.append(heading);
      } else {
        // Regular link or text item
        const item = document.createElement('p');
        item.className = 'footer-item';
        moveInstrumentation(srcItem, item);

        if (srcA) {
          const a = document.createElement('a');
          a.href = srcA.href;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = srcA.textContent?.trim() ?? '';
          moveInstrumentation(srcA, a);
          item.append(a);
        } else {
          item.textContent = srcItem.textContent?.trim() ?? '';
        }

        inner.append(item);
      }
    });
  });

  block.replaceChildren(inner);
}
