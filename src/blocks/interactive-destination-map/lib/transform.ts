import type { LayerConfig, Transform, ViewportSize, WorldPoint } from './types';

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Converts a hotspot's layer-local percentage coordinate into the common world coordinate space. */
export function localToWorld(layer: LayerConfig, xPercent: number, yPercent: number): WorldPoint {
  return {
    x: layer.worldLeft + (xPercent / 100) * (layer.worldRight - layer.worldLeft),
    y: layer.worldTop + (yPercent / 100) * (layer.worldBottom - layer.worldTop),
  };
}

/** Converts a common world-space point into a destination layer's local percentage coordinate (clamped 0-100). */
export function worldToLocal(layer: LayerConfig, point: WorldPoint): { xPercent: number; yPercent: number } {
  const width = layer.worldRight - layer.worldLeft;
  const height = layer.worldBottom - layer.worldTop;
  return {
    xPercent: clampNumber(width === 0 ? 0 : ((point.x - layer.worldLeft) / width) * 100, 0, 100),
    yPercent: clampNumber(height === 0 ? 0 : ((point.y - layer.worldTop) / height) * 100, 0, 100),
  };
}

/** Reads the layer-local percentage coordinate currently shown at a given viewport pixel point. */
export function getFocalPercentAtViewportPoint(
  transform: Transform,
  content: ViewportSize,
  viewportPoint: { x: number; y: number },
): { xPercent: number; yPercent: number } {
  const localPxX = (viewportPoint.x - transform.translateX) / transform.scale;
  const localPxY = (viewportPoint.y - transform.translateY) / transform.scale;
  return {
    xPercent: clampNumber(content.width === 0 ? 0 : (localPxX / content.width) * 100, 0, 100),
    yPercent: clampNumber(content.height === 0 ? 0 : (localPxY / content.height) * 100, 0, 100),
  };
}

/** Clamps a transform so the scaled content can never be moved fully outside the viewport. */
export function clampTransform(transform: Transform, content: ViewportSize, viewport: ViewportSize): Transform {
  const scaledWidth = content.width * transform.scale;
  const scaledHeight = content.height * transform.scale;

  const translateX =
    scaledWidth <= viewport.width
      ? (viewport.width - scaledWidth) / 2
      : clampNumber(transform.translateX, viewport.width - scaledWidth, 0);

  const translateY =
    scaledHeight <= viewport.height
      ? (viewport.height - scaledHeight) / 2
      : clampNumber(transform.translateY, viewport.height - scaledHeight, 0);

  return { translateX, translateY, scale: transform.scale };
}

/** Computes (and clamps) the transform that centers a given layer-local focal point at a given zoom level. */
export function computeDefaultTransform(
  content: ViewportSize,
  viewport: ViewportSize,
  focalXPercent: number,
  focalYPercent: number,
  zoom: number,
): Transform {
  const focalPxX = (focalXPercent / 100) * content.width;
  const focalPxY = (focalYPercent / 100) * content.height;
  const raw: Transform = {
    translateX: viewport.width / 2 - focalPxX * zoom,
    translateY: viewport.height / 2 - focalPxY * zoom,
    scale: zoom,
  };
  return clampTransform(raw, content, viewport);
}

/** Recalculates a transform after a viewport resize/orientation change, preserving the focal point and scale. */
export function resizeRecalculate(
  content: ViewportSize,
  nextViewport: ViewportSize,
  focalXPercent: number,
  focalYPercent: number,
  scale: number,
): Transform {
  return computeDefaultTransform(content, nextViewport, focalXPercent, focalYPercent, scale);
}

/** Zooms toward an arbitrary viewport pixel point (button center, pointer position, or pinch midpoint). */
export function zoomAroundPoint(
  transform: Transform,
  viewportPoint: { x: number; y: number },
  targetScale: number,
  minZoom: number,
  maxZoom: number,
  content: ViewportSize,
  viewport: ViewportSize,
): Transform {
  const clampedScale = clampNumber(targetScale, minZoom, maxZoom);
  const worldPxX = (viewportPoint.x - transform.translateX) / transform.scale;
  const worldPxY = (viewportPoint.y - transform.translateY) / transform.scale;
  const raw: Transform = {
    translateX: viewportPoint.x - worldPxX * clampedScale,
    translateY: viewportPoint.y - worldPxY * clampedScale,
    scale: clampedScale,
  };
  return clampTransform(raw, content, viewport);
}

/** Pans a transform by a pixel delta, then re-clamps it. */
export function panTransform(
  transform: Transform,
  dx: number,
  dy: number,
  content: ViewportSize,
  viewport: ViewportSize,
): Transform {
  return clampTransform(
    { translateX: transform.translateX + dx, translateY: transform.translateY + dy, scale: transform.scale },
    content,
    viewport,
  );
}
