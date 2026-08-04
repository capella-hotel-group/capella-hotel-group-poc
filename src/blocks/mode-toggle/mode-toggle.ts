import { moveInstrumentation } from '@/app/scripts';

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

  const destBtn = document.createElement('button');
  destBtn.type = 'button';
  destBtn.className = `mode-toggle-btn${!isExperience ? ' mode-toggle-btn--active' : ''}`;
  destBtn.textContent = destLabel;
  destBtn.setAttribute('aria-pressed', String(!isExperience));
  moveInstrumentation(rows[0], destBtn);

  const track = document.createElement('div');
  track.className = 'mode-toggle-track';
  track.setAttribute('aria-hidden', 'true');
  const indicator = document.createElement('div');
  indicator.className = 'mode-toggle-indicator';
  indicator.style.transform = isExperience ? 'translateX(100%)' : 'translateX(0%)';
  track.append(indicator);

  const expBtn = document.createElement('button');
  expBtn.type = 'button';
  expBtn.className = `mode-toggle-btn${isExperience ? ' mode-toggle-btn--active' : ''}`;
  expBtn.textContent = expLabel;
  expBtn.setAttribute('aria-pressed', String(isExperience));
  moveInstrumentation(rows[2], expBtn);

  destBtn.addEventListener('click', () => {
    if (isExperience) window.location.href = destHref;
  });
  expBtn.addEventListener('click', () => {
    if (!isExperience) window.location.href = expHref;
  });
  track.addEventListener('click', () => {
    window.location.href = isExperience ? destHref : expHref;
  });

  inner.append(destBtn, track, expBtn);
  block.replaceChildren(inner);
}
