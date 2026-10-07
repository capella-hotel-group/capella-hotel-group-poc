import DOMPurify from 'dompurify';
import {
  fetchExperiencesViaAppBuilder,
  CAPELLA_STORE_ID,
  type AppBuilderExperience,
  type FetchAppBuilderParams,
} from '@/utils/turneo-appbuilder-api';
import { buildWidgetFrameUrl, mountWidgetDetail } from '@/utils/turneo-widget-api';

const FALLBACK_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiB2aWV3Qm94PSIwIDAgNDAwIDI1MCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyNTAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiPkltYWdlIHVuYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';

function setFallbackImage(img: HTMLImageElement): void {
  img.onerror = null;
  img.src = FALLBACK_IMAGE;
}

export default async function decorate(block: HTMLElement): Promise<void> {
  // Model fields → cell indices:
  //   cells[0] = headline (text)
  //   cells[1] = storeId (text) — unused: this block is pinned to CAPELLA_STORE_ID (see turneo-appbuilder-api.ts)
  const row = block.children[0] as HTMLElement | undefined;
  const cells = row ? ([...row.children] as HTMLElement[]) : [];
  const headlineText = cells[0]?.querySelector('p')?.textContent?.trim() || '';

  // Detail route (`?turneoExperience=<id>_<slug>`) — hand off to the real turneo-widget to render it.
  const experienceParam = new URLSearchParams(window.location.search).get('turneoExperience');
  if (experienceParam) {
    block.replaceChildren();
    mountWidgetDetail(block);
    return;
  }

  // Show skeleton loading state
  renderSkeleton(block, headlineText);

  // Two popups per block instance, reused across cards and re-renders (date filter):
  // one with our own custom layout, one embedding the real turneo-widget as-is.
  const widgetDialog = createWidgetDialog();
  const dialog = createDetailDialog((experience) => widgetDialog.open(experience));

  try {
    const experiences = await fetchExperiencesViaAppBuilder({ storeId: CAPELLA_STORE_ID });
    renderCards(block, experiences, headlineText, dialog, widgetDialog);
  } catch (error) {
    renderError(block);
    console.error('[turneo-experiences] Failed to fetch experiences:', error);
  }
}

function renderSkeleton(block: HTMLElement, headline: string): void {
  const wrapper = document.createDocumentFragment();

  if (headline) {
    const h2 = document.createElement('h2');
    h2.className = 'turneo-experiences-headline';
    h2.textContent = headline;
    wrapper.append(h2);
  }

  const grid = document.createElement('div');
  grid.className = 'turneo-experiences-grid';

  for (let i = 0; i < 6; i++) {
    const card = document.createElement('div');
    card.className = 'turneo-experiences-card turneo-experiences-card--skeleton';
    card.innerHTML = `
      <div class="turneo-experiences-card-image turneo-experiences-skeleton-shimmer"></div>
      <div class="turneo-experiences-card-body">
        <div class="turneo-experiences-skeleton-title turneo-experiences-skeleton-shimmer"></div>
        <div class="turneo-experiences-skeleton-desc turneo-experiences-skeleton-shimmer"></div>
        <div class="turneo-experiences-skeleton-btn turneo-experiences-skeleton-shimmer"></div>
      </div>
    `;
    grid.append(card);
  }

  wrapper.append(grid);
  block.replaceChildren(...Array.from(wrapper.childNodes));
}

function renderError(block: HTMLElement): void {
  const errorEl = document.createElement('div');
  errorEl.className = 'turneo-experiences-error';
  errorEl.textContent = 'Unable to load experiences. Please try again later.';
  block.replaceChildren(errorEl);
}

function renderCards(
  block: HTMLElement,
  experiences: AppBuilderExperience[],
  headline: string,
  dialog: DetailDialogController,
  widgetDialog: DetailDialogController,
): void {
  const wrapper = document.createDocumentFragment();

  if (headline) {
    const h2 = document.createElement('h2');
    h2.className = 'turneo-experiences-headline';
    h2.textContent = headline;
    wrapper.append(h2);
  }

  // Date filter
  const filterBar = createDateFilter(block, headline, dialog, widgetDialog);
  wrapper.append(filterBar);

  const grid = document.createElement('div');
  grid.className = 'turneo-experiences-grid';

  experiences.forEach((experience) => {
    const card = createCard(experience, dialog, widgetDialog);
    grid.append(card);
  });

  wrapper.append(grid);
  block.replaceChildren(...Array.from(wrapper.childNodes));
}

