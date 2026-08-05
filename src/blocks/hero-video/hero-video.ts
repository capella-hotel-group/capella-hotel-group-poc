// src/blocks/hero-video/hero-video.ts
import { resolveDAMUrl } from '@/utils/env';
import { emitHeroImpression, emitItemSelect, emitMediaError } from './lib/analytics';
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
  const rawTransition = cells[2]?.textContent?.trim().toLowerCase();
  const transition: HeroVideoConfig['transition'] =
    rawTransition === 'slide' || rawTransition === 'cut' ? rawTransition : 'crossfade';
  return {
    prefix: cells[0]?.textContent?.trim() || 'See',
    suffix: cells[1]?.textContent?.trim() || 'with new eyes',
    transition,
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
  // The `muted` and `autoplay` HTML attributes (not just the JS properties) are what Chrome's
  // autoplay policy inspects to classify a video as autoplay-safe. Without them, muted playback
  // started from an async context (e.g. after a soft-nav fetch) can be blocked until a gesture.
  videoA.setAttribute('muted', '');
  videoA.setAttribute('autoplay', '');
  videoA.playsInline = true;
  videoA.loop = true;
  videoA.setAttribute('aria-hidden', 'true');

  const videoB = document.createElement('video');
  videoB.className = 'hero-video-video hero-video-video--b';
  videoB.muted = true;
  videoB.setAttribute('muted', '');
  videoB.setAttribute('autoplay', '');
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

function shouldSkipIntro(block: HTMLElement): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  if (document.documentElement.classList.contains('adobe-ue-edit')) return true;
  if (window.self !== window.top) return true; // inside iframe (UE)
  // Mode-toggle soft-nav flagged this instance as a mid-navigation swap — skip the 3.7s
  // landing intro so the transition feels like a video crossfade, not a page relaunch.
  if (block.hasAttribute('data-soft-nav-swap')) return true;
  return false;
}

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children] as HTMLElement[];
  if (rows.length < 2) return;

  const config = parseConfig(rows[0]);
  const items = parseItems(rows.slice(1));
  if (items.length === 0) return;

  const state: HeroVideoState = {
    activeIndex: 0,
    introComplete: false,
    muted: true,
  };

  const dom = buildDOM(config);
  block.replaceChildren(dom.root);
  // Videos are always muted — the sound/unmute control is intentionally removed.
  dom.soundBtn.hidden = true;

  const cursor = new CursorController(block, dom.cursorEl);
  cursor.mount();

  const media = new MediaManager(dom.videoA, dom.videoB, dom.posterEl);
  media.setTransition(config.transition);
  media.setErrorHandler((item, errorType) => emitMediaError(item.label, item.videoUrl, errorType));

  // Load first item — deferred until the block is connected AND the outgoing block's teardown
  // has had a chance to fully drain. On mode-toggle soft-nav, the outgoing MediaManager's
  // destroy() runs from a MutationObserver microtask right after replaceChildren() attaches the
  // new block; if switchTo() fires in the same task, Chromium immediately errors the incoming
  // video's fetch (both videos requesting the same URL race against Chromium's media pipeline).
  // Waiting one macrotask (setTimeout 0) after seeing isConnected lets the outgoing teardown
  // complete before we set src on the incoming layer.
  const firstItem = items[state.activeIndex];
  if (firstItem) {
    const startFirstLoad = (): void => {
      // TEMP diagnostic: log instead of swallowing so autoplay/load failures are visible.
      media.switchTo(firstItem).catch((err: unknown) => console.warn('[hero-video] first switchTo failed', err));
      // Self-healing "auto-click": on soft-nav mounts play() sometimes succeeds silently (no
      // rejection logged) but the crossfade leaves the video paused/invisible. Re-check shortly
      // after mount settles and force it visible+playing, same effect as a manual click.
      setTimeout(() => media.ensureActivePlaying(), 500);
    };
    const scheduleStart = (): void => {
      // Two-stage defer: microtask (queueMicrotask) + macrotask (setTimeout 0). Microtask lets
      // any outgoing MutationObserver callback fire first, macrotask lets any load-abort settle.
      queueMicrotask(() => setTimeout(startFirstLoad, 0));
    };
    if (block.isConnected) {
      scheduleStart();
    } else {
      const waitForAttach = (): void => {
        if (block.isConnected) scheduleStart();
        else requestAnimationFrame(waitForAttach);
      };
      requestAnimationFrame(waitForAttach);
    }
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
    // Re-snap the list transform to the current active item once real dimensions become
    // available. Critical for the soft-nav skipIntro path, where decorate() runs on a detached
    // block and the first measureRows() returns zero — leaving item 0 highlighted but the list
    // untranslated (so it looks like a middle item is centered instead of the first).
    if (state.introComplete) selectorUI.positionForItem(state.activeIndex);
  });
  ro.observe(block);

  // Wire item selection to media switch
  selectorUI.onSelect((index) => {
    const prevItem = items[state.activeIndex];
    state.activeIndex = index;
    const item = items[index];
    if (item) {
      // TEMP diagnostic: log instead of swallowing so autoplay/load failures are visible.
      media.switchTo(item).catch((err: unknown) => console.warn('[hero-video] switchTo failed', err));
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
  } else if (shouldSkipIntro(block)) {
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

  // Sound toggle removed — videos stay permanently muted.

  // Impression: emit after block is visible for > 2s
  const impressionTimer = setTimeout(() => {
    const item = items[state.activeIndex];
    emitHeroImpression(block.id || 'hero-video', item?.label ?? '');
  }, 2000);

  // Pause/resume on visibility. Threshold 0 (only pause when the block is entirely out of the
  // viewport) instead of a partial threshold — during soft-nav mount the block briefly reports a
  // reduced intersection ratio while its scale/opacity transition runs, which would spuriously
  // pause the fresh video before it gets a chance to be seen. Additionally, gate the very first
  // pause with `hasBeenVisible` so the initial IntersectionObserver callback (fired right after
  // observe() while the block is still being laid out post-adoption) can't stop the video.
  let hasBeenVisible = false;
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        hasBeenVisible = true;
        media.resume();
      } else if (hasBeenVisible) {
        media.pause();
      }
    },
    { threshold: 0 },
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
  // Must observe with `subtree: true` on a node that's never itself replaced (document.body).
  // Mode-toggle's soft-nav swaps whole `.section` subtrees via `main.replaceChildren(...)`, which
  // only emits a childList mutation on `main` — observing `block.parentElement` directly (one or
  // two levels below the swapped section) would never see that mutation and cleanup would leak
  // (old video never paused/released, IntersectionObserver/visibilitychange listeners pile up).
  disconnectObserver.observe(document.body, { childList: true, subtree: true });
}
