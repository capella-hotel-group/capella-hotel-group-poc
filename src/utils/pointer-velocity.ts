export interface PointerVelocityOptions {
  /** Exponential decay rate per frame (0–1); higher = faster fade. Default: 0.032 */
  decayRate?: number;
  /** Snap smoothDelta to zero below this magnitude. Default: 0.0001 */
  decayThreshold?: number;
}

/**
 * Tracks pointer movement on a target element and exposes a continuously-decaying
 * smoothed velocity vector. Call `update()` once per animation frame and read
 * `smoothDelta` for the current decayed velocity.
 */
export class PointerVelocityTracker {
  private readonly decayRate: number;
  private readonly decayThreshold: number;

  private pendingDeltaX = 0;
  private pendingDeltaY = 0;
  private lastNdcX = 0;
  private lastNdcY = 0;

  /** Smoothed velocity (NDC / frame). Read this after calling `update()`. */
  readonly smoothDelta = { x: 0, y: 0 };

  /** The most recent NDC pointer position (updated on each pointermove). */
  readonly currentNDC = { x: 0, y: 0 };

  /** Pixel-space pointer position within the attached element. */
  pointerScreenX = 0;
  pointerScreenY = 0;

  private attachedElement: Element | null = null;
  private listener: ((e: PointerEvent) => void) | null = null;

  constructor(options?: PointerVelocityOptions) {
    this.decayRate = options?.decayRate ?? 0.032;
    this.decayThreshold = options?.decayThreshold ?? 0.0001;
  }

  /** Register a `pointermove` listener on `element`. */
  attach(element: Element): void {
    this.detach();
    this.attachedElement = element;
    this.listener = (e: PointerEvent): void => {
      const rect = (element as HTMLElement).getBoundingClientRect();
      this.pointerScreenX = e.clientX - rect.left;
      this.pointerScreenY = e.clientY - rect.top;
      const nx = (this.pointerScreenX / rect.width) * 2 - 1;
      const ny = -(this.pointerScreenY / rect.height) * 2 + 1;
      this.currentNDC.x = nx;
      this.currentNDC.y = ny;
      this.pendingDeltaX += nx - this.lastNdcX;
      this.pendingDeltaY += ny - this.lastNdcY;
      this.lastNdcX = nx;
      this.lastNdcY = ny;
    };
    element.addEventListener('pointermove', this.listener as EventListener);
  }

  /** Remove the previously-attached listener. Safe to call when nothing is attached. */
  detach(): void {
    if (this.attachedElement && this.listener) {
      this.attachedElement.removeEventListener('pointermove', this.listener as EventListener);
    }
    this.attachedElement = null;
    this.listener = null;
  }

  /**
   * Advance one frame: apply exponential decay, merge pending delta, and snap
   * to zero when below the threshold. Call once per `requestAnimationFrame`.
   */
  update(): void {
    this.smoothDelta.x = (this.smoothDelta.x + this.pendingDeltaX) * (1 - this.decayRate);
    this.smoothDelta.y = (this.smoothDelta.y + this.pendingDeltaY) * (1 - this.decayRate);
    this.pendingDeltaX = 0;
    this.pendingDeltaY = 0;

    const mag = Math.sqrt(this.smoothDelta.x ** 2 + this.smoothDelta.y ** 2);
    if (mag < this.decayThreshold) {
      this.smoothDelta.x = 0;
      this.smoothDelta.y = 0;
    }
  }
}
