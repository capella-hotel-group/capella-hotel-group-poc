import DOMPurify from 'dompurify';
import {
  fetchExperiences,
  fetchRates,
  type TurneoExperience,
  type TurneoRateDetail,
  type FetchExperiencesParams,
} from '@/utils/turneo-api';

const FALLBACK_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiB2aWV3Qm94PSIwIDAgNDAwIDI1MCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyNTAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiPkltYWdlIHVuYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';

function setFallbackImage(img: HTMLImageElement): void {
  img.onerror = null;
  img.src = FALLBACK_IMAGE;
}

export default async function decorate(block: HTMLElement): Promise<void> {
  // Model fields → cell indices:
  //   cells[0] = headline (text)
  //   cells[1] = storeId (text)
  const row = block.children[0] as HTMLElement | undefined;
  const cells = row ? ([...row.children] as HTMLElement[]) : [];
  const headlineText = cells[0]?.querySelector('p')?.textContent?.trim() || '';
  const storeId = cells[1]?.querySelector('p')?.textContent?.trim() || '';

  // Show skeleton loading state
  renderSkeleton(block, headlineText);

  try {
    const experiences = await fetchExperiences(storeId ? { storeId } : undefined);
    renderCards(block, experiences, headlineText, storeId);
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

function renderCards(block: HTMLElement, experiences: TurneoExperience[], headline: string, storeId: string): void {
  const wrapper = document.createDocumentFragment();

  if (headline) {
    const h2 = document.createElement('h2');
    h2.className = 'turneo-experiences-headline';
    h2.textContent = headline;
    wrapper.append(h2);
  }

  // Date filter
  const filterBar = createDateFilter(block, storeId, headline);
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

function createDateFilter(block: HTMLElement, storeId: string, headline: string): HTMLElement {
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
    const params: FetchExperiencesParams = {};
    if (storeId) params.storeId = storeId;
    if (from) params.from = from;
    if (until) params.until = until;

    try {
      const experiences = await fetchExperiences(Object.keys(params).length > 0 ? params : undefined);
      renderCards(block, experiences, headline, storeId);
    } catch (error) {
      console.error('[turneo-experiences] Failed to fetch with date filter:', error);
    }
  });

  return bar;
}

function createCard(experience: TurneoExperience): HTMLElement {
  const card = document.createElement('article');
  card.className = 'turneo-experiences-card';

  // Image
  const imageContainer = document.createElement('div');
  imageContainer.className = 'turneo-experiences-card-image';
  if (experience.images && experience.images.length > 0) {
    const img = document.createElement('img');
    img.src = experience.images[0].urlHigh;
    img.alt = experience.name;
    img.loading = 'lazy';
    img.onerror = () => setFallbackImage(img);
    imageContainer.append(img);
  } else {
    const img = document.createElement('img');
    img.src = FALLBACK_IMAGE;
    img.alt = experience.name;
    imageContainer.append(img);
  }

  // Body
  const body = document.createElement('div');
  body.className = 'turneo-experiences-card-body';

  const title = document.createElement('h3');
  title.className = 'turneo-experiences-card-title';
  title.textContent = experience.name;

  const desc = document.createElement('p');
  desc.className = 'turneo-experiences-card-desc';
  const descText = experience.highlight || experience.description || '';
  desc.innerHTML = DOMPurify.sanitize(descText);

  const cta = document.createElement('button');
  cta.className = 'turneo-experiences-card-cta';
  cta.textContent = 'Book';
  cta.type = 'button';
  cta.addEventListener('click', () => {
    console.log('[turneo-experiences] Experience detail:', experience);
    openDetailPopup(experience, cta);
  });

  body.append(title, desc, cta);
  card.append(imageContainer, body);

  return card;
}

// --- Detail Popup ---

function openDetailPopup(experience: TurneoExperience, triggerEl: HTMLElement): void {
  const overlay = document.createElement('div');
  overlay.className = 'turneo-experiences-popup';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', experience.name);

  const content = document.createElement('div');
  content.className = 'turneo-experiences-popup-content';

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'turneo-experiences-popup-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = '&times;';

  // Image slider
  const slider = createImageSlider(experience);

  // Info section
  const info = createInfoSection(experience);

  content.append(closeBtn, slider, info);
  overlay.append(content);
  document.body.append(overlay);
  document.body.style.overflow = 'hidden';

  // Load availability data
  loadAvailability(info, experience.id);

  // Focus management
  closeBtn.focus();

  // Close handlers
  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      close();
    }
    if (e.key === 'Tab') {
      trapFocus(e, overlay);
    }
  };

  function close() {
    overlay.remove();
    document.body.style.overflow = '';
    triggerEl.focus();
    document.removeEventListener('keydown', keyHandler);
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', keyHandler);
}

