---
name: my-designer-3d
description: Author 3D scenes in the local my-designer studio through the dsa CLI — primitives and page camera/lights/fog/bloom, PBR materials and texture maps, GLB import/export, and real mesh editing with `dsa scene command` (convert, smooth-union remesh, loft, sculpt, edge loops, checkpoints, UV paint, quadruped rigs, clips), plus multi-angle render review. Use for any project of kind 3d or any request involving meshes, models, rooms, products, characters in 3D.
---

# my-designer-3d

Read `../my-designer/SKILL.md` first for the shared workflow (revision
checks, `update-node` replace-not-merge, inspect before claiming). This
skill is what the kit can do in 3D and the exact commands, all verified on
this build. The kit is **not** limited to six primitives: you can turn
primitives into editable meshes, fuse them into smooth organic shapes,
loft revolved forms, sculpt, cut loops, paint UV layers, import GLB, rig
and animate.

## Scene anatomy

Page `scene` (edit with `update-page` — send the **whole** object):

```json
{"camera":{"position":[4,3,6],"target":[0.5,0.5,0],"fov":40,"safeFrame":0.1},
 "ambient":0.5,
 "light":{"position":[3,5,2],"intensity":1.2,"color":"#FFF1DC"},
 "lights":[{"id":"lamp","type":"point","position":[0,2.2,0],"color":"#FFD9A0","intensity":30,"distance":8,"shadow":true},
           {"id":"fill","type":"directional","position":[-3,4,-2],"target":[0,0,0],"color":"#DDE8FF","intensity":0.6}],
 "atmosphere":{"fogColor":"#F2E9DC","fogDensity":0.02},
 "rendering":{"exposure":1.1,"bloom":0.3,"bloomThreshold":1,"shadows":true,"environmentIntensity":1},
 "emitters":[{"id":"dust","position":[0,1,0],"spread":[2,1,2],"velocity":[0,0.05,0],"count":300,"size":0.01,"color":"#FFFFFF","lifetime":8,"seed":7}]}
```

`fov` 10–120, `ambient` 0–10, `lights` ≤ 8 of `point|spot|directional`
(`angle` 0.01–1.57 for spot, `distance`, `shadow`), `emitters` ≤ 8
(`start`/`end` seconds for timed bursts). Y is up; units are metres-ish;
the camera looks from `position` at `target`.

A `model3d` node:

```json
{"id":"sofa-body","type":"model3d","name":"Sofa body","x":0,"y":0,"width":10,"height":10,
 "data":{"geometry":"box"},
 "scene":{"position":[0,0.3,0],"rotation":[0,0,0],"scale":[2,0.6,0.9],
          "material":{"color":"#8E9296","roughness":0.9,"metalness":0,"doubleSided":false}}}
```

- `data.geometry`: `box` (default) `sphere` `torus` `torusKnot` `cone`
  `cylinder`. A unit primitive is scaled by `scene.scale`.
- `scene.mesh` (`positions`, `indices`, optional `normals uv tangents
  colors morphTargets skinIndices skinWeights`) replaces the primitive —
  arbitrary geometry, ≤ 300 k vertices. You rarely write it by hand;
  scene commands produce it.
- `src: "/api/assets/<id>"` (from `assets upload … --mime
  model/gltf-binary`) loads a GLB instead. Verified: exported GLB →
  upload → node with `src` renders.
- `scene.material`: `color metalness roughness emissive emissiveIntensity
  wireframe doubleSided transparent alphaTest normalScale aoIntensity`
  and texture maps by owned asset ID: `textureAssetId` (color),
  `normalTextureAssetId`, `roughnessTextureAssetId`,
  `metalnessTextureAssetId`, `emissiveTextureAssetId`, `aoTextureAssetId`;
  `textureSettings.<key>.{offset,repeat,center,rotation}` and
  `textureFlipY`. Colors accept theme tokens (`$primary`).
- `scene.position/rotation/scale` only; `data.position` is ignored.
  Rotation is degrees about the node's own centre. Group with a `group`
  parent to move several objects together.
- `x,y,width,height` are still required (layer placement on the 2D page).
  Keep all 3D nodes adjacent in layer order; a 2D node between them splits
  depth testing.

## Changing a material or transform without losing the mesh

`update-node` replaces `scene` wholesale. Copy it from the JSON you read,
mutate one key, send it back (`../my-designer/references/operations.md`).
Verified: a partial `scene` dropped a lofted mesh and rendered a default
box; the copied full `scene` kept it. For primitives the same rule keeps
transforms.

## Mesh editing: `dsa scene command`

```sh
bin/dsa scene schema > scene-schema.json                      # 29 actions; fields in references/scene-commands.md
bin/dsa scene inspect  <id> --page <PAGE_ID>                  # editableMesh, vertices, triangles, bounds, issues per node
bin/dsa scene command  <id> --page <PAGE_ID> --revision <n> --file cmd.json          # PREVIEW: returns the inspect report, saves nothing
bin/dsa scene command  <id> --page <PAGE_ID> --revision <n> --file cmd.json --apply  # saves, revision +1
```

`--page` is the page **ID** (from `projects get`), not an index. A command
file holds one `{"action":…}` object. Preview first, read the resulting
node's `vertices/triangles/issues`, then `--apply` with the same
revision. Stale revision → 409 `conflict`. To batch several commands with
ordinary node edits in one save, put them in a `document patch` as
`{"op":"scene-command","pageId":…,"command":{…}}` (verified).

