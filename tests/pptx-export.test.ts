import { test } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';
import { buildPptx, pptxColor, pptxNodeKind } from '../src/shared/pptx-export';
import { createDocument } from '../src/shared/catalog';
import { exportOptionsSchema } from '../src/shared/export-contract';
import { documentSchema, type DesignPage } from '../src/shared/schema';

const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9R8AAAAASUVORK5CYII=';
const EMU = 914400 / 96;

function fixture() {
  const doc = createDocument('slides', 'Editable deck');
  const page: DesignPage = { id: 'p1', name: 'Cover', width: 600, height: 400, background: '#102030', notes: 'Speaker notes survive.', nodes: [
    { id: 'title', type: 'text', name: 'Title', x: 40, y: 30, width: 300, height: 20, text: 'Editable title\nsecond paragraph', style: { fontSize: 32, fontWeight: 700, textAlign: 'center', fill: '#ffffff', lineHeight: 1.4, letterSpacing: 2 } },
    { id: 'card', type: 'shape', name: 'Card', x: 40, y: 120, width: 200, height: 100, style: { fill: '$surface', borderRadius: 12, stroke: '#ff0000', strokeWidth: 4 } },
    { id: 'dot', type: 'shape', name: 'Dot', x: 300, y: 120, width: 60, height: 60, opacity: 0.5, style: { fill: 'rgba(0, 128, 255, 0.5)', shape: 'ellipse' } },
    { id: 'photo', type: 'image', name: 'Photo', x: 400, y: 120, width: 120, height: 80, src: PIXEL, style: { objectFit: 'contain' } },
    { id: 'graph', type: 'chart', name: 'Growth', x: 40, y: 240, width: 240, height: 120, data: { labels: ['Q1', 'Q2', 'Q3'], values: [10, 20, 35] }, style: { fill: '$accent' } },
    { id: 'frame', type: 'frame', name: 'Frame', x: 300, y: 220, width: 260, height: 160, layout: { mode: 'flex', direction: 'column', gap: 8, padding: 20 } },
    { id: 'flow', type: 'text', name: 'Flow', x: 0, y: 0, width: 200, height: 30, text: 'Laid out by the frame', parentId: 'frame' },
    { id: 'hidden', type: 'text', name: 'Hidden', x: 0, y: 0, width: 50, height: 20, text: 'invisible', visible: false },
    { id: 'glyph', type: 'icon', name: 'Glyph', x: 540, y: 20, width: 40, height: 40, data: { icon: 'star' } },
    { id: 'grid', type: 'table', name: 'Budget', x: 40, y: 365, width: 240, height: 30, data: { table: { rows: [[{ text: 'Plan', colSpan: 2 }, 'Cost'], ['Design', 'Q1', '1200']], headerFill: '#112233' } } },
  ] };
  doc.pages = [page, { id: 'p2', name: 'Second', width: 600, height: 400, background: '$background', nodes: [{ id: 'later', type: 'text', name: 'Later', x: 10, y: 10, width: 100, height: 20, text: 'Second slide' }] }];
  return documentSchema.parse(doc);
}
async function slideXml(zip: JSZip, index: number) { return await zip.file(`ppt/slides/slide${index}.xml`)!.async('string'); }

test('the export contract accepts rasterize and defaults it off', () => {
  assert.equal(exportOptionsSchema.parse({ format: 'pptx' }).rasterize, false);
  assert.equal(exportOptionsSchema.parse({ format: 'pptx', rasterize: true }).rasterize, true);
});

test('pptxColor converts CSS colours to PowerPoint hex with alpha', () => {
  assert.deepEqual(pptxColor('#abc'), { hex: 'AABBCC', alpha: 1 });
  assert.deepEqual(pptxColor('#11223380'), { hex: '112233', alpha: 128 / 255 });
  assert.deepEqual(pptxColor('rgba(0, 128, 255, 0.5)'), { hex: '0080FF', alpha: 0.5 });
  assert.deepEqual(pptxColor('white'), { hex: 'FFFFFF', alpha: 1 });
  assert.equal(pptxColor('transparent'), null);
});

test('pptxNodeKind routes primitives to native objects and the rest to pictures', () => {
  const doc = fixture(), kinds = Object.fromEntries(doc.pages[0].nodes.map(n => [n.id, pptxNodeKind(n)]));
  assert.deepEqual(kinds, { title: 'text', card: 'shape', dot: 'shape', photo: 'image', graph: 'chart', frame: 'shape', flow: 'text', hidden: 'skip', glyph: 'raster', grid: 'table' });
});

