#!/usr/bin/env node
// Builds the pages of the studio project from the geometry in house.mjs and the views in web/content.js: one 3D
// page per view, with the floors, hidden parts and camera angle of that view, a title block, and its room labels.
//
// Run with the studio server of the repository running (see AGENTS.md):
//   node projects/<name>/tools/build-studio.mjs             build and save to the project listed in studio.json
//   node projects/<name>/tools/build-studio.mjs --dump f    only write the document to file f, do not save
//
// Without a studio.json the script creates the studio project, uploads the texture images the model uses and
// writes studio.json. Every run replaces all pages of the project: manual edits made in the studio are lost, so
// change house.mjs or web/content.js and build again. A view of content.js takes `studio: false` to get no page,
// and `studio: { title, sub, note }` to word its page differently from the web viewer.
// Not built: the pull-apart of the whole-house view (a slider in the web viewer) and anything animated.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { floors as houseFloors } from './house.mjs';
import { TEXTURES, exportFloor } from './lib/materials.mjs';
import { VIEWS, LEVEL_TAGS } from '../web/content.js';

const HERE = dirname(fileURLToPath(import.meta.url)), PROJECT_DIR = resolve(HERE, '..');
let REPO = PROJECT_DIR;
while (!existsSync(join(REPO, 'bin/dsa'))) {
  if (dirname(REPO) === REPO) { console.error('bin/dsa was not found above this project: the script runs inside the my-designer repository.'); process.exit(2); }
  REPO = dirname(REPO);
}
const CONFIG = JSON.parse(readFileSync(join(PROJECT_DIR, 'project.json'), 'utf8')), STUDIO_FILE = join(PROJECT_DIR, 'studio.json');
function dsa(...a) {
  try { return JSON.parse(execFileSync(join(REPO, 'bin/dsa'), a, { cwd: REPO, maxBuffer: 1 << 29, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })); }
  catch (error) {
    console.error(`bin/dsa ${a.slice(0, 3).join(' ')} failed: ${String(error.stderr || error.message).trim()}`);
    console.error('Check the studio server with "node bootstrap.mjs --status" in the root of the repository.');
    process.exit(1);
  }
}

const W = 1600, H = 1000, FOV = 28, r4 = v => Math.round(v * 1e4) / 1e4, rad = d => d * Math.PI / 180;
// The clear area of a page in pixels: the title block is above it, the note below.
const CLEAR = { top: 170, bottom: 84, side: 60 };
// Shadows of the studio cover about 5 units around the origin, so the framed floors are scaled to this radius.
const SHADOW_RADIUS = 4.6;
const SUN = [66, 50], BACKGROUND = '#EDF0F2', LABEL_HEIGHT = .05;
const comma = v => String(v).replace('.', ',');

// ---------- Geometry: each floor is built once and reused on several pages ----------
const FLOORS = Object.fromEntries(houseFloors().map(f => [f.code, exportFloor(f)]));
const usedTextures = [...new Set(Object.values(FLOORS).flatMap(f => f.parts.map(p => p.texture).filter(Boolean)))];

// ---------- The studio project: created on the first run, then read from studio.json ----------
const dump = process.argv.indexOf('--dump');
function createStudioProject() {
  const { project } = dsa('projects', 'create', '--name', CONFIG.title, '--description', CONFIG.description ?? '', '--kind', '3d');
  const textures = {};
  for (const key of usedTextures) {
    const { file, size } = TEXTURES[key], { asset } = dsa('assets', 'upload', project.id, '--file', join(PROJECT_DIR, 'textures', file), '--mime', 'image/png');
    textures[key] = { id: asset.id, size, asset };
  }
  const studio = { projectId: project.id, textures };
  writeFileSync(STUDIO_FILE, `${JSON.stringify(studio, null, 2)}\n`);
  console.log(`studio.json: created the studio project ${project.id} with ${usedTextures.length} texture images`);
  return studio;
}
const STUDIO = existsSync(STUDIO_FILE) ? JSON.parse(readFileSync(STUDIO_FILE, 'utf8')) : dump > 0 ? { textures: {} } : createStudioProject();

const group = (id, name, parentId, pos, extra = {}) => ({ id, type: 'group', name, x: 0, y: 0, width: 200, height: 200, ...(parentId ? { parentId } : {}), ...extra, scene: { position: pos.map(r4), rotation: [0, 0, 0], scale: [1, 1, 1] } });

