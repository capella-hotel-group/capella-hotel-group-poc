import { moveInstrumentation } from '@/app/scripts';

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children] as HTMLElement[];
  if (rows.length === 0) return;

  // ----- Track -----
  const viewport = document.createElement('div');
  viewport.className = 'offer-carousel-viewport';
  const track = document.createElement('div');
  track.className = 'offer-carousel-track';
  rows.forEach((row) => {
    const slide = document.createElement('div');
    slide.className = 'offer-carousel-slide';
    moveInstrumentation(row, slide);

    const media = document.createElement('div');
    media.className = 'offer-carousel-media';

    const cells = [...row.children] as HTMLElement[];
    const picture = cells[0]?.querySelector('picture');
    if (picture) {
      // cells[1] = authored alt-text override; apply to <img> then discard the cell.
      const altText = cells[1]?.textContent?.trim();
      const img = picture.querySelector<HTMLImageElement>('img');
      if (img && altText) img.alt = altText;
      media.append(picture);
    }

    slide.append(media);
    track.append(slide);
  });

  viewport.append(track);
  // ----- Navigation arrows -----
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'offer-carousel-nav offer-carousel-nav--prev';
  prevBtn.setAttribute('aria-label', 'Previous offer');
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'offer-carousel-nav offer-carousel-nav--next';
  nextBtn.setAttribute('aria-label', 'Next offer');

  // Arrows overlay the image, so nest them in the viewport for correct centering.
  viewport.append(prevBtn, nextBtn);

  // ----- Dots -----
  const dots = document.createElement('div');
  dots.className = 'offer-carousel-dots';

  const slides = [...track.children] as HTMLElement[];
  slides.forEach((_slide, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'offer-carousel-dot';
    dot.setAttribute('aria-label', `Go to offer ${index + 1}`);
    if (index === 0) dot.classList.add('is-active');
    dots.append(dot);
  });

  block.replaceChildren(viewport, dots);

  // ----- Carousel logic -----
  const dotEls = [...dots.children] as HTMLElement[];

  const setActiveDot = (index: number): void => {
    dotEls.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  };

  const currentIndex = (): number => {
    const { scrollLeft } = track;
    let closest = 0;
    let min = Number.POSITIVE_INFINITY;
    slides.forEach((slide, i) => {
      const distance = Math.abs(slide.offsetLeft - track.offsetLeft - scrollLeft);
      if (distance < min) {
        min = distance;
        closest = i;
      }
    });
    return closest;
  };

  const goToIndex = (index: number): void => {
    const target = slides[index];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    setActiveDot(index);
  };

  const handlePrev = (): void => goToIndex(Math.max(0, currentIndex() - 1));
  const handleNext = (): void => goToIndex(Math.min(slides.length - 1, currentIndex() + 1));
  const handleScroll = (): void => setActiveDot(currentIndex());

  prevBtn.addEventListener('click', handlePrev);
  nextBtn.addEventListener('click', handleNext);
  track.addEventListener('scroll', handleScroll, { passive: true });
  dotEls.forEach((dot, index) => dot.addEventListener('click', () => goToIndex(index)));

  // ----- Cleanup when the block leaves the DOM (Universal Editor add/remove) -----
  const observer = new MutationObserver(() => {
    if (!document.contains(block)) {
      prevBtn.removeEventListener('click', handlePrev);
      nextBtn.removeEventListener('click', handleNext);
      track.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
