import { loadFragment } from '@/blocks/fragment/fragment';
import { moveInstrumentation } from '@/app/scripts';

async function loadAccordionFragment(panel: HTMLElement): Promise<void> {
  const fragmentPath = panel.dataset.fragmentPath;

  if (fragmentPath && !panel.dataset.loaded) {
    const fragment = await loadFragment(fragmentPath);

    if (fragment) {
      panel.innerHTML = '';

      while (fragment.firstElementChild) {
        panel.appendChild(fragment.firstElementChild);
      }

      panel.dataset.loaded = 'true';
    }
  }
}

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children] as HTMLElement[];

  const accordion = document.createElement('div');
  accordion.classList.add('accordion-with-fragments-container');

  rows.forEach((row: HTMLElement, i: number) => {
    const titleEl = row.children[0] as HTMLElement;
    const fragmentEl = row.children[1] as HTMLElement;

    const fragmentPath = fragmentEl
      .querySelector('a')
      ?.getAttribute('href');

    const item = document.createElement('div');
    item.classList.add('accordion-with-fragments-item');

    const button = document.createElement('button');
    button.classList.add('accordion-with-fragments-header');

    button.setAttribute('type', 'button');
    button.setAttribute('aria-expanded', i === 0 ? 'true' : 'false');
    button.setAttribute('aria-controls', `accordion-panel-${i}`);
    button.id = `accordion-header-${i}`;

    button.innerHTML = `
      <span>${titleEl.textContent?.trim() ?? ''}</span>
      <span class="accordion-with-fragments-icon"></span>
    `;

    const panel = document.createElement('div');

    panel.classList.add('accordion-with-fragments-panel');

    panel.id = `accordion-panel-${i}`;

    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', `accordion-header-${i}`);

    panel.hidden = i !== 0;

    if (fragmentPath) {
      panel.dataset.fragmentPath = fragmentPath;
    }

    moveInstrumentation(row, panel);

    button.addEventListener('click', async () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';

      button.setAttribute('aria-expanded', String(!expanded));
      panel.hidden = expanded;

      if (!expanded) {
        await loadAccordionFragment(panel);
      }
    });

    item.append(button, panel);
    accordion.appendChild(item);

    row.remove();
  });

  block.appendChild(accordion);

  const firstPanel = accordion.querySelector<HTMLElement>(
    '.accordion-with-fragments-panel:not([hidden])',
  );

  if (firstPanel) {
    await loadAccordionFragment(firstPanel);
  }
}