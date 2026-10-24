#!/usr/bin/env node
// Builds the data of the static web viewer (web/) from the geometry in house.mjs:
//   web/data/house.json   every floor once: meshes, materials and room labels, and what the viewer needs of project.json
//   web/textures/         the texture images
//   web/vendor/           three.js, copied from the repo's node_modules
//   web/index.html        only its <title>, its description and the sample figure of the drawing legend are rewritten
//
//   node projects/<name>/tools/build-web.mjs
//
// The viewer itself (index.html, styles.css, app.js, plan.js) is hand-written; content.js holds the views and the
// wording of this house. It needs no studio server: serve web/ with any static server, or deploy it (see CLAUDE.md).
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { floors as houseFloors } from './house.mjs';
import { TEXTURES, exportFloor } from './lib/materials.mjs';

const here = dirname(fileURLToPath(import.meta.url)), project = join(here, '..'), web = join(project, 'web');
const VENDOR = { 'build/three.module.min.js': 'three.module.min.js', 'build/three.core.min.js': 'three.core.min.js', 'examples/jsm/controls/OrbitControls.js': 'addons/controls/OrbitControls.js', 'examples/jsm/environments/RoomEnvironment.js': 'addons/environments/RoomEnvironment.js' };

const round = (values, digits) => { const k = 10 ** digits; return values.map(v => Math.round(v * k) / k); };
// When labels compete for space in the viewer the bigger room wins: the rank is the area written on the label.
const rank = sub => { const m = /≈\s*([\d,]+)\s*m²/.exec(sub ?? ''); return m ? Number(m[1].replace(',', '.')) : 0; };
const copy = (from, to) => { mkdirSync(dirname(to), { recursive: true }); copyFileSync(from, to); };
const escape = text => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const config = JSON.parse(readFileSync(join(project, 'project.json'), 'utf8'));
const source = JSON.parse(readFileSync(join(project, 'store', 'source-dimensions.json'), 'utf8'));

const floors = {}, used = new Set();
let triangles = 0;
for (const floor of houseFloors()) {
  const parts = exportFloor(floor).parts.map(({ code, name, upper, material, built }) => {
    triangles += built.triangleCount;
    if (material.texture) used.add(material.texture);
    const { positions, indices, uv, colors } = built.mesh;
    return {
      code, name, upper, center: built.center, color: built.color,
      material: { roughness: material.roughness, metalness: material.metalness ?? 0, doubleSided: Boolean(material.doubleSided), transparent: Boolean(material.transparent), opacity: material.opacity ?? 1, texture: material.texture ?? null, textureRotation: material.textureRotation ?? 0 },
      positions, indices, ...(uv ? { uv } : {}), ...(colors ? { colors: round(colors, 4) } : {}),
    };
  });
  floors[floor.code] = { name: floor.name, level: floor.level, height: floor.height, cut: Number.isFinite(floor.cut) ? floor.cut : null, parts, labels: floor.labels.map(({ title, sub, x, z }) => ({ title, sub, x, z, rank: rank(sub) })) };
}

// The texture images the model uses, in the order of the table.
const textures = {};
for (const [key, { file, size }] of Object.entries(TEXTURES)) {
  if (!used.has(key)) continue;
  textures[key] = { file: `textures/${file}`, size };
  copy(join(project, 'textures', file), join(web, 'textures', file));
}

const info = { title: config.title, paper: config.paper ?? 'A3', plans: `cad/${config.slug}-plans.pdf` };
const data = JSON.stringify({ project: info, textures, floors });
mkdirSync(join(web, 'data'), { recursive: true });
writeFileSync(join(web, 'data', 'house.json'), data);

const three = join(dirname(createRequire(import.meta.url).resolve('three')), '..');
for (const [from, to] of Object.entries(VENDOR)) copy(join(three, from), join(web, 'vendor', to));

// The page is hand-written; only what names this house is rewritten, so it reads right before any script runs.
const page = join(web, 'index.html');
if (existsSync(page)) {
  const figure = String(source.chains.find(c => c.id === 'across').segments_mm[0]);   // the sample of a documented figure
  const stamps = [
    [/<title>[^<]*<\/title>/, `<title>${escape(config.title)} · Mô hình 3D và bản vẽ</title>`],
    [/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escape(config.description ?? config.title)}">`],
    [/(<p id="plan-key" hidden><span><b>)[^<]*(<\/b>)/, `$1${figure}$2`],
  ];
  let html = readFileSync(page, 'utf8');
  for (const [pattern, text] of stamps) {
    if (!pattern.test(html)) throw new Error(`web/index.html: nothing matches ${pattern}; the page was changed by hand`);
    html = html.replace(pattern, text);
  }
  if (html !== readFileSync(page, 'utf8')) writeFileSync(page, html);
}

console.log(`web/data/house.json: ${Object.keys(floors).length} floors, ${triangles} triangles, ${(data.length / 1e6).toFixed(2)} MB`);
