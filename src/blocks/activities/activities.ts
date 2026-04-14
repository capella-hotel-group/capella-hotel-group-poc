import { moveInstrumentation } from '@/app/scripts';
import { resolveDAMUrl } from '@/utils/env';

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children] as HTMLElement[];

  // First row: block-level data (backgroundVideo link)
  const blockRow = rows[0];
  const videoSrc = blockRow?.querySelector<HTMLAnchorElement>('a')?.href ?? '';

  // Remaining rows: activity items
  const itemRows = rows.slice(1);

  const container = document.createElement('div');
  container.className = 'activities-container';

  if (videoSrc) {
    const video = document.createElement('video');
    video.className = 'activities-bg-video';
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');

    const source = document.createElement('source');
    source.src = resolveDAMUrl(videoSrc);
    video.append(source);
    container.append(video);
  }

  const overlay = document.createElement('div');
  overlay.className = 'activities-overlay';
  container.append(overlay);

  if (itemRows.length > 0) {
    const grid = document.createElement('ul');
    grid.className = 'activities-grid';

    itemRows.forEach((row) => {
      const li = document.createElement('li');
      li.className = 'activities-item';
      moveInstrumentation(row, li);

      const picture = row.querySelector('picture');
      if (picture) {
        const imageWrap = document.createElement('div');
        imageWrap.className = 'activities-item-image';
        imageWrap.append(picture);
        li.append(imageWrap);
      }

      // Text: all non-picture cell content
      const textCells = [...row.children] as HTMLElement[];
      textCells.forEach((cell) => {
        if (!cell.querySelector('picture') && cell.textContent?.trim()) {
          const textWrap = document.createElement('div');
          textWrap.className = 'activities-item-text';
          textWrap.append(...cell.childNodes);
          li.append(textWrap);
        }
      });

      grid.append(li);
    });

    container.append(grid);
  }

  block.replaceChildren(container);
}
