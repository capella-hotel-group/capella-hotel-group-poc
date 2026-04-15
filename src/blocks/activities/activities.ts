import { moveInstrumentation } from '@/app/scripts';
import { resolveDAMUrl } from '@/utils/env';

const SLIDE_W = 426;
const VISUAL_GAP = 40; // desired visual gap between adjacent scaled inner edges
const SWIPE_THRESHOLD = 60;
const ANIM_DURATION = 500;
const SCALE_ACTIVE = 1;
const SCALE_INACTIVE = 0.75;
const OPACITY_ACTIVE = 1;
const OPACITY_INACTIVE = 1;

// ── Types ─────────────────────────────────────────────────────────────────────
interface Tween {
  from: number;
  to: number;
  start: number;
}

interface SlideState {
  scale: number;
  opacity: number;
  scaleTween: Tween | null;
  opacityTween: Tween | null;
}

// ── Easing / tween helpers ────────────────────────────────────────────────────
function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

function makeTween(from: number, to: number, now: number): Tween {
  return { from, to, start: now };
}

function evalTween(tw: Tween, now: number): { value: number; done: boolean } {
  const t = Math.min(1, (now - tw.start) / ANIM_DURATION);
  return { value: tw.from + (tw.to - tw.from) * easeOut(t), done: t >= 1 };
}

function buildSlides(itemRows: HTMLElement[]): HTMLElement[] {
  return itemRows.map((row) => {
    const wrapper = document.createElement('li');
    wrapper.className = 'activities-slide-wrapper';
    moveInstrumentation(row, wrapper);

    const slide = document.createElement('div');
    slide.className = 'activities-slide';

    const picture = row.querySelector('picture');
    const img = picture?.querySelector<HTMLImageElement>('img');
    if (img?.src) {
      slide.style.backgroundImage = `url('${img.src}')`;
    }

    // Slide text overlay (visible on active)
    const textCells = [...row.children] as HTMLElement[];
    const slideText = document.createElement('div');
    slideText.className = 'activities-slide-text';
    textCells.forEach((cell) => {
      if (!cell.querySelector('picture') && cell.textContent?.trim()) {
        slideText.append(...[...cell.childNodes].map((n) => n.cloneNode(true)));
      }
    });
    if (slideText.childNodes.length > 0) {
      slide.append(slideText);
    }

    wrapper.append(slide);
    return wrapper;
  });
}

