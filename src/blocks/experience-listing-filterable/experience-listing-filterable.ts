import { createOptimizedPicture } from '@/app/aem';
import { moveInstrumentation } from '@/app/scripts';

type FilterKey = 'category' | 'locationTag';

type ExperienceItem = {
  picture: HTMLPictureElement | null;
  locationTag: string;
  title: string;
  category: string;
  href: string;
};

function parseItem(row: HTMLElement): ExperienceItem {
  const cells = [...row.querySelectorAll<HTMLElement>(':scope > div')];
  const [imageCell, locationCell, titleCell, categoryCell, linkCell] = cells;
  return {
    picture: imageCell?.querySelector('picture') ?? null,
    locationTag: locationCell?.textContent?.trim() ?? '',
    title: titleCell?.textContent?.trim() ?? '',
    category: categoryCell?.textContent?.trim() ?? '',
    href: linkCell?.querySelector('a')?.href ?? '',
  };
}

function buildCard(item: ExperienceItem): HTMLAnchorElement {
  const card = document.createElement('a');
  card.className = 'experience-listing-filterable-card';
  card.href = item.href || '#';
  card.dataset.category = item.category;
  card.dataset.locationTag = item.locationTag;

  if (item.picture) {
    const img = item.picture.querySelector<HTMLImageElement>('img');
    if (img) {
      const optimizedPicture = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
      moveInstrumentation(item.picture, optimizedPicture);
      optimizedPicture.classList.add('experience-listing-filterable-card-image');
      card.append(optimizedPicture);
    }
  }

  const content = document.createElement('div');
  content.className = 'experience-listing-filterable-card-content';

  const tag = document.createElement('p');
  tag.className = 'experience-listing-filterable-card-tag';
  tag.textContent = item.locationTag;

  const title = document.createElement('p');
  title.className = 'experience-listing-filterable-card-title';
  title.textContent = item.title;

  content.append(tag, title);

  const icon = document.createElement('span');
  icon.className = 'experience-listing-filterable-card-icon';
  icon.setAttribute('aria-hidden', 'true');

  card.append(content, icon);
  return card;
}

function buildSidebar(values: string[], cards: HTMLAnchorElement[], filterKey: FilterKey): HTMLUListElement {
  const sidebar = document.createElement('ul');
  sidebar.className = 'experience-listing-filterable-sidebar';

  const applyFilter = (value: string | null): void => {
    cards.forEach((card) => {
      const matches = !value || card.dataset[filterKey] === value;
      card.classList.toggle('is-hidden', !matches);
    });
  };

  values.forEach((value) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = value;

    button.addEventListener('click', () => {
      const alreadyActive = button.classList.contains('is-active');
      sidebar.querySelectorAll('button').forEach((btn) => btn.classList.remove('is-active'));
      if (alreadyActive) {
        applyFilter(null);
      } else {
        button.classList.add('is-active');
        applyFilter(value);
      }
    });

    item.append(button);
    sidebar.append(item);
  });

  return sidebar;
}

export default async function decorate(block: HTMLElement): Promise<void> {
  const rows = [...block.querySelectorAll<HTMLElement>(':scope > div')];
  const items = rows.map(parseItem);
  const cards = items.map(buildCard);

  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];
  const locationTags = [...new Set(items.map((item) => item.locationTag).filter(Boolean))];

  const sidebarWrapper = document.createElement('div');
  sidebarWrapper.className = 'experience-listing-filterable-sidebar-wrapper';

  const showSidebar = (filterKey: FilterKey): void => {
    cards.forEach((card) => card.classList.remove('is-hidden'));
    const values = filterKey === 'category' ? categories : locationTags;
    sidebarWrapper.replaceChildren(buildSidebar(values, cards, filterKey));
  };

  const tabs = document.createElement('div');
  tabs.className = 'experience-listing-filterable-tabs';

  const experienceTab = document.createElement('button');
  experienceTab.type = 'button';
  experienceTab.className = 'is-active';
  experienceTab.textContent = 'Experience';

  const destinationTab = document.createElement('button');
  destinationTab.type = 'button';
  destinationTab.textContent = 'Destination';

  experienceTab.addEventListener('click', () => {
    experienceTab.classList.add('is-active');
    destinationTab.classList.remove('is-active');
    showSidebar('category');
  });

  destinationTab.addEventListener('click', () => {
    destinationTab.classList.add('is-active');
    experienceTab.classList.remove('is-active');
    showSidebar('locationTag');
  });

  tabs.append(experienceTab, destinationTab);
  showSidebar('category');

  const grid = document.createElement('div');
  grid.className = 'experience-listing-filterable-grid';
  grid.append(...cards);

  const revealMore = document.createElement('button');
  revealMore.type = 'button';
  revealMore.className = 'experience-listing-filterable-reveal';
  revealMore.textContent = 'Reveal more';
  revealMore.addEventListener('click', () => {
    block.dataset.state = 'expanded';
  });

  const content = document.createElement('div');
  content.className = 'experience-listing-filterable-content';
  content.append(grid, revealMore);

  const sidebarColumn = document.createElement('div');
  sidebarColumn.className = 'experience-listing-filterable-sidebar-column';
  sidebarColumn.append(tabs, sidebarWrapper);

  const container = document.createElement('div');
  container.className = 'experience-listing-filterable-container';
  container.append(sidebarColumn, content);

  block.dataset.state = 'default';
  block.replaceChildren(container);
}
