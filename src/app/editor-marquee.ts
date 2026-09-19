import type { Rect } from '../shared/alignment';
import type { DesignNode, DesignPage } from '../shared/schema';

export function normalizeRect(x1: number, y1: number, x2: number, y2: number): Rect {
  return { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) };
}
const contains = (outer: Rect, inner: Rect) => inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
/**
 * Visible nodes whose resolved box lies fully inside the marquee, excluding
 * descendants of another enclosed node so the outermost layer is selected.
 */
export function nodesInRect(page: DesignPage, boxes: readonly (Rect & Pick<DesignNode, 'id' | 'visible'>)[], rect: Rect): string[] {
  const enclosed = new Set(boxes.filter(box => box.visible !== false && contains(rect, box)).map(box => box.id));
  return [...enclosed].filter(id => {
    let parent = page.nodes.find(n => n.id === page.nodes.find(item => item.id === id)?.parentId);
    while (parent) { if (enclosed.has(parent.id)) return false; parent = page.nodes.find(n => n.id === parent!.parentId); }
    return true;
  });
}
