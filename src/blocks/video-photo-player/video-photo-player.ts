import './video-photo-player.css';
import { AEM_PUBLISH_DAM } from '@/utils/constants';

function makeDraggable(frame, container) {
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
    const frameWindow = frame.querySelector<HTMLElement>('.frame-window');
    const fw = frameWindow ? frameWindow.offsetWidth : frame.offsetWidth;
    const fh = frameWindow ? frameWindow.offsetHeight : frame.offsetHeight;
    const maxLeft = containerRect.width - fw;
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

function updateMask(container, frameGroup) {
  const containerRect = container.getBoundingClientRect();
  const frameWindow = frameGroup.querySelector<HTMLElement>('.frame-window');
  const targetRect = (frameWindow ?? frameGroup).getBoundingClientRect();
  const x = targetRect.left - containerRect.left;
  const y = targetRect.top - containerRect.top;
  const w = targetRect.width;
  const h = targetRect.height;

  const picture = container.querySelector('picture');
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
      if (picture) {
        frame.addEventListener('animationend', () => updateMask(media, frameGroup), { once: true });
      }
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