// The uploaded texture of a part as registered in studio.json, or undefined: the part is then drawn in its plain colour.
const textureOf = part => (part.texture ? STUDIO.textures?.[part.texture] : undefined);

function materialOf(part) {
  const m = { color: part.built.color, roughness: part.material.roughness ?? .8, metalness: part.material.metalness ?? 0 };
  if (part.material.doubleSided) m.doubleSided = true;
  if (part.material.transparent) m.transparent = true;
  const texture = textureOf(part);
  if (texture) {
    m.textureAssetId = texture.id;
    const k = 1 / texture.size;
    m.textureSettings = { textureAssetId: { offset: [0, 0], repeat: [k, k], center: [0, 0], rotation: part.material.textureRotation ?? 0, wrapS: 1000, wrapT: 1000 } };
  }
  return m;
}
function partNode(key, floorCode, parentId, part, { dy = 0, visible = true } = {}) {
  const { center } = part.built, { uv, ...plain } = part.built.mesh, mesh = textureOf(part) ? part.built.mesh : plain; // UVs are stored only when the texture is registered
  return {
    id: `${key}-${floorCode}-${part.code}`, type: 'model3d', name: part.name, x: 0, y: 0, width: 200, height: 200, parentId,
    ...(visible ? {} : { visible: false }), ...(part.material.opacity != null ? { opacity: part.material.opacity } : {}),
    scene: { position: [center[0], r4(center[1] + dy), center[2]], rotation: [0, 0, 0], scale: [1, 1, 1], mesh, material: materialOf(part) },
  };
}
const upperName = floor => `Phần trên mặt cắt ${comma(floor.cut)} m`;
// One floor: floor group → the low parts, plus an "above the cut plane" group holding the upper parts.
function floorGroup(key, parent, floorKey, { hideUpper = false, hide = [] } = {}) {
  const { floor, parts } = FLOORS[floorKey], gid = `${key}-${floor.code}`, nodes = [group(gid, floor.name, parent, [0, floor.level, 0])];
  for (const part of parts.filter(p => !p.upper)) nodes.push(partNode(key, floor.code, gid, part, { visible: !hide.includes(part.code) }));
  const upper = parts.filter(p => p.upper);
  if (upper.length) {
    nodes.push(group(`${gid}-upper`, upperName(floor), gid, [0, floor.cut, 0], hideUpper ? { visible: false } : {}));
    for (const part of upper) nodes.push(partNode(key, floor.code, `${gid}-upper`, part, { dy: -floor.cut, visible: !hide.includes(part.code) }));
  }
  return nodes;
}

// ---------- Camera, lighting ----------
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], unit = a => { const l = Math.hypot(...a); return a.map(v => v / l); };
const direction = (az, el) => [Math.sin(rad(az)) * Math.cos(rad(el)), Math.sin(rad(el)), Math.cos(rad(az)) * Math.cos(rad(el))]; // az: 0 = seen from the front, + toward +x

