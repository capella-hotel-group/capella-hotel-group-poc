import { PointerVelocityTracker } from '@/utils/pointer-velocity';

const DEFAULT_COLUMN_WEIGHTS = [1.0, 0.7, 1.2, 0.85, 1.1];
const DEFAULT_SWAP_PADDING = 200;
// Maps normalised wheel delta (0–1 range) to pixel displacement per frame
const SCROLL_SPEED_SCALE = 6;
// Exponential decay rate for scroll-mode momentum (0–1). Lower = longer tail.
const DEFAULT_SCROLL_DECAY_RATE = 0.05;

export interface ScrollMotionConfig {
  block: HTMLElement;
  columns: HTMLElement[];
  inputMode?: 'scroll' | 'pointer';
  columnWeights?: number[];
  swapPadding?: number;
  /**
   * Exponential decay rate applied to scroll-mode velocity each frame (0–1).
   * Lower value = slower deceleration / longer momentum tail.
   * Default: 0.05 (~20 frames to ~36% remaining velocity).
   */
  scrollDecayRate?: number;
}

export class ScrollMotionController {
  private readonly block: HTMLElement;
  private readonly columns: HTMLElement[];
  private readonly inputMode: 'scroll' | 'pointer';
  private readonly columnWeights: number[];
  private readonly swapPadding: number;

  // Per-column Y offsets and per-column X logical offsets (for infinity wrap)
  private readonly offsetY: number[];
  private readonly colLogicalX: number[];
  private globalOffsetX = 0;

  // Per-column per-item Y logical offsets (for Y infinity wrap)
  private readonly itemOffsetY: number[][];

  // Cached layout
  private colWidth = 0;
  private gap = 10;
  private totalGridWidth = 0;
  private readonly totalColumnHeight: number[];

  // Input state
  private pendingDeltaX = 0;
  private pendingDeltaY = 0;
  // Scroll-mode momentum velocity (persists across frames, decays exponentially)
  private scrollVelocityX = 0;
  private scrollVelocityY = 0;
  private readonly scrollDecayRate: number;
  private tracker: PointerVelocityTracker | null = null;

  // Last-frame velocity for scroll energy calculation
  private lastDx = 0;
  private lastDy = 0;

  // RAF
  private animationId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private wheelHandler: ((e: WheelEvent) => void) | null = null;

  constructor(config: ScrollMotionConfig) {
    this.block = config.block;
    this.columns = config.columns;
    this.inputMode = config.inputMode ?? 'scroll';
    this.columnWeights = config.columnWeights ?? [...DEFAULT_COLUMN_WEIGHTS];
    this.swapPadding = config.swapPadding ?? DEFAULT_SWAP_PADDING;
    this.scrollDecayRate = config.scrollDecayRate ?? DEFAULT_SCROLL_DECAY_RATE;

    this.offsetY = new Array(this.columns.length).fill(0) as number[];
    this.colLogicalX = new Array(this.columns.length).fill(0) as number[];
    this.totalColumnHeight = new Array(this.columns.length).fill(0) as number[];

    // Track per-item Y offsets (for infinity wrap)
    this.itemOffsetY = this.columns.map((col) => {
      const count = col.children.length;
      return new Array(count).fill(0) as number[];
    });
  }

  /**
   * Normalised scroll energy in [0, 1] based on the current frame's velocity magnitude.
   * Computed as Math.tanh(|velocity| / 15). Returns 0 when the grid is stationary.
   */
  get scrollEnergy(): number {
    return Math.tanh(Math.hypot(this.lastDx, this.lastDy) / 15);
  }

  /**
   * Last-frame global X offset (px). Used by the immersive scene to sync plane positions.
   */
  get currentGlobalOffsetX(): number {
    return this.globalOffsetX;
  }

  /**
   * Per-column Y offsets array. Used by the immersive scene to sync plane positions.
   */
  get currentOffsetY(): readonly number[] {
    return this.offsetY;
  }

  /**
   * Per-column per-item logical Y offsets (teleportation corrections).
   */
  get currentItemOffsetY(): readonly (readonly number[])[] {
    return this.itemOffsetY;
  }

  /**
   * Per-column logical X offsets (teleportation corrections).
   */
  get currentColLogicalX(): readonly number[] {
    return this.colLogicalX;
  }

  /**
   * Last-frame raw scroll velocity X (CSS px/frame). Used by vertex deformation.
   */
  get currentScrollDx(): number {
    return this.lastDx;
  }

  /**
   * Last-frame raw scroll velocity Y (CSS px/frame, DOM convention: + = up).
   * Used by vertex deformation.
   */
  get currentScrollDy(): number {
    return this.lastDy;
  }

