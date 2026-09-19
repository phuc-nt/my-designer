import { test } from 'node:test';
import assert from 'node:assert/strict';
import { snapCandidates, snapDelta } from '../src/app/editor-snapping';

test('snap candidates collect page and box edges plus centres', () => {
  const candidates = snapCandidates({ width: 600, height: 400 }, [{ x: 35, y: 40, width: 220, height: 90 }]);
  assert.deepEqual(candidates.x, [0, 35, 145, 255, 300, 600]);
  assert.deepEqual(candidates.y, [0, 40, 85, 130, 200, 400]);
});

test('snapDelta pulls the nearest edge or centre within the threshold on each axis independently', () => {
  const candidates = snapCandidates({ width: 600, height: 400 }, [{ x: 35, y: 40, width: 220, height: 90 }]);
  const box = { x: 350, y: 60, width: 160, height: 80 };
  // Left edge lands at 252: snaps to alpha's right edge (255); y edges 60/100/140 stay clear of every candidate.
  const snapped = snapDelta(box, -98, 0, candidates, 6);
  assert.equal(snapped.dx, -95); assert.equal(snapped.dy, 0);
  assert.deepEqual(snapped.guides, [{ axis: 'x', at: 255 }]);
  // Centre snapping: box centre 430 + dx → page centre 300 when within threshold.
  const centred = snapDelta(box, -126, 3, candidates, 6);
  assert.equal(centred.dx, -130);
  assert.deepEqual(centred.guides, [{ axis: 'x', at: 300 }]);
  // Outside the threshold nothing changes.
  const free = snapDelta(box, -80, -30, candidates, 6);
  assert.deepEqual(free, { dx: -80, dy: -30, guides: [] });
});

test('snapDelta prefers the closest candidate when several are in range', () => {
  const candidates = { x: [100, 104], y: [] };
  const snapped = snapDelta({ x: 0, y: 0, width: 10, height: 10 }, 103, 0, candidates, 6);
  assert.equal(snapped.dx, 104);
});
