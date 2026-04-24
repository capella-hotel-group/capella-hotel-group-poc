// ── Constants ─────────────────────────────────────────────────────────────────
const CARD_W = 400;
const GAP = 55;
const ANIM_DURATION = 500;

// ── Tween helpers ─────────────────────────────────────────────────────────────
function easeOut(t) {
  return 1 - (1 - t) ** 3;
}

function evalTween(tw, now) {
  const t = Math.min(1, (now - tw.start) / ANIM_DURATION);
  return { value: tw.from + (tw.to - tw.from) * easeOut(t), done: t >= 1 };
}

// ── Carousel engine ───────────────────────────────────────────────────────────
function initCarousel(slider, track, cards, prevBtn, nextBtn, dragCursor, stride) {
  const N = cards.length;
  if (N === 0) return;

  let cardsPerView = 1;
  let vIdx = 0;
  let trackX = 0;
  let trackTween: { from: number; to: number; start: number } | null = null;
  let isDragging = false;
  let dragMoved = false;
  let startX = 0;
  let dragStartTrackX = 0;
  let rafId = 0;

  function maxIdx() {
    return Math.max(0, N - cardsPerView);
  }

  function computeTargetX(idx) {
    return -(idx * stride);
  }

  function applyTrack() {
    track.style.transform = `translateX(${trackX}px)`;
  }

  function updateArrows() {
    prevBtn.disabled = vIdx <= 0;
    nextBtn.disabled = vIdx >= maxIdx();

    const noScroll = N <= cardsPerView;
    slider.classList.toggle('cc-no-scroll', noScroll);
  }

  function recalcCardsPerView() {
    cardsPerView = Math.max(1, Math.floor((slider.offsetWidth + GAP) / stride));
  }

  function tick(now) {
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

  function startRAF() {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function go(idx, animated = true) {
    vIdx = Math.max(0, Math.min(idx, maxIdx()));

    // At the last index, snap the last card's right edge flush with the slider's right edge
    // instead of using the stride-based position which can leave a fractional gap.
    const atEnd = vIdx >= maxIdx() && N > cardsPerView;
    const targetX = atEnd ? slider.offsetWidth - (N * stride - GAP) : computeTargetX(vIdx);

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

  function snapToNearest() {
    const nearest = Math.round(-trackX / stride);
    go(nearest);
  }

  slider.addEventListener('pointerdown', (e) => {
    if (N <= cardsPerView) return;
    isDragging = true;
    dragMoved = false;
    startX = e.clientX;
    dragStartTrackX = trackX;
    trackTween = null;
    slider.setPointerCapture(e.pointerId);
  });

  slider.addEventListener('pointermove', (e) => {
    dragCursor.style.left = `${e.clientX}px`;
    dragCursor.style.top = `${e.clientY}px`;

    if (!isDragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 3) dragMoved = true;
    trackX = dragStartTrackX + dx;
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

  prevBtn.addEventListener('click', () => go(vIdx - 1));
  nextBtn.addEventListener('click', () => go(vIdx + 1));

  slider.addEventListener('pointerenter', () => {
    if (N > cardsPerView) dragCursor.classList.add('cc-drag-cursor--visible');
  });
  slider.addEventListener('pointerleave', () => {
    dragCursor.classList.remove('cc-drag-cursor--visible');
  });

  const ro = new ResizeObserver(() => {
    recalcCardsPerView();
    vIdx = Math.min(vIdx, maxIdx());
    go(vIdx, false);
  });
  ro.observe(slider);

  recalcCardsPerView();
  trackX = computeTargetX(vIdx);
  applyTrack();
  updateArrows();
}

// ── Block decorator ───────────────────────────────────────────────────────────
export default async function decorate(block) {
  const stride = CARD_W + GAP;

  // Build slider structure
  const sliderWrapper = document.createElement('div');
  sliderWrapper.className = 'cc-slider-wrapper';

  const slider = document.createElement('div');
  slider.className = 'cc-slider';

  const track = document.createElement('ul');
  track.className = 'cc-track';

  const cards: HTMLLIElement[] = [];

  const itemRows = [...block.children];

  itemRows.forEach((row) => {
    const cells = [...row.children];

    // cell[0] = picture, cell[1] = title, cell[2..] = content paragraphs
    const pictureEl = cells[0]?.querySelector('picture');
    const title = cells[1]?.textContent?.trim() ?? '';
    const contentCells = cells.slice(2);

    const li = document.createElement('li');
    li.className = 'cc-card-wrapper hc-card-wrapper';

    const cardEl = document.createElement('a');
    cardEl.className = 'cc-card';
    cardEl.href = 'javascript:void(0)';
    cardEl.setAttribute('role', 'presentation');

    // Card image
    const imageDiv = document.createElement('div');
    imageDiv.className = 'cc-card-image';
    if (pictureEl) {
      imageDiv.append(pictureEl.cloneNode(true));
    }

    // Card body
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'cc-card-body';

    const h3 = document.createElement('h3');
    h3.textContent = title;
    bodyDiv.append(h3);

    contentCells.forEach((cell, i) => {
      const text = cell.textContent?.trim() ?? '';
      if (!text) return;

      if (i === 0) {
        const hr = document.createElement('hr');
        hr.className = 'cc-card-divider';
        bodyDiv.append(hr);
      }

      const p = document.createElement('p');
      p.textContent = text;
      bodyDiv.append(p);
    });

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

  block.replaceChildren(arrowContainer, sliderWrapper, dragCursor);

  initCarousel(slider, track, cards, prevBtn, nextBtn, dragCursor, stride);
}
