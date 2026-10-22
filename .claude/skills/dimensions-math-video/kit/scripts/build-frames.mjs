// The overlay frames of a lesson. The children cannot read yet, so no lesson of the series puts text on
// screen: everything a child sees is drawn on the canvas by assets/lib/world/world.js. Each frame is still a
// real composition with the length of its narration, so the assembler can lay the voice, the sound effects
// and the cuts on it.
//   node scripts/build-frames.mjs
import fs from "node:fs";
import path from "node:path";
import { PROJECT, COUNT, frameDurations } from "./frames.ctx.mjs";
import { shell, frameId } from "./frames.kit.mjs";

const D = frameDurations();
const dir = path.join(PROJECT, "compositions/frames");
fs.mkdirSync(dir, { recursive: true });
for (let n = 1; n <= COUNT; n++) {
  const html = shell(n, D[n - 1], `    <div id="§layer" class="clip" data-start="0" data-duration="${D[n - 1]}"></div>`, "");
  fs.writeFileSync(path.join(dir, `${frameId(n)}.html`), html);
  console.log(`${frameId(n)}.html  ${D[n - 1]}s`);
}
