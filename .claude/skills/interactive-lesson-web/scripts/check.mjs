// Opens a built lesson in headless Chrome at three sizes and walks it: load, play, the first question
// (answered right), a tap on something the lesson explains, and three moments of the lesson.
//   node check.mjs <built-lesson-dir> <screenshot-dir> [desktop,phone,landscape]
// Prints one JSON line per size. It cannot hear the sound or judge motion; it only proves the parts work.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { join, extname, normalize, resolve } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const repo = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: new URL(".", import.meta.url).pathname }).toString().trim();
const { chromium } = createRequire(join(repo, "package.json"))("playwright");

const [dist, out, sizes] = process.argv.slice(2);
if (!dist || !out) throw new Error("usage: node check.mjs <built-lesson-dir> <screenshot-dir> [desktop,phone,landscape]");
mkdirSync(out, { recursive: true });

// a plain static server, like Pages: whole files, no ranges
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".glb": "model/gltf-binary", ".woff2": "font/woff2", ".m4a": "audio/mp4", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json" };
const server = createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^\/+/, "") || "index.html";
  try {
    const file = join(resolve(dist), p);
    await stat(file);
    res.writeHead(200, { "content-type": TYPES[extname(p)] ?? "application/octet-stream" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/`;

const flags = ["--autoplay-policy=no-user-gesture-required", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
const browser = await chromium.launch({ channel: "chrome", args: flags }).catch(() => chromium.launch({ args: flags }));
const touch = { deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const SIZES = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844, ...touch }, landscape: { width: 844, height: 390, ...touch } };
const only = sizes?.split(",");

for (const [name, { width, height, ...rest }] of Object.entries(SIZES)) {
  if (only && !only.includes(name)) continue;
  const ctx = await browser.newContext({ viewport: { width, height }, ...rest });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  page.on("response", (r) => r.status() >= 400 && errs.push(`${r.status()} ${r.url()}`));
  const shot = (s) => page.screenshot({ path: `${out}/${name}-${s}.png`, fullPage: s.endsWith("full") });
  const result = { errs };

  await page.goto(url);
  const loaded = await page.waitForSelector("#start:not([disabled])", { timeout: 60000 }).catch(() => null);
  if (!loaded) {
    console.log(name, JSON.stringify({ loaded: false, veil: await page.textContent("#veil-text").catch(() => null), errs }));
    await ctx.close();
    continue;
  }
  await shot("veil");
  await page.click("#start");
  await page.waitForTimeout(800);
  result.playing = await page.evaluate(() => ({ paused: document.getElementById("audio").paused, err: document.getElementById("audio").error?.code ?? null }));
  const L = await page.evaluate(() => {
    const { PARTS, CHAPTERS, TOTAL, asks } = window.__lesson;
    return { parts: PARTS.map((p) => ({ label: p.label, site: p.site, explain: p.explain, why: Object.keys(p.why ?? {}), ask: p.ask })), chapters: CHAPTERS, total: TOTAL, asks };
  });
  result.frames = L.chapters.length;

  // the first question: run into it, answer it right, then let the answer play
  const qi = L.asks.findIndex((t) => t != null);
  if (qi >= 0) {
    await page.evaluate((t) => window.__lesson.seek(t), L.asks[qi] - 0.8);
    // software WebGL can make the page loop slow, so wait for the pause rather than a fixed time
    await page.waitForSelector("#ask:not([hidden])", { timeout: 10000 }).catch(() => null);
    result.asked = await page.evaluate(() => !document.getElementById("ask").hidden);
    if (result.asked) {
      const opts = await page.evaluate((i) => window.__lesson.options(i), qi);
      const q = L.parts[qi].ask;
      for (const id of q.kind === "order" ? q.answer : [q.answer]) await page.locator("#ask .pick").nth(opts.findIndex((o) => o[0] === id)).click();
      await page.click('#ask button:text-is("Kiểm tra")');
      result.right = await page.evaluate(() => !!document.querySelector("#ask .result.ok"));
      await shot("ask-full");
      await page.click('#ask button:text-is("Nghe lời giải")');
    }
  }

  // a tap on the first thing a part explains, once its explanation has started
  const tp = L.parts.findIndex((p) => p.site != null && p.why.length);
  if (tp >= 0 && (await page.evaluate(() => typeof window.__lesson.world.actorsOnScreen === "function"))) {
    const p = L.parts[tp];
    await page.evaluate(() => scrollTo(0, 0));
    await page.evaluate((t) => window.__lesson.seek(t), L.chapters[(p.explain ?? 1) - 1].start + 2);
    await page.evaluate(() => document.getElementById("audio").pause());
    await page.waitForTimeout(400);
    const actors = await page.evaluate(() => window.__lesson.world.actorsOnScreen());
    const a = actors.find((x) => x.site === p.site && p.why.includes(x.id));
    result.tap = a ? a.id : `none of ${p.why} on screen`;
    if (a) {
      const box = await page.locator("#layers canvas").first().boundingBox();
      await page.mouse.click(box.x + (a.x * box.width) / 1920, box.y + (a.y * box.height) / 1080);
      await page.waitForTimeout(400);
      result.card = await page.evaluate(() => !document.getElementById("pop").hidden || !document.getElementById("sheet").hidden);
      await shot("card");
    }
  }

  // three moments, to see the crop and the panel
  for (const f of [0.2, 0.55, 0.95]) {
    await page.evaluate(() => scrollTo(0, 0));
    await page.evaluate((t) => window.__lesson.seek(t), L.total * f);
    await page.evaluate(() => document.getElementById("audio").pause());
    await page.waitForTimeout(400);
    await shot(`at${Math.round(f * 100)}-full`);
  }
  result.overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  console.log(name, JSON.stringify(result));
  await ctx.close();
}
await browser.close();
server.close();
