import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alignBoxes, boundsOf, distributeBoxes } from '../src/shared/alignment';

const box = (id: string, x: number, y: number, width = 40, height = 30) => ({ id, x, y, width, height });
const moved = (boxes: ReturnType<typeof box>[], moves: Map<string, { dx: number; dy: number }>) => boxes.map(b => ({ ...b, x: b.x + moves.get(b.id)!.dx, y: b.y + moves.get(b.id)!.dy }));

test('bounds cover every box', () => {
  assert.deepEqual(boundsOf([box('a', 10, 20), box('b', 100, 50, 20, 80)]), { x: 10, y: 20, width: 110, height: 110 });
  assert.deepEqual(boundsOf([]), { x: 0, y: 0, width: 0, height: 0 });
});

test('alignment moves boxes to the selection edge, centre or a given target', () => {
  const boxes = [box('a', 10, 20), box('b', 100, 50, 20, 80), box('c', 50, 0, 10, 10)];
  assert.deepEqual(moved(boxes, alignBoxes(boxes, 'left')).map(b => b.x), [10, 10, 10]);
  assert.deepEqual(moved(boxes, alignBoxes(boxes, 'right')).map(b => b.x + b.width), [120, 120, 120]);
  assert.deepEqual(moved(boxes, alignBoxes(boxes, 'center')).map(b => b.x + b.width / 2), [65, 65, 65]);
  assert.deepEqual(moved(boxes, alignBoxes(boxes, 'top')).map(b => b.y), [0, 0, 0]);
  assert.deepEqual(moved(boxes, alignBoxes(boxes, 'bottom')).map(b => b.y + b.height), [130, 130, 130]);
  assert.deepEqual(moved(boxes, alignBoxes(boxes, 'middle')).map(b => b.y + b.height / 2), [65, 65, 65]);
  // Vertical alignment never touches x and vice versa.
  assert.deepEqual(moved(boxes, alignBoxes(boxes, 'middle')).map(b => b.x), [10, 100, 50]);
  const page = { x: 0, y: 0, width: 400, height: 300 };
  assert.deepEqual(moved(boxes, alignBoxes(boxes, 'center', page)).map(b => b.x + b.width / 2), [200, 200, 200]);
  assert.deepEqual(moved(boxes, alignBoxes(boxes, 'bottom', page)).map(b => b.y + b.height), [300, 300, 300]);
});

test('distribution equalises gaps between the outer boxes or packs at a fixed gap', () => {
  const boxes = [box('c', 200, 0, 20), box('a', 0, 0, 40), box('b', 50, 0, 10)];
  const equal = moved(boxes, distributeBoxes(boxes, 'horizontal'));
  const byId = Object.fromEntries(equal.map(b => [b.id, b]));
  // Span 0..220 holds 70px of boxes → 75px gaps: a 0-40, b 115-125, c 200-220.
  assert.equal(byId.a.x, 0); assert.equal(byId.b.x, 115); assert.equal(byId.c.x, 200);
  assert.deepEqual(equal.map(b => b.y), [0, 0, 0]);
  const packed = Object.fromEntries(moved(boxes, distributeBoxes(boxes, 'horizontal', 8)).map(b => [b.id, b]));
  assert.equal(packed.a.x, 0); assert.equal(packed.b.x, 48); assert.equal(packed.c.x, 66);
  const vertical = Object.fromEntries(moved([box('a', 0, 0, 40, 10), box('b', 0, 100, 40, 10), box('c', 0, 30, 40, 10)], distributeBoxes([box('a', 0, 0, 40, 10), box('b', 0, 100, 40, 10), box('c', 0, 30, 40, 10)], 'vertical')).map(b => [b.id, b]));
  assert.equal(vertical.c.y, 50); assert.equal(vertical.b.y, 100);
  assert.deepEqual([...distributeBoxes([box('only', 5, 5)], 'vertical').values()], [{ dx: 0, dy: 0 }]);
});
