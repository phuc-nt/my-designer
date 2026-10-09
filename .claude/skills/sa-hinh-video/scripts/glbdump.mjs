// Print the node tree of a GLB: name, transform, bounding box and colour of each mesh. Use it to
// check a new model before the rigs in models.js meet it (node names, forward axis, size in metres).
//   node .claude/skills/sa-hinh-video/scripts/glbdump.mjs <file.glb> [...]      DEPTH=3 for deeper, ALL=1 for every node
import { readFileSync } from "node:fs";
const D = +(process.env.DEPTH ?? 2);
for (const file of process.argv.slice(2)) {
  const buf = readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  const g = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
  console.log(`\n=== ${file.split("/").pop()}  nodes=${g.nodes.length} meshes=${(g.meshes||[]).length} cams=${(g.cameras||[]).length}`);
  const f = (a) => a ? a.map((x) => +x.toFixed(3)).join(",") : "-";
  const walk = (i, d) => {
    const n = g.nodes[i];
    let bb = "";
    if (n.mesh !== undefined) {
      const prims = g.meshes[n.mesh].primitives;
      const mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9];
      for (const p of prims) { const a = g.accessors[p.attributes.POSITION]; for (let k=0;k<3;k++){ mn[k]=Math.min(mn[k],a.min[k]); mx[k]=Math.max(mx[k],a.max[k]); } }
      const m = g.materials?.[prims[0].material];
      const col = m?.pbrMetallicRoughness?.baseColorFactor;
      bb = ` bb[${f(mn)} .. ${f(mx)}] col=${f(col)}${m?.emissiveFactor ? " em=" + f(m.emissiveFactor) : ""}${m?.alphaMode ? " " + m.alphaMode : ""}`;
    }
    const mt = n.matrix ? ` M.t[${f(n.matrix.slice(12, 15))}]${Math.abs(n.matrix[0]-1)>1e-3||Math.abs(n.matrix[5]-1)>1e-3||Math.abs(n.matrix[10]-1)>1e-3 ? " M.rot/scale diag[" + f([n.matrix[0], n.matrix[5], n.matrix[10]]) + "]" : ""}` : "";
    const trs = n.translation || n.rotation || n.scale ? ` t[${f(n.translation)}] r[${f(n.rotation)}] s[${f(n.scale)}]` : "";
    const extra = n.camera !== undefined ? " CAMERA" : n.extensions ? " EXT:" + Object.keys(n.extensions) : "";
    if (d <= D && (n.mesh !== undefined || n.children || process.env.ALL)) console.log(`${"  ".repeat(d)}${n.name ?? "(noname)"}${mt}${trs}${bb}${extra}${n.children ? " ch=" + n.children.length : ""}`);
    for (const c of n.children ?? []) walk(c, d + 1);
  };
  for (const s of g.scenes[g.scene ?? 0].nodes) walk(s, 0);
}
