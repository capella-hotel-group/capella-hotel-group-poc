import { moveInstrumentation } from '@/app/scripts';
import { createOptimizedPicture } from '@/app/aem';

export default async function decorate(block: HTMLElement): Promise<void> {
  const nav = document.createElement('nav');
  nav.className = 'restaurant-menu-nav';

  const content = document.createElement('div');
  content.className = 'restaurant-menu-content';

  const tabs = document.createElement('ul');
  tabs.className = 'restaurant-menu-tabs';
  tabs.setAttribute('role', 'tablist');

  const panels = document.createElement('div');
  panels.className = 'restaurant-menu-panels';

  let firstTab = true;

  [...block.children].forEach((row, index) => {
    const nameDiv = row.querySelector<HTMLElement>(':scope > div:first-child');
    const imageDiv = row.querySelector<HTMLElement>(':scope > div:last-child');

    if (!nameDiv || !imageDiv) return;

    const name = nameDiv.textContent?.trim() || '';
    const picture = imageDiv.querySelector('picture');
    const img = picture?.querySelector<HTMLImageElement>('img');

    // Tab button
    const li = document.createElement('li');
    li.className = 'restaurant-menu-tab';
    li.setAttribute('role', 'presentation');

    const button = document.createElement('button');
    button.className = 'restaurant-menu-tab-button';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', firstTab ? 'true' : 'false');
    button.setAttribute('aria-controls', `panel-${index}`);
    button.id = `tab-${index}`;
    button.textContent = name;

    if (img) {
      const thumb = createOptimizedPicture(img.src, img.alt || name, false, [{ width: '100' }]);
      thumb.className = 'restaurant-menu-tab-thumb';
      moveInstrumentation(img, thumb.querySelector('img'));
      button.prepend(thumb);
    }

    moveInstrumentation(nameDiv, button);
    li.append(button);
    tabs.append(li);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'restaurant-menu-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${index}`);
    panel.id = `panel-${index}`; 
    panel.hidden = !firstTab;

    const title = document.createElement('h2');
    title.textContent = name;
    title.className = 'restaurant-menu-panel-title';

    if (img) {
      const fullImage = createOptimizedPicture(img.src, img.alt || name, false, [{ width: '750' }]);
      fullImage.className = 'restaurant-menu-panel-image';
      moveInstrumentation(imageDiv, fullImage);
      panel.append(fullImage);
    }

    panel.append(title);
    panels.append(panel);

    firstTab = false;
  });

  nav.append(tabs);
  content.append(panels);
  block.replaceChildren(nav, content);

  // Tab switching
  tabs.addEventListener('click', (e) => {
    const button = (e.target as HTMLElement).closest('button[role="tab"]');
    if (!button) return;

    tabs.querySelectorAll<HTMLButtonElement>('[role="tab"]').forEach((tab) => {
      tab.setAttribute('aria-selected', 'false');
    });
    button.setAttribute('aria-selected', 'true');

    const targetPanel = button.getAttribute('aria-controls');
    panels.querySelectorAll<HTMLElement>('[role="tabpanel"]').forEach((panel) => {
      panel.hidden = panel.id !== targetPanel;
    });
  });
}
