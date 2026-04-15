const LERP_FACTOR = 0.1;
const SCROLL_IDLE_MS = 400;

export class PointerTooltip {
  private readonly el: HTMLElement;
  private readonly block: HTMLElement;

  private x = 0;
  private y = 0;
  private targetX = 0;
  private targetY = 0;
  private halfW = 0;
  private halfH = 0;

  private visible = false;
  private scrolling = false;
  private scrollTimer = 0;
  private rafId = 0;

  private readonly onPointerEnter: () => void;
  private readonly onPointerLeave: () => void;
  private readonly onPointerMove: (e: PointerEvent) => void;
  private readonly onWheel: () => void;

  constructor(block: HTMLElement, text: string) {
    this.block = block;

    this.el = document.createElement('div');
    this.el.className = 'panding-gallery-tooltip';
    this.el.textContent = text;
    block.append(this.el);

    this.onPointerEnter = (): void => {
      this.visible = true;
      this.updateOpacity();
      if (!this.rafId) this.animate();
    };

    this.onPointerLeave = (): void => {
      this.visible = false;
      this.updateOpacity();
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    };

    this.onPointerMove = (e: PointerEvent): void => {
      const rect = block.getBoundingClientRect();
      this.targetX = e.clientX - rect.left;
      this.targetY = e.clientY - rect.top;
    };

    this.onWheel = (): void => {
      this.scrolling = true;
      this.updateOpacity();
      clearTimeout(this.scrollTimer);
      this.scrollTimer = window.setTimeout(() => {
        this.scrolling = false;
        this.updateOpacity();
      }, SCROLL_IDLE_MS);
    };

    block.addEventListener('pointerenter', this.onPointerEnter);
    block.addEventListener('pointerleave', this.onPointerLeave);
    block.addEventListener('pointermove', this.onPointerMove as EventListener);
    block.addEventListener('wheel', this.onWheel, { passive: true });
  }

  destroy(): void {
    this.block.removeEventListener('pointerenter', this.onPointerEnter);
    this.block.removeEventListener('pointerleave', this.onPointerLeave);
    this.block.removeEventListener('pointermove', this.onPointerMove as EventListener);
    this.block.removeEventListener('wheel', this.onWheel);
    cancelAnimationFrame(this.rafId);
    clearTimeout(this.scrollTimer);
    this.el.remove();
  }

  private updateOpacity(): void {
    this.el.style.opacity = this.visible && !this.scrolling ? '1' : '0';
  }

  private animate = (): void => {
    this.rafId = requestAnimationFrame(this.animate);
    if (!this.halfW) {
      this.halfW = this.el.offsetWidth / 2;
      this.halfH = this.el.offsetHeight / 2;
    }
    this.x += (this.targetX - this.x) * LERP_FACTOR;
    this.y += (this.targetY - this.y) * LERP_FACTOR;
    this.el.style.transform = `translate(${this.x - this.halfW}px, ${this.y - this.halfH}px)`;
  };
}
