// Writes STORYBOARD.md from SCRIPT.md (titles and the exact narration) and the real voice timings.
// Durations start as the voice file lengths; `audio.mjs sync-durations` rewrites them from audio_meta.json.
// A lesson's build-storyboard.mjs supplies what only it knows and calls writeStoryboard().
import fs from "node:fs";
import path from "node:path";
import { PROJECT, r2, voiceDur, script, COUNT } from "./frames.ctx.mjs";
import { frameId } from "./frames.kit.mjs";

// o: { title, music, arc, direction, frames }
//   title      the H1 of the storyboard
//   music      one line for the music generator (also in .hyperframes/bgm_request.json)
//   direction  the "## Video direction" block, as markdown
//   frames     per frame: { scene, sc: [[start, text], …], sfx, at } with seconds inside the frame
export function writeStoryboard({ title, music, arc = "concept-explainer with process", direction, frames: F }) {
  if (F.length !== COUNT) throw new Error(`${F.length} storyboard entries for ${COUNT} frames`);
  if (!direction.startsWith("## Video direction")) throw new Error('direction must start with "## Video direction"');
  const { titles, vo } = script();
  const brief = fs.readFileSync(path.join(PROJECT, "BRIEF.md"), "utf8");
  const field = (k) => (brief.match(new RegExp(`^${k}:\\s*"?(.+?)"?\\s*$`, "m")) || [])[1];
  const total = r2(Array.from({ length: COUNT }, (_, i) => voiceDur(i + 1)).reduce((a, b) => a + b, 0));

  let md = `---
format: 1920x1080
duration: ${total}s
message: "${field("message")}"
arc: ${arc}
audience: ${field("audience")}
mode: autonomous
music: ${music}
---

# ${title}

${direction}
`;
  F.forEach((f, i) => {
    const n = i + 1, d = voiceDur(n);
    md += `## Frame ${n} — ${titles[i]}\n\n`;
    md += `- scene: ${f.scene}\n`;
    md += `- voiceover: "${vo[i].join(" ")}"\n`;
    md += `- duration: ${d}s\n`;
    md += `- transition_in: ${n === 1 ? "cut" : "crossfade"}\n`;
    md += `- status: outline\n`;
    md += `- src: compositions/frames/${frameId(n)}.html\n`;
    md += `- blueprint: compose\n`;
    md += `- sfx: ${f.sfx}\n`;
    if (f.sfx !== "none") md += `- sfx_at: ${r2(f.at)}\n`;
    md += `\n`;
    f.sc.forEach(([s, text], k) => {
      const e = k + 1 < f.sc.length ? f.sc[k + 1][0] : d;
      md += `Scene ${k + 1} (${r2(Math.max(0, s)).toFixed(1)}–${r2(e).toFixed(k + 1 < f.sc.length ? 1 : 2)}s): ${text}.\n`;
    });
    md += `\n`;
  });
  fs.writeFileSync(path.join(PROJECT, "STORYBOARD.md"), md);
  fs.mkdirSync(path.join(PROJECT, ".hyperframes/frame-packets"), { recursive: true });
  fs.writeFileSync(path.join(PROJECT, ".hyperframes/frame-packets/_video-direction.md"), direction);
  console.log(`STORYBOARD.md: ${COUNT} frames, ${total}s`);
}
