import './footer.css';
import { getMetadata } from '@/app/aem';
import { loadFragment } from '@/blocks/fragment/fragment';

/**
 * Loads and decorates the footer block.
 */
export default async function decorate(block: HTMLElement): Promise<void> {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location.href).pathname : '/footer';

  const fragment = await loadFragment(footerPath);
  if (!fragment) return;

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);
  block.append(footer);
}
