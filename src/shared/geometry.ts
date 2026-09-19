// Axis-aligned rectangle helpers shared by preflight checks, snapping and marquee selection.
export interface Rect { x: number; y: number; width: number; height: number }

export const intersects = (a: Rect, b: Rect) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
/** `inner` lies completely inside `outer` (touching edges count as inside). */
export const contains = (outer: Rect, inner: Rect, tolerance = 0) =>
  inner.x >= outer.x - tolerance && inner.y >= outer.y - tolerance && inner.x + inner.width <= outer.x + outer.width + tolerance && inner.y + inner.height <= outer.y + outer.height + tolerance;
export const containsPoint = (rect: Rect, x: number, y: number) => x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
export function overlapArea(a: Rect, b: Rect): number {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return width > 0 && height > 0 ? width * height : 0;
}
export const area = (rect: Rect) => Math.max(0, rect.width) * Math.max(0, rect.height);
