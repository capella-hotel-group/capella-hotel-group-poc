import DOMPurify from 'dompurify';
import { moveInstrumentation } from '@/app/scripts';
import { createOptimizedPicture } from '@/app/aem';

// ── Constants ─────────────────────────────────────────────────────────────────
const CARD_W = 300;
const GAP = 36;
const STRIDE = CARD_W + GAP;
const ANIM_DURATION = 500;

// ── Tween helpers (same pattern as activities) ────────────────────────────────
interface Tween {
  from: number;
  to: number;
  start: number;
}

function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

function evalTween(tw: Tween, now: number): { value: number; done: boolean } {
  const t = Math.min(1, (now - tw.start) / ANIM_DURATION);
  return { value: tw.from + (tw.to - tw.from) * easeOut(t), done: t >= 1 };
}

// ── Carousel engine ───────────────────────────────────────────────────────────
function initCarousel(
  slider: HTMLElement,
  track: HTMLElement,
  cards: HTMLElement[],
  prevBtn: HTMLButtonElement,
  nextBtn: HTMLButtonElement,
  dragCursor: HTMLElement,
): void {
  const N = cards.length;
  if (N === 0) return;

  let cardsPerView = 1;
  let vIdx = 0;
  let trackX = 0;
  let trackTween: Tween | null = null;
  let isDragging = false;
  let dragMoved = false;
  let startX = 0;
  let rafId = 0;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function maxIdx(): number {
    return Math.max(0, N - cardsPerView);
  }

  function computeTargetX(idx: number): number {
    return -(idx * STRIDE);
  }

  function applyTrack(): void {
    track.style.transform = `translateX(${trackX}px)`;
  }

  function updateArrows(): void {
    prevBtn.disabled = vIdx <= 0;
    nextBtn.disabled = vIdx >= maxIdx();

    const noScroll = N <= cardsPerView;
    slider.classList.toggle('cc-no-scroll', noScroll);
  }

  function recalcCardsPerView(): void {
    cardsPerView = Math.max(1, Math.floor(slider.offsetWidth / STRIDE));
  }

  // ── RAF loop ───────────────────────────────────────────────────────────────
  function tick(now: number): void {
    if (!trackTween) {
      rafId = 0;
      return;
    }
    const { value, done } = evalTween(trackTween, now);
    trackX = value;
    applyTrack();
    if (done) {
      trackTween = null;
      rafId = 0;
    } else {
      rafId = requestAnimationFrame(tick);
    }
  }

  function startRAF(): void {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  // ── Navigate ───────────────────────────────────────────────────────────────
  function go(idx: number, animated = true): void {
    vIdx = Math.max(0, Math.min(idx, maxIdx()));
    const targetX = computeTargetX(vIdx);

    if (!animated) {
      trackX = targetX;
      trackTween = null;
      applyTrack();
      updateArrows();
      return;
    }

    trackTween = { from: trackX, to: targetX, start: performance.now() };
    startRAF();
    updateArrows();
  }

  // ── Snap to nearest ───────────────────────────────────────────────────────
  function snapToNearest(): void {
    const nearest = Math.round(-trackX / STRIDE);
    go(nearest);
  }

  // ── Drag interaction ───────────────────────────────────────────────────────
  track.addEventListener('pointerdown', (e) => {
    if (N <= cardsPerView) return;
    isDragging = true;
    dragMoved = false;
    startX = e.clientX;
    trackTween = null;
    track.setPointerCapture(e.pointerId);
  });

  track.addEventListener('pointermove', (e) => {
    // Drag cursor tracking (always, not just when dragging)
    dragCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;

    if (!isDragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 3) dragMoved = true;
    trackX = computeTargetX(vIdx) + dx;
    applyTrack();
  });

  track.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    track.releasePointerCapture(e.pointerId);
    snapToNearest();
  });

  track.addEventListener('pointercancel', (e) => {
    if (!isDragging) return;
    isDragging = false;
    track.releasePointerCapture(e.pointerId);
    go(vIdx);
  });

  // Prevent link navigation when dragging
  track.addEventListener(
    'click',
    (e) => {
      if (dragMoved) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );

  // ── Arrow buttons ──────────────────────────────────────────────────────────
  prevBtn.addEventListener('click', () => go(vIdx - 1));
  nextBtn.addEventListener('click', () => go(vIdx + 1));

  // ── Drag cursor show/hide ──────────────────────────────────────────────────
  track.addEventListener('pointerenter', () => {
    if (N > cardsPerView) dragCursor.classList.add('cc-drag-cursor--visible');
  });
  track.addEventListener('pointerleave', () => {
    dragCursor.classList.remove('cc-drag-cursor--visible');
  });

  // ── Responsive resize ─────────────────────────────────────────────────────
  const ro = new ResizeObserver(() => {
    recalcCardsPerView();
    vIdx = Math.min(vIdx, maxIdx());
    go(vIdx, false);
  });
  ro.observe(slider);

  // ── Init ───────────────────────────────────────────────────────────────────
  recalcCardsPerView();
  trackX = computeTargetX(vIdx);
  applyTrack();
  updateArrows();
}

