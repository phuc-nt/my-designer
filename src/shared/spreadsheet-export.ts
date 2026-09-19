// xlsx and csv exports of the document's `table` nodes. The workbook is
// written directly as OOXML through JSZip (already a shared dependency) so it
// runs wherever the server runs, without a browser or Node-only streams.
import JSZip from 'jszip';
import { pptxColor } from './pptx-export';
import { resolveColor } from './render';
import type { DesignDocument, DesignPage } from './schema';
import { pageTables, tableCsv, tableGrid, type TableData } from './table';

const escapeXml = (value: string) => value.replace(/[<>&"']/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[ch]!));
const NUMBER = /^-?\d+(\.\d+)?$/;
/** Column letters for a zero-based index: 0 → A, 26 → AA. */
export function columnLetters(index: number): string {
  let name = '';
  for (let i = index + 1; i > 0; i = Math.floor((i - 1) / 26)) name = String.fromCharCode(65 + (i - 1) % 26) + name;
  return name;
}
const sheetName = (name: string, index: number, used: Set<string>) => {
  let base = name.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 28) || `Page ${index + 1}`, candidate = base, n = 2;
  while (used.has(candidate.toLowerCase())) candidate = `${base.slice(0, 25)} ${n++}`;
  used.add(candidate.toLowerCase());
  return candidate;
};

/** The first visible table on a page as csv, or `null` when the page has none. */
export function pageCsv(doc: DesignDocument, pageIndex: number): string | null {
  const page = doc.pages[pageIndex];
  const first = page ? pageTables(page.nodes)[0] : undefined;
  return first ? tableCsv(first.table) : null;
}
/** Pages that carry at least one visible table, with their tables in paint order. */
export function spreadsheetPages(doc: DesignDocument): Array<{ page: DesignPage; tables: ReturnType<typeof pageTables> }> {
  return doc.pages.map(page => ({ page, tables: pageTables(page.nodes) })).filter(entry => entry.tables.length > 0);
}

class StyleRegistry {
  fonts = ['<font><sz val="11"/><name val="Calibri"/></font>'];
  fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'];
  xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>'];
  private index = new Map<string, number>();
  private fontIndex = new Map<string, number>([['400|', 0]]);
  private fillIndex = new Map<string, number>();
  style(options: { bold?: boolean; color?: string; fill?: string; align?: string; border?: boolean }): number {
    const key = JSON.stringify(options);
    const known = this.index.get(key); if (known !== undefined) return known;
    const fontKey = `${options.bold ? 700 : 400}|${options.color ?? ''}`;
    let fontId = this.fontIndex.get(fontKey);
    if (fontId === undefined) { fontId = this.fonts.push(`<font>${options.bold ? '<b/>' : ''}<sz val="11"/>${options.color ? `<color rgb="FF${options.color}"/>` : ''}<name val="Calibri"/></font>`) - 1; this.fontIndex.set(fontKey, fontId); }
    let fillId = 0;
    if (options.fill) { fillId = this.fillIndex.get(options.fill) ?? (this.fills.push(`<fill><patternFill patternType="solid"><fgColor rgb="FF${options.fill}"/><bgColor indexed="64"/></patternFill></fill>`) - 1); this.fillIndex.set(options.fill, fillId); }
    const alignment = options.align && options.align !== 'left' ? `<alignment horizontal="${options.align}" vertical="top" wrapText="1"/>` : '<alignment vertical="top" wrapText="1"/>';
    const id = this.xfs.push(`<xf numFmtId="0" fontId="${fontId}" fillId="${fillId}" borderId="${options.border ? 1 : 0}" applyFont="1" applyFill="${fillId ? 1 : 0}" applyBorder="${options.border ? 1 : 0}" applyAlignment="1">${alignment}</xf>`) - 1;
    this.index.set(key, id);
    return id;
  }
  xml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="${this.fonts.length}">${this.fonts.join('')}</fonts><fills count="${this.fills.length}">${this.fills.join('')}</fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${this.xfs.length}">${this.xfs.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  }
}

type SheetCell = { column: number; value: string; style: number };
function sheetXml(doc: DesignDocument, tables: Array<{ node: { name: string; width: number; height: number; style?: Record<string, unknown> }; table: TableData }>, styles: StyleRegistry): string {
  const theme = doc.theme, rows: SheetCell[][] = [], merges: string[] = [], widths: number[] = [];
  const hex = (value: string | undefined, fallback?: string) => value === undefined && fallback === undefined ? undefined : pptxColor(resolveColor(value ?? fallback!, theme, 'transparent'))?.hex;
  const titleStyle = styles.style({ bold: true });
  for (const [index, { node, table }] of tables.entries()) {
    if (index > 0) rows.push([]);
    rows.push([{ column: 0, value: node.name || 'Table', style: titleStyle }]);
    const grid = tableGrid(table, node.width, node.height), origin = rows.length;
    const headerFill = hex(table.headerFill ?? (node.style?.fill as string | undefined), '$accent'), headerColor = hex(table.headerColor, '$background'), bodyFill = hex(table.fill);
    grid.columnEdges.slice(1).forEach((edge, i) => { widths[i] = Math.max(widths[i] ?? 0, (edge - grid.columnEdges[i]) / 7); });
    for (let r = 0; r < grid.rows; r++) rows.push([]);
    for (const cell of grid.cells) {
      const c = cell.cell, style = styles.style({
        bold: cell.header || !!c.bold, align: c.align ?? (cell.header ? 'left' : NUMBER.test(cell.text) ? 'right' : 'left'), border: true,
        fill: c.fill ? hex(c.fill) : cell.header ? headerFill : bodyFill, color: c.color ? hex(c.color) : cell.header ? headerColor : undefined,
      });
      rows[origin + cell.row].push({ column: cell.column, value: cell.text, style });
      if (cell.rowSpan > 1 || cell.colSpan > 1) merges.push(`${columnLetters(cell.column)}${origin + cell.row + 1}:${columnLetters(cell.column + cell.colSpan - 1)}${origin + cell.row + cell.rowSpan}`);
    }
  }
  const cols = widths.length ? `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.min(120, Math.max(6, w)).toFixed(2)}" customWidth="1"/>`).join('')}</cols>` : '';
  const data = rows.map((cells, r) => cells.length ? `<row r="${r + 1}">${cells.sort((a, b) => a.column - b.column).map(cell => {
    const ref = `${columnLetters(cell.column)}${r + 1}`;
    return NUMBER.test(cell.value) ? `<c r="${ref}" s="${cell.style}"><v>${cell.value}</v></c>` : `<c r="${ref}" s="${cell.style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell.value)}</t></is></c>`;
  }).join('')}</row>` : '').join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${cols}<sheetData>${data}</sheetData>${merges.length ? `<mergeCells count="${merges.length}">${merges.map(ref => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells>` : ''}</worksheet>`;
}

/** One worksheet per page that has tables; `null` when the document has no table at all. */
export async function buildXlsx(doc: DesignDocument): Promise<Uint8Array | null> {
  const pages = spreadsheetPages(doc);
  if (!pages.length) return null;
  const zip = new JSZip(), styles = new StyleRegistry(), used = new Set<string>();
  const sheets = pages.map(({ page, tables }, i) => ({ name: sheetName(page.name, doc.pages.indexOf(page), used), xml: sheetXml(doc, tables, styles), id: i + 1 }));
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map(s => `<Override PartName="/xl/worksheets/sheet${s.id}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`);
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map(s => `<sheet name="${escapeXml(s.name)}" sheetId="${s.id}" r:id="rId${s.id}"/>`).join('')}</sheets></workbook>`);
  zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map(s => `<Relationship Id="rId${s.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${s.id}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  for (const sheet of sheets) zip.file(`xl/worksheets/sheet${sheet.id}.xml`, sheet.xml);
  zip.file('xl/styles.xml', styles.xml());
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}
