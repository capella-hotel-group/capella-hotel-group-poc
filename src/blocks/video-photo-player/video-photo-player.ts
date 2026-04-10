import './video-photo-player.css';
import { AEM_PUBLISH_DAM } from '@/utils/constants';

function makeDraggable(frame: HTMLElement, container: HTMLElement) {
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  frame.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    frame.setPointerCapture(e.pointerId);

    const containerRect = container.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();

    startX = e.clientX;
    startY = e.clientY;
    startLeft = frameRect.left - containerRect.left;
    startTop = frameRect.top - containerRect.top;

    frame.style.bottom = 'auto';
    frame.style.left = `${startLeft}px`;
    frame.style.top = `${startTop}px`;

    frame.addEventListener('pointermove', onMove);
    frame.addEventListener('pointerup', onUp, { once: true });
  });

  function onMove(e) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const containerRect = container.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const frameWindow = frame.querySelector<HTMLElement>('.frame-window');
    const fh = frameWindow ? frameWindow.offsetHeight : frame.offsetHeight;
    const groupWidth = frameRect.width;
    const maxLeft = containerRect.width - groupWidth;
    const maxTop = containerRect.height - fh;

    const newLeft = Math.min(Math.max(0, startLeft + dx), maxLeft);
    const newTop = Math.min(Math.max(0, startTop + dy), maxTop);

    frame.style.left = `${newLeft}px`;
    frame.style.top = `${newTop}px`;

    updateMask(container, frame);
  }

  function onUp() {
    frame.removeEventListener('pointermove', onMove);
  }
}

function updateMask(container: HTMLElement, frameGroup: HTMLElement) {
  const containerRect = container.getBoundingClientRect();
  const frameWindow = frameGroup.querySelector<HTMLElement>('.frame-window');
  const targetRect = (frameWindow ?? frameGroup).getBoundingClientRect();
  const x = targetRect.left - containerRect.left;
  const y = targetRect.top - containerRect.top;
  const w = targetRect.width;
  const h = targetRect.height;

  const picture = container.querySelector<HTMLElement>('picture');
  if (!picture) return;
  const maskPos = `${x}px ${y}px`;
  const maskSize = `${w}px ${h}px`;
  const mask = `linear-gradient(#000 0 0) ${maskPos} / ${maskSize} no-repeat, linear-gradient(#000 0 0)`;
  picture.style.mask = mask;
  picture.style.webkitMask = mask;
  picture.style.maskComposite = 'exclude';
  picture.style.webkitMaskComposite = 'destination-out';
}

export default async function decorate(block) {
  const rows = [...block.children];

  // Row 0: video — first <a> href
  const videoSrc = resolveDAMUrl(rows[0]?.querySelector('a')?.href || '');

  // Row 1: picture — reuse the existing <picture> element
  const picture = rows[1]?.querySelector('picture');

  const media = document.createElement('div');
  media.className = 'video-photo-player-media';

  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  const source = document.createElement('source');
  source.src = videoSrc;
  source.type = 'video/mp4';
  video.append(source);

  const frameGroup = document.createElement('div');
  frameGroup.className = 'frame-group';

  const frame = document.createElement('div');
  frame.className = 'frame-window';

  const heartIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  heartIcon.setAttribute('class', 'frame-window-heart');
  heartIcon.setAttribute('width', '24');
  heartIcon.setAttribute('height', '24');
  heartIcon.setAttribute('viewBox', '0 0 24 24');
  heartIcon.setAttribute('fill', 'none');
  heartIcon.innerHTML =
    '<path d="M12 21L10.55 19.7C8.86667 18.1834 7.475 16.875 6.375 15.775C5.275 14.675 4.4 13.6875 3.75 12.8125C3.1 11.9375 2.64583 11.1334 2.3875 10.4C2.12917 9.66669 2 8.91669 2 8.15002C2 6.58336 2.525 5.27502 3.575 4.22502C4.625 3.17502 5.93333 2.65002 7.5 2.65002C8.36667 2.65002 9.19167 2.83336 9.975 3.20002C10.7583 3.56669 11.4333 4.08336 12 4.75002C12.5667 4.08336 13.2417 3.56669 14.025 3.20002C14.8083 2.83336 15.6333 2.65002 16.5 2.65002C18.0667 2.65002 19.375 3.17502 20.425 4.22502C21.475 5.27502 22 6.58336 22 8.15002C22 8.91669 21.8708 9.66669 21.6125 10.4C21.3542 11.1334 20.9 11.9375 20.25 12.8125C19.6 13.6875 18.725 14.675 17.625 15.775C16.525 16.875 15.1333 18.1834 13.45 19.7L12 21ZM12 18.3C13.6 16.8667 14.9167 15.6375 15.95 14.6125C16.9833 13.5875 17.8 12.6959 18.4 11.9375C19 11.1792 19.4167 10.5042 19.65 9.91252C19.8833 9.32086 20 8.73336 20 8.15002C20 7.15002 19.6667 6.31669 19 5.65002C18.3333 4.98336 17.5 4.65002 16.5 4.65002C15.7167 4.65002 14.9917 4.87086 14.325 5.31252C13.6583 5.75419 13.2 6.31669 12.95 7.00002H11.05C10.8 6.31669 10.3417 5.75419 9.675 5.31252C9.00833 4.87086 8.28333 4.65002 7.5 4.65002C6.5 4.65002 5.66667 4.98336 5 5.65002C4.33333 6.31669 4 7.15002 4 8.15002C4 8.73336 4.11667 9.32086 4.35 9.91252C4.58333 10.5042 5 11.1792 5.6 11.9375C6.2 12.6959 7.01667 13.5875 8.05 14.6125C9.08333 15.6375 10.4 16.8667 12 18.3Z" fill="white"/>';
  frame.append(heartIcon);

  const label = document.createElement('span');
  label.className = 'frame-window-label';
  label.textContent = 'moment';

  frameGroup.append(label, frame);

  media.append(video);
  if (picture) media.append(picture);
  media.append(frameGroup);

  block.innerHTML = '';
  block.append(media);

  video.addEventListener(
    'canplay',
    () => {
      frameGroup.classList.add('is-ready');
      frame.addEventListener(
        'animationend',
        () => {
          if (picture) updateMask(media, frameGroup);
          heartIcon.classList.add('is-visible');
          heartIcon.addEventListener(
            'animationend',
            () => {
              heartIcon.classList.remove('is-visible');
              heartIcon.classList.add('is-beating');
            },
            { once: true },
          );
        },
        { once: true },
      );
    },
    { once: true },
  );

  if (picture) {
    makeDraggable(frameGroup, media);
  }
}
export function resolveDAMUrl(src) {
  console.log('Resolving DAM URL:', src);
  const proxyOrigin = new URL(AEM_PUBLISH_DAM).origin;
  try {
    const url = new URL(src);
    return `${proxyOrigin}${url.pathname}${url.search}`;
  } catch {
    // src is already a relative path
  }
  return src;
}
