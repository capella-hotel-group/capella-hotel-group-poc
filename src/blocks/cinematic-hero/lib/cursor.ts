// src/blocks/cinematic-hero/lib/cursor.ts

const LERP_FACTOR = 0.12; // 0 = no follow, 1 = instant follow

export class CursorController {
  private container: HTMLElement;
  private cursorEl: HTMLElement;
  private rafId = 0;
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;
  private active = false;
  private mounted = false;

  constructor(container: HTMLElement, cursorEl: HTMLElement) {
    this.container = container;
    this.cursorEl = cursorEl;
  }

  /** Mount only if fine pointer and no reduced motion. */
  mount(): void {
    if (this.mounted) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.mounted = true;
    this.container.addEventListener('pointermove', this.onPointerMove);
    this.container.addEventListener('pointerenter', this.onPointerEnter);
    this.container.addEventListener('pointerleave', this.onPointerLeave);
    this.container.style.cursor = 'none';
  }

  private onPointerMove = (e: PointerEvent): void => {
    this.targetX = e.clientX;
    this.targetY = e.clientY;
    if (!this.active) this.startRAF();
  };

  private onPointerEnter = (): void => {
    this.active = true;
    this.cursorEl.style.opacity = '1';
    this.startRAF();
  };

  private onPointerLeave = (): void => {
    this.active = false;
    this.cursorEl.style.opacity = '0';
  };

  private startRAF(): void {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(this.tick);
  }

  private tick = (): void => {
    // LERP toward target
    this.currentX += (this.targetX - this.currentX) * LERP_FACTOR;
    this.currentY += (this.targetY - this.currentY) * LERP_FACTOR;

    this.cursorEl.style.transform = `translate(calc(${this.currentX}px - 50%), calc(${this.currentY}px - 50%))`;

    if (this.active || Math.abs(this.targetX - this.currentX) > 0.5) {
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      this.rafId = 0;
    }
  };

  destroy(): void {
    this.mounted = false;
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.container.removeEventListener('pointermove', this.onPointerMove);
    this.container.removeEventListener('pointerenter', this.onPointerEnter);
    this.container.removeEventListener('pointerleave', this.onPointerLeave);
    this.container.style.cursor = '';
  }
}
