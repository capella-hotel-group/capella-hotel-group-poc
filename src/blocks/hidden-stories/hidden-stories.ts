import { moveInstrumentation } from '@/app/scripts';
import { createOptimizedPicture } from '@/app/aem';
import { resolveDAMUrl } from '@/utils/env';

const SVG_DAY =
  '<path d="M8.62493 4.06694V1.52856H9.37493V4.06694H8.62493ZM12.7471 5.78332L12.2351 5.27125L14.0034 3.43244L14.5484 3.98182L12.7471 5.78332ZM13.9327 9.37469V8.62469H16.4711V9.37469H13.9327ZM8.62493 16.4708V13.9469H9.37493V16.4708H8.62493ZM5.28162 5.76025L3.43268 3.99625L3.9965 3.46563L5.798 5.2525L5.28162 5.76025ZM13.9991 14.5669L12.2351 12.7281L12.7428 12.2348L14.534 13.9943L13.9991 14.5669ZM1.52881 9.37469V8.62469H4.06718V9.37469H1.52881ZM3.98206 14.5669L3.46587 14.0031L5.234 12.2348L5.50381 12.4958L5.78787 12.7613L3.98206 14.5669ZM6.34606 11.6536C5.61531 10.9228 5.24993 10.0382 5.24993 8.99969C5.24993 7.96119 5.61531 7.07657 6.34606 6.34582C7.07681 5.61507 7.96143 5.24969 8.99993 5.24969C10.0384 5.24969 10.9231 5.61507 11.6538 6.34582C12.3846 7.07657 12.7499 7.96119 12.7499 8.99969C12.7499 10.0382 12.3846 10.9228 11.6538 11.6536C10.9231 12.3843 10.0384 12.7497 8.99993 12.7497C7.96143 12.7497 7.07681 12.3843 6.34606 11.6536ZM11.1187 11.1184C11.7062 10.5309 11.9999 9.82469 11.9999 8.99969C11.9999 8.17469 11.7062 7.46844 11.1187 6.88094C10.5312 6.29344 9.82493 5.99969 8.99993 5.99969C8.17493 5.99969 7.46868 6.29344 6.88118 6.88094C6.29368 7.46844 5.99993 8.17469 5.99993 8.99969C5.99993 9.82469 6.29368 10.5309 6.88118 11.1184C7.46868 11.7059 8.17493 11.9997 8.99993 11.9997C9.82493 11.9997 10.5312 11.7059 11.1187 11.1184Z" fill="#272727"/>';

const SVG_NIGHT =
  '<path d="M11.0336 5.6974L9.3172 3.98102L11.0336 2.26465L12.75 3.98102L11.0336 5.6974ZM14.7836 7.9474L13.8172 6.98102L14.7836 6.01465L15.75 6.98102L14.7836 7.9474ZM9.0562 15.7502C8.11195 15.7502 7.22614 15.5718 6.39876 15.2151C5.57139 14.8583 4.84833 14.3706 4.22958 13.7518C3.61083 13.1331 3.12308 12.41 2.76633 11.5826C2.40958 10.7553 2.2312 9.86946 2.2312 8.92521C2.2312 7.46559 2.65139 6.14946 3.49176 4.97684C4.33214 3.80421 5.44083 2.98671 6.81783 2.52434C6.76583 3.69446 6.94514 4.81965 7.35576 5.8999C7.76626 6.98027 8.38645 7.93534 9.21633 8.76509C10.0461 9.59496 11.0011 10.2151 12.0815 10.6256C13.1618 11.0363 14.287 11.2156 15.4571 11.1636C14.9976 12.5406 14.1808 13.6493 13.0066 14.4896C11.8326 15.33 10.5158 15.7502 9.0562 15.7502ZM9.0562 15.0002C10.1562 15.0002 11.175 14.7252 12.1125 14.1752C13.05 13.6252 13.7875 12.869 14.325 11.9065C13.25 11.8065 12.2312 11.5322 11.2687 11.0837C10.3062 10.6351 9.4437 10.0295 8.6812 9.26702C7.9187 8.50452 7.31245 7.64446 6.86245 6.68684C6.41245 5.72909 6.1437 4.71271 6.0562 3.63771C5.0937 4.17521 4.34058 4.91584 3.79683 5.85959C3.25308 6.80334 2.9812 7.82521 2.9812 8.92521C2.9812 10.6127 3.57183 12.0471 4.75308 13.2283C5.93433 14.4096 7.3687 15.0002 9.0562 15.0002Z" fill="#F0EAE8"/>';

function makeSvgIcon(cls: string, pathHtml: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', cls);
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('viewBox', '0 0 18 18');
  svg.setAttribute('fill', 'none');
  svg.innerHTML = pathHtml;
  return svg;
}

