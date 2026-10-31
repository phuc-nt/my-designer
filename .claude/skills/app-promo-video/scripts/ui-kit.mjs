#!/usr/bin/env node
// App UI kit for promo videos: the app's screens redrawn in HTML/CSS from its own source, laid out and measured
// in headless Chrome so every frame worker aims taps, pop-out copies and highlights at the same numbers.
//   node ui-kit.mjs measure [project]                          -> <kit>/measure.json (screen points, fonts loaded)
//   node ui-kit.mjs preview [project] [--width 2600]           -> <kit>/preview.png, every screen unscaled and labelled
//   node ui-kit.mjs doc     [project] [--title "App name"]     -> .hyperframes/frame-packets/_app-ui-kit.md for workers
//   node ui-kit.mjs snippet <screen|css> <fNN> [project]       -> that screen's HTML (or kit.css), kx- renamed to fNN-
//   node ui-kit.mjs point   <screen> <key> --left L --top T [--scale 0.86] [--index i] [--anchor center|tl] [project]
//                                                              -> frame pixel of a measured element on a placed device
// Kit layout (scaffolded by new-project.sh): <project>/.hyperframes/app-ui-kit/{kit.css, RULES.md, screens/*.html}.
// A screen file holds one device: <div class="kx-phone" data-screen="reader"><div class="kx-screen">…</div></div>
// (kx-pad for a tablet). Mark what workers aim at with data-m="key"; a key used on several elements becomes a list.
// The page gets <base href> = project root, so kit.css and screens use the frames' paths (assets/fonts/…).
// Chrome: $CHROME, else Google Chrome, Chromium, or Chrome for Testing in the puppeteer cache.
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { homedir } from "node:os";

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(name);
  if (i < 0) return dflt;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const usage = () => {
  console.error("usage: ui-kit.mjs measure|preview|doc [project] | snippet <screen|css> <fNN> [project] | point <screen> <key> --left L --top T [project]");
  process.exit(2);
};

const cmd = args.shift();
const width = +flag("--width", 2600);
const title = flag("--title", "");
const left = flag("--left");
const top = flag("--top");
const scale = +flag("--scale", 0.86);
const index = +flag("--index", 0);
const anchor = flag("--anchor", "center");
const positional = args.filter((a) => !a.startsWith("--"));
const need = { snippet: 2, point: 2 }[cmd] ?? 0;
if (!cmd || positional.length < need) usage();
const project = resolve(positional[need] ?? ".");
const kit = join(project, ".hyperframes/app-ui-kit");
const screensDir = join(kit, "screens");
if (!existsSync(join(kit, "kit.css"))) {
  console.error(`no kit at ${kit}: run new-project.sh first`);
  process.exit(2);
}

const css = () => readFileSync(join(kit, "kit.css"), "utf8");
const screenFiles = () => (existsSync(screensDir) ? readdirSync(screensDir).filter((f) => f.endsWith(".html")).sort() : []);
const screenName = (f) => {
  const m = readFileSync(join(screensDir, f), "utf8").match(/data-screen\s*=\s*"([^"]+)"/);
  return m ? m[1] : basename(f, ".html");
};
const screenSource = (name) => {
  const f = screenFiles().find((x) => screenName(x) === name || basename(x, ".html") === name);
  if (!f) {
    console.error(`no screen "${name}" in ${screensDir} (have: ${screenFiles().map(screenName).join(", ")})`);
    process.exit(2);
  }
  return readFileSync(join(screensDir, f), "utf8");
};
const rename = (text, prefix) => text.replace(/\bkx-/g, `${prefix}-`);

function chrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const fixed = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  for (const p of fixed) if (existsSync(p)) return p;
  const cache = join(homedir(), ".cache/puppeteer/chrome");
  if (existsSync(cache)) {
    for (const v of readdirSync(cache).sort().reverse()) {
      for (const sub of readdirSync(join(cache, v))) {
        const mac = join(cache, v, sub, "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
        const lin = join(cache, v, sub, "chrome");
        if (existsSync(mac)) return mac;
        if (existsSync(lin)) return lin;
      }
    }
  }
  console.error("no Chrome found: set CHROME=/path/to/chrome");
  process.exit(2);
}

