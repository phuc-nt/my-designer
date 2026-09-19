import { test } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { documentSchema, type DesignNode } from '../src/shared/schema';
import { createDocument, blocks } from '../src/shared/catalog';
import { readableTextOn, renderSvg } from '../src/shared/render';
import { inspectDesign } from '../src/shared/design-checks';
import { defaultTable, tableCsv, tableGrid, tableMatrix, tableOf } from '../src/shared/table';
import { buildXlsx, columnLetters, pageCsv } from '../src/shared/spreadsheet-export';

const tableNode = (data: unknown, extra: Partial<DesignNode> = {}): DesignNode => ({ id: 'grid', type: 'table', name: 'Budget', x: 20, y: 20, width: 400, height: 120, data: { table: data }, ...extra });
function docWith(node: DesignNode) {
  const doc = createDocument('report', 'Tables');
  doc.pages[0].nodes.push(node);
  return doc;
}

test('table nodes validate their cells and reject malformed data', () => {
  assert.ok(documentSchema.safeParse(docWith(tableNode(defaultTable()))).success);
  assert.ok(documentSchema.safeParse(docWith(tableNode({ rows: [['a', { text: 'b', colSpan: 2, bold: true }], ['c']], headerRows: 0 }))).success);
  const empty = documentSchema.safeParse(docWith(tableNode({ rows: [] })));
  assert.ok(!empty.success); assert.match(empty.error!.issues[0].message, /Table node grid needs data\.table/);
  assert.ok(!documentSchema.safeParse(docWith(tableNode(undefined))).success);
  assert.ok(!documentSchema.safeParse(docWith(tableNode({ rows: [[{ text: 'x', colSpan: 0 }]] }))).success);
  assert.equal(tableOf({ type: 'text', data: { table: defaultTable() } }), null);
});

test('tableGrid lays out spans and relative widths; csv escapes what needs escaping', () => {
  const grid = tableGrid({ rows: [[{ text: 'Head', colSpan: 2 }, 'C'], ['a', 'b', 'c'], [{ text: 'tall', rowSpan: 2 }, 'x', 'y'], ['p', 'q']], columnWidths: [1, 1, 2] }, 400, 200);
  assert.equal(grid.columns, 3); assert.equal(grid.rows, 4);
  assert.deepEqual(grid.columnEdges, [0, 100, 200, 400]);
  const head = grid.cells[0]; assert.deepEqual([head.x, head.width, head.colSpan, head.header], [0, 200, 2, true]);
  const tall = grid.cells.find(c => c.text === 'tall')!; assert.deepEqual([tall.rowSpan, tall.height], [2, 100]);
  const p = grid.cells.find(c => c.text === 'p')!; assert.equal(p.column, 1, 'the row after a rowSpan skips the occupied column');
  assert.deepEqual(tableMatrix({ rows: [[{ text: 'Head', colSpan: 2 }, 'C'], ['a', 'b', 'c']] }), [['Head', '', 'C'], ['a', 'b', 'c']]);
  assert.equal(tableCsv({ rows: [['Name', 'Note'], ['Ann', 'says "hi", twice'], ['Bo', 'line\nbreak']] }), 'Name,Note\r\nAnn,"says ""hi"", twice"\r\nBo,"line\nbreak"\r\n');
});

test('tables render as a grid in SVG, count as content for design checks and ship as a catalog block', () => {
  const doc = documentSchema.parse(docWith(tableNode({ rows: [['Item', 'Q1'], ['Discover', '12']], headerFill: '#123456' })));
  const svg = renderSvg(doc);
  assert.ok(svg.includes('>Item<') && svg.includes('>Discover<') && svg.includes('fill="#123456"'), 'cells and the header fill are drawn');
  assert.ok((svg.match(/<rect x="[\d.]+" y="[\d.]+" width="[\d.]+" height="[\d.]+" fill="[^"]*" stroke=/g) ?? []).length >= 4, 'one bordered rect per cell');
  const headerText = svg.match(/<text fill="([^"]+)"[^>]*font-weight="700"/)?.[1];
  assert.ok(headerText && ['#ffffff', '#fff', 'white'].includes(headerText.toLowerCase()) || (headerText && (readableTextOn('#123456', doc.theme) === headerText)), `dark header fill gets a light header text, got ${headerText}`);
  assert.equal(readableTextOn('#ffffff', doc.theme).toLowerCase() === '#ffffff', false, 'a white fill never gets white text');
  const codes = inspectDesign(doc).issues.map(issue => issue.code);
  assert.ok(!codes.includes('empty-page'));
  const block = blocks.find(b => b.id === 'table')!;
  assert.equal(block.nodes[0].type, 'table'); assert.ok(tableOf(block.nodes[0]));
});

test('buildXlsx writes one sheet per page with tables, merges spans and keeps numbers numeric', async () => {
  const doc = documentSchema.parse(docWith(tableNode({ rows: [[{ text: 'Plan', colSpan: 2 }, 'Cost'], ['Design', 'Q1', '1200'], ['Build', 'Q2', '3400.5']], headerFill: '#112233' })));
  doc.pages.push({ id: 'p2', name: 'No tables', width: 800, height: 600, background: '$background', nodes: [] });
  doc.pages.push({ id: 'p3', name: 'Second: sheet/with*bad?chars', width: 800, height: 600, background: '$background', nodes: [tableNode({ rows: [['only']] }, { id: 'second', name: 'Second table' })] });
  const bytes = (await buildXlsx(doc))!;
  const zip = await JSZip.loadAsync(bytes);
  const workbook = await zip.file('xl/workbook.xml')!.async('string');
  assert.ok(workbook.includes('sheetId="1"') && workbook.includes('sheetId="2"') && !workbook.includes('sheetId="3"'), 'pages without tables get no sheet');
  assert.ok(workbook.includes('name="Second  sheet with bad chars"'), 'sheet names drop characters Excel rejects');
  const sheet = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
  assert.ok(sheet.includes('<c r="A1" s="1" t="inlineStr"><is><t xml:space="preserve">Budget</t></is></c>'), 'the node name titles the table');
  assert.ok(sheet.includes('<t xml:space="preserve">Plan</t>') && sheet.includes('<mergeCell ref="A2:B2"/>'), 'colSpan becomes a merged range below the title row');
  assert.ok(sheet.includes('<c r="C3" s="') && /<c r="C3" s="\d+"><v>1200<\/v><\/c>/.test(sheet) && sheet.includes('<v>3400.5</v>'), 'numeric text is stored as numbers');
  const styles = await zip.file('xl/styles.xml')!.async('string');
  assert.ok(styles.includes('rgb="FF112233"'), 'header fill reaches the stylesheet');
  assert.ok((await zip.file('[Content_Types].xml')!.async('string')).includes('/xl/worksheets/sheet2.xml'));
  assert.equal(await buildXlsx(createDocument('web', 'Plain')), null);
  assert.equal(pageCsv(doc, 0), 'Plan,,Cost\r\nDesign,Q1,1200\r\nBuild,Q2,3400.5\r\n');
  assert.equal(pageCsv(doc, 1), null);
  assert.deepEqual([0, 25, 26, 701].map(columnLetters), ['A', 'Z', 'AA', 'ZZ']);
});
