#!/usr/bin/env node
// Advisory lint for the habits that make a frame look machine-made, read from the frame HTML alone.
// It never fails the build: every finding is a question to answer by looking at the contact sheet.
//   node lint-tells.mjs [project-dir] [--accent "#CC785C,#7C5CFF"] [--caption-top 896] [--json]
// Checks, one frame at a time unless noted:
//   accent       the accent colour styles more than one thing (the presets allow it once per frame)
//   kicker       a small all-caps line above the title, in most frames (across frames)
//   numbering    "01", "02 / 05" on screen where nothing is counted
//   side-stripe  a card with one thick coloured side (border-left or border-right of 3px or more)
//   emoji        a colour emoji instead of a drawn icon
//   caption-zone an absolute box whose own px top/height or bottom reach below y = caption-top (subtitles
//                live there); boxes inside a parent are measured from the parent, so confirm on the contact sheet
// The accent defaults to the coral/accent/grad colours named in the project's frame.md.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, basename } from "node:path";

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(name);
  if (i < 0) return dflt;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const json = args.includes("--json");
if (json) args.splice(args.indexOf("--json"), 1);
const captionTop = +flag("--caption-top", 896);
let accents = flag("--accent", "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const project = resolve(args[0] ?? ".");
const dir = join(project, "compositions/frames");
if (!existsSync(dir)) {
  console.error(`no compositions/frames in ${project}`);
  process.exit(2);
}

if (!accents.length && existsSync(join(project, "frame.md"))) {
  const md = readFileSync(join(project, "frame.md"), "utf8");
  for (const m of md.matchAll(/^\s*(?:coral|accent[\w-]*|grad[\w-]*)\s*:\s*["']?[^"'\n]*?(#[0-9a-f]{6}|#[0-9a-f]{3})\b/gim)) accents.push(m[1].toLowerCase());
  accents = [...new Set(accents)];
}

const files = readdirSync(dir).filter((f) => f.endsWith(".html")).sort();
const strip = (html, tag) => html.replace(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`, "gi"), " ");
const px = (decl, prop) => {
  const m = decl.match(new RegExp(`(?:^|[;\\s{])${prop}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)px`, "i"));
  return m ? +m[1] : null;
};
const DECOR = /bg|background|backdrop|grain|noise|vignette|glow|texture|caption|stage|root|wrap/i;

const report = [];
let kickerFrames = 0;
for (const f of files) {
  const html = readFileSync(join(dir, f), "utf8");
  const css = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1].replace(/\/\*[\s\S]*?\*\//g, "")).join("\n");
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim().split("\n").pop().trim(), decl: m[2] }));
  const body = strip(strip(html, "style"), "script");
  const text = body.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const found = [];

  if (accents.length) {
    const lower = html.toLowerCase();
    const vars = rules.flatMap((r) => [...r.decl.matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)].filter((m) => accents.some((a) => m[2].toLowerCase().includes(a))).map((m) => m[1]));
    const uses = (s) => accents.some((a) => s.includes(a)) || vars.some((v) => s.includes(`var(${v.toLowerCase()}`));
    let n = 0;
    for (const r of rules) {
      const own = r.decl.toLowerCase().replace(/--[\w-]+\s*:[^;]+;?/g, "");
      if (uses(own)) n++;
    }
    for (const m of strip(strip(lower, "style"), "script").matchAll(/\s(?:style|fill|stroke|stop-color|color)\s*=\s*"([^"]*)"/g)) if (uses(m[1])) n++;
    if (n > 1) found.push(["accent", `accent colour styles ${n} things; the presets allow one per frame`]);
  }

  const kicker = rules.find((r) => /text-transform\s*:\s*uppercase/i.test(r.decl) && /letter-spacing\s*:\s*0?\.\d+em/i.test(r.decl) && (px(r.decl, "font-size") ?? 0) <= 40);
  if (kicker) {
    const cls = kicker.sel.match(/[.#]([\w-]+)\s*$/)?.[1];
    if (!cls || body.includes(cls)) kickerFrames++;
  }

  const nums = [...text.matchAll(/(?:^|[\s(])(0[1-9](?:\s*\/\s*\d{1,2})?)(?![\d:,.]\d)(?=[\s).·]|$)/g)].map((m) => m[1]);
  if (nums.length) found.push(["numbering", `zero-padded numbers on screen (${[...new Set(nums)].join(", ")}): only if the order matters`]);

  for (const r of rules) {
    const m = r.decl.match(/border-(left|right)(?:-width)?\s*:\s*(\d+(?:\.\d+)?)px/i);
    if (m && +m[2] >= 3 && !/(?:^|[;\s])border\s*:/i.test(r.decl)) found.push(["side-stripe", `${r.sel}: ${m[2]}px border-${m[1]} only`]);
  }

  const emoji = [...body.matchAll(/\p{Emoji_Presentation}|\p{Extended_Pictographic}️/gu)].map((m) => m[0]).filter((c) => !/[\d#*]/.test(c));
  if (emoji.length) found.push(["emoji", `colour emoji ${[...new Set(emoji)].join(" ")}: draw the icon or use the preset's icon set`]);

  for (const r of rules) {
    if (!/position\s*:\s*absolute/i.test(r.decl) || DECOR.test(r.sel)) continue;
    const top = px(r.decl, "top");
    const h = px(r.decl, "height") ?? 0;
    const bottom = px(r.decl, "bottom");
    if (h >= 1000) continue;
    if ((top != null && top + h > captionTop) || (top == null && bottom != null && bottom < 1080 - captionTop && bottom >= 0))
      found.push(["caption-zone", `${r.sel}: reaches below y=${captionTop} (top ${top ?? "-"}, height ${h || "-"}, bottom ${bottom ?? "-"})`]);
  }

  report.push({ frame: f, findings: found });
}

const cross = [];
if (files.length >= 3 && kickerFrames / files.length >= 0.6)
  cross.push(["kicker", `a small all-caps line in ${kickerFrames}/${files.length} frames: fine if frame.md asks for it, otherwise keep it where it names something`]);

if (json) {
  console.log(JSON.stringify({ project: basename(project), accents, frames: report, cross }, null, 1));
} else {
  console.log(`tells: ${files.length} frames, accent ${accents.join(" ") || "unknown (pass --accent)"}`);
  for (const { frame, findings } of report) for (const [k, msg] of findings) console.log(`  ${frame}  ${k}  ${msg}`);
  for (const [k, msg] of cross) console.log(`  all  ${k}  ${msg}`);
  const n = report.reduce((s, r) => s + r.findings.length, 0) + cross.length;
  console.log(n ? `${n} to look at (advisory)` : "clean");
}
