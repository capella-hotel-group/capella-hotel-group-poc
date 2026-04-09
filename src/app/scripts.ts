import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from '@/app/aem';

/**
 * Moves all attributes from one element to another.
 * @param from - Source element
 * @param to - Target element
 * @param attributes - Optional list of attribute names to move (defaults to all)
 */
export function moveAttributes(from: Element, to: Element | null | undefined, attributes?: string[]): void {
  const attrs = attributes ?? [...from.attributes].map(({ nodeName }) => nodeName);
  attrs.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Moves Universal Editor / rich-text instrumentation attributes
 * (`data-aue-*` and `data-richtext-*`) from one element to another.
 * @param from - Source element
 * @param to - Target element
 */
export function moveInstrumentation(from: Element, to: Element | null | undefined): void {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * Loads fonts.css and sets a session-storage flag for subsequent visits.
 */
async function loadFonts(): Promise<void> {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) {
      sessionStorage.setItem('fonts-loaded', 'true');
    }
  } catch {
    // do nothing – storage may be blocked
  }
}

/**
 * Builds all synthetic blocks in a container element.
 */
function buildAutoBlocks(): void {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 */
export function decorateMain(main: HTMLElement): void {
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks();
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 */
async function loadEager(doc: Document): Promise<void> {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    const firstSection = main.querySelector('.section');
    if (firstSection) {
      await loadSection(firstSection as HTMLElement, waitForFirstImage);
    }
  }

  try {
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 */
async function loadLazy(doc: Document): Promise<void> {
  const header = doc.querySelector('header');
  if (header && !header.querySelector('.header.block')) loadHeader(header as HTMLElement);

  const main = doc.querySelector('main');
  if (main) await loadSections(main as HTMLElement);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : null;
  if (hash && element) element.scrollIntoView();

  const footer = doc.querySelector('footer');
  if (footer && !footer.querySelector('.footer.block')) loadFooter(footer as HTMLElement);

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens much later, without impacting UX.
 */
function loadDelayed(): void {
  window.setTimeout(() => import('./delayed'), 3000);
}

async function loadPage(): Promise<void> {
  console.log(`app=${__APP_NAME__} version=${__APP_VERSION__}`);
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
