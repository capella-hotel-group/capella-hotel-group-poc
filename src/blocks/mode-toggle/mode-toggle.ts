import { moveInstrumentation } from '@/app/scripts';
import { initSoftNav } from './soft-nav';

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
}
