/** Shared authoring + runtime types for the Interactive Destination Map block. */

export interface MapConfig {
  heading: string;
  intro: string;
  defaultLayerId: string;
  defaultFocalX: number;
  defaultFocalY: number;
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  a11yInstructions: string;
  analyticsComponentId: string;
}

export interface LayerConfig {
  layerId: string;
  title: string;
  desktopImage: HTMLImageElement | null;
  mobileImage: HTMLImageElement | null;
  parentLayerId: string;
  worldLeft: number;
  worldTop: number;
  worldRight: number;
  worldBottom: number;
  defaultFocalX: number;
  defaultFocalY: number;
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  enterChildZoomThreshold: number;
  exitChildZoomThreshold: number;
  /** Source row, kept for instrumentation transfer during premium enhancement. */
  sourceRow: HTMLElement;
}

export interface HotspotConfig {
  hotspotId: string;
  layerId: string;
  xPercent: number;
  yPercent: number;
  label: string;
  markerStyle: string;
  category: string;
  thumbnail: HTMLImageElement | null;
  title: string;
  description: string;
  detail: string;
  location: string;
  hours: string;
  highlights: string[];
  ctaText: string;
  ctaLink: string;
  targetLayerId: string;
  targetFocalX: number | null;
  targetFocalY: number | null;
  targetZoom: number | null;
  analyticsId: string;
  sourceRow: HTMLElement;
}

export interface MapContent {
  config: MapConfig;
  layers: LayerConfig[];
  hotspots: HotspotConfig[];
}

export interface ValidationIssue {
  code: string;
  message: string;
}

export interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  /** Safe-to-render content: invalid layers/hotspots removed, references dropped. */
  safeContent: MapContent;
}

/** World-space (common coordinate system) point shared by all layers of a map. */
export interface WorldPoint {
  x: number;
  y: number;
}

/** Viewport-space pixel size used by transform calculations. */
export interface ViewportSize {
  width: number;
  height: number;
}

/** A single 2D transform: translation (px) + uniform scale. */
export interface Transform {
  translateX: number;
  translateY: number;
  scale: number;
}

export type LayerChangeTrigger = 'zoom' | 'hotspot' | 'back' | 'reset';

export interface NavigationHistoryEntry {
  layerId: string;
  transform: Transform;
}

export interface MapState {
  activeLayerId: string;
  activeHotspotId: string | null;
  scale: number;
  translateX: number;
  translateY: number;
  focalX: number;
  focalY: number;
  navigationHistory: NavigationHistoryEntry[];
  loadedLayerIds: Set<string>;
  activePointers: Map<number, { x: number; y: number }>;
  isDragging: boolean;
  isTransitioning: boolean;
  dialogTrigger: HTMLElement | null;
}

/** Handoff payload from Standard Mode to the dynamically-imported Premium Mode module. */
export interface EnhanceContext {
  block: HTMLElement;
  content: MapContent;
  viewport: HTMLElement;
  liveRegion: HTMLElement;
}
