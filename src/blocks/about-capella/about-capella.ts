import DOMPurify from 'dompurify';

export default function decorate(block: HTMLElement): void {
  const rows = [...block.children];

  // Row 0: heading text
  const headingText = rows[0]?.firstElementChild?.textContent?.trim() ?? '';

  // Row 1: subtitle text
  const subtitleText = rows[1]?.firstElementChild?.textContent?.trim() ?? '';

  // Row 2: image (<picture>)
  const pictureEl = rows[2]?.querySelector('picture') ?? null;

  // Row 3: body rich-text
  const bodyEl = rows[3]?.firstElementChild ?? null;

  // Row 4: optional CTA link
  const ctaLinkEl = rows[4]?.querySelector('a') ?? null;
  const ctaHref = ctaLinkEl?.getAttribute('href') ?? '';
  const ctaText = ctaLinkEl?.textContent?.trim() ?? '';

  // --- Header row (heading + subtitle) ---
  const header = document.createElement('div');
  header.className = 'about-capella-header';

  if (headingText) {
    const h2 = document.createElement('h2');
    h2.className = 'about-capella-heading';
    h2.textContent = headingText;
    header.append(h2);
  }

  if (subtitleText) {
    const subtitle = document.createElement('p');
    subtitle.className = 'about-capella-subtitle';
    subtitle.textContent = subtitleText;
    header.append(subtitle);
  }

  // --- Image wrapper ---
  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'about-capella-image';
  if (pictureEl) imageWrapper.append(pictureEl);

  // --- Synopsis (body + CTA) ---
  const synopsis = document.createElement('div');
  synopsis.className = 'about-capella-synopsis';

  if (bodyEl) {
    const body = document.createElement('div');
    body.className = 'about-capella-body';
    body.innerHTML = DOMPurify.sanitize(bodyEl.innerHTML, { USE_PROFILES: { html: true } });
    synopsis.append(body);
  }

  if (ctaHref) {
    const cta = document.createElement('a');
    cta.className = 'about-capella-cta';
    cta.href = ctaHref;
    cta.textContent = ctaText;
    synopsis.append(cta);
  }

  block.replaceChildren(header, imageWrapper, synopsis);
}
