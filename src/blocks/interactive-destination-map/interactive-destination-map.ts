// src/blocks/interactive-destination-map/interactive-destination-map.ts
import DOMPurify from 'dompurify';
import { moveInstrumentation } from '@/app/scripts';
import { isUniversalEditor } from '@/utils/env';
import { buildLayerPicture } from './lib/layers';
import { parseMapContent } from './lib/parse-content';
import type { EnhanceContext, HotspotConfig, LayerConfig, MapContent } from './lib/types';
import { validateMapContent } from './lib/validate';

const INTERSECTION_ROOT_MARGIN = '600px 0px';

function buildMetaRow(term: string, value: string): HTMLElement | null {
  if (!value.trim()) return null;
  const row = document.createElement('div');
  row.className = 'interactive-destination-map-list-meta-row';
  const dt = document.createElement('dt');
  dt.textContent = term;
  const dd = document.createElement('dd');
  dd.textContent = value;
  row.append(dt, dd);
  return row;
}

function buildHotspotListItem(hotspot: HotspotConfig): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'interactive-destination-map-list-item';

  if (hotspot.thumbnail?.src) {
    const img = document.createElement('img');
    img.className = 'interactive-destination-map-list-thumb';
    img.loading = 'lazy';
    img.src = hotspot.thumbnail.src;
    img.alt = hotspot.thumbnail.alt || '';
    img.addEventListener('error', () => img.classList.add('interactive-destination-map-list-thumb--error'));
    li.append(img);
  }

  const title = document.createElement('h3');
  title.className = 'interactive-destination-map-list-title';
  title.textContent = hotspot.title || hotspot.label;
  li.append(title);

  if (hotspot.description.trim()) {
    const desc = document.createElement('p');
    desc.className = 'interactive-destination-map-list-description';
    desc.textContent = hotspot.description;
    li.append(desc);
  }

  const meta = document.createElement('dl');
  meta.className = 'interactive-destination-map-list-meta';
  [
    buildMetaRow('Category', hotspot.category),
    buildMetaRow('Location', hotspot.location),
    buildMetaRow('Hours', hotspot.hours),
  ]
    .filter((row): row is HTMLElement => row !== null)
    .forEach((row) => meta.append(row));
  if (meta.children.length > 0) li.append(meta);

  if (hotspot.ctaText.trim() && hotspot.ctaLink.trim()) {
    const cta = document.createElement('a');
    cta.className = 'interactive-destination-map-list-cta';
    cta.href = hotspot.ctaLink;
    cta.textContent = hotspot.ctaText;
    li.append(cta);
  }

  moveInstrumentation(hotspot.sourceRow, li);
  return li;
}

/** Editor-only fallback: render every layer as a simple card so authors can find/edit each one. */
function buildEditorLayerList(layers: LayerConfig[]): HTMLElement {
  const list = document.createElement('ul');
  list.className = 'interactive-destination-map-editor-layers';
  layers.forEach((layer) => {
    const li = document.createElement('li');
    li.className = 'interactive-destination-map-editor-layer';
    const picture = buildLayerPicture(layer, false);
    const title = document.createElement('p');
    title.textContent = layer.title || layer.layerId;
    li.append(picture, title);
    moveInstrumentation(layer.sourceRow, li);
    list.append(li);
  });
  return list;
}

function instrumentFromRow(row: HTMLElement | undefined, to: Element): void {
  if (!row) return;
  moveInstrumentation(row.querySelector<HTMLElement>(':scope > div') ?? row, to);
}

function renderStandardMode(block: HTMLElement, content: MapContent): EnhanceContext | null {
  const rows = [...block.children] as HTMLElement[];
  const [headingRow, introRow, , , , , , , a11yRow] = rows;

  const root = document.createElement('div');
  root.className = 'interactive-destination-map-root';

  const heading = document.createElement('h2');
  heading.className = 'interactive-destination-map-heading';
  heading.textContent = content.config.heading;
  instrumentFromRow(headingRow, heading);
  root.append(heading);

  if (content.config.intro.trim()) {
    const intro = document.createElement('div');
    intro.className = 'interactive-destination-map-intro';
    intro.innerHTML = DOMPurify.sanitize(content.config.intro);
    instrumentFromRow(introRow, intro);
    root.append(intro);
  }

  if (content.config.a11yInstructions.trim()) {
    const instructions = document.createElement('div');
    instructions.className = 'interactive-destination-map-instructions';
    instructions.innerHTML = DOMPurify.sanitize(content.config.a11yInstructions);
    instrumentFromRow(a11yRow, instructions);
    root.append(instructions);
  }

  const liveRegion = document.createElement('div');
  liveRegion.className = 'interactive-destination-map-live-region';
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  root.append(liveRegion);

  let viewport: HTMLElement | null = null;

  if (isUniversalEditor()) {
    // The raw editing surface only needs every item to be visible and clickable —
    // skip the interactive pan/zoom engine entirely to avoid conflicting with the UE overlay.
    root.append(buildEditorLayerList(content.layers));
  } else {
    const defaultLayer = content.layers.find((layer) => layer.layerId === content.config.defaultLayerId);
    if (defaultLayer) {
      viewport = document.createElement('div');
      viewport.className = 'interactive-destination-map-viewport';
      const picture = buildLayerPicture(defaultLayer, true);
      const img = picture.querySelector('img');
      img?.addEventListener('error', () => viewport?.classList.add('interactive-destination-map-viewport--error'));
      moveInstrumentation(defaultLayer.sourceRow, picture);
      viewport.append(picture);
      root.append(viewport);
    } else {
      const fallback = document.createElement('p');
      fallback.className = 'interactive-destination-map-fallback';
      fallback.textContent = 'The destination map is temporarily unavailable.';
      root.append(fallback);
    }
  }

  if (content.hotspots.length > 0) {
    const list = document.createElement('ul');
    list.className = 'interactive-destination-map-list';
    content.hotspots.forEach((hotspot) => list.append(buildHotspotListItem(hotspot)));
    root.append(list);
  }

  block.replaceChildren(root);

  return viewport ? { block, content, viewport, liveRegion } : null;
}

function schedulePremiumLoad(ctx: EnhanceContext): void {
  let loaded = false;

  async function load(): Promise<void> {
    if (loaded) return;
    loaded = true;
    try {
      const mod = await import('./interactive-destination-map-premium');
      await mod.default(ctx);
    } catch (error) {
      console.error('[interactive-destination-map] Premium Mode failed to load; Standard Mode remains active.', error);
    }
  }

  if (typeof IntersectionObserver === 'undefined') {
    // No IntersectionObserver support: fall back to loading once the browser is idle.
    load();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        load();
      }
    },
    { rootMargin: INTERSECTION_ROOT_MARGIN },
  );
  observer.observe(ctx.block);

  const interactionEvents: (keyof HTMLElementEventMap)[] = ['pointerdown', 'keydown', 'focusin'];
  const onInteract = (): void => {
    observer.disconnect();
    interactionEvents.forEach((type) => ctx.block.removeEventListener(type, onInteract));
    load();
  };
  interactionEvents.forEach((type) => ctx.block.addEventListener(type, onInteract, { once: false }));
}

export default async function decorate(block: HTMLElement): Promise<void> {
  const rawContent = parseMapContent(block);
  const { safeContent } = validateMapContent(rawContent);
  const ctx = renderStandardMode(block, safeContent);
  if (ctx) schedulePremiumLoad(ctx);
}
