import DOMPurify from 'dompurify';
import type { HotspotConfig } from './types';

export interface PopupController {
  dialog: HTMLDialogElement;
  open(hotspot: HotspotConfig, trigger: HTMLElement): void;
  close(): void;
}

function buildMetaRow(term: string, value: string): HTMLElement | null {
  if (!value.trim()) return null;
  const wrapper = document.createElement('div');
  wrapper.className = 'interactive-destination-map-dialog-meta-row';
  const dt = document.createElement('dt');
  dt.textContent = term;
  const dd = document.createElement('dd');
  dd.textContent = value;
  wrapper.append(dt, dd);
  return wrapper;
}

/**
 * Creates a single reusable native <dialog>-based popup for the map. `onClose` receives the
 * triggering element so focus can be returned to it; `onCtaClick` is fired (best-effort) when
 * the CTA link is activated, before the browser navigates.
 */
export function createPopupController(
  onClose: (trigger: HTMLElement | null) => void,
  onCtaClick: (hotspot: HotspotConfig) => void,
): PopupController {
  const dialog = document.createElement('dialog');
  dialog.className = 'interactive-destination-map-dialog';

  const titleId = `idm-dialog-title-${Math.random().toString(36).slice(2, 8)}`;
  const descId = `idm-dialog-desc-${Math.random().toString(36).slice(2, 8)}`;
  dialog.setAttribute('aria-labelledby', titleId);
  dialog.setAttribute('aria-describedby', descId);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'interactive-destination-map-dialog-close';
  closeButton.setAttribute('aria-label', 'Close');
  const closeIcon = document.createElement('img');
  closeIcon.src = `${window.hlx.codeBasePath}/icons/map-close.svg`;
  closeIcon.alt = '';
  closeIcon.width = 16;
  closeIcon.height = 16;
  closeIcon.loading = 'lazy';
  closeButton.append(closeIcon);
  closeButton.addEventListener('click', () => dialog.close());

  const body = document.createElement('div');
  body.className = 'interactive-destination-map-dialog-body';

  dialog.append(closeButton, body);

  let currentTrigger: HTMLElement | null = null;

  dialog.addEventListener('close', () => {
    onClose(currentTrigger);
    currentTrigger?.focus();
    currentTrigger = null;
  });

  // Clicking the backdrop (native ::backdrop area, i.e. a click landing on the <dialog> itself
  // rather than its content) closes the dialog, matching common modal expectations.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  function populate(hotspot: HotspotConfig): void {
    body.replaceChildren();

    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'interactive-destination-map-dialog-thumb';
    if (hotspot.thumbnail?.src) {
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = hotspot.thumbnail.alt || '';
      img.addEventListener('error', () => thumbWrap.classList.add('interactive-destination-map-dialog-thumb--error'));
      img.src = hotspot.thumbnail.src;
      thumbWrap.append(img);
      body.append(thumbWrap);
    }

    const title = document.createElement('h3');
    title.id = titleId;
    title.className = 'interactive-destination-map-dialog-title';
    title.textContent = hotspot.title || hotspot.label;
    body.append(title);

    if (hotspot.category.trim()) {
      const category = document.createElement('p');
      category.className = 'interactive-destination-map-dialog-category';
      category.textContent = hotspot.category;
      body.append(category);
    }

    const desc = document.createElement('p');
    desc.id = descId;
    desc.className = 'interactive-destination-map-dialog-description';
    desc.textContent = hotspot.description;
    body.append(desc);

    if (hotspot.detail.trim()) {
      const detail = document.createElement('div');
      detail.className = 'interactive-destination-map-dialog-detail';
      detail.innerHTML = DOMPurify.sanitize(hotspot.detail);
      body.append(detail);
    }

    const meta = document.createElement('dl');
    meta.className = 'interactive-destination-map-dialog-meta';
    [buildMetaRow('Location', hotspot.location), buildMetaRow('Hours', hotspot.hours)]
      .filter((row): row is HTMLElement => row !== null)
      .forEach((row) => meta.append(row));
    if (meta.children.length > 0) body.append(meta);

    if (hotspot.highlights.length > 0) {
      const list = document.createElement('ul');
      list.className = 'interactive-destination-map-dialog-highlights';
      hotspot.highlights.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        list.append(li);
      });
      body.append(list);
    }

    if (hotspot.ctaText.trim() && hotspot.ctaLink.trim()) {
      const cta = document.createElement('a');
      cta.className = 'interactive-destination-map-dialog-cta';
      cta.href = hotspot.ctaLink;
      cta.textContent = hotspot.ctaText;
      cta.addEventListener('click', () => onCtaClick(hotspot));
      body.append(cta);
    }
  }

  function open(hotspot: HotspotConfig, trigger: HTMLElement): void {
    currentTrigger = trigger;
    populate(hotspot);
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      // Fallback for browsers without <dialog> support: render as a plain, focusable block.
      dialog.setAttribute('open', '');
      dialog.focus();
    }
  }

  function close(): void {
    if (dialog.open) dialog.close();
  }

  return { dialog, open, close };
}
