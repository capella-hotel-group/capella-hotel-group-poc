function closeLangDropdown(trigger: HTMLButtonElement, dropdown: HTMLUListElement): void {
  trigger.setAttribute('aria-expanded', 'false');
  dropdown.classList.remove('is-open');
}

function buildLangZone(): [HTMLDivElement, HTMLUListElement] {
  const trigger = document.createElement('button');
  trigger.className = 'header-lang-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.textContent = 'ENGLISH ▾';

  // Dropdown is intentionally NOT appended inside the header element.
  // It is appended to document.body in decorate() so it lives in the root
  // stacking context (z-index: 99) beneath the sticky header (z-index: 100),
  // which allows the header's box-shadow to paint on top of the dropdown.
  const dropdown = document.createElement('ul');
  dropdown.className = 'header-lang-dropdown';
  dropdown.setAttribute('role', 'listbox');

  ['ENGLISH', '简体中文', '日本語'].forEach((lang) => {
    const item = document.createElement('li');
    item.setAttribute('role', 'option');
    item.setAttribute('tabindex', '0');
    item.textContent = lang;
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

function buildNavZone(): HTMLElement {
  const destLink = document.createElement('a');
  destLink.className = 'header-nav-link';
  destLink.href = '/destinations';
  destLink.textContent = 'DESTINATIONS';

  // emblem: static brand asset, not authored content
  const emblem = document.createElement('img');
  emblem.className = 'header-emblem';
  emblem.src = '/icons/capella-emblem.svg';
  emblem.alt = '';

  const expLink = document.createElement('a');
  expLink.className = 'header-nav-link';
  expLink.href = '/experiences';
  expLink.textContent = 'EXPERIENCES';

  const nav = document.createElement('nav');
  nav.className = 'header-nav';
  nav.setAttribute('aria-label', 'Primary navigation');
  nav.append(destLink, emblem, expLink);
  return nav;
}

function buildCtaZone(): HTMLAnchorElement {
  const cta = document.createElement('a');
  cta.className = 'header-cta';
  cta.href = '/book';
  cta.textContent = 'BOOK YOUR STAY';
  return cta;
}

/**
 * Decorates the luxury three-zone sticky header:
 * [language selector] [brand nav + emblem] [BOOK YOUR STAY]
 */
export default async function decorate(block: HTMLElement): Promise<void> {
  if (window.location.pathname.includes('/en/exploration')) {
    block.closest('header')?.remove();
    return;
  }

  const [langZone, langDropdown] = buildLangZone();

  const inner = document.createElement('div');
  inner.className = 'header-inner';
  inner.append(langZone, buildNavZone(), buildCtaZone());

  block.replaceChildren(inner);

  // Append dropdown to body so it's outside the header's stacking context.
  // This ensures the header (z-index: 100) and its box-shadow paint on top.
  document.body.append(langDropdown);
}
