// src/blocks/cinematic-hero/lib/selector-ui.ts
import type { HeroItem } from './types';

const ANCHOR_MS = 310;
const OPACITY_MS = 190;
const HOVER_DELAY_MS = 120;

export class SelectorUI {
  private prefixEl: HTMLElement;
  private suffixEl: HTMLElement;
  private itemListEl: HTMLUListElement;
  private items: HeroItem[] = [];
  private rowOffsets: number[] = [];
  private activeIndex = 0;
  private selectCallbacks: Array<(index: number) => void> = [];
  private hoverTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingAnchorAnimations: Animation[] = [];
  private introComplete = false;

  constructor(prefixEl: HTMLElement, suffixEl: HTMLElement, itemListEl: HTMLUListElement) {
    this.prefixEl = prefixEl;
    this.suffixEl = suffixEl;
    this.itemListEl = itemListEl;
  }

  setIntroComplete(complete: boolean): void {
    this.introComplete = complete;
  }

  onSelect(cb: (index: number) => void): void {
    this.selectCallbacks.push(cb);
  }

  private emitSelect(index: number): void {
    this.selectCallbacks.forEach((cb) => cb(index));
  }

  /** Render the item list for the given items, preserving pointer listeners. */
  renderItems(items: HeroItem[], activeIndex: number): void {
    this.items = items;
    this.activeIndex = activeIndex;

    this.itemListEl.innerHTML = '';
    items.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'cinematic-hero-item';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', idx === activeIndex ? 'true' : 'false');
      li.dataset.index = String(idx);

      const btn = document.createElement('button');
      btn.className = 'cinematic-hero-item-btn';
      btn.type = 'button';
      btn.textContent = item.label;

      // Pointer interaction
      btn.addEventListener('pointerenter', () => this.handlePointerEnter(idx));
      btn.addEventListener('pointerleave', () => this.handlePointerLeave());

      // Keyboard interaction
      btn.addEventListener('keydown', (e) => this.handleKeyDown(e, idx));
      btn.addEventListener('click', () => this.handleClick(idx));

      li.append(btn);
      this.itemListEl.append(li);
    });
  }

  private handlePointerEnter(index: number): void {
    if (!this.introComplete) return;
    this.clearHoverTimer();
    this.hoverTimer = setTimeout(() => {
      this.activateItem(index, true);
      this.emitSelect(index);
    }, HOVER_DELAY_MS);
  }

  private handlePointerLeave(): void {
    this.clearHoverTimer();
  }

  private handleKeyDown(e: KeyboardEvent, currentIndex: number): void {
    if (!this.introComplete) return;
    const count = this.items.length;
    let next = currentIndex;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      next = Math.min(count - 1, currentIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      next = Math.max(0, currentIndex - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      next = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      next = count - 1;
    } else return;

    if (next !== currentIndex) {
      this.activateItem(next, true);
      this.emitSelect(next);
      // Move focus to new item button
      const btn = this.itemListEl.children[next]?.querySelector<HTMLButtonElement>('button');
      btn?.focus();
    }
  }

  private handleClick(index: number): void {
    if (!this.introComplete) return;
    this.clearHoverTimer();
    const item = this.items[index];
    if (index === this.activeIndex && item?.link) {
      window.location.href = item.link;
      return;
    }
    this.activateItem(index, true);
    this.emitSelect(index);
  }

  private clearHoverTimer(): void {
    if (this.hoverTimer !== null) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
  }

  /** Cache the Y offset (relative to item list) of each row. Call after font load and on resize. */
  measureRows(): void {
    const listTop = this.itemListEl.getBoundingClientRect().top;
    this.rowOffsets = [...this.itemListEl.children].map((li) => {
      const rect = li.getBoundingClientRect();
      return rect.top + rect.height / 2 - listTop;
    });
  }

  /** Move prefix/suffix to align with the given item row, and update opacity states. */
  activateItem(index: number, animate: boolean): void {
    const prev = this.activeIndex;
    this.activeIndex = index;

    // Update aria-selected
    const lis = [...this.itemListEl.children] as HTMLElement[];
    lis.forEach((li, i) => {
      li.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });

    // Opacity transitions
    const prevBtn = lis[prev]?.querySelector<HTMLElement>('.cinematic-hero-item-btn');
    const nextBtn = lis[index]?.querySelector<HTMLElement>('.cinematic-hero-item-btn');

    if (prevBtn && prev !== index) {
      prevBtn.animate([{ opacity: 1 }, { opacity: 0.35 }], {
        duration: animate ? OPACITY_MS : 0,
        fill: 'forwards',
      });
    }
    if (nextBtn) {
      nextBtn.animate([{ opacity: 0.35 }, { opacity: 1 }], {
        duration: animate ? OPACITY_MS : 0,
        fill: 'forwards',
      });
    }

    // Anchor movement
    if (this.rowOffsets.length === 0) this.measureRows();
    const targetOffset = this.rowOffsets[index];
    if (targetOffset === undefined) return;

    // Cancel pending anchor animations (overwrite — latest wins)
    this.pendingAnchorAnimations.forEach((a) => a.cancel());
    this.pendingAnchorAnimations = [];

    const listRect = this.itemListEl.getBoundingClientRect();
    const prefixRect = this.prefixEl.getBoundingClientRect();
    const suffixRect = this.suffixEl.getBoundingClientRect();

    // Target Y: align midpoint of prefix/suffix with item row midpoint
    const listTop = listRect.top;
    const prefixMidY = prefixRect.top + prefixRect.height / 2;
    const suffixMidY = suffixRect.top + suffixRect.height / 2;

    const targetY = listTop + targetOffset;
    const prefixDelta = targetY - prefixMidY;
    const suffixDelta = targetY - suffixMidY;

    const prefixCurrentY = this.getCurrentTranslateY(this.prefixEl);
    const suffixCurrentY = this.getCurrentTranslateY(this.suffixEl);

    const prefixAnim = this.prefixEl.animate(
      [
        { transform: `translateY(${prefixCurrentY}px)` },
        { transform: `translateY(${prefixCurrentY + prefixDelta}px)` },
      ],
      { duration: animate ? ANCHOR_MS : 0, easing: 'ease-out', fill: 'forwards' },
    );
    const suffixAnim = this.suffixEl.animate(
      [
        { transform: `translateY(${suffixCurrentY}px)` },
        { transform: `translateY(${suffixCurrentY + suffixDelta}px)` },
      ],
      { duration: animate ? ANCHOR_MS : 0, easing: 'ease-out', fill: 'forwards' },
    );

    this.pendingAnchorAnimations = [prefixAnim, suffixAnim];

    // Commit on finish
    prefixAnim.finished
      .then(() => {
        this.prefixEl.style.transform = `translateY(${prefixCurrentY + prefixDelta}px)`;
        prefixAnim.cancel();
      })
      .catch(() => {
        /* cancelled by next activation */
      });

    suffixAnim.finished
      .then(() => {
        this.suffixEl.style.transform = `translateY(${suffixCurrentY + suffixDelta}px)`;
        suffixAnim.cancel();
      })
      .catch(() => {
        /* cancelled */
      });
  }

  private getCurrentTranslateY(el: HTMLElement): number {
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    return matrix.m42;
  }

  destroy(): void {
    this.clearHoverTimer();
    this.pendingAnchorAnimations.forEach((a) => a.cancel());
  }
}
