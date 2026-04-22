import { getMetadata } from '@/app/aem';
import { loadFragment } from '@/blocks/fragment/fragment';
import { moveInstrumentation } from '@/app/scripts';

function closeLangDropdown(trigger: HTMLButtonElement, dropdown: HTMLUListElement): void {
  trigger.setAttribute('aria-expanded', 'false');
  dropdown.classList.remove('is-open');
}

/**
 * Builds the language selector from the authored richtext.
 * Each <li> in the source list becomes a dropdown option.
 * The first item is auto-selected and shown as the trigger label.
 */
function buildLangZone(sourceList: Element): [HTMLDivElement, HTMLUListElement] {
  const sourceItems = [...sourceList.querySelectorAll<HTMLLIElement>('li')];
  const firstLabel = sourceItems[0]?.textContent?.trim() ?? 'ENGLISH';

  const trigger = document.createElement('button');
  trigger.className = 'header-lang-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.textContent = `${firstLabel} ▾`;

  // Dropdown lives in document.body (appended in decorate) so the header's
  // box-shadow (z-index: 100) paints on top of it (z-index: 99).
  const dropdown = document.createElement('ul');
  dropdown.className = 'header-lang-dropdown';
  dropdown.setAttribute('role', 'listbox');
  moveInstrumentation(sourceList, dropdown);

  sourceItems.forEach((srcItem, i) => {
    const item = document.createElement('li');
    item.setAttribute('role', 'option');
    item.setAttribute('tabindex', '0');
    item.textContent = srcItem.textContent?.trim() ?? '';
    if (i === 0) item.setAttribute('aria-selected', 'true');
    moveInstrumentation(srcItem, item);

    item.addEventListener('click', () => {
      trigger.textContent = `${item.textContent ?? ''} ▾`;
      dropdown.querySelectorAll('li').forEach((li) => li.removeAttribute('aria-selected'));
      item.setAttribute('aria-selected', 'true');
      closeLangDropdown(trigger, dropdown);
    });

    dropdown.append(item);
  });

  const zone = document.createElement('div');
  zone.className = 'header-lang';
  zone.append(trigger);

  function alignDropdown(): void {
    dropdown.style.left = `${trigger.getBoundingClientRect().left}px`;
  }

  function openDropdown(): void {
    alignDropdown();
    dropdown.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  window.addEventListener('resize', () => {
    if (trigger.getAttribute('aria-expanded') === 'true') alignDropdown();
  });

  trigger.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    if (trigger.getAttribute('aria-expanded') === 'true') {
      closeLangDropdown(trigger, dropdown);
    } else {
      openDropdown();
    }
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeLangDropdown(trigger, dropdown);
  });

  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as Node;
    if (!zone.contains(target) && !dropdown.contains(target)) {
      closeLangDropdown(trigger, dropdown);
    }
  });

  return [zone, dropdown];
}

/**
 * Builds the center nav from the authored richtext.
 * Expects <a> tags inside <li> elements. Links are split around the emblem:
 * first half left, remaining right.
 */
function buildNavZone(sourceList: Element): HTMLElement {
  const items = [...sourceList.querySelectorAll<HTMLLIElement>('li')];

  const nav = document.createElement('nav');
  nav.className = 'header-nav';
  nav.setAttribute('aria-label', 'Primary navigation');
  moveInstrumentation(sourceList, nav);

  function makeNavLink(srcItem: HTMLLIElement): HTMLAnchorElement {
    const srcA = srcItem.querySelector<HTMLAnchorElement>('a');
    const a = document.createElement('a');
    a.className = 'header-nav-link';
    a.href = srcA?.href ?? '#';
    a.textContent = (srcA?.textContent ?? srcItem.textContent)?.trim() ?? '';
    moveInstrumentation(srcA ?? srcItem, a);
    return a;
  }

  items.forEach((item) => nav.append(makeNavLink(item)));

  return nav;
}

/**
 * Builds the CTA anchor from the authored aem-content field.
 */
function buildCtaZone(sourceAnchor: HTMLAnchorElement | null): HTMLAnchorElement {
  const cta = document.createElement('a');
  cta.className = 'header-cta';
  cta.href = sourceAnchor?.href ?? '/book';
  cta.textContent = sourceAnchor?.textContent?.trim() ?? 'BOOK YOUR STAY';
  if (sourceAnchor) moveInstrumentation(sourceAnchor, cta);
  return cta;
}

/** Mobile MENU toggle button. */
function buildMobileToggle(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'header-menu-toggle';
  btn.textContent = 'MENU';
  btn.setAttribute('aria-label', 'Open navigation menu');
  return btn;
}