// One page with every screen side by side, unscaled. The script waits for fonts and images, then writes the
// rects (relative to each .kx-screen) into <pre id="out"> for --dump-dom to carry back.
function board() {
  const files = screenFiles();
  if (!files.length) {
    console.error(`no screens in ${screensDir}`);
    process.exit(2);
  }
  const cells = files.map((f) => `<div class="kxb-cell"><div class="kxb-lab">${screenName(f)}</div><div class="kxb-dev">${readFileSync(join(screensDir, f), "utf8")}</div></div>`).join("\n");
  const base = pathToFileURL(project).href.replace(/\/?$/, "/");
  const page = `<!doctype html><html><head><meta charset="utf-8"><base href="${base}">
<style>${css()}
html,body{margin:0;background:#101014}
#kxb-board{display:flex;flex-wrap:wrap;align-items:flex-start;gap:48px;padding:48px;width:${width - 96}px}
.kxb-cell{display:flex;flex-direction:column;gap:14px}
.kxb-lab{color:#c9c9d1;font:600 24px/1.2 ui-monospace,Menlo,monospace}
.kxb-dev>[data-screen]{position:relative!important;left:0!important;top:0!important;transform:none!important}
#out{display:none}
</style></head><body><div id="kxb-board">${cells}</div><pre id="out"></pre>
<script>
var r1 = function (v) { return Math.round(v * 10) / 10; };
var imgs = Array.prototype.map.call(document.images, function (i) { return i.decode().catch(function () {}); });
Promise.all([document.fonts.ready].concat(imgs)).then(function () { requestAnimationFrame(function () {
  var res = { board: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], screens: {}, fontErrors: [], zero: [] };
  document.fonts.forEach(function (f) { if (f.status === "error") res.fontErrors.push(f.family); });
  document.querySelectorAll("[data-screen]").forEach(function (dev) {
    var name = dev.getAttribute("data-screen"), scr = dev.querySelector(".kx-screen");
    if (!scr) { res.zero.push(name + ": no .kx-screen"); return; }
    var d = dev.getBoundingClientRect(), s = scr.getBoundingClientRect(), keys = {};
    dev.querySelectorAll("[data-m]").forEach(function (el) {
      var k = el.getAttribute("data-m"), a = el.getBoundingClientRect();
      var rect = [r1(a.left - s.left), r1(a.top - s.top), r1(a.width), r1(a.height)];
      if (!a.width && !a.height) res.zero.push(name + "." + k);
      var item = { text: (el.innerText || el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 28), rect: rect };
      (keys[k] = keys[k] || []).push(item);
    });
    var out = {};
    Object.keys(keys).forEach(function (k) {
      out[k] = keys[k].length === 1 ? keys[k][0].rect : keys[k].map(function (i) { return [i.text].concat(i.rect); });
    });
    res.screens[name] = { device: [r1(d.width), r1(d.height)], screen: [r1(s.left - d.left), r1(s.top - d.top), r1(s.width), r1(s.height)],
      kind: dev.classList.contains("kx-pad") ? "pad" : "phone", keys: out };
  });
  document.getElementById("out").textContent = JSON.stringify(res);
}); });
</script></body></html>`;
  const path = join(kit, "_board.html");
  writeFileSync(path, page);
  return path;
}

const chromeFlags = ["--headless=new", "--disable-gpu", "--allow-file-access-from-files", "--hide-scrollbars", "--force-device-scale-factor=1", "--virtual-time-budget=6000"];

