import { test } from 'node:test';
import assert from 'node:assert/strict';
import { documentSchema, uid } from '../src/shared/schema';
import { createDocument, templates, themes } from '../src/shared/catalog';
import { mutateDocument } from '../src/shared/operations';
import { interpolateNode, renderHtml, renderSvg } from '../src/shared/render';

test('catalog documents remain editable and schema-valid across theme variants', () => {
  for (const template of templates) for (const theme of themes) {
    const doc = documentSchema.parse(createDocument(template.kind, template.name, theme.id, template.id)), svg = renderSvg(doc);
    assert.ok(doc.pages[0].nodes.length > 0);
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.includes(`<rect width="100%" height="100%" fill="${theme.colors.background}"/>`));
    assert.ok(renderHtml(doc).includes(theme.colors.background));
    assert.equal(doc.theme.id, theme.id);
    const probe = documentSchema.parse(createDocument('web', 'Theme probe', theme.id));
    assert.ok(renderSvg(probe).includes(`fill="${theme.colors.text}"`));
    const recolored = structuredClone(doc); recolored.theme = structuredClone(themes.find(t => t.id !== theme.id)!);
    assert.notEqual(renderSvg(recolored), svg);
  }
});
test('rendered untrusted content cannot add markup or styling URLs', () => {
  const doc = createDocument('web', '</title><script>alert(1)</script>');
  const node = doc.pages[0].nodes.find(n => n.type === 'text')!;
  node.text = '<img src=x onerror=alert(1)>';
  node.style = { fill: 'url(https://bad.test/secret)', fontFamily: 'Arial" onload="alert(1)', fontSize: 24 };
  const html = renderHtml(doc);
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('url(https://bad'));
  assert.ok(html.includes('&lt;img'));
});
test('invalid parents, repeated IDs, dangerous URLs and dangling timeline tracks fail validation', () => {
  const base = createDocument('web', 'Validation');
  const variants = Array.from({ length: 5 }, () => structuredClone(base));
  variants[0].pages[0].nodes[0].parentId = variants[0].pages[0].nodes[0].id;
  variants[1].pages[0].nodes[1].id = variants[1].pages[0].nodes[0].id;
  variants[2].pages[0].nodes[0].src = 'javascript:alert(1)';
  variants[3].pages[0].nodes[0].width = Infinity;
  variants[4].timeline = { duration: 1, fps: 30, tracks: [{ id: uid(), nodeId: 'missing', keyframes: [] }] };
  for (const doc of variants) assert.equal(documentSchema.safeParse(doc).success, false);
});
test('batched operations are atomic and node removal also removes dependent tracks', () => {
  const doc = createDocument('video', 'Motion');
  const original = structuredClone(doc);
  assert.throws(() => mutateDocument(doc, [{ op: 'rename', name: 'Changed' }, { op: 'remove-node', nodeId: 'missing' }]));
  assert.deepEqual(doc, original);
  const updated = mutateDocument(doc, [{ op: 'remove-node', nodeId: doc.timeline!.tracks[0].nodeId }]);
  assert.equal(updated.timeline!.tracks.length, 1);
  assert.equal(documentSchema.safeParse(updated).success, true);
});
test('motion interpolates numeric keyframes and clamps to each end', () => {
  const doc = createDocument('video', 'Motion'), node = doc.pages[0].nodes[1];
  assert.equal(interpolateNode(node, doc, 0).opacity, 0);
  assert.equal(interpolateNode(node, doc, 0.75).opacity, 0.5);
  assert.equal(interpolateNode(node, doc, 2).opacity, 1);
  assert.equal(interpolateNode(node, doc, 10).opacity, 0);
});
test('uid still mints unique v4 ids where randomUUID is missing, as in the export renderer', () => {
  // Stubbing the property away only pins the shape of the fallback; it cannot prove the
  // renderer works, because a stub is not an insecure context. The real guard is the
  // editable-scene round-trip in `exports-agent-formats.test.ts`, which drives an actual
  // `about:blank` page where `crypto.randomUUID` is genuinely undefined.
  const real = crypto.randomUUID;
  try {
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
    const ids = Array.from({ length: 500 }, () => uid());
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  } finally {
    Object.defineProperty(crypto, 'randomUUID', { value: real, configurable: true });
  }
  assert.match(uid(), /^[0-9a-f]{8}-/);
});
test('applying a theme updates token references without regenerating layout', () => {
  const doc = createDocument('web', 'Theme');
  const changed = mutateDocument(doc, [{ op: 'apply-theme', themeId: 'nocturne' }]);
  assert.deepEqual(changed.pages, doc.pages);
  assert.notEqual(renderSvg(changed), renderSvg(doc));
});
