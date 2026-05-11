export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = Array.from(block.children);

  if (rows.length < 5) return;

  // Left content
  const headlineText = rows[0].textContent?.trim() || '';
  const descriptionHtml = rows[1].innerHTML;
  const ctaLabel = rows[2].textContent?.trim() || '';
  const ctaLink =
    rows[3].querySelector('a')?.getAttribute('href') || '#';

  // Slides
  const slideRows = rows.slice(4);

  // Main wrapper
  const content = document.createElement('div');
  content.className = 'product-carousel__content';

  const headline = document.createElement('h2');
  headline.className = 'product-carousel__headline';
  headline.textContent = headlineText;

  const description = document.createElement('div');
  description.className = 'product-carousel__description';
  description.innerHTML = descriptionHtml;

  const cta = document.createElement('a');
  cta.className = 'product-carousel__cta';
  cta.href = ctaLink;
  cta.textContent = ctaLabel;

  content.append(headline, description, cta);

  // Slider wrapper
  const sliderWrapper = document.createElement('div');
  sliderWrapper.className = 'product-carousel__slider-wrapper';

  const slider = document.createElement('div');
  slider.className = 'product-carousel__slider';

  // Navigation
  const prevBtn = document.createElement('button');
  prevBtn.className =
    'product-carousel__nav product-carousel__nav--prev';
  prevBtn.innerHTML = '&#10094;';

  const nextBtn = document.createElement('button');
  nextBtn.className =
    'product-carousel__nav product-carousel__nav--next';
  nextBtn.innerHTML = '&#10095;';

  // Dots
  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'product-carousel__dots';

  // Create slides
  slideRows.forEach((row, index) => {
    const cols = Array.from(row.children);

    const picture = cols[0]?.querySelector('picture');
    const number = cols[1]?.textContent?.trim() || '';
    const title = cols[2]?.textContent?.trim() || '';
    const category = cols[3]?.textContent?.trim() || '';

    const slide = document.createElement('div');
    slide.className = 'product-carousel__slide';

    if (index === 0) {
      slide.classList.add('active');
    }

    // Image
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'product-carousel__image';

    if (picture) {
      imageWrapper.appendChild(picture.cloneNode(true));
    }

    // Card
    const card = document.createElement('div');
    card.className = 'product-carousel__card';

    const meta = document.createElement('div');
    meta.className = 'product-carousel__meta';

    const numberEl = document.createElement('span');
    numberEl.className = 'product-carousel__number';
    numberEl.textContent = number;

    const categoryEl = document.createElement('span');
    categoryEl.className = 'product-carousel__category';
    categoryEl.textContent = category;

    meta.append(numberEl, categoryEl);

    const titleEl = document.createElement('h3');
    titleEl.className = 'product-carousel__title';
    titleEl.textContent = title;

    card.append(meta, titleEl);

    slide.append(imageWrapper, card);

    slider.appendChild(slide);

    // Dots
    const dot = document.createElement('button');
    dot.className = 'product-carousel__dot';

    if (index === 0) {
      dot.classList.add('active');
    }

    dotsContainer.appendChild(dot);
  });

  sliderWrapper.append(
    slider,
    prevBtn,
    nextBtn,
    dotsContainer,
  );

  block.replaceChildren(content, sliderWrapper);

  // Carousel logic
  const slides = Array.from(
    slider.querySelectorAll('.product-carousel__slide'),
  );

  const dots = Array.from(
    dotsContainer.querySelectorAll('.product-carousel__dot'),
  );

  let currentIndex = 0;

  const updateSlider = () => {
    slides.forEach((slide, index) => {
      slide.classList.toggle(
        'active',
        index === currentIndex,
      );
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle(
        'active',
        index === currentIndex,
      );
    });

    const activeSlide = slides[currentIndex];

    if (activeSlide) {
      activeSlide.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  };

  nextBtn.addEventListener('click', () => {
    if (currentIndex < slides.length - 1) {
      currentIndex += 1;
      updateSlider();
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      updateSlider();
    }
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      currentIndex = index;
      updateSlider();
    });
  });

  updateSlider();
}