// The box, in model coordinates, of what a view shows of the given floors.
function boxOf(view, codes) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const code of codes) {
    if (!view.floors.includes(code)) continue;
    const { floor, parts } = FLOORS[code], hide = view.hide?.[code] ?? [];
    for (const part of parts) {
      if (hide.includes(part.code) || (part.upper && view.cut === true)) continue;
      for (let k = 0; k < 3; k++) { const level = k === 1 ? floor.level : 0; lo[k] = Math.min(lo[k], part.built.lo[k] + level); hi[k] = Math.max(hi[k], part.built.hi[k] + level); }
    }
  }
  return { lo, hi, center: lo.map((v, k) => (v + hi[k]) / 2), radius: Math.hypot(...hi.map((v, k) => v - lo[k])) / 2 };
}
// Where the camera has to be to see the box whole in the clear area of the page: the same reckoning as the web viewer.
function frame(box, az, el) {
  const dir = direction(az, Math.min(89, Math.max(4, el))), forward = dir.map(v => -v), right = unit(cross(forward, [0, 1, 0])), up = cross(right, forward);
  const tanV = Math.tan(rad(FOV / 2)), fitV = tanV * (1 - (CLEAR.top + CLEAR.bottom) / H), fitH = tanV * W / H * (1 - 2 * CLEAR.side / W);
  let distance = 0;
  for (let k = 0; k < 8; k++) {
    const v = sub([k & 1 ? box.hi[0] : box.lo[0], k & 2 ? box.hi[1] : box.lo[1], k & 4 ? box.hi[2] : box.lo[2]], box.center), d = dot(v, dir);
    distance = Math.max(distance, d + Math.abs(dot(v, right)) / fitH, d + Math.abs(dot(v, up)) / fitV);
  }
  const shift = (CLEAR.top - CLEAR.bottom) / H * distance * tanV;   // the clear area is lower than the middle of the page
  return { dir, distance, target: box.center.map((v, i) => v + up[i] * shift) };
}
// view = { C: model point placed at the scene origin, s: model scale, scene: camera and lights }.
function viewOf(view) {
  const box = boxOf(view, view.focus ?? view.floors), s = Math.round(SHADOW_RADIUS / box.radius * 1e3) / 1e3, C = box.center;
  const { dir, distance, target } = frame(box, view.camera?.az ?? 30, view.camera?.el ?? 40), t = target.map((v, i) => s * (v - C[i]));
  return {
    C, s, scene: {
      camera: { position: t.map((v, i) => r4(v + dir[i] * s * distance)), target: t.map(r4), fov: FOV, safeFrame: 0 }, ambient: .55,
      light: { position: direction(...SUN).map(v => r4(v * 22)), intensity: 3, color: '#FFF2DD' },
      lights: [{ id: 'fill-light', type: 'directional', position: direction(SUN[0] - 115, 35).map(v => r4(v * 22)), target: [0, 0, 0], color: '#DDE9FF', intensity: .45 }],
      rendering: { exposure: 1, bloom: 0, shadows: true, environmentIntensity: .18 },
    },
  };
}
// Projects a model point onto the page (used to place 2D text next to an object).
function project(p, { C, s }, cam) {
  const w = p.map((v, i) => s * (v - C[i]));
  const f = unit(sub(cam.target, cam.position)), r = unit(cross(f, [0, 1, 0])), u = cross(r, f), d = sub(w, cam.position), z = dot(d, f), k = Math.tan(rad(cam.fov / 2));
  return [(dot(d, r) / (z * k * W / H) + 1) / 2 * W, (1 - dot(d, u) / (z * k)) / 2 * H];
}

// ---------- 2D text ----------
const text = (id, content, x, y, w, size, { bold = false, color = '#1E2A33', align = 'left', h } = {}) => ({
  id, type: 'text', name: content.slice(0, 60), x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h ?? size * 1.4), text: content,
  style: { fontSize: size, fill: color, fontFamily: '$heading', lineHeight: 1.25, textAlign: align, ...(bold ? { fontWeight: 700 } : {}) },
});
// The note stands at the foot of the page, or under the title where the surroundings of the house run down to the foot.
const titleBlock = (key, { kicker, title, sub: line, note }, noteOnTop) => [
  ...(kicker ? [text(`${key}-text-kicker`, kicker, 56, 44, 900, 15, { color: '#6B7A86', bold: true })] : []),
  text(`${key}-text-title`, title, 56, 66, 1100, 40, { bold: true }),
  ...(line ? [text(`${key}-text-sub`, line, 56, 120, 1300, 18, { color: '#4A5863' })] : []),
  ...(note ? [text(`${key}-text-note`, note, 56, noteOnTop ? 152 : H - 62, noteOnTop ? 900 : 1400, 14, { color: '#7C8892' })] : []),
];

