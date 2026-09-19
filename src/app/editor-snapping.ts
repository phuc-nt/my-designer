import type { Rect } from '../shared/alignment';
export type Guide = { axis: 'x' | 'y'; at: number };
export type SnapCandidates = { x: number[]; y: number[] };
export type SnapResult = { dx: number; dy: number; guides: Guide[] };

/** Page edges and centre plus every other box's edges and centre, deduplicated. */
export function snapCandidates(page: { width: number; height: number }, boxes: readonly Rect[]): SnapCandidates {
  const x = new Set<number>([0, page.width / 2, page.width]), y = new Set<number>([0, page.height / 2, page.height]);
  for (const box of boxes) {
    x.add(box.x); x.add(box.x + box.width / 2); x.add(box.x + box.width);
    y.add(box.y); y.add(box.y + box.height / 2); y.add(box.y + box.height);
  }
  return { x: [...x].sort((a, b) => a - b), y: [...y].sort((a, b) => a - b) };
}
function snapAxis(edges: number[], candidates: number[], threshold: number): { shift: number; at: number } | null {
  let best: { shift: number; at: number } | null = null;
  for (const edge of edges) for (const at of candidates) {
    const shift = at - edge;
    if (Math.abs(shift) <= threshold && (!best || Math.abs(shift) < Math.abs(best.shift))) best = { shift, at };
  }
  return best;
}
/**
 * Adjusts a drag delta so the moved selection's edges or centre land on the
 * nearest candidate within `threshold` page pixels. Each axis snaps
 * independently; guides mark the lines that were hit.
 */
export function snapDelta(bounds: Rect, dx: number, dy: number, candidates: SnapCandidates, threshold: number): SnapResult {
  const moved = { x: bounds.x + dx, y: bounds.y + dy };
  const x = snapAxis([moved.x, moved.x + bounds.width / 2, moved.x + bounds.width], candidates.x, threshold);
  const y = snapAxis([moved.y, moved.y + bounds.height / 2, moved.y + bounds.height], candidates.y, threshold);
  const guides: Guide[] = [];
  if (x) guides.push({ axis: 'x', at: x.at });
  if (y) guides.push({ axis: 'y', at: y.at });
  return { dx: dx + (x?.shift ?? 0), dy: dy + (y?.shift ?? 0), guides };
}
