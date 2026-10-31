#!/usr/bin/env node
// Wireframe look for a whole video: every box becomes a grey outline on light paper, text becomes outlined letters,
// colour, gradients, glows, shadows and pictures drop out. What is left is layout and timing, which is what the
// owner approves before the skin goes on. Nothing in compositions/ is touched: one <style> block goes into index.html.
//   node wireframe.mjs on  [project]     inject the block (before </head>)
//   node wireframe.mjs off [project]     remove it
//   node wireframe.mjs status [project]
// assemble-index rewrites index.html, so it removes the block too; run `on` again after it if still needed.
// Render the wireframe with `hyperframes render --quality draft --output renders/wireframe.mp4`, then `off`.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const START = "<!-- app-promo wireframe: start -->";
const END = "<!-- app-promo wireframe: end -->";
// Transforms, opacity and visibility are left alone, so every move, fade and cut plays exactly as in the final.
const CSS = `
    <style id="app-promo-wireframe">
      html, body, body > [data-composition-id] { background: #eceef2 !important; }
      body * {
        background-image: none !important;
        background-color: transparent !important;
        box-shadow: none !important;
        text-shadow: none !important;
        filter: none !important;
        backdrop-filter: none !important;
        border-color: rgba(70, 78, 96, 0.55) !important;
        outline: 1.5px solid rgba(70, 78, 96, 0.4) !important;
        outline-offset: -1px !important;
        color: transparent !important;
        -webkit-text-fill-color: transparent !important;
        -webkit-text-stroke: 1px #3a4152 !important;
      }
      body img, body video, body canvas { opacity: 0.18 !important; }
      body svg * { fill: none !important; stroke: #3a4152 !important; stroke-width: 1px; outline: none !important; }
    </style>
`;

const [cmd, dir] = process.argv.slice(2);
const index = join(resolve(dir ?? "."), "index.html");
if (!["on", "off", "status"].includes(cmd)) {
  console.log("usage: wireframe.mjs on|off|status [project]");
  process.exit(cmd ? 1 : 0);
}
if (!existsSync(index)) {
  console.error(`wireframe: ${index} not found (run assemble-index first)`);
  process.exit(1);
}
const html = readFileSync(index, "utf8");
const a = html.indexOf(START), b = html.indexOf(END);
const isOn = a >= 0 && b > a;
const stripped = isOn ? html.slice(0, a).replace(/\s*$/, "\n") + html.slice(b + END.length).replace(/^\n/, "") : html;

if (cmd === "status") console.log(isOn ? "wireframe: on" : "wireframe: off");
else if (cmd === "off") {
  if (isOn) writeFileSync(index, stripped);
  console.log(isOn ? "wireframe: off (block removed)" : "wireframe: already off");
} else {
  const at = stripped.indexOf("</head>");
  if (at < 0) {
    console.error("wireframe: index.html has no </head>");
    process.exit(1);
  }
  writeFileSync(index, stripped.slice(0, at) + START + CSS + "    " + END + "\n  " + stripped.slice(at));
  console.log("wireframe: on. Render a draft, then run `off` before the real render.");
}
