import { moveInstrumentation } from '@/app/scripts';

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children] as HTMLElement[];

  // Item rows contain a <picture>. The remaining rows are the container config
  // fields, rendered in model order (the `classes` field is applied as a block
  // class, so it produces no row): configRows[0] = heading, [1] = showBackground.
  const itemRows = rows.filter((row) => row.querySelector('picture'));
  const configRows = rows.filter((row) => !row.querySelector('picture'));

  const headingText = configRows[0]?.textContent?.trim() ?? '';
  const showBackground = configRows[1]?.textContent?.trim() === 'true';

  // ----- Cards grid -----
  const grid = document.createElement('ul');
  grid.className = 'offer-suggestions-grid';

  itemRows.forEach((row) => {
    const cells = [...row.children] as HTMLElement[];
    const [imageCell, titleCell, descriptionCell, linkLabelCell, linkCell] = cells;

    const item = document.createElement('li');
    item.className = 'offer-suggestions-item';
    moveInstrumentation(row, item);

    // Image — AEM already applies the imageAlt value to the <img> alt attribute.
    const media = document.createElement('div');
    media.className = 'offer-suggestions-image';
    const picture = imageCell?.querySelector('picture');
    if (picture) media.append(picture);

    // Body — title, optional description, CTA.
    const body = document.createElement('div');
    body.className = 'offer-suggestions-body';

    const textWrap = document.createElement('div');
    textWrap.className = 'offer-suggestions-text';

    const titleText = titleCell?.textContent?.trim() ?? '';
    if (titleText) {
      const title = document.createElement('h3');
      title.className = 'offer-suggestions-title';
      title.textContent = titleText;
      textWrap.append(title);
    }

    // Optional richtext description — move the nodes to preserve formatting
    // (no innerHTML assignment needed).
    if (descriptionCell?.textContent?.trim()) {
      const description = document.createElement('div');
      description.className = 'offer-suggestions-description';
      description.append(...descriptionCell.childNodes);
      textWrap.append(description);
    }

    body.append(textWrap);

    const linkHref = linkCell?.querySelector('a')?.getAttribute('href');
    if (linkHref) {
      const cta = document.createElement('a');
      cta.className = 'offer-suggestions-cta';
      cta.href = linkHref;
      cta.textContent = linkLabelCell?.textContent?.trim() || 'View this Package';
      body.append(cta);
    }

    item.append(media, body);
    grid.append(item);
  });

  // ----- Assemble -----
  const elements: HTMLElement[] = [];
  if (headingText) {
    const heading = document.createElement('h2');
    heading.className = 'offer-suggestions-heading';
    heading.textContent = headingText;
    elements.push(heading);
  }
  elements.push(grid);

  block.classList.toggle('offer-suggestions--has-background', showBackground);
  block.replaceChildren(...elements);
}