function ensureGlassFilter(): void {
  const FILTER_ID = 'hidden-stories-glass-filter';
  if (document.getElementById(FILTER_ID)) return;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('style', 'display:none');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `
    <filter id="${FILTER_ID}" color-interpolation-filters="linearRGB"
            filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
      <feDisplacementMap in="SourceGraphic" in2="SourceGraphic"
        scale="18" xChannelSelector="R" yChannelSelector="B"
        x="0%" y="0%" width="100%" height="100%" result="displaced"/>
      <feGaussianBlur stdDeviation="3 3"
        x="0%" y="0%" width="100%" height="100%"
        in="displaced" edgeMode="none" result="blur"/>
    </filter>`;
  document.body.append(svg);
}

export default async function decorate(block: HTMLElement): Promise<void> {
  ensureGlassFilter();

  const rows = [...block.children];

  // Row 0: video — first <a> href
  const videoSrc = resolveDAMUrl(rows[0]?.querySelector('a')?.href ?? '');

  // Row 1: overlay image
  const picture = rows[1]?.querySelector('picture') ?? null;

  // --- media wrapper ---
  const media = document.createElement('div');
  media.className = 'hidden-stories-media';

  // --- video ---
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  const source = document.createElement('source');
  source.src = videoSrc;
  source.type = 'video/mp4';
  video.append(source);
  video.load();

  // --- interaction blocker ---
  const blocker = document.createElement('div');
  blocker.className = 'hidden-stories-blocker';

  // --- switcher ---
  const switcher = document.createElement('div');
  switcher.className = 'hidden-stories-switcher';
  switcher.setAttribute('role', 'group');
  switcher.setAttribute('aria-label', 'View mode');

  const thumb = document.createElement('div');
  thumb.className = 'hidden-stories-switcher-thumb';
  thumb.append(makeSvgIcon('day', SVG_DAY), makeSvgIcon('night', SVG_NIGHT));

  const labelDay = document.createElement('span');
  labelDay.className = 'hidden-stories-switcher-label day';
  labelDay.textContent = 'Day time';

  const labelNight = document.createElement('span');
  labelNight.className = 'hidden-stories-switcher-label night';
  labelNight.textContent = 'Night time';

  switcher.append(thumb, labelDay, labelNight);

  // --- overlay image ---
  const overlay = document.createElement('div');
  overlay.className = 'hidden-stories-overlay';

  if (picture) {
    const img = picture.querySelector<HTMLImageElement>('img');
    const optimizedPic = img ? createOptimizedPicture(img.src, img.alt, true, [{ width: '2000' }]) : picture;
    if (img) moveInstrumentation(img, optimizedPic.querySelector('img'));
    overlay.append(optimizedPic);
  }

  // --- reverse playback (real-time speed via wall-clock delta) ---
  let rafId: number | null = null;
  let isReversing = false;
  let seekStartedAt = 0;

  function stopReverse() {
    isReversing = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function playReverse(onDone: () => void) {
    stopReverse();
    video.pause();
    isReversing = true;

    function seekBack() {
      if (!isReversing) return;
      seekStartedAt = performance.now();
      video.currentTime = Math.max(0, video.currentTime - 1 / 30);
    }

    function onSeeked() {
      if (!isReversing) {
        video.removeEventListener('seeked', onSeeked);
        return;
      }
      if (video.currentTime <= 0) {
        video.removeEventListener('seeked', onSeeked);
        isReversing = false;
        onDone();
        return;
      }
      // measure how long the seek+decode took and step by that amount next time
      const elapsed = (performance.now() - seekStartedAt) / 1000;
      const nextStep = Math.max(1 / 30, elapsed);
      rafId = requestAnimationFrame(() => {
        if (!isReversing) return;
        seekStartedAt = performance.now();
        video.currentTime = Math.max(0, video.currentTime - nextStep);
      });
    }

    video.addEventListener('seeked', onSeeked);
    seekBack();
  }

  function setSwitcherDisabled(disabled: boolean) {
    if (disabled) {
      switcher.setAttribute('aria-disabled', 'true');
      switcher.style.pointerEvents = 'none';
    thumb.style.opacity = '0.35';
    } else {
      switcher.removeAttribute('aria-disabled');
      switcher.style.pointerEvents = '';
      thumb.style.opacity = '';
    }
  }

  // --- hide placeholder once video is ready ---
  video.addEventListener(
    'canplay',
    () => {
      overlay.classList.add('is-fading');
    },
    { once: true },
  );

  // --- switcher toggle ---
  switcher.addEventListener('click', () => {
    const isNight = switcher.classList.toggle('is-night');
    if (isNight) {
      stopReverse();
      video.currentTime = 0;
      setSwitcherDisabled(true);
      video.play().catch(() => {});
      video.addEventListener('ended', () => setSwitcherDisabled(false), { once: true });
    } else {
      video.pause();
      setSwitcherDisabled(true);
      playReverse(() => setSwitcherDisabled(false));
    }
  });

  media.append(video, blocker, switcher, overlay);
  block.replaceChildren(media);
}

