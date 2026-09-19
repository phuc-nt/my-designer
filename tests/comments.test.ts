import { test } from 'node:test';
import assert from 'node:assert/strict';
import { documentSchema } from '../src/shared/schema';
import { createDocument } from '../src/shared/catalog';
import { mutateDocument } from '../src/shared/operations';
import { addComment, listComments, setCommentResolved, unresolvedCount } from '../src/shared/comments';
import { changedIds, describeDiff, diffDocuments } from '../src/shared/document-diff';

const fixture = () => documentSchema.parse(createDocument('slides', 'Review deck', undefined, 'product-deck'));
const firstText = (doc: ReturnType<typeof fixture>) => doc.pages[0].nodes.find(node => node.type === 'text')!;

test('comments validate on nodes and pages and keep document-wide unique IDs', () => {
  const doc = fixture();
  const node = firstText(doc);
  node.comments = [{ id: 'c1', text: 'Tighten this headline', author: 'human', createdAt: '2026-09-19T08:00:00.000Z' }];
  doc.pages[0].comments = [{ id: 'c2', text: 'Whole slide feels crowded', author: 'agent', createdAt: '2026-09-19T08:01:00.000Z', resolved: true }];
  assert.ok(documentSchema.safeParse(doc).success);
  doc.pages[0].comments[0].id = 'c1';
  const duplicate = documentSchema.safeParse(doc);
  assert.equal(duplicate.success, false, 'a page comment cannot reuse a node comment ID');
  doc.pages[0].comments[0].id = 'c2';
  node.comments.push({ id: 'bad id!', text: 'x', author: 'human', createdAt: '2026-09-19T08:00:00.000Z' });
  assert.equal(documentSchema.safeParse(doc).success, false, 'comment IDs are URL-safe');
  node.comments.pop();
  node.comments.push({ id: 'empty', text: '   ', author: 'human', createdAt: '2026-09-19T08:00:00.000Z' });
  assert.equal(documentSchema.safeParse(doc).success, false, 'blank comments are rejected');
});

test('listComments walks pages then nodes and can keep only open threads', () => {
  const doc = fixture();
  const node = firstText(doc);
  addComment(doc, { pageId: doc.pages[0].id }, { id: 'page-1', text: 'Page note', author: 'agent' });
  addComment(doc, { nodeId: node.id }, { id: 'node-1', text: 'Node note', author: 'human' });
  addComment(doc, { nodeId: node.id }, { id: 'node-2', text: 'Second node note', author: 'human' });
  setCommentResolved(doc, 'node-1');
  const all = listComments(doc);
  assert.deepEqual(all.map(comment => comment.id), ['page-1', 'node-1', 'node-2']);
  assert.equal(all[0].nodeId, undefined);
  assert.equal(all[1].nodeName, node.name);
  assert.equal(all[1].pageName, doc.pages[0].name);
  assert.deepEqual(listComments(doc, { unresolved: true }).map(comment => comment.id), ['page-1', 'node-2']);
  assert.equal(unresolvedCount(node.comments), 1);
  setCommentResolved(doc, 'node-1', false);
  assert.equal(node.comments![0].resolved, undefined, 'reopening removes the resolved flag');
  assert.throws(() => addComment(doc, { nodeId: node.id }, { id: 'page-1', text: 'dup', author: 'agent' }), /already exists/);
  assert.throws(() => addComment(doc, { nodeId: 'missing' }, { text: 'x', author: 'agent' }), /Unknown node/);
  assert.throws(() => addComment(doc, {}, { text: 'x', author: 'agent' }), /nodeId or a pageId/);
  assert.throws(() => setCommentResolved(doc, 'nope'), /Unknown comment/);
  assert.ok(documentSchema.safeParse(doc).success);
});

