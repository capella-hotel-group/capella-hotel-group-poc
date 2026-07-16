// src/blocks/cinematic-hero/lib/media-manager.ts
import type { HeroItem } from './types';

const CROSSFADE_MS = 620;
const FIRST_FRAME_TIMEOUT_MS = 500;
const LOAD_TIMEOUT_MS = 8000;

function waitForMediaReady(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const ac = new AbortController();
    const { signal } = ac;

    const timer = window.setTimeout(() => {
      ac.abort();
      reject(new Error('video-load-timeout'));
    }, LOAD_TIMEOUT_MS);

    video.addEventListener(
      'loadeddata',
      () => {
        clearTimeout(timer);
        ac.abort();
        resolve();
      },
      { signal },
    );
    video.addEventListener(
      'error',
      () => {
        clearTimeout(timer);
        ac.abort();
        reject(new Error('video-load-error'));
      },
      { signal },
    );
  });
}

function waitForFirstFrame(video: HTMLVideoElement): Promise<void> {
  if (typeof video.requestVideoFrameCallback !== 'function') {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve();
    }, FIRST_FRAME_TIMEOUT_MS);

    video.requestVideoFrameCallback(() => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    });
  });
}

export class MediaManager {
  private videoA: HTMLVideoElement;
  private videoB: HTMLVideoElement;
  private posterEl: HTMLElement;
  private activeLayer: 'a' | 'b' = 'a';
  private sequenceId = 0;
  private muted = true;
  private onError: (item: HeroItem, errorType: string) => void = () => {};
  private pendingFadeIn: Animation | null = null;
  private pendingFadeOut: Animation | null = null;

  constructor(videoA: HTMLVideoElement, videoB: HTMLVideoElement, posterEl: HTMLElement) {
    this.videoA = videoA;
    this.videoB = videoB;
    this.posterEl = posterEl;

    // Start both fully transparent; active layer will be faded in on first switchTo
    videoA.style.opacity = '0';
    videoB.style.opacity = '0';
    videoA.preload = 'auto';
    videoB.preload = 'auto';
  }

  get activeVideo(): HTMLVideoElement {
    return this.activeLayer === 'a' ? this.videoA : this.videoB;
  }

  get inactiveVideo(): HTMLVideoElement {
    return this.activeLayer === 'a' ? this.videoB : this.videoA;
  }

  setErrorHandler(cb: (item: HeroItem, errorType: string) => void): void {
    this.onError = cb;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.videoA.muted = muted;
    this.videoB.muted = muted;
  }

  pause(): void {
    this.videoA.pause();
    this.videoB.pause();
  }

  resume(): void {
    if (parseFloat(this.activeVideo.style.opacity ?? '0') > 0) {
      this.activeVideo.play().catch(() => {
        // Autoplay rejected — poster remains visible
      });
    }
  }

  /** Switch to a new item's video with opacity crossfade. */
  async switchTo(item: HeroItem): Promise<void> {
    this.sequenceId += 1;
    const mySeq = this.sequenceId;

    const incoming = this.inactiveVideo;
    const outgoing = this.activeVideo;

    // If the active layer is already playing this URL, avoid redundant reload/fade.
    const activeSrc = this.normalizeUrl(outgoing.currentSrc || outgoing.src);
    const requestedSrc = this.normalizeUrl(item.videoUrl);
    if (activeSrc && requestedSrc && activeSrc === requestedSrc) {
      outgoing.style.objectPosition = this.getFocalPosition(item);
      return;
    }

    // Cancel any in-flight fade animations so a new switch starts from a clean state.
    this.pendingFadeIn?.cancel();
    this.pendingFadeOut?.cancel();
    this.pendingFadeIn = null;
    this.pendingFadeOut = null;

    // Update poster fallback immediately
    this.posterEl.style.backgroundImage = `url(${item.posterUrl})`;
    this.posterEl.style.backgroundPosition = this.getFocalPosition(item);

    // Load video into incoming layer
    incoming.src = item.videoUrl;
    incoming.muted = this.muted;
    incoming.style.objectPosition = this.getFocalPosition(item);

    // Wait until browser has media data. If it fails, keep current video visible.
    incoming.load();
    const loadFailed = await waitForMediaReady(incoming)
      .then(() => false)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'load-error';
        this.onError(item, msg);
        return true;
      });

    if (loadFailed) return;

    // Stale request guard: another switchTo() was called while we were loading
    if (this.sequenceId !== mySeq) return;

    // Start playback before fade
    incoming.play().catch(() => {
      // Autoplay blocked — poster visible already
    });

    // Ensure at least one decoded frame is available before we begin the fade.
    await waitForFirstFrame(incoming);

    // Crossfade: incoming fades in, outgoing fades out simultaneously
    const fadeIn = incoming.animate([{ opacity: '0' }, { opacity: '1' }], {
      duration: CROSSFADE_MS,
      easing: 'ease-in-out',
      fill: 'forwards',
    });
    const fadeOut = outgoing.animate([{ opacity: '1' }, { opacity: '0' }], {
      duration: CROSSFADE_MS,
      easing: 'ease-in-out',
      fill: 'forwards',
    });
    this.pendingFadeIn = fadeIn;
    this.pendingFadeOut = fadeOut;

    await Promise.all([fadeIn.finished, fadeOut.finished]).catch(() => {
      // Animation interrupted (e.g. rapid switching) — that's fine
    });

    // Guard again after await
    if (this.sequenceId !== mySeq) return;

    // Commit final opacity via style (remove fill: forwards)
    incoming.style.opacity = '1';
    outgoing.style.opacity = '0';
    fadeIn.cancel();
    fadeOut.cancel();
    this.pendingFadeIn = null;
    this.pendingFadeOut = null;

    // Cleanup outgoing — clear src to free decode memory for the old video
    outgoing.pause();
    outgoing.removeAttribute('src');
    outgoing.load();

    // Swap active layer
    this.activeLayer = this.activeLayer === 'a' ? 'b' : 'a';
  }

  private getFocalPosition(item: HeroItem): string {
    const isMobile = window.matchMedia('(width < 768px)').matches;
    return isMobile ? item.focalMobile : item.focalDesktop;
  }

  private normalizeUrl(url: string): string {
    if (!url) return '';
    try {
      const parsed = new URL(url, window.location.origin);
      return `${parsed.origin}${parsed.pathname}${parsed.search}`;
    } catch {
      return url;
    }
  }

  destroy(): void {
    this.sequenceId = Number.MAX_SAFE_INTEGER; // invalidate any pending switchTo
    this.pendingFadeIn?.cancel();
    this.pendingFadeOut?.cancel();
    this.pendingFadeIn = null;
    this.pendingFadeOut = null;
    this.videoA.pause();
    this.videoB.pause();
    this.videoA.removeAttribute('src');
    this.videoB.removeAttribute('src');
    this.videoA.load();
    this.videoB.load();
  }
}
