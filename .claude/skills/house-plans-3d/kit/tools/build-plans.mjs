#!/usr/bin/env node
// Builds the 2D drawing set and the data store from the same geometry as the 3D model (house.mjs):
//   cad/<sheet>.dxf|pdf|png     CAD sheets at 1:100 (the DXF holds real dimensions, layers and hatches)
//   cad/<slug>-plans.pdf        all the sheets in one file
//   store/building.json         every parameter with its source: grid, levels, floors, rooms, openings, stairs, sheets
//   store/tables/*.csv          the same data as tables, for a spreadsheet
//   store/house.sqlite          the same data for SQL
//   web/cad/, web/data/         copies for the web viewer: one interactive SVG per plan, the downloads and the store
//
//   node projects/<name>/tools/build-plans.mjs
//
// This script only exports the model (plan records, room seeds and meshes of every floor); the drafting itself is
// the Python step in tools/cad/, run through uv because ezdxf and shapely have no equal in the Node world.
// Two files are written by hand: project.json (names, sheets, which floors are plans) and
// store/source-dimensions.json (the dimensions transcribed from the original drawings).
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEVELS, floors as houseFloors } from './house.mjs';

const here = dirname(fileURLToPath(import.meta.url)), project = join(here, '..');
const round = v => Math.round(v * 1e5) / 1e5;

const floors = houseFloors().map(f => ({
  code: f.code, name: f.name, level: f.level, height: f.height, cut: Number.isFinite(f.cut) ? f.cut : null,
  plan: f.plan, rooms: f.rooms,
  // Meshes in absolute floor coordinates (metres, y up), one colour per vertex: the top views of furniture,
  // sanitary ware, planters, the site and the roof are projected from these.
  parts: [...f.parts.values()].filter(p => !p.mesh.empty).map(p => ({ code: p.code, name: p.name, group: p.group, upper: Boolean(p.upper), positions: p.mesh.pos.map(round), indices: p.mesh.idx, colors: p.mesh.col })),
}));

const work = mkdtempSync(join(tmpdir(), 'house-plans-'));
try {
  const model = join(work, 'model.json');
  writeFileSync(model, JSON.stringify({ levels: LEVELS, floors }));
  // No bytecode cache: tools/cad/ holds sources only.
  const run = spawnSync('uv', ['run', '--quiet', join(here, 'cad', 'draft.py'), model, project, ...process.argv.slice(2)],
    { stdio: 'inherit', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
  if (run.error) throw new Error(`Could not start uv (${run.error.message}). Install it from https://docs.astral.sh/uv/ and run again.`);
  process.exitCode = run.status ?? 1;
} finally {
  rmSync(work, { recursive: true, force: true });
}
