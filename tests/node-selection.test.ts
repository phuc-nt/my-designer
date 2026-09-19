import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captureNodeSelection, remintNodeSelection } from '../src/shared/node-selection';
import { createDocument } from '../src/shared/catalog';
import { documentSchema, type DesignPage } from '../src/shared/schema';

function fixture() {
  const doc = createDocument('slides', 'Clipboard');
  const page: DesignPage = { id: 'p1', name: 'One', width: 600, height: 400, background: '#fff', nodes: [
    { id: 'frame', type: 'frame', name: 'Frame', x: 100, y: 100, width: 300, height: 200, layout: { mode: 'flex', direction: 'column', gap: 10, padding: 20 } },
    { id: 'flow', type: 'shape', name: 'Flow', x: 0, y: 0, width: 100, height: 40, parentId: 'frame' },
    { id: 'group', type: 'group', name: 'Group', x: 20, y: 20, width: 200, height: 100 },
    { id: 'child', type: 'text', name: 'Child', x: 30, y: 30, width: 50, height: 50, text: 'hi', parentId: 'group', interactions: [{ trigger: 'click', action: 'toggle', target: 'group' }] },
    { id: 'loose', type: 'shape', name: 'Loose', x: 400, y: 300, width: 50, height: 50 },
  ] };
  doc.pages = [page, { id: 'p2', name: 'Two', width: 600, height: 400, background: '#fff', nodes: [] }];
  doc.timeline = { duration: 2, fps: 30, tracks: [{ id: 't1', nodeId: 'flow', keyframes: [{ time: 0, values: { x: 0 } }, { time: 1, values: { x: 30, opacity: 1 } }] }] };
  return documentSchema.parse(doc);
}

test('captureNodeSelection keeps outermost roots, lifts flow children to page space and shifts their keyframes', () => {
  const doc = fixture();
  const bundle = captureNodeSelection(doc, doc.pages[0], ['flow', 'group', 'child']);
  assert.deepEqual(bundle.nodes.map(n => n.id), ['flow', 'group', 'child']);
  const flow = bundle.nodes.find(n => n.id === 'flow')!;
  assert.equal(flow.parentId, undefined); assert.equal(flow.x, 120); assert.equal(flow.y, 120);
  assert.equal(bundle.tracks.length, 1);
  assert.deepEqual(bundle.tracks[0].keyframes.map(key => key.values.x), [120, 150]);
  assert.equal(bundle.nodes.find(n => n.id === 'child')!.parentId, 'group');
  assert.deepEqual(bundle.origin, { x: 20, y: 20 });
});

test('remintNodeSelection assigns fresh ids, remaps parents and interactions, and offsets roots', () => {
  const doc = fixture();
  const bundle = captureNodeSelection(doc, doc.pages[0], ['group', 'flow']);
  let counter = 0;
  const minted = remintNodeSelection(bundle, { x: 16, y: 16 }, () => `n${++counter}`);
  // Page order is preserved: flow, group, child.
  assert.deepEqual(minted.rootIds, ['n1', 'n2']);
  const group = minted.nodes.find(n => n.id === 'n2')!, child = minted.nodes.find(n => n.parentId === 'n2')!;
  assert.equal(group.x, 36); assert.equal(child.x, 30 + 16);
  assert.equal(child.interactions![0].target, 'n2');
  assert.equal(minted.tracks[0].nodeId, 'n1'); assert.notEqual(minted.tracks[0].id, 't1');
  assert.deepEqual(minted.tracks[0].keyframes.map(key => key.values.x), [136, 166]);
  doc.pages[1].nodes.push(...minted.nodes); doc.timeline!.tracks.push(...minted.tracks);
  documentSchema.parse(doc);
  assert.ok(doc.pages[0].nodes.some(n => n.id === 'group'), 'originals untouched');
});
