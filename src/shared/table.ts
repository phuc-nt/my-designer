// The `table` node: rows × columns of cells stored in `node.data.table`. One
// model feeds the SVG renderer, the editor grid, PowerPoint `addTable`, the
// xlsx workbook and csv, so a table looks the same in every output.
import { z } from 'zod';
import type { DesignNode } from './schema';

const finite = z.number().finite();
const color = z.string().max(80);
export const tableCellSchema = z.union([
  z.string().max(5000),
  z.object({
    text: z.string().max(5000).default(''),
    fill: color.optional(), color: color.optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    bold: z.boolean().optional(),
    colSpan: z.number().int().min(1).max(50).optional(), rowSpan: z.number().int().min(1).max(200).optional(),
  }),
]);
export const tableDataSchema = z.object({
  rows: z.array(z.array(tableCellSchema).max(50)).min(1).max(200),
  /** Relative column widths (any positive numbers); equal widths when omitted. */
  columnWidths: z.array(finite.positive()).max(50).optional(),
  /** Leading rows drawn as the header (bold on `headerFill`); default 1, 0 for none. */
  headerRows: z.number().int().min(0).max(10).optional(),
  fontSize: finite.min(6).max(200).optional(),
  cellPadding: finite.min(0).max(200).optional(),
  headerFill: color.optional(), headerColor: color.optional(), fill: color.optional(), border: color.optional(),
});
export type TableCell = z.infer<typeof tableCellSchema>;
export type TableData = z.infer<typeof tableDataSchema>;
export interface TableCellBox { row: number; column: number; rowSpan: number; colSpan: number; x: number; y: number; width: number; height: number; text: string; header: boolean; cell: Exclude<TableCell, string> }
export interface TableGrid { columns: number; rows: number; columnEdges: number[]; rowEdges: number[]; cells: TableCellBox[]; fontSize: number; padding: number }

export const normalizeCell = (cell: TableCell | undefined): Exclude<TableCell, string> => typeof cell === 'string' ? { text: cell } : cell ?? { text: '' };
/** Parse a node's table data; `null` when the node is not a valid table. */
export function tableOf(node: Pick<DesignNode, 'type' | 'data'>): TableData | null {
  if (node.type !== 'table') return null;
  const parsed = tableDataSchema.safeParse(node.data?.table);
  return parsed.success ? parsed.data : null;
}
export function tableColumnCount(table: TableData): number {
  return Math.max(1, ...table.rows.map(row => row.reduce((sum, cell) => sum + (normalizeCell(cell).colSpan ?? 1), 0)));
}
/** Lay the table out inside a `width × height` box: column edges from the relative widths, rows share the height equally. */
export function tableGrid(table: TableData, width: number, height: number): TableGrid {
  const columns = tableColumnCount(table), rows = table.rows.length, header = table.headerRows ?? 1;
  const weights = Array.from({ length: columns }, (_, i) => table.columnWidths?.[i] ?? (table.columnWidths?.length ? table.columnWidths[table.columnWidths.length - 1] : 1));
  const total = weights.reduce((sum, w) => sum + w, 0);
  const columnEdges = [0]; for (const w of weights) columnEdges.push(columnEdges[columnEdges.length - 1] + w / total * width);
  const rowEdges = Array.from({ length: rows + 1 }, (_, i) => i / rows * height);
  const occupied = new Set<string>(), cells: TableCellBox[] = [];
  table.rows.forEach((row, r) => {
    let c = 0;
    for (const raw of row) {
      while (occupied.has(`${r}:${c}`)) c++;
      if (c >= columns) break;
      const cell = normalizeCell(raw), colSpan = Math.min(cell.colSpan ?? 1, columns - c), rowSpan = Math.min(cell.rowSpan ?? 1, rows - r);
      for (let dr = 0; dr < rowSpan; dr++) for (let dc = 0; dc < colSpan; dc++) occupied.add(`${r + dr}:${c + dc}`);
      cells.push({ row: r, column: c, rowSpan, colSpan, x: columnEdges[c], y: rowEdges[r], width: columnEdges[c + colSpan] - columnEdges[c], height: rowEdges[r + rowSpan] - rowEdges[r], text: cell.text, header: r < header, cell });
      c += colSpan;
    }
  });
  return { columns, rows, columnEdges, rowEdges, cells, fontSize: table.fontSize ?? 14, padding: table.cellPadding ?? 8 };
}
/** Plain string matrix (spanned cells become empty strings), the shape csv and spreadsheets want. */
export function tableMatrix(table: TableData): string[][] {
  const grid = tableGrid(table, 1, 1);
  const matrix = Array.from({ length: grid.rows }, () => Array.from({ length: grid.columns }, () => ''));
  for (const cell of grid.cells) matrix[cell.row][cell.column] = cell.text;
  return matrix;
}
const csvField = (value: string) => /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
export function tableCsv(table: TableData): string {
  return tableMatrix(table).map(row => row.map(csvField).join(',')).join('\r\n') + '\r\n';
}
/** Every visible table node on a page, in paint order, with its parsed data. */
export function pageTables(nodes: DesignNode[]): Array<{ node: DesignNode; table: TableData }> {
  return nodes.filter(node => node.visible !== false).flatMap(node => { const table = tableOf(node); return table ? [{ node, table }] : []; });
}
/** Starter table for the catalog block and the editor's add button. */
export function defaultTable(): TableData {
  return { rows: [['Item', 'Q1', 'Q2', 'Q3'], ['Discover', '12', '18', '24'], ['Design', '8', '15', '21'], ['Deliver', '5', '11', '19']], headerRows: 1 };
}