Pipelines that work (all exercised on this build, numbers observed):

**Soft / organic from primitives — `remesh` (smooth union).** Place
unparented primitives (spheres, boxes) so they overlap, then fuse:

```json
{"action":"remesh","nodeIds":["cushion-l","cushion-r","seat","back"],"outputId":"sofa","resolution":40,"blend":0.18}
```

`resolution` 12–48 (sampling density, not a polygon target), `blend`
0.001–2 (how far surfaces melt into each other; 0.12 default),
`symmetry:true` mirrors across X. Two overlapping spheres at resolution 32
gave a 4508-vertex smooth blob; six sofa boxes at 40 gave ~2900 vertices.
Sources are **hidden**, not deleted (recover by setting `visible` back).
Rigged sources are refused. The output has no `data.geometry`; its
material comes from the command (`color` for loft) or defaults — set it
afterwards with the full-`scene` recipe.

**Revolved / tubular forms — `loft`.** Ordered rings of `{center,radius}`
(2–64) become a closed triangulated tube — vases, lamp stems, limbs:

```json
{"action":"loft","outputId":"vase","segments":24,"color":"#B8865B",
 "rings":[{"center":[2,0,0],"radius":0.25},{"center":[2,0.3,0],"radius":0.4},{"center":[2,0.7,0],"radius":0.3},{"center":[2,1,0],"radius":0.18},{"center":[2,1.2,0],"radius":0.22}]}
```

**Edit a primitive's shape — `convert`, then sculpt/cut.** Sculpt,
`insert-loop`, `split-edges`, `checkpoint`, `uv-pack`, paint and rigging
all require an editable mesh; on a primitive they fail with "Convert the
primitive to mesh first".

```json
{"action":"convert","nodeId":"slab"}                                            // box → 24-vertex mesh, transforms kept
{"action":"checkpoint","nodeId":"slab","outputId":"slab-v1"}                    // hidden, locked copy to restore from
{"action":"insert-loop","nodeId":"slab","axis":"y","offset":0.3}                // plane cut → more vertices to shape
{"action":"sculpt","nodeId":"slab","center":[1,0.2,-1.5],"radius":0.6,"strength":0.5,"mode":"inflate"}
{"action":"sculpt","nodeId":"slab","center":[0,0.5,0],"radius":0.4,"strength":0.3,"mode":"move","delta":[0,0.15,0]}
{"action":"relax","nodeId":"slab","iterations":3,"strength":0.2}                // smooth after cuts
{"action":"restore-mesh","nodeId":"slab","sourceId":"slab-v1"}                  // undo to the checkpoint
```

Sculpt `center` is in the node's mesh space (unit box spans −0.5..0.5
before `scene.scale`; an imported/remeshed mesh spans its own bounds —
read `bounds` from `scene inspect`). A converted box has 24 vertices, so
sculpting it barely moves anything until you `insert-loop` several times
on each axis (subdivide/extrude exist only in the browser Mesh panel).
Rounded corners come from remesh (blend) or loops + relax, not from a
bevel command — there is none.

**Imported GLB.** `convert` refuses `src` nodes ("Imported assets retain
their geometry"). To get an editable copy use `projects export <id>
--format editable-scene --node <nodeId> --output editable.json`, review,
then `document put`. In this build that export failed with
`render_failed` for a GLB the kit itself had exported; if it fails for
you, say so, keep the GLB as a playback asset and do the modelling with
primitives + remesh/loft instead.

**UV paint.** `uv-pack` (optional `seams`), `texture-layer`
(`map: color|normal|roughness`, resolution 256–2048), `paint` strokes at
`uv:[u,v]`, `clear-paint`. Layers rasterise into maps that render and
export with GLB. A painted color layer replaces `textureAssetId`. Clear
paint before changing UVs.

**Rigs and animation** (quadrupeds, winged quadrupeds, bind, weights, IK,
poses, preset clips, morphs) — [characters.md](references/characters.md).

## Review — look from more than one angle

```sh
bin/dsa projects inspect <id> --mode page --page 0 --max-dimension 1600 --output view.png   # the stored camera
bin/dsa projects export  <id> --format scene-angles --start 0 --output angles.zip           # front/right/back/left PNG + views.json
bin/dsa projects export  <id> --format scene-angles --start 0 --end 4 --review-samples 5 --output angles.zip  # animated: 4 views × 5 times + contact sheet
bin/dsa scene scan <id> --page <PAGE_ID> --samples 9                                       # per-node diagnostics over time (seams, stretch, contacts)
bin/dsa projects export  <id> --format glb --output out.glb --revision <n>                  # interchange; reopen the file
```

Open the PNGs. Check intersections, floating objects, gaps at wall/floor
joins, clipped camera near-plane, blown highlights, fog hiding the
subject. GLB/glTF carry geometry, PBR maps, skins and sampled clips — not
fog, bloom, emitters or 2D page content. `render --format svg` shows 3D as
a placeholder symbol; never present it as the scene.

## Honest limits

No CSG booleans, no bevel/fillet operator, no physics, no custom shaders,
no procedural noise, no auto-retopology into quads (loops and lofts give
controlled density; remesh gives smooth triangles). `convert` does not
work on `src` models. `remesh` rejects parented or rigged sources and
open (non-closed) meshes have ambiguous interiors. Camera auto-framing is
browser-only — set the camera yourself and verify with a render. Say
these when they apply; do not claim the kit stops at primitives.
