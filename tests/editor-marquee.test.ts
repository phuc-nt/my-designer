import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nodesInRect, normalizeRect } from '../src/app/editor-marquee';
import { resolveLayout } from '../src/shared/layout';
import type { DesignPage } from '../src/shared/schema';

const page: DesignPage = { id: 'p', name: 'P', width: 600, height: 400, background: '#fff', nodes: [
  { id: 'group', type: 'group', name: 'Group', x: 20, y: 20, width: 200, height: 100 },
  { id: 'child', type: 'shape', name: 'Child', x: 20, y: 20, width: 50, height: 50, parentId: 'group' },
  { id: 'beta', type: 'shape', name: 'Beta', x: 300, y: 50, width: 100, height: 60 },
  { id: 'hidden', type: 'shape', name: 'Hidden', x: 320, y: 60, width: 10, height: 10, visible: false },
  { id: 'partial', type: 'shape', name: 'Partial', x: 500, y: 300, width: 200, height: 60 },
] };

test('normalizeRect accepts drags in any direction', () => {
  assert.deepEqual(normalizeRect(50, 80, 10, 20), { x: 10, y: 20, width: 40, height: 60 });
});

test('nodesInRect returns outermost fully enclosed visible nodes', () => {
  const boxes = resolveLayout(page).nodes;
  assert.deepEqual(nodesInRect(page, boxes, { x: 0, y: 0, width: 450, height: 200 }), ['group', 'beta']);
  assert.deepEqual(nodesInRect(page, boxes, { x: 10, y: 10, width: 70, height: 70 }), ['child']);
  assert.deepEqual(nodesInRect(page, boxes, { x: 480, y: 280, width: 100, height: 100 }), []);
});