function createDateFilter(
  block: HTMLElement,
  headline: string,
  dialog: DetailDialogController,
  widgetDialog: DetailDialogController,
): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'turneo-experiences-filter';

  const label = document.createElement('span');
  label.className = 'turneo-experiences-filter-label';
  label.textContent = 'Dates:';

  const fromInput = document.createElement('input');
  fromInput.type = 'date';
  fromInput.className = 'turneo-experiences-filter-input';
  fromInput.setAttribute('aria-label', 'From date (ISO 8601: YYYY-MM-DD)');
  fromInput.placeholder = 'YYYY-MM-DD';

  const toInput = document.createElement('input');
  toInput.type = 'date';
  toInput.className = 'turneo-experiences-filter-input';
  toInput.setAttribute('aria-label', 'Until date (ISO 8601: YYYY-MM-DD)');
  toInput.placeholder = 'YYYY-MM-DD';

  const filterBtn = document.createElement('button');
  filterBtn.type = 'button';
  filterBtn.className = 'turneo-experiences-filter-btn';
  filterBtn.textContent = 'Filter';

  bar.append(label, fromInput, toInput, filterBtn);

  filterBtn.addEventListener('click', async () => {
    const from = fromInput.value || undefined;
    const until = toInput.value || undefined;
    const params: FetchAppBuilderParams = { storeId: CAPELLA_STORE_ID };
    if (from) params.from = from;
    if (until) params.until = until;

    try {
      const experiences = await fetchExperiencesViaAppBuilder(params);
      renderCards(block, experiences, headline, dialog, widgetDialog);
    } catch (error) {
      console.error('[turneo-experiences] Failed to fetch with date filter:', error);
    }
  });

  return bar;
}

function createCard(
  experience: AppBuilderExperience,
  dialog: DetailDialogController,
  widgetDialog: DetailDialogController,
): HTMLElement {
  const card = document.createElement('article');
  card.className = 'turneo-experiences-card';

  // Image
  const imageContainer = document.createElement('div');
  imageContainer.className = 'turneo-experiences-card-image';
  const img = document.createElement('img');
  img.src = experience.image || FALLBACK_IMAGE;
  img.alt = experience.title;
  img.loading = 'lazy';
  img.onerror = () => setFallbackImage(img);
  imageContainer.append(img);

  // Body
  const body = document.createElement('div');
  body.className = 'turneo-experiences-card-body';

  const title = document.createElement('h3');
  title.className = 'turneo-experiences-card-title';
  title.textContent = experience.title;

  const desc = document.createElement('p');
  desc.className = 'turneo-experiences-card-desc';
  const descText = experience.highlight || experience.description || '';
  desc.innerHTML = DOMPurify.sanitize(descText);

  // Opens the custom-built popup below — no navigation, no reliance on the real turneo-widget's own UI.
  const cta = document.createElement('button');
  cta.type = 'button';
  cta.className = 'turneo-experiences-card-cta';
  cta.textContent = experience.minPrice
    ? `View details — from ${experience.minPrice.currency} ${experience.minPrice.amount}`
    : 'View details';
  cta.addEventListener('click', () => dialog.open(experience));

  const widgetCta = document.createElement('button');
  widgetCta.type = 'button';
  widgetCta.className = 'turneo-experiences-card-cta turneo-experiences-card-cta--secondary';
  widgetCta.textContent = 'Turneo widget';
  widgetCta.addEventListener('click', () => widgetDialog.open(experience));

  const ctaRow = document.createElement('div');
  ctaRow.className = 'turneo-experiences-card-actions';
  ctaRow.append(cta, widgetCta);

  body.append(title, desc, ctaRow);
  card.append(imageContainer, body);

  return card;
}

function formatDuration(duration: string): string {
  const [hoursText, minutesText] = duration.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  return parts.join(' ') || duration;
}

function formatPriceRange(min: AppBuilderExperience['minPrice'], max: AppBuilderExperience['maxPrice']): string {
  if (!min) return '';
  if (!max || max.amount === min.amount) return `${min.currency} ${min.amount}`;
  return `${min.currency} ${min.amount}–${max.amount}`;
}

interface DetailDialogController {
  open(experience: AppBuilderExperience): void;
}

/**
 * Single reusable popup rendering our own detail layout from data the listing call already
 * fetched (no extra request) — proves a custom-styled detail view distinct from the real
 * turneo-widget's UI, shown as a true modal popup (native <dialog>.showModal()).
 */
