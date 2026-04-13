/**
 * Debug overlay utilities for the lighting-interaction scene.
 * Renders a velocity vector arrow on a 2D canvas placed over the Three.js viewport.
 */

/**
 * Creates a full-size canvas overlay absolutely positioned over `container`.
 * The canvas has `pointer-events: none` so it never intercepts mouse events.
 */
export function createDebugOverlayCanvas(container: Element): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';

  const rect = container.getBoundingClientRect();
  canvas.width = rect.width || 400;
  canvas.height = rect.height || 300;

  (container as HTMLElement).style.position = 'relative';
  container.appendChild(canvas);
  return canvas;
}

/**
 * Redraws the velocity vector on every animation frame.
 * Clears the canvas, then draws an arrow from the pointer position in the direction
 * of the current smoothed velocity scaled by `scale`.
 *
 * @param ctx    - 2D rendering context of the debug overlay canvas
 * @param px     - Pointer screen X (pixels)
 * @param py     - Pointer screen Y (pixels)
 * @param vx     - Smoothed horizontal velocity (NDC delta per frame)
 * @param vy     - Smoothed vertical velocity (NDC delta per frame)
 * @param scale  - Scalar that converts NDC velocity to canvas pixels for readability
 */
export function drawVelocityVector(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  vx: number,
  vy: number,
  scale: number,
): void {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  const endX = px + vx * scale;
  const endY = py - vy * scale; // NDC Y is flipped relative to canvas Y

  const dx = endX - px;
  const dy = endY - py;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len < 0.5) return; // Nothing meaningful to draw

  // Shaft
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = 'rgba(255, 80, 80, 0.9)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Arrowhead — 10px long, 30 degrees half-angle
  const headLen = Math.min(10, len * 0.5);
  const angle = Math.atan2(dy, dx);
  const spread = Math.PI / 6;

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - headLen * Math.cos(angle - spread), endY - headLen * Math.sin(angle - spread));
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - headLen * Math.cos(angle + spread), endY - headLen * Math.sin(angle + spread));
  ctx.strokeStyle = 'rgba(255, 80, 80, 0.9)';
  ctx.lineWidth = 2;
  ctx.stroke();
}
