import { resolveDAMUrl } from "@/utils/env";

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children] as HTMLElement[];
  const videoSrc = rows[0]?.querySelector<HTMLAnchorElement>('a')?.href ?? '';
  const poster = rows[1]?.querySelector<HTMLImageElement>('img')?.src ?? '';

  if (!videoSrc) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'video-wrapper';

  const video = document.createElement('video');
  video.className = 'video-player';
  video.controls = true;
  video.playsInline = true;
  if (poster) video.poster = poster;

  const source = document.createElement('source');
  source.src = resolveDAMUrl(videoSrc);
  video.append(source);
  wrapper.append(video);

  block.replaceChildren(wrapper);
}
