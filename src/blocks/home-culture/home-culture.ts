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

  // ── Culture items ─────────────────────────────────────────────────
  // AEM delivers each model field as its own single-cell row:
  //   rows[3]  = item1Heading   rows[7]  = item2Heading   rows[10] = item3Heading
  //   rows[4]  = item1Image1    rows[8]  = item2Image1    rows[11] = item3Image1
  //   rows[5]  = item1Image2                              rows[12] = item3Image2
  //   rows[6]  = item1Body      rows[9]  = item2Body      rows[13] = item3Body

  interface ItemDef {
    type: 'type1' | 'type2' | 'type3';
    titleRow: number;
    img1Row: number;
    img2Row: number | null;
    bodyRow: number;
  }

  const itemDefs: ItemDef[] = [
    { type: 'type1', titleRow: 3, img1Row: 4, img2Row: 5, bodyRow: 6 },
    { type: 'type2', titleRow: 7, img1Row: 8, img2Row: null, bodyRow: 9 },
    { type: 'type3', titleRow: 10, img1Row: 11, img2Row: 12, bodyRow: 13 },
  ];

  const items: HTMLElement[] = itemDefs.map(({ type, titleRow, img1Row, img2Row, bodyRow }) => {
    const titleText = rows[titleRow]?.firstElementChild?.textContent?.trim() ?? '';
    const picture1 = rows[img1Row]?.querySelector('picture') ?? null;
    const picture2 = img2Row !== null ? (rows[img2Row]?.querySelector('picture') ?? null) : null;
    const bodyEl = rows[bodyRow]?.firstElementChild ?? null;

    const item = document.createElement('div');
    item.className = `home-culture-item home-culture-item--${type}`;

    // image1
    const img1Wrap = document.createElement('div');
    img1Wrap.className = 'home-culture-img1';
    if (picture1) img1Wrap.append(picture1);
    item.append(img1Wrap);

    // image2 (type1 and type3 only)
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

    if (bodyEl) {
      const body = document.createElement('div');
      body.className = 'home-culture-richtext';
      body.innerHTML = DOMPurify.sanitize(bodyEl.innerHTML, { USE_PROFILES: { html: true } });
      contentPanel.append(body);
    }

    item.append(contentPanel);
    return item;
  });

  block.replaceChildren(sectionHeader, ...items);
}
