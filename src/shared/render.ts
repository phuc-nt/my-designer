import { boardSvg } from './board-render';

import { characterSvg } from './character-svg';
import { resolveLayout } from './layout';
import { ease } from './easing';
import { documentFontFamilies, googleFontsStylesheetUrl } from './font-loading';
import { isSafeUrl, type DesignDocument, type DesignNode, type Theme } from './schema';
import { parseLiveArtifact, renderLiveArtifact } from './live-artifact';
import { tableGrid, tableOf } from './table';

export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
export function resolveColor(value: unknown, theme: Theme, fallback = '#000000'): string {
  const raw = typeof value === 'string' ? value : '';
  const color = raw.startsWith('$') ? theme.colors[raw.slice(1)] ?? fallback : raw;
  return /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{1,30}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\))$/.test(color) ? color : fallback;
}
export function hexLuminance(hex: string): number | null {
  if (/^#[0-9a-f]{3}$/i.test(hex)) hex = '#' + [...hex.slice(1)].map(c => c + c).join('');
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) return null;
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
/** Text color that stays readable on `fill`: the theme text/background token whose luminance contrasts most, or black/white when the fill is not a hex color. */
export function readableTextOn(fill: string, theme: Theme): string {
  const fillL = hexLuminance(fill);
  if (fillL === null) return fill.startsWith('#') ? '#ffffff' : resolveColor('$background', theme, '#ffffff');
  const text = resolveColor('$text', theme, '#000000'), background = resolveColor('$background', theme, '#ffffff');
  const candidates = [text, background, '#000000', '#ffffff'].map(color => ({ color, l: hexLuminance(color) ?? (color === '#000000' ? 0 : 1) }));
  const contrast = (l: number) => (Math.max(l, fillL) + 0.05) / (Math.min(l, fillL) + 0.05);
  const themed = candidates.slice(0, 2).map(c => ({ ...c, ratio: contrast(c.l) })).sort((a, b) => b.ratio - a.ratio)[0];
  if (themed.ratio >= 4.5) return themed.color;
  return contrast(0) >= contrast(1) ? '#000000' : '#ffffff';
}
const num = (v: unknown, fallback: number, min = -100000, max = 100000) => typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
export function resolveFont(value: unknown, theme: Theme): string {
  const raw = value === '$heading' ? theme.fonts.heading : value === '$body' ? theme.fonts.body : value;
  return String(raw ?? theme.fonts.body).replace(/[^a-zA-Z0-9 ,_-]/g, '') || 'Arial';
}
export function interpolateNode(node: DesignNode, doc: DesignDocument, time = 0): DesignNode {
  // Geometry is immutable during playback. Clone only animated state, not large mesh buffers.
  const scene = node.scene ? (() => { const { mesh, ...state } = node.scene; return { ...structuredClone(state), ...(mesh ? {mesh} : {}) }; })() : undefined;
  const result = { ...node, style: { ...node.style }, ...(scene ? {scene} : {}) };
  for (const track of doc.timeline?.tracks.filter(track => track.nodeId === node.id && !track.muted) ?? []) {
    const owner = (node.scene?.rigId??node.data?.rigSourceId) ? doc.pages.flatMap(p=>p.nodes).find(n=>n.id===(node.scene?.rigId??node.data?.rigSourceId)) : node;
    const clip=track.clipName?owner?.scene?.clips?.find(c=>c.name===track.clipName):undefined;
    if(clip&&(time<clip.start||time>clip.end))continue;
    const duration=clip?.sourceDuration??(clip?clip.end-clip.start:0);
    const elapsed=clip?(time-clip.start)*(clip.speed??1):0;
    const sampleTime=clip?clip.start+(time===clip.end?duration:elapsed%duration):time;
    const blend=clip?.blend?Math.max(0,Math.min(1,(time-clip.start)/clip.blend,(clip.end-time)/clip.blend)):1;
    const frames = [...track.keyframes].sort((a, b) => a.time - b.time);
    const keys = new Set(frames.flatMap(f => Object.keys(f.values)));
    for (const key of keys) {
      const keyed = frames.filter(f => key in f.values);
      if (!keyed.length) continue;
      const before = [...keyed].reverse().find(f => f.time <= sampleTime) ?? keyed[0];
      const after = keyed.find(f => f.time >= sampleTime) ?? keyed[keyed.length - 1];
      const mix = before.time === after.time ? 0 : Math.max(0, Math.min(1, (sampleTime - before.time) / (after.time - before.time)));
      const a = before.values[key], b = after.values[key];
      let value = typeof a === 'number' && typeof b === 'number' ? a + (b - a) * ease(mix, before.easing) : a;
      if(clip&&typeof value==='number'){const match=/^scene\.bones\.(\d+)\.(position|rotation)\.([xyz])$/.exec(key);if(match){const bone=node.scene?.bones?.[+match[1]],field=match[2] as 'position'|'rotation',axis='xyz'.indexOf(match[3]);const base=(field==='rotation'?bone?.bindRotation:bone?.position)?.[axis]??0;const previous=result.scene?.bones?.[+match[1]]?.[field]?.[axis]??base;value=previous+(base+(value-base)*(clip.amplitude??1)-previous)*blend;}}
      if (['x', 'y', 'width', 'height', 'rotation', 'opacity'].includes(key) && typeof value === 'number') Object.assign(result, { [key]: value });
      else if (['fill', 'fontSize', 'borderRadius', 'strokeWidth', 'stroke'].includes(key)) result.style[key] = value;
      else if (typeof value === 'number') {
        const transform = /^scene\.(position|rotation|scale)\.([xyz])$/.exec(key);
        const morph = /^scene\.morphWeights\.([a-zA-Z0-9_-]+)$/.exec(key);
        if (morph && result.scene?.mesh?.morphTargets?.some(t=>t.name===morph[1])) { result.scene.morphWeights ??= {}; result.scene.morphWeights[morph[1]]=Math.max(0,Math.min(1,value)); }
        const bone = /^scene\.bones\.(\d+)\.(position|rotation)\.([xyz])$/.exec(key);
        if (transform) {
          const field = transform[1] as 'position' | 'rotation' | 'scale';
          result.scene ??= {};
          const page = doc.pages.find(p => p.nodes.some(n => n.id === node.id));
          const fallback = field === 'scale' ? [node.width / 400, node.height / 400, Number(node.data?.depth ?? node.width) / 400]
            : field === 'position' ? [(node.x + node.width / 2 - (page?.width ?? 0) / 2) / 240, ((page?.height ?? 0) / 2 - node.y - node.height / 2) / 240, Number(node.data?.z ?? 0)]
              : [Number(node.data?.rotationX ?? 0), Number(node.data?.rotationY ?? 0), node.rotation ?? 0];
          const vector = result.scene[field] ?? fallback;
          vector['xyz'.indexOf(transform[2])] = value;
          result.scene[field] = vector as [number, number, number];
        } else if (bone) {
          const target = result.scene?.bones?.[Number(bone[1])];
          if (target) {
            const field = bone[2] as 'position' | 'rotation';
            const vector = target[field] ?? [0, 0, 0];
            vector['xyz'.indexOf(bone[3])] = value;
            target[field] = vector as [number, number, number];
          }
        }
      }
    }
  }
  return result;
}
// Text measurement. Widths are summed per character as multiples of the font
// size: Latin averages 0.52 em, East Asian Wide/Fullwidth characters a full
// em, combining marks nothing (they stack on the glyph before them). Counting
// characters instead believed twice as many Japanese characters fit per line
// and measured decomposed (NFD) Vietnamese ~24% wider than the same text in
// NFC — both surfaced as wrong `text-overflow` findings and mis-wrapped SVG.
export const LATIN_ADVANCE = 0.52;
export const WIDE_ADVANCE = 1;
// East Asian Wide (W) and Fullwidth (F): Hangul jamo leads, CJK punctuation and
// symbols, kana, CJK ideographs (incl. extension A and the SIP), Yi, Hangul
// syllables, compatibility ideographs, vertical/small/fullwidth forms.
const WIDE = /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︐-︙︰-﹯＀-｠￠-￦]|[\u{20000}-\u{3FFFD}]/u;
// `\p{M}` plus the Hangul vowel/trailing jamo, which compose onto the leading
// consonant but are not marks.
const COMBINING = /\p{M}|[ᅠ-ᇿힰ-퟿]/u;
// Kinsoku shori: characters that may not open a line (closing brackets, the
// Japanese comma and full stop, small kana, the long-vowel mark) and those
// that may not end one (opening brackets).
const NO_LINE_START = /[、。，．・：；？！ー〜々ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ）］｝〉》」』】〕”’)\]}»]/;
const NO_LINE_END = /[（［｛〈《「『【〔“‘(\[{«]/;

/** Advance of one character in em. */
export function charAdvance(ch: string): number {
  if (COMBINING.test(ch)) return 0;
  return WIDE.test(ch) ? WIDE_ADVANCE : LATIN_ADVANCE;
}
/** Estimated width of a single line of text in px at `size` px. */
export function measureText(value: string, size: number): number {
  let em = 0;
  for (const ch of value) em += charAdvance(ch);
  return em * size;
}
// Break candidates: Latin runs stay whole so they wrap on spaces; each wide
// character is its own token because Japanese has no spaces to wrap on.
function textTokens(paragraph: string): string[] {
  const tokens: string[] = [];
  let latin = '';
  for (const ch of paragraph) {
    if (COMBINING.test(ch) && (latin || tokens.length)) {
      if (latin) latin += ch; else tokens[tokens.length - 1] += ch;
    } else if (WIDE.test(ch)) {
      if (latin) { tokens.push(latin); latin = ''; }
      tokens.push(ch);
    } else if (/\s/.test(ch)) {
      if (latin) { tokens.push(latin); latin = ''; }
      if (tokens[tokens.length - 1] !== ' ') tokens.push(' ');
    } else latin += ch;
  }
  if (latin) tokens.push(latin);
  return tokens;
}
export function wrappedLines(value: string, width: number, size: number): string[] {
  const limit = Math.max(width, 1);
  const lines: string[] = [];
  for (const paragraph of value.replace(/\r\n/g, '\n').split('\n')) {
    if (!paragraph) { lines.push(''); continue; }
    let line = '', lineWidth = 0;
    for (const token of textTokens(paragraph)) {
      if (token === ' ') {
        if (line) { line += ' '; lineWidth += LATIN_ADVANCE * size; }
        continue;
      }
      const tokenWidth = measureText(token, size);
      if (tokenWidth > limit) {
        // A single token wider than the box: hard-split it, never between a
        // character and its combining marks (advance 0).
        if (line) { lines.push(line.trimEnd()); line = ''; lineWidth = 0; }
        let chunk = '', chunkWidth = 0;
        for (const ch of token) {
          const advance = charAdvance(ch) * size;
          if (advance > 0 && chunkWidth + advance > limit && chunk) { lines.push(chunk); chunk = ''; chunkWidth = 0; }
          chunk += ch;
          chunkWidth += advance;
        }
        line = chunk; lineWidth = chunkWidth;
        continue;
      }
      if (line && lineWidth + tokenWidth > limit) {
        if (NO_LINE_START.test(token)) { line += token; lineWidth += tokenWidth; continue; }
        let carry = '';
        while (line && NO_LINE_END.test(line[line.length - 1]!)) { carry = line[line.length - 1] + carry; line = line.slice(0, -1); }
        lines.push(line.trimEnd() || line);
        line = carry; lineWidth = measureText(carry, size);
      }
      line += token; lineWidth += tokenWidth;
    }
    lines.push(line.trimEnd());
  }
  return lines;
}
function nodeSvg(n: DesignNode, doc: DesignDocument, time = 0): string {
  if (n.visible === false) return '';
  const s = n.style ?? {}, theme = doc.theme;
  const fill = escapeHtml(resolveColor(s.fill ?? (n.type === 'text' ? '$text' : '$surface'), theme));
  const stroke = escapeHtml(resolveColor(s.stroke, theme, 'none'));
  const sw = num(s.strokeWidth, 0, 0, 100);
  const radius = num(s.borderRadius, n.type === 'frame' ? theme.radius : 0, 0, 10000);
  let markup = '';
  const live = parseLiveArtifact(n.data);
  if (live) {
    const view = renderLiveArtifact(live, theme);
    const textColor = escapeHtml(resolveColor('$text', theme));
    const accent = escapeHtml(resolveColor(theme.colors.accent ?? theme.colors.primary ?? '$accent', theme));
    const rows = view.blocks.map((block, index) => {
      const y = 40 + index * 26;
      return `<text x="0" y="${y}" font-family="Arial" font-size="14" fill="${textColor}">${escapeHtml(block.label)}</text><text x="${num(n.width, 0, 0)}" y="${y}" text-anchor="end" font-family="Arial" font-size="14" font-weight="700" fill="${block.accent ? accent : textColor}">${escapeHtml(block.value)}</text>`;
    }).join('');
    markup = `<rect width="${n.width}" height="${n.height}" rx="${radius}" fill="${fill}"/><text x="0" y="18" font-family="Arial" font-size="16" font-weight="700" fill="${textColor}">${escapeHtml(view.title)}</text>${rows}`;
  } else if (n.type === 'board' && doc.schemaVersion === 2 && n.crop) {
    const board = doc.boards.find(b => b.id === n.boardId);
    if (!board) throw new Error('Board is unavailable');
    markup = boardSvg(board, doc, n.crop, n.width, n.height);
  } else if (n.type === 'artwork' && doc.schemaVersion === 2) {
    const painting = doc.paintings.find(p => p.id === n.paintingId);
    const asset = doc.assets.find(a => a.id === painting?.composite?.assetId);
    if (!asset && painting?.layers.some(l => l.tiles.length)) throw new Error('Painting needs a current composite before rendering');
    markup = asset ? `<image href="${escapeHtml(asset.url)}" width="${n.width}" height="${n.height}" preserveAspectRatio="none"/>` : '';
  } else if (n.type === 'text') {
    const size = num(s.fontSize, 24, 1, 1000);
    const lineHeight = num(s.lineHeight, 1.2, 0.5, 4) * size;
    const align = s.textAlign === 'center' ? 'middle' : s.textAlign === 'right' ? 'end' : 'start';
    const x = align === 'middle' ? n.width / 2 : align === 'end' ? n.width : 0;
    markup = `<text fill="${fill}" font-family="${escapeHtml(resolveFont(s.fontFamily, theme))}" font-size="${size}" font-weight="${num(s.fontWeight, 400, 100, 900)}" font-style="${s.fontStyle === 'italic' ? 'italic' : 'normal'}" text-anchor="${align}" letter-spacing="${num(s.letterSpacing, 0, -100, 100)}">${wrappedLines(n.text ?? '', n.width, size).map((line, i) => `<tspan x="${x}" y="${size + i * lineHeight}">${escapeHtml(line)}</tspan>`).join('')}</text>`;
  } else if (n.type === 'image' && n.src && isSafeUrl(n.src)) {
    markup = `<image href="${escapeHtml(n.src)}" width="${n.width}" height="${n.height}" preserveAspectRatio="${s.objectFit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}"/>`;
  } else if (n.type === 'chart') {
    const values = Array.isArray(n.data?.values) ? n.data.values.slice(0, 30).map(v => num(v, 0, 0, 1000000)) : [];
    const labels = Array.isArray(n.data?.labels) ? n.data.labels : [];
    const maximum = Math.max(1, ...values), gap = n.width / Math.max(values.length, 1);
    markup = values.map((value, i) => { const h = value / maximum * (n.height - 45); return `<rect x="${gap * i + 10}" y="${n.height - 45 - h}" width="${Math.max(0, gap - 24)}" height="${h}" rx="4" fill="${fill}"/><text x="${gap * i + 10}" y="${n.height - 14}" font-family="Arial" font-size="14" fill="${escapeHtml(resolveColor('$text', theme))}">${escapeHtml(String(labels[i] ?? value).slice(0, 30))}</text>`; }).join('');
  } else if (n.type === 'table') {
    const table = tableOf(n);
    if (!table) markup = `<rect width="${n.width}" height="${n.height}" fill="none" stroke="${escapeHtml(resolveColor('$muted', theme))}" stroke-dasharray="6 4"/>`;
    else {
      const grid = tableGrid(table, n.width, n.height), font = escapeHtml(resolveFont(s.fontFamily, theme));
      const border = escapeHtml(resolveColor(table.border ?? s.stroke ?? '$border', theme, '#d0d0d0')), textColor = escapeHtml(resolveColor('$text', theme));
      const headerFillRaw = resolveColor(table.headerFill ?? s.fill ?? '$accent', theme);
      const headerFill = escapeHtml(headerFillRaw), headerColor = escapeHtml(table.headerColor ? resolveColor(table.headerColor, theme) : readableTextOn(headerFillRaw, theme));
      const bodyFill = table.fill ? escapeHtml(resolveColor(table.fill, theme)) : 'none';
      markup = grid.cells.map(cell => {
        const c = cell.cell, cellFill = c.fill ? escapeHtml(resolveColor(c.fill, theme)) : cell.header ? headerFill : bodyFill;
        const color = c.color ? escapeHtml(resolveColor(c.color, theme)) : cell.header ? headerColor : textColor;
        const anchor = c.align === 'center' ? 'middle' : c.align === 'right' ? 'end' : 'start';
        const tx = cell.x + (anchor === 'middle' ? cell.width / 2 : anchor === 'end' ? cell.width - grid.padding : grid.padding);
        const lines = wrappedLines(cell.text, Math.max(1, cell.width - grid.padding * 2), grid.fontSize).slice(0, Math.max(1, Math.floor((cell.height - grid.padding) / (grid.fontSize * 1.25))));
        const spans = lines.map((line, i) => `<tspan x="${tx}" y="${cell.y + grid.padding + grid.fontSize * (0.85 + i * 1.25)}">${escapeHtml(line)}</tspan>`).join('');
        return `<rect x="${cell.x}" y="${cell.y}" width="${cell.width}" height="${cell.height}" fill="${cellFill}" stroke="${border}" stroke-width="1"/><text fill="${color}" font-family="${font}" font-size="${grid.fontSize}" font-weight="${cell.header || c.bold ? 700 : 400}" text-anchor="${anchor}">${spans}</text>`;
      }).join('');
    }
  } else if (n.type === 'character' && n.character) {
    const character=doc.characters?.find(c=>c.id===n.character!.characterId);
    if(character) markup=`<svg width="${n.width}" height="${n.height}" viewBox="0 0 ${character.width} ${character.height}" overflow="visible">${characterSvg(character,n.character,doc.assets,time,n.id)}</svg>`;
  } else if (n.type === 'model3d') {
    const color = escapeHtml(resolveColor(n.data?.color ?? '$accent', theme));
    markup = `<ellipse cx="${n.width / 2}" cy="${n.height * 0.86}" rx="${n.width * 0.3}" ry="${n.height * 0.055}" fill="#000000" opacity="0.12"/><ellipse cx="${n.width / 2}" cy="${n.height * 0.46}" rx="${n.width * 0.29}" ry="${n.height * 0.31}" fill="none" stroke="${color}" stroke-width="${n.width * 0.14}" transform="rotate(-28 ${n.width / 2} ${n.height / 2})"/><text x="${n.width / 2}" y="${n.height - 3}" text-anchor="middle" font-size="12" fill="${escapeHtml(resolveColor('$muted', theme))}">3D scene · Open editor for interactive rendering</text>`;
  } else if (n.type === 'video' || n.type === 'audio' || n.type === 'image') {
    markup = `<rect width="${n.width}" height="${n.height}" rx="${radius}" fill="${fill}"/><text x="${n.width / 2}" y="${n.height / 2}" text-anchor="middle" font-family="Arial" font-size="18" fill="${escapeHtml(resolveColor('$muted', theme))}">${escapeHtml(n.name || n.type)}</text>`;
  } else if (n.type === 'group') {
    markup = '';
  } else if (s.shape === 'ellipse' || n.data?.shape === 'ellipse') {
    markup = `<ellipse cx="${n.width / 2}" cy="${n.height / 2}" rx="${n.width / 2}" ry="${n.height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  } else {
    markup = `<rect width="${n.width}" height="${n.height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  }
  return `<g data-node-id="${escapeHtml(n.id)}" transform="translate(${num(n.x, 0)} ${num(n.y, 0)}) rotate(${num(n.rotation, 0)} ${num(n.width, 0) * (n.pivot?.[0] ?? .5)} ${num(n.height, 0) * (n.pivot?.[1] ?? .5)})" opacity="${num(n.opacity, 1, 0, 1)}">${markup}</g>`;
}
export function renderSvg(doc: DesignDocument, pageIndex = 0, time = 0): string {
  const sourcePage = doc.pages[pageIndex];
  // Animation is expressed in each node's original coordinate system; resolve
  // parent offsets only after evaluating the animated pose.
  const page = sourcePage ? resolveLayout({ ...sourcePage, nodes: sourcePage.nodes.map(node => interpolateNode(node, doc, time)) }) : undefined;
  if (!page) throw new Error('Page does not exist');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}" height="${page.height}" viewBox="0 0 ${page.width} ${page.height}" role="img" aria-label="${escapeHtml(page.name)}"><rect width="100%" height="100%" fill="${escapeHtml(resolveColor(page.background, doc.theme, '#ffffff'))}"/>${page.nodes.map(n => nodeSvg(n, doc, time)).join('')}</svg>`;
}
export function renderHtml(doc: DesignDocument, viewer?: { script: string; nonce?: string }): string {
  const fontUrl = googleFontsStylesheetUrl(documentFontFamilies(doc));
  const sections = doc.pages.map((page, i) => {
    const media = page.nodes.filter(n => n.visible !== false && (n.type === 'video' || n.type === 'audio') && n.src && isSafeUrl(n.src)).map(n => `<${n.type} controls src="${escapeHtml(n.src)}" style="position:absolute;left:${n.x / page.width * 100}%;top:${n.y / page.height * 100}%;width:${n.width / page.width * 100}%;height:${n.height / page.height * 100}%" preload="metadata"></${n.type}>`).join('');
    return `<section data-studio-page="${i}" aria-label="${escapeHtml(page.name)}" style="max-width:${page.width}px">${renderSvg(doc, i)}${media}</section>`;
  }).join('\n');
  const interactive = viewer
    ? `<script id="studio-document" type="application/json">${JSON.stringify(doc).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')}</script><script${viewer.nonce ? ` nonce="${escapeHtml(viewer.nonce)}"` : ''}>${viewer.script.replace(/<\/script/gi, '<\\/script')}</script>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(doc.name)}</title>${fontUrl ? `<link rel="stylesheet" href="${escapeHtml(fontUrl)}" data-studio-fonts>` : ''}<style>body{margin:0;background:${resolveColor('$background', doc.theme, '#fff')};font-family:Arial}section{position:relative;margin:0 auto 24px;break-after:page}svg{display:block;width:100%;height:auto}@media print{section{margin:0;break-inside:avoid}video,audio{display:none}}</style></head><body>${sections}${interactive}</body></html>`;
}
