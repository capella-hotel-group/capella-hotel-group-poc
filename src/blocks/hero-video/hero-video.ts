// src/blocks/hero-video/hero-video.ts
import { resolveDAMUrl } from '@/utils/env';
import { emitHeroImpression, emitItemSelect, emitMediaError, emitSoundToggle } from './lib/analytics';
import { runIntro, skipIntro } from './lib/intro';
import { MediaManager } from './lib/media-manager';
import { SelectorUI } from './lib/selector-ui';
import type { HeroVideoConfig, HeroVideoItem, HeroVideoState, IntroElements } from './lib/types';

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

function parseConfig(configRow: HTMLElement): HeroVideoConfig {
  const cells = [...configRow.children] as HTMLElement[];
  return {
    prefix: cells[0]?.textContent?.trim() || 'See',
    suffix: cells[1]?.textContent?.trim() || 'with new eyes',
  };
}

function parseItems(itemRows: HTMLElement[]): HeroVideoItem[] {
  return itemRows
    .map((row): HeroVideoItem | null => {
      const cells = [...row.children] as HTMLElement[];
      // Model fields → cell indices:
      //   cells[0] = label, cells[1] = video, cells[2] = poster,
      //   cells[3] = link, cells[4] = focalDesktop, cells[5] = focalMobile, cells[6] = hasAudio
      if (cells.length < 7) return null;

      const label = cells[0]?.textContent?.trim() ?? '';

      const videoAnchor = cells[1]?.querySelector<HTMLAnchorElement>('a');
      const rawVideo = (videoAnchor?.href ?? cells[1]?.textContent?.trim() ?? '').trim();
      const looksLikeVideoUrl = /^https?:\/\//i.test(rawVideo) || rawVideo.startsWith('/');
      const videoUrl = looksLikeVideoUrl ? resolveDAMUrl(rawVideo) : '';

      const poster = cells[2]?.querySelector('picture') ?? null;
      const posterUrl = poster?.querySelector<HTMLImageElement>('img')?.src ?? '';
      const linkAnchor = cells[3]?.querySelector<HTMLAnchorElement>('a');
      const link = linkAnchor?.href ?? null;
      const focalDesktop = cells[4]?.textContent?.trim() || 'center';
      const focalMobile = cells[5]?.textContent?.trim() || 'center';
      const hasAudio = cells[6]?.textContent?.trim().toLowerCase() === 'true';

      if (!label || !videoUrl) return null;

      return { label, videoUrl, posterUrl, link, focalDesktop, focalMobile, hasAudio, sourceRow: row };
    })
    .filter((item): item is HeroVideoItem => item !== null);
}

// ── DOM builder ───────────────────────────────────────────────────────────────

