"""Plan geometry of one floor, measured from the records the model leaves (Floor.note in lib/floor.mjs).

Everything returned is in drawing millimetres: X = model x, Y = -model z, so the rear of the house is at the top of
the sheet, as on the original drawings.
"""
import math
from collections import defaultdict

from shapely.geometry import LineString, Point, Polygon
from shapely.ops import linemerge, unary_union

MM = 1000.0
LOW_MIN = 0.02      # m: anything lower than this above the floor is a threshold, not drawn as an edge
BARRIER_MIN = 0.25  # m: a solid at least this high closes a room


def T(x, z):
    return (round(x * MM, 3), round(-z * MM, 3))


def poly(points):
    return Polygon([T(*p) for p in points])


def polygons(geom):
    if geom is None or geom.is_empty:
        return []
    if geom.geom_type == 'Polygon':
        return [geom]
    return [p for g in getattr(geom, 'geoms', []) for p in polygons(g)]


def paths(geom):
    """Coordinate lists of every line in a geometry (polygon boundaries included)."""
    if geom is None or geom.is_empty:
        return []
    kind = geom.geom_type
    if kind in ('LineString', 'LinearRing'):
        return [list(geom.coords)]
    if kind == 'Polygon':
        return [list(geom.exterior.coords)] + [list(r.coords) for r in geom.interiors]
    return [p for g in getattr(geom, 'geoms', []) for p in paths(g)]


def merge(lines):
    """Line work joined into the longest runs it forms, as coordinate lists."""
    joined = unary_union(lines)
    if joined.is_empty:
        return []
    return paths(joined if joined.geom_type in ('LineString', 'LinearRing') else linemerge(joined))


def union(geoms, heal=1.0):
    """Union that also closes the hairline gaps left by rounded coordinates."""
    geoms = [g for g in geoms if g is not None and not g.is_empty]
    if not geoms:
        return Polygon()
    merged = unary_union([g.buffer(heal, join_style='mitre') for g in geoms]) if heal else unary_union(geoms)
    return merged.buffer(-heal, join_style='mitre') if heal else merged


def clean(geom, width=4.0):
    """Drops slivers narrower than `width`."""
    return geom.buffer(-width / 2, join_style='mitre').buffer(width / 2, join_style='mitre')


def unit(p, q):
    dx, dy = q[0] - p[0], q[1] - p[1]
    length = math.hypot(dx, dy)
    return dx / length, dy / length, length


def oriented_rect(p, q, depth, extend=0.0):
    """Rectangle along p→q, `depth` across, optionally longer by `extend` at both ends."""
    ux, uy, _ = unit(p, q)
    nx, ny, h = -uy, ux, depth / 2
    a = (p[0] - ux * extend, p[1] - uy * extend)
    b = (q[0] + ux * extend, q[1] + uy * extend)
    return Polygon([(a[0] - nx * h, a[1] - ny * h), (b[0] - nx * h, b[1] - ny * h), (b[0] + nx * h, b[1] + ny * h), (a[0] + nx * h, a[1] + ny * h)])


def span_through(region, point, horizontal):
    """The stretch of `region` on the horizontal or vertical line through `point`: (start, end) along that axis."""
    x, y = point
    minx, miny, maxx, maxy = region.bounds
    ray = LineString([(minx - 10, y), (maxx + 10, y)]) if horizontal else LineString([(x, miny - 10), (x, maxy + 10)])
    for piece in paths(region.intersection(ray)):
        values = sorted(c[0] if horizontal else c[1] for c in piece)
        if values[0] - 1e-6 <= (x if horizontal else y) <= values[-1] + 1e-6:
            return values[0], values[-1]
    return None


