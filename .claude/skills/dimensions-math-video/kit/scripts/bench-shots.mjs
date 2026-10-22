// Stills of the bench alone (no text column, no captions) as one contact sheet, in a few seconds and
// without assembling the video. Use it while drawing a picture; the stills of the whole composition
// (scripts/snap.sh) come later.
//   node scripts/bench-shots.mjs <name> <cols> <times>     -> snapshots/bench/<name>.jpg
//   <times>: "mid" or "late" for every frame, or a list "4:2.5,4:6,9:1" (frame:seconds into it),
//            or plain seconds of the video "12.4,80"
// Needs Chrome (set CHROME to its path when it is not in the usual place) and ffmpeg.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { extname, join, normalize } from "node:path";
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const project = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const [name, cols = "3", times = "mid"] = process.argv.slice(2);
if (!name || /[\/.]/.test(name) || !(+cols >= 1)) {
  console.error("usage: bench-shots.mjs <name> <cols> <mid | late | frame:rel,frame:rel,... | seconds,...>");
  process.exit(2);
}
const chrome = [process.env.CHROME, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((p) => p && existsSync(p));
if (!chrome) {
  console.error("Chrome not found: set CHROME to its path");
  process.exit(2);
}
const out = join(project, "snapshots/bench");
mkdirSync(out, { recursive: true });
const TYPES = { ".js": "text/javascript", ".mjs": "text/javascript", ".html": "text/html", ".woff2": "font/woff2", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };

const page = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "Plus Jakarta Sans"; src: url("/assets/fonts/PlusJakartaSans-VN.woff2") format("woff2"); font-weight: 200 800; font-style: normal; font-display: block; }
html, body { margin: 0; background: #000; } canvas { display: block; }
</style></head><body><canvas id="sheet"></canvas><canvas id="w" width="1920" height="1080" style="display:none"></canvas>
<script type="module">
const log = (m) => fetch("/__log", { method: "POST", body: String(m) });
window.addEventListener("error", (e) => log("ERROR " + e.message + " @" + e.filename + ":" + e.lineno));
window.addEventListener("unhandledrejection", (e) => log("REJECT " + (e.reason && e.reason.stack || e.reason)));
try {
  const { createWorld } = await import("/assets/lib/world/world.js");
  const { CUES } = await import("/assets/lib/world/cues.js");
  const q = new URLSearchParams(location.search), cols = +q.get("cols"), want = q.get("t");
  const every = (f) => CUES.frames.map((x) => x.n + ":" + f(x).toFixed(2));
  const list = want === "mid" ? every((x) => x.dur / 2) : want === "late" ? every((x) => x.dur - 0.35) : want.split(",");
  const cw = 1920 / cols, ch = cw * 9 / 16, rows = Math.ceil(list.length / cols);
  const sheet = document.getElementById("sheet"); sheet.width = 1920; sheet.height = rows * ch;
  const w = document.getElementById("w"), world = createWorld({ canvas: w });
  await world.ready;
  const s = sheet.getContext("2d");
  list.forEach((item, i) => {
    const [f, rel] = item.split(":"), t = rel === undefined ? +f : CUES.frames[+f - 1].start + +rel;
    try { world.renderAt(t); } catch (e) { log("RENDER " + item + " " + e.stack); }
    const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
    s.drawImage(w, x, y, cw, ch);
    s.strokeStyle = "#444"; s.lineWidth = 1; s.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
    s.fillStyle = "rgba(0,0,0,0.7)"; s.fillRect(x + 4, y + 4, 190, 26);
    s.fillStyle = "#fff"; s.font = "700 17px monospace"; s.textBaseline = "middle";
    s.fillText(rel === undefined ? t.toFixed(2) : "F" + f + "+" + (+rel).toFixed(1) + " @" + t.toFixed(1), x + 9, y + 18);
  });
  await log("ROWS " + rows);
} catch (e) { await log("FAIL " + e.stack); }
</script></body></html>`;

let failed = false;
const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/__log") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      if (!body.startsWith("ROWS")) (console.log(body), (failed = true));
      res.end("ok");
    });
    return;
  }
  if (url.pathname === "/__sheet.html") {
    res.writeHead(200, { "content-type": "text/html" });
    return res.end(page);
  }
  try {
    const file = join(project, normalize(decodeURIComponent(url.pathname)));
    if (!file.startsWith(project + "/")) throw new Error("outside");
    const data = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(data);
  } catch (_) {
    res.writeHead(404);
    res.end("not found");
  }
});
// the sheet is as tall as its rows: "mid" and "late" have one tile a frame
const cues = await import(new URL("../assets/lib/world/cues.js", import.meta.url));
const every = times === "mid" || times === "late", n = every ? cues.CUES.frames.length : times.split(",").length;
if (!every) {
  for (const item of times.split(",")) {
    const [f, rel] = item.split(":");
    if (!Number.isFinite(+f) || (rel !== undefined && (!Number.isFinite(+rel) || !cues.CUES.frames[+f - 1]))) {
      console.error(`"${item}" is not a moment of this video: write frame:seconds (frames 1-${cues.CUES.frames.length}) or plain seconds`);
      process.exit(2);
    }
  }
}
const height = Math.round(Math.ceil(n / +cols) * ((1920 / +cols) * 9) / 16);
server.listen(0, "127.0.0.1", () => {
  const port = server.address().port, png = join(out, `${name}.png`), jpg = join(out, `${name}.jpg`);
  const profile = mkdtempSync(join(tmpdir(), "bench-shots-"));
  const args = ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--force-device-scale-factor=1", `--user-data-dir=${profile}`, `--window-size=1920,${height}`, "--virtual-time-budget=20000", `--screenshot=${png}`, `http://127.0.0.1:${port}/__sheet.html?cols=${cols}&t=${encodeURIComponent(times)}`];
  rmSync(png, { force: true });
  const p = spawn(chrome, args, { stdio: ["ignore", "ignore", "ignore"] });
  // Chrome writes the still and then lingers: stop it once the file is whole
  const kill = setTimeout(() => p.kill("SIGKILL"), 90000);
  let size = -1;
  const watch = setInterval(() => {
    const now = existsSync(png) ? statSync(png).size : -1;
    if (now > 0 && now === size) p.kill("SIGKILL");
    size = now;
  }, 400);
  p.on("exit", () => {
    clearTimeout(kill);
    clearInterval(watch);
    const f = spawn("ffmpeg", ["-v", "error", "-y", "-i", png, "-q:v", "3", jpg], { stdio: "inherit" });
    f.on("exit", (code) => {
      rmSync(png, { force: true });
      rmSync(profile, { recursive: true, force: true });
      console.log(code !== 0 ? "no sheet was written" : `snapshots/bench/${name}.jpg  (${n} stills)${failed ? ", with the errors above" : ""}`);
      server.close();
      process.exit(code === 0 && !failed ? 0 : 1);
    });
  });
});
