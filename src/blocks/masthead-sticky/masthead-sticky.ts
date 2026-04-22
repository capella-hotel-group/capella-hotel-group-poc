import { resolveDAMUrl } from '@/utils/env';

export default async function decorate(block: HTMLElement): Promise<void> {
  // Read authored fields from DOM rows:
  // row 0 = video, row 1 = videoMobile, row 2 = image, row 3 = imageMobile, row 4 = content
  const rows = [...block.querySelectorAll<HTMLDivElement>(':scope > div')];
  const videoRow = rows[0];
  const videoMobileRow = rows[1];
  const imageRow = rows[2];
  const imageMobileRow = rows[3];
  const contentRow = rows[4];

  // Resolve video URLs (mobile falls back to desktop)
  const desktopVideoSrc = resolveDAMUrl(videoRow?.querySelector<HTMLAnchorElement>('a')?.href ?? '');
  const mobileVideoSrc =
    resolveDAMUrl(videoMobileRow?.querySelector<HTMLAnchorElement>('a')?.href ?? '') || desktopVideoSrc;

  if (!desktopVideoSrc) return;

  // Resolve placeholder images (mobile falls back to desktop)
  const desktopPlaceholder =
    imageRow?.querySelector<HTMLPictureElement>('picture') ?? imageRow?.querySelector<HTMLImageElement>('img') ?? null;
  const mobilePlaceholder =
    imageMobileRow?.querySelector<HTMLPictureElement>('picture') ??
    imageMobileRow?.querySelector<HTMLImageElement>('img') ??
    null;

  // Responsive breakpoint: matches current CSS convention
  const mobileQuery = window.matchMedia('(max-width: 599px)');
  const isMobile = (): boolean => mobileQuery.matches;

  // Background video: autoplay, muted, loop, playsinline (muted required for autoplay policy)
  const bgVideo = document.createElement('video');
  bgVideo.className = 'masthead-bg-video';
  bgVideo.autoplay = true;
  bgVideo.muted = true;
  bgVideo.loop = true;
  bgVideo.playsInline = true;

  const bgSource = document.createElement('source');
  bgSource.src = isMobile() ? mobileVideoSrc : desktopVideoSrc;
  bgVideo.append(bgSource);

  // Swap video source on viewport change
  mobileQuery.addEventListener('change', () => {
    bgSource.src = isMobile() ? mobileVideoSrc : desktopVideoSrc;
    bgVideo.load();
  });

  // Select active placeholder based on viewport (mobile fallback to desktop)
  const activePlaceholder = isMobile() && mobilePlaceholder ? mobilePlaceholder : desktopPlaceholder;
  // Hide the unused placeholder
  if (mobilePlaceholder && mobilePlaceholder !== activePlaceholder) mobilePlaceholder.remove();
  if (desktopPlaceholder && desktopPlaceholder !== activePlaceholder) desktopPlaceholder.remove();

  if (activePlaceholder) {
    activePlaceholder.className = 'masthead-placeholder';

    const fadePlaceholder = (): void => {
      activePlaceholder.classList.add('masthead-placeholder--hidden');
      activePlaceholder.addEventListener('transitionend', () => {
        activePlaceholder.remove();
      });
    };

    if (bgVideo.readyState >= 2) {
      fadePlaceholder();
    } else {
      bgVideo.addEventListener('loadeddata', fadePlaceholder, { once: true });
    }
  }

  // Row 2: richtext content overlay
  let contentOverlay: HTMLDivElement | null = null;
  let scrollIcon: HTMLDivElement | null = null;
  const contentChildren = contentRow?.querySelectorAll<HTMLElement>(':scope > div > *');
  if (contentChildren && contentChildren.length > 0) {
    contentOverlay = document.createElement('div');
    contentOverlay.className = 'masthead-content';
    contentOverlay.append(...contentChildren);

    // Extract icon from content (authored as :icon-name:) into separate scroll indicator
    const iconSpan = contentOverlay.querySelector<HTMLElement>('span.icon');
    if (iconSpan) {
      const iconParent = iconSpan.closest('p');
      scrollIcon = document.createElement('div');
      scrollIcon.className = 'masthead-scroll-icon';
      scrollIcon.append(iconSpan);
      // Remove empty <p> that contained only the icon
      if (iconParent && iconParent.childNodes.length === 0) {
        iconParent.remove();
      }
    }
  }

  // "WATCH VIDEO" CTA — bottom-right corner
  const cta = document.createElement('a');
  cta.className = 'masthead-cta';
  cta.href = '#';
  cta.textContent = 'WATCH VIDEO';

  // Modal: appended to document.body so it lives outside the block's stacking context
  // (same pattern as header lang dropdown) — z-index: 200 sits above all page elements
  const modal = document.createElement('div');
  modal.className = 'masthead-modal';

  const modalVideo = document.createElement('video');
  modalVideo.className = 'masthead-modal-video';
  modalVideo.controls = true;

  const modalSource = document.createElement('source');
  modalSource.src = desktopVideoSrc;
  modalVideo.append(modalSource);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'masthead-modal-close';
  closeBtn.setAttribute('aria-label', 'Close video');
  closeBtn.textContent = '✕';

  modal.append(modalVideo, closeBtn);
  document.body.append(modal);

  // CTA click → open modal and play modal video
  cta.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.add('is-open');
    modalVideo.play().catch(() => {
      // play() may be interrupted; ignore — user can press play manually
    });
  });

  // Close button → hide modal, stop modal video (background video unaffected)
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('is-open');
    modalVideo.pause();
    modalVideo.currentTime = 0;
  });

  // Replace block contents — video + placeholder + content + scroll icon + CTA; modal is in document.body
  const children: Element[] = [bgVideo];
  if (activePlaceholder) children.push(activePlaceholder);
  if (contentOverlay) children.push(contentOverlay);
  if (scrollIcon) children.push(scrollIcon);
  children.push(cta);
  block.replaceChildren(...children);

  // Mark the parent section so sibling content sections can stack above masthead
  const section = block.closest<HTMLDivElement>('main > div');
  if (section) {
    section.classList.add('masthead-section');

    // Move <header> into <main> right after the masthead section.
    // This gives the visual order: masthead → header → content → footer.
    // Header keeps position:sticky + z-index:100 and sticks when it hits viewport top.
    const header = document.querySelector('header');
    if (header) section.after(header);
  }

  // Scroll-snap: auto-correct partial masthead visibility after 300ms idle.
  // Snaps to fully visible (scrollY=0) or fully hidden (scrollY=mastheadHeight).
  if (section) {
    let snapTimer = 0;
    let isSnapping = false;
    let snapRaf = 0;

    function cancelSnap(): void {
      if (!isSnapping) return;
      cancelAnimationFrame(snapRaf);
      isSnapping = false;
    }

    function smoothScroll(target: number, duration = 800): void {
      const start = window.scrollY;
      const distance = target - start;
      if (Math.abs(distance) < 1) {
        isSnapping = false;
        return;
      }
      let t0 = 0;

      function step(ts: number): void {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / duration, 1);
        // ease-out cubic: fast start, gentle deceleration
        const ease = 1 - (1 - p) ** 3;
        window.scrollTo(0, start + distance * ease);
        if (p < 1) {
          snapRaf = requestAnimationFrame(step);
        } else {
          isSnapping = false;
        }
      }

      snapRaf = requestAnimationFrame(step);
    }

    const onScroll = (): void => {
      if (isSnapping) return;
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        const y = window.scrollY;
        const h = section.offsetHeight;
        if (y <= 0 || y >= h) return;
        const target = y / h < 0.5 ? 0 : h;
        isSnapping = true;
        smoothScroll(target);
      }, 300);
    };

    // User input (wheel/touch/keyboard) cancels active snap immediately.
    // These only fire from real user gestures, never from programmatic scrollTo.
    window.addEventListener('wheel', cancelSnap, { passive: true });
    window.addEventListener('touchstart', cancelSnap, { passive: true });
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (
        isSnapping &&
        (e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'PageUp' ||
          e.key === 'PageDown' ||
          e.key === ' ' ||
          e.key === 'Home' ||
          e.key === 'End')
      ) {
        cancelSnap();
      }
    });

    window.addEventListener('scroll', onScroll, { passive: true });
  }
}