  start(): void {
    this.measureLayout();
    this.setupInput();

    this.resizeObserver = new ResizeObserver(() => {
      this.measureLayout();
    });
    this.resizeObserver.observe(this.block);

    this.animate();
  }

  cleanup(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.wheelHandler) {
      this.block.removeEventListener('wheel', this.wheelHandler);
      this.wheelHandler = null;
    }
    this.tracker?.detach();
    this.tracker = null;
  }

  private measureLayout(): void {
    const cols = this.columns.length;
    // Read colWidth from the DOM — applyColumnWidths() in panding-gallery.ts already
    // computed the correct width using VISIBLE_COLS. This avoids a hardcoded duplicate.
    this.colWidth = this.columns[0]?.offsetWidth ?? this.block.clientWidth / cols;
    // Include gap after every column (same convention as Y axis) so the teleport
    // distance = slot width × count, landing with a consistent inter-column gap.
    this.totalGridWidth = (this.colWidth + this.gap) * cols;

    for (let c = 0; c < cols; c++) {
      const items = this.columns[c].children;
      let h = 0;
      for (let i = 0; i < items.length; i++) {
        h += (items[i] as HTMLElement).offsetHeight;
        // Always include gap after every item (including the last) so the
        // teleport distance exactly matches the visual slot width + gap, producing
        // consistent spacing at the loop boundary without a missing-gap seam.
        h += this.gap;
      }
      this.totalColumnHeight[c] = h;
    }
  }

  private setupInput(): void {
    if (this.inputMode === 'pointer') {
      this.tracker = new PointerVelocityTracker();
      this.tracker.attach(this.block);
    } else {
      this.wheelHandler = (e: WheelEvent): void => {
        e.preventDefault();
        const yfactor = e.deltaMode === 1 ? 20 : 1;
        const xfactor = yfactor * 10.0;
        this.pendingDeltaX += (e.deltaX * -xfactor) / 100;
        this.pendingDeltaY += (e.deltaY * -yfactor) / 100;
      };
      this.block.addEventListener('wheel', this.wheelHandler, { passive: false });
    }
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    let dx: number;
    let dy: number;

    if (this.tracker) {
      this.tracker.update();
      dx = this.tracker.smoothDelta.x * SCROLL_SPEED_SCALE;
      dy = this.tracker.smoothDelta.y * SCROLL_SPEED_SCALE;
    } else {
      // Fold wheel input into velocity, then apply exponential decay for momentum
      this.scrollVelocityX = (this.scrollVelocityX + this.pendingDeltaX) * (1 - this.scrollDecayRate);
      this.scrollVelocityY = (this.scrollVelocityY + this.pendingDeltaY) * (1 - this.scrollDecayRate);
      this.pendingDeltaX = 0;
      this.pendingDeltaY = 0;
      dx = this.scrollVelocityX;
      dy = this.scrollVelocityY;
    }

    // Store for energy/offset getters
    this.lastDx = dx;
    this.lastDy = dy;

    // X: uniform across all columns
    this.globalOffsetX += dx;

    const viewportW = this.block.clientWidth;
    const viewportH = this.block.clientHeight;

    for (let c = 0; c < this.columns.length; c++) {
      const col = this.columns[c];

      // Y: per-column weighted
      this.offsetY[c] += dy * this.columnWeights[c] * SCROLL_SPEED_SCALE;

      // --- Y infinity loop: per-item teleportation ---
      const items = col.children;
      const totalH = this.totalColumnHeight[c];
      if (totalH > 0) {
        let itemY = this.offsetY[c];
        for (let i = 0; i < items.length; i++) {
          const el = items[i] as HTMLElement;
          const elH = el.offsetHeight;
          const effectiveY = itemY + this.itemOffsetY[c][i];

          if (effectiveY + elH < -this.swapPadding) {
            this.itemOffsetY[c][i] += totalH;
          } else if (effectiveY > viewportH + this.swapPadding) {
            this.itemOffsetY[c][i] -= totalH;
          }

          // Apply item-level Y transform
          el.style.transform = `translateY(${this.itemOffsetY[c][i]}px)`;

          itemY += elH + this.gap;
        }
      }

      // --- X infinity loop: per-column teleportation ---
      const baseX = c * (this.colWidth + this.gap);
      const effectiveX = baseX + this.globalOffsetX + this.colLogicalX[c];

      if (effectiveX + this.colWidth < -this.swapPadding) {
        this.colLogicalX[c] += this.totalGridWidth;
      } else if (effectiveX > viewportW + this.swapPadding) {
        this.colLogicalX[c] -= this.totalGridWidth;
      }

      // Apply column transform (X from global + logical, Y from per-column offset)
      const finalX = this.globalOffsetX + this.colLogicalX[c];
      col.style.transform = `translate(${finalX}px, ${this.offsetY[c]}px)`;
    }
  };
}
