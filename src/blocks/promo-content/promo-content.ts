export default async function decorate(block: HTMLElement): Promise<void> {
  // Expecting 6 children: image, title, subtitle, description, cta label, cta link
  const nodes = Array.from(block.children);
  if (nodes.length < 6) return;

  // Background image
  const bg = document.createElement('div');
  bg.className = 'promo-content-bg';
  const picture = nodes[0].querySelector('picture');
  if (picture) bg.appendChild(picture.cloneNode(true));

  // Card overlay
  const card = document.createElement('div');
  card.className = 'promo-content-card';

  // Subtitle
  const subtitle = document.createElement('div');
  subtitle.className = 'promo-content-subtitle';
  subtitle.textContent = nodes[2].textContent?.trim() || '';
  card.appendChild(subtitle);

  // Title
  const title = document.createElement('h2');
  title.className = 'promo-content-title';
  title.textContent = nodes[1].textContent?.trim() || '';
  card.appendChild(title);

  // Description
  const desc = document.createElement('div');
  desc.className = 'promo-content-description';
  desc.innerHTML = nodes[3].innerHTML;
  card.appendChild(desc);

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
  card.appendChild(cta);

  // Replace block content
  block.replaceChildren(bg, card);
}