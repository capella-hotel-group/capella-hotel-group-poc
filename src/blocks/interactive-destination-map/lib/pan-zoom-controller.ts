import { panTransform, zoomAroundPoint } from './transform';
import type { Transform, ViewportSize } from './types';

export interface PanZoomHandlers {
  getTransform(): Transform;
  getContentSize(): ViewportSize;
  getViewportSize(): ViewportSize;
  getZoomRange(): { min: number; max: number };
  onTransform(transform: Transform): void;
  onPanStart?(): void;
  onPanEnd?(): void;
}

const DRAG_THRESHOLD_PX = 4;
const KEYBOARD_PAN_STEP = 40;
const KEYBOARD_ZOOM_FACTOR = 1.2;

/** Wires pointer (mouse/touch/pen) pan+pinch, wheel zoom, and keyboard pan+zoom to a viewport element. */
export function attachPanZoom(viewport: HTMLElement, handlers: PanZoomHandlers): () => void {
  const pointers = new Map<number, { x: number; y: number }>();
  let dragIntentEstablished = false;
  let lastPinchDistance = 0;

  function viewportPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = viewport.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function pointerDistance(): number {
    const pts = [...pointers.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  function pointerMidpoint(): { x: number; y: number } {
    const pts = [...pointers.values()];
    return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
  }

  function onPointerDown(event: PointerEvent): void {
    viewport.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, viewportPoint(event.clientX, event.clientY));
    dragIntentEstablished = false;
    if (pointers.size === 2) {
      lastPinchDistance = pointerDistance();
    }
  }

  function onPointerMove(event: PointerEvent): void {
    if (!pointers.has(event.pointerId)) return;
    const previous = pointers.get(event.pointerId)!;
    const current = viewportPoint(event.clientX, event.clientY);
    pointers.set(event.pointerId, current);

    if (pointers.size >= 2) {
      const distance = pointerDistance();
      const midpoint = pointerMidpoint();
      if (lastPinchDistance > 0 && distance > 0) {
        const transform = handlers.getTransform();
        const factor = distance / lastPinchDistance;
        const { min, max } = handlers.getZoomRange();
        const next = zoomAroundPoint(
          transform,
          midpoint,
          transform.scale * factor,
          min,
          max,
          handlers.getContentSize(),
          handlers.getViewportSize(),
        );
        handlers.onTransform(next);
        event.preventDefault();
      }
      lastPinchDistance = distance;
      return;
    }

    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    if (!dragIntentEstablished) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      dragIntentEstablished = true;
      handlers.onPanStart?.();
    }
    event.preventDefault();
    const next = panTransform(handlers.getTransform(), dx, dy, handlers.getContentSize(), handlers.getViewportSize());
    handlers.onTransform(next);
  }

  function onPointerUp(event: PointerEvent): void {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) lastPinchDistance = 0;
    if (pointers.size === 0 && dragIntentEstablished) {
      dragIntentEstablished = false;
      handlers.onPanEnd?.();
    }
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault();
    const transform = handlers.getTransform();
    const point = viewportPoint(event.clientX, event.clientY);
    const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
    const { min, max } = handlers.getZoomRange();
    const next = zoomAroundPoint(
      transform,
      point,
      transform.scale * factor,
      min,
      max,
      handlers.getContentSize(),
      handlers.getViewportSize(),
    );
    handlers.onTransform(next);
  }

  function onKeyDown(event: KeyboardEvent): void {
    const transform = handlers.getTransform();
    const viewportSize = handlers.getViewportSize();
    const contentSize = handlers.getContentSize();
    const { min, max } = handlers.getZoomRange();

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        handlers.onTransform(panTransform(transform, 0, KEYBOARD_PAN_STEP, contentSize, viewportSize));
        break;
      case 'ArrowDown':
        event.preventDefault();
        handlers.onTransform(panTransform(transform, 0, -KEYBOARD_PAN_STEP, contentSize, viewportSize));
        break;
      case 'ArrowLeft':
        event.preventDefault();
        handlers.onTransform(panTransform(transform, KEYBOARD_PAN_STEP, 0, contentSize, viewportSize));
        break;
      case 'ArrowRight':
        event.preventDefault();
        handlers.onTransform(panTransform(transform, -KEYBOARD_PAN_STEP, 0, contentSize, viewportSize));
        break;
      case '+':
      case '=':
        event.preventDefault();
        handlers.onTransform(
          zoomAroundPoint(
            transform,
            { x: viewportSize.width / 2, y: viewportSize.height / 2 },
            transform.scale * KEYBOARD_ZOOM_FACTOR,
            min,
            max,
            contentSize,
            viewportSize,
          ),
        );
        break;
      case '-':
      case '_':
        event.preventDefault();
        handlers.onTransform(
          zoomAroundPoint(
            transform,
            { x: viewportSize.width / 2, y: viewportSize.height / 2 },
            transform.scale / KEYBOARD_ZOOM_FACTOR,
            min,
            max,
            contentSize,
            viewportSize,
          ),
        );
        break;
      default:
        break;
    }
  }

  viewport.addEventListener('pointerdown', onPointerDown);
  viewport.addEventListener('pointermove', onPointerMove);
  viewport.addEventListener('pointerup', onPointerUp);
  viewport.addEventListener('pointercancel', onPointerUp);
  viewport.addEventListener('wheel', onWheel, { passive: false });
  viewport.addEventListener('keydown', onKeyDown);

  return function detach(): void {
    viewport.removeEventListener('pointerdown', onPointerDown);
    viewport.removeEventListener('pointermove', onPointerMove);
    viewport.removeEventListener('pointerup', onPointerUp);
    viewport.removeEventListener('pointercancel', onPointerUp);
    viewport.removeEventListener('wheel', onWheel);
    viewport.removeEventListener('keydown', onKeyDown);
  };
}
