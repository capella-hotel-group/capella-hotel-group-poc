import type { HotspotConfig, LayerConfig, MapContent, ValidationIssue, ValidationResult } from './types';

function warn(list: ValidationIssue[], code: string, message: string): void {
  list.push({ code, message });
  if (typeof console !== 'undefined') {
    console.warn(`[interactive-destination-map] ${code}: ${message}`);
  }
}

function hasCircularParent(layers: LayerConfig[]): Set<string> {
  const byId = new Map(layers.map((layer) => [layer.layerId, layer]));
  const circular = new Set<string>();

  layers.forEach((layer) => {
    const visited = new Set<string>();
    let current: LayerConfig | undefined = layer;
    while (current?.parentLayerId) {
      if (visited.has(current.layerId)) {
        circular.add(layer.layerId);
        break;
      }
      visited.add(current.layerId);
      current = byId.get(current.parentLayerId);
    }
  });

  return circular;
}

/**
 * Validates parsed map content and returns a safe-to-render copy.
 * Hard errors drop the offending layer/hotspot (or the whole visual map if no
 * layers remain); soft issues are auto-corrected and only warned about.
 */
export function validateMapContent(content: MapContent): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // --- Layers: duplicate IDs, invalid bounds, missing images ---
  const seenLayerIds = new Set<string>();
  let layers = content.layers.filter((layer) => {
    if (!layer.layerId) {
      warn(errors, 'layer-missing-id', `Layer "${layer.title || '(untitled)'}" has no Layer ID and was dropped.`);
      return false;
    }
    if (seenLayerIds.has(layer.layerId)) {
      warn(errors, 'layer-duplicate-id', `Duplicate Layer ID "${layer.layerId}" was dropped.`);
      return false;
    }
    seenLayerIds.add(layer.layerId);

    if (!layer.desktopImage) {
      warn(errors, 'layer-missing-image', `Layer "${layer.layerId}" has no desktop image and was dropped.`);
      return false;
    }

    if (
      !Number.isFinite(layer.worldLeft) ||
      !Number.isFinite(layer.worldTop) ||
      !Number.isFinite(layer.worldRight) ||
      !Number.isFinite(layer.worldBottom) ||
      layer.worldRight <= layer.worldLeft ||
      layer.worldBottom <= layer.worldTop
    ) {
      warn(errors, 'layer-invalid-bounds', `Layer "${layer.layerId}" has invalid world bounds and was dropped.`);
      return false;
    }

    return true;
  });

  // --- parentLayerId must reference an existing layer ---
  layers = layers.map((layer) => {
    if (layer.parentLayerId && !seenLayerIds.has(layer.parentLayerId)) {
      warn(
        warnings,
        'layer-missing-parent',
        `Layer "${layer.layerId}" references unknown parent "${layer.parentLayerId}"; treated as root-level.`,
      );
      return { ...layer, parentLayerId: '' };
    }
    return layer;
  });

  // --- circular parent chains ---
  const circular = hasCircularParent(layers);
  if (circular.size > 0) {
    layers = layers.map((layer) =>
      circular.has(layer.layerId)
        ? (warn(
            errors,
            'layer-circular-hierarchy',
            `Layer "${layer.layerId}" is part of a circular parent chain; parent reference removed.`,
          ),
          { ...layer, parentLayerId: '' })
        : layer,
    );
  }

  // --- enter/exit threshold hysteresis ---
  layers = layers.map((layer) => {
    const { enterChildZoomThreshold: enter, exitChildZoomThreshold: exit } = layer;
    const hasThresholds = Number.isFinite(enter) && Number.isFinite(exit);
    if (hasThresholds && enter <= exit) {
      warn(
        warnings,
        'layer-invalid-thresholds',
        `Layer "${layer.layerId}" has enterChildZoomThreshold <= exitChildZoomThreshold; child transition disabled.`,
      );
      return {
        ...layer,
        enterChildZoomThreshold: Number.POSITIVE_INFINITY,
        exitChildZoomThreshold: Number.POSITIVE_INFINITY,
      };
    }
    return layer;
  });

  const validLayerIds = new Set(layers.map((layer) => layer.layerId));

  // --- Missing initial (default) layer ---
  let defaultLayerId = content.config.defaultLayerId;
  if (!defaultLayerId || !validLayerIds.has(defaultLayerId)) {
    const fallback = layers.find((layer) => !layer.parentLayerId) ?? layers[0];
    if (fallback) {
      warn(
        errors,
        'map-missing-default-layer',
        `Default Layer ID "${defaultLayerId}" is missing or invalid; falling back to "${fallback.layerId}".`,
      );
      defaultLayerId = fallback.layerId;
    } else {
      warn(errors, 'map-no-layers', 'No valid layers were found; the visual map cannot be rendered.');
      defaultLayerId = '';
    }
  }

  // --- Hotspots: duplicate IDs, invalid coordinates, missing layer reference, labels, CTA ---
  const seenHotspotIds = new Set<string>();
  const hotspots: HotspotConfig[] = [];
  content.hotspots.forEach((hotspot) => {
    if (!hotspot.hotspotId) {
      warn(
        errors,
        'hotspot-missing-id',
        `Hotspot "${hotspot.title || '(untitled)'}" has no Hotspot ID and was dropped.`,
      );
      return;
    }
    if (seenHotspotIds.has(hotspot.hotspotId)) {
      warn(errors, 'hotspot-duplicate-id', `Duplicate Hotspot ID "${hotspot.hotspotId}" was dropped.`);
      return;
    }
    if (!validLayerIds.has(hotspot.layerId)) {
      warn(
        errors,
        'hotspot-missing-layer',
        `Hotspot "${hotspot.hotspotId}" references unknown layer "${hotspot.layerId}" and was dropped.`,
      );
      return;
    }
    if (
      !Number.isFinite(hotspot.xPercent) ||
      !Number.isFinite(hotspot.yPercent) ||
      hotspot.xPercent < 0 ||
      hotspot.xPercent > 100 ||
      hotspot.yPercent < 0 ||
      hotspot.yPercent > 100
    ) {
      warn(
        errors,
        'hotspot-invalid-coordinates',
        `Hotspot "${hotspot.hotspotId}" has invalid X/Y percentages and was dropped.`,
      );
      return;
    }

    seenHotspotIds.add(hotspot.hotspotId);

    let safeHotspot = hotspot;

    if (!safeHotspot.label.trim()) {
      warn(
        warnings,
        'hotspot-inaccessible-label',
        `Hotspot "${safeHotspot.hotspotId}" has no accessible label; falling back to its title.`,
      );
      safeHotspot = { ...safeHotspot, label: safeHotspot.title || safeHotspot.hotspotId };
    }

    if ((safeHotspot.ctaText && !safeHotspot.ctaLink) || (!safeHotspot.ctaText && safeHotspot.ctaLink)) {
      warn(
        warnings,
        'hotspot-invalid-cta',
        `Hotspot "${safeHotspot.hotspotId}" has an incomplete CTA (text/link mismatch); CTA removed.`,
      );
      safeHotspot = { ...safeHotspot, ctaText: '', ctaLink: '' };
    }

    if (safeHotspot.targetLayerId && !validLayerIds.has(safeHotspot.targetLayerId)) {
      warn(
        warnings,
        'hotspot-invalid-target',
        `Hotspot "${safeHotspot.hotspotId}" targets unknown layer "${safeHotspot.targetLayerId}"; drill-down disabled.`,
      );
      safeHotspot = { ...safeHotspot, targetLayerId: '' };
    }

    hotspots.push(safeHotspot);
  });

  // --- Dev-only: warn about overlapping hotspot coordinates on the same layer ---
  const OVERLAP_THRESHOLD_PERCENT = 2;
  hotspots.forEach((a, i) => {
    hotspots.slice(i + 1).forEach((b) => {
      if (a.layerId !== b.layerId) return;
      const dx = a.xPercent - b.xPercent;
      const dy = a.yPercent - b.yPercent;
      if (Math.sqrt(dx * dx + dy * dy) < OVERLAP_THRESHOLD_PERCENT) {
        warn(warnings, 'hotspot-overlap', `Hotspots "${a.hotspotId}" and "${b.hotspotId}" are nearly overlapping.`);
      }
    });
  });

  return {
    errors,
    warnings,
    safeContent: {
      config: { ...content.config, defaultLayerId },
      layers,
      hotspots,
    },
  };
}
