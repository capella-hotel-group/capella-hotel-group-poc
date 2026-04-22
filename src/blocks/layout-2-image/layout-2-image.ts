export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children] as HTMLElement[];

  // Row 0: heading
  // Row 1: headingType (h1/h2/h3)
  // Row 2: subtitle
  // Row 3: imageLarge (picture or img)
  // Row 4: imageSmall (picture or img)
  // Row 5: body (richtext)
  // Row 6: cta link
  // Row 7: ctaText

  const headingText = rows[0]?.textContent?.trim() ?? '';
  const headingType = (rows[1]?.textContent?.trim() ?? 'h2') as 'h1' | 'h2' | 'h3';
  const subtitleText = rows[2]?.textContent?.trim() ?? '';
  const imageLargeEl = rows[3]?.querySelector<HTMLElement>('picture, img');
  const imageSmallEl = rows[4]?.querySelector<HTMLElement>('picture, img');
  const bodyEl = rows[5];
  const ctaAnchor = rows[6]?.querySelector<HTMLAnchorElement>('a');
  const ctaText = rows[7]?.textContent?.trim() ?? '';

  // — Heading —
  const heading = document.createElement(headingType);
  heading.className = 'layout-2-image-heading';
  heading.textContent = headingText;

  // — Subtitle —
  const subtitle = document.createElement('p');
  subtitle.className = 'layout-2-image-subtitle';
  subtitle.textContent = subtitleText;

  // — Images —
  const imageContainer = document.createElement('div');
  imageContainer.className = 'layout-2-image-images';

  if (imageLargeEl) {
    const large = document.createElement('div');
    large.className = 'layout-2-image-image-large';
    large.append(imageLargeEl);
    imageContainer.append(large);
  }

  if (imageSmallEl) {
    const small = document.createElement('div');
    small.className = 'layout-2-image-image-small';
    small.append(imageSmallEl);
    imageContainer.append(small);
  }

  // — Body —
  const body = document.createElement('div');
  body.className = 'layout-2-image-body';
  if (bodyEl) {
    const richtext = bodyEl.querySelector('div');
    if (richtext) {
      body.append(...richtext.childNodes);
    }
  }

  // — CTA —
  const elements: HTMLElement[] = [heading, subtitle, imageContainer, body];

  if (ctaAnchor || ctaText) {
    const cta = document.createElement('a');
    cta.className = 'layout-2-image-cta';
    cta.href = ctaAnchor?.href ?? '#';
    cta.textContent = ctaText || ctaAnchor?.textContent?.trim() || 'DISCOVER MORE';
    elements.push(cta);
  }

  block.replaceChildren(...elements);
}
