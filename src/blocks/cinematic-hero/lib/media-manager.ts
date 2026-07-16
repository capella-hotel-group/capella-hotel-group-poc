// src/blocks/cinematic-hero/lib/media-manager.ts
import type { HeroItem } from './types';

const CROSSFADE_MS = 360;

export class MediaManager {
  private videoA: HTMLVideoElement;
  private videoB: HTMLVideoElement;
  private posterEl: HTMLElement;
  private activeLayer: 'a' | 'b' = 'a';
  private sequenceId = 0;
  private muted = true;
  private onError: (item: HeroItem, errorType: string) => void = () => {};

  constructor(videoA: HTMLVideoElement, videoB: HTMLVideoElement, posterEl: HTMLElement) {
    this.videoA = videoA;
    this.videoB = videoB;
    this.posterEl = posterEl;

    // Start both fully transparent; active layer will be faded in on first switchTo
    videoA.style.opacity = '0';
    videoB.style.opacity = '0';
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

    // Update poster fallback immediately
    this.posterEl.style.backgroundImage = `url(${item.posterUrl})`;
    this.posterEl.style.backgroundPosition = this.getFocalPosition(item);

    // Load video into incoming layer
    incoming.src = item.videoUrl;
    incoming.muted = this.muted;
    incoming.style.objectPosition = this.getFocalPosition(item);

    // Wait until browser has first frame
    await new Promise<void>((resolve, reject) => {
      const ac = new AbortController();
      const { signal } = ac;
      incoming.addEventListener(
        'loadeddata',
        () => {
          ac.abort();
          resolve();
        },
        { signal },
      );
      incoming.addEventListener(
        'error',
        () => {
          ac.abort();
          reject(new Error(`Video load error: ${item.videoUrl}`));
        },
        { signal },
      );
      incoming.load();
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : 'load-error';
      this.onError(item, msg);
      // Video failed — poster already updated, skip crossfade
    });

    // Stale request guard: another switchTo() was called while we were loading
    if (this.sequenceId !== mySeq) return;

    // Start playback before fade
    incoming.play().catch(() => {
      // Autoplay blocked — poster visible already
    });

    // Crossfade: incoming fades in, outgoing fades out simultaneously
    const fadeIn = incoming.animate([{ opacity: '0' }, { opacity: '1' }], {
      duration: CROSSFADE_MS,
      easing: 'linear',
      fill: 'forwards',
    });
    const fadeOut = outgoing.animate([{ opacity: '1' }, { opacity: '0' }], {
      duration: CROSSFADE_MS,
      easing: 'linear',
      fill: 'forwards',
    });

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

    // Cleanup outgoing
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

  destroy(): void {
    this.sequenceId = Number.MAX_SAFE_INTEGER; // invalidate any pending switchTo
    this.videoA.pause();
    this.videoB.pause();
    this.videoA.removeAttribute('src');
    this.videoB.removeAttribute('src');
    this.videoA.load();
    this.videoB.load();
  }
}