function buildDOM(config: HeroVideoConfig): {
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
  cursorEl: HTMLElement;
} {
  const fragment = document.createDocumentFragment();

  // ── Media layer ──────────────────────────────────────────────────────────
  const mediaEl = document.createElement('div');
  mediaEl.className = 'hero-video-media';

  const posterEl = document.createElement('div');
  posterEl.className = 'hero-video-poster';

  const videoA = document.createElement('video');
  videoA.className = 'hero-video-video hero-video-video--a';
  videoA.muted = true;
  videoA.playsInline = true;
  videoA.loop = true;
  videoA.setAttribute('aria-hidden', 'true');

  const videoB = document.createElement('video');
  videoB.className = 'hero-video-video hero-video-video--b';
  videoB.muted = true;
  videoB.playsInline = true;
  videoB.loop = true;
  videoB.setAttribute('aria-hidden', 'true');

  mediaEl.append(posterEl, videoA, videoB);

  // ── Contrast overlay ──────────────────────────────────────────────────────
  const overlayEl = document.createElement('div');
  overlayEl.className = 'hero-video-overlay';
  overlayEl.setAttribute('aria-hidden', 'true');

  // ── Intro phrase (single centered sentence, visible during intro only) ────
  const introPhraseEl = document.createElement('div');
  introPhraseEl.className = 'hero-video-intro-phrase';
  introPhraseEl.setAttribute('aria-hidden', 'true');
  introPhraseEl.textContent = `${config.prefix} ${config.suffix}`;

  // ── Selector UI ───────────────────────────────────────────────────────────
  const selectorEl = document.createElement('div');
  selectorEl.className = 'hero-video-selector';
  selectorEl.setAttribute('aria-label', 'Destination selector');

  const prefixEl = document.createElement('div');
  prefixEl.className = 'hero-video-prefix';
  prefixEl.textContent = config.prefix;
  prefixEl.setAttribute('aria-hidden', 'true');

  const itemListEl = document.createElement('ul');
  itemListEl.className = 'hero-video-items';
  itemListEl.setAttribute('role', 'listbox');
  itemListEl.setAttribute('aria-label', 'Select a destination');
  // Items are rendered by SelectorUI.renderItems() (single source of truth,
  // carries UE instrumentation and wires pointer/keyboard listeners).

  const suffixEl = document.createElement('div');
  suffixEl.className = 'hero-video-suffix';
  suffixEl.textContent = config.suffix;
  suffixEl.setAttribute('aria-hidden', 'true');

  selectorEl.append(prefixEl, itemListEl, suffixEl);

  // ── Bottom controls (sound toggle only — mode toggling lives in a sibling block) ──
  const controlsEl = document.createElement('div');
  controlsEl.className = 'hero-video-controls';

  const soundBtn = document.createElement('button');
  soundBtn.className = 'hero-video-sound';
  soundBtn.type = 'button';
  soundBtn.setAttribute('aria-label', 'Unmute video');
  soundBtn.setAttribute('aria-pressed', 'false');

  controlsEl.append(soundBtn);

  const cursorEl = document.createElement('div');
  cursorEl.className = 'hero-video-cursor';
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
    cursorEl,
  };
}

function shouldSkipIntro(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
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

  // Hide the sound button entirely when no item carries audio.
  const hasAnyAudio = items.some((i) => i.hasAudio);

  const state: HeroVideoState = {
    activeIndex: 0,
    introComplete: false,
    muted: true,
  };

  const dom = buildDOM(config);
  block.replaceChildren(dom.root);
  dom.soundBtn.hidden = !hasAnyAudio;

  const cursor = new CursorController(block, dom.cursorEl);
  cursor.mount();

  const media = new MediaManager(dom.videoA, dom.videoB, dom.posterEl);
  media.setErrorHandler((item, errorType) => emitMediaError(item.label, item.videoUrl, errorType));

  // Load first item immediately
  const firstItem = items[state.activeIndex];
  if (firstItem) {
    media.switchTo(firstItem).catch(() => {
      // Silent: poster already displayed
    });
  }

  const selectorUI = new SelectorUI(dom.itemListEl);
  selectorUI.renderItems(items, state.activeIndex);

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
    const prevItem = items[state.activeIndex];
    state.activeIndex = index;
    const item = items[index];
    if (item) {
      media.switchTo(item).catch(() => {});
      emitItemSelect(prevItem?.label ?? '', item.label, 'pointer');
    }
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
    selectorUI.activateItem(state.activeIndex, false);
    selectorUI.setIntroComplete(true);
    state.introComplete = true;
  } else if (shouldSkipIntro()) {
    skipIntro(introElements);
    selectorUI.measureRows();
    selectorUI.activateItem(state.activeIndex, false);
    selectorUI.setIntroComplete(true);
    state.introComplete = true;
  } else {
    runIntro(
      introElements,
      () => {
        // Position list so active item is centered before split starts
        selectorUI.measureRows();
        selectorUI.positionForItem(state.activeIndex);
      },
      () => {
        // Fade in active item while See/with... are splitting apart
        selectorUI.activateItem(state.activeIndex, true);
      },
    ).then(() => {
      selectorUI.setIntroComplete(true);
      state.introComplete = true;

      // Preload metadata for next item to reduce switching latency
      const nextIdx = (state.activeIndex + 1) % items.length;
      const nextItem = items[nextIdx];
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
    const item = items[state.activeIndex];
    emitHeroImpression(block.id || 'hero-video', item?.label ?? '');
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