function initSlider(slider: HTMLElement, track: HTMLElement, slides: HTMLElement[]): void {
  if (slides.length === 0) return;

  const N = slides.length;

  function cloneWithoutInstrumentation(el: HTMLElement): HTMLElement {
    const clone = el.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll<HTMLElement>(
        '[data-aue-resource],[data-aue-prop],[data-aue-type],[data-aue-label],[data-aue-filter],[data-aue-behavior]',
      )
      .forEach((node) => {
        Object.keys(node.dataset)
          .filter((k) => k.startsWith('aue'))
          .forEach((k) => delete node.dataset[k]);
      });
    Object.keys(clone.dataset)
      .filter((k) => k.startsWith('aue'))
      .forEach((k) => delete clone.dataset[k]);
    return clone;
  }

  const prependClones = slides.map(cloneWithoutInstrumentation);
  const appendClones = slides.map(cloneWithoutInstrumentation);
  track.prepend(...prependClones);
  track.append(...appendClones);

  // allNodes: [N clones | N real | N clones]
  const allNodes = [...prependClones, ...slides, ...appendClones];

  // ── Mutable state ──────────────────────────────────────────────────────────
  let vIdx = N;
  let trackX = 0;
  let trackTween: Tween | null = null;
  let isDragging = false;
  let startX = 0;
  let activeNode: HTMLElement | null = null;
  let rafId = 0;

  const slideStates: SlideState[] = allNodes.map((_, i) => ({
    scale: i === vIdx ? SCALE_ACTIVE : SCALE_INACTIVE,
    opacity: i === vIdx ? OPACITY_ACTIVE : OPACITY_INACTIVE,
    scaleTween: null,
    opacityTween: null,
  }));

  // ── Helpers ────────────────────────────────────────────────────────────────
  function computeTargetX(v: number): number {
    // Inactive effective layout width = W*S + V; active = W + V.
    // Stride is always STRIDE (constant) because each slide preceding
    // the target is inactive, so centre of target = v*STRIDE + (W+V)/2.
    const stride = SLIDE_W * SCALE_INACTIVE + VISUAL_GAP;
    return slider.offsetWidth / 2 - (SLIDE_W + VISUAL_GAP) / 2 - v * stride;
  }

  function applyTrack(): void {
    track.style.transform = `translateX(${trackX}px)`;
  }

  function applySlide(node: HTMLElement, state: SlideState): void {
    const inner = node.querySelector<HTMLElement>('.activities-slide') ?? node;
    inner.style.transform = `scale(${state.scale})`;
    inner.style.opacity = String(state.opacity);
    // Adjust wrapper margin so visual gap between inner edges stays constant (VISUAL_GAP)
    // for any pair of adjacent slides regardless of their scales.
    // margin = V/2 - W*(1-s)/2  →  visual_gap = 2*margin + waste_left + waste_right = V ✓
    const margin = VISUAL_GAP / 2 - (SLIDE_W * (1 - state.scale)) / 2;
    node.style.marginInline = `${margin}px`;
  }

  // Only is-active class used now — for z-index only, not CSS transform/opacity
  function setActive(v: number): void {
    const next = allNodes[v];
    if (next === activeNode) return;
    activeNode?.classList.remove('is-active');
    next.classList.add('is-active');
    activeNode = next;
  }

  // ── RAF loop ───────────────────────────────────────────────────────────────
  function tick(now: number): void {
    let busy = false;

    if (trackTween) {
      const { value, done } = evalTween(trackTween, now);
      trackX = value;
      applyTrack();
      if (done) {
        trackTween = null;
        // Teleport: finished on a clone → jump to real counterpart instantly
        if (vIdx < N) teleport(vIdx + N);
        else if (vIdx >= 2 * N) teleport(vIdx - N);
      } else {
        busy = true;
      }
    }

    allNodes.forEach((node, i) => {
      const state = slideStates[i];
      let changed = false;

      if (state.scaleTween) {
        const { value, done } = evalTween(state.scaleTween, now);
        state.scale = value;
        if (done) state.scaleTween = null;
        else busy = true;
        changed = true;
      }

      if (state.opacityTween) {
        const { value, done } = evalTween(state.opacityTween, now);
        state.opacity = value;
        if (done) state.opacityTween = null;
        else busy = true;
        changed = true;
      }

      if (changed) applySlide(node, state);
    });

    rafId = busy ? requestAnimationFrame(tick) : 0;
  }

  function startRAF(): void {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  // ── Teleport (instant, no animation) ──────────────────────────────────────
  // Called when the track finishes on a clone. Visual position is identical
  // to the real counterpart, so no jank — just update indices and inline styles.
  function teleport(vNew: number): void {
    vIdx = vNew;
    trackX = computeTargetX(vNew);
    trackTween = null;
    applyTrack();
    setActive(vNew);
    allNodes.forEach((node, i) => {
      const isActive = i === vNew;
      const state = slideStates[i];
      state.scale = isActive ? SCALE_ACTIVE : SCALE_INACTIVE;
      state.opacity = isActive ? OPACITY_ACTIVE : OPACITY_INACTIVE;
      state.scaleTween = null;
      state.opacityTween = null;
      applySlide(node, state);
    });
  }

  // ── Navigate ───────────────────────────────────────────────────────────────
  function go(vNew: number, animated = true): void {
    setActive(vNew);

    if (!animated) {
      vIdx = vNew;
      trackX = computeTargetX(vNew);
      trackTween = null;
      applyTrack();
      allNodes.forEach((node, i) => {
        const isActive = i === vNew;
        const state = slideStates[i];
        state.scale = isActive ? SCALE_ACTIVE : SCALE_INACTIVE;
        state.opacity = isActive ? OPACITY_ACTIVE : OPACITY_INACTIVE;
        state.scaleTween = null;
        state.opacityTween = null;
        applySlide(node, state);
      });
      return;
    }

    const now = performance.now();
    const targetX = computeTargetX(vNew);

    // Start tweens from the current rendered values — handles mid-animation interruption
    trackTween = makeTween(trackX, targetX, now);

    allNodes.forEach((_, i) => {
      const isActive = i === vNew;
      const state = slideStates[i];
      const ts = isActive ? SCALE_ACTIVE : SCALE_INACTIVE;
      const to = isActive ? OPACITY_ACTIVE : OPACITY_INACTIVE;
      if (Math.abs(state.scale - ts) > 0.001) state.scaleTween = makeTween(state.scale, ts, now);
      if (Math.abs(state.opacity - to) > 0.001) state.opacityTween = makeTween(state.opacity, to, now);
    });

    vIdx = vNew;
    startRAF();
  }

  // ── Swipe ──────────────────────────────────────────────────────────────────
  track.addEventListener('pointerdown', (e) => {
    isDragging = true;
    startX = e.clientX;
    trackTween = null; // cancel ongoing tween so drag is immediate
    track.setPointerCapture(e.pointerId);
  });

  track.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    trackX = computeTargetX(vIdx) + (e.clientX - startX);
    applyTrack();
  });

  function endDrag(clientX: number): void {
    if (!isDragging) return;
    isDragging = false;
    const diff = clientX - startX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      go(vIdx + (diff < 0 ? 1 : -1));
    } else {
      go(vIdx); // snap back
    }
  }

  track.addEventListener('pointerup', (e) => endDrag(e.clientX));
  track.addEventListener('pointercancel', () => endDrag(startX));

  // ── Resize ─────────────────────────────────────────────────────────────────
  const ro = new ResizeObserver(() => go(vIdx, false));
  ro.observe(slider);

  // ── Init ───────────────────────────────────────────────────────────────────
  trackX = computeTargetX(vIdx);
  applyTrack();
  allNodes.forEach((node, i) => applySlide(node, slideStates[i]));
  setActive(vIdx);
}

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children] as HTMLElement[];

  // Block-level fields (activities model: backgroundVideo, intro, categories)
  const videoSrc = rows[0]?.querySelector<HTMLAnchorElement>('a')?.href ?? '';
  const introRow = rows[1];
  const categoriesRow = rows[2];

  // Activity items start after the 3 block-level fields
  const itemRows = rows.slice(3);

  const container = document.createElement('div');
  container.className = 'activities-container';

  // Background video
  if (videoSrc) {
    const video = document.createElement('video');
    video.className = 'activities-bg-video';
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');
    const source = document.createElement('source');
    source.src = resolveDAMUrl(videoSrc);
    video.append(source);
    container.append(video);
  }

  const overlay = document.createElement('div');
  overlay.className = 'activities-overlay';
  container.append(overlay);

  // Block-level intro
  if (introRow?.textContent?.trim()) {
    const intro = document.createElement('div');
    intro.className = 'activities-intro';
    moveInstrumentation(introRow, intro);
    intro.append(...[...introRow.children].map((c) => c.cloneNode(true)));
    container.append(intro);
  }

  // Block-level categories
  if (categoriesRow?.textContent?.trim()) {
    const categories = document.createElement('div');
    categories.className = 'activities-categories';
    moveInstrumentation(categoriesRow, categories);
    const paragraphs = categoriesRow.querySelectorAll('p');
    paragraphs.forEach((p, i) => {
      const clone = p.cloneNode(true) as HTMLElement;
      if (i === 0) clone.classList.add('is-active');
      clone.addEventListener('click', () => {
        categories.querySelector('.is-active')?.classList.remove('is-active');
        clone.classList.add('is-active');
      });
      categories.append(clone);
    });
    container.append(categories);
  }

  // Slider
  if (itemRows.length > 0) {
    const slider = document.createElement('div');
    slider.className = 'activities-slider';

    const track = document.createElement('ul');
    track.className = 'activities-track';

    const slides = buildSlides(itemRows);
    track.append(...slides);
    slider.append(track);
    container.append(slider);

    initSlider(slider, track, slides);
  }

  block.replaceChildren(container);
}
