import { createOptimizedPicture } from '@/app/aem';
import type { HotspotConfig, LayerConfig } from './types';

/**
 * Builds a single <picture> with independent mobile/desktop artwork (art-directed via <source media>,
 * mobile sources placed first so they win under `(width < 900px)`), reusing createOptimizedPicture for
 * webp + fallback rendition generation on each branch.
 */
export function buildLayerPicture(layer: LayerConfig, eager: boolean): HTMLPictureElement {
  const desktopSrc = layer.desktopImage?.src ?? '';
  const desktopAlt = layer.desktopImage?.alt || layer.title;
  const picture = createOptimizedPicture(desktopSrc, desktopAlt, eager, [{ width: '1600' }]);

  if (layer.mobileImage?.src) {
    const mobileUrl = new URL(layer.mobileImage.src, window.location.href);
    const { pathname } = mobileUrl;
    const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

    const webpSource = document.createElement('source');
    webpSource.media = '(width < 900px)';
    webpSource.type = 'image/webp';
    webpSource.srcset = `${pathname}?width=750&format=webply&optimize=medium`;

    const fallbackSource = document.createElement('source');
    fallbackSource.media = '(width < 900px)';
    fallbackSource.srcset = `${pathname}?width=750&format=${ext}&optimize=medium`;

    picture.prepend(fallbackSource);
    picture.prepend(webpSource);
  }

  return picture;
}

/**
 * Creates a hotspot marker button positioned via layer-relative percentages. The marker keeps a
 * constant on-screen size regardless of zoom via a CSS counter-scale reading `--idm-scale` from
 * its ancestor — no per-frame JS repositioning is needed for pan/zoom, resize, or layer change.
 */
export function createHotspotMarkerButton(hotspot: HotspotConfig): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `interactive-destination-map-marker interactive-destination-map-marker--${hotspot.markerStyle}`;
  button.style.left = `${hotspot.xPercent}%`;
  button.style.top = `${hotspot.yPercent}%`;
  button.setAttribute('aria-label', hotspot.label);
  button.setAttribute('aria-pressed', 'false');
  button.dataset.hotspotId = hotspot.hotspotId;

  const glyph = document.createElement('span');
  glyph.className = 'interactive-destination-map-marker-glyph';
  glyph.setAttribute('aria-hidden', 'true');
  button.append(glyph);

  return button;
}
