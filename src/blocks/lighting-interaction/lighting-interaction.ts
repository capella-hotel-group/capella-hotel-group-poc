import { createOptimizedPicture } from '@/app/aem';
import { moveInstrumentation } from '@/app/scripts';

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.querySelectorAll<HTMLElement>(':scope > div')];
  const [backgroundRow, headingRow, taglineRow] = rows;

  // Background image
  const background = document.createElement('div');
  background.className = 'lighting-interaction-background';

  const pic = backgroundRow?.querySelector<HTMLPictureElement>('picture');
  if (pic) {
    const img = pic.querySelector<HTMLImageElement>('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, img.alt, true, [{ width: '1440' }]);
      moveInstrumentation(pic, optimized);
      background.append(optimized);
    }
  }

  // Content overlay
  const content = document.createElement('div');
  content.className = 'lighting-interaction-content';

  if (headingRow) {
    const headingCell = headingRow.querySelector<HTMLElement>(':scope > div');
    const heading = document.createElement('div');
    heading.className = 'lighting-interaction-heading';
    moveInstrumentation(headingRow, heading);
    if (headingCell) heading.append(...headingCell.childNodes);
    content.append(heading);
  }

  if (taglineRow) {
    const taglineCell = taglineRow.querySelector<HTMLElement>(':scope > div');
    const tagline = document.createElement('div');
    tagline.className = 'lighting-interaction-tagline';
    moveInstrumentation(taglineRow, tagline);
    if (taglineCell) tagline.append(...taglineCell.childNodes);
    content.append(tagline);
  }

  block.replaceChildren(background, content);
}