function trapFocus(e: KeyboardEvent, container: HTMLElement): void {
  const focusable = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function createImageSlider(experience: TurneoExperience): HTMLElement {
  const sliderContainer = document.createElement('div');
  sliderContainer.className = 'turneo-experiences-slider';

  const track = document.createElement('div');
  track.className = 'turneo-experiences-slider-track';

  const images = experience.images || [];

  images.forEach((image) => {
    const slide = document.createElement('div');
    slide.className = 'turneo-experiences-slider-slide';
    const img = document.createElement('img');
    img.src = image.urlHigh;
    img.alt = experience.name;
    img.loading = 'lazy';
    img.onerror = () => setFallbackImage(img);
    slide.append(img);
    track.append(slide);
  });

  sliderContainer.append(track);

  // Navigation dots (only if more than 1 image)
  if (images.length > 1) {
    const dots = document.createElement('div');
    dots.className = 'turneo-experiences-slider-dots';

    images.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = `turneo-experiences-slider-dot${i === 0 ? ' turneo-experiences-slider-dot--active' : ''}`;
      dot.type = 'button';
      dot.setAttribute('aria-label', `Go to image ${i + 1}`);
      dot.addEventListener('click', () => {
        const slideEl = track.children[i] as HTMLElement;
        slideEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      });
      dots.append(dot);
    });

    sliderContainer.append(dots);

    // Sync dots with scroll position
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Array.from(track.children).indexOf(entry.target);
            dots.querySelectorAll('.turneo-experiences-slider-dot').forEach((d, i) => {
              d.classList.toggle('turneo-experiences-slider-dot--active', i === index);
            });
          }
        });
      },
      { root: track, threshold: 0.5 },
    );

    Array.from(track.children).forEach((slide) => observer.observe(slide));
  }

  return sliderContainer;
}

function createInfoSection(experience: TurneoExperience): HTMLElement {
  const info = document.createElement('div');
  info.className = 'turneo-experiences-popup-info';

  // Title
  const title = document.createElement('h2');
  title.className = 'turneo-experiences-popup-title';
  title.textContent = experience.name;
  info.append(title);

  // Price
  if (experience.minPrice) {
    const price = document.createElement('div');
    price.className = 'turneo-experiences-popup-price';
    price.textContent = `From ${experience.minPrice.amount} ${experience.minPrice.currency}`;
    info.append(price);
  }

  // Highlight
  if (experience.highlight) {
    const highlight = document.createElement('p');
    highlight.className = 'turneo-experiences-popup-highlight';
    highlight.innerHTML = DOMPurify.sanitize(experience.highlight);
    info.append(highlight);
  }

  // Description
  if (experience.description) {
    const desc = document.createElement('div');
    desc.className = 'turneo-experiences-popup-desc';
    desc.innerHTML = DOMPurify.sanitize(experience.description);
    info.append(desc);
  }

  // Location
  if (experience.location) {
    const loc = experience.location;
    const locationEl = document.createElement('div');
    locationEl.className = 'turneo-experiences-popup-section';
    const parts = [loc.address, loc.city, loc.country].filter(Boolean);
    locationEl.innerHTML = `<h4>Location</h4><p>${DOMPurify.sanitize(parts.join(', '))}</p>`;
    info.append(locationEl);
  }

  // Duration
  if (experience.duration) {
    const durationEl = document.createElement('div');
    durationEl.className = 'turneo-experiences-popup-section';
    const durationText = formatDuration(experience.duration);
    durationEl.innerHTML = `<h4>Duration</h4><p>${DOMPurify.sanitize(durationText)}</p>`;
    info.append(durationEl);
  }

  // Categories
  if (experience.categories) {
    const cats = experience.categories;
    const tags: string[] = [];
    if (cats.theme) tags.push(...cats.theme);
    if (cats.type) tags.push(cats.type);
    if (tags.length > 0) {
      const catsEl = document.createElement('div');
      catsEl.className = 'turneo-experiences-popup-section';
      catsEl.innerHTML = `<h4>Categories</h4><div class="turneo-experiences-popup-tags">${tags.map((t) => `<span class="turneo-experiences-popup-tag">${DOMPurify.sanitize(t)}</span>`).join('')}</div>`;
      info.append(catsEl);
    }
  }

  // Included
  if (experience.included && experience.included.length > 0) {
    const includedEl = document.createElement('div');
    includedEl.className = 'turneo-experiences-popup-section';
    includedEl.innerHTML = `<h4>What's Included</h4><ul class="turneo-experiences-popup-list turneo-experiences-popup-list--included">${experience.included.map((item) => `<li>${DOMPurify.sanitize(item.name)}</li>`).join('')}</ul>`;
    info.append(includedEl);
  }

  // Excluded
  if (experience.excluded && experience.excluded.length > 0) {
    const excludedEl = document.createElement('div');
    excludedEl.className = 'turneo-experiences-popup-section';
    excludedEl.innerHTML = `<h4>Not Included</h4><ul class="turneo-experiences-popup-list turneo-experiences-popup-list--excluded">${experience.excluded.map((item) => `<li>${DOMPurify.sanitize(item.name)}</li>`).join('')}</ul>`;
    info.append(excludedEl);
  }

  // Organizer
  if (experience.organizer) {
    const org = experience.organizer;
    const orgEl = document.createElement('div');
    orgEl.className = 'turneo-experiences-popup-section';
    orgEl.innerHTML = `<h4>Organized by</h4><p>${DOMPurify.sanitize(org.name || '')}</p>`;
    info.append(orgEl);
  }

  // Languages
  if (experience.languages) {
    const langEl = document.createElement('div');
    langEl.className = 'turneo-experiences-popup-section';
    langEl.innerHTML = `<h4>Languages</h4><p>${DOMPurify.sanitize(experience.languages)}</p>`;
    info.append(langEl);
  }

  return info;
}

