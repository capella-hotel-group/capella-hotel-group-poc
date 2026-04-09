import { resolveDAMUrl } from '../../scripts/utils.js';

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

    frame.style.transform = 'none';
    frame.style.left = `${startLeft}px`;
    frame.style.top = `${startTop}px`;

    frame.addEventListener('pointermove', onMove);
    frame.addEventListener('pointerup', onUp, { once: true });
  });

  function onMove(e) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const containerRect = container.getBoundingClientRect();
    const maxLeft = containerRect.width - frame.offsetWidth;
    const maxTop = containerRect.height - frame.offsetHeight;

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

function updateMask(container, frame) {
  const containerRect = container.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  const x = frameRect.left - containerRect.left;
  const y = frameRect.top - containerRect.top;

  const picture = container.querySelector('picture');
  const maskPos = `${x}px ${y}px`;
  const maskSize = `${frame.offsetWidth}px ${frame.offsetHeight}px`;
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

  const frame = document.createElement('div');
  frame.className = 'frame-window';

  media.append(video);
  if (picture) media.append(picture);
  media.append(frame);

  block.innerHTML = '';
  block.append(media);

  if (picture) {
    makeDraggable(frame, media);
  }
}
