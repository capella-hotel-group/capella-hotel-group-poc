// Centralised, mutation-through-named-functions state model (no framework).
import type { MapState, NavigationHistoryEntry, Transform } from './types';

export interface MapStateDefaults {
  layerId: string;
  scale: number;
  translateX: number;
  translateY: number;
  focalX: number;
  focalY: number;
}

export function createMapState(defaults: MapStateDefaults): MapState {
  return {
    activeLayerId: defaults.layerId,
    activeHotspotId: null,
    scale: defaults.scale,
    translateX: defaults.translateX,
    translateY: defaults.translateY,
    focalX: defaults.focalX,
    focalY: defaults.focalY,
    navigationHistory: [],
    loadedLayerIds: new Set([defaults.layerId]),
    activePointers: new Map(),
    isDragging: false,
    isTransitioning: false,
    dialogTrigger: null,
  };
}

export function setTransform(state: MapState, transform: Transform): void {
  state.scale = transform.scale;
  state.translateX = transform.translateX;
  state.translateY = transform.translateY;
}

export function setActiveLayer(
  state: MapState,
  layerId: string,
  transform: Transform,
  focalX: number,
  focalY: number,
): void {
  state.activeLayerId = layerId;
  state.focalX = focalX;
  state.focalY = focalY;
  setTransform(state, transform);
  state.loadedLayerIds.add(layerId);
}

export function setActiveHotspot(state: MapState, hotspotId: string | null): void {
  state.activeHotspotId = hotspotId;
}

export function pushHistory(state: MapState, entry: NavigationHistoryEntry): void {
  state.navigationHistory.push(entry);
}

export function popHistory(state: MapState): NavigationHistoryEntry | undefined {
  return state.navigationHistory.pop();
}

export function clearHistory(state: MapState): void {
  state.navigationHistory = [];
}

export function setDialogTrigger(state: MapState, trigger: HTMLElement | null): void {
  state.dialogTrigger = trigger;
}

export function setDragging(state: MapState, isDragging: boolean): void {
  state.isDragging = isDragging;
}

export function setTransitioning(state: MapState, isTransitioning: boolean): void {
  state.isTransitioning = isTransitioning;
}

/** Restores the full configured initial state (layer, focal point, zoom, history, dialog, active hotspot). */
export function reset(state: MapState, defaults: MapStateDefaults): void {
  state.activeLayerId = defaults.layerId;
  state.activeHotspotId = null;
  state.scale = defaults.scale;
  state.translateX = defaults.translateX;
  state.translateY = defaults.translateY;
  state.focalX = defaults.focalX;
  state.focalY = defaults.focalY;
  state.navigationHistory = [];
  state.isDragging = false;
  state.isTransitioning = false;
  state.dialogTrigger = null;
}