// Room labels and level tags: a rounded white box placed exactly where the point appears on the page.
// They sit in one group, so the viewer can hide every label with a single click in the layer list.
function labels(key, view, placed) {
  const points = [];
  if (view.labels && view.floors.includes(view.labels)) {
    const { floor } = FLOORS[view.labels];
    for (const l of floor.labels) points.push({ title: l.title, sub: l.sub, at: [l.x, floor.level + LABEL_HEIGHT, l.z] });
  }
  for (const code of view.tags ?? []) {
    const tag = LEVEL_TAGS?.[code], entry = FLOORS[code];
    if (!tag || !entry || !view.floors.includes(code)) continue;
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const part of entry.parts) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], part.built.lo[k]); hi[k] = Math.max(hi[k], part.built.hi[k]); }
    points.push({ title: tag[0], sub: tag[1], at: [hi[0] + .7, entry.floor.level + Math.min(1.5, (lo[1] + hi[1]) / 2 + .4), (lo[2] + hi[2]) / 2] });
  }
  if (!points.length) return [];
  const parentId = `${key}-labels`, out = [{ id: parentId, type: 'group', name: 'Chú thích', x: 0, y: 0, width: W, height: H }];
  points.forEach((l, i) => {
    const [x, y] = project(l.at, placed, placed.scene.camera), id = `${key}-label-${i}`;
    const w = Math.round(Math.max(l.title.length * 8.8, (l.sub?.length ?? 0) * 6.6) + 20), h = l.sub ? 40 : 24, x0 = Math.round(x - w / 2), y0 = Math.round(y - h / 2);
    out.push({ id, type: 'shape', name: `Nhãn ${l.title}`, parentId, x: x0, y: y0, width: w, height: h, opacity: .9, style: { fill: '#FFFFFF', borderRadius: 7 } });
    out.push({ ...text(`${id}-title`, l.title, x0, y0 + 4, w, 13, { bold: true, align: 'center' }), parentId });
    if (l.sub) out.push({ ...text(`${id}-sub`, l.sub, x0, y0 + 22, w, 11, { color: '#5E6C77', align: 'center' }), parentId });
  });
  return out;
}

// ---------- Pages ----------
function page(view) {
  const key = view.key, placed = viewOf(view), root = group(`${key}-root`, 'Mô hình nhà', null, placed.C.map(v => -placed.s * v));
  root.scene.scale = [placed.s, placed.s, placed.s];
  const nodes = [root];
  for (const code of view.floors) {
    if (!FLOORS[code]) throw new Error(`web/content.js, view '${key}': house.mjs has no floor '${code}'`);
    nodes.push(...floorGroup(key, root.id, code, { hideUpper: view.cut === true, hide: view.hide?.[code] ?? [] }));
  }
  const overlay = labels(key, view, placed), cut = view.cut === true ? FLOORS[view.labels ?? view.floors.at(-1)].floor : null;
  const hints = [...(cut ? [`bật nhóm "${upperName(cut)}" để xem tường cao đủ`] : []), ...(overlay.length ? ['tắt nhóm "Chú thích" để ẩn toàn bộ nhãn'] : [])];
  const note = [cut ? `Tường cắt ở cao ${comma(cut.cut)} m để nhìn mặt bằng.` : '', hints.length ? `Trong danh sách lớp: ${hints.join(', ')}.` : ''].filter(Boolean).join(' ');
  const words = { kicker: view.kicker, title: view.title, sub: view.sub, note, ...(view.studio ?? {}) };
  return { id: `page-${key}`, name: view.chip ?? view.title, width: W, height: H, background: BACKGROUND, scene: placed.scene, nodes: [...nodes, ...overlay, ...titleBlock(key, words, Boolean(view.focus))] };
}

function buildDocument(current) {
  const pages = VIEWS.filter(v => v.studio !== false).map(page);
  // Uploaded texture images (listed in studio.json) must be present in assets, otherwise the materials cannot load them.
  const textures = Object.values(STUDIO.textures ?? {}).map(t => t.asset).filter(Boolean);
  const assets = [...(current.assets ?? []).filter(a => !textures.some(t => t.id === a.id)), ...textures];
  return { ...current, assets, pages };
}

// ---------- Run ----------
const remote = STUDIO.projectId ? dsa('projects', 'get', STUDIO.projectId).project : { document: {} };
const doc = buildDocument(remote.document);
const file = dump > 0 ? resolve(process.argv[dump + 1]) : join(tmpdir(), `${CONFIG.slug}-${process.pid}.json`);
const json = JSON.stringify(doc);
writeFileSync(file, json);
const nodeCount = doc.pages.reduce((n, p) => n + p.nodes.length, 0);
console.log(`Document: ${doc.pages.length} pages, ${nodeCount} nodes, ${(json.length / 1048576).toFixed(2)} MB → ${file}`);
if (dump < 0) {
  const result = dsa('projects', 'document', 'put', STUDIO.projectId, '--file', file, '--revision', String(remote.revision), '--summary');
  rmSync(file);
  console.log(`Saved, revision ${result.project?.revision ?? result.revision ?? '?'}. In the studio: /?project=${STUDIO.projectId} ("${remote.name}").`);
}
