// Editable PowerPoint export shared by the browser renderer and Node tests.
// Text becomes real text boxes, primitives become shapes, images and charts
// stay native; only layers PowerPoint cannot express are rasterised.
import type PptxGenJS from 'pptxgenjs';
import { resolveLayout } from './layout';
import { interpolateNode, resolveColor, resolveFont, wrappedLines } from './render';
import { parseLiveArtifact } from './live-artifact';
import type { DesignDocument, DesignNode, DesignPage } from './schema';

const PX_PER_INCH = 96;
const NAMED_COLORS: Record<string, string> = { white: 'FFFFFF', black: '000000', red: 'FF0000', green: '008000', blue: '0000FF', yellow: 'FFFF00', gray: '808080', grey: '808080', silver: 'C0C0C0', orange: 'FFA500', purple: '800080', navy: '000080', teal: '008080', maroon: '800000', olive: '808000', lime: '00FF00', aqua: '00FFFF', cyan: '00FFFF', magenta: 'FF00FF', fuchsia: 'FF00FF', pink: 'FFC0CB', brown: 'A52A2A', beige: 'F5F5DC', ivory: 'FFFFF0' };

/** CSS colour → PowerPoint hex plus alpha (0..1); `null` for transparent/none. */
export function pptxColor(value: string): { hex: string; alpha: number } | null {
  const color = value.trim().toLowerCase();
  if (!color || color === 'none' || color === 'transparent') return null;
  const hex = color.match(/^#([0-9a-f]{3,8})$/)?.[1];
  if (hex) {
    const digits = hex.length <= 4 ? [...hex].map(d => d + d).join('') : hex;
    if (digits.length !== 6 && digits.length !== 8) return null;
    return { hex: digits.slice(0, 6).toUpperCase(), alpha: digits.length === 8 ? parseInt(digits.slice(6), 16) / 255 : 1 };
  }
  const rgb = color.match(/^rgba?\(([^)]+)\)$/)?.[1].split(/[\s,/]+/).filter(Boolean);
  if (rgb && rgb.length >= 3) {
    const channel = (part: string) => Math.max(0, Math.min(255, Math.round(part.endsWith('%') ? parseFloat(part) * 2.55 : parseFloat(part))));
    const alpha = rgb[3] === undefined ? 1 : rgb[3].endsWith('%') ? parseFloat(rgb[3]) / 100 : parseFloat(rgb[3]);
    return { hex: rgb.slice(0, 3).map(part => channel(part).toString(16).padStart(2, '0')).join('').toUpperCase(), alpha: Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1 };
  }
  return NAMED_COLORS[color] ? { hex: NAMED_COLORS[color], alpha: 1 } : null;
}
/** Interactive components only exist in the DOM renderer, so their pages are rasterised whole. */
export const pageNeedsPicture = (page: DesignPage) => page.nodes.some(n => n.type === 'component' && n.visible !== false);
export const pageUsesScene = (doc: DesignDocument, page: DesignPage) => doc.kind === '3d' || !!page.scene || page.nodes.some(n => !!n.scene);

export type PptxNodeKind = 'text' | 'shape' | 'image' | 'chart' | 'raster' | 'skip';
const RASTER_IMAGE = /^data:image\/(png|jpeg|gif)/;
export function pptxNodeKind(node: DesignNode): PptxNodeKind {
  if (node.visible === false || node.type === 'group') return 'skip';
  if (parseLiveArtifact(node.data)) return 'raster';
  if (node.type === 'text') return 'text';
  if (node.type === 'image') return node.src && RASTER_IMAGE.test(node.src) ? 'image' : 'raster';
  if (node.type === 'chart') return Array.isArray(node.data?.values) && node.data.values.some(v => typeof v === 'number') ? 'chart' : 'raster';
  if (node.type === 'shape' || node.type === 'frame') return 'shape';
  return 'raster';
}
/** Visible nodes in paint order with page-space boxes, optionally posed at a timeline instant. */
export function pptxSlideNodes(doc: DesignDocument, page: DesignPage, time?: number): DesignNode[] {
  const posed = time === undefined ? page : { ...page, nodes: page.nodes.map(node => interpolateNode(node, doc, time)) };
  return resolveLayout(posed).nodes.filter(node => node.visible !== false);
}

export type PptxExportOptions = {
  /** Render every slide as one picture (the legacy behaviour). */
  rasterize?: boolean;
  /** Timeline instant to pose animated nodes at; raw node values when omitted. */
  time?: number;
  /** PNG data URL of a whole page. */
  rasterizePage: (pageIndex: number) => Promise<string>;
  /** PNG data URL of one page-space node drawn alone at its own size, without rotation. */
  rasterizeNode: (pageIndex: number, node: DesignNode) => Promise<string>;
};
export type PptxExportReport = { slides: Array<{ page: string; mode: 'editable' | 'raster'; rasterized: string[] }> };

const num = (value: unknown, fallback: number, min = -100000, max = 100000) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const transparencyOf = (opacity: number | undefined, alpha: number) => Math.round((1 - num(opacity, 1, 0, 1) * alpha) * 100);

