// src/blocks/interactive-destination-map/lib/analytics.ts
import type { LayerChangeTrigger } from './types';

function emit(eventName: string, detail: Record<string, unknown>): void {
  try {
    document.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
  } catch {
    // Analytics must never break the component.
  }
}

export function emitMapView(componentId: string, layerId: string): void {
  emit('interactive_map_view', { event: 'interactive_map_view', componentId, layerId });
}

export function emitLayerChange(
  componentId: string,
  fromLayerId: string,
  toLayerId: string,
  trigger: LayerChangeTrigger,
): void {
  emit('map_layer_change', { event: 'map_layer_change', componentId, fromLayerId, toLayerId, trigger });
}

export function emitHotspotSelect(
  componentId: string,
  layerId: string,
  hotspotId: string,
  hotspotCategory: string,
  interactionType: string,
): void {
  emit('map_hotspot_select', {
    event: 'map_hotspot_select',
    componentId,
    layerId,
    hotspotId,
    hotspotCategory,
    interactionType,
  });
}

export function emitPopupOpen(componentId: string, layerId: string, hotspotId: string): void {
  emit('map_popup_open', { event: 'map_popup_open', componentId, layerId, hotspotId });
}

export function emitCtaClick(componentId: string, layerId: string, hotspotId: string): void {
  emit('map_cta_click', { event: 'map_cta_click', componentId, layerId, hotspotId });
}

/** Debounces map_zoom so it fires once after zoom interaction settles, not per frame/pointer-move. */
export function createZoomEmitter(componentId: string, delayMs = 400): (layerId: string, scale: number) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (layerId: string, scale: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      emit('map_zoom', { event: 'map_zoom', componentId, layerId, scale: Math.round(scale * 100) / 100 });
    }, delayMs);
  };
}
