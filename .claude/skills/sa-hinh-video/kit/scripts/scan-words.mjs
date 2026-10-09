// Scan what the viewer reads and hears for words the series must not carry: question numbers, "câu",
// "đáp án", "phương án", the exam and the book. Usage: node scripts/scan-words.mjs [files…]
// Without arguments: SCRIPT.md, the narration requests, the caption groups and every built frame.
// HTML files are reduced to their visible text first (style, script and svg removed).
import { readFileSync, readdirSync, existsSync } from "node:fs";

const W = (w) => new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`, "iu");
const BAD = [
  W("câu"), /đáp\s*án/iu, /phương\s*án/iu, /sát\s*hạch/iu, /k[ỳì]\s*thi/iu, /ôn\s*thi/iu, W("sách"), W("đề"), W("thi"),
  /đếm\s*ngược/iu,
  /(^|[^\p{L}\d])(48[6-9]|49\d|5\d\d|600)([^\p{L}\d]|$)/u, // a question number of the sa hình chapter
];

const defaults = () => {
  const dir = "compositions/frames";
  const frames = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".html")).map((f) => `${dir}/${f}`) : [];
  return ["SCRIPT.md", ".hyperframes/tts_request.json", ".hyperframes/clone_request.json", "caption_groups.json", ...frames].filter(existsSync);
};
const visible = (html) =>
  html.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, "\n").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
// in JSON only the spoken and shown strings count, not ids or numbers
const spoken = (json) => (json.match(/"(text|say|script|style)"\s*:\s*"(?:[^"\\]|\\.)*"/g) || []).join("\n");

const files = process.argv.length > 2 ? process.argv.slice(2) : defaults();
let found = 0, lines = 0;
for (const f of files) {
  const raw = readFileSync(f, "utf8");
  const text = f.endsWith(".html") ? visible(raw) : f.endsWith(".json") ? spoken(raw) : raw;
  for (const l of text.split("\n").map((x) => x.trim()).filter(Boolean)) {
    lines++;
    for (const re of BAD) if (re.test(l)) (found++, console.log(`${f}: [${re.source.slice(0, 26)}] ${l.slice(0, 130)}`));
  }
}
console.log(found ? `FOUND ${found}` : `clean (${files.length} files, ${lines} text lines)`);
process.exit(found ? 1 : 0);