test('add-comment and resolve-comment operations round-trip through mutateDocument', () => {
  const doc = fixture();
  const node = firstText(doc);
  const commented = mutateDocument(doc, [
    { op: 'add-comment', nodeId: node.id, comment: { id: 'review-1', text: 'Use the brand blue here', author: 'agent' } },
    { op: 'add-comment', pageId: doc.pages[0].id, comment: { text: 'Add a subtitle' } },
  ]);
  assert.equal(doc.pages[0].comments, undefined, 'the input document is not mutated');
  const stored = commented.pages[0].nodes.find(candidate => candidate.id === node.id)!;
  assert.equal(stored.comments?.[0].id, 'review-1');
  assert.equal(commented.pages[0].comments?.[0].author, 'agent', 'author defaults to agent');
  assert.match(commented.pages[0].comments![0].createdAt, /^\d{4}-\d{2}-\d{2}T/);
  const resolved = mutateDocument(commented, [{ op: 'resolve-comment', commentId: 'review-1' }]);
  assert.equal(resolved.pages[0].nodes.find(candidate => candidate.id === node.id)!.comments![0].resolved, true);
  assert.throws(() => mutateDocument(doc, [{ op: 'add-comment', nodeId: node.id, pageId: doc.pages[0].id, comment: { text: 'both' } }]), /exactly one of nodeId or pageId/);
  assert.throws(() => mutateDocument(doc, [{ op: 'add-comment', comment: { text: 'neither' } }]), /exactly one of nodeId or pageId/);
});

test('diffDocuments reports added, removed and changed pages and nodes with their fields', () => {
  const before = fixture();
  const after = structuredClone(before);
  assert.equal(diffDocuments(before, before).count, 0);
  const node = firstText(after);
  node.text = 'Changed headline'; node.x += 10;
  after.pages[0].nodes = after.pages[0].nodes.filter(candidate => candidate.type !== 'text' || candidate.id === node.id);
  after.pages[0].nodes.push({ id: 'new-shape', type: 'shape', name: 'Badge', x: 0, y: 0, width: 40, height: 40, style: {}, data: {} });
  after.pages[0].name = 'Renamed cover';
  after.pages.push({ id: 'appendix', name: 'Appendix', width: 1280, height: 720, background: '#ffffff', nodes: [] });
  after.name = 'Renamed deck';
  const diff = diffDocuments(before, after);
  assert.equal(diff.name, true);
  assert.equal(diff.theme, false);
  const changed = diff.nodes.changed.find(entry => entry.id === node.id)!;
  assert.deepEqual(changed.fields, ['text', 'x']);
  assert.equal(changed.pageId, before.pages[0].id);
  assert.ok(diff.nodes.added.some(entry => entry.id === 'new-shape'));
  assert.ok(diff.nodes.removed.length >= 1, 'the other text nodes were removed');
  assert.deepEqual(diff.pages.added.map(page => page.id), ['appendix']);
  assert.deepEqual(diff.pages.changed.find(page => page.id === before.pages[0].id)!.fields, ['name']);
  const ids = changedIds(diff);
  assert.ok(ids.pages.includes(before.pages[0].id) && ids.pages.includes('appendix'));
  assert.ok(ids.nodes.includes(node.id) && ids.nodes.includes('new-shape'));
  const lines = describeDiff(diff);
  assert.ok(lines.includes('renamed the document'));
  assert.ok(lines.some(line => line.includes(`changed text "${node.name}" (${node.id}): text, x`)), lines.join('\n'));
  assert.ok(lines.some(line => line.startsWith('added page "Appendix"')));
  assert.equal(diff.count, lines.length);
});

test('diffDocuments notices reordering without reporting untouched nodes', () => {
  const before = fixture();
  const after = structuredClone(before);
  after.pages[0].nodes.reverse();
  const diff = diffDocuments(before, after);
  assert.equal(diff.nodes.changed.length, 0);
  assert.deepEqual(diff.pages.changed, [{ id: before.pages[0].id, name: before.pages[0].name, fields: ['order'] }]);
  const swapped = structuredClone(before);
  swapped.pages.reverse();
  assert.deepEqual(describeDiff(diffDocuments(before, swapped)), ['reordered pages']);
});
