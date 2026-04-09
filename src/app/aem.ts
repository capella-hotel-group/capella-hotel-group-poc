/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

// ─── Local types ─────────────────────────────────────────────────────────────

type RumData = Record<string, unknown>;

interface Breakpoint {
  media?: string;
  width: string;
}

type BlockCellValue = string | Element;
type BlockCell = BlockCellValue | { elems: BlockCellValue[] };

/** Extended callable type for the sampleRUM function-with-properties pattern. */
type SampleRUMFn = ((checkpoint?: string, data?: RumData) => void) & {
  enhance?: () => void;
  baseURL?: URL;
  collectBaseURL?: URL;
  sendPing?: (ck: string, time: number, pingData?: RumData) => void;
  enhancerContext?: { enhancerVersion?: string; enhancerHash?: string };
};

// ─── sampleRUM ────────────────────────────────────────────────────────────────

function sampleRUM(checkpoint?: string, data?: RumData): void {
  // Cast the function to the extended type so property assignments type-check.
  const self = sampleRUM as unknown as SampleRUMFn;

  const timeShift = (): number =>
    window.performance ? window.performance.now() : Date.now() - (window.hlx.rum?.firstReadTime ?? 0);

  try {
    window.hlx = (window.hlx as typeof window.hlx | undefined) ?? ({} as typeof window.hlx);
    if (!window.hlx.rum || !window.hlx.rum.collector) {
      self.enhance = () => {};
      const params = new URLSearchParams(window.location.search);
      const currentScript = document.currentScript as HTMLScriptElement | null;
      const rate =
        params.get('rum') || window.SAMPLE_PAGEVIEWS_AT_RATE || params.get('optel') || currentScript?.dataset.rate;
      const rateMap: Record<string, number> = { on: 1, off: 0, high: 10, low: 1000 };
      const rateValue: number | undefined = rateMap[rate ?? ''];
      const weight = rateValue !== undefined ? rateValue : 100;
      const id = window.hlx.rum?.id ?? crypto.randomUUID().slice(-9);
      const isSelected = (window.hlx.rum?.isSelected ?? false) || (weight > 0 && Math.random() * weight < 1);

      const rumObj = {
        weight,
        id,
        isSelected,
        firstReadTime: window.performance ? window.performance.timeOrigin : Date.now(),
        sampleRUM,
        queue: [] as unknown[][],
        collector: (...args: unknown[]): number => rumObj.queue.push(args),
      };
      window.hlx.rum = rumObj;

      if (isSelected) {
        const dataFromErrorObj = (error: unknown): RumData => {
          const errData: RumData = { source: 'undefined error' };
          try {
            errData.target = String(error);
            const err = error as { stack?: string };
            if (err.stack) {
              errData.source =
                err.stack
                  .split('\n')
                  .filter((line) => /https?:\/\//.test(line))
                  .shift()
                  ?.replace(/at ([^ ]+) \((.+)\)/, '$1@$2')
                  .replace(/ at /, '@')
                  .trim() ?? 'undefined error';
            }
          } catch {
            /* error structure was not as expected */
          }
          return errData;
        };

        window.addEventListener('error', ({ error }) => {
          const errData = dataFromErrorObj(error);
          sampleRUM('error', errData);
        });

        window.addEventListener('unhandledrejection', ({ reason }) => {
          let errData: RumData = {
            source: 'Unhandled Rejection',
            target: (reason as unknown) || 'Unknown',
          };
          if (reason instanceof Error) {
            errData = dataFromErrorObj(reason);
          }
          sampleRUM('error', errData);
        });

        window.addEventListener('securitypolicyviolation', (e) => {
          if (e.blockedURI.includes('helix-rum-enhancer') && e.disposition === 'enforce') {
            const errData: RumData = { source: 'csp', target: e.blockedURI };
            self.sendPing?.('error', timeShift(), errData);
          }
        });

        self.baseURL = self.baseURL ?? new URL(window.RUM_BASE ?? '/', new URL('https://ot.aem.live'));
        self.collectBaseURL = self.collectBaseURL ?? self.baseURL;

        self.sendPing = (ck: string, time: number, pingData: RumData = {}): void => {
          const rumData = JSON.stringify({
            weight,
            id,
            referer: window.location.href,
            checkpoint: ck,
            t: time,
            ...pingData,
          });
          const urlParams = window.RUM_PARAMS ? new URLSearchParams(window.RUM_PARAMS).toString() : '';
          const { href: url, origin } = new URL(
            `.rum/${weight}${urlParams ? `?${urlParams}` : ''}`,
            self.collectBaseURL,
          );
          const body = origin === window.location.origin ? new Blob([rumData], { type: 'application/json' }) : rumData;
          navigator.sendBeacon(url, body);
          console.debug(`ping:${ck}`, pingData);
        };
        self.sendPing('top', timeShift());

        self.enhance = (): void => {
          // only enhance once
          if (document.querySelector('script[src*="rum-enhancer"]')) return;
          const { enhancerVersion, enhancerHash } = self.enhancerContext ?? {};
          const script = document.createElement('script');
          if (enhancerHash) {
            script.integrity = enhancerHash;
            script.setAttribute('crossorigin', 'anonymous');
          }
          script.src = new URL(
            `.rum/@adobe/helix-rum-enhancer@${enhancerVersion ?? '^2'}/src/index.js`,
            self.baseURL,
          ).href;
          document.head.appendChild(script);
        };

        if (!window.hlx.RUM_MANUAL_ENHANCE) {
          self.enhance?.();
        }
      }
    }
    if (window.hlx.rum?.isSelected && checkpoint) {
      window.hlx.rum.collector(checkpoint, data, timeShift());
    }
    document.dispatchEvent(new CustomEvent('rum', { detail: { checkpoint, data } }));
  } catch {
    // something went awry
  }
}

// ─── setup / init ─────────────────────────────────────────────────────────────

/**
 * Setup block utils.
 */
function setup(): void {
  window.hlx = (window.hlx as typeof window.hlx | undefined) ?? ({} as typeof window.hlx);
  window.hlx.RUM_MASK_URL = 'full';
  window.hlx.RUM_MANUAL_ENHANCE = true;
  window.hlx.codeBasePath = '';
  window.hlx.lighthouse = new URLSearchParams(window.location.search).get('lighthouse') === 'on';

  const scriptEl = document.querySelector<HTMLScriptElement>('script[src$="/scripts/main.js"]');
  if (scriptEl) {
    try {
      const scriptURL = new URL(scriptEl.src, window.location.href);
      if (scriptURL.host === window.location.host) {
        [window.hlx.codeBasePath] = scriptURL.pathname.split('/scripts/main.js');
      } else {
        [window.hlx.codeBasePath] = scriptURL.href.split('/scripts/main.js');
      }
    } catch (error) {
      console.log(error);
    }
  }
}

/**
 * Auto initialization.
 */
function init(): void {
  setup();
  (sampleRUM as unknown as SampleRUMFn).collectBaseURL = window.origin as unknown as URL;
  sampleRUM();
}

// ─── String utilities ─────────────────────────────────────────────────────────

/**
 * Sanitizes a string for use as class name.
 * @param name The unsanitized string
 * @returns The class name
 */
function toClassName(name: string): string {
  return typeof name === 'string'
    ? name
        .toLowerCase()
        .replace(/[^0-9a-z]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    : '';
}

/**
 * Sanitizes a string for use as a js property name.
 * @param name The unsanitized string
 * @returns The camelCased name
 */
function toCamelCase(name: string): string {
  return toClassName(name).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

// ─── Block config ─────────────────────────────────────────────────────────────

/**
 * Extracts the config from a block.
 * @param block The block element
 * @returns The block config
 */
function readBlockConfig(block: HTMLElement): Record<string, string | string[]> {
  const config: Record<string, string | string[]> = {};
  block.querySelectorAll<HTMLElement>(':scope > div').forEach((row) => {
    if (row.children) {
      const cols = [...row.children] as HTMLElement[];
      if (cols[1]) {
        const col = cols[1];
        const name = toClassName(cols[0].textContent ?? '');
        let value: string | string[] = '';
        if (col.querySelector('a')) {
          const anchors = [...col.querySelectorAll<HTMLAnchorElement>('a')];
          value = anchors.length === 1 ? anchors[0].href : anchors.map((a) => a.href);
        } else if (col.querySelector('img')) {
          const imgs = [...col.querySelectorAll<HTMLImageElement>('img')];
          value = imgs.length === 1 ? imgs[0].src : imgs.map((img) => img.src);
        } else if (col.querySelector('p')) {
          const ps = [...col.querySelectorAll<HTMLParagraphElement>('p')];
          value = ps.length === 1 ? (ps[0].textContent ?? '') : ps.map((p) => p.textContent ?? '');
        } else {
          value = (row.children[1] as HTMLElement).textContent ?? '';
        }
        config[name] = value;
      }
    }
  });
  return config;
}

// ─── Asset loaders ────────────────────────────────────────────────────────────

/**
 * Loads a CSS file.
 * @param href URL to the CSS file
 */
function loadCSS(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`head > link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = reject;
      document.head.append(link);
    } else {
      resolve();
    }
  });
}

/**
 * Loads a non module JS file.
 * @param src URL to the JS file
 * @param attrs additional optional attributes
 */
function loadScript(src: string, attrs?: Record<string, string>): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`head > script[src="${src}"]`)) {
      const script = document.createElement('script');
      script.src = src;
      if (attrs) {
        Object.entries(attrs).forEach(([attr, value]) => {
          script.setAttribute(attr, value);
        });
      }
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.append(script);
    } else {
      resolve();
    }
  });
}

// ─── Metadata ────────────────────────────────────────────────────────────────

/**
 * Retrieves the content of metadata tags.
 * @param name The metadata name (or property)
 * @param doc Document object to query for metadata. Defaults to the window's document
 * @returns The metadata value(s)
 */
function getMetadata(name: string, doc: Document = document): string {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...doc.head.querySelectorAll<HTMLMetaElement>(`meta[${attr}="${name}"]`)]
    .map((m) => m.content)
    .join(', ');
  return meta || '';
}

// ─── Picture ─────────────────────────────────────────────────────────────────

/**
 * Returns a picture element with webp and fallbacks.
 * @param src The image URL
 * @param alt The image alternative text
 * @param eager Set loading attribute to eager
 * @param breakpoints Breakpoints and corresponding params (eg. width)
 * @returns The picture element
 */
function createOptimizedPicture(
  src: string,
  alt: string = '',
  eager: boolean = false,
  breakpoints: Breakpoint[] = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }],
): HTMLPictureElement {
  const url = new URL(src, window.location.href);
  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
      img.setAttribute('src', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
    }
  });

  return picture;
}

// ─── Decorators ───────────────────────────────────────────────────────────────

/**
 * Set template (page structure) and theme (page styles).
 */
function decorateTemplateAndTheme(): void {
  const addClasses = (element: HTMLElement, classes: string): void => {
    classes.split(',').forEach((c) => {
      element.classList.add(toClassName(c.trim()));
    });
  };
  const template = getMetadata('template');
  if (template) addClasses(document.body, template);
  const theme = getMetadata('theme');
  if (theme) addClasses(document.body, theme);
}

/**
 * Wrap inline text content of block cells within a <p> tag.
 * @param block the block element
 */
function wrapTextNodes(block: HTMLElement): void {
  const validWrappers = ['P', 'PRE', 'UL', 'OL', 'PICTURE', 'TABLE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR'];

  const wrap = (el: HTMLElement): void => {
    const wrapper = document.createElement('p');
    wrapper.append(...el.childNodes);
    [...el.attributes]
      .filter(
        ({ nodeName }) =>
          nodeName === 'class' || nodeName.startsWith('data-aue') || nodeName.startsWith('data-richtext'),
      )
      .forEach(({ nodeName, nodeValue }) => {
        if (nodeValue !== null) wrapper.setAttribute(nodeName, nodeValue);
        el.removeAttribute(nodeName);
      });
    el.append(wrapper);
  };

  block.querySelectorAll<HTMLElement>(':scope > div > div').forEach((blockColumn) => {
    if (blockColumn.hasChildNodes()) {
      const hasWrapper =
        !!blockColumn.firstElementChild &&
        validWrappers.some((tagName) => blockColumn.firstElementChild!.tagName === tagName);
      if (!hasWrapper) {
        wrap(blockColumn);
      } else if (
        blockColumn.firstElementChild!.tagName === 'PICTURE' &&
        (blockColumn.children.length > 1 || !!blockColumn.textContent?.trim())
      ) {
        wrap(blockColumn);
      }
    }
  });
}

/**
 * Decorates paragraphs containing a single link as buttons.
 * @param element container element
 */
function decorateButtons(element: HTMLElement): void {
  element.querySelectorAll<HTMLAnchorElement>('a').forEach((a) => {
    a.title = a.title || a.textContent || '';
    if (a.href !== a.textContent) {
      const up = a.parentElement!;
      const twoup = up.parentElement!;
      if (!a.querySelector('img')) {
        if (up.childNodes.length === 1 && (up.tagName === 'P' || up.tagName === 'DIV')) {
          a.className = 'button'; // default
          up.classList.add('button-container');
        }
        if (
          up.childNodes.length === 1 &&
          up.tagName === 'STRONG' &&
          twoup.childNodes.length === 1 &&
          twoup.tagName === 'P'
        ) {
          a.className = 'button primary';
          twoup.classList.add('button-container');
        }
        if (
          up.childNodes.length === 1 &&
          up.tagName === 'EM' &&
          twoup.childNodes.length === 1 &&
          twoup.tagName === 'P'
        ) {
          a.className = 'button secondary';
          twoup.classList.add('button-container');
        }
      }
    }
  });
}

/**
 * Add <img> for icon, prefixed with codeBasePath and optional prefix.
 * @param span span element with icon classes
 * @param prefix prefix to be added to icon src
 * @param alt alt text to be added to icon
 */
function decorateIcon(span: HTMLElement, prefix: string = '', alt: string = ''): void {
  const iconName = Array.from(span.classList)
    .find((c) => c.startsWith('icon-'))
    ?.substring(5);
  if (!iconName) return;
  const img = document.createElement('img');
  img.dataset.iconName = iconName;
  img.src = `${window.hlx.codeBasePath}${prefix}/icons/${iconName}.svg`;
  img.alt = alt;
  img.loading = 'lazy';
  img.width = 16;
  img.height = 16;
  span.append(img);
}

/**
 * Add <img> for icons, prefixed with codeBasePath and optional prefix.
 * @param element Element containing icons
 * @param prefix prefix to be added to icon the src
 */
function decorateIcons(element: HTMLElement, prefix: string = ''): void {
  element.querySelectorAll<HTMLElement>('span.icon').forEach((span) => {
    decorateIcon(span, prefix);
  });
}

/**
 * Decorates all sections in a container element.
 * @param main The container element
 */
function decorateSections(main: HTMLElement): void {
  main.querySelectorAll<HTMLElement>(':scope > div:not([data-section-status])').forEach((section) => {
    const wrappers: HTMLElement[] = [];
    let defaultContent = false;
    [...section.children].forEach((e) => {
      const el = e as HTMLElement;
      if ((el.tagName === 'DIV' && el.className) || !defaultContent) {
        const wrapper = document.createElement('div');
        wrappers.push(wrapper);
        defaultContent = el.tagName !== 'DIV' || !el.className;
        if (defaultContent) wrapper.classList.add('default-content-wrapper');
      }
      wrappers[wrappers.length - 1].append(el);
    });
    wrappers.forEach((wrapper) => section.append(wrapper));
    section.classList.add('section');
    section.dataset.sectionStatus = 'initialized';
    section.style.display = 'none';

    // Process section metadata
    const sectionMeta = section.querySelector<HTMLElement>('div.section-metadata');
    if (sectionMeta) {
      const meta = readBlockConfig(sectionMeta);
      Object.keys(meta).forEach((key) => {
        if (key === 'style') {
          const styles = (meta.style as string)
            .split(',')
            .filter((style) => style)
            .map((style) => toClassName(style.trim()));
          styles.forEach((style) => section.classList.add(style));
        } else {
          section.dataset[toCamelCase(key)] = meta[key] as string;
        }
      });
      sectionMeta.parentElement?.remove();
    }
  });
}

// ─── Block builders / loaders ─────────────────────────────────────────────────

/**
 * Builds a block DOM Element from a two dimensional array, string, or object.
 * @param blockName name of the block
 * @param content two dimensional array or string or object of content
 */
function buildBlock(blockName: string, content: string | Element | BlockCell[][]): HTMLDivElement {
  const table = Array.isArray(content) ? content : [[content]];
  const blockEl = document.createElement('div');
  blockEl.classList.add(blockName);
  table.forEach((row) => {
    const rowEl = document.createElement('div');
    row.forEach((col) => {
      const colEl = document.createElement('div');
      const vals = (col as { elems?: BlockCellValue[] }).elems
        ? (col as { elems: BlockCellValue[] }).elems
        : [col as BlockCellValue];
      vals.forEach((val) => {
        if (val) {
          if (typeof val === 'string') {
            colEl.innerHTML += val;
          } else {
            colEl.appendChild(val);
          }
        }
      });
      rowEl.appendChild(colEl);
    });
    blockEl.appendChild(rowEl);
  });
  return blockEl;
}

/**
 * Loads JS and CSS for a block.
 * @param block The block element
 */
async function loadBlock(block: HTMLElement): Promise<HTMLElement> {
  const status = block.dataset.blockStatus;
  if (status !== 'loading' && status !== 'loaded') {
    block.dataset.blockStatus = 'loading';
    const { blockName } = block.dataset;
    try {
      const cssLoaded = loadCSS(`${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.css`);
      const decorationComplete = new Promise<void>((resolve) => {
        (async () => {
          try {
            const mod = (await import(
              /* @vite-ignore */
              `${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.js`
            )) as { default?: (block: HTMLElement) => Promise<void> | void };
            if (mod.default) {
              await mod.default(block);
            }
          } catch (error) {
            console.error(`failed to load module for ${blockName}`, error);
          }
          resolve();
        })();
      });
      await Promise.all([cssLoaded, decorationComplete]);
    } catch (error) {
      console.error(`failed to load block ${blockName}`, error);
    }
    block.dataset.blockStatus = 'loaded';
  }
  return block;
}

/**
 * Decorates a block.
 * @param block The block element
 */
function decorateBlock(block: HTMLElement): void {
  const shortBlockName = block.classList[0];
  if (shortBlockName && !block.dataset.blockStatus) {
    block.classList.add('block');
    block.dataset.blockName = shortBlockName;
    block.dataset.blockStatus = 'initialized';
    wrapTextNodes(block);
    const blockWrapper = block.parentElement;
    if (blockWrapper) blockWrapper.classList.add(`${shortBlockName}-wrapper`);
    const section = block.closest<HTMLElement>('.section');
    if (section) section.classList.add(`${shortBlockName}-container`);
    decorateButtons(block);
  }
}

/**
 * Decorates all blocks in a container element.
 * @param main The container element
 */
function decorateBlocks(main: HTMLElement): void {
  main.querySelectorAll<HTMLElement>('div.section > div > div').forEach(decorateBlock);
}

/**
 * Loads a block named 'header' into header.
 * @param header header element
 */
async function loadHeader(header: HTMLElement): Promise<void> {
  const headerBlock = buildBlock('header', '');
  header.append(headerBlock);
  decorateBlock(headerBlock);
  await loadBlock(headerBlock);
}

/**
 * Loads a block named 'footer' into footer.
 * @param footer footer element
 */
async function loadFooter(footer: HTMLElement): Promise<void> {
  const footerBlock = buildBlock('footer', '');
  footer.append(footerBlock);
  decorateBlock(footerBlock);
  await loadBlock(footerBlock);
}

// ─── Section / page loaders ───────────────────────────────────────────────────

/**
 * Wait for Image.
 * @param section section element
 */
async function waitForFirstImage(section: HTMLElement): Promise<void> {
  const lcpCandidate = section.querySelector<HTMLImageElement>('img');
  await new Promise<void>((resolve) => {
    if (lcpCandidate && !lcpCandidate.complete) {
      lcpCandidate.setAttribute('loading', 'eager');
      lcpCandidate.addEventListener('load', () => resolve());
      lcpCandidate.addEventListener('error', () => resolve());
    } else {
      resolve();
    }
  });
}

/**
 * Loads all blocks in a section.
 * @param section The section element
 * @param loadCallback optional callback invoked after blocks load
 */
async function loadSection(
  section: HTMLElement,
  loadCallback?: (section: HTMLElement) => void | Promise<void>,
): Promise<void> {
  const status = section.dataset.sectionStatus;
  if (!status || status === 'initialized') {
    section.dataset.sectionStatus = 'loading';
    const blocks = [...section.querySelectorAll<HTMLElement>('div.block')];
    for (let i = 0; i < blocks.length; i += 1) {
      await loadBlock(blocks[i]);
    }
    if (loadCallback) await loadCallback(section);
    section.dataset.sectionStatus = 'loaded';
    section.style.display = '';
  }
}

/**
 * Loads all sections.
 * @param element The parent element of sections to load
 */
async function loadSections(element: HTMLElement): Promise<void> {
  const sections = [...element.querySelectorAll<HTMLElement>('div.section')];
  for (let i = 0; i < sections.length; i += 1) {
    await loadSection(sections[i]);
    if (i === 0 && (sampleRUM as unknown as SampleRUMFn).enhance) {
      (sampleRUM as unknown as SampleRUMFn).enhance?.();
    }
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

init();

// ─── Exports ──────────────────────────────────────────────────────────────────

export {
  buildBlock,
  createOptimizedPicture,
  decorateBlock,
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateTemplateAndTheme,
  getMetadata,
  loadBlock,
  loadCSS,
  loadFooter,
  loadHeader,
  loadScript,
  loadSection,
  loadSections,
  readBlockConfig,
  sampleRUM,
  setup,
  toCamelCase,
  toClassName,
  waitForFirstImage,
  wrapTextNodes,
};
