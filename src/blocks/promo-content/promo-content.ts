export default async function decorate(block: HTMLElement): Promise<void> {
  // Extract content from the current block structure
  const nodes = Array.from(block.children);
  if (nodes.length < 6) return;

  // Image
  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'promo-content-image';
  const picture = nodes[0].querySelector('picture');
  if (picture) imageWrapper.appendChild(picture.cloneNode(true));

  // Title
  const title = document.createElement('h2');
  title.className = 'promo-content-title';
  title.textContent = nodes[1].textContent?.trim() || '';

  // Subtitle
  const subtitle = document.createElement('div');
  subtitle.className = 'promo-content-subtitle';
  subtitle.textContent = nodes[2].textContent?.trim() || '';

  // Description
  const desc = document.createElement('div');
  desc.className = 'promo-content-description';
  desc.innerHTML = nodes[3].innerHTML;

  // CTA Button
  const ctaLabel = nodes[4].textContent?.trim() || '';
  const ctaLinkNode = nodes[5].querySelector('a');
  let cta: HTMLAnchorElement | HTMLButtonElement;
  if (ctaLinkNode) {
    cta = document.createElement('a');
    cta.href = ctaLinkNode.getAttribute('href') || '#';
    cta.textContent = ctaLabel;
  } else {
    cta = document.createElement('button');
    cta.type = 'button';
    cta.textContent = ctaLabel;
  }
  cta.className = 'promo-content-cta';

  // Body wrapper
  const body = document.createElement('div');
  body.className = 'promo-content-body';
  body.appendChild(title);
  body.appendChild(subtitle);
  body.appendChild(desc);
  body.appendChild(cta);

  // Item wrapper
  const item = document.createElement('div');
  item.className = 'promo-content-item';
  item.appendChild(body);

  // Final block structure
  block.replaceChildren(imageWrapper, item);
}