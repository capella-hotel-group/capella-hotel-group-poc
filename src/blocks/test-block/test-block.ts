import { moveInstrumentation } from '@/app/scripts';

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.querySelectorAll<HTMLElement>(':scope > div')];

  const list = document.createElement('ul');
  list.className = 'test-block-list';

  rows.forEach((row) => {
    const [labelCell, linkCell, imageCell] = [...row.querySelectorAll<HTMLElement>(':scope > div')];

    const anchor = linkCell?.querySelector<HTMLAnchorElement>('a');
    const picture = imageCell?.querySelector<HTMLPictureElement>('picture');
    const labelText = labelCell?.textContent?.trim() ?? '';

    const item = document.createElement('li');
    item.className = 'test-block-item';

    const link = document.createElement('a');
    link.className = 'test-block-link';
    if (anchor?.href) {
      link.href = anchor.href;
    }

    const label = document.createElement('span');
    label.className = 'test-block-label';
    label.textContent = labelText;
    link.append(label);

    if (picture) {
      const pill = document.createElement('span');
      pill.className = 'test-block-image-pill';
      moveInstrumentation(imageCell, pill);
      pill.append(picture);
      link.append(pill);
    }

    moveInstrumentation(row, item);
    item.append(link);
    list.append(item);
  });

  block.replaceChildren(list);
}
