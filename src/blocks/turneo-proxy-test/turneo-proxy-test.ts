import DOMPurify from 'dompurify';
import { fetchExperiencesViaProxy } from '@/utils/turneo-proxy-api';
import type { TurneoExperience } from '@/utils/turneo-proxy-api';

export default async function decorate(block: HTMLElement): Promise<void> {
  const wrapper = document.createElement('div');
  wrapper.className = 'turneo-proxy-test-wrapper';

  const gridEl = document.createElement('div');
  gridEl.className = 'turneo-proxy-test-grid';

  const filter = buildFilter(async (from, to) => {
    setGridLoading(gridEl);
    try {
      const params = from || to ? { from: from || undefined, until: to || undefined } : undefined;
      const experiences = await fetchExperiencesViaProxy(params);
      gridEl.replaceChildren(...buildGridChildren(experiences));
    } catch (error) {
      gridEl.replaceChildren(buildError(error));
    }
  });

  wrapper.append(filter, gridEl);

  // Initial load
  setGridLoading(gridEl);
  try {
    const experiences = await fetchExperiencesViaProxy();
    gridEl.replaceChildren(...buildGridChildren(experiences));
  } catch (error) {
    gridEl.replaceChildren(buildError(error));
  }

  block.replaceChildren(wrapper);
}

function buildFilter(onSearch: (from: string, to: string) => Promise<void>): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'turneo-proxy-test-filter';

  const fromGroup = buildDateField('from', 'Check-in');
  const toGroup = buildDateField('to', 'Check-out');

  const fromInput = fromGroup.querySelector<HTMLInputElement>('input')!;
  const toInput = toGroup.querySelector<HTMLInputElement>('input')!;

  // Keep min/max in sync
  fromInput.addEventListener('change', () => {
    if (fromInput.value) toInput.min = fromInput.value;
  });
  toInput.addEventListener('change', () => {
    if (toInput.value) fromInput.max = toInput.value;
  });

  const btn = document.createElement('button');
  btn.className = 'turneo-proxy-test-filter-btn';
  btn.type = 'button';
  btn.textContent = 'Search';
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Searching…';
    await onSearch(fromInput.value, toInput.value);
    btn.disabled = false;
    btn.textContent = 'Search';
  });

  bar.append(fromGroup, toGroup, btn);
  return bar;
}

function buildDateField(id: string, label: string): HTMLElement {
  const group = document.createElement('div');
  group.className = 'turneo-proxy-test-filter-field';

  const lbl = document.createElement('label');
  lbl.className = 'turneo-proxy-test-filter-label';
  lbl.htmlFor = `tpt-${id}`;
  lbl.textContent = label;

  const inputWrap = document.createElement('div');
  inputWrap.className = 'turneo-proxy-test-filter-input-wrap';

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 20 20');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML =
    '<rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M2 8h16" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M6 2v4M14 2v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';

  const input = document.createElement('input');
  input.type = 'date';
  input.id = `tpt-${id}`;
  input.className = 'turneo-proxy-test-filter-input';
  input.min = new Date().toISOString().split('T')[0];

  inputWrap.append(icon, input);
  group.append(lbl, inputWrap);
  return group;
}

function setGridLoading(gridEl: HTMLElement): void {
  gridEl.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'turneo-proxy-test-skeleton';
    gridEl.append(skeleton);
  }
}

function buildGridChildren(experiences: TurneoExperience[]): HTMLElement[] {
  if (experiences.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'turneo-proxy-test-empty';
    empty.textContent = 'No experiences returned.';
    return [empty];
  }
  return experiences.map(buildCard);
}

function buildCard(exp: TurneoExperience): HTMLElement {
  const card = document.createElement('article');
  card.className = 'turneo-proxy-test-card';

  // Thumbnail
  const thumbnail = document.createElement('div');
  thumbnail.className = 'turneo-proxy-test-card-thumbnail';
  if (exp.images && exp.images.length > 0) {
    const img = document.createElement('img');
    img.src = exp.images[0].urlHigh;
    img.alt = exp.images[0].altText ?? exp.name;
    img.loading = 'lazy';
    img.onerror = () => {
      img.onerror = null;
      thumbnail.removeChild(img);
    };
    thumbnail.append(img);
  }

  // Body
  const body = document.createElement('div');
  body.className = 'turneo-proxy-test-card-body';

  const title = document.createElement('h3');
  title.className = 'turneo-proxy-test-card-title';
  title.textContent = exp.name;

  const desc = document.createElement('p');
  desc.className = 'turneo-proxy-test-card-desc';
  desc.innerHTML = DOMPurify.sanitize(exp.highlight || exp.description || '');

  const footer = document.createElement('div');
  footer.className = 'turneo-proxy-test-card-footer';

  if (exp.minPrice) {
    const price = document.createElement('span');
    price.className = 'turneo-proxy-test-card-price';
    price.textContent = `From ${exp.minPrice.currency} ${exp.minPrice.amount}`;
    footer.append(price);
  }

  body.append(title, desc, footer);
  card.append(thumbnail, body);
  return card;
}

function buildError(error: unknown): HTMLElement {
  const box = document.createElement('div');
  box.className = 'turneo-proxy-test-error';

  const msg = document.createElement('p');
  msg.textContent = 'Could not reach the proxy server. Make sure it is running:';

  const cmd = document.createElement('code');
  cmd.textContent = 'npm run proxy';

  const detail = document.createElement('pre');
  detail.className = 'turneo-proxy-test-error-detail';
  detail.textContent = error instanceof Error ? error.message : String(error);

  box.append(msg, cmd, detail);
  return box;
}
