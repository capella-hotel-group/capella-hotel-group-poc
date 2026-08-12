// src/blocks/interactive-destination-map/interactive-destination-map-premium.ts
import { moveInstrumentation } from '@/app/scripts';
import {
  createZoomEmitter,
  emitCtaClick,
  emitHotspotSelect,
  emitLayerChange,
  emitMapView,
  emitPopupOpen,
} from './lib/analytics';
import { buildLayerPicture, createHotspotMarkerButton } from './lib/layers';
import { attachPanZoom } from './lib/pan-zoom-controller';
import { createPopupController, type PopupController } from './lib/popup';
import {
  createMapState,
  popHistory,
  pushHistory,
  reset as resetState,
  setActiveHotspot,
  setActiveLayer,
  setDialogTrigger,
  setDragging,
  setTransform,
  setTransitioning,
  type MapStateDefaults,
} from './lib/state';
import {
  clampNumber,
  computeContinuityTransform,
  computeDefaultTransform,
  coverScale,
  getFocalPercentAtViewportPoint,
  localToWorld,
  resizeRecalculate,
  worldToLocal,
  zoomAroundPoint,
} from './lib/transform';
import type {
  EnhanceContext,
  HotspotConfig,
  LayerChangeTrigger,
  LayerConfig,
  Transform,
  ViewportSize,
} from './lib/types';

interface ChangeLayerOptions {
  focalXPercent?: number;
  focalYPercent?: number;
  zoom?: number;
  explicitTransform?: Transform;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const TRANSITION_MS = 600;
/** Drill-in layer changes always enter below this fraction of their target scale, so the entrance always reads as zooming in/up to fit rather than (sometimes) zooming out. */
const FORWARD_ENTRANCE_SCALE_RATIO = 0.8;
/** Fallback zoom-in step applied to the current scale when a hotspot has no authored Target Zoom. */
const DEFAULT_HOTSPOT_ZOOM_FACTOR = 1.6;

function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function decodeImage(img: HTMLImageElement): Promise<void> {
  if (img.complete) return Promise.resolve();
  if (typeof img.decode === 'function') {
    return img
      .decode()
      .catch(() => new Promise((resolve) => img.addEventListener('load', () => resolve(), { once: true })));
  }
  return new Promise((resolve) => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  });
}

function createIconButton(icon: string, label: string, extraClass: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `interactive-destination-map-control ${extraClass}`;
  button.setAttribute('aria-label', label);
  const img = document.createElement('img');
  img.src = `${window.hlx.codeBasePath}/icons/${icon}.svg`;
  img.alt = '';
  img.width = 20;
  img.height = 20;
  img.loading = 'lazy';
  button.append(img);
  return button;
}

