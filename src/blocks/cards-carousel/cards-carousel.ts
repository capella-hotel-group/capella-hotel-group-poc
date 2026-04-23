import DOMPurify from 'dompurify';
import { moveInstrumentation } from '@/app/scripts';
import { createOptimizedPicture } from '@/app/aem';

// ── Constants ─────────────────────────────────────────────────────────────────
const CARD_W = 360;
const AWARD_CARD_W = 200;
const GAP = 55;
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
  stride: number,
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
    return -(idx * stride);
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
    cardsPerView = Math.max(1, Math.floor(slider.offsetWidth / stride));
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
    const nearest = Math.round(-trackX / stride);
    go(nearest);
  }

  // ── Drag interaction ───────────────────────────────────────────────────────
  slider.addEventListener('pointerdown', (e) => {
    if (N <= cardsPerView) return;
    isDragging = true;
    dragMoved = false;
    startX = e.clientX;
    trackTween = null;
    slider.setPointerCapture(e.pointerId);
  });

  slider.addEventListener('pointermove', (e) => {
    // Drag cursor tracking (always, not just when dragging)
    dragCursor.style.left = `${e.clientX}px`;
    dragCursor.style.top = `${e.clientY}px`;

    if (!isDragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 3) dragMoved = true;
    trackX = computeTargetX(vIdx) + dx;
    applyTrack();
  });

  slider.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    slider.releasePointerCapture(e.pointerId);
    snapToNearest();
  });

  slider.addEventListener('pointercancel', (e) => {
    if (!isDragging) return;
    isDragging = false;
    slider.releasePointerCapture(e.pointerId);
    go(vIdx);
  });

  // Prevent link navigation when dragging
  slider.addEventListener(
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
  slider.addEventListener('pointerenter', () => {
    if (N > cardsPerView) dragCursor.classList.add('cc-drag-cursor--visible');
  });
  slider.addEventListener('pointerleave', () => {
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

  // First row is the block-level title field
  const titleRow = rows[0];
  const itemRows = rows.slice(1);

  // Headline
  const headline = document.createElement('h2');
  headline.className = 'cc-headline';
  if (titleRow) {
    const rawHTML = titleRow.querySelector('p')?.innerHTML ?? titleRow.textContent ?? '';
    if (rawHTML.trim()) {
      headline.innerHTML = DOMPurify.sanitize(rawHTML);
    }
    moveInstrumentation(titleRow, headline);
  }

  // Detect card type from first item row to determine stride
  const hasAwardCards =
    itemRows[0] !== undefined &&
    (itemRows[0].dataset.aueModel === 'carousel-card-award' || [...itemRows[0].children].length === 3);
  const cardWidth = hasAwardCards ? AWARD_CARD_W : CARD_W;
  const stride = cardWidth + GAP;

  // Build slider structure
  const sliderWrapper = document.createElement('div');
  sliderWrapper.className = 'cc-slider-wrapper';

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

    const li = document.createElement('li');
    // In UE: use data-aue-model. In production: award cards have 3 cells (no link field)
    const isAward = row.dataset.aueModel === 'carousel-card-award' || cells.length === 3;
    const cardType = isAward ? 'carousel-card-award' : 'carousel-card';
    li.className = `cc-card-wrapper cc-card-wrapper--${cardType}`;
    moveInstrumentation(row, li);

    const cardEl = isAward ? document.createElement('div') : document.createElement('a');
    cardEl.className = 'cc-card';
    if (!isAward && cardEl instanceof HTMLAnchorElement) {
      const link = cells[3]?.querySelector<HTMLAnchorElement>('a')?.href ?? cells[3]?.textContent?.trim() ?? '';
      if (link) {
        cardEl.href = link;
        cardEl.target = '_blank';
        cardEl.rel = 'noopener noreferrer';
      }
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

    if (isAward) {
      // Award card: richtext body field at cells[2]
      const bodyHTML = cells[2]?.querySelector('p')?.innerHTML ?? cells[2]?.textContent?.trim() ?? '';
      if (bodyHTML) {
        const hr = document.createElement('hr');
        hr.className = 'cc-card-divider';
        bodyDiv.append(hr);
        const bodyEl = document.createElement('div');
        bodyEl.className = 'cc-card-richbody';
        bodyEl.innerHTML = DOMPurify.sanitize(bodyHTML);
        bodyDiv.append(bodyEl);
      }
    } else {
      const subtitle = cells[2]?.textContent?.trim() ?? '';
      if (subtitle) {
        const hr = document.createElement('hr');
        hr.className = 'cc-card-divider';
        bodyDiv.append(hr);
        const p = document.createElement('p');
        p.textContent = subtitle;
        bodyDiv.append(p);
      }
    }

    cardEl.append(imageDiv, bodyDiv);
    li.append(cardEl);
    track.append(li);
    cards.push(li);
  });

  slider.append(track);
  sliderWrapper.append(slider);

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

  const dragInner = document.createElement('div');
  dragInner.className = 'cc-drag-inner';
  dragInner.innerHTML =
    '<span class="cc-drag-arrow cc-drag-arrow--left">&#9664;</span><span class="cc-drag-circle">Drag</span><span class="cc-drag-arrow cc-drag-arrow--right">&#9654;</span>';
  dragCursor.append(dragInner);

  if (hasAwardCards) {
    block.replaceChildren(headline, sliderWrapper);
  } else {
    block.replaceChildren(headline, arrowContainer, sliderWrapper, dragCursor);
  }

  initCarousel(slider, track, cards, prevBtn, nextBtn, dragCursor, stride);
}