export async function buildPptx(deck: PptxGenJS, doc: DesignDocument, options: PptxExportOptions): Promise<PptxExportReport> {
  const first = doc.pages[0], theme = doc.theme, report: PptxExportReport = { slides: [] };
  const slideWidth = first.width / PX_PER_INCH, slideHeight = first.height / PX_PER_INCH;
  deck.defineLayout({ name: 'STUDIO', width: slideWidth, height: slideHeight }); deck.layout = 'STUDIO'; deck.title = doc.name;
  const textColor = pptxColor(resolveColor('$text', theme))?.hex ?? '000000';
  for (const [pageIndex, page] of doc.pages.entries()) {
    const slide = deck.addSlide();
    const background = pptxColor(resolveColor(page.background, theme, '#ffffff'));
    if (background) slide.background = { color: background.hex };
    const notes: string[] = page.notes ? [page.notes] : [];
    if (options.rasterize || pageNeedsPicture(page) || pageUsesScene(doc, page)) {
      slide.addImage({ x: 0, y: 0, w: slideWidth, h: slideHeight, data: await options.rasterizePage(pageIndex) });
      if (!page.notes) notes.push(`${page.name}: rendered as one picture${options.rasterize ? '' : ' because the page uses interactive components or a 3D scene'}.`);
      slide.addNotes(notes.join('\n\n'));
      report.slides.push({ page: page.id, mode: 'raster', rasterized: page.nodes.filter(n => n.visible !== false).map(n => n.name) });
      continue;
    }
    // Pages may differ in size; scale each into the deck's slide box.
    const sx = first.width / page.width / PX_PER_INCH, sy = first.height / page.height / PX_PER_INCH;
    const rasterized: string[] = [];
    for (const node of pptxSlideNodes(doc, page, options.time)) {
      const kind = pptxNodeKind(node);
      if (kind === 'skip') continue;
      const style = node.style ?? {};
      const box = { x: node.x * sx, y: node.y * sy, w: Math.max(0.01, node.width * sx), h: Math.max(0.01, node.height * sy), rotate: num(node.rotation, 0) % 360 };
      if (kind === 'text') {
        const size = num(style.fontSize, 24, 1, 1000), lineHeight = num(style.lineHeight, 1.2, 0.5, 4);
        const lines = wrappedLines(node.text ?? '', node.width, size).length;
        const color = pptxColor(resolveColor(style.fill ?? '$text', theme)) ?? { hex: textColor, alpha: 1 };
        slide.addText(node.text ?? '', {
          ...box, h: Math.max(box.h, lines * size * lineHeight * sy),
          fontFace: resolveFont(style.fontFamily, theme), fontSize: size * 0.75, color: color.hex,
          bold: num(style.fontWeight, 400, 100, 900) >= 600, italic: style.fontStyle === 'italic',
          align: style.textAlign === 'center' ? 'center' : style.textAlign === 'right' ? 'right' : 'left', valign: 'top',
          lineSpacingMultiple: lineHeight, charSpacing: style.letterSpacing ? num(style.letterSpacing, 0, -100, 100) * 0.75 : undefined,
          margin: 0, wrap: true, fit: 'none', transparency: transparencyOf(node.opacity, color.alpha),
        });
      } else if (kind === 'shape') {
        const fill = pptxColor(resolveColor(style.fill ?? '$surface', theme, 'transparent'));
        const stroke = pptxColor(resolveColor(style.stroke, theme, 'transparent')), strokeWidth = num(style.strokeWidth, 0, 0, 100);
        const radius = num(style.borderRadius, node.type === 'frame' ? theme.radius : 0, 0, 10000);
        const ellipse = style.shape === 'ellipse' || node.data?.shape === 'ellipse', line = style.shape === 'line';
        const lineProps = stroke && strokeWidth > 0 ? { color: stroke.hex, width: strokeWidth * 0.75, transparency: transparencyOf(node.opacity, stroke.alpha) } : { type: 'none' as const };
        if (line) { slide.addShape(deck.ShapeType.line, { ...box, line: stroke && strokeWidth > 0 ? lineProps : { color: fill?.hex ?? textColor, width: 0.75 } }); continue; }
        slide.addShape(ellipse ? deck.ShapeType.ellipse : radius > 0 ? deck.ShapeType.roundRect : deck.ShapeType.rect, {
          ...box, fill: fill ? { color: fill.hex, transparency: transparencyOf(node.opacity, fill.alpha) } : { type: 'none' }, line: lineProps,
          ...(!ellipse && radius > 0 ? { rectRadius: Math.min(radius * sx, Math.min(box.w, box.h) / 2) } : {}),
        });
      } else if (kind === 'image') {
        slide.addImage({ ...box, data: node.src!, sizing: { type: style.objectFit === 'contain' ? 'contain' : 'cover', w: box.w, h: box.h }, transparency: transparencyOf(node.opacity, 1) });
      } else if (kind === 'chart') {
        const values = (node.data!.values as unknown[]).slice(0, 30).map(v => num(v, 0, 0, 1000000));
        const labels = Array.isArray(node.data?.labels) ? node.data.labels : [];
        const chartType = String(node.data?.chartType ?? 'bar'), types = deck.ChartType;
        const type = chartType === 'line' ? types.line : chartType === 'pie' ? types.pie : chartType === 'doughnut' ? types.doughnut : chartType === 'area' ? types.area : types.bar;
        const fill = pptxColor(resolveColor(style.fill ?? '$accent', theme))?.hex ?? textColor;
        slide.addChart(type, [{ name: node.name || 'Series', labels: values.map((value, i) => String(labels[i] ?? value).slice(0, 30)), values }], {
          x: box.x, y: box.y, w: box.w, h: box.h, barDir: 'col', chartColors: [fill], showLegend: false, catAxisLabelColor: textColor, valAxisLabelColor: textColor, valGridLine: { style: 'none' },
        });
      } else {
        slide.addImage({ ...box, data: await options.rasterizeNode(pageIndex, node), transparency: transparencyOf(node.opacity, 1) });
        rasterized.push(node.name || node.type);
      }
    }
    if (rasterized.length) notes.push(`Rasterised layers (edit them in the studio, not in PowerPoint): ${rasterized.join(', ')}.`);
    if (notes.length) slide.addNotes(notes.join('\n\n'));
    report.slides.push({ page: page.id, mode: 'editable', rasterized });
  }
  return report;
}
