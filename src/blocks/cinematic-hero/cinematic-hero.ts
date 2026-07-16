// src/blocks/cinematic-hero/cinematic-hero.ts
import { resolveDAMUrl } from '@/utils/env';
import { emitHeroImpression, emitItemSelect, emitMediaError, emitModeChange, emitSoundToggle } from './lib/analytics';
import { runIntro, skipIntro } from './lib/intro';
import { MediaManager } from './lib/media-manager';
import { SelectorUI } from './lib/selector-ui';
import type { HeroConfig, HeroItem, HeroMode, HeroState, IntroElements } from './lib/types';

// ── Cursor controller ─────────────────────────────────────────────────────────

const CURSOR_LERP = 0.12;

class CursorController {
  private container: HTMLElement;
  private cursorEl: HTMLElement;
  private rafId = 0;
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;
  private isActive = false;
  private mounted = false;

  constructor(container: HTMLElement, cursorEl: HTMLElement) {
    this.container = container;
    this.cursorEl = cursorEl;
  }

  mount(): void {
    if (this.mounted) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.mounted = true;
    this.cursorEl.style.display = 'block';
    this.container.addEventListener('mouseenter', this.onEnter);
    this.container.addEventListener('mouseleave', this.onLeave);
    this.container.addEventListener('mousemove', this.onMove);
  }

  private onEnter = (): void => {
    this.isActive = true;
    this.cursorEl.style.opacity = '1';
    this.tick();
  };

  private onLeave = (): void => {
    this.isActive = false;
    this.cursorEl.style.opacity = '0';
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  };

  private onMove = (e: MouseEvent): void => {
    const rect = this.container.getBoundingClientRect();
    this.targetX = e.clientX - rect.left;
    this.targetY = e.clientY - rect.top;
  };

  private tick = (): void => {
    this.currentX += (this.targetX - this.currentX) * CURSOR_LERP;
    this.currentY += (this.targetY - this.currentY) * CURSOR_LERP;
    this.cursorEl.style.transform = `translate(${this.currentX}px, ${this.currentY}px)`;
    if (this.isActive) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };

  destroy(): void {
    this.isActive = false;
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    if (this.mounted) {
      this.container.removeEventListener('mouseenter', this.onEnter);
      this.container.removeEventListener('mouseleave', this.onLeave);
      this.container.removeEventListener('mousemove', this.onMove);
      this.mounted = false;
    }
  }
}

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
      // Item rows are expected to follow the model with 8 cells.
      if (cells.length < 8) return null;

      const label = cells[0]?.textContent?.trim() ?? '';
      const modeRaw = cells[1]?.textContent?.trim().toLowerCase() ?? '';
      if (modeRaw !== 'experiences' && modeRaw !== 'destinations') return null;
      const mode: HeroMode = modeRaw;

      const videoAnchor = cells[2]?.querySelector<HTMLAnchorElement>('a');
      const rawVideo = (videoAnchor?.href ?? cells[2]?.textContent?.trim() ?? '').trim();
      // Accept only real URLs or DAM-style paths. Plain text (e.g. "Experiences") is invalid.
      const looksLikeVideoUrl = /^https?:\/\//i.test(rawVideo) || rawVideo.startsWith('/');
      const videoUrl = looksLikeVideoUrl ? resolveDAMUrl(rawVideo) : '';

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

