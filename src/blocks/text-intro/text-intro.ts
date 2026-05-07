import { moveInstrumentation } from '@/app/scripts';

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children] as HTMLElement[];

  // Model fields → row indices:
  //   rows[0] = image (reference)
  //   rows[1] = subtitle (text)
  //   rows[2] = heading (richtext)
  //   rows[3] = body (richtext)
  const pictureEl = rows[0]?.querySelector('picture');
  const subtitleText = rows[1]?.firstElementChild?.textContent?.trim() ?? '';
  const headingEl = rows[2]?.firstElementChild;
  const bodyEl = rows[3]?.firstElementChild;

  const bgWrapper = document.createElement('div');
  bgWrapper.className = 'text-intro-bg';
  if (pictureEl) {
    moveInstrumentation(rows[0], bgWrapper);
    bgWrapper.append(pictureEl);
  }

  const content = document.createElement('div');
  content.className = 'text-intro-content';

  if (subtitleText) {
    const subtitle = document.createElement('p');
    subtitle.className = 'text-intro-subtitle';
    subtitle.textContent = subtitleText;
    moveInstrumentation(rows[1], subtitle);
    content.append(subtitle);
  }

  if (headingEl) {
    const heading = document.createElement('div');
    heading.className = 'text-intro-heading';
    moveInstrumentation(rows[2], heading);
    while (headingEl.firstChild) {
      heading.append(headingEl.firstChild);
    }
    content.append(heading);
  }

  if (bodyEl) {
    const body = document.createElement('div');
    body.className = 'text-intro-body';
    moveInstrumentation(rows[3], body);
    while (bodyEl.firstChild) {
      body.append(bodyEl.firstChild);
    }
    content.append(body);
  }

  block.replaceChildren(bgWrapper, content);
}
