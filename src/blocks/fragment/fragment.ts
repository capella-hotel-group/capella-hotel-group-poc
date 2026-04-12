import { decorateMain } from '@/app/scripts';
import { loadSections } from '@/app/aem';

/**
 * Loads a fragment page and returns its decorated main element.
 * @param path - The path to the fragment (must start with `/`)
 * @returns The decorated main element, or null on failure
 */
export async function loadFragment(path: string): Promise<HTMLElement | null> {
  if (path && path.startsWith('/')) {
    const cleanPath = path.replace(/(\.plain)?\.html/, '');
    const resp = await fetch(`${cleanPath}.plain.html`);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();

      // Reset base path for media assets relative to fragment origin
      const resetAttributeBase = (tag: string, attr: string): void => {
        main.querySelectorAll<HTMLElement>(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
          (elem as HTMLImageElement | HTMLSourceElement)[attr as 'src' | 'srcset'] = new URL(
            elem.getAttribute(attr) ?? '',
            new URL(cleanPath, window.location.href),
          ).href;
        });
      };
      resetAttributeBase('img', 'src');
      resetAttributeBase('source', 'srcset');

      decorateMain(main);
      await loadSections(main);
      return main;
    }
  }
  return null;
}

export default async function decorate(block: HTMLElement): Promise<void> {
  const link = block.querySelector('a');
  const path = link ? (link.getAttribute('href') ?? '') : (block.textContent?.trim() ?? '');
  const fragment = await loadFragment(path);
  if (fragment) {
    const fragmentSection = fragment.querySelector<HTMLElement>(':scope .section');
    if (fragmentSection) {
      block.classList.add(...fragmentSection.classList);
      block.classList.remove('section');
      block.replaceChildren(...fragmentSection.childNodes);
    }
  }
}
