import { decorateMain } from '@/app/scripts';
import { loadSections } from '@/app/aem';

const FADE_ATTR = 'data-soft-nav';
const FADE_OUT_CLASS = 'mode-toggle-fade-out';
const FADE_DURATION_MS = 320;
// Only this exact wrapper node (added by decorateBlock's `${blockName}-wrapper` convention)
// stays mounted across a swap. Its section may hold other page-specific content (e.g. a hero
// banner or video) that should still update, so we preserve the node itself, not its section.
const PRESERVE_SELECTOR = '.mode-toggle-wrapper';

let activeController: AbortController | null = null;
let popstateBound = false;

function isModifiedClick(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function isSameOriginLink(anchor: HTMLAnchorElement): boolean {
  try {
    return new URL(anchor.href, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

function shouldIntercept(event: MouseEvent, anchor: HTMLAnchorElement): boolean {
  if (isModifiedClick(event)) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;
  if (!isSameOriginLink(anchor)) return false;
  return true;
}

function normalize(path: string): string {
  return path.replace(/\/?$/, '/');
}

/** Recomputes active/aria-current state for every mode-toggle instance on the page. */
function syncActiveState(pathname: string): void {
  document.querySelectorAll<HTMLElement>('.mode-toggle-inner[data-experience-href]').forEach((inner) => {
    const expHref = inner.dataset.experienceHref ?? '/en/experience/';
    const isExperience = normalize(pathname) === normalize(expHref);

    const destLink = inner.querySelector<HTMLAnchorElement>('.mode-toggle-btn--dest');
    const expLink = inner.querySelector<HTMLAnchorElement>('.mode-toggle-btn--exp');
    const indicator = inner.querySelector<HTMLElement>('.mode-toggle-indicator');

    destLink?.classList.toggle('mode-toggle-btn--active', !isExperience);
    expLink?.classList.toggle('mode-toggle-btn--active', isExperience);
    if (isExperience) {
      destLink?.removeAttribute('aria-current');
      expLink?.setAttribute('aria-current', 'page');
    } else {
      expLink?.removeAttribute('aria-current');
      destLink?.setAttribute('aria-current', 'page');
    }
    if (indicator) indicator.style.transform = isExperience ? 'translateX(100%)' : 'translateX(0%)';
  });
}

function waitForFadeOut(sections: HTMLElement[]): Promise<void> {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  sections.forEach((section) => {
    section.setAttribute(FADE_ATTR, '');
    section.classList.add(FADE_OUT_CLASS);
  });
  if (reduceMotion || sections.length === 0) return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = window.setTimeout(resolve, FADE_DURATION_MS);
    sections[0].addEventListener(
      'transitionend',
      () => {
        window.clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });
}

/**
 * Splits a main element's content into fade targets: whole sections that don't host the
 * preserved node, plus (one level deep) the sibling blocks inside whichever section does.
 */
function collectFadeTargets(main: HTMLElement, preservedNode: HTMLElement | null): HTMLElement[] {
  const targets: HTMLElement[] = [];
  [...main.children].forEach((section) => {
    if (preservedNode && section.contains(preservedNode)) {
      [...section.children].forEach((child) => {
        if (child !== preservedNode) targets.push(child as HTMLElement);
      });
    } else {
      targets.push(section as HTMLElement);
    }
  });
  return targets;
}

async function navigate(url: string, { push }: { push: boolean }): Promise<void> {
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;

  const currentMain = document.querySelector<HTMLElement>('main');
  if (!currentMain) {
    window.location.assign(url);
    return;
  }

  const preservedNode = currentMain.querySelector<HTMLElement>(PRESERVE_SELECTOR);
  const fadeTargets = collectFadeTargets(currentMain, preservedNode);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const newMain = doc.querySelector<HTMLElement>('main');
    if (!newMain) throw new Error('No <main> found in fetched document');

    decorateMain(newMain);

    // Strip the incoming page's own toggle instance, remembering its exact slot so the
    // preserved node can be grafted back into the same position (same section, same index).
    const incomingDup = newMain.querySelector<HTMLElement>(PRESERVE_SELECTOR);
    const graftParent = incomingDup?.parentElement ?? null;
    const graftIndex = graftParent ? [...graftParent.children].indexOf(incomingDup as Element) : -1;
    incomingDup?.remove();

    await loadSections(newMain);

    await waitForFadeOut(fadeTargets);

    if (preservedNode && graftParent) {
      graftParent.insertBefore(preservedNode, graftParent.children[graftIndex] ?? null);
    }

    // Pre-fade the incoming content so it's invisible right up until insertion, then reveal it.
    const newContentTargets = collectFadeTargets(newMain, preservedNode);
    newContentTargets.forEach((el) => {
      el.setAttribute(FADE_ATTR, '');
      el.classList.add(FADE_OUT_CLASS);
    });

    currentMain.replaceChildren(...newMain.children);

    newContentTargets.forEach((el) => el.getBoundingClientRect()); // force reflow
    newContentTargets.forEach((el) => el.classList.remove(FADE_OUT_CLASS));

    document.title = doc.title;
    if (push) window.history.pushState({}, '', url);
    syncActiveState(new URL(url, window.location.href).pathname);
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') return;
    console.error('mode-toggle soft-nav failed, falling back to full navigation', error);
    window.location.assign(url);
  } finally {
    fadeTargets.forEach((el) => el.removeAttribute(FADE_ATTR));
    if (activeController === controller) activeController = null;
  }
}

export function initSoftNav(anchors: HTMLAnchorElement[]): void {
  anchors.forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      if (!shouldIntercept(event, anchor)) return;
      event.preventDefault();
      navigate(anchor.href, { push: true });
    });
  });

  if (!popstateBound) {
    popstateBound = true;
    window.addEventListener('popstate', () => {
      navigate(window.location.href, { push: false });
    });
  }
}
