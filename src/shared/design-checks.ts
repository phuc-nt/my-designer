import type { DesignDocument, DesignNode } from './schema';
import { resolveLayout } from './layout';
import { measureText, resolveColor, wrappedLines } from './render';
import { area, containsPoint, overlapArea, type Rect } from './geometry';

export interface DesignIssue {
  code: string;
  severity: 'warning' | 'info';
  pageId?: string;
  nodeId?: string;
  message: string;
  suggestion: string;
}
function luminance(hex: string): number | null {
  if (/^#[0-9a-f]{3}$/i.test(hex)) hex = '#' + [...hex.slice(1)].map(c => c + c).join('');
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
const CONTAINER_TYPES = new Set(['frame', 'shape', 'component']);
const CONTENT_TYPES = new Set(['text', 'image', 'chart', 'icon', 'video']);
const EDGE_KINDS = new Set(['web', 'slides', 'report']);
const isBackdrop = (node: DesignNode) => (node.type === 'frame' || node.type === 'shape') && node.style?.shape !== 'line' && (node.opacity === undefined || node.opacity >= 1);
const isContainer = (node: DesignNode) => CONTAINER_TYPES.has(node.type) && node.style?.shape !== 'line' && node.width >= 24 && node.height >= 24;
const ancestors = (byId: Map<string, DesignNode>, node: DesignNode) => {
  const ids = new Set<string>();
  for (let parent = node.parentId ? byId.get(node.parentId) : undefined; parent && !ids.has(parent.id); parent = parent.parentId ? byId.get(parent.parentId) : undefined) ids.add(parent.id);
  return ids;
};
/** Estimated ink extent of a text layer in page space: wrapped line count and the widest line. */
function textExtent(node: DesignNode): Rect & { lines: string[]; size: number } {
  const size = typeof node.style?.fontSize === 'number' ? Math.min(1000, Math.max(1, node.style.fontSize)) : 24;
  const leading = typeof node.style?.lineHeight === 'number' ? Math.min(4, Math.max(.5, node.style.lineHeight)) : 1.2;
  const lines = wrappedLines(node.text ?? '', node.width, size);
  const width = Math.max(node.width, ...lines.map(line => measureText(line, size)));
  return { x: node.x, y: node.y, width, height: size + (lines.length - 1) * size * leading, lines, size };
}

/** Deterministic preflight findings are actionable hints, not an aesthetic score. */
export function inspectDesign(document: DesignDocument) {
  const issues: DesignIssue[] = [];
  let warnings = 0, information = 0;
  const add = (issue: DesignIssue) => {
    if (issue.severity === 'warning') warnings++; else information++;
    if (issues.length < 200) issues.push(issue);
  };
  for (const page of document.pages) {
    // Resolved boxes are page-absolute and in paint order, so flow children and nested frames are
    // judged where they actually render; declared nodes keep the parent chain.
    const declared = new Map(page.nodes.map(node => [node.id, node]));
    const painted = resolveLayout(page).nodes;
    if (!painted.some(node => node.visible !== false)) add({code:'empty-page', severity:'warning', pageId:page.id, message:'This page has no visible content.', suggestion:'Add content or remove the unused page before sharing.'});
    const texts: Array<{ node: DesignNode; extent: Rect; lines: number }> = [];
    const edgeX = page.width * 0.02, edgeY = page.height * 0.02;
    for (const [index, node] of painted.entries()) {
      if (node.visible === false) continue;
      const finding = (code: string, message: string, suggestion: string, severity: DesignIssue['severity'] = 'warning') => add({code, severity, pageId:page.id, nodeId:node.id, message, suggestion});
      if (node.width === 0 || node.height === 0) finding('zero-size', 'This layer has no visible area.', 'Set a positive width and height, or hide the layer.');
      const outside = node.x < 0 || node.y < 0 || node.x + node.width > page.width || node.y + node.height > page.height;
      if (outside) finding('outside-page', 'Part of this layer lies outside the page bounds.', 'Check whether the crop is intentional; otherwise move or resize the layer.');
      else if (EDGE_KINDS.has(document.kind) && CONTENT_TYPES.has(node.type) && node.width > 0 && node.height > 0) {
        const nearX = (node.x < edgeX || page.width - node.x - node.width < edgeX) && node.width < page.width * 0.95;
        const nearY = (node.y < edgeY || page.height - node.y - node.height < edgeY) && node.height < page.height * 0.95;
        if (nearX || nearY) finding('crowded-edge', 'This layer sits within 2% of the page edge.', 'Leave a consistent margin unless the layer is meant to bleed off the page.', 'info');
      }
      if (['image', 'audio', 'video'].includes(node.type) && !node.src)
        finding('missing-media', 'This media layer has no source.', 'Upload an asset and assign its URL before export.');
      if (node.src?.startsWith('https:')) finding('remote-media', 'This layer depends on a remote URL; cloud binary export requires an imported asset.', 'Import the media into this project and use its owned asset URL.');
      if (node.type === 'chart' && (!Array.isArray(node.data?.values) || !node.data.values.length))
        finding('empty-chart', 'This chart has no data values.', 'Provide chart data and labels.');
      if (node.type !== 'text') continue;
      if (!node.text?.trim()) { finding('empty-text', 'This text layer is empty.', 'Add final copy or remove the unused layer.'); continue; }
      const extent = textExtent(node), size = extent.size;
      texts.push({ node, extent, lines: extent.lines.length });
      if (extent.height > node.height + 1)
        finding('text-overflow', `Rendered text needs about ${Math.ceil(extent.height)}px for ${extent.lines.length} line${extent.lines.length === 1 ? '' : 's'} but the layer is ${node.height}px tall.`, 'Increase height/width, shorten the copy, or adjust font size and line height.');
      if (size < 12) finding('small-text', `Text is ${size}px at the native page size.`, 'Check readability at the intended viewing size.', 'info');
      // The text spills out of the nearest container painted beneath it (a card, a panel, a frame).
      const container = painted.slice(0, index).reverse().find(other => other.visible !== false && isContainer(other) && containsPoint(other, node.x, node.y));
      if (container) {
        const overRight = extent.x + extent.width - (container.x + container.width), overBottom = extent.y + extent.height - (container.y + container.height);
        if (overRight > 1 || overBottom > 1)
          finding('text-spills-container', `Text extends ${Math.ceil(Math.max(overRight, overBottom))}px past the ${overBottom > overRight ? 'bottom' : 'right'} edge of "${container.name || container.type}".`, 'Enlarge the container, shrink the text, or move the text so it stays inside.');
      }
      // Contrast is measured against the topmost opaque frame/shape under the text centre, then the parent, then the page.
      const centreX = node.x + node.width / 2, centreY = node.y + node.height / 2;
      const backdrop = painted.slice(0, index).reverse().find(other => other.visible !== false && isBackdrop(other) && containsPoint(other, centreX, centreY));
      const parent = node.parentId ? declared.get(node.parentId) : undefined;
      const behind = backdrop ?? (parent && (parent.type === 'frame' || parent.type === 'shape') ? parent : undefined);
      const background = behind ? behind.style?.fill ?? '$surface' : page.background;
      const foregroundL = luminance(resolveColor(node.style?.fill ?? '$text', document.theme));
      const backgroundL = luminance(resolveColor(background, document.theme));
      if (foregroundL === null || backgroundL === null || node.opacity !== undefined && node.opacity < 1) continue;
      const ratio = (Math.max(foregroundL, backgroundL) + .05) / (Math.min(foregroundL, backgroundL) + .05);
      const large = size >= 24 || size >= 18.67 && Number(node.style?.fontWeight ?? 400) >= 700;
      if (ratio < (large ? 3 : 4.5)) finding('text-contrast', `Estimated text contrast is ${ratio.toFixed(2)}:1 against ${behind ? `"${behind.name || behind.type}"` : 'the page background'}; ${large ? 3 : 4.5}:1 is needed.`, 'Check the actual composite preview; adjust text or background color if needed.');
    }
    // Two text layers whose rendered boxes overlap by more than a fifth of the smaller one collide.
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], b = texts[j];
      if (ancestors(declared, a.node).has(b.node.id) || ancestors(declared, b.node).has(a.node.id)) continue;
      const boxA = { x: a.node.x, y: a.node.y, width: a.node.width, height: Math.max(a.node.height, a.extent.height) };
      const boxB = { x: b.node.x, y: b.node.y, width: b.node.width, height: Math.max(b.node.height, b.extent.height) };
      const overlap = overlapArea(boxA, boxB), smaller = Math.min(area(boxA), area(boxB));
      if (smaller > 0 && overlap > smaller * 0.2)
        add({code:'text-collision', severity:'warning', pageId:page.id, nodeId:b.node.id, message:`This text overlaps "${a.node.name || a.node.id}" by ${Math.round(overlap / smaller * 100)}% of the smaller layer (${a.lines} vs ${b.lines} lines).`, suggestion:'Move or resize one layer, or shorten the copy so the rendered boxes stop intersecting.'});
    }
    if (page.nodes.length > 500) add({code:'dense-page',severity:'info',pageId:page.id,message:`This page contains ${page.nodes.length} layers.`,suggestion:'Check interaction speed on a phone and remove unnecessary layers.'});
  }
  if (document.timeline && document.timeline.duration > 60) add({code:'export-duration',severity:'warning',message:'The timeline exceeds the 60-second cloud video export limit.',suggestion:'Split the work into shorter scenes for cloud video export.'});
  return {issues, counts:{warnings, information, total:warnings+information}, truncated:warnings+information>issues.length, limitations:['Checks use resolved layout geometry before animation; motion extremes and rotated bounds need visual inspection.', 'Contrast estimates use opaque hex colors and the topmost opaque frame or shape under the text; gradients, images and translucent layers are not composited.', 'Text fitting, spill and collision checks follow the renderer wrapping estimate; font-specific metrics and visual quality still require preview.']};
}
