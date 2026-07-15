// src/blocks/cinematic-hero/cinematic-hero.ts
import { moveInstrumentation } from '@/app/scripts';
import { resolveDAMUrl } from '@/utils/env';
import { MediaManager } from './lib/media-manager';
import { SelectorUI } from './lib/selector-ui';
import type { HeroConfig, HeroItem, HeroMode, HeroState } from './lib/types';

// ── DOM parsing ───────────────────────────────────────────────────────────────

function parseConfig(configRow: HTMLElement): HeroConfig {
  const cells = [...configRow.children] as HTMLElement[];
  return {
    prefix: cells[0]?.textContent?.trim() || 'See',
    suffix: cells[1]?.textContent?.trim() || 'with new eyes',
    experiencesLabel: cells[2]?.textContent?.trim() || 'Experiences',
    destinationsLabel: cells[3]?.textContent?.trim() || 'Destinations',
  };
}

function parseItems(itemRows: HTMLElement[]): HeroItem[] {
  return itemRows
    .map((row): HeroItem | null => {
      const cells = [...row.children] as HTMLElement[];
      const label = cells[0]?.textContent?.trim() ?? '';
      const modeRaw = cells[1]?.textContent?.trim().toLowerCase() ?? '';
      const mode: HeroMode = modeRaw === 'destinations' ? 'destinations' : 'experiences';
      const videoAnchor = cells[2]?.querySelector<HTMLAnchorElement>('a');
      const videoUrl = resolveDAMUrl(videoAnchor?.href ?? cells[2]?.textContent?.trim() ?? '');
      const poster = cells[3]?.querySelector('picture') ?? null;
      const posterUrl = poster?.querySelector<HTMLImageElement>('img')?.src ?? '';
      const linkAnchor = cells[4]?.querySelector<HTMLAnchorElement>('a');
      const link = linkAnchor?.href ?? null;
      const focalDesktop = cells[5]?.textContent?.trim() || 'center';
      const focalMobile = cells[6]?.textContent?.trim() || 'center';
      const hasAudio = cells[7]?.textContent?.trim().toLowerCase() === 'true';

      if (!label || !videoUrl) return null;

      return { label, mode, videoUrl, posterUrl, link, focalDesktop, focalMobile, hasAudio, sourceRow: row };
    })
    .filter((item): item is HeroItem => item !== null);
}

// ── DOM builder ───────────────────────────────────────────────────────────────

function buildItemEl(item: HeroItem, index: number): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'cinematic-hero-item';
  li.setAttribute('role', 'option');
  li.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
  li.dataset.index = String(index);
  li.dataset.mode = item.mode;

  moveInstrumentation(item.sourceRow, li);

  const btn = document.createElement('button');
  btn.className = 'cinematic-hero-item-btn';
  btn.type = 'button';
  btn.textContent = item.label;
  li.append(btn);

  if (item.link) {
    btn.dataset.href = item.link;
  }

  return li;
}

