import DOMPurify from 'dompurify';

/**
 * Flat block — rows 0-2 are the section header, rows 3-5 are the three culture items.
 *
 * Row structure:
 *   0: section heading text
 *   1: section subtitle text
 *   2: section intro body richtext
 *   3: CRAFTSMANSHIP  — title | img1 (tall) | img2 (landscape) | richtext  → layout type1
 *   4: CAPELLA CURATES — title | img1 (large) |                | richtext  → layout type2
 *   5: CAPELLA YOUTH  — title | img1 (large) | img2 (square)  | richtext  → layout type3
 */
export default function decorate(block: HTMLElement): void {
  const rows = [...block.children] as HTMLElement[];

  // ── Section header ─────────────────────────────────────────────────
  const headingText = rows[0]?.firstElementChild?.textContent?.trim() ?? '';
  const subtitleText = rows[1]?.firstElementChild?.textContent?.trim() ?? '';
  const introEl = rows[2]?.firstElementChild ?? null;

  const sectionHeader = document.createElement('div');
  sectionHeader.className = 'home-culture-header';

  if (headingText) {
    const h2 = document.createElement('h2');
    h2.className = 'home-culture-heading';
    h2.textContent = headingText;
    sectionHeader.append(h2);
  }

  if (subtitleText) {
    const subtitle = document.createElement('p');
    subtitle.className = 'home-culture-subtitle';
    subtitle.textContent = subtitleText;
    sectionHeader.append(subtitle);
  }

  if (introEl) {
    const intro = document.createElement('div');
    intro.className = 'home-culture-intro';
    intro.innerHTML = DOMPurify.sanitize(introEl.innerHTML, { USE_PROFILES: { html: true } });
    sectionHeader.append(intro);
  }

  // ── Culture items (rows 3-5) ────────────────────────────────────────
  const itemTypes = ['type1', 'type2', 'type3'] as const;
  const items: HTMLElement[] = [];

  itemTypes.forEach((type, idx) => {
    const row = rows[3 + idx];
    if (!row) return;

    const cells = [...row.children] as HTMLElement[];
    const titleText = cells[0]?.textContent?.trim() ?? '';
    const picture1 = cells[1]?.querySelector('picture') ?? null;

    // img2 is cells[2] only when it contains a <picture>; type2 has no second image
    const picture2 = cells[2]?.querySelector('picture') ?? null;

    // richtext is always the last cell that has no <picture> inside
    const richtextCell = [...cells].reverse().find((c) => !c.querySelector('picture')) ?? null;
    const richtextEl = richtextCell?.firstElementChild ?? richtextCell ?? null;

    const item = document.createElement('div');
    item.className = `home-culture-item home-culture-item--${type}`;

    // image1
    const img1Wrap = document.createElement('div');
    img1Wrap.className = 'home-culture-img1';
    if (picture1) img1Wrap.append(picture1);
    item.append(img1Wrap);

    // image2 (only for type1 and type3)
    if (picture2) {
      const img2Wrap = document.createElement('div');
      img2Wrap.className = 'home-culture-img2';
      img2Wrap.append(picture2);
      item.append(img2Wrap);
    }

    // content panel (title + richtext)
    const contentPanel = document.createElement('div');
    contentPanel.className = 'home-culture-content';

    if (titleText) {
      const h3 = document.createElement('h3');
      h3.className = 'home-culture-item-title';
      h3.textContent = titleText;
      contentPanel.append(h3);
    }

    if (richtextEl) {
      const body = document.createElement('div');
      body.className = 'home-culture-richtext';
      body.innerHTML = DOMPurify.sanitize(richtextEl.innerHTML, { USE_PROFILES: { html: true } });
      contentPanel.append(body);
    }

    item.append(contentPanel);
    items.push(item);
  });

  block.replaceChildren(sectionHeader, ...items);
}
