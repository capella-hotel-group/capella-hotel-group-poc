import DOMPurify from 'dompurify';
import {
  fetchExperiencesViaAppBuilder,
  CAPELLA_STORE_ID,
  type AppBuilderExperience,
  type FetchAppBuilderParams,
} from '@/utils/turneo-appbuilder-api';
import { buildWidgetExperienceParam, mountWidgetDetail } from '@/utils/turneo-widget-api';

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

  try {
    const experiences = await fetchExperiencesViaAppBuilder({ storeId: CAPELLA_STORE_ID });
    renderCards(block, experiences, headlineText);
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

function renderCards(block: HTMLElement, experiences: AppBuilderExperience[], headline: string): void {
  const wrapper = document.createDocumentFragment();

  if (headline) {
    const h2 = document.createElement('h2');
    h2.className = 'turneo-experiences-headline';
    h2.textContent = headline;
    wrapper.append(h2);
  }

  // Date filter
  const filterBar = createDateFilter(block, headline);
  wrapper.append(filterBar);

  const grid = document.createElement('div');
  grid.className = 'turneo-experiences-grid';

  experiences.forEach((experience) => {
    const card = createCard(experience);
    grid.append(card);
  });

  wrapper.append(grid);
  block.replaceChildren(...Array.from(wrapper.childNodes));
}

function createDateFilter(block: HTMLElement, headline: string): HTMLElement {
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
      renderCards(block, experiences, headline);
    } catch (error) {
      console.error('[turneo-experiences] Failed to fetch with date filter:', error);
    }
  });

  return bar;
}

function createCard(experience: AppBuilderExperience): HTMLElement {
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

  // Detail is rendered by the real turneo-widget — deep-link via the same `turneoExperience` param it reads.
  const cta = document.createElement('a');
  cta.className = 'turneo-experiences-card-cta';
  cta.textContent = experience.minPrice
    ? `Book — from ${experience.minPrice.currency} ${experience.minPrice.amount}`
    : 'Book';
  const detailUrl = new URL(window.location.href);
  detailUrl.searchParams.set('turneoExperience', buildWidgetExperienceParam(experience.id, experience.title));
  cta.href = detailUrl.toString();

  body.append(title, desc, cta);
  card.append(imageContainer, body);

  return card;
}
