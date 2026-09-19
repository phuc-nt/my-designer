// Structural diff between two revisions of a document: which pages and nodes
// were added, removed or changed, and which fields changed. Used by summary
// responses, `document changes --summary` and `projects diff`.
import type { DesignDocument, DesignNode, DesignPage } from './schema';

export interface NodeChange { id: string; pageId: string; name: string; type: string; fields: string[] }
export interface PageChange { id: string; name: string; fields: string[] }
export interface DocumentDiff {
  name: boolean;
  theme: boolean;
  timeline: boolean;
  assets: { added: string[]; removed: string[] };
  pages: { added: PageChange[]; removed: PageChange[]; changed: PageChange[] };
  nodes: { added: NodeChange[]; removed: NodeChange[]; changed: NodeChange[] };
  /** Total number of differences, zero when the documents are equivalent. */
  count: number;
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const changedKeys = (a: Record<string, unknown>, b: Record<string, unknown>, ignore: string[] = []) =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(key => !ignore.includes(key) && !same(a[key], b[key])).sort();
const nodeRef = (node: DesignNode, page: DesignPage, fields: string[] = []): NodeChange => ({ id: node.id, pageId: page.id, name: node.name, type: node.type, fields });
const pageRef = (page: DesignPage, fields: string[] = []): PageChange => ({ id: page.id, name: page.name, fields });

export function diffDocuments(before: DesignDocument, after: DesignDocument): DocumentDiff {
  const diff: DocumentDiff = {
    name: before.name !== after.name, theme: !same(before.theme, after.theme), timeline: !same(before.timeline, after.timeline),
    assets: { added: after.assets.filter(a => !before.assets.some(b => b.id === a.id)).map(a => a.id), removed: before.assets.filter(b => !after.assets.some(a => a.id === b.id)).map(b => b.id) },
    pages: { added: [], removed: [], changed: [] }, nodes: { added: [], removed: [], changed: [] }, count: 0,
  };
  const beforePages = new Map(before.pages.map(page => [page.id, page])), afterPages = new Map(after.pages.map(page => [page.id, page]));
  for (const page of before.pages) if (!afterPages.has(page.id)) { diff.pages.removed.push(pageRef(page)); for (const node of page.nodes) diff.nodes.removed.push(nodeRef(node, page)); }
  for (const page of after.pages) {
    const previous = beforePages.get(page.id);
    if (!previous) { diff.pages.added.push(pageRef(page)); for (const node of page.nodes) diff.nodes.added.push(nodeRef(node, page)); continue; }
    const fields = changedKeys(previous as Record<string, unknown>, page as Record<string, unknown>, ['nodes']);
    const beforeNodes = new Map(previous.nodes.map(node => [node.id, node])), afterNodes = new Map(page.nodes.map(node => [node.id, node]));
    for (const node of previous.nodes) if (!afterNodes.has(node.id)) diff.nodes.removed.push(nodeRef(node, previous));
    for (const node of page.nodes) {
      const old = beforeNodes.get(node.id);
      if (!old) { diff.nodes.added.push(nodeRef(node, page)); continue; }
      const nodeFields = changedKeys(old as Record<string, unknown>, node as Record<string, unknown>);
      if (nodeFields.length) diff.nodes.changed.push(nodeRef(node, page, nodeFields));
    }
    const beforeOrder = previous.nodes.map(node => node.id).filter(id => afterNodes.has(id)), afterOrder = page.nodes.map(node => node.id).filter(id => beforeNodes.has(id));
    if (!same(beforeOrder, afterOrder)) fields.push('order');
    if (fields.length) diff.pages.changed.push(pageRef(page, fields));
  }
  const beforeOrder = before.pages.map(page => page.id).filter(id => afterPages.has(id)), afterOrder = after.pages.map(page => page.id).filter(id => beforePages.has(id));
  if (!same(beforeOrder, afterOrder)) diff.pages.changed.push({ id: '', name: 'page order', fields: ['order'] });
  diff.count = Number(diff.name) + Number(diff.theme) + Number(diff.timeline) + diff.assets.added.length + diff.assets.removed.length
    + diff.pages.added.length + diff.pages.removed.length + diff.pages.changed.length + diff.nodes.added.length + diff.nodes.removed.length + diff.nodes.changed.length;
  return diff;
}
/** Compact projection for write receipts: which pages and nodes a save touched. */
export function changedIds(diff: DocumentDiff): { pages: string[]; nodes: string[] } {
  const pages = new Set<string>(), nodes = new Set<string>();
  for (const page of [...diff.pages.added, ...diff.pages.removed, ...diff.pages.changed]) if (page.id) pages.add(page.id);
  for (const node of [...diff.nodes.added, ...diff.nodes.removed, ...diff.nodes.changed]) { nodes.add(node.id); pages.add(node.pageId); }
  return { pages: [...pages], nodes: [...nodes] };
}
/** One line per difference, for humans and agents skimming a change feed. */
export function describeDiff(diff: DocumentDiff): string[] {
  const lines: string[] = [];
  if (diff.name) lines.push('renamed the document');
  if (diff.theme) lines.push('changed the theme');
  if (diff.timeline) lines.push('changed the timeline');
  if (diff.assets.added.length) lines.push(`added ${diff.assets.added.length} asset(s)`);
  if (diff.assets.removed.length) lines.push(`removed ${diff.assets.removed.length} asset(s)`);
  for (const page of diff.pages.added) lines.push(`added page "${page.name}" (${page.id})`);
  for (const page of diff.pages.removed) lines.push(`removed page "${page.name}" (${page.id})`);
  for (const page of diff.pages.changed) lines.push(page.id ? `changed page "${page.name}" (${page.id}): ${page.fields.join(', ')}` : 'reordered pages');
  for (const node of diff.nodes.added) lines.push(`added ${node.type} "${node.name}" (${node.id}) on ${node.pageId}`);
  for (const node of diff.nodes.removed) lines.push(`removed ${node.type} "${node.name}" (${node.id}) from ${node.pageId}`);
  for (const node of diff.nodes.changed) lines.push(`changed ${node.type} "${node.name}" (${node.id}): ${node.fields.join(', ')}`);
  return lines;
}
