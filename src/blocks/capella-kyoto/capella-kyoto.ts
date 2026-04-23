import DOMPurify from 'dompurify';
import { moveInstrumentation } from '@/app/scripts';

export default function decorate(block: HTMLElement): void {
  const rows = [...block.children] as HTMLElement[];

  // row 0: title, row 1: subtitle, row 2: text, row 3: image
  const titleRow = rows[0];
  const subtitleRow = rows[1];
  const textRow = rows[2];
  const imageRow = rows[3];

  const titleText = titleRow?.firstElementChild?.textContent?.trim() ?? '';
  const subtitleEl = subtitleRow?.firstElementChild;
  const textEl = textRow?.firstElementChild;
  const pictureEl = imageRow?.querySelector('picture');

  const content = document.createElement('div');
  content.className = 'capella-kyoto-content';

  if (titleText) {
    const heading = document.createElement('h2');
    heading.className = 'capella-kyoto-title';
    heading.textContent = titleText;
    if (titleRow) moveInstrumentation(titleRow, heading);
    content.append(heading);
  }

  const body = document.createElement('div');
  body.className = 'capella-kyoto-body';

  if (subtitleEl) {
    const subtitle = document.createElement('div');
    subtitle.className = 'capella-kyoto-subtitle';
    subtitle.innerHTML = DOMPurify.sanitize(subtitleEl.innerHTML, { USE_PROFILES: { html: true } });
    if (subtitleRow) moveInstrumentation(subtitleRow, subtitle);
    body.append(subtitle);
  }

  if (textEl) {
    const text = document.createElement('div');
    text.className = 'capella-kyoto-text';
    text.innerHTML = DOMPurify.sanitize(textEl.innerHTML, { USE_PROFILES: { html: true } });
    if (textRow) moveInstrumentation(textRow, text);
    body.append(text);
  }

  content.append(body);

  const imageCol = document.createElement('div');
  imageCol.className = 'capella-kyoto-image';
  if (pictureEl) {
    if (imageRow) moveInstrumentation(imageRow, imageCol);
    imageCol.append(pictureEl);
  }

  block.replaceChildren(content, imageCol);
}
