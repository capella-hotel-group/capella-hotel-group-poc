import { resolveDAMUrl } from '@/utils/env';
import { moveInstrumentation } from '@/app/scripts';

const CROSSFADE_MS = 500;
const LOAD_TIMEOUT_MS = 6000;

interface HeroVideoItem {
  label: string;
  tagline: string;
  videoUrl: string;
  link: string | null;
  sourceRow: HTMLElement;
}

function parseItems(itemRows: HTMLElement[]): HeroVideoItem[] {
  return itemRows
    .map((row): HeroVideoItem | null => {
      const cells = [...row.children] as HTMLElement[];
      // Model fields → cell indices: [0] label, [1] tagline, [2] video, [3] link
      const label = cells[0]?.textContent?.trim() ?? '';
      const tagline = cells[1]?.textContent?.trim() ?? '';
      const videoAnchor = cells[2]?.querySelector<HTMLAnchorElement>('a');
      const rawVideo = (videoAnchor?.href ?? cells[2]?.textContent?.trim() ?? '').trim();
      const looksLikeVideoUrl = /^https?:\/\//i.test(rawVideo) || rawVideo.startsWith('/');
      const videoUrl = looksLikeVideoUrl ? resolveDAMUrl(rawVideo) : '';
      const linkAnchor = cells[3]?.querySelector<HTMLAnchorElement>('a');
      const link = linkAnchor?.href ?? null;

      if (!label || !videoUrl) return null;
      return { label, tagline, videoUrl, link, sourceRow: row };
    })
    .filter((item): item is HeroVideoItem => item !== null);
}

function waitForVideoReady(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, LOAD_TIMEOUT_MS);
    const done = (): void => {
      window.clearTimeout(timer);
      resolve();
    };
    video.addEventListener('loadeddata', done, { once: true });
    video.addEventListener('error', done, { once: true });
  });
}

export default async function decorate(block: HTMLElement): Promise<void> {
  const itemRows = [...block.children] as HTMLElement[];
  const items = parseItems(itemRows);
  if (items.length === 0) return;

  let activeIndex = 0;

  const mediaEl = document.createElement('div');
  mediaEl.className = 'hero-video-media';

  const videoA = document.createElement('video');
  const videoB = document.createElement('video');
  [videoA, videoB].forEach((video) => {
    video.className = 'hero-video-layer';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = 'auto';
    video.style.opacity = '0';
  });
  let activeVideo = videoA;
  let inactiveVideo = videoB;

  const overlayEl = document.createElement('div');
  overlayEl.className = 'hero-video-overlay';

  mediaEl.append(videoA, videoB, overlayEl);

  const selectorEl = document.createElement('div');
  selectorEl.className = 'hero-video-selector';

  const listEl = document.createElement('ul');
  listEl.className = 'hero-video-list';
  listEl.setAttribute('role', 'listbox');
  listEl.setAttribute('aria-label', 'Select a destination');

  let switching = false;

  function renderList(): void {
    listEl.replaceChildren(
      ...items.map((item, index) => {
        const li = document.createElement('li');
        li.className = 'hero-video-item';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(index === activeIndex));
        moveInstrumentation(item.sourceRow, li);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `hero-video-item-btn${index === activeIndex ? ' hero-video-item-btn--active' : ''}`;
        btn.textContent = item.label;

        if (index === activeIndex && item.tagline) {
          const tagline = document.createElement('span');
          tagline.className = 'hero-video-tagline';
          tagline.textContent = `\u00A0\u2014 ${item.tagline}`;
          const arrow = document.createElement('span');
          arrow.className = 'hero-video-arrow';
          arrow.setAttribute('aria-hidden', 'true');
          tagline.append(arrow);
          btn.append(tagline);
        }

        btn.addEventListener('click', () => {
          if (index === activeIndex) {
            if (item.link) window.location.href = item.link;
            return;
          }
          switchTo(index);
        });
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            switchTo(Math.min(items.length - 1, index + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            switchTo(Math.max(0, index - 1));
          }
        });

        li.append(btn);
        return li;
      }),
    );
  }

  async function switchTo(index: number): Promise<void> {
    if (switching || index === activeIndex) return;
    switching = true;
    activeIndex = index;
    const item = items[index];

    inactiveVideo.src = item.videoUrl;
    inactiveVideo.load();
    try {
      await Promise.race([
        waitForVideoReady(inactiveVideo),
        new Promise((resolve) => {
          window.setTimeout(resolve, LOAD_TIMEOUT_MS);
        }),
      ]);
      await inactiveVideo.play().catch(() => {});
    } catch {
      // fall through — crossfade proceeds even if playback failed
    }

    inactiveVideo.style.transition = `opacity ${CROSSFADE_MS}ms ease`;
    activeVideo.style.transition = `opacity ${CROSSFADE_MS}ms ease`;
    inactiveVideo.style.opacity = '1';
    activeVideo.style.opacity = '0';

    [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];
    renderList();

    window.setTimeout(() => {
      switching = false;
    }, CROSSFADE_MS);
  }

  renderList();
  selectorEl.append(listEl);

  block.replaceChildren(mediaEl, selectorEl);

  // Start the first video.
  const first = items[0];
  activeVideo.src = first.videoUrl;
  activeVideo.load();
  await waitForVideoReady(activeVideo);
  activeVideo.style.transition = `opacity ${CROSSFADE_MS}ms ease`;
  activeVideo.style.opacity = '1';
  await activeVideo.play().catch(() => {});
}
