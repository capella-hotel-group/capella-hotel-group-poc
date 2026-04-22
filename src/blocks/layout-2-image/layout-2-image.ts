export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children] as HTMLElement[];

  // Row 0: [heading, headingType] — 2 cells
  // Row 1: subtitle
  // Row 2: imageLarge (picture)
  // Row 3: imageSmall (picture)
  // Row 4: body (richtext)
  // Row 5: [cta, ctaText] — 2 cells

  const headingCells = [...rows[0].children] as HTMLElement[];
  const headingText = headingCells[0]?.textContent?.trim() ?? '';
  const headingType = (headingCells[1]?.textContent?.trim() ?? 'h2') as 'h1' | 'h2' | 'h3';

  const subtitleP = rows[1]?.querySelector<HTMLParagraphElement>('p');
  const imageLargePic = rows[2]?.querySelector<HTMLElement>('picture');
  const imageSmallPic = rows[3]?.querySelector<HTMLElement>('picture');
  const bodyRichtext = rows[4]?.querySelector<HTMLElement>('div');

  const ctaCells = [...(rows[5]?.children ?? [])] as HTMLElement[];
  const ctaAnchor = ctaCells[0]?.querySelector<HTMLAnchorElement>('a');
  const ctaText = ctaCells[1]?.textContent?.trim() ?? '';

  // — Title zone —
  const titleZone = document.createElement('div');
  titleZone.className = 'layout-2-image-title';
  const heading = document.createElement(headingType);
  heading.className = 'layout-2-image-heading';
  heading.textContent = headingText;
  titleZone.append(heading);

  // — Content zone —
  const contentZone = document.createElement('div');
  contentZone.className = 'layout-2-image-content';

  if (subtitleP) {
    const subtitle = document.createElement('div');
    subtitle.className = 'layout-2-image-subtitle';
    subtitle.textContent = subtitleP.textContent?.trim() ?? '';
    contentZone.append(subtitle);
  }

  if (imageLargePic) {
    const large = document.createElement('div');
    large.className = 'layout-2-image-image-large';
    large.append(imageLargePic);
    contentZone.append(large);
  }

  if (imageSmallPic) {
    const small = document.createElement('div');
    small.className = 'layout-2-image-image-small';
    small.append(imageSmallPic);
    contentZone.append(small);
  }

  if (bodyRichtext) {
    const body = document.createElement('div');
    body.className = 'layout-2-image-body';
    body.append(...bodyRichtext.childNodes);
    contentZone.append(body);
  }

  if (ctaAnchor) {
    const linkWrap = document.createElement('div');
    linkWrap.className = 'layout-2-image-link';
    ctaAnchor.className = 'layout-2-image-cta';
    ctaAnchor.textContent = ctaText || ctaAnchor.textContent?.trim() || 'DISCOVER MORE';
    linkWrap.append(ctaAnchor);
    contentZone.append(linkWrap);
  }

  // — Inner wrapper —
  const inner = document.createElement('div');
  inner.className = 'layout-2-image-inner';
  inner.append(titleZone, contentZone);

  block.replaceChildren(inner);
}
