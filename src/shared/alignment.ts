// Pure geometry for align/distribute. Boxes are page-space rectangles
// (from resolveLayout); the result is a translation per box so callers can
// apply it through their own coordinate/animation rules.
export type AlignBox = { id: string; x: number; y: number; width: number; height: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type Alignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type Axis = 'horizontal' | 'vertical';
export type Translation = { dx: number; dy: number };
export const alignments: Alignment[] = ['left', 'center', 'right', 'top', 'middle', 'bottom'];

export function boundsOf(boxes: readonly Rect[]): Rect {
  if (!boxes.length) return { x: 0, y: 0, width: 0, height: 0 };
  const x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y));
  return { x, y, width: Math.max(...boxes.map(b => b.x + b.width)) - x, height: Math.max(...boxes.map(b => b.y + b.height)) - y };
}

/** Translation that aligns each box to `target` (default: the selection bounds). */
export function alignBoxes(boxes: readonly AlignBox[], alignment: Alignment, target: Rect = boundsOf(boxes)): Map<string, Translation> {
  const result = new Map<string, Translation>();
  for (const box of boxes) {
    let dx = 0, dy = 0;
    if (alignment === 'left') dx = target.x - box.x;
    else if (alignment === 'center') dx = target.x + (target.width - box.width) / 2 - box.x;
    else if (alignment === 'right') dx = target.x + target.width - box.width - box.x;
    else if (alignment === 'top') dy = target.y - box.y;
    else if (alignment === 'middle') dy = target.y + (target.height - box.height) / 2 - box.y;
    else dy = target.y + target.height - box.height - box.y;
    result.set(box.id, { dx, dy });
  }
  return result;
}

/**
 * Spaces boxes evenly along one axis in their current order. Without `gap`
 * the outer boxes stay put and the gaps between them are equalised; with a
 * fixed `gap` the first box stays put and the rest pack after it.
 */
export function distributeBoxes(boxes: readonly AlignBox[], axis: Axis, gap?: number): Map<string, Translation> {
  const result = new Map<string, Translation>();
  if (boxes.length < 2) { for (const box of boxes) result.set(box.id, { dx: 0, dy: 0 }); return result; }
  const pos = axis === 'horizontal' ? 'x' : 'y', size = axis === 'horizontal' ? 'width' : 'height';
  const ordered = [...boxes].sort((a, b) => a[pos] - b[pos] || a.id.localeCompare(b.id));
  const bounds = boundsOf(ordered), total = ordered.reduce((sum, box) => sum + box[size], 0);
  const spacing = gap ?? (bounds[size] - total) / (ordered.length - 1);
  let cursor = bounds[pos];
  for (const box of ordered) {
    const delta = cursor - box[pos];
    result.set(box.id, axis === 'horizontal' ? { dx: delta, dy: 0 } : { dx: 0, dy: delta });
    cursor += box[size] + spacing;
  }
  return result;
}