class FloorPlan:
    """What a horizontal cut through one floor shows."""

    def __init__(self, floor, lower=None):
        self.code, self.name, self.level, self.height = floor['code'], floor['name'], floor['level'], floor['height']
        self.cut = floor['cut']
        self.floor = floor
        records = defaultdict(list)
        for record in floor['plan']:
            records[record['kind']].append(record)
        self.records = records
        cut = self.cut

        slab = records['slab'][0]
        self.holes = [poly(h) for h in slab['holes']]
        self.outline = poly(slab['poly'])
        self.slab = self.outline.difference(union(self.holes, 0)) if self.holes else self.outline

        solids = [(poly(r['poly']), r['y0'], r['y1'], r.get('tag')) for r in records['solid']]
        self.solids = solids
        self.walls = union([p for p, y0, y1, _ in solids if y0 < cut < y1])
        self.light = union([p for p, y0, y1, tag in solids if y0 < cut < y1 and tag == 'light'])
        # What lies below the cut (sills, kerbs, parapets). Where its edges run along a cut wall, the wall line wins.
        self.low = union([p for p, y0, y1, _ in solids if LOW_MIN < y1 <= cut])
        self.low_edges = paths(self.low.difference(self.walls).boundary.difference(self.walls.buffer(1.5)))

        self.openings = [self._opening(r) for r in records['opening']]
        self.screens = [dict(p=T(*r['p']), q=T(*r['q']), frosted=bool(r.get('frosted')), cut=r['y0'] < cut < r['y1']) for r in records['screen']]
        self.railings = [dict(points=[T(*p) for p in r['pts']], height=r['h'], kerb=r['kerb'], thickness=r['thickness'] * MM, closed=r['closed']) for r in records['railing']]
        self.planters = [poly(r['poly']) for r in records['planter']]
        self.finishes = [dict(code=r['code'], shape=poly(r['poly']).difference(union([poly(h) for h in r['holes']], 0)) if r['holes'] else poly(r['poly'])) for r in records['finish']]

        self._stairs(lower)
        self._rooms()
        self._attach_openings()

    # ---- openings ----------------------------------------------------------------------------------------------
    def _opening(self, r):
        p, q = T(*r['p']), T(*r['q'])
        ux, uy, width = unit(p, q)
        o = dict(type=r['type'], p=p, q=q, u=(ux, uy), width=width, thickness=r['thickness'] * MM, sill=r['sill'], head=r['head'],
                 high=r['sill'] >= self.cut, tag=r.get('tag'), mid=((p[0] + q[0]) / 2, (p[1] + q[1]) / 2))
        if r['type'] == 'door':
            # The model's swing normal is (-uz, ux) * swing in plan (x, z); Y = -z turns it into (-uz, -ux) here.
            mx, mz = r['q'][0] - r['p'][0], r['q'][1] - r['p'][1]
            n = math.hypot(mx, mz)
            swing = r.get('swing', 1)
            o.update(hinge=r.get('hinge', 'a'), swing=swing, normal=(-mz / n * swing, -mx / n * swing))
        return o

    def _attach_openings(self):
        """Which rooms an opening connects: probe a little beyond each wall face."""
        for o in self.openings:
            ux, uy = o['u']
            nx, ny = -uy, ux
            reach = o['thickness'] / 2 + 150
            sides = []
            for sign in (1, -1):
                probe = Point(o['mid'][0] + nx * reach * sign, o['mid'][1] + ny * reach * sign)
                room = next((room for room in self.rooms if room['shape'].buffer(60).contains(probe)), None)
                sides.append(room['code'] if room else None)
            o['rooms'] = sides

    # ---- stairs ------------------------------------------------------------------------------------------------
    def _stairs(self, lower):
        steps = [dict(shape=poly(r['poly']), top=r['top'], riser=r['riser']) for r in self.records['step']]
        for i, s in enumerate(steps):
            s['index'] = i + 1
            s['visible'] = s['top'] - s['riser'] < self.cut
        self.steps = steps
        self.steps_visible = [s for s in steps if s['visible']]
        self.steps_above = [s for s in steps if not s['visible']]
        own = union([s['shape'] for s in self.steps_visible], 0)
        self.steps_below = []
        if lower is not None and self.holes:
            window = union(self.holes, 0).difference(own.buffer(0.5)) if not own.is_empty else union(self.holes, 0)
            for s in lower.steps:
                seen = s['shape'].intersection(window)
                # A strip a few centimetres deep is the edge of a tread hidden under this floor's own flight.
                if not seen.is_empty and not seen.buffer(-40).is_empty:
                    self.steps_below.append(dict(shape=seen, index=s['index'], centre=s['shape'].centroid.coords[0], whole=seen.area > .98 * s['shape'].area))
        self.stair_up = [s['shape'].centroid.coords[0] for s in self.steps_visible]
        self.stair_down = [s['centre'] for s in reversed(self.steps_below)]

    # ---- rooms -------------------------------------------------------------------------------------------------
    def _rooms(self):
        cut = self.cut
        blocks = [p for p, y0, y1, _ in self.solids if y0 < cut and y1 >= BARRIER_MIN]
        blocks += [oriented_rect(o['p'], o['q'], o['thickness'] + 2, 1) for o in self.openings]
        blocks += [LineString(r['points']).buffer(r['thickness'] / 2, cap_style='square', join_style='mitre') for r in self.railings]
        for r in self.records['separator']:
            p, q = T(*r['p']), T(*r['q'])
            ux, uy, _ = unit(p, q)
            blocks.append(LineString([(p[0] - ux * 20, p[1] - uy * 20), (q[0] + ux * 20, q[1] + uy * 20)]).buffer(.5, cap_style='flat'))
        blocks += [s['shape'] for s in self.steps_visible]
        free = polygons(self.slab.difference(union(blocks)))
        self.rooms = []
        taken = {}
        for r in self.floor['rooms']:
            seed = T(r['x'], r['z'])
            index = next((i for i, c in enumerate(free) if c.contains(Point(seed))), None)
            if index is None:
                raise SystemExit(f"{self.code}: the point of room '{r['code']}' is inside a wall or outside the slab")
            if index in taken:
                raise SystemExit(f"{self.code}: rooms '{taken[index]}' and '{r['code']}' are one open space; add a separator between them")
            taken[index] = r['code']
            shape = free[index]
            across, along = span_through(shape, seed, True), span_through(shape, seed, False)
            finish = next((f['code'] for f in self.finishes if f['shape'].contains(Point(seed))), None)
            self.rooms.append(dict(code=r['code'], name=r['name'], kind=r['kind'], seed=seed, shape=shape, finish=finish,
                                   area=shape.area / 1e6, perimeter=shape.length / MM, across=across, along=along))


