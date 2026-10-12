// Checks the web viewer in headless Chromium at phone and desktop sizes: every view of web/content.js as a model
// and, where the view has a drawing, in the drawing mode. Prints one line per check, saves screenshots and exits
// with 1 when a check fails. The checks are about behaviour (labels follow the camera, nothing overflows, every
// link answers); whether a view looks right is for you to judge on the screenshots.
//   node tools/check-web.mjs [url] [--out <dir>] [--sizes phone,small,landscape,desktop] [--views f1,f2]
// Without a url the script serves ../web itself.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), PROJECT = resolve(HERE, '..');
const argv = process.argv.slice(2);
const option = name => { const i = argv.indexOf(`--${name}`); return i < 0 ? null : argv.splice(i, 2)[1]; };
const out = resolve(option('out') ?? join(PROJECT, 'tmp/check-web')), onlySizes = option('sizes')?.split(','), onlyViews = option('views')?.split(',');
const source = argv[0] ?? join(PROJECT, 'web');

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('playwright was not found. Run "npm install" in the root of the repository, then "npx playwright install chromium".'); process.exit(2); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.csv': 'text/csv; charset=utf-8', '.dxf': 'application/dxf' };
let base = source, server = null;
if (!/^https?:/.test(source)) {
  server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^\/+/, '') || 'index.html';
    try { const body = await readFile(join(source, path)); res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }); res.end(body); }
    catch { res.writeHead(404); res.end('not found'); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  base = `http://127.0.0.1:${server.address().port}/`;
}
if (!base.endsWith('/')) base += '/';
mkdirSync(out, { recursive: true });

