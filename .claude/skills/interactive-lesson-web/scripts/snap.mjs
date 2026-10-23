// Contact sheet of a built lesson's stage at the middle of every frame, next to the rendered video at the
// same moments, to choose META.view and to see what the video shows that the world alone does not.
//   node snap.mjs <built-lesson-dir> <video-project> <out.jpg>
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { mkdirSync, rmSync } from "node:fs";
import { join, extname, normalize, resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const repo = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: new URL(".", import.meta.url).pathname }).toString().trim();
const { chromium } = createRequire(join(repo, "package.json"))("playwright");
const [dist, videoDir, out] = process.argv.slice(2).map((p) => resolve(p));
const tmp = join(dirname(out), `.snap-${process.pid}`);
mkdirSync(tmp, { recursive: true });

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".glb": "model/gltf-binary", ".woff2": "font/woff2", ".m4a": "audio/mp4" };
const server = createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^\/+/, "") || "index.html";
  try {
    await stat(join(dist, p));
    res.writeHead(200, { "content-type": TYPES[extname(p)] ?? "application/octet-stream" });
    res.end(await readFile(join(dist, p)));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));

const { CHAPTERS, TOTAL } = await import(join(dist, "data.js"));
const times = CHAPTERS.map((c, i) => ((c.start + (CHAPTERS[i + 1]?.start ?? TOTAL)) / 2).toFixed(2));
const flags = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
const browser = await chromium.launch({ channel: "chrome", args: flags }).catch(() => chromium.launch({ args: flags }));
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await page.waitForSelector("#start:not([disabled])", { timeout: 60000 });
await page.evaluate(() => (document.getElementById("veil").hidden = true));
for (const [i, t] of times.entries()) {
  await page.evaluate((x) => window.__lesson.seek(x), +t);
  await page.waitForTimeout(250);
  await page.locator("#stage").screenshot({ path: join(tmp, `w${String(i).padStart(2, "0")}.png`) });
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", t, "-i", join(videoDir, "renders/video.mp4"), "-frames:v", "1", "-vf", "scale=640:-2", join(tmp, `v${String(i).padStart(2, "0")}.png`)]);
}
await browser.close();
server.close();

// rows of [video | world] pairs in frame order, three pairs a row (this ffmpeg may lack drawtext, so no labels)
const filter = times
  .map((t, i) => `[${2 * i}:v]scale=640:360[a${i}];[${2 * i + 1}:v]scale=640:360,pad=640:360:0:0:red[b${i}]`)
  .join(";");
const inputs = times.flatMap((_, i) => ["-i", join(tmp, `v${String(i).padStart(2, "0")}.png`), "-i", join(tmp, `w${String(i).padStart(2, "0")}.png`)]);
const cols = 6;
const pads = times.map((_, i) => `[a${i}][b${i}]`).join("");
execFileSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", `${filter};${pads}xstack=inputs=${2 * times.length}:layout=${times.flatMap((_, i) => [i * 2, i * 2 + 1]).map((k) => `${(k % cols) * 640}_${Math.floor(k / cols) * 360}`).join("|")}:fill=black,scale=iw/2:-2`, "-q:v", "4", out]);
rmSync(tmp, { recursive: true, force: true });
console.log(`${out}: ${times.length} frames at ${times.join(", ")}s`);
