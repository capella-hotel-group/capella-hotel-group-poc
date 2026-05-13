import { fetchExperiencesViaProxy } from '@/utils/turneo-proxy-api';
import { getTurneoProxyConfig } from '@/configs/turneo-proxy';
import type { TurneoExperience } from '@/utils/turneo-proxy-api';

export default async function decorate(block: HTMLElement): Promise<void> {
  // Model fields → cell indices:
  //   (no author fields — this is a developer test block)
  const { baseUrl } = getTurneoProxyConfig();

  const wrapper = document.createElement('div');
  wrapper.className = 'turneo-proxy-test-wrapper';

  const header = buildHeader(baseUrl);
  wrapper.append(header);

  const statusEl = header.querySelector<HTMLElement>('.turneo-proxy-test-status');
  const labelEl = header.querySelector<HTMLElement>('.turneo-proxy-test-status-label');

  try {
    const experiences = await fetchExperiencesViaProxy();
    if (statusEl) {
      statusEl.classList.add('turneo-proxy-test-status--ok');
      statusEl.setAttribute('title', 'Proxy reachable');
    }
    if (labelEl) labelEl.textContent = `Connected — ${experiences.length} experience(s) returned`;

    const grid = buildGrid(experiences);
    wrapper.append(grid);
  } catch (error) {
    if (statusEl) {
      statusEl.classList.add('turneo-proxy-test-status--error');
      statusEl.setAttribute('title', 'Proxy unreachable');
    }
    if (labelEl) labelEl.textContent = 'Error — proxy not reachable';
    wrapper.append(buildError(error));
  }

  block.replaceChildren(wrapper);
}

function buildHeader(proxyUrl: string): HTMLElement {
  const header = document.createElement('div');
  header.className = 'turneo-proxy-test-header';

  const title = document.createElement('h2');
  title.className = 'turneo-proxy-test-title';
  title.textContent = 'Turneo Proxy Test';

  const meta = document.createElement('div');
  meta.className = 'turneo-proxy-test-meta';

  const status = document.createElement('span');
  status.className = 'turneo-proxy-test-status';

  const label = document.createElement('span');
  label.className = 'turneo-proxy-test-status-label';
  label.textContent = 'Loading…';

  const url = document.createElement('code');
  url.className = 'turneo-proxy-test-url';
  url.textContent = `${proxyUrl}/experiences`;

  meta.append(status, label);
  header.append(title, meta, url);
  return header;
}

function buildGrid(experiences: TurneoExperience[]): HTMLElement {
  const section = document.createElement('div');
  section.className = 'turneo-proxy-test-grid';

  if (experiences.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'turneo-proxy-test-empty';
    empty.textContent = 'No experiences returned from proxy.';
    section.append(empty);
    return section;
  }

  for (const exp of experiences) {
    section.append(buildCard(exp));
  }

  return section;
}

function buildCard(exp: TurneoExperience): HTMLElement {
  const card = document.createElement('div');
  card.className = 'turneo-proxy-test-card';

  const name = document.createElement('p');
  name.className = 'turneo-proxy-test-card-name';
  name.textContent = exp.name;

  const idEl = document.createElement('code');
  idEl.className = 'turneo-proxy-test-card-id';
  idEl.textContent = exp.id;

  const meta = document.createElement('div');
  meta.className = 'turneo-proxy-test-card-meta';

  if (exp.location?.city ?? exp.location?.country) {
    const loc = document.createElement('span');
    loc.textContent = [exp.location?.city, exp.location?.country].filter(Boolean).join(', ');
    meta.append(loc);
  }

  if (exp.minPrice) {
    const price = document.createElement('span');
    price.className = 'turneo-proxy-test-card-price';
    price.textContent = `From ${exp.minPrice.currency} ${exp.minPrice.amount}`;
    meta.append(price);
  }

  const toggle = document.createElement('button');
  toggle.className = 'turneo-proxy-test-card-toggle';
  toggle.textContent = 'Show raw JSON';
  toggle.type = 'button';

  const raw = document.createElement('pre');
  raw.className = 'turneo-proxy-test-card-raw';
  raw.hidden = true;
  raw.textContent = JSON.stringify(exp, null, 2);

  toggle.addEventListener('click', () => {
    raw.hidden = !raw.hidden;
    toggle.textContent = raw.hidden ? 'Show raw JSON' : 'Hide raw JSON';
  });

  card.append(name, idEl, meta, toggle, raw);
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
