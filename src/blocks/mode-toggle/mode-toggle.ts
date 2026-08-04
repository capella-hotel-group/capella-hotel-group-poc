import { moveInstrumentation } from '@/app/scripts';
import { initSoftNav } from './soft-nav';

/**
 * If a Hero Video block lives in the same section, move this block's wrapper inside it once it
 * finishes loading — so the toggle positions relative to hero-video's own 100svh box (via CSS)
 * instead of the shared section, whose height also includes any other stacked content.
 * Runs unawaited (fire-and-forget): loadSections() processes blocks sequentially, and mode-toggle
 * typically appears before hero-video in the section, so awaiting here would deadlock.
 */
function attachToHeroVideo(wrapper: HTMLElement, block: HTMLElement): void {
  const heroVideo = block.closest('.section')?.querySelector<HTMLElement>('.hero-video');
  if (!heroVideo) return;

  const move = (): void => heroVideo.append(wrapper);
  if (heroVideo.dataset.blockStatus === 'loaded') {
    move();
    return;
  }
  const observer = new MutationObserver(() => {
    if (heroVideo.dataset.blockStatus === 'loaded') {
      observer.disconnect();
      move();
    }
  });
  observer.observe(heroVideo, { attributes: true, attributeFilter: ['data-block-status'] });
}

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.children] as HTMLElement[];

  // Model fields → row indices:
  //   rows[0] = destinationLabel, rows[1] = destinationUrl (aem-content → <a>)
  //   rows[2] = experienceLabel,  rows[3] = experienceUrl  (aem-content → <a>)
  const destLabel = rows[0]?.firstElementChild?.textContent?.trim() ?? 'Destinations';
  const destHref = rows[1]?.querySelector('a')?.getAttribute('href') ?? '/en/';
  const expLabel = rows[2]?.firstElementChild?.textContent?.trim() ?? 'Experiences';
  const expHref = rows[3]?.querySelector('a')?.getAttribute('href') ?? '/en/experience/';

  const normalize = (p: string): string => p.replace(/\/?$/, '/');
  const currentPath = normalize(window.location.pathname);
  const isExperience = currentPath === normalize(expHref);

  const inner = document.createElement('div');
  inner.className = 'mode-toggle-inner';
  inner.setAttribute('role', 'group');
  inner.setAttribute('aria-label', 'Site mode');
  // Persisted so soft-nav can recompute active state without re-reading the (detached) source rows.
  inner.dataset.destinationHref = destHref;
  inner.dataset.experienceHref = expHref;

  const destLink = document.createElement('a');
  destLink.href = destHref;
  destLink.className = `mode-toggle-btn mode-toggle-btn--dest${!isExperience ? ' mode-toggle-btn--active' : ''}`;
  destLink.textContent = destLabel;
  if (!isExperience) destLink.setAttribute('aria-current', 'page');
  moveInstrumentation(rows[0], destLink);

  const track = document.createElement('div');
  track.className = 'mode-toggle-track';
  track.setAttribute('aria-hidden', 'true');
  const indicator = document.createElement('div');
  indicator.className = 'mode-toggle-indicator';
  indicator.style.transform = isExperience ? 'translateX(100%)' : 'translateX(0%)';
  track.append(indicator);

  const expLink = document.createElement('a');
  expLink.href = expHref;
  expLink.className = `mode-toggle-btn mode-toggle-btn--exp${isExperience ? ' mode-toggle-btn--active' : ''}`;
  expLink.textContent = expLabel;
  if (isExperience) expLink.setAttribute('aria-current', 'page');
  moveInstrumentation(rows[2], expLink);

  inner.append(destLink, track, expLink);
  block.replaceChildren(inner);

  initSoftNav([destLink, expLink]);

  const wrapper = block.parentElement;
  if (wrapper) attachToHeroVideo(wrapper, block);
}