function createDetailDialog(onBook: (experience: AppBuilderExperience) => void): DetailDialogController {
  const dialog = document.createElement('dialog');
  dialog.className = 'turneo-experiences-dialog';

  const titleId = `turneo-experiences-dialog-title-${Math.random().toString(36).slice(2, 8)}`;
  dialog.setAttribute('aria-labelledby', titleId);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'turneo-experiences-dialog-close';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => dialog.close());

  const body = document.createElement('div');
  body.className = 'turneo-experiences-dialog-body';

  dialog.append(closeButton, body);
  document.body.append(dialog);

  // Clicking the backdrop (a click landing on the <dialog> itself, not its content) closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  function open(experience: AppBuilderExperience): void {
    body.replaceChildren();

    const imageWrap = document.createElement('div');
    imageWrap.className = 'turneo-experiences-dialog-image';
    const img = document.createElement('img');
    img.src = experience.image || FALLBACK_IMAGE;
    img.alt = experience.title;
    img.onerror = () => setFallbackImage(img);
    imageWrap.append(img);

    const content = document.createElement('div');
    content.className = 'turneo-experiences-dialog-content';

    const title = document.createElement('h2');
    title.id = titleId;
    title.className = 'turneo-experiences-dialog-title';
    title.textContent = experience.title;

    const meta = document.createElement('div');
    meta.className = 'turneo-experiences-dialog-meta';
    if (experience.address) {
      const location = document.createElement('span');
      location.className = 'turneo-experiences-dialog-meta-item';
      location.textContent = experience.address;
      meta.append(location);
    }
    if (experience.duration) {
      const duration = document.createElement('span');
      duration.className = 'turneo-experiences-dialog-meta-item';
      duration.textContent = formatDuration(experience.duration);
      meta.append(duration);
    }

    const desc = document.createElement('p');
    desc.className = 'turneo-experiences-dialog-description';
    desc.innerHTML = DOMPurify.sanitize(experience.description || experience.highlight || '');

    content.append(title, meta, desc);

    if (experience.included?.length) {
      const includedTitle = document.createElement('h3');
      includedTitle.className = 'turneo-experiences-dialog-subheading';
      includedTitle.textContent = "What's included";

      const includedList = document.createElement('ul');
      includedList.className = 'turneo-experiences-dialog-included';
      experience.included.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        includedList.append(li);
      });

      content.append(includedTitle, includedList);
    }

    const footer = document.createElement('div');
    footer.className = 'turneo-experiences-dialog-footer';

    const priceText = formatPriceRange(experience.minPrice, experience.maxPrice);
    if (priceText) {
      const price = document.createElement('span');
      price.className = 'turneo-experiences-dialog-price';
      price.textContent = `From ${priceText}`;
      footer.append(price);
    }

    // Booking (rates → availability → order) is handled by the real widget, swapped in without leaving the page.
    const bookCta = document.createElement('button');
    bookCta.type = 'button';
    bookCta.className = 'turneo-experiences-dialog-cta';
    bookCta.textContent = 'Check availability & book';
    bookCta.addEventListener('click', () => {
      dialog.close();
      onBook(experience);
    });
    footer.append(bookCta);

    content.append(footer);
    body.append(imageWrap, content);

    dialog.showModal();
    closeButton.focus();
  }

  return { open };
}

/**
 * Popup showing the real `<turneo-widget>` detail/booking view, loaded in an iframe. The widget
 * can't be mounted inline: it portals its detail modal to `document.body` (escaping our dialog)
 * and only opens detail when it reads `?turneoExperience=` on a real page load. An iframe gives it
 * its own document and URL, so the detail renders deterministically inside the popup's box.
 */
function createWidgetDialog(): DetailDialogController {
  const dialog = document.createElement('dialog');
  dialog.className = 'turneo-experiences-widget-dialog';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'turneo-experiences-dialog-close';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.textContent = '×';

  const body = document.createElement('div');
  body.className = 'turneo-experiences-widget-dialog-body';

  dialog.append(closeButton, body);
  document.body.append(dialog);

  // Removing the iframe fully stops the widget (no lingering requests). The `close` event is async, so a
  // late one from a previous close must not wipe a freshly reopened frame — hence the `open` guard.
  const teardown = (): void => {
    if (!dialog.open) body.replaceChildren();
  };
  const close = (): void => {
    dialog.close();
    teardown();
  };

  closeButton.addEventListener('click', close);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener('close', teardown);

  function open(experience: AppBuilderExperience): void {
    const frame = document.createElement('iframe');
    frame.className = 'turneo-experiences-widget-frame';
    frame.title = `${experience.title} — booking`;
    frame.src = buildWidgetFrameUrl(experience.id, experience.title);
    body.replaceChildren(frame);

    dialog.showModal();
    closeButton.focus();
  }

  return { open };
}