const touch = { deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const SIZES = { phone: { width: 390, height: 844, ...touch }, small: { width: 360, height: 740, ...touch }, landscape: { width: 844, height: 390, ...touch }, desktop: { width: 1440, height: 900, deviceScaleFactor: 1 } };
const LAYERS = [['dims', '[data-layer^="A-ANNO-DIMS"]'], ['names', '[data-layer="A-AREA-IDEN"]'], ['furniture', '[data-layer="A-FURN"]'], ['grid', '[data-layer^="S-GRID"]']];

let failed = 0, passed = 0;
const check = (size, what, ok, detail = '') => {
  ok ? passed++ : failed++;
  if (!ok || process.env.VERBOSE) console.log(`${ok ? 'ok  ' : 'FAIL'} ${size.padEnd(9)} ${what}${detail ? `: ${detail}` : ''}`);
};

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const size of onlySizes ?? Object.keys(SIZES)) {
  if (!SIZES[size]) { console.error(`unknown size: ${size} (have: ${Object.keys(SIZES).join(', ')})`); process.exit(2); }
  const { width, height, ...device } = SIZES[size];
  const context = await browser.newContext({ viewport: { width, height }, ...device });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 300)));
  // "GL Driver Message" is the software renderer of the headless browser reporting on the screenshots, not the page.
  page.on('console', m => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('GL Driver Message')) errors.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
  page.on('requestfailed', q => errors.push(`failed: ${q.url()}`));
  page.on('response', q => { if (q.status() >= 400) errors.push(`${q.status()}: ${q.url()}`); });
  const wait = (ms = 350) => page.waitForTimeout(ms);
  const shot = tag => page.screenshot({ path: join(out, `${size}-${tag}.png`) });

  await page.goto(base, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.viewer, null, { timeout: 60000 });
  let views = await page.evaluate(() => import('./content.js').then(m => m.VIEWS.map(v => ({ key: v.key, plan: v.plan ?? null, cut: v.cut ?? null, stack: Boolean(v.stack), actions: (v.actions ?? []).map(a => a.key), spots: (v.spots ?? []).map(p => p.key) }))));
  if (onlyViews) views = views.filter(v => onlyViews.includes(v.key));
  check(size, 'views', views.length > 0, views.length ? '' : 'no view of web/content.js matches');

  // The labels that are on screen, with their centre.
  const labels = () => page.evaluate(() => [...document.querySelectorAll('#labels .label')].filter(e => e.getClientRects().length && !e.classList.contains('hide')).map(e => { const b = e.getBoundingClientRect(); return [Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2)]; }));
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight);
  // Every toolbar button lies inside the stage and none overlaps another.
  const toolbar = () => page.evaluate(() => {
    const stage = document.getElementById('stage').getBoundingClientRect();
    const boxes = [...document.querySelectorAll('#tools button')].filter(b => b.getClientRects().length).map(b => b.getBoundingClientRect());
    const inside = boxes.every(b => b.left >= stage.left - .5 && b.right <= stage.right + .5 && b.top >= 0);
    const overlap = boxes.some((a, i) => boxes.some((b, j) => j > i && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1));
    return { buttons: boxes.length, inside, overlap };
  });
  const plan = () => page.evaluate(() => { const v = window.viewer, svg = document.querySelector('#plan svg'); return { mode: v.state.mode, code: svg?.dataset.plan ?? null, scale: +v.plan.view.scale.toFixed(3), cx: Math.round(v.plan.view.cx), cy: Math.round(v.plan.view.cy), moved: v.plan.moved }; });

  // ---- the model
  let toggled = false;
  for (const view of views) {
    await page.evaluate(k => window.viewer.setView(k, { instant: true, mode: 'model' }), view.key);
    await wait(1300);
    await shot(view.key);
    const bar = await toolbar();
    check(size, `${view.key} toolbar`, bar.buttons > 0 && bar.inside && !bar.overlap, JSON.stringify(bar));
    check(size, `${view.key} page does not scroll`, !(await overflow()));
    const before = await labels();
    if (before.length) {
      // Turn the camera: the labels must land somewhere else, because they belong to points of the model.
      await page.evaluate(() => { const v = window.viewer, p = v.pose(); v.setPose({ ...p, az: p.az + 70, el: Math.max(25, p.el - 15) }); v.controls.update(); });
      await wait(700);
      const after = await labels();
      const moved = before.filter((b, i) => after[i] && (Math.abs(b[0] - after[i][0]) > 3 || Math.abs(b[1] - after[i][1]) > 3)).length;
      check(size, `${view.key} labels follow the model`, after.length > 0 && moved >= Math.ceil(Math.min(before.length, after.length) / 2), `${moved} of ${before.length} moved`);
      await shot(`${view.key}-turned`);
      if (!toggled) {
        toggled = true;
        await page.click('#btn-labels'); await wait();
        const off = { pressed: await page.getAttribute('#btn-labels', 'aria-pressed'), shown: (await labels()).length };
        await shot(`${view.key}-no-labels`);
        await page.click('#btn-labels'); await wait();
        const on = { pressed: await page.getAttribute('#btn-labels', 'aria-pressed'), shown: (await labels()).length };
        check(size, 'one button hides and shows every label', off.shown === 0 && off.pressed === 'false' && on.shown > 0 && on.pressed === 'true', JSON.stringify({ off, on }));
      }
      await page.click('#btn-reset'); await wait(900);
    }
    if (view.cut != null) {
      await page.click('#btn-cut'); await wait(500); await shot(`${view.key}-other-cut`);
      await page.click('#btn-cut'); await wait(200);
    }
    if (view.stack) {
      await page.evaluate(() => window.viewer.setExplode(1)); await wait(1200); await shot(`${view.key}-apart`);
      check(size, `${view.key} pulled apart, page does not scroll`, !(await overflow()));
      await page.evaluate(() => window.viewer.setExplode(0)); await wait(300);
    }
    if (view.actions.length || view.spots.length) {
      // The row of buttons lies inside the stage, above the bottom panel on a phone.
      const row = await page.evaluate(() => { const s = document.getElementById('stage').getBoundingClientRect(), r = document.getElementById('acts-row').getBoundingClientRect(); return { buttons: document.querySelectorAll('#acts-row button').length, inside: r.left >= s.left - .5 && r.right <= s.right + .5 && r.top >= s.top && r.bottom <= s.bottom + .5 }; });
      check(size, `${view.key} action row`, row.buttons === view.actions.length + view.spots.length && row.inside, JSON.stringify(row));
      // Where the parts of an action are: it must change when the button is pressed and come back.
      const placed = key => page.evaluate(k => { const v = window.viewer, a = v.actions.get(k); const at = []; for (const m of a.def.moves) for (const q of v.floors.get(m.floor).parts) if (m.parts.includes(q.code)) at.push(...q.mesh.position.toArray(), ...q.mesh.scale.toArray()); return at.map(n => n.toFixed(3)).join(' '); }, key);
      for (const key of view.actions) {
        const rest = await placed(key);
        await page.click(`[data-action="${key}"]`); await wait(2200);
        const on = await placed(key), pressed = await page.getAttribute(`[data-action="${key}"]`, 'aria-pressed');
        await shot(`${view.key}-action-${key}`);
        await page.click(`[data-action="${key}"]`); await wait(2200);
        check(size, `${view.key} action "${key}" moves its parts and puts them back`, on !== rest && pressed === 'true' && (await placed(key)) === rest, on === rest ? 'nothing moved' : '');
      }
      for (const key of view.spots) {
        await page.click(`[data-spot="${key}"]`); await wait(1500);
        const inside = await page.evaluate(() => { const v = window.viewer; return { spot: v.state.spot, fov: v.camera.fov, cut: v.state.cut }; });
        await shot(`${view.key}-spot-${key}`);
        check(size, `${view.key} spot "${key}"`, inside.spot === key && inside.fov > 40 && inside.cut === false, JSON.stringify(inside));
        check(size, `${view.key} spot "${key}", page does not scroll`, !(await overflow()));
      }
      if (view.spots.length) {
        await page.click('#btn-reset'); await wait(1000);
        const back = await page.evaluate(() => { const v = window.viewer; return { spot: v.state.spot, fov: v.camera.fov, cut: v.state.cut, min: v.controls.minDistance }; });
        check(size, `${view.key} leaving a spot restores the camera`, back.spot === null && back.fov < 40 && back.cut === (view.cut === true) && back.min > 1, JSON.stringify(back));
      }
    }
  }
  if (!toggled) check(size, 'labels', false, 'no view shows a label, so the labels could not be checked');

  // ---- the drawings
  const drawn = views.filter(v => v.plan);
  for (const view of drawn) {
    await page.evaluate(k => window.viewer.setView(k, { instant: true, mode: 'model' }), view.key);
    await wait(400);
    await page.click('#btn-plan');
    const loaded = await page.waitForFunction(code => document.querySelector('#plan svg')?.dataset.plan === code, view.plan, { timeout: 15000 }).then(() => true, () => false);
    check(size, `${view.key} drawing opens`, loaded, `cad/${view.plan}.svg`);
    if (!loaded) continue;
    await wait(500);
    await shot(`${view.key}-plan`);
    const bar = await toolbar();
    check(size, `${view.key} drawing toolbar`, bar.buttons > 0 && bar.inside && !bar.overlap, JSON.stringify(bar));
    check(size, `${view.key} drawing, page does not scroll`, !(await overflow()));

    for (const [group, selector] of LAYERS) {
      const count = () => page.evaluate(s => [...document.querySelectorAll(`#plan ${s}`)].filter(g => getComputedStyle(g).display !== 'none').length, selector);
      const before = await count();
      if (!before) continue;   // this drawing has nothing on that layer
      await page.click(`[data-layers="${group}"]`);
      const off = await count();
      await page.click(`[data-layers="${group}"]`);
      check(size, `${view.key} switch "${group}"`, off === 0 && (await count()) === before, `${before} shown, ${off} after switching off`);
    }

    // Tap the first room: its card opens inside the stage, the room is marked and stays visible beside the card.
    const room = await page.evaluate(() => { const v = window.viewer; return v.building.floors.find(f => f.code === v.state.view.plan)?.rooms[0]?.code ?? null; });
    if (room) {
      const point = await page.evaluate(code => { const v = window.viewer, r = v.building.floors.find(f => f.code === v.state.view.plan).rooms.find(q => q.code === code), p = v.plan.locate(r.label_x_mm, r.label_z_mm), b = document.getElementById('plan').getBoundingClientRect(); return { x: b.left + p.x, y: b.top + p.y }; }, room);
      await (device.hasTouch ? page.touchscreen.tap(point.x, point.y) : page.mouse.click(point.x, point.y));
      await wait();
      const card = await page.evaluate(code => {
        const v = window.viewer, c = document.getElementById('room-card'), b = c.getBoundingClientRect(), stage = document.getElementById('stage').getBoundingClientRect(), host = document.getElementById('plan').getBoundingClientRect();
        const r = v.building.floors.find(f => f.code === v.state.view.plan).rooms.find(q => q.code === code), p = v.plan.locate(r.label_x_mm, r.label_z_mm);
        return { shown: !c.hidden, name: document.getElementById('room-name').textContent, facts: document.querySelectorAll('#room-facts dt').length, marked: [...document.querySelectorAll('#plan .rooms path.on')].map(e => e.dataset.room),
          inside: b.left >= stage.left - .5 && b.right <= stage.right + .5 && b.bottom <= stage.bottom + .5 && b.top >= 0,
          covered: host.top + p.y > b.top && host.top + p.y < b.bottom && host.left + p.x > b.left && host.left + p.x < b.right };
      }, room);
      check(size, `${view.key} room card`, card.shown && card.inside && !card.covered && card.facts > 0 && card.marked.includes(room), JSON.stringify(card));
      await shot(`${view.key}-plan-room`);
      await page.click('#room-close'); await wait(200);
      check(size, `${view.key} room card closes`, await page.evaluate(() => document.getElementById('room-card').hidden && !document.querySelector('#plan .rooms path.on')));
    }

    // Zoom in with the wheel or a pinch, then "fit" must give the first framing back.
    await page.click('#btn-fit'); await wait();
    const fitted = await plan(), box = await page.locator('#plan').boundingBox(), mid = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    if (device.hasTouch) {
      const cdp = await context.newCDPSession(page), fingers = d => [{ x: mid.x - d, y: mid.y, id: 1 }, { x: mid.x + d, y: mid.y, id: 2 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: fingers(40) });
      for (const d of [55, 70, 85, 100, 120]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: fingers(d) });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await page.mouse.move(mid.x, mid.y);
      for (let i = 0; i < 4; i++) await page.mouse.wheel(0, -260);
    }
    await wait();
    const zoomed = await plan();
    await page.click('#btn-fit'); await wait();
    const again = await plan();
    check(size, `${view.key} zoom and fit`, zoomed.scale !== fitted.scale && again.scale === fitted.scale && again.cx === fitted.cx && again.cy === fitted.cy, JSON.stringify({ fitted: fitted.scale, zoomed: zoomed.scale, again: again.scale }));

    const links = await page.evaluate(() => Promise.all([...document.querySelectorAll('#notes .links a')].map(a => fetch(a.href).then(q => [a.getAttribute('href'), q.status], () => [a.getAttribute('href'), 0]))));
    check(size, `${view.key} downloads`, links.length > 0 && links.every(l => l[1] === 200), links.filter(l => l[1] !== 200).map(l => `${l[1]} ${l[0]}`).join(', ') || `${links.length} links`);
  }

  // The notes of the model views link to files too.
  for (const view of views) {
    await page.evaluate(k => window.viewer.setView(k, { instant: true, mode: 'model' }), view.key); await wait(250);
    const links = await page.evaluate(() => Promise.all([...document.querySelectorAll('#notes .links a')].map(a => fetch(a.href).then(q => [a.getAttribute('href'), q.status], () => [a.getAttribute('href'), 0]))));
    if (links.length) check(size, `${view.key} links of the notes`, links.every(l => l[1] === 200), links.filter(l => l[1] !== 200).map(l => `${l[1]} ${l[0]}`).join(', '));
  }

  // The address of a drawing opens that drawing directly.
  if (drawn.length) {
    await page.goto(`${base}#${drawn[0].key}/plan`, { waitUntil: 'load' });
    await page.reload({ waitUntil: 'load' });
    const direct = await page.waitForFunction(code => window.viewer?.state.mode === 'plan' && document.querySelector('#plan svg')?.dataset.plan === code, drawn[0].plan, { timeout: 30000 }).then(() => true, () => false);
    check(size, `address #${drawn[0].key}/plan opens the drawing`, direct);
  }
  check(size, 'no error in the console, no failed request', errors.length === 0, [...new Set(errors)].slice(0, 6).join(' | '));
  await context.close();
}
await browser.close();
server?.close();
console.log(`${failed ? 'FAILED' : 'passed'}: ${passed} checks passed, ${failed} failed. Screenshots: ${out}`);
process.exit(failed ? 1 : 0);