export default async function enhance(ctx: EnhanceContext): Promise<void> {
  const { content, viewport, liveRegion } = ctx;
  const { config, layers, hotspots } = content;

  const defaultLayer = layers.find((layer) => layer.layerId === config.defaultLayerId);
  if (!defaultLayer) return;
  const rootLayer: LayerConfig = defaultLayer;

  // Standard Mode's static default-layer picture is superseded by the interactive stage below.
  viewport.replaceChildren();

  const layerById = new Map(layers.map((layer) => [layer.layerId, layer]));
  const hotspotsByLayer = new Map<string, HotspotConfig[]>();
  hotspots.forEach((hotspot) => {
    const list = hotspotsByLayer.get(hotspot.layerId) ?? [];
    list.push(hotspot);
    hotspotsByLayer.set(hotspot.layerId, list);
  });

  // ── Build chrome: stage host, controls, dialog, back button ──────────────────
  const stageHost = document.createElement('div');
  stageHost.className = 'interactive-destination-map-stage-host';
  stageHost.setAttribute('role', 'group');
  stageHost.setAttribute('aria-roledescription', 'Interactive map');
  stageHost.setAttribute('aria-label', config.heading || 'Interactive destination map');
  stageHost.tabIndex = 0;

  const backButton = createIconButton('map-back', 'Back to previous view', 'interactive-destination-map-back');
  backButton.hidden = true;

  const controls = document.createElement('div');
  controls.className = 'interactive-destination-map-controls';
  const zoomInButton = createIconButton('zoom-in', 'Zoom in', 'interactive-destination-map-zoom-in');
  const zoomOutButton = createIconButton('zoom-out', 'Zoom out', 'interactive-destination-map-zoom-out');
  const resetButton = createIconButton('map-reset', 'Reset map', 'interactive-destination-map-reset-btn');
  controls.append(zoomInButton, zoomOutButton, resetButton);

  viewport.append(stageHost, backButton, controls);

  // ── State ──────────────────────────────────────────────────────────────────
  const defaultTransformSeed: MapStateDefaults = {
    layerId: defaultLayer.layerId,
    scale: config.defaultZoom || defaultLayer.defaultZoom,
    translateX: 0,
    translateY: 0,
    focalX: config.defaultFocalX ?? defaultLayer.defaultFocalX,
    focalY: config.defaultFocalY ?? defaultLayer.defaultFocalY,
  };
  const state = createMapState(defaultTransformSeed);
  let preHotspotTransform: Transform | null = null;

  const stages = new Map<string, HTMLElement>();

  const popup: PopupController = createPopupController(
    (trigger) => {
      setDialogTrigger(state, null);
      const savedTransform = preHotspotTransform;
      preHotspotTransform = null;
      if (savedTransform) {
        const stage = stages.get(state.activeLayerId);
        if (stage) {
          stage.style.transitionDuration = `${reducedMotion() ? 0 : TRANSITION_MS}ms`;
          applyTransformToStage(stage, savedTransform);
          setTransform(state, savedTransform);
          updateControls();
        }
      }
      if (trigger) trigger.focus();
    },
    (hotspot) => emitCtaClick(config.analyticsComponentId, state.activeLayerId, hotspot.hotspotId),
  );
  viewport.append(popup.dialog);

  const zoomEmitter = createZoomEmitter(config.analyticsComponentId);

  function getViewportSize(): ViewportSize {
    return { width: stageHost.clientWidth, height: stageHost.clientHeight };
  }

  function getStageContentSize(stage: HTMLElement): ViewportSize {
    return { width: stage.offsetWidth, height: stage.offsetHeight };
  }

  function applyTransformToStage(stage: HTMLElement, transform: Transform): void {
    stage.style.setProperty('--idm-x', `${transform.translateX}px`);
    stage.style.setProperty('--idm-y', `${transform.translateY}px`);
    stage.style.setProperty('--idm-scale', String(transform.scale));
  }

  /**
   * Animates a stage entering view: writes the `from` transform with no transition, waits two
   * animation frames so the browser actually commits/paints it, then writes the `to` transform
   * with the real transition duration - giving the incoming layer a continuous zoom instead of
   * popping to its destination. A single forced reflow isn't reliable here since the stage may be
   * freshly built and this runs after an async image-decode gap.
   */
  function nextFrame(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  }

  async function animateStageEntrance(
    stage: HTMLElement,
    fromTransform: Transform,
    toTransform: Transform,
    durationMs: number,
  ): Promise<void> {
    if (durationMs === 0) {
      applyTransformToStage(stage, toTransform);
      return;
    }
    stage.style.transitionDuration = '0ms';
    applyTransformToStage(stage, fromTransform);
    await nextFrame();
    stage.style.transitionDuration = `${durationMs}ms`;
    applyTransformToStage(stage, toTransform);
  }

  function announce(message: string): void {
    liveRegion.textContent = '';
    liveRegion.getBoundingClientRect(); // force a reflow so repeated identical messages are re-announced
    liveRegion.textContent = message;
  }

  function updateControls(): void {
    const layer = layerById.get(state.activeLayerId);
    const stage = layer ? stages.get(layer.layerId) : undefined;
    const effectiveMinZoom = layer
      ? Math.max(layer.minZoom, stage ? coverScale(getStageContentSize(stage), getViewportSize()) : layer.minZoom)
      : 0;
    zoomInButton.toggleAttribute('disabled', !layer || state.scale >= layer.maxZoom);
    zoomOutButton.toggleAttribute('disabled', !layer || state.scale <= effectiveMinZoom);
    backButton.hidden = state.navigationHistory.length === 0;
  }

  function clearActiveHotspotMarker(): void {
    if (!state.activeHotspotId) return;
    const previous = stageHost.querySelector<HTMLButtonElement>(
      `.interactive-destination-map-marker[data-hotspot-id="${state.activeHotspotId}"]`,
    );
    previous?.classList.remove('interactive-destination-map-marker--active');
    previous?.setAttribute('aria-pressed', 'false');
  }

  function buildStage(layer: LayerConfig): HTMLElement {
    const existing = stages.get(layer.layerId);
    if (existing) return existing;

    const stage = document.createElement('div');
    stage.className = 'interactive-destination-map-stage-layer';
    stage.dataset.layerId = layer.layerId;
    stage.setAttribute('aria-hidden', 'true');

    const picture = buildLayerPicture(layer, layer.layerId === rootLayer.layerId);
    stage.append(picture);
    if (layer.layerId === rootLayer.layerId) moveInstrumentation(layer.sourceRow, picture);

    const markerLayer = document.createElement('div');
    markerLayer.className = 'interactive-destination-map-markers';
    (hotspotsByLayer.get(layer.layerId) ?? []).forEach((hotspot) => {
      const button = createHotspotMarkerButton(hotspot);
      button.setAttribute('aria-pressed', hotspot.hotspotId === state.activeHotspotId ? 'true' : 'false');
      if (hotspot.hotspotId === state.activeHotspotId)
        button.classList.add('interactive-destination-map-marker--active');
      button.addEventListener('click', (event) => {
        const interactionType = event.detail === 0 ? 'keyboard' : 'pointer';
        void selectHotspot(hotspot, button, interactionType);
      });
      markerLayer.append(button);
    });
    stage.append(markerLayer);

    stageHost.append(stage);
    stages.set(layer.layerId, stage);
    state.loadedLayerIds.add(layer.layerId);
    return stage;
  }

  // ── Layer transitions ────────────────────────────────────────────────────────
  async function changeLayer(
    targetLayerId: string,
    trigger: LayerChangeTrigger,
    options: ChangeLayerOptions = {},
  ): Promise<void> {
    const targetLayer = layerById.get(targetLayerId);
    if (!targetLayer || state.isTransitioning || targetLayerId === state.activeLayerId) return;

    const fromLayerId = state.activeLayerId;
    const currentStage = stages.get(fromLayerId);

    if (trigger !== 'back' && trigger !== 'reset') {
      pushHistory(state, {
        layerId: fromLayerId,
        transform: { translateX: state.translateX, translateY: state.translateY, scale: state.scale },
      });
    }

    setTransitioning(state, true);
    const targetStage = buildStage(targetLayer);
    const targetImg = targetStage.querySelector('img');
    if (targetImg) await decodeImage(targetImg);

    const viewportSize = getViewportSize();
    const targetContentSize = getStageContentSize(targetStage);

    let targetTransform: Transform;
    if (options.explicitTransform) {
      targetTransform = options.explicitTransform;
    } else if (options.focalXPercent != null && options.focalYPercent != null) {
      targetTransform = computeDefaultTransform(
        targetContentSize,
        viewportSize,
        options.focalXPercent,
        options.focalYPercent,
        options.zoom ?? targetLayer.defaultZoom,
      );
    } else if (currentStage) {
      const currentLayer = layerById.get(fromLayerId);
      const currentContentSize = getStageContentSize(currentStage);
      const centerFocal = getFocalPercentAtViewportPoint(
        { translateX: state.translateX, translateY: state.translateY, scale: state.scale },
        currentContentSize,
        { x: viewportSize.width / 2, y: viewportSize.height / 2 },
      );
      const worldPoint = currentLayer
        ? localToWorld(currentLayer, centerFocal.xPercent, centerFocal.yPercent)
        : { x: 0, y: 0 };
      const destinationFocal = worldToLocal(targetLayer, worldPoint);
      targetTransform = computeDefaultTransform(
        targetContentSize,
        viewportSize,
        destinationFocal.xPercent,
        destinationFocal.yPercent,
        options.zoom ?? targetLayer.defaultZoom,
      );
    } else {
      targetTransform = computeDefaultTransform(
        targetContentSize,
        viewportSize,
        targetLayer.defaultFocalX,
        targetLayer.defaultFocalY,
        targetLayer.defaultZoom,
      );
    }

    // Match the incoming layer's starting position to the outgoing view so the crossfade reads as
    // one continuous zoom rather than a pop, instead of jumping straight to targetTransform. For
    // drill-in navigation, cap the entrance scale below the target so it always zooms in to fit.
    let entranceTransform = targetTransform;
    const currentLayer = layerById.get(fromLayerId);
    if (currentStage && currentLayer) {
      const isDrillIn = trigger === 'hotspot' || trigger === 'zoom';
      entranceTransform = computeContinuityTransform(
        currentLayer,
        getStageContentSize(currentStage),
        { translateX: state.translateX, translateY: state.translateY, scale: state.scale },
        targetLayer,
        targetContentSize,
        viewportSize,
        isDrillIn ? targetTransform.scale * FORWARD_ENTRANCE_SCALE_RATIO : undefined,
      );
    }

    const durationMs = reducedMotion() ? 0 : TRANSITION_MS;
    if (currentStage) currentStage.style.transitionDuration = `${durationMs}ms`;
    await animateStageEntrance(targetStage, entranceTransform, targetTransform, durationMs);

    targetStage.classList.add('interactive-destination-map-stage-layer--active');
    targetStage.setAttribute('aria-hidden', 'false');
    if (currentStage && currentStage !== targetStage) {
      currentStage.classList.remove('interactive-destination-map-stage-layer--active');
      currentStage.setAttribute('aria-hidden', 'true');
    }

    if (durationMs > 0) await wait(durationMs);

    clearActiveHotspotMarker();
    setActiveLayer(state, targetLayerId, targetTransform, targetLayer.defaultFocalX, targetLayer.defaultFocalY);
    setActiveHotspot(state, null);
    setTransitioning(state, false);

    updateControls();
    announce(`Now viewing ${targetLayer.title}`);
    emitLayerChange(config.analyticsComponentId, fromLayerId, targetLayerId, trigger);
  }

  // ── Same-layer zoom-in on select (Target Zoom set, no Target Layer) ──────────
  function focusHotspot(hotspot: HotspotConfig): void {
    const layer = layerById.get(hotspot.layerId);
    const stage = stages.get(hotspot.layerId);
    if (!layer || !stage) return;

    // Save current transform so the close callback can restore it
    if (!preHotspotTransform) {
      preHotspotTransform = { translateX: state.translateX, translateY: state.translateY, scale: state.scale };
    }

    const viewportSize = getViewportSize();
    const contentSize = getStageContentSize(stage);
    const focalXPercent = hotspot.targetFocalX ?? hotspot.xPercent;
    const focalYPercent = hotspot.targetFocalY ?? hotspot.yPercent;
    const zoom = clampNumber(
      hotspot.targetZoom ?? state.scale * DEFAULT_HOTSPOT_ZOOM_FACTOR,
      layer.minZoom,
      layer.maxZoom,
    );
    const target = computeDefaultTransform(contentSize, viewportSize, focalXPercent, focalYPercent, zoom);

    stage.style.transitionDuration = `${reducedMotion() ? 0 : TRANSITION_MS}ms`;
    applyTransformToStage(stage, target);
    setTransform(state, target);
    updateControls();
    zoomEmitter(hotspot.layerId, target.scale);
    checkZoomThresholds();
  }

  // ── Hotspot selection & popup ────────────────────────────────────────────────
  let selectSeq = 0;

  async function selectHotspot(
    hotspot: HotspotConfig,
    trigger: HTMLButtonElement,
    interactionType: 'pointer' | 'keyboard',
  ): Promise<void> {
    const seq = ++selectSeq;
    clearActiveHotspotMarker();
    setActiveHotspot(state, hotspot.hotspotId);
    trigger.classList.add('interactive-destination-map-marker--active');
    trigger.setAttribute('aria-pressed', 'true');
    emitHotspotSelect(
      config.analyticsComponentId,
      state.activeLayerId,
      hotspot.hotspotId,
      hotspot.category,
      interactionType,
    );

    if (hotspot.targetLayerId) {
      popup.close(); // an already-open popup must not linger over the newly entered layer
      await changeLayer(hotspot.targetLayerId, 'hotspot', {
        focalXPercent: hotspot.targetFocalX ?? undefined,
        focalYPercent: hotspot.targetFocalY ?? undefined,
        zoom: hotspot.targetZoom ?? undefined,
      });
      return;
    }

    focusHotspot(hotspot);
    setDialogTrigger(state, trigger);
    await wait(reducedMotion() ? 0 : TRANSITION_MS);
    if (seq !== selectSeq) return;
    popup.open(hotspot, trigger);
    emitPopupOpen(config.analyticsComponentId, state.activeLayerId, hotspot.hotspotId);
  }

  // ── Zoom threshold checks (auto parent/child transitions while zooming) ─────
  function checkZoomThresholds(): void {
    const layer = layerById.get(state.activeLayerId);
    if (!layer || state.isTransitioning) return;

    if (state.scale >= layer.enterChildZoomThreshold) {
      const stage = stages.get(layer.layerId);
      const contentSize = stage ? getStageContentSize(stage) : null;
      const focal = contentSize
        ? getFocalPercentAtViewportPoint(
            { translateX: state.translateX, translateY: state.translateY, scale: state.scale },
            contentSize,
            { x: getViewportSize().width / 2, y: getViewportSize().height / 2 },
          )
        : { xPercent: 50, yPercent: 50 };
      const worldPoint = localToWorld(layer, focal.xPercent, focal.yPercent);
      const child = layers.find((candidate) => {
        if (candidate.parentLayerId !== layer.layerId) return false;
        const local = worldToLocal(candidate, worldPoint);
        return local.xPercent > 0 && local.xPercent < 100 && local.yPercent > 0 && local.yPercent < 100;
      });
      if (child) {
        void changeLayer(child.layerId, 'zoom');
        return;
      }
    }

    if (
      layer.parentLayerId &&
      Number.isFinite(layer.exitChildZoomThreshold) &&
      state.scale <= layer.exitChildZoomThreshold
    ) {
      void changeLayer(layer.parentLayerId, 'zoom');
    }
  }

  // ── Pan/zoom wiring ──────────────────────────────────────────────────────────
  attachPanZoom(stageHost, {
    getTransform: () => ({ translateX: state.translateX, translateY: state.translateY, scale: state.scale }),
    getContentSize: () => {
      const stage = stages.get(state.activeLayerId);
      return stage ? getStageContentSize(stage) : { width: 0, height: 0 };
    },
    getViewportSize,
    getZoomRange: () => {
      const layer = layerById.get(state.activeLayerId);
      return { min: layer?.minZoom ?? config.minZoom, max: layer?.maxZoom ?? config.maxZoom };
    },
    onTransform: (transform) => {
      const stage = stages.get(state.activeLayerId);
      if (!stage) return;
      stage.style.transitionDuration = '0ms';
      applyTransformToStage(stage, transform);
      setTransform(state, transform);
      updateControls();
      zoomEmitter(state.activeLayerId, transform.scale);
      checkZoomThresholds();
    },
    onPanStart: () => {
      setDragging(state, true);
      stageHost.classList.add('interactive-destination-map-stage-host--dragging');
    },
    onPanEnd: () => {
      setDragging(state, false);
      stageHost.classList.remove('interactive-destination-map-stage-host--dragging');
    },
  });

  // ── Buttons ──────────────────────────────────────────────────────────────────
  function buttonZoom(factor: number): void {
    const stage = stages.get(state.activeLayerId);
    const layer = layerById.get(state.activeLayerId);
    if (!stage || !layer) return;
    const viewportSize = getViewportSize();
    const contentSize = getStageContentSize(stage);
    const current: Transform = { translateX: state.translateX, translateY: state.translateY, scale: state.scale };
    const target = { x: viewportSize.width / 2, y: viewportSize.height / 2 };
    const next = zoomAroundPoint(
      current,
      target,
      current.scale * factor,
      layer.minZoom,
      layer.maxZoom,
      contentSize,
      viewportSize,
    );
    stage.style.transitionDuration = `${reducedMotion() ? 0 : 200}ms`;
    applyTransformToStage(stage, next);
    setTransform(state, next);
    updateControls();
    zoomEmitter(state.activeLayerId, next.scale);
    checkZoomThresholds();
  }

  zoomInButton.addEventListener('click', () => buttonZoom(1.4));
  zoomOutButton.addEventListener('click', () => buttonZoom(1 / 1.4));
  resetButton.addEventListener('click', () => void performReset());
  backButton.addEventListener('click', () => {
    const entry = popHistory(state);
    if (entry) void changeLayer(entry.layerId, 'back', { explicitTransform: entry.transform });
  });

  async function performReset(): Promise<void> {
    preHotspotTransform = null;
    popup.close();
    clearActiveHotspotMarker();
    const fromLayerId = state.activeLayerId;
    const currentStage = stages.get(fromLayerId);
    const currentLayer = layerById.get(fromLayerId);

    const targetStage = buildStage(rootLayer);
    const targetImg = targetStage.querySelector('img');
    if (targetImg) await decodeImage(targetImg);
    const targetContentSize = getStageContentSize(targetStage);

    const transform = computeDefaultTransform(
      targetContentSize,
      getViewportSize(),
      defaultTransformSeed.focalX,
      defaultTransformSeed.focalY,
      defaultTransformSeed.scale,
    );

    const durationMs = reducedMotion() ? 0 : TRANSITION_MS;
    const isAlreadyRoot = currentStage === targetStage;
    if (isAlreadyRoot) {
      // Already the live element with a real previous transform - no continuity hack needed.
      targetStage.style.transitionDuration = `${durationMs}ms`;
      applyTransformToStage(targetStage, transform);
    } else {
      const entranceTransform =
        currentStage && currentLayer
          ? computeContinuityTransform(
              currentLayer,
              getStageContentSize(currentStage),
              { translateX: state.translateX, translateY: state.translateY, scale: state.scale },
              rootLayer,
              targetContentSize,
              getViewportSize(),
            )
          : transform;
      await animateStageEntrance(targetStage, entranceTransform, transform, durationMs);
    }
    targetStage.classList.add('interactive-destination-map-stage-layer--active');
    targetStage.setAttribute('aria-hidden', 'false');

    stages.forEach((stage, layerId) => {
      if (layerId === rootLayer.layerId) return;
      stage.style.transitionDuration = `${durationMs}ms`;
      stage.classList.remove('interactive-destination-map-stage-layer--active');
      stage.setAttribute('aria-hidden', 'true');
    });

    if (durationMs > 0) await wait(durationMs);

    resetState(state, defaultTransformSeed);
    setTransform(state, transform);
    updateControls();
    announce('Map reset to the default view.');
    emitLayerChange(config.analyticsComponentId, fromLayerId, rootLayer.layerId, 'reset');
  }

  // ── Resize handling ──────────────────────────────────────────────────────────
  let previousViewportSize = getViewportSize();
  const resizeObserver = new ResizeObserver(() => {
    const nextViewportSize = getViewportSize();
    const stage = stages.get(state.activeLayerId);
    if (
      stage &&
      (nextViewportSize.width !== previousViewportSize.width || nextViewportSize.height !== previousViewportSize.height)
    ) {
      const contentSize = getStageContentSize(stage);
      const focal = getFocalPercentAtViewportPoint(
        { translateX: state.translateX, translateY: state.translateY, scale: state.scale },
        contentSize,
        { x: previousViewportSize.width / 2, y: previousViewportSize.height / 2 },
      );
      const transform = resizeRecalculate(contentSize, nextViewportSize, focal.xPercent, focal.yPercent, state.scale);
      applyTransformToStage(stage, transform);
      setTransform(state, transform);
    }
    previousViewportSize = nextViewportSize;
  });
  resizeObserver.observe(stageHost);

  const disconnectObserver = new MutationObserver(() => {
    if (!document.contains(ctx.block)) {
      resizeObserver.disconnect();
      disconnectObserver.disconnect();
    }
  });
  disconnectObserver.observe(document.body, { childList: true, subtree: true });

  // ── Initial render ───────────────────────────────────────────────────────────
  const initialStage = buildStage(defaultLayer);
  const initialTransform = computeDefaultTransform(
    getStageContentSize(initialStage),
    getViewportSize(),
    defaultTransformSeed.focalX,
    defaultTransformSeed.focalY,
    defaultTransformSeed.scale,
  );
  applyTransformToStage(initialStage, initialTransform);
  initialStage.classList.add('interactive-destination-map-stage-layer--active');
  initialStage.setAttribute('aria-hidden', 'false');
  setTransform(state, initialTransform);
  updateControls();
  emitMapView(config.analyticsComponentId, defaultLayer.layerId);

  ctx.block.querySelector('.interactive-destination-map-list')?.setAttribute('hidden', '');
}
