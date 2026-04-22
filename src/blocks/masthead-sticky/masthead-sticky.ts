import { resolveDAMUrl } from '@/utils/env';

export default async function decorate(block: HTMLElement): Promise<void> {
  // Read authored video URL from the single authored link field
  const sourceAnchor = block.querySelector<HTMLAnchorElement>('a');
  const videoSrc = resolveDAMUrl(sourceAnchor?.href ?? '');

  if (!videoSrc) return;

  // Background video: autoplay, muted, loop, playsinline (muted required for autoplay policy)
  const bgVideo = document.createElement('video');
  bgVideo.className = 'masthead-bg-video';
  bgVideo.autoplay = true;
  bgVideo.muted = true;
  bgVideo.loop = true;
  bgVideo.playsInline = true;

  const bgSource = document.createElement('source');
  bgSource.src = videoSrc;
  bgVideo.append(bgSource);

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
  modalSource.src = videoSrc;
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

  // Replace block contents — background video + CTA only; modal is in document.body
  block.replaceChildren(bgVideo, cta);

  // Mark the parent section so sibling content sections can stack above masthead
  const section = block.closest('main > div');
  if (section) {
    section.classList.add('masthead-section');

    // Move <header> into <main> right after the masthead section.
    // This gives the visual order: masthead → header → content → footer.
    // Header keeps position:sticky + z-index:100 and sticks when it hits viewport top.
    const header = document.querySelector('header');
    if (header) section.after(header);
  }
}