/** Mobile CTA — shortened text. */
function buildMobileCta(sourceAnchor: HTMLAnchorElement | null): HTMLAnchorElement {
  const cta = document.createElement('a');
  cta.className = 'header-mobile-cta';
  cta.href = sourceAnchor?.href ?? '/book';
  cta.textContent = 'BOOK';
  if (sourceAnchor) moveInstrumentation(sourceAnchor, cta);
  return cta;
}

/**
 * Builds the slide-down mobile panel containing:
 * - nav links (cloned from authored list)
 * - lang accordion
 * - close button
 */
function buildMobilePanel(navList: Element, langList: Element): HTMLDivElement {
  const panel = document.createElement('div');
  panel.className = 'header-mobile-panel';

  // — Menu card (nav links + lang trigger) —
  const menuCard = document.createElement('div');
  menuCard.className = 'header-mobile-menu';

  const navItems = [...navList.querySelectorAll<HTMLLIElement>('li')].filter((li) => li.textContent?.trim());
  navItems.forEach((srcItem) => {
    const srcA = srcItem.querySelector<HTMLAnchorElement>('a');
    const a = document.createElement('a');
    a.className = 'header-mobile-nav-link';
    a.href = srcA?.href ?? '#';
    a.textContent = (srcA?.textContent ?? srcItem.textContent)?.trim() ?? '';
    menuCard.append(a);
  });

  const langToggle = document.createElement('button');
  langToggle.className = 'header-mobile-lang-toggle';
  langToggle.textContent = 'LANGUAGES';
  menuCard.append(langToggle);

  // — Lang list (direct child of panel, expands below card) —
  const langItems = [...langList.querySelectorAll<HTMLLIElement>('li')];
  const langUl = document.createElement('ul');
  langUl.className = 'header-mobile-lang-list';
  langItems.forEach((srcItem) => {
    const li = document.createElement('li');
    li.textContent = srcItem.textContent?.trim() ?? '';
    li.addEventListener('click', () => {
      panel.classList.remove('is-lang-expanded');
    });
    langUl.append(li);
  });

  langToggle.addEventListener('click', () => {
    panel.classList.toggle('is-lang-expanded');
  });

  // — Close button —
  const closeBtn = document.createElement('button');
  closeBtn.className = 'header-mobile-close';
  closeBtn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 14"><polyline points="38.7,12.7 20,1.5 1.3,12.7" fill="none" stroke="#242F3A" stroke-width="1.75"/></svg>';
  closeBtn.setAttribute('aria-label', 'Close navigation menu');

  closeBtn.addEventListener('click', () => {
    panel.classList.remove('is-open');
    panel.classList.remove('is-lang-expanded');
  });

  panel.append(menuCard, langUl, closeBtn);
  return panel;
}

/**
 * Decorates the luxury three-zone sticky header:
 * [language selector] [brand nav + emblem] [BOOK YOUR STAY]
 */
export default async function decorate(block: HTMLElement): Promise<void> {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location.href).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  if (!fragment) return;

  const sections = [...fragment.children] as HTMLElement[];

  // Section 0: language richtext — find <ul>
  const langList = sections[0]?.querySelector('ul, ol');

  // Section 1: nav richtext — find <ul>
  const navList = sections[1]?.querySelector('ul, ol');

  // Section 2: CTA — find <a>
  const ctaAnchor = sections[2]?.querySelector<HTMLAnchorElement>('a') ?? null;

  if (!langList || !navList) return;

  const [langZone, langDropdown] = buildLangZone(langList);

  // Emblem is a direct child of header-inner, absolutely centered at 50%,
  // so it stays at the true horizontal center regardless of link count.
  const emblem = document.createElement('img');
  emblem.className = 'header-emblem';
  emblem.src = '/icons/capella-emblem.svg';
  emblem.alt = '';

  // Mobile elements
  const mobileToggle = buildMobileToggle();
  const mobileCta = buildMobileCta(ctaAnchor);
  const mobilePanel = buildMobilePanel(navList, langList);

  mobileToggle.addEventListener('click', () => {
    mobilePanel.classList.toggle('is-open');
  });

  const inner = document.createElement('div');
  inner.className = 'header-inner';
  inner.append(langZone, buildNavZone(navList), emblem, buildCtaZone(ctaAnchor), mobileToggle, mobileCta);

  block.replaceChildren(inner, mobilePanel);

  // Append dropdown to body so it's outside the header's stacking context.
  // This ensures the header (z-index: 100) and its box-shadow paint on top.
  document.body.append(langDropdown);
}
