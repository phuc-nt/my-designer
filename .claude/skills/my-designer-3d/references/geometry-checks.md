# Measure the scene before you believe a render

A render answers "does it look right from this camera". It cannot answer
"do these parts touch" — a tower cropped at the frame edge and a roof
floating a unit above its shaft look identical from the wrong angle.
Measure first, then look.

## Primitives are not unit cubes

`scene.scale` multiplies the **built** geometry, and those builds are not
1×1×1 (`src/shared/scene-runtime.ts`):

| `data.geometry` | built size (x, y, z) before `scale` |
| --- | --- |
| `box` (default) | 1.6 × 1.6 × 1.6 |
| `cylinder` | 1.6 × 1.6 × 1.6 (radius 0.8, height 1.6) |
| `sphere` | 2 × 2 × 2 (radius 1) |
| `cone` | 2 × 1.7 × 2 (radius 1, height 1.7) |
| `torus` | 2.2 × 0.6 × 2.2 (radius 0.8, tube 0.3) |
| `torusKnot` | ≈1.86 cubed (radius 0.7, tube 0.23) |

So a node's true vertical extent is `scale.y × unitHeight`, and its
bottom is `position.y − scale.y × unitHeight / 2`. Computing gaps as
`position.y − scale.y / 2` is wrong for every geometry and wrong by a
different amount for each — it is how one build "proved" its roofs were
flush when they were not, and how a reviewer then over-reported the same
gaps as three times their real size. Meshes are different again: use
`bounds` from `dsa scene inspect`, which reports real world extents.

## Gap check

`bin/dsa projects get <id> > p.json`, then:

```python
import json
UNIT = {'box': (1.6, 1.6, 1.6), 'cylinder': (1.6, 1.6, 1.6), 'sphere': (2, 2, 2),
        'cone': (2, 1.7, 2), 'torus': (2.2, .6, 2.2), 'torusKnot': (1.86, 1.86, 1.86)}
TOL = 0.02
raw = json.load(open('p.json'))
doc = raw.get('project', raw).get('document', raw)
nodes = [n for p in doc['pages'] for n in p['nodes'] if (n.get('scene') or {}).get('position')]

def extent(n):
    s = n['scene']; p = s['position']; k = s.get('scale', [1, 1, 1])
    u = UNIT.get((n.get('data') or {}).get('geometry', 'box'), (1.6, 1.6, 1.6))
    return p, p[1] - k[1] * u[1] / 2, p[1] + k[1] * u[1] / 2, max(k[0] * u[0], k[2] * u[2]) / 2

out = []
for n in nodes:
    p, bottom, top, r = extent(n)
    best = None
    for m in nodes:
        if m is n: continue
        q, b2, t2, r2 = extent(m)
        # Candidates: parts whose footprint overlaps this node's centre and
        # that top out at or below it. The highest such top is what this
        # node is standing on, whatever its size.
        if ((p[0]-q[0])**2 + (p[2]-q[2])**2) ** .5 > r2: continue
        if t2 > bottom + 1e-6: continue
        if best is None or t2 > best[0]: best = (t2, m.get('name', m['id']))
    if best and bottom - best[0] > TOL:
        out.append((bottom - best[0], n.get('name', n['id']), bottom, best[0], best[1]))

# Group by (part, supporter) so twelve identical windows are one line, and
# show the tightest gaps last — those are the near-misses worth fixing.
from collections import Counter
groups = Counter((nm, who, round(gap, 3)) for gap, nm, bottom, t2, who in out)
print(f'{len(out)} of {len(nodes)} nodes sit above the part under them')
for (nm, who, gap), count in sorted(groups.items(), key=lambda kv: -kv[0][2]):
    tag = f' x{count}' if count > 1 else ''
    print(f'  {nm:26s} above "{who:22s}" GAP {gap:7.3f}{tag}')
```

Read it from the **bottom up**. Large gaps are mostly uninteresting: a
window high on a tower is genuinely eleven units above the lawn, because
the lawn is the only thing under it. The small gaps are where the bugs
live — a roof 1.1 above its shaft, a spire cap 0.27 above its roof — and
those are the lines that mean a part is meant to touch and does not.

On a 450-node castle this reported 424 flagged nodes collapsing to 208
distinct part/supporter rows, and the tight end of the list held every
real defect: all 13 conical roofs floating 0.12–1.11 above their towers,
every finial floating 0.13–0.27 above its roof, and small strays like a
lamp 0.062 above its post. Nothing in the renders had made that obvious.

Do not try to filter the list down to only true positives by adding size
or containment rules — several plausible ones were tried here and each
either hid the roofs or adopted the whole castle onto the lawn. Sorting
and grouping is enough; your judgement does the rest.

It still reports intentional floaters — a flag on a pole, a hovering
lamp — so read the list and decide per line; the point is that nothing
floats *by accident*. Tighten it to your model rather than deleting it.

## Other cheap measurements

| Question | How |
| --- | --- |
| Is anything outside the camera? | `export --format scene-angles` writes `views.json` with `status: outside-camera / partially-clipped` per node per view — free, and it distinguishes "not there" from "not visible" |
| Do two solids interpenetrate? | overlap on all three scaled axes |
| Does a mesh sit where you think? | `dsa scene inspect <id> --page <PAGE_ID>` → `bounds`, `poseBounds` |
| Is a shaft too short for its roof? | shaft `top` vs roof `bottom` per named group |

## When measurements and the image disagree

The measurement wins **only if the measurement is right** — check the unit
table above before trusting either side, because an arithmetic model with
the wrong constants is not evidence. Once the numbers are computed
correctly, do not overturn them because a render looks convincing: verify
which node the contradicting pixels belong to (`views.json` bounds, or
hide the node and re-render). Both failure directions have happened here:
a build that trusted bad arithmetic and shipped floating roofs, and a
review that trusted bad arithmetic and reported them as three times worse.