function formatDuration(duration: { hours?: number; minutes?: number }): string {
  const parts: string[] = [];
  if (duration.hours) parts.push(`${duration.hours}h`);
  if (duration.minutes) parts.push(`${duration.minutes}min`);
  return parts.join(' ') || 'Variable';
}

// --- Rates & Availability Section ---

async function loadAvailability(container: HTMLElement, experienceId: string): Promise<void> {
  const section = document.createElement('div');
  section.className = 'turneo-experiences-popup-section turneo-experiences-availability';
  section.innerHTML =
    '<h4>Availability</h4><p class="turneo-experiences-availability-loading">Loading availability…</p>';
  container.append(section);

  const today = new Date();
  const until = new Date(today);
  until.setDate(until.getDate() + 30);

  const from = today.toISOString().split('T')[0];
  const untilStr = until.toISOString().split('T')[0];

  try {
    const rates = await fetchRates({ experienceId, from, until: untilStr });
    renderRateSlots(section, rates);
  } catch (error) {
    console.error('[turneo-experiences] Failed to load availability:', error);
    section.innerHTML =
      '<h4>Availability</h4><p class="turneo-experiences-availability-error">Unable to load availability.</p>';
  }
}

function renderRateSlots(section: HTMLElement, rates: TurneoRateDetail[]): void {
  if (rates.length === 0) {
    section.innerHTML =
      '<h4>Availability</h4><p class="turneo-experiences-availability-empty">No availability found for the next 30 days.</p>';
    return;
  }

  let html = '<h4>Availability</h4><div class="turneo-experiences-availability-list">';
  rates.forEach((rate) => {
    html += `<div class="turneo-experiences-availability-rate"><strong>${DOMPurify.sanitize(rate.rateName)}</strong>`;
    html += ` <span class="turneo-experiences-availability-rate-status">[${DOMPurify.sanitize(rate.rateStatus)}]</span>`;
    if (rate.duration) {
      html += ` — ${DOMPurify.sanitize(rate.duration)}`;
    }
    html += '</div>';

    if (rate.availableDates && rate.availableDates.length > 0) {
      rate.availableDates.forEach((slot) => {
        const dateStr = slot.startDate || slot.date || '';
        const timeStr = slot.startTime || '';
        const qty = slot.availableQuantity ?? '—';
        html += `<div class="turneo-experiences-availability-slot">
          <span class="turneo-experiences-availability-time">${DOMPurify.sanitize(dateStr)} ${DOMPurify.sanitize(timeStr)}</span>
          <span class="turneo-experiences-availability-qty">${qty} spots</span>
        </div>`;
      });
    } else {
      html += '<div class="turneo-experiences-availability-slot"><span>No dates available</span></div>';
    }
  });
  html += '</div>';

  section.innerHTML = html;
}
