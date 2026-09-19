# `dsa scene command` — all 30 actions

Field types from `bin/dsa scene schema` of this build (`?` optional,
`=` default). Every command takes the node's `nodeId` (or `nodeIds` /
`outputId`). Vectors are `[x,y,z]`. Results come back as the
`scene inspect` report (`preview:true` unless `--apply`).

Rows marked ✓ were executed on this build while writing this file.

## Create editable meshes

| action | fields | notes |
| --- | --- | --- |
| `convert` ✓ | `nodeId` | primitive → `scene.mesh` (box = 24 v / 12 t, keeps transforms and material). Refuses `src` nodes. |
| `remesh` ✓ | `nodeIds[1..64]`, `outputId`, `resolution:int 12–48 =28`, `symmetry =false`, `blend 0.001–2 =0.12` | smooth-union of unparented primitives/meshes into a new node; sources hidden afterwards; rejects rigged sources; ≤ 20 000 source triangles |
| `loft` ✓ | `outputId`, `rings[2..64]:{center,radius}`, `segments:int 6–48 =16`, `color ="#D89B55"` | ordered rings → closed tube of quad strips (5 rings × 24 seg = 122 v / 240 t) |

## Edit a mesh (needs `editableMesh:true`)

| action | fields | notes |
| --- | --- | --- |
| `checkpoint` ✓ | `nodeId`, `outputId` | hidden + locked copy; keep one before destructive edits |
| `restore-mesh` ✓ | `nodeId`, `sourceId` | copy a checkpoint's mesh back |
| `sculpt` ✓ | `nodeId`, `center`, `radius>0`, `strength 0–1 =0.2`, `mode: smooth\|inflate\|move`, `delta =[0,0,0]` (move) | falloff stamp in mesh space; interpolates weights/UVs/morphs |
| `insert-loop` ✓ | `nodeId`, `axis: x\|y\|z`, `offset` | plane cut at `axis = offset` (box: 24→36 v) |
| `split-edges` | `nodeId`, `edges:[[a,b],…]` | split listed vertex-index edges |
| `relax` ✓ | `nodeId`, `iterations:int =3`, `strength =0.2` | Laplacian smoothing |
| `morph` | `nodeId`, `name`, `vertices:int[]`, `delta`, `weight =0` | store a morph target (≤ 16) |

Face-level tools (`extrude inset delete-faces subdivide weld uv-planar
uv-sphere`, `src/shared/mesh-editing.ts`) exist only in the browser Mesh
panel; the CLI has no selection-based edit. From the CLI, density comes
from `insert-loop` (repeat on several offsets/axes) and smoothness from
`relax` or `remesh`.

## UV and paint

| action | fields | notes |
| --- | --- | --- |
| `uv-pack` ✓ | `nodeId`, `seams:[[a,b],…] =[]` | islands from seams or non-overlapping triangles; planar projection per island |
| `texture-layer` ✓ | `nodeId`, `id`, `name`, `map: color\|normal\|roughness`, `opacity =1`, `visible =true`, `resolution: 256\|512\|1024\|2048 =512` | ≤ 8 layers |
| `paint` ✓ | `nodeId`, `layerId?`, `uv:[u,v]`, `radius`, `color` | ≤ 256 strokes per layer; normal layers use tangent-space RGB (neutral `#8080ff`) |
| `clear-paint` | `nodeId`, `layerId?` | required before changing UVs |

## Rigs

| action | fields | notes |
| --- | --- | --- |
| `rig-quadruped` | `nodeId`, `landmarks?:{hips,chest,head,frontLeft,frontRight,backLeft,backRight,tail}` | without landmarks: bounds-derived starting rig |
| `rig-winged-quadruped` | `nodeId`, `landmarks:{…quadruped, jaw, jawTip, wingLeft, wingRight}` | wings need shoulder/elbow/wrist + 3–5 finger base/tip pairs |
| `bind` | `nodeId`, `rigidBone?`, `smooth:int =2` | nearest-segment weights, ≤ 4 influences |
| `weights` | `nodeId`, `mode: normalize\|smooth\|mirror`, `iterations:int =2` | mirror needs symmetric vertices |
| `weight-brush` | `nodeId`, `bone`, `center`, `radius`, `strength =0.2`, `mode: add\|subtract\|smooth`, `mirrorBone?`, `lockedBones =[]`, `lockedVertices =[]` | |
| `attach` | `nodeId`, `rigNodeId`, `bone` | bake an unparented accessory into a rig and bind rigidly |
| `share-rig` | `nodeId` | convert a compatible attachment to a `scene.rigId` reference |
| `rest-pose` | `nodeId` | store current pose as rest |
| `joint` | `nodeId`, `bone`, `mode: rest\|pose`, `value` | set one bone's rotation |
| `joint-limits` | `nodeId`, `bone`, `min`, `max`, `mirrorBone?` | |
| `mirror-pose` | `nodeId`, `bone` | copy pose to the symmetric bone |
| `pose` | `nodeId`, `bone`, `rotation` | FK pose |
| `ik` | `nodeId`, `endBone`, `target`, `chainLength:int =2`, `maxAngle =120` | |
| `contact` | `nodeId`, `id`, `endBone`, `target`, `pole`, `start`, `end`, `maxAngle =120`, `groundHeight?`, `enabled =true` | persistent stance interval; `scene scan` reports contact errors |

## Clips

| action | fields | notes |
| --- | --- | --- |
| `clip` | `nodeId`, `preset: idle\|wag\|walk\|wing-flap\|roar`, `start =0`, `duration =2`, `strength =1`, `wristLag =0.15` | needs the native bone names from the rig commands |
| `edit-clip` | `nodeId`, `name`, `speed =1`, `amplitude =1`, `repeat:int =1`, `blend =0` | |

Imported GLB animation is placed through node `scene.importedClips`
(`{name,start,end,speed?,weight?,loop?}`) with exact clip names from the
file; the CLI has no clip-inventory command, so read the names with a
glTF tool or the browser Inspector.

## Errors you will see

| message | meaning |
| --- | --- |
| `Convert the primitive to mesh first` | sculpt/loop/split/checkpoint/paint on `data.geometry` node → run `convert` |
| `Imported assets retain their geometry; edit a document mesh` | `convert` on a `src` node → editable-scene export instead |
| `Project revision changed. Read and reconcile before applying geometry.` (409) | stale `--revision` |
| `Convert primitive or import editable geometry before rigging` (in `issues`) | informational on every primitive; not an error |
| `N boundary edges (UV seams can split vertices)` (in `issues`) | open edges on a converted box; harmless unless you remesh it |