test('buildPptx writes editable text, shapes, images, charts and notes, rasterising only unsupported layers', async () => {
  const doc = fixture(), deck = new PptxGenJS(), rasterized: string[] = [];
  const report = await buildPptx(deck, doc, { rasterizePage: async () => { throw new Error('whole-page raster must not run'); }, rasterizeNode: async (_, node) => { rasterized.push(`${node.id}@${node.x},${node.y}`); return PIXEL; } });
  assert.deepEqual(rasterized, ['glyph@540,20']);
  assert.deepEqual(report.slides.map(s => [s.mode, s.rasterized]), [['editable', ['Glyph']], ['editable', []]]);
  const zip = await JSZip.loadAsync(await deck.write({ outputType: 'nodebuffer' }) as Buffer);
  const xml = await slideXml(zip, 1);
  // Text: both paragraphs, bold, centred, sized in points, letter spacing and line spacing preserved.
  assert.ok(xml.includes('<a:t>Editable title</a:t>') && xml.includes('<a:t>second paragraph</a:t>'));
  assert.ok(/<a:rPr[^>]*sz="2400"[^>]*b="1"/.test(xml), 'title is 24pt bold');
  assert.ok(xml.includes('algn="ctr"') && xml.includes('<a:spcPct val="140000"/>') && /spc="150"/.test(xml));
  assert.ok(xml.includes('<a:t>Laid out by the frame</a:t>') && !xml.includes('invisible'));
  // The flow child sits where the frame's flex layout puts it (frame origin + padding).
  assert.ok(xml.includes(`<a:off x="${Math.round(320 * EMU)}" y="${Math.round(240 * EMU)}"/>`), 'flow child uses resolved layout coordinates');
  // Shapes: rounded card with a red 3pt stroke, a translucent ellipse, and no stroke on the frame.
  assert.ok(xml.includes('prst="roundRect"') && xml.includes('prst="ellipse"') && xml.includes('prst="rect"'));
  assert.ok(/<a:ln w="38100"[^>]*>\s*<a:solidFill><a:srgbClr val="FF0000"/.test(xml), 'card stroke is 4px = 3pt in red');
  assert.ok(/0080FF"[^]*?<a:alpha val="25000"\/>/.test(xml), 'ellipse combines node opacity with rgba alpha');
  assert.ok(xml.includes('<p:pic>'), 'image and rasterised icon are pictures');
  assert.equal(xml.match(/<p:pic>/g)!.length, 2);
  assert.ok(xml.includes('<c:chart') || xml.includes('graphicFrame'), 'chart is a native graphic frame');
  const chart = await zip.file('ppt/charts/chart1.xml')!.async('string');
  assert.ok(chart.includes('<c:v>Q2</c:v>') && chart.includes('<c:v>35</c:v>'));
  assert.ok(xml.includes('<p:bg>') && xml.includes('102030'), 'slide background comes from the page');
  // Tables: a native table with the header merged across two columns and filled with the header colour.
  assert.ok(xml.includes('<a:tbl>') && xml.includes('<a:t>Design</a:t>') && xml.includes('<a:t>1200</a:t>'), 'table cells are native');
  assert.ok(/<a:tc[^>]*gridSpan="2"/.test(xml), 'colSpan becomes gridSpan');
  assert.ok(/<a:tc[^>]*>[^]*?112233[^]*?<\/a:tc>/.test(xml), 'header fill is applied to the merged cell');
  const notes = await zip.file('ppt/notesSlides/notesSlide1.xml')!.async('string');
  assert.ok(notes.includes('Speaker notes survive.') && notes.includes('Rasterised layers') && notes.includes('Glyph'));
  assert.ok((await slideXml(zip, 2)).includes('<a:t>Second slide</a:t>'));
});

test('buildPptx rasterises whole slides on request and for DOM-only pages', async () => {
  const doc = fixture(), deck = new PptxGenJS(), pages: number[] = [];
  const report = await buildPptx(deck, doc, { rasterize: true, rasterizePage: async index => { pages.push(index); return PIXEL; }, rasterizeNode: async () => { throw new Error('nodes are not rasterised individually'); } });
  assert.deepEqual(pages, [0, 1]);
  assert.equal(report.slides[0].mode, 'raster');
  const zip = await JSZip.loadAsync(await deck.write({ outputType: 'nodebuffer' }) as Buffer);
  const xml = await slideXml(zip, 1);
  assert.equal(xml.match(/<p:pic>/g)!.length, 1); assert.ok(!xml.includes('<a:t>'));
  const web = createDocument('web', 'Structured'), webDeck = new PptxGenJS(), webPages: number[] = [];
  await buildPptx(webDeck, web, { rasterizePage: async index => { webPages.push(index); return PIXEL; }, rasterizeNode: async () => { throw new Error('DOM pages render whole'); } });
  assert.deepEqual(webPages, web.pages.map((_, i) => i));
});