export function buildDOM(
  config: HeroConfig,
  items: HeroItem[],
  state: HeroState,
): {
  root: DocumentFragment;
  mediaEl: HTMLElement;
  posterEl: HTMLElement;
  videoA: HTMLVideoElement;
  videoB: HTMLVideoElement;
  overlayEl: HTMLElement;
  prefixEl: HTMLElement;
  suffixEl: HTMLElement;
  itemListEl: HTMLUListElement;
  controlsEl: HTMLElement;
  soundBtn: HTMLButtonElement;
  modeBtns: HTMLButtonElement[];
  indicatorEl: HTMLElement;
  cursorEl: HTMLElement;
} {
  const fragment = document.createDocumentFragment();

  // ── Media layer ──────────────────────────────────────────────────────────
  const mediaEl = document.createElement('div');
  mediaEl.className = 'cinematic-hero-media';

  const posterEl = document.createElement('div');
  posterEl.className = 'cinematic-hero-poster';
  const firstItem = items.find((i) => i.mode === state.activeMode) ?? items[0];
  if (firstItem?.posterUrl) {
    posterEl.style.backgroundImage = `url(${firstItem.posterUrl})`;
    posterEl.style.backgroundPosition = firstItem.focalDesktop;
  }

  const videoA = document.createElement('video');
  videoA.className = 'cinematic-hero-video cinematic-hero-video--a';
  videoA.muted = true;
  videoA.playsInline = true;
  videoA.loop = true;
  videoA.setAttribute('aria-hidden', 'true');

  const videoB = document.createElement('video');
  videoB.className = 'cinematic-hero-video cinematic-hero-video--b';
  videoB.muted = true;
  videoB.playsInline = true;
  videoB.loop = true;
  videoB.setAttribute('aria-hidden', 'true');

  mediaEl.append(posterEl, videoA, videoB);

  // ── Contrast overlay ──────────────────────────────────────────────────────
  const overlayEl = document.createElement('div');
  overlayEl.className = 'cinematic-hero-overlay';
  overlayEl.setAttribute('aria-hidden', 'true');

  // ── Selector UI ───────────────────────────────────────────────────────────
  const selectorEl = document.createElement('div');
  selectorEl.className = 'cinematic-hero-selector';
  selectorEl.setAttribute('aria-label', 'Experience selector');

  const prefixEl = document.createElement('div');
  prefixEl.className = 'cinematic-hero-prefix';
  prefixEl.textContent = config.prefix;
  prefixEl.setAttribute('aria-hidden', 'true');

  const itemListEl = document.createElement('ul');
  itemListEl.className = 'cinematic-hero-items';
  itemListEl.setAttribute('role', 'listbox');
  itemListEl.setAttribute('aria-label', 'Select content');

  const modeItems = items.filter((i) => i.mode === state.activeMode);
  modeItems.forEach((item, idx) => {
    itemListEl.append(buildItemEl(item, idx));
  });

  const suffixEl = document.createElement('div');
  suffixEl.className = 'cinematic-hero-suffix';
  suffixEl.textContent = config.suffix;
  suffixEl.setAttribute('aria-hidden', 'true');

  selectorEl.append(prefixEl, itemListEl, suffixEl);

  // ── Bottom controls ───────────────────────────────────────────────────────
  const controlsEl = document.createElement('div');
  controlsEl.className = 'cinematic-hero-controls';

  const soundBtn = document.createElement('button');
  soundBtn.className = 'cinematic-hero-sound';
  soundBtn.type = 'button';
  soundBtn.setAttribute('aria-label', 'Unmute video');
  soundBtn.setAttribute('aria-pressed', 'false');
  const hasAnyAudio = items.some((i) => i.hasAudio);
  if (!hasAnyAudio) soundBtn.hidden = true;

  const modeEl = document.createElement('div');
  modeEl.className = 'cinematic-hero-mode';
  modeEl.setAttribute('role', 'tablist');
  modeEl.setAttribute('aria-label', 'Content mode');

  const expBtn = document.createElement('button');
  expBtn.className = 'cinematic-hero-mode-btn';
  expBtn.type = 'button';
  expBtn.setAttribute('role', 'tab');
  expBtn.dataset.mode = 'experiences';
  expBtn.textContent = config.experiencesLabel;

  const trackEl = document.createElement('div');
  trackEl.className = 'cinematic-hero-mode-track';
  trackEl.setAttribute('aria-hidden', 'true');

  const indicatorEl = document.createElement('div');
  indicatorEl.className = 'cinematic-hero-mode-indicator';
  trackEl.append(indicatorEl);

  const destBtn = document.createElement('button');
  destBtn.className = 'cinematic-hero-mode-btn';
  destBtn.type = 'button';
  destBtn.setAttribute('role', 'tab');
  destBtn.dataset.mode = 'destinations';
  destBtn.textContent = config.destinationsLabel;

  // Set initial active state on mode buttons
  const modeBtns = [expBtn, destBtn];
  modeBtns.forEach((btn) => {
    const isActive = btn.dataset.mode === state.activeMode;
    btn.setAttribute('aria-selected', String(isActive));
    btn.classList.toggle('cinematic-hero-mode-btn--active', isActive);
  });

  modeEl.append(expBtn, trackEl, destBtn);
  controlsEl.append(soundBtn, modeEl);

  // ── Custom cursor ─────────────────────────────────────────────────────────
  const cursorEl = document.createElement('div');
  cursorEl.className = 'cinematic-hero-cursor';
  cursorEl.setAttribute('aria-hidden', 'true');

  fragment.append(mediaEl, overlayEl, selectorEl, controlsEl, cursorEl);

  return {
    root: fragment,
    mediaEl,
    posterEl,
    videoA,
    videoB,
    overlayEl,
    prefixEl,
    suffixEl,
    itemListEl,
    controlsEl,
    soundBtn,
    modeBtns,
    indicatorEl,
    cursorEl,
  };
}

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children] as HTMLElement[];
  if (rows.length < 2) return;

  const config = parseConfig(rows[0]);
  const items = parseItems(rows.slice(1));
  if (items.length === 0) return;

  const state: HeroState = {
    activeMode: 'experiences',
    activeIndex: { experiences: 0, destinations: 0 },
    introComplete: false,
    muted: true,
  };

  const dom = buildDOM(config, items, state);
  block.replaceChildren(dom.root);

  const media = new MediaManager(dom.videoA, dom.videoB, dom.posterEl);

  // Load first item immediately
  const firstItem = items.find((i) => i.mode === state.activeMode) ?? items[0];
  if (firstItem) {
    media.switchTo(firstItem).catch(() => {
      // Silent: poster already displayed
    });
  }

  const selectorUI = new SelectorUI(dom.prefixEl, dom.suffixEl, dom.itemListEl);
  const modeItems = items.filter((i) => i.mode === state.activeMode);
  selectorUI.renderItems(modeItems, state.activeIndex[state.activeMode]);

  // Recalculate row offsets after fonts load and on resize
  if (document.fonts) {
    document.fonts.ready.then(() => selectorUI.measureRows());
  } else {
    selectorUI.measureRows();
  }

  const ro = new ResizeObserver(() => {
    selectorUI.measureRows();
  });
  ro.observe(block);

  // Wire item selection to media switch
  selectorUI.onSelect((index) => {
    state.activeIndex[state.activeMode] = index;
    const item = items.filter((i) => i.mode === state.activeMode)[index];
    if (item) {
      media.switchTo(item).catch(() => {});
    }
  });

  // Sound toggle
  dom.soundBtn.addEventListener('click', () => {
    state.muted = !state.muted;
    media.setMuted(state.muted);
    dom.soundBtn.setAttribute('aria-pressed', String(!state.muted));
    dom.soundBtn.setAttribute('aria-label', state.muted ? 'Unmute video' : 'Mute video');
  });

  // Pause/resume on visibility
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].intersectionRatio >= 0.25) {
        media.resume();
      } else {
        media.pause();
      }
    },
    { threshold: [0, 0.25] },
  );
  observer.observe(block);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      media.pause();
    } else {
      media.resume();
    }
  });
}
