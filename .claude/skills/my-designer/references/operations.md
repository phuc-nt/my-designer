# Targeted operations (`projects document patch`)

Shapes below come from `bin/dsa schema --operations` of this build. `?`
marks optional. One patch is one atomic revision-checked save; all ops in
the array validate together, so a node and its parent can change in one
call. Board/diagram/painting/character ops exist too — discover them in the
schema when you need them.

## Nodes

| op | fields |
| --- | --- |
| `add-node` | `pageId`, `node` (full node; required: `id,type,name,x,y,width,height`) |
| `update-node` | `nodeId`, `changes` (partial node; **only `style` merges**) |
| `remove-node` | `nodeId` |
| `duplicate-node` | `nodeId`, `duplicateId?`, `offset?:{x,y}` |
| `reparent-node` | `nodeId`, `parentId` (string or null), `index` |
| `group-nodes` | `pageId`, `nodeIds[]`, `groupId?`, `name?`, `bounds?` |
| `ungroup-node` | `nodeId` |
| `insert-block` | `pageId`, `blockId`, `offset?` (px) |
| `replace-asset` | `assetId`, `replacementId` |

Node types: `frame group component text image shape icon chart model3d
video audio board artwork character`. Optional node fields: `rotation
opacity layout sizing position pivot component interactions scene character
boardId paintingId crop parentId locked visible text src style data`.

## Pages, theme, timeline, scene

| op | fields |
| --- | --- |
| `add-page` | `page:{id,name,width,height,background,layout?,notes?,scene?,nodes[]}` |
| `update-page` | `pageId`, `changes:{name?,width?,height?,background?,layout?,notes?,scene?}` |
| `remove-page` | `pageId` |
| `rename` | `name` |
| `set-theme` | `theme:{id,name,colors,fonts:{heading,body},spacing[],radius}` |
| `apply-theme` | `themeId` |
| `set-timeline` | `timeline:{duration,fps,tracks[]}` |
| `upsert-track` | `track:{id,nodeId,keyframes[],clipName?,muted?,locked?}` |
| `remove-track` | `trackId` |
| `upsert-keyframe` | `trackId`, `keyframe:{time,values,easing?}`, `previousTime?` |
| `remove-keyframe` | `trackId`, `time` |
| `scene-command` | `pageId`, `command` (same JSON as `scene command --file`; lets you batch mesh edits with node edits in one save — verified) |

`layout`: `{mode:absolute|flex|grid, direction?:row|column, gap?, padding?,
columns?, align?:start|center|end|stretch, justify?:start|center|end|space-between,
wrap?}`. `update-page.changes.scene` is replaced wholesale too — send the
whole page `scene` object (camera, ambient, light, lights, atmosphere,
rendering, emitters).

## The replace-not-merge recipe

```python
import json
doc = json.load(open('p.json'))['project']['document']
node = next(n for p in doc['pages'] for n in p['nodes'] if n['id'] == 'sofa')
scene = node['scene']                                  # keeps mesh, transforms, bones
scene['material'] = {**scene.get('material', {}), 'color': '#8E9296', 'roughness': 0.9}
json.dump([{'op': 'update-node', 'nodeId': 'sofa', 'changes': {'scene': scene}}], open('ops.json', 'w'))
```

Same pattern for `data`, `component`, `layout`, `sizing` and for
`update-page` → `scene`. Verified: sending `changes:{scene:{position,
rotation,scale,material}}` to a lofted mesh node dropped its mesh and it
rendered as a default box; sending the copied full `scene` kept the mesh.

## Minimal node examples

```json
{"id":"hero-title","type":"text","name":"Title","x":80,"y":120,"width":720,"height":96,
 "parentId":"hero","position":"flow","text":"Design faster",
 "style":{"fontSize":56,"fontWeight":700,"color":"$primary","fontFamily":"$heading"}}
```

```json
{"id":"hero","type":"frame","name":"Hero","x":0,"y":0,"width":1280,"height":640,
 "layout":{"mode":"flex","direction":"column","gap":24,"padding":80},
 "sizing":{"width":"fill"},"style":{"background":"$surface"}}
```

```json
{"id":"lamp","type":"model3d","name":"Lamp","x":0,"y":0,"width":10,"height":10,
 "data":{"geometry":"cylinder"},
 "scene":{"position":[0,1.2,0],"rotation":[0,0,0],"scale":[0.3,0.05,0.3],
          "material":{"color":"#F2C879","emissive":"#F2C879","emissiveIntensity":1.2}}}
```

`x,y,width,height` are always required (2D canvas placement); for 3D nodes
they only place the node in layer order — the scene transform is under
`scene`.