function buildDOM(
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
  introPhraseEl: HTMLElement;
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

  // ── Intro phrase (single centered sentence, visible during intro only) ────
  const introPhraseEl = document.createElement('div');
  introPhraseEl.className = 'cinematic-hero-intro-phrase';
  introPhraseEl.setAttribute('aria-hidden', 'true');
  introPhraseEl.textContent = `${config.prefix} ${config.suffix}`;

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
  // Items are rendered by SelectorUI.renderItems() (single source of truth,
  // carries UE instrumentation and wires pointer/keyboard listeners).

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

  // Center column: mode switcher
  const modeEl = document.createElement('div');
  modeEl.className = 'cinematic-hero-mode';
  modeEl.setAttribute('role', 'radiogroup');
  modeEl.setAttribute('aria-label', 'Content mode');

  const expBtn = document.createElement('button');
  expBtn.className = 'cinematic-hero-mode-btn';
  expBtn.type = 'button';
  expBtn.setAttribute('role', 'radio');
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
  destBtn.setAttribute('role', 'radio');
  destBtn.dataset.mode = 'destinations';
  destBtn.textContent = config.destinationsLabel;

  // Set initial active state on mode buttons
  const modeBtns = [expBtn, destBtn];
  modeBtns.forEach((btn) => {
    const isActive = btn.dataset.mode === state.activeMode;
    btn.setAttribute('aria-checked', String(isActive));
    btn.classList.toggle('cinematic-hero-mode-btn--active', isActive);
  });

  modeEl.append(expBtn, trackEl, destBtn);

  // Right spacer — keeps mode switcher visually centered
  const controlsSpacerEl = document.createElement('div');
  controlsSpacerEl.className = 'cinematic-hero-controls-spacer';
  controlsSpacerEl.setAttribute('aria-hidden', 'true');

  controlsEl.append(soundBtn, modeEl, controlsSpacerEl);

  const cursorEl = document.createElement('div');
  cursorEl.className = 'cinematic-hero-cursor';
  cursorEl.setAttribute('aria-hidden', 'true');
  fragment.append(mediaEl, overlayEl, introPhraseEl, selectorEl, controlsEl, cursorEl);

  return {
    root: fragment,
    mediaEl,
    posterEl,
    videoA,
    videoB,
    overlayEl,
    introPhraseEl,
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

function shouldSkipIntro(): boolean {
  // Reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  // AEM Universal Editor context
  if (document.documentElement.classList.contains('adobe-ue-edit')) return true;
  if (window.self !== window.top) return true; // inside iframe (UE)
  return false;
}

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children] as HTMLElement[];
  if (rows.length < 2) return;

  const config = parseConfig(rows[0]);
  const items = parseItems(rows.slice(1));
  if (items.length === 0) return;

  const hasExperiences = items.some((i) => i.mode === 'experiences');
  const hasDestinations = items.some((i) => i.mode === 'destinations');
  const initialMode: HeroMode = hasExperiences ? 'experiences' : 'destinations';

  const state: HeroState = {
    activeMode: initialMode,
    activeIndex: { experiences: 0, destinations: 0 },
    introComplete: false,
    muted: true,
  };

  const dom = buildDOM(config, items, state);
  block.replaceChildren(dom.root);

  const cursor = new CursorController(block, dom.cursorEl);
  cursor.mount();

  // Set initial indicator position (experiences = left, destinations = right)
  dom.indicatorEl.style.transform = state.activeMode === 'destinations' ? 'translateX(50%)' : 'translateX(0%)';

  const media = new MediaManager(dom.videoA, dom.videoB, dom.posterEl);
  media.setErrorHandler((item, errorType) => emitMediaError(item.label, item.videoUrl, errorType));

  // Load first item immediately
  const firstItem = items.find((i) => i.mode === state.activeMode) ?? items[0];
  if (firstItem) {
    media.switchTo(firstItem).catch(() => {
      // Silent: poster already displayed
    });
  }

  const selectorUI = new SelectorUI(dom.itemListEl);
  const modeItems = items.filter((i) => i.mode === state.activeMode);
  selectorUI.renderItems(modeItems, state.activeIndex[state.activeMode]);

  // Disable mode tabs that have no data to avoid blank selector states.
  dom.modeBtns.forEach((btn) => {
    const mode = btn.dataset.mode as HeroMode;
    const hasItems = mode === 'experiences' ? hasExperiences : hasDestinations;
    btn.disabled = !hasItems;
    btn.setAttribute('aria-disabled', String(!hasItems));
    btn.classList.toggle('cinematic-hero-mode-btn--disabled', !hasItems);
  });

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
    const prevItem = items.filter((i) => i.mode === state.activeMode)[state.activeIndex[state.activeMode]];
    state.activeIndex[state.activeMode] = index;
    const item = items.filter((i) => i.mode === state.activeMode)[index];
    if (item) {
      media.switchTo(item).catch(() => {});
      emitItemSelect(prevItem?.label ?? '', item.label, state.activeMode, 'pointer');
    }
  });

  let modeLocked = false;

  async function switchMode(newMode: HeroMode): Promise<void> {
    if (modeLocked || newMode === state.activeMode) return;

    const newModeItems = items.filter((i) => i.mode === newMode);
    if (newModeItems.length === 0) return;

    modeLocked = true;
    const prevMode = state.activeMode;
    try {
      state.activeMode = newMode;

      // 1. Update mode button states
      dom.modeBtns.forEach((btn) => {
        const isActive = btn.dataset.mode === newMode;
        btn.setAttribute('aria-checked', String(isActive));
        btn.classList.toggle('cinematic-hero-mode-btn--active', isActive);
      });

      // 2. Slide indicator toward new mode
      const indicatorTargetX = newMode === 'destinations' ? '50%' : '0%';
      const indicatorAnim = dom.indicatorEl.animate(
        [
          { transform: `translateX(${newMode === 'destinations' ? '0%' : '50%'})` },
          { transform: `translateX(${indicatorTargetX})` },
        ],
        { duration: 280, easing: 'ease-out', fill: 'forwards' },
      );
      indicatorAnim.finished
        .then(() => {
          dom.indicatorEl.style.transform = `translateX(${indicatorTargetX})`;
          indicatorAnim.cancel();
        })
        .catch(() => {});

      // 3. Fade out current item list
      const fadeOutAnim = dom.itemListEl.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 180,
        easing: 'linear',
        fill: 'forwards',
      });
      await fadeOutAnim.finished.catch(() => {});
      dom.itemListEl.style.opacity = '0';
      fadeOutAnim.cancel();

      // 4. Swap list content
      const newActiveIndex = Math.min(state.activeIndex[newMode], newModeItems.length - 1);
      state.activeIndex[newMode] = newActiveIndex;
      selectorUI.renderItems(newModeItems, newActiveIndex);
      selectorUI.measureRows();

      // 5. Move anchors to new active row (no animation — they'll fade in at correct position)
      selectorUI.activateItem(newActiveIndex, false);

      // 6. Fade in new list + update media in parallel
      const newActiveItem = newModeItems[newActiveIndex];
      if (newActiveItem) {
        media.switchTo(newActiveItem).catch(() => {});
      }

      const fadeInAnim = dom.itemListEl.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 240,
        easing: 'ease-out',
        fill: 'forwards',
      });
      await fadeInAnim.finished.catch(() => {});
      dom.itemListEl.style.opacity = '1';
      fadeInAnim.cancel();

      const newActiveItemForAnalytics = items.filter((i) => i.mode === newMode)[newActiveIndex];
      emitModeChange(prevMode, newMode, newActiveItemForAnalytics?.label ?? '');
    } finally {
      modeLocked = false;
    }
  }

  // Wire mode buttons
  dom.modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const newMode = btn.dataset.mode as HeroMode;
      if (newMode) switchMode(newMode);
    });
  });

  // Keyboard: ArrowLeft/ArrowRight on mode buttons
  dom.modeBtns.forEach((btn) => {
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const targetIdx = e.key === 'ArrowLeft' ? 0 : 1;
        dom.modeBtns[targetIdx]?.focus();
        const newMode = dom.modeBtns[targetIdx]?.dataset.mode as HeroMode | undefined;
        if (newMode && newMode !== state.activeMode) switchMode(newMode);
      }
    });
  });

  const introElements: IntroElements = {
    introPhrase: dom.introPhraseEl,
    prefix: dom.prefixEl,
    suffix: dom.suffixEl,
    itemList: dom.itemListEl,
    controls: dom.controlsEl,
  };

  // WAAPI feature detection — if unavailable, skip all animation
  if (typeof Element.prototype.animate !== 'function') {
    skipIntro(introElements);
    selectorUI.measureRows();
    selectorUI.activateItem(state.activeIndex[state.activeMode], false);
    selectorUI.setIntroComplete(true);
    state.introComplete = true;
  } else if (shouldSkipIntro()) {
    skipIntro(introElements);
    selectorUI.measureRows();
    selectorUI.activateItem(state.activeIndex[state.activeMode], false);
    selectorUI.setIntroComplete(true);
    state.introComplete = true;
  } else {
    runIntro(
      introElements,
      () => {
        // Position list so active item is centered before split starts
        selectorUI.measureRows();
        selectorUI.positionForItem(state.activeIndex[state.activeMode]);
      },
      () => {
        // Fade in active item while See/with... are splitting apart
        selectorUI.activateItem(state.activeIndex[state.activeMode], true);
      },
    ).then(() => {
      selectorUI.setIntroComplete(true);
      state.introComplete = true;

      // Preload metadata for next item to reduce switching latency
      const modeItemsForPreload = items.filter((i) => i.mode === state.activeMode);
      const nextIdx = (state.activeIndex[state.activeMode] + 1) % modeItemsForPreload.length;
      const nextItem = modeItemsForPreload[nextIdx];
      if (nextItem) {
        const preloadVid = document.createElement('video');
        preloadVid.preload = 'metadata';
        preloadVid.src = nextItem.videoUrl;
      }
    });
  }

  // Sound toggle
  dom.soundBtn.addEventListener('click', () => {
    state.muted = !state.muted;
    media.setMuted(state.muted);
    dom.soundBtn.setAttribute('aria-pressed', String(!state.muted));
    dom.soundBtn.setAttribute('aria-label', state.muted ? 'Unmute video' : 'Mute video');
    emitSoundToggle(state.muted);
  });

  // Impression: emit after block is visible for > 2s
  const impressionTimer = setTimeout(() => {
    const firstItem = items.filter((i) => i.mode === state.activeMode)[state.activeIndex[state.activeMode]];
    emitHeroImpression(block.id || 'cinematic-hero', state.activeMode, firstItem?.label ?? '');
  }, 2000);

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

  const visibilityChangeHandler = (): void => {
    if (document.hidden) {
      media.pause();
    } else {
      media.resume();
    }
  };
  document.addEventListener('visibilitychange', visibilityChangeHandler);

  // Cleanup on disconnect
  const disconnectObserver = new MutationObserver(() => {
    if (!block.isConnected) {
      clearTimeout(impressionTimer);
      cursor.destroy();
      selectorUI.destroy();
      media.destroy();
      observer.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', visibilityChangeHandler);
      disconnectObserver.disconnect();
    }
  });
  disconnectObserver.observe(block.parentElement ?? document.body, { childList: true, subtree: false });
}
