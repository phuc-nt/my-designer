import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDocument } from '../src/shared/catalog';
import { inspectDesign } from '../src/shared/design-checks';
import { LATIN_ADVANCE, measureText, wrappedLines } from '../src/shared/render';

test('latin text wraps on spaces at the box width', () => {
  // 20px font, 0.52 em per glyph → "hello world" is 11 × 10.4 = 114.4px.
  assert.deepEqual(wrappedLines('hello world', 120, 20), ['hello world']);
  assert.deepEqual(wrappedLines('hello world', 110, 20), ['hello', 'world']);
  assert.deepEqual(wrappedLines('one\n\ntwo', 1000, 20), ['one', '', 'two']);
  assert.deepEqual(wrappedLines('a   b', 1000, 20), ['a b'], 'whitespace runs collapse like the SVG renderer');
  assert.deepEqual(wrappedLines('abcdefgh', 42, 20), ['abcd', 'efgh'], 'a word wider than the box is hard-split');
});

test('east asian characters take a full em and wrap without spaces', () => {
  const text = '一二三四五六七八九十一二三四五六七八'; // 18 ideographs
  assert.equal(measureText(text, 20), 360);
  // Character counting believed 19 fit into 200px; only 10 do.
  assert.deepEqual(wrappedLines(text, 200, 20), ['一二三四五六七八九十', '一二三四五六七八']);
});

test('kinsoku keeps closing punctuation off the start of a line', () => {
  const lines = wrappedLines('日本語です。次の文', 100, 20); // 5 ideographs per line
  assert.equal(lines[0], '日本語です。', 'the full stop hangs on the first line');
  // 3 ideographs per line: "資料「" would end on the bracket, so it carries over.
  assert.deepEqual(wrappedLines('資料「設計」', 60, 20), ['資料', '「設計」'], 'an opening bracket never ends a line');
});

test('combining marks add no width and never separate from their base', () => {
  const nfc = 'Nguyễn Văn Hiển'.normalize('NFC');
  const nfd = nfc.normalize('NFD');
  assert.notEqual(nfc.length, nfd.length);
  assert.ok(Math.abs(measureText(nfd, 16) - measureText(nfc, 16)) < 1e-9);
  assert.ok(Math.abs(measureText(nfc, 16) - nfc.length * LATIN_ADVANCE * 16) < 1e-9);
  const narrow = wrappedLines('ễ'.normalize('NFD').repeat(6), 3 * LATIN_ADVANCE * 16, 16);
  assert.ok(narrow.every(line => line.normalize('NFC').length === 3), narrow.join('|'));
});

test('preflight measures japanese text by width, not by character count', () => {
  const doc = createDocument('slides', 'CJK');
  doc.pages[0].nodes = [{
    id: 'jp', name: 'JP', type: 'text', x: 0, y: 0, width: 300, height: 40,
    text: '製品戦略と四半期の実績についての発表資料', style: { fontSize: 24 },
  }];
  // 20 ideographs × 24px = 480px in a 300px box → two lines → 24 + 28.8 > 40.
  const issues = inspectDesign(doc).issues.filter(issue => issue.nodeId === 'jp');
  assert.ok(issues.some(issue => issue.code === 'text-overflow'), JSON.stringify(issues));
});
