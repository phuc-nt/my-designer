// assemble-index writes index.html afresh and knows nothing of the 3D layer. This puts the world back
// as the first child of the root, so that it sits behind every frame, for the whole length.
// Run after every assemble-index:  node scripts/patch-index.mjs
import { readFileSync, writeFileSync } from "node:fs";

const file = new URL("../index.html", import.meta.url);
let html = readFileSync(file, "utf8");
html = html.replace(/\s*<div id="el-world"[^>]*><\/div>/g, "");
const open = /<div\b[^>]*\bid="root"[^>]*>/.exec(html);
if (!open) throw new Error("index.html has no #root");
const dur = /data-duration="([\d.]+)"/.exec(open[0]);
if (!dur) throw new Error("#root has no data-duration");
const mount = `\n      <div id="el-world" class="clip scene" data-composition-id="world" data-composition-src="compositions/world.html" data-start="0" data-duration="${dur[1]}" data-track-index="30"></div>`;
html = html.slice(0, open.index + open[0].length) + mount + html.slice(open.index + open[0].length);
// the stock assembler leaves the caption layer unmarked; lint wants it on the captions track
html = html.replace(/(<div\s+id="el-captions")(?![^>]*data-track-kind)/, '$1 data-track-kind="captions"');
writeFileSync(file, html);
const world = new URL("../compositions/world.html", import.meta.url);
const w = readFileSync(world, "utf8").replace(/(data-composition-id="world"[^>]*data-duration=")[\d.]+(")/, `$1${dur[1]}$2`);
writeFileSync(world, w);
console.log(`world mounted for ${dur[1]}s`);
