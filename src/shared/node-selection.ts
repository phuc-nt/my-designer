import { resolveLayout, subtree } from './layout';
import { uid, type DesignDocument, type DesignNode, type DesignPage } from './schema';
import type { z } from 'zod';
import type { trackSchema } from './design-capabilities';
type Track = z.infer<typeof trackSchema>;

/** A copied subtree: roots carry page-space coordinates and no parent, so the bundle can land on any page. */
export type NodeBundle = { pageId: string; nodes: DesignNode[]; tracks: Track[]; origin: { x: number; y: number } };

function outermost(page: DesignPage, ids: readonly string[]): DesignNode[] {
  const chosen = new Set(ids);
  return page.nodes.filter(node => {
    if (!chosen.has(node.id)) return false;
    let parent = page.nodes.find(n => n.id === node.parentId);
    while (parent) { if (chosen.has(parent.id)) return false; parent = page.nodes.find(n => n.id === parent!.parentId); }
    return true;
  });
}
export function captureNodeSelection(doc: DesignDocument, page: DesignPage, ids: readonly string[]): NodeBundle {
  const roots = outermost(page, ids), resolved = resolveLayout(page);
  const included = new Set(roots.flatMap(root => [...subtree(page, root.id)]));
  const nodes = page.nodes.filter(n => included.has(n.id)).map(n => structuredClone(n));
  const shifts = new Map<string, { x: number; y: number }>();
  for (const root of roots) {
    const copy = nodes.find(n => n.id === root.id)!, box = resolved.nodes.find(n => n.id === root.id)!;
    const parent = resolved.nodes.find(n => n.id === root.parentId);
    // Local coordinates become page coordinates; legacy page-space children already are.
    if (parent?.layout) shifts.set(root.id, { x: box.x - root.x, y: box.y - root.y });
    copy.x = box.x; copy.y = box.y; copy.width = box.width; copy.height = box.height;
    delete copy.parentId; delete copy.position;
    if (copy.sizing?.width === 'fill') copy.sizing.width = 'fixed';
    if (copy.sizing?.height === 'fill') copy.sizing.height = 'fixed';
  }
  const tracks = (doc.timeline?.tracks ?? []).filter(t => included.has(t.nodeId)).map(track => {
    const copy = structuredClone(track), shift = shifts.get(track.nodeId);
    if (shift) for (const key of copy.keyframes) { if (typeof key.values.x === 'number') key.values.x += shift.x; if (typeof key.values.y === 'number') key.values.y += shift.y; }
    return copy;
  });
  const boxes = roots.map(root => resolved.nodes.find(n => n.id === root.id)!);
  return { pageId: page.id, nodes, tracks, origin: { x: Math.min(...boxes.map(b => b.x)), y: Math.min(...boxes.map(b => b.y)) } };
}
/** Fresh IDs for every node and track, internal references remapped, roots shifted by `offset`. */
export function remintNodeSelection(bundle: NodeBundle, offset: { x: number; y: number }, nextId: () => string = uid): { nodes: DesignNode[]; tracks: Track[]; rootIds: string[] } {
  const mapping = new Map(bundle.nodes.map(n => [n.id, nextId()]));
  const byId = new Map(bundle.nodes.map(n => [n.id, n]));
  const shifted = new Set<string>();
  const nodes = bundle.nodes.map(node => {
    const copy = structuredClone(node); copy.id = mapping.get(node.id)!;
    if (copy.parentId) copy.parentId = mapping.get(copy.parentId);
    for (const interaction of copy.interactions ?? []) if (interaction.action !== 'url') interaction.target = mapping.get(interaction.target) ?? interaction.target;
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (!parent || !parent.layout) { copy.x += offset.x; copy.y += offset.y; shifted.add(node.id); }
    return copy;
  });
  const tracks = bundle.tracks.map(track => {
    const copy = structuredClone(track); copy.id = nextId(); copy.nodeId = mapping.get(track.nodeId)!;
    if (shifted.has(track.nodeId)) for (const key of copy.keyframes) { if (typeof key.values.x === 'number') key.values.x += offset.x; if (typeof key.values.y === 'number') key.values.y += offset.y; }
    return copy;
  });
  return { nodes, tracks, rootIds: bundle.nodes.filter(n => !n.parentId).map(n => mapping.get(n.id)!) };
}