def wall_changes(variant, original):
    """New and removed walls of a variant plan against the original one."""
    return clean(variant.walls.difference(original.walls.buffer(1)), 20), clean(original.walls.difference(variant.walls.buffer(1)), 20)


# ---- top views of meshes --------------------------------------------------------------------------------------------

def silhouette(parts):
    """The area the parts cover seen from above, as one shape: for things whose inner edges would only be noise."""
    shapes = []
    for part in parts:
        pos, idx = part['positions'], part['indices']
        for i in range(0, len(idx), 3):
            tri = Polygon([T(pos[3 * idx[i + k]], pos[3 * idx[i + k] + 2]) for k in range(3)])
            if tri.area > 1:
                shapes.append(tri)
    return union(shapes, 2.0)


def top_view(parts, clip=None, keep=None, min_area=400.0):
    """Edges seen from straight above: faces sorted by height, each one hidden where a higher face covers it.

    `parts` are model parts with absolute positions; returns {part code: [coordinate lists]} in drawing millimetres.
    """
    faces = []
    for part in parts:
        pos, idx, col = part['positions'], part['indices'], part['colors']
        level, sloped = defaultdict(list), defaultdict(list)
        for i in range(0, len(idx), 3):
            a, b, c = (pos[3 * idx[i + k]: 3 * idx[i + k] + 3] for k in range(3))
            ux, uy, uz, vx, vy, vz = b[0] - a[0], b[1] - a[1], b[2] - a[2], c[0] - a[0], c[1] - a[1], c[2] - a[2]
            nx, ny, nz = uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx
            n = math.sqrt(nx * nx + ny * ny + nz * nz)
            if n < 1e-10 or abs(ny) / n < .05:
                continue  # degenerate or vertical: nothing to see from above
            tri = Polygon([T(a[0], a[2]), T(b[0], b[2]), T(c[0], c[2])])
            if tri.area < 1:
                continue
            colour = col[idx[i]]
            if abs(ny) / n > .9995:
                level[(colour, round((a[1] + b[1] + c[1]) / 3, 3))].append(tri)
            else:
                plane = (colour, round(nx / n, 2), round(ny / n, 2), round(nz / n, 2)) if keep == 'planes' else colour
                sloped[plane].append((tri, max(a[1], b[1], c[1])))
        for (_, y), tris in level.items():
            faces.append((y, union(tris, .5), part['code']))
        for tris in sloped.values():
            faces.append((max(t[1] for t in tris), union([t[0] for t in tris], .5), part['code']))
    faces.sort(key=lambda f: -f[0])
    covered, edges = Polygon(), defaultdict(list)
    i = 0
    while i < len(faces):
        j = i
        while j < len(faces) and abs(faces[j][0] - faces[i][0]) < 1e-3:
            j += 1
        batch = faces[i:j]
        for _, shape, code in batch:
            seen = shape.difference(covered) if not covered.is_empty else shape
            if clip is not None:
                seen = seen.intersection(clip)
            for piece in polygons(seen):
                if piece.area >= min_area and not piece.buffer(-3).is_empty:
                    edges[code].append(piece.boundary)
        covered = unary_union([covered] + [f[1] for f in batch])
        i = j
    result = {}
    for code, rings in edges.items():
        result[code] = [list(LineString(path).simplify(1.0).coords) for path in merge(rings)]
    return result
