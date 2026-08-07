import type { HotspotConfig, LayerConfig, MapConfig, MapContent } from './types';

function cellText(cell: HTMLElement | undefined): string {
  return cell?.querySelector('p')?.textContent?.trim() ?? cell?.textContent?.trim() ?? '';
}

function cellNumber(cell: HTMLElement | undefined, fallback: number): number {
  const parsed = Number.parseFloat(cellText(cell));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cellImage(cell: HTMLElement | undefined): HTMLImageElement | null {
  return cell?.querySelector<HTMLImageElement>('picture img') ?? null;
}

function cellLink(cell: HTMLElement | undefined): string {
  return cell?.querySelector<HTMLAnchorElement>('a')?.getAttribute('href') ?? '';
}

function cellHighlights(cell: HTMLElement | undefined): string[] {
  if (!cell) return [];
  const items = [...cell.querySelectorAll('li')].map((li) => li.textContent?.trim() ?? '').filter(Boolean);
  if (items.length > 0) return items;
  const text = cellText(cell);
  return text ? [text] : [];
}

function cellHtml(cell: HTMLElement | undefined): string {
  return cell?.innerHTML ?? '';
}

/** Block-level fields each render as their own row, with a single cell holding the value. */
function configCell(row: HTMLElement | undefined): HTMLElement | undefined {
  return row?.children[0] as HTMLElement | undefined;
}

const MAP_CONFIG_FIELD_COUNT = 10;
const LAYER_FIELD_COUNT = 16;
const HOTSPOT_FIELD_COUNT = 21;

function parseMapConfig(rows: HTMLElement[]): MapConfig {
  const [
    heading,
    intro,
    defaultLayerId,
    defaultFocalX,
    defaultFocalY,
    defaultZoom,
    minZoom,
    maxZoom,
    a11y,
    analyticsId,
  ] = rows;
  return {
    heading: cellText(configCell(heading)),
    intro: cellHtml(configCell(intro)),
    defaultLayerId: cellText(configCell(defaultLayerId)),
    defaultFocalX: cellNumber(configCell(defaultFocalX), 50),
    defaultFocalY: cellNumber(configCell(defaultFocalY), 50),
    defaultZoom: cellNumber(configCell(defaultZoom), 1),
    minZoom: cellNumber(configCell(minZoom), 1),
    maxZoom: cellNumber(configCell(maxZoom), 3),
    a11yInstructions: cellHtml(configCell(a11y)),
    analyticsComponentId: cellText(configCell(analyticsId)),
  };
}

function parseLayerRow(row: HTMLElement): LayerConfig {
  const cells = [...row.children] as HTMLElement[];
  return {
    layerId: cellText(cells[0]),
    title: cellText(cells[1]),
    desktopImage: cellImage(cells[2]),
    mobileImage: cellImage(cells[3]),
    parentLayerId: cellText(cells[4]),
    worldLeft: cellNumber(cells[5], 0),
    worldTop: cellNumber(cells[6], 0),
    worldRight: cellNumber(cells[7], 1000),
    worldBottom: cellNumber(cells[8], 1000),
    defaultFocalX: cellNumber(cells[9], 50),
    defaultFocalY: cellNumber(cells[10], 50),
    defaultZoom: cellNumber(cells[11], 1),
    minZoom: cellNumber(cells[12], 1),
    maxZoom: cellNumber(cells[13], 3),
    enterChildZoomThreshold: cellNumber(cells[14], Number.POSITIVE_INFINITY),
    exitChildZoomThreshold: cellNumber(cells[15], Number.POSITIVE_INFINITY),
    sourceRow: row,
  };
}

function parseHotspotRow(row: HTMLElement): HotspotConfig {
  const cells = [...row.children] as HTMLElement[];
  // ctaText (model field 14) and cta/ctaLink (model field 15) are merged into
  // one HTML cell by AEM — both are read from cells[14], shifting subsequent indices.
  const targetFocalX = cells[16] ? cellNumber(cells[16], NaN) : NaN;
  const targetFocalY = cells[17] ? cellNumber(cells[17], NaN) : NaN;
  const targetZoom = cells[18] ? cellNumber(cells[18], NaN) : NaN;
  return {
    hotspotId: cellText(cells[0]),
    layerId: cellText(cells[1]),
    xPercent: cellNumber(cells[2], NaN),
    yPercent: cellNumber(cells[3], NaN),
    label: cellText(cells[4]),
    markerStyle: cellText(cells[5]) || 'default',
    category: cellText(cells[6]),
    thumbnail: cellImage(cells[7]),
    title: cellText(cells[8]),
    description: cellText(cells[9]),
    detail: cells[10]?.innerHTML ?? '',
    location: cellText(cells[11]),
    hours: cellText(cells[12]),
    highlights: cellHighlights(cells[13]),
    ctaText: cellText(cells[14]),
    ctaLink: cellLink(cells[14]),
    targetLayerId: cellText(cells[15]),
    targetFocalX: Number.isFinite(targetFocalX) ? targetFocalX : null,
    targetFocalY: Number.isFinite(targetFocalY) ? targetFocalY : null,
    targetZoom: Number.isFinite(targetZoom) ? targetZoom : null,
    sourceRow: row,
  };
}

/** Distinguishes item row type: exact in Universal Editor, cell-count fallback for production docs. */
function isHotspotRow(row: HTMLElement): boolean {
  if (row.dataset.aueModel === 'map-hotspot') return true;
  if (row.dataset.aueModel === 'map-layer') return false;
  return row.children.length >= HOTSPOT_FIELD_COUNT - 4;
}

/**
 * Reads the raw block DOM into typed config + layer + hotspot content.
 * Model fields → column indices are documented above each parse*Row function.
 */
export function parseMapContent(block: HTMLElement): MapContent {
  const rows = [...block.children] as HTMLElement[];
  const configRows = rows.slice(0, MAP_CONFIG_FIELD_COUNT);
  const itemRows = rows.slice(MAP_CONFIG_FIELD_COUNT);

  const config = parseMapConfig(configRows);
  const layers: LayerConfig[] = [];
  const hotspots: HotspotConfig[] = [];

  itemRows.forEach((row) => {
    if (isHotspotRow(row)) {
      hotspots.push(parseHotspotRow(row));
    } else {
      layers.push(parseLayerRow(row));
    }
  });

  return { config, layers, hotspots };
}

export { LAYER_FIELD_COUNT, HOTSPOT_FIELD_COUNT };
