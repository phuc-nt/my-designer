// Make a frame file from a scene template: set the frame prefix, the composition id and the
// duration (root, background clip and END), and drop the template's how-to comment while keeping
// its attribution. The copy, the tokens and the cue times T stay yours to write.
// Usage: node use-scene-template.mjs <template> --frame N --id NN-slug --duration S [--out file] [--force]
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "../scene-templates");
const names = readdirSync(dir).filter((f) => f.endsWith(".html")).map((f) => f.slice(0, -5));

const args = process.argv.slice(2);
const opt = (k) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const name = (args[0] || "").replace(/\.html$/, "");
const die = (m) => (console.error(`use-scene-template: ${m}`), process.exit(1));

if (!names.includes(name)) die(`first argument is a template name: ${names.join(", ")}`);
const frame = Number(opt("frame"));
const id = opt("id") || "";
const duration = Number(opt("duration"));
if (!Number.isInteger(frame) || frame < 1 || frame > 99) die("--frame is a whole number from 1 to 99");
const nn = String(frame).padStart(2, "0");
if (!new RegExp(`^${nn}-[a-z0-9]+(-[a-z0-9]+)*$`).test(id)) die(`--id is ${nn}-ascii-slug, as in the storyboard src`);
if (!(duration > 0 && duration <= 600)) die("--duration is the frame length in seconds, from the storyboard");
const out = opt("out") || join("compositions/frames", `${id}.html`);
if (existsSync(out) && !args.includes("--force")) die(`${out} exists; pass --force to replace it`);

let s = readFileSync(join(dir, `${name}.html`), "utf8");
// the how-to paragraph of the header comment goes; the attribution above it stays
s = s.replace(/\n+ {2}To use it for frame NN[\s\S]*?(?=\n-->)/, "");
s = s.replaceAll("fNN-", `f${nn}-`).replaceAll("NN-slug", id);
s = s.replace(/data-duration="[\d.]+"/g, `data-duration="${duration}"`);
s = s.replace(/var END = [\d.]+;/, `var END = ${duration};`);
if (/fNN|NN-slug/.test(s)) die("a placeholder is left in the template; the template is malformed");

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, s);
console.log(`wrote ${out} (${duration}s)`);
console.log("still to do: replace the tokens and @font-face with the project's, the copy, and the cue times in `var T`:");
console.log(s.match(/^\s*var T = .*$/m)?.[0].trim());
