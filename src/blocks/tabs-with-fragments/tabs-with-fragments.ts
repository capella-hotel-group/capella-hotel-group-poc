import { loadFragment } from '@/blocks/fragment/fragment';

async function loadPanelFragment(panel: HTMLElement): Promise<void> {
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

const tabList = document.createElement('div');
tabList.classList.add('tabs-with-fragments-list');
tabList.setAttribute('role', 'tablist');

const panels: HTMLElement[] = [];

rows.forEach((row: HTMLElement, i: number) => {
  const titleEl = row.children[0] as HTMLElement;
  const fragmentEl = row.children[1] as HTMLElement;
  const fragmentPath = fragmentEl.querySelector('a')?.getAttribute('href');

  // Tab button
  const btn = document.createElement('button');
  btn.setAttribute('role', 'tab');
  btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
  btn.setAttribute('aria-controls', `twf-panel-${i}`);
  btn.id = `twf-tab-${i}`;
  btn.textContent = titleEl.textContent?.trim() ?? '';
  tabList.appendChild(btn);

  // Tab panel
  const panel = document.createElement('div');
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `twf-tab-${i}`);
  panel.id = `twf-panel-${i}`;
  panel.classList.add('tabs-with-fragments-panel');
  panel.hidden = i !== 0;
  if (fragmentPath) panel.dataset.fragmentPath = fragmentPath;

  panels.push(panel);
  row.remove();
});

block.appendChild(tabList);
panels.forEach((p) => block.appendChild(p));

// Eagerly load first tab
await loadPanelFragment(panels[0]);

// Tab switching
tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]').forEach((btn, i) => {
  btn.addEventListener('click', async () => {
    tabList.querySelectorAll('[role="tab"]').forEach((b) => b.setAttribute('aria-selected', 'false'));
    panels.forEach((p) => { p.hidden = true; });
    btn.setAttribute('aria-selected', 'true');
    panels[i].hidden = false;
    await loadPanelFragment(panels[i]);
  });
});
}