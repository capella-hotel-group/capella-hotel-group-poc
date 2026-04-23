import { moveInstrumentation } from '@/app/scripts';
import { createOptimizedPicture } from '@/app/aem';

/**
 * Experimental 3-level block: cards-demo-3-lv > card-group > card-item.
 *
 * In production EDS the DOM arrives as a flat table of rows.
 * Group rows are identified by having a single text-only cell (the group name).
 * Card-item rows have an image cell + text cell (like standard cards).
 *
 * We scan sequentially: each group row starts a new <section>,
 * subsequent card-item rows are appended to that section until the next group.
 */
export default function decorate(block: HTMLElement): void {
  const rows = [...block.children] as HTMLElement[];
  const container = document.createElement('div');
  container.className = 'cards-demo-3-lv-container';

  let currentGroup: HTMLElement | null = null;
  let currentList: HTMLElement | null = null;

  rows.forEach((row) => {
    const cells = [...row.children] as HTMLElement[];
    const isGroupRow = cells.length === 1 && !cells[0].querySelector('picture');

    if (isGroupRow) {
      // ── Group header row ──
      currentGroup = document.createElement('section');
      currentGroup.className = 'cards-demo-3-lv-group';
      moveInstrumentation(row, currentGroup);

      const heading = document.createElement('h3');
      heading.className = 'cards-demo-3-lv-group-name';
      heading.textContent = cells[0].textContent?.trim() ?? '';
      currentGroup.append(heading);

      currentList = document.createElement('ul');
      currentList.className = 'cards-demo-3-lv-list';
      currentGroup.append(currentList);

      container.append(currentGroup);
    } else {
      // ── Card item row ──
      if (!currentList) {
        // Orphan items before first group — create a default group
        currentGroup = document.createElement('section');
        currentGroup.className = 'cards-demo-3-lv-group';
        currentList = document.createElement('ul');
        currentList.className = 'cards-demo-3-lv-list';
        currentGroup.append(currentList);
        container.append(currentGroup);
      }

      const li = document.createElement('li');
      li.className = 'cards-demo-3-lv-card';
      moveInstrumentation(row, li);

      cells.forEach((div) => {
        if (div.children.length === 1 && div.querySelector('picture')) {
          div.className = 'cards-demo-3-lv-card-image';
        } else {
          div.className = 'cards-demo-3-lv-card-body';
        }
      });
      while (row.firstElementChild) li.append(row.firstElementChild);

      currentList.append(li);
    }
  });

  // Optimize images
  container.querySelectorAll<HTMLImageElement>('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture')?.replaceWith(optimizedPic);
  });

  block.replaceChildren(container);
}
