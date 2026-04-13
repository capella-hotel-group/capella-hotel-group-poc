import { moveInstrumentation } from '@/app/scripts';
import { createOptimizedPicture } from '@/app/aem';
import { resolveDAMUrl } from '@/utils/env';

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children];

  // Row 0: video — first <a> href
  const videoSrc = resolveDAMUrl(rows[0]?.querySelector('a')?.href ?? '');

  // Row 1: overlay image — reuse the existing <picture> element
  const picture = rows[1]?.querySelector('picture') ?? null;

  const media = document.createElement('div');
  media.className = 'hidden-stories-media';

  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;

  const source = document.createElement('source');
  source.src = videoSrc;
  source.type = 'video/mp4';
  video.append(source);
  media.append(video);

  if (picture) {
    const img = picture.querySelector<HTMLImageElement>('img');
    const optimizedPic = img
      ? createOptimizedPicture(img.src, img.alt, true, [{ width: '2000' }])
      : picture;

    if (img) moveInstrumentation(img, optimizedPic.querySelector('img'));

    const overlay = document.createElement('div');
    overlay.className = 'hidden-stories-overlay';
    overlay.append(optimizedPic);
    media.append(overlay);

    video.addEventListener(
      'canplay',
      () => {
        overlay.classList.add('is-fading');
      },
      { once: true },
    );
  }

  block.replaceChildren(media);
}
