import './custom-fragment.css';
import { loadFragment } from '@/blocks/fragment/fragment';

export default async function decorate(block: HTMLElement): Promise<void> {
  const link = block.querySelector('a');
  const path = link ? (link.getAttribute('href') ?? '') : (block.textContent?.trim() ?? '');
  const theme = block.dataset['theme'] ?? '';

  const fragment = await loadFragment(path);
  if (fragment) {
    if (theme) fragment.classList.add(`theme-${theme}`);
    block.replaceWith(fragment);
  }
}