// ── Block decorator ───────────────────────────────────────────────────────────
export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children] as HTMLElement[];

  // First two rows are block-level fields (title, link)
  const titleRow = rows[0];
  const linkRow = rows[1];
  const itemRows = rows.slice(2);

  // Headline
  const headline = document.createElement('div');
  headline.className = 'cc-headline';
  const titleHTML = titleRow?.innerHTML?.trim() ?? '';
  if (titleHTML) {
    headline.innerHTML = DOMPurify.sanitize(titleHTML);
    moveInstrumentation(titleRow, headline);
  }

  // Block-level link
  const linkHref = linkRow?.querySelector<HTMLAnchorElement>('a')?.href ?? linkRow?.textContent?.trim() ?? '';
  if (linkHref) {
    const linkEl = document.createElement('a');
    linkEl.className = 'cc-link';
    linkEl.href = linkHref;
    linkEl.textContent = linkRow?.textContent?.trim() ?? '';
    moveInstrumentation(linkRow, linkEl);
    headline.append(linkEl);
  }

  // Build slider structure
  const slider = document.createElement('div');
  slider.className = 'cc-slider';

  const track = document.createElement('ul');
  track.className = 'cc-track';

  const cards: HTMLElement[] = [];

  itemRows.forEach((row) => {
    const cells = [...row.children] as HTMLElement[];
    const picture = row.querySelector('picture');
    const img = picture?.querySelector<HTMLImageElement>('img');
    const title = cells[1]?.textContent?.trim() ?? '';
    const subtitle = cells[2]?.textContent?.trim() ?? '';
    const link = cells[3]?.querySelector<HTMLAnchorElement>('a')?.href ?? cells[3]?.textContent?.trim() ?? '';

    const li = document.createElement('li');
    li.className = 'cc-card-wrapper';
    moveInstrumentation(row, li);

    const anchor = document.createElement('a');
    anchor.className = 'cc-card';
    if (link) {
      anchor.href = link;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }

    // Card image
    const imageDiv = document.createElement('div');
    imageDiv.className = 'cc-card-image';
    if (img) {
      const optimized = createOptimizedPicture(img.src, img.alt || title, false, [{ width: '600' }]);
      imageDiv.append(optimized);
    }

    // Card body
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'cc-card-body';

    const h3 = document.createElement('h3');
    h3.textContent = title;
    bodyDiv.append(h3);

    if (subtitle) {
      const p = document.createElement('p');
      p.textContent = subtitle;
      bodyDiv.append(p);
    }

    anchor.append(imageDiv, bodyDiv);
    li.append(anchor);
    track.append(li);
    cards.push(li);
  });

  slider.append(track);

  // Arrows
  const arrowContainer = document.createElement('div');
  arrowContainer.className = 'cc-arrows';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'cc-arrow cc-arrow--prev';
  prevBtn.setAttribute('aria-label', 'Previous');
  prevBtn.innerHTML = '<span class="cc-arrow-icon"><span class="cc-shaft"></span></span>';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'cc-arrow cc-arrow--next';
  nextBtn.setAttribute('aria-label', 'Next');
  nextBtn.innerHTML = '<span class="cc-arrow-icon"><span class="cc-shaft"></span></span>';

  arrowContainer.append(prevBtn, nextBtn);

  // Drag cursor
  const dragCursor = document.createElement('div');
  dragCursor.className = 'cc-drag-cursor';
  dragCursor.textContent = 'Drag';

  block.replaceChildren(headline, arrowContainer, slider, dragCursor);

  initCarousel(slider, track, cards, prevBtn, nextBtn, dragCursor);
}
