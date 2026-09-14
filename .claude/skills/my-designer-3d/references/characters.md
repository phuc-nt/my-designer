# 3D characters: rig, skin, animate

Everything here is `dsa scene command` (preview, then `--apply`) plus
`scene inspect` / `scene scan`; command fields are in
[scene-commands.md](scene-commands.md). `docs/3d-characters.md` in this
repo has the longer product description.

## Workflow

1. **Body.** Build an unrigged blob from overlapping spheres/boxes and
   `remesh` it (try `symmetry:true` for bilateral creatures); use `loft`
   for limbs, necks and tails where you want ordered joint rings. `relax`
   before binding. Keep a `checkpoint`.
2. **Skeleton.** `rig-quadruped` with eight explicit landmarks (hips,
   chest, head, four feet, tail) read from the mesh bounds/vertices you
   inspected — the tool does not infer anatomy. `rig-winged-quadruped`
   adds jaw/jawTip and per-wing shoulder/elbow/wrist + finger pairs.
   Without landmarks you get a bounds-derived starting rig to adjust with
   `joint … mode:rest` and `rest-pose`.
3. **Skin.** `bind` (nearest-segment, ≤ 4 influences), then `weights
   normalize|smooth|mirror` and `weight-brush` where the heatmap (browser
   Rig tab) or a sampled pose shows candy-wrapper collapse. Lock bones or
   vertices you have already fixed.
4. **Accessories.** `attach` an unparented mesh (saddle, hat) to a bone;
   later preset clips carry it. `share-rig` converts compatible
   attachments to a `scene.rigId` reference so GLB export reuses one
   skeleton.
5. **Pose and constraints.** `pose` / `ik` / `joint-limits` /
   `mirror-pose` for FK/IK; `contact` for foot-planting intervals with
   `groundHeight`.
6. **Animate.** `clip` presets (`idle wag walk wing-flap roar`) then
   `edit-clip` for speed/amplitude/repeat/blend. `morph` stores blend
   shapes. The document timeline (`../../my-designer-motion/SKILL.md`)
   sequences clips and camera moves.
7. **Verify.** `scene scan --samples 17` for stretch/seam/contact
   diagnostics across the clip; `projects export --format scene-angles
   --start 0 --end <dur> --review-samples 5` and open every PNG; `export
   --format glb` and reopen the file to confirm skins and clips survived.

## Constraints that bite

- Parent bones precede children; skin arrays need 4 indices/weights per
  vertex referencing existing bones. Scene commands maintain this; hand
  edits to `scene.mesh` must too.
- `remesh`/`convert` refuse rigged nodes — restore from a checkpoint or
  work on an unrigged copy, then rebind.
- Mesh topology edits (sculpt, loops, splits) interpolate weights, UVs and
  morphs but change vertex indices; re-check `morph` vertex lists.
- Presets need the native bone names created by the rig commands; they do
  not retarget imported skeletons.
- Sampled export budget: reduce duration, fps or animated bones when the
  exporter reports its limit.
- No automatic quad retopology; loops and lofts are the only density
  control. Disconnected rigid pieces are not skinning — inspect the
  deformation.
