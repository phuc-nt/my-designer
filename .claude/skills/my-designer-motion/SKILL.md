---
name: my-designer-motion
description: Animation in the local my-designer studio through the dsa CLI — document timeline tracks and keyframes on any node, video documents, 2D character rigs (`dsa motion`), timed inspection with --time, and webm/mp4/png-sequence/spritesheet/motion exports with --start/--end/--fps. Use for kind video, "animate", "keyframe", "make it move", or any export that is a video or frame sequence.
---

# my-designer-motion

Read `../my-designer/SKILL.md` for the shared workflow. Design guidance
for video documents is in [video.md](references/video.md). 3D rigs and
preset clips are in `../my-designer-3d/references/characters.md`; this
skill is the timeline that sequences everything.

## The timeline

Any document (not only `video`) can carry `timeline`:

```json
{"duration":8,"fps":30,
 "tracks":[{"id":"t-title","nodeId":"title",
            "keyframes":[{"time":0,"values":{"opacity":0,"y":140},"easing":"easeOut"},
                         {"time":0.8,"values":{"opacity":1,"y":120}},
                         {"time":7.2,"values":{"opacity":1}},
                         {"time":8,"values":{"opacity":0},"easing":"easeIn"}]}]}
```

`duration` 0.1–3600 s, `fps` 1–60, ≤ 2000 tracks. Keyframe `values` keys
that the renderer actually interpolates (`src/shared/render.ts`
`interpolateNode`):

| key | applies to |
| --- | --- |
| `x` `y` `width` `height` `rotation` `opacity` | any node (2D layout) |
| `fill` `fontSize` `borderRadius` `strokeWidth` `stroke` | `style.*`; non-numeric values step, they do not blend |
| `scene.position.x|y|z` `scene.rotation.x|y|z` `scene.scale.x|y|z` | 3D nodes (one axis per key) |
| `scene.bones.<index>.rotation.x|y|z` / `.position.…` | rigged 3D nodes, bone by index |
| `scene.morphWeights.<name>` | morph targets, clamped 0–1 |

Other keys are ignored silently; the page camera is not keyframable —
animate the objects, or move a `group` parent. `easing`: `linear easeIn
easeOut easeInOut bounce spring step` or a cubic-bezier tuple
`[x1,y1,x2,y2]`. Times must be unique within a track and ≤ duration. A
keyframe uses its own outgoing easing; sparse channels hold the node's
static value. `clipName` binds a track to a 3D preset clip
(`clip` scene command) so it loops for the clip's `start–end`.

For a stock opening you do not have to hand-write keyframes: `bin/dsa
motion-template list` names four validated primitives (`reveal`, `stagger`,
`kinetic-type`, `chart-race`); `bin/dsa motion-template instantiate reveal
--output m.json` compiles one into a `video` document whose timeline only
uses the keys above, and `projects import --file m.json` saves it. Treat
the result as a starting point to edit, not a finished piece.

Operations (all in one `document patch`, revision-checked):

| op | fields |
| --- | --- |
| `set-timeline` | `timeline:{duration,fps,tracks}` |
| `upsert-track` | `track:{id,nodeId,keyframes[],clipName?,muted?,locked?}` |
| `remove-track` | `trackId` |
| `upsert-keyframe` | `trackId`, `keyframe:{time,values,easing?}`, `previousTime?` (to move a key) |
| `remove-keyframe` | `trackId`, `time` |

## Audio and video nodes

`video`/`audio` nodes reference an uploaded asset (`assets upload … ` →
`src`) and carry `data.audioStart audioEnd audioOffset audioGain(0–4)
audioMuted audioLoop audioEvent`. Times are seconds. Still images and GLB
have no soundtrack; listen to an actual export.

## Inspect over time

```sh
bin/dsa projects inspect <id> --mode page --page 0 --time 0   --output t0.png
bin/dsa projects inspect <id> --mode page --page 0 --time 2.5 --output t2.png
bin/dsa projects inspect <id> --mode page --page 0 --time 8   --output t8.png
```

Sample the start, every beat and the end. Open the PNGs. Stills prove
placement, not interpolation or sound — export and play the video for
those.

## Export

```sh
bin/dsa projects export <id> --format mp4  --output out.mp4  --revision <n>                  # needs an encoder; webm always works
bin/dsa projects export <id> --format webm --output out.webm --start 0 --end 8
bin/dsa projects export <id> --format png-sequence --start 0 --end 2 --fps 12 --output frames.zip
bin/dsa projects export <id> --format spritesheet  --start 0 --end 2 --fps 12 --output sheet.zip
bin/dsa projects export <id> --format motion --output motion.zip                             # native ZIP with player + media
```

Budgets: motion exports ≤ 60 s; frame archives ≤ 300 frames and 64 MP
total (`ceil((end-start)*fps)` frames; the error suggests a fitting fps);
spritesheet grid ≤ 16 384 px per side. Frame ranges exclude `end`.

## 2D characters

`character` nodes hold a rig of PNG layers, bones, clips and instances
(`docs/character-motion.md`). `bin/dsa motion <id> [--character id]
[--node id] [--time s]` lists rigs/clips and samples a pose. Edits use
character ops in `bin/dsa schema --operations` (bones, slots, clips,
instances); geometry is an atomic merge field, so read-modify-write the
whole mesh. `generate --mode motion` needs a provider.

## Deliver

Give the `?project=<id>` link, the export you opened, which times you
inspected, and whether sound/encoding were verified. Note when mp4 fell
back to webm.