function measure() {
  const page = board();
  const r = spawnSync(chrome(), [...chromeFlags, `--window-size=${width},1600`, "--dump-dom", pathToFileURL(page).href], { encoding: "utf8", maxBuffer: 256 << 20 });
  const m = (r.stdout || "").match(/<pre id="out">([\s\S]*?)<\/pre>/);
  if (!m || !m[1].trim()) {
    console.error("Chrome returned no measurements (fonts or images never settled?)");
    console.error((r.stderr || "").split("\n").slice(-5).join("\n"));
    process.exit(1);
  }
  const res = JSON.parse(m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
  writeFileSync(join(kit, "measure.json"), JSON.stringify(res, null, 1) + "\n");
  return res;
}

function stale() {
  const mj = join(kit, "measure.json");
  if (!existsSync(mj)) return "missing";
  const t = statSync(mj).mtimeMs;
  const src = [join(kit, "kit.css"), ...screenFiles().map((f) => join(screensDir, f))];
  return src.some((f) => statSync(f).mtimeMs > t) ? "older than kit.css or a screen" : "";
}

function report(res) {
  for (const [name, s] of Object.entries(res.screens)) console.log(`  ${name}  ${s.kind} ${s.screen[2]}×${s.screen[3]} pt, ${Object.keys(s.keys).length} keys`);
  if (res.fontErrors.length) console.log(`  FONT FAILED: ${[...new Set(res.fontErrors)].join(", ")} (check the url() paths, root-relative to the project)`);
  if (res.zero.length) console.log(`  zero-size: ${res.zero.join(", ")} (hidden in the kit? measure a visible state)`);
}

if (cmd === "measure") {
  const res = measure();
  console.log(`measured ${Object.keys(res.screens).length} screens -> ${join(kit, "measure.json")}`);
  report(res);
} else if (cmd === "preview") {
  const res = measure();
  const page = join(kit, "_board.html");
  const out = join(kit, "preview.png");
  const h = Math.min(16000, Math.ceil(res.board[1]));
  const r = spawnSync(chrome(), [...chromeFlags, `--window-size=${width},${h}`, `--screenshot=${out}`, pathToFileURL(page).href], { encoding: "utf8" });
  if (r.status !== 0 || !existsSync(out)) {
    console.error("screenshot failed: " + (r.stderr || "").split("\n").slice(-3).join(" "));
    process.exit(1);
  }
  console.log(`preview ${width}×${h} -> ${out} (measure.json refreshed)`);
  report(res);
} else if (cmd === "doc") {
  const why = stale();
  if (why) console.error(`warning: measure.json ${why}; run 'ui-kit.mjs measure' first so the numbers match`);
  const res = existsSync(join(kit, "measure.json")) ? JSON.parse(readFileSync(join(kit, "measure.json"), "utf8")) : { screens: {} };
  const rules = existsSync(join(kit, "RULES.md")) ? readFileSync(join(kit, "RULES.md"), "utf8").trim() : "";
  const name = title || "App";
  const lines = [
    `# ${name} UI kit (HTML): read this before drawing any app screen`,
    "",
    "Generated by `ui-kit.mjs doc` from `.hyperframes/app-ui-kit/` (RULES.md, measure.json, kit.css, screens/). Edit those, never this file.",
    "Every class and id below starts with `kx-`: rename it to your frame prefix (`kx-` → `fNN-`), or print a renamed copy with",
    "`node <skill>/scripts/ui-kit.mjs snippet <screen|css> fNN`. Keep every number; the measured positions depend on them.",
    "Look at `.hyperframes/app-ui-kit/preview.png` to see the screens.",
    "",
    rules,
    "",
    "## Measured positions (screen points, device unscaled, page not scrolled)",
    "",
    "Rects are `[x, y, w, h]` from the top-left of the screen. A list row is `[text, x, y, w, h]`.",
    "Frame pixel of a point on a device placed at (L, T) with scale s: `X = L + s × (screen.x + x)`, `Y = T + s × (screen.y + y)`,",
    "or let `ui-kit.mjs point <screen> <key> --left L --top T --scale s [--index i]` do it.",
    "",
  ];
  for (const [sname, s] of Object.entries(res.screens)) {
    lines.push(`### ${sname} (${s.kind}; device ${s.device.join(" × ")}; screen ${s.screen[2]} × ${s.screen[3]} at offset ${s.screen[0]}, ${s.screen[1]})`, "");
    for (const [k, v] of Object.entries(s.keys)) {
      if (typeof v[0] === "number") lines.push(`- \`${k}\` ${JSON.stringify(v)}`);
      else lines.push(`- \`${k}\` (${v.length}): ` + v.map((row, i) => `${i} "${row[0]}" ${JSON.stringify(row.slice(1))}`).join("; "));
    }
    lines.push("");
  }
  lines.push("## CSS (paste once per frame, renamed)", "", "```css", css().trim(), "```", "", "## Screens (paste inside the frame, renamed)", "");
  for (const f of screenFiles()) {
    const src = readFileSync(join(screensDir, f), "utf8").trim();
    const note = src.match(/^<!--\s*([\s\S]*?)\s*-->/);
    lines.push(`### ${screenName(f)}${note ? `: ${note[1].split("\n")[0]}` : ""}`, "", "```html", src, "```", "");
  }
  const dir = join(project, ".hyperframes/frame-packets");
  mkdirSync(dir, { recursive: true });
  const out = join(dir, "_app-ui-kit.md");
  writeFileSync(out, lines.join("\n"));
  console.log(`${out} (${Math.round(Buffer.byteLength(lines.join("\n")) / 1024)} KB, ${screenFiles().length} screens)`);
} else if (cmd === "snippet") {
  const [what, prefix] = positional;
  if (!/^f\d{2}$/.test(prefix)) usage();
  process.stdout.write(rename(what === "css" ? css() : screenSource(what), prefix));
} else if (cmd === "point") {
  const [sname, key] = positional;
  if (left == null || top == null) usage();
  if (stale()) console.error(`warning: measure.json ${stale()}`);
  const res = JSON.parse(readFileSync(join(kit, "measure.json"), "utf8"));
  const s = res.screens[sname];
  if (!s) {
    console.error(`no screen "${sname}" in measure.json (have: ${Object.keys(res.screens).join(", ")})`);
    process.exit(2);
  }
  const v = s.keys[key];
  if (!v) {
    console.error(`no key "${key}" on ${sname} (have: ${Object.keys(s.keys).join(", ")})`);
    process.exit(2);
  }
  const rect = typeof v[0] === "number" ? v : v[index]?.slice(1);
  if (!rect) {
    console.error(`${key} has ${v.length} items; --index 0..${v.length - 1}`);
    process.exit(2);
  }
  const [x, y, w, h] = rect;
  const ax = anchor === "tl" ? x : x + w / 2;
  const ay = anchor === "tl" ? y : y + h / 2;
  const r2 = (n) => Math.round(n * 100) / 100;
  const X = r2(+left + scale * (s.screen[0] + ax));
  const Y = r2(+top + scale * (s.screen[1] + ay));
  console.log(`${sname}.${key}${typeof v[0] === "number" ? "" : `[${index}] "${v[index][0]}"`} ${anchor} -> x ${X}, y ${Y} (box ${r2(scale * w)} × ${r2(scale * h)})`);
  console.log(`left:${X}px;top:${Y}px`);
} else usage();
