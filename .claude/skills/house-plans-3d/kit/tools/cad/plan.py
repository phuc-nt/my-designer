"""One floor as a plan drawing: what is drawn, on which layer and in which order.

Three modes share the same geometry:
  dims    the dimension plan of a sheet: grid, documented and estimated dimensions, opening marks, areas; no furniture
  layout  the furniture plan of a sheet: furniture and room names, no dimensions
  web     everything; the viewer switches layers on and off

Nothing here belongs to one house: axes, boundary, levels and the parts of the covers come from the Project.
"""
import math

from shapely.geometry import LineString, Point, Polygon, box
from shapely.ops import linemerge, unary_union

from drawing import TEXT_DIM, TEXT_ROOM, Drawing, cut_around, text_box, text_width, vn
from geometry import T, merge, oriented_rect, paths, polygons, silhouette, span_through, top_view, unit, wall_changes

FRAME = 70       # depth of an aluminium frame in plan
MARK = 150       # text height of an opening mark
ROW = 800        # distance between two dimension chains
BUBBLE = 400     # radius of a grid bubble
AREA_TEXT = {TEXT_ROOM: TEXT_DIM, 220: 180, 180: 150}  # text height of the area line under a room name of a given height
OPEN_END = 700   # how far a boundary line runs on past the last station where the documents close no corner
# Parts of a site floor drawn around the plan it belongs to, by part code: (layer, how, only with the furniture)
SITE_PARTS = (('porch', 'L-SITE', 'edges', False), ('fence', 'L-SITE', 'edges', False), ('lawn', 'L-PLNT', 'edges', False),
              ('shrubs', 'L-PLNT', 'outline', True), ('car', 'L-SITE-VEHC', 'smooth', True))


class Marks:
    """Opening types of the whole building: the same size gets the same mark on every sheet."""
    PREFIX = {'door': 'D', 'glassDoor': 'DK', 'window': 'S', 'opening': 'O'}

    def __init__(self):
        self.types = {}

    def mark(self, opening, floor):
        key = (opening['type'], round(opening['width'] / 10) * 10, round((opening['head'] - opening['sill']) * 100) * 10, round(opening['sill'] * 100) * 10)
        kind = self.types.get(key)
        if kind is None:
            prefix = self.PREFIX[opening['type']]
            number = 1 + sum(1 for k in self.types.values() if k['type'] == opening['type'])
            kind = self.types[key] = dict(mark=f'{prefix}{number}', type=opening['type'], width=key[1], height=key[2], sill=key[3], floors={})
        if floor is not None:
            kind['floors'][floor] = kind['floors'].get(floor, 0) + 1
        return kind['mark']


# ---- room tags ------------------------------------------------------------------------------------------------------

class Tag:
    """Name of a room and, below it, its area: fitted to the room, turned upright in a narrow one. Only habitable rooms
    get the large lettering. Where name and area do not fit together, the area is left to the room schedule."""

    def __init__(self, at, name, area, across, along, small=False, shape=None):
        two = None
        if ' ' in name:
            cuts = [i for i, ch in enumerate(name) if ch == ' ']
            cut = min(cuts, key=lambda i: abs(i - len(name) / 2))
            two = [name[:cut], name[cut + 1:]]
        sizes = (220, 180) if small else (TEXT_ROOM, 220, 180)
        shapes = [(False, size, lines) for size in sizes for lines in ([name], two) if lines] + [(True, size, [name]) for size in sizes]
        options = [(*shape, extra) for extra in ((area, None) if area else (None,)) for shape in shapes]
        options.append((False, 180, two or [name], None))
        for vertical, size, lines, extra in options:
            rows = [(line, size) for line in lines] + ([(extra, AREA_TEXT[size])] if extra else [])
            width = max(text_width(s, h) for s, h in rows)
            height = sum(h for _, h in rows) + .6 * size * (len(rows) - 1)
            room_w, room_h = (along[1] - along[0], across[1] - across[0]) if vertical else (across[1] - across[0], along[1] - along[0])
            self.rows, self.width, self.height, self.vertical, self.gap = rows, width, height, vertical, .6 * size
            if width <= room_w - 120 and height <= room_h - 160:
                break
        w, h = (self.height, self.width) if self.vertical else (self.width, self.height)
        # Kept clear of the walls where the room allows it.
        keep = lambda v, lo, hi, half: v if hi - lo < 2 * half + 160 else min(max(v, lo + half + 80), hi - half - 80)
        at = (keep(at[0], *across, w / 2), keep(at[1], *along, h / 2))
        around = lambda p: box(p[0] - w / 2 - 60, p[1] - h / 2 - 60, p[0] + w / 2 + 60, p[1] + h / 2 + 60)
        if shape is not None and not shape.contains(around(at)):  # a room that is not a rectangle: the nearest place that is inside it
            moves = sorted(((dx, dy) for dx in range(-600, 601, 60) for dy in range(-600, 601, 60)), key=lambda m: m[0] ** 2 + m[1] ** 2)
            at = next(((at[0] + dx, at[1] + dy) for dx, dy in moves if shape.contains(around((at[0] + dx, at[1] + dy)))), at)
        self.at, self.box = at, around(at)

    def draw(self, d):
        b = self.height / 2
        for string, size in self.rows:
            b -= size / 2
            at = (self.at[0] - b, self.at[1]) if self.vertical else (self.at[0], self.at[1] + b)
            d.text('A-AREA-IDEN', at, string, size, rotation=90 if self.vertical else 0)
            b -= size / 2 + self.gap


# ---- openings -------------------------------------------------------------------------------------------------------

def faces(o):
    """The two lines of an opening on the faces of its wall."""
    (ux, uy), h = o['u'], o['thickness'] / 2
    nx, ny = -uy, ux
    return [[(o['p'][0] + nx * s * h, o['p'][1] + ny * s * h), (o['q'][0] + nx * s * h, o['q'][1] + ny * s * h)] for s in (1, -1)]


def draw_opening(d, o):
    p, q, (ux, uy), L, t = o['p'], o['q'], o['u'], o['width'], o['thickness']
    kind = o['type']
    if kind == 'window':
        style = dict(linetype='PLAN-HIDDEN') if o['high'] else {}
        d.line('A-GLAZ', list(oriented_rect(p, q, t if o['high'] else FRAME).exterior.coords), **style)
        d.line('A-GLAZ', [p, q], **style)
    elif kind == 'glassDoor':
        for face in faces(o):
            d.line('A-GLAZ', face, weight=9)
        nx, ny = -uy, ux
        if L >= 1500:  # two sliding panels, overlapping in the middle
            half = L / 2
            for a, b, s in ((0, half + 50, 1), (half - 50, L, -1)):
                a0 = (p[0] + ux * a + nx * s * 18, p[1] + uy * a + ny * s * 18)
                b0 = (p[0] + ux * b + nx * s * 18, p[1] + uy * b + ny * s * 18)
                d.line('A-GLAZ', list(oriented_rect(a0, b0, 36).exterior.coords))
        else:
            d.line('A-GLAZ', list(oriented_rect(p, q, FRAME).exterior.coords))
            d.line('A-GLAZ', [p, q])
    elif kind == 'door':
        for face in faces(o):
            d.line('A-DOOR', face, weight=9)
        nx, ny = o['normal']
        jamb, (ax, ay) = (p, (ux, uy)) if o['hinge'] == 'a' else (q, (-ux, -uy))
        hx, hy = jamb[0] + ax * 40 + nx * t / 2, jamb[1] + ay * 40 + ny * t / 2
        w = L - 80
        d.line('A-DOOR', list(oriented_rect((hx + ax * 20, hy + ay * 20), (hx + ax * 20 + nx * w, hy + ay * 20 + ny * w), 40).exterior.coords))
        a1, a2 = math.degrees(math.atan2(ay, ax)), math.degrees(math.atan2(ny, nx))
        start, end = (a1, a2) if ax * ny - ay * nx > 0 else (a2, a1)
        d.arc('A-DOOR', (hx, hy), w, start, end, weight=9)
    else:  # an opening without a leaf: the lintel above the cut
        for face in faces(o):
            d.line('A-DOOR', face, linetype='PLAN-HIDDEN', weight=9)


def mark_points(o, fp, string):
    """Places the mark of an opening may take, best first. A door: opposite its swing, else inside the swing. Anything
    else: on the room side, else on the other side."""
    ux, uy = o['u']
    nx, ny = -uy, ux
    w = text_width(string, MARK)

    def beside(sx, sy):
        reach = o['thickness'] / 2 + 90 + abs(sx) * w / 2 + abs(sy) * MARK / 2
        return (o['mid'][0] + sx * reach, o['mid'][1] + sy * reach)

    if o['type'] == 'door':
        nx, ny = o['normal']
        jamb, (ax, ay) = (o['p'], (ux, uy)) if o['hinge'] == 'a' else (o['q'], (-ux, -uy))
        r, t = .42 * (o['width'] - 80), o['thickness'] / 2
        return [beside(-nx, -ny), (jamb[0] + ax * (40 + r) + nx * (t + r), jamb[1] + ay * (40 + r) + ny * (t + r))]
    outdoor = {r['code'] for r in fp.rooms if r['kind'] == 'outdoor'}
    indoor = [s for s, room in zip((1, -1), o['rooms']) if room and room not in outdoor]
    s = indoor[0] if indoor else 1
    if o['type'] == 'window' and len(indoor) == 1 and None in o['rooms']:
        s = -s  # nothing but open air outside: the mark is out of the way there
    return [beside(nx * s, ny * s), beside(-nx * s, -ny * s)]


def inside_dimensions(d, room, tag, below, clear):
    """Clear width and depth of a room, drawn beside its name. A line goes only where it measures the same as through
    the middle of the room (a chamfer or a recess prevents that) and where line and figure stay clear of other text;
    the figure slides along its line when the middle is taken."""
    shape, lines = room['shape'], []
    x0, y0, x1, y1 = tag.box.bounds
    for horizontal, whole, other in ((True, room['across'], room['along']), (False, room['along'], room['across'])):
        if whole is None or other is None:
            continue
        string = f'({round((whole[1] - whole[0]) / 10) * 10})'
        half, mid = text_width(string, TEXT_DIM) / 2 + 40, (whole[0] + whole[1]) / 2
        first = [min(y0, below) - 380, y1 + 160] if horizontal else [x1 + 380, x0 - 160]
        centre = tag.at[1] if horizontal else tag.at[0]
        scan = sorted((other[0] + 300 + 50 * k for k in range(max(0, int((other[1] - other[0] - 600) / 50) + 1))), key=lambda v: abs(v - centre))
        slides = sorted((s for s in range(-3000, 3001, 100) if s and whole[0] + half + 100 <= mid + s <= whole[1] - half - 100), key=abs)
        for v, slide in [(v, 0) for v in first + scan] + [(v, s) for v in scan for s in slides]:
            point = (mid, v) if horizontal else (v, mid)
            span = span_through(shape, point, horizontal) if shape.contains(Point(point)) else None
            if span is None or abs(span[0] - whole[0]) > 6 or abs(span[1] - whole[1]) > 6:
                continue
            m = mid + slide
            if horizontal:
                figure, line, location = box(m - half, v + 40, m + half, v + 80 + TEXT_DIM), LineString([(span[0], v), (span[1], v)]), (m, v + 60 + TEXT_DIM / 2)
            else:
                figure, line, location = box(v - 80 - TEXT_DIM, m - half, v - 40, m + half), LineString([(v, span[0]), (v, span[1])]), (v - 60 - TEXT_DIM / 2, m)
            if not shape.contains(figure) or any(b.intersects(figure) or b.intersects(line) for b in clear) or any(l.intersects(figure) for l in lines):
                continue
            d.dim('A-ANNO-DIMS-ESTM', line.coords[0], line.coords[1], point, vertical=not horizontal, estimated=True, location=location if slide else None)
            clear.append(figure)
            lines.append(line)
            break


def facade_stations(fp):
    """Jambs of the openings in the outside walls, by the side they face: rear, front, left (low x) or right."""
    outdoor = {r['code'] for r in fp.rooms if r['kind'] == 'outdoor'}
    sides = {'rear': set(), 'front': set(), 'left': set(), 'right': set()}
    for o in fp.openings:
        ux, uy = o['u']
        if min(abs(ux), abs(uy)) > .05:
            continue  # a slanted wall is measured along itself, not along an axis
        nx, ny = -uy, ux
        out = []
        for s, room in zip((1, -1), o['rooms']):
            probe = Point(o['mid'][0] + nx * s * (o['thickness'] / 2 + 150), o['mid'][1] + ny * s * (o['thickness'] / 2 + 150))
            out.append(room in outdoor or (room is None and not fp.outline.contains(probe)))
        if out[0] == out[1]:
            continue
        s = 1 if out[0] else -1
        if abs(ny) > .9:
            sides['rear' if ny * s > 0 else 'front'].update((o['p'][0], o['q'][0]))
        else:
            sides['right' if nx * s > 0 else 'left'].update((o['p'][1], o['q'][1]))
    return sides


# ---- stairs ---------------------------------------------------------------------------------------------------------

def step_lines(steps):
    return merge([s['shape'].boundary for s in steps])


def break_line(edge):
    (x0, y0), (x1, y1) = edge.coords[0], edge.coords[-1]
    ux, uy, _ = unit((x0, y0), (x1, y1))
    nx, ny, mx, my = -uy, ux, (x0 + x1) / 2, (y0 + y1) / 2
    return [(x0 - ux * 100, y0 - uy * 100), (mx - ux * 90, my - uy * 90), (mx - ux * 30 + nx * 140, my - uy * 30 + ny * 140),
            (mx + ux * 30 - nx * 140, my + uy * 30 - ny * 140), (mx + ux * 90, my + uy * 90), (x1 + ux * 100, y1 + uy * 100)]


def walking_line(points, lead=320):
    """The line of travel through the centres of the steps: straight runs joined at a square corner (the centres of
    winders wander), started a little before the first step."""
    if len(points) < 2:
        return None
    runs, i = [], 0
    while i < len(points) - 1:
        axis = 0 if abs(points[i][0] - points[i + 1][0]) < 5 else 1 if abs(points[i][1] - points[i + 1][1]) < 5 else None
        if axis is None:
            i += 1
            continue
        j = i + 1
        while j + 1 < len(points) and abs(points[j][axis] - points[j + 1][axis]) < 5:
            j += 1
        runs.append((axis, points[i], points[j]))
        i = j
    if not runs:
        return None
    line = [runs[0][1]]
    for (axis, _, end), (next_axis, start, _) in zip(runs, runs[1:]):
        line += [end, start] if axis == next_axis else [(end[0], start[1]) if axis == 0 else (start[0], end[1])]
    line.append(runs[-1][2])
    ux, uy, _ = unit(line[0], line[1])
    return [(line[0][0] - ux * lead, line[0][1] - uy * lead)] + line


def stair_words(fp):
    """Walking lines of the flights with their word, and the box of each word: [(line, word, at, box)]."""
    found = []
    for points, word in ((fp.stair_up, 'LÊN'), (fp.stair_down, 'XUỐNG')):
        line = walking_line(points)
        if line is None:
            continue
        ux, uy, _ = unit(line[0], line[1])
        back = 110 + abs(ux) * text_width(word, MARK) / 2 + abs(uy) * MARK / 2
        at = (line[0][0] - ux * back, line[0][1] - uy * back)
        found.append((line, word, at, text_box(at, word, MARK, pad=40)))
    return found


def draw_stairs(d, fp, clear, words):
    """The flight going up as far as the cut, then the flight coming up from below seen through the stairwell.
    Steps above the cut are dashed only where no lower flight shows (floor 1): the two would lie on each other."""
    d.lines('A-FLOR-STRS', cut_around(step_lines(fp.steps_below), clear), weight=9)
    d.lines('A-FLOR-STRS', cut_around(step_lines(fp.steps_visible), clear))
    if not fp.steps_below:
        d.lines('A-FLOR-STRS', cut_around(step_lines(fp.steps_above), clear), linetype='PLAN-HIDDEN', weight=9)
    if fp.steps_visible and fp.steps_above:
        edge = fp.steps_visible[-1]['shape'].intersection(fp.steps_above[0]['shape'])
        if edge.geom_type == 'MultiLineString':
            edge = linemerge(edge)
        if edge.geom_type == 'LineString' and edge.length > 200:
            d.line('A-FLOR-STRS', break_line(edge), weight=18)
    for line, word, at, _ in words:
        d.arrow('A-ANNO-SYMB', line, weight=9)
        d.text('A-ANNO-SYMB', at, word, MARK)


# ---- the plan -------------------------------------------------------------------------------------------------------

def draw_grid(d, gx, gy, frame, full=True, clear=()):
    """Grid lines and bubbles. frame: (left, bottom, right, top) of the bubble centres; full: bubbles on all four sides."""
    left, bottom, right, top = frame
    lines = []
    for name, x in gx.items():
        if name.startswith('axis-'):
            lines.append([(x, top - BUBBLE), (x, bottom + (BUBBLE if full else 0))])
            d.bubble((x, top), name[5:], BUBBLE)
            if full:
                d.bubble((x, bottom), name[5:], BUBBLE)
    for name, y in gy.items():
        if name.startswith('axis-'):
            lines.append([(left + BUBBLE, y), (right - (BUBBLE if full else 0), y)])
            d.bubble((left, y), name[5:], BUBBLE)
            if full:
                d.bubble((right, y), name[5:], BUBBLE)
    d.lines('S-GRID', cut_around(lines, list(clear)))


def extents(project, bounds):
    """left, bottom, right, top of a plan: the documented stations, widened to what is drawn where that reaches further."""
    x0, y0, x1, y1 = bounds
    gx, gy = project.gx.values(), project.gy.values()
    return min(min(gx), x0), min(min(gy), y0), max(max(gx), x1), max(max(gy), y1)


def draw_boundary(d, project):
    """The plot boundary as far as the documents give it. A side without a boundary station is not drawn, and the
    lines that would meet it run on a little: the plot goes on there (the next house of a row, a side not surveyed)."""
    left, bottom, right, top = project.boundary
    gx, gy = project.gx.values(), project.gy.values()
    x0, x1 = min(gx) - OPEN_END if left is None else left, max(gx) + OPEN_END if right is None else right
    y0, y1 = min(gy) - OPEN_END if bottom is None else bottom, max(gy) + OPEN_END if top is None else top
    sides = [(top, (x0, y1), (x1, y1)), (right, (x1, y1), (x1, y0)), (bottom, (x1, y0), (x0, y0)), (left, (x0, y0), (x0, y1))]  # clockwise
    if all(side[0] is not None for side in sides):
        d.line('L-SITE-BNDY', [side[1] for side in sides], closed=True)
        return
    start = next(i for i, side in enumerate(sides) if side[0] is None)
    run = []
    for k in range(1, 5):  # once around, starting after an open side, so sides that meet are one line
        at, a, b = sides[(start + k) % 4]
        if at is not None:
            run = run + [b] if run else [a, b]
        elif run:
            d.line('L-SITE-BNDY', run)
            run = []


def draw_documented(d, project, left, top):
    """The two chains printed on the original documents and, beyond each, its overall where one is printed.
    Returns the label boxes."""
    gx, gy = project.gx.values(), project.gy.values()
    boxes = d.chain('A-ANNO-DIMS', gx, top, outward=1) + d.chain('A-ANNO-DIMS', gy, left, vertical=True, outward=-1)
    if project.chain('across').get('overall_mm') is not None:
        boxes += d.chain('A-ANNO-DIMS', [min(gx), max(gx)], top + ROW, outward=1)
    if project.chain('along').get('overall_mm') is not None:
        boxes += d.chain('A-ANNO-DIMS', [max(gy), min(gy)], left - ROW, vertical=True, outward=-1)
    return boxes


def draw_floor(fp, project, marks, mode='web', original=None):
    """fp: the floor as a FloorPlan; original: the plan a variant is compared with."""
    d = Drawing()
    gx, gy, spec = project.gx, project.gy, project.floors[fp.code]
    site = spec.get('site')
    with_dims, with_furniture = mode != 'layout', mode != 'dims'
    left, bottom, right, top = extents(project, fp.outline.bounds)

    # Text first: line work is cut around it.
    tags = [Tag(r['seed'], r['name'], f"{vn(r['area'])} m²" if with_dims else None, r['across'] or (r['seed'][0],) * 2, r['along'] or (r['seed'][1],) * 2,
                small=r['kind'] != 'room', shape=r['shape']) for r in fp.rooms]
    clear = [t.box for t in tags]
    notes = Drawing()  # level marks and yard names, kept apart so their boxes are known before the line work
    under = {}         # lowest text of a room, for the dimension line below it
    # The level of the floor goes under the name of its largest habitable room.
    rooms = [i for i, r in enumerate(fp.rooms) if r['kind'] == 'room'] or list(range(len(fp.rooms)))
    if rooms:
        main = max(rooms, key=lambda i: fp.rooms[i]['area'])
        label = project.level_label(project.level_of(fp.code))
        level_w = 320 + text_width(label, 180)
        level_at = (tags[main].at[0] - level_w / 2 + 110, tags[main].box.bounds[1] - 430)
        clear.append(notes.level_mark(level_at, label))
        under[main] = clear[-1].bounds[1]
    if site:  # the yards: name and level side by side
        ground = project.level_label(site['level'])
        for name in site.get('names', []):
            at, w = T(name['x'], name['z']), text_width(name['text'], 220)
            notes.text('A-AREA-IDEN', (at[0] - w / 2 - 100, at[1]), name['text'], 220, align='mc')
            clear.append(text_box((at[0] - w / 2 - 100, at[1]), name['text'], 220))
            clear.append(notes.level_mark((at[0] + 260, at[1] - 180), ground))

    words = stair_words(fp)
    clear += [w[3] for w in words]
    placed = []  # opening marks: (layer, point, string)
    if with_dims:
        for o in fp.openings:
            string = marks.mark(o, fp.code if mode == 'dims' else None)
            options = mark_points(o, fp, string)
            at = next((p for p in options if not any(b.intersects(text_box(p, string, MARK, pad=20)) for b in clear)), options[0])
            placed.append(('A-DOOR-IDEN' if o['type'] in ('door', 'opening') else 'A-GLAZ-IDEN', at, string))
            clear.append(text_box(at, string, MARK, pad=40))

    # The site around the ground floor: porch steps, fence, lawn; planting and the parked car only with the furniture.
    if site:
        parts = {p['code']: p for p in project.model_floor(site['floor'])['parts']}
        outside = box(left - 400, bottom, right, top).difference(fp.outline.buffer(1))
        for code, layer, how, furniture in SITE_PARTS:
            if code not in parts or (furniture and not with_furniture):
                continue
            if how == 'edges':
                lines = top_view([parts[code]], clip=outside).get(code, [])
            else:
                shape = silhouette([parts[code]])
                lines = paths(shape.intersection(outside) if how == 'outline' else shape.simplify(15))
            d.lines(layer, cut_around(lines, clear))

    d.lines('A-FLOR-OTLN', fp.slab.boundary.difference(fp.walls.buffer(1.5)).difference(fp.low.buffer(1.5)))
    new = removed = None
    if original is not None:
        new, removed = wall_changes(fp, original)
    d.fill('A-WALL-PATT', fp.walls if new is None or new.is_empty else fp.walls.difference(new.buffer(.5)))
    if new is not None:
        d.fill('A-WALL-NEW', new)
    d.lines('A-WALL', fp.walls.boundary)
    if removed is not None:
        d.lines('A-WALL-DEMO', removed.boundary)
    d.lines('A-WALL-SILL', fp.low_edges)

    for o in fp.openings:
        draw_opening(d, o)
    draw_stairs(d, fp, clear, words)
    for r in fp.railings:
        d.line('A-FLOR-HRAL', r['points'], closed=r['closed'])
    spans = [LineString([o['p'], o['q']]) for o in fp.openings] + [LineString(r['points']) for r in fp.railings]
    for s in fp.screens:  # glass that belongs to no window and no railing: balcony dividers
        middle = Point((s['p'][0] + s['q'][0]) / 2, (s['p'][1] + s['q'][1]) / 2)
        if s['cut'] and all(span.distance(middle) > 60 for span in spans):
            d.line('A-GLAZ', [s['p'], s['q']], **(dict(linetype='PLAN-HIDDEN') if s['frosted'] else {}))

    shown = [p for p in fp.floor['parts'] if not p['upper'] and (p['code'] in ('sanitary', 'planters') or (with_furniture and p['group'] == 'furniture'))]
    for code, lines in top_view(shown).items():
        layer = 'A-FLOR-FIXT' if code == 'sanitary' else 'L-PLNT' if code == 'planters' else 'A-FURN'
        d.lines(layer, cut_around(lines, clear))

    for room, tag in zip(fp.rooms, tags):
        d.room(room, fp.code)
        tag.draw(d)
    d.place(notes)

    if with_dims:
        for layer, at, string in placed:
            d.text(layer, at, string, MARK)
        # Clear width and depth of the habitable rooms; the other rooms are in the room schedule.
        for i, (room, tag) in enumerate(zip(fp.rooms, tags)):
            if room['kind'] == 'room':
                inside_dimensions(d, room, tag, under.get(i, tag.box.bounds[1]), clear)
        # Outside chains: openings (estimated) nearest the plan, then the documented chain, then the printed overall.
        jambs = facade_stations(fp)
        axes_x = [v for k, v in gx.items() if k.startswith('axis-')]
        axes_y = [v for k, v in gy.items() if k.startswith('axis-')]
        if jambs['rear']:
            clear += d.chain('A-ANNO-DIMS-ESTM', [*axes_x, *jambs['rear']], top + 1000, estimated=True, outward=1)
        if jambs['front']:
            clear += d.chain('A-ANNO-DIMS-ESTM', [*axes_x, *jambs['front']], bottom - 1000, estimated=True, outward=-1)
        if jambs['right']:
            clear += d.chain('A-ANNO-DIMS-ESTM', [*axes_y, *jambs['right']], right + 1000, vertical=True, estimated=True, outward=1)
        rows_left = 1  # chains on the left: openings (if that side has any), the documented chain, its overall
        if jambs['left']:
            clear += d.chain('A-ANNO-DIMS-ESTM', [*axes_y, *jambs['left']], left - 1000, vertical=True, estimated=True, outward=-1)
            rows_left += 1
        clear += draw_documented(d, project, left - 1000 - (rows_left - 1) * ROW, top + 1000 + ROW)
        rows_left += project.chain('along').get('overall_mm') is not None
        rows_top = 2 + (project.chain('across').get('overall_mm') is not None)
        draw_grid(d, gx, gy, (left - 1000 - rows_left * ROW - 300, bottom - 1000 - ROW - 300, right + 1000 + ROW + 300, top + 1000 + rows_top * ROW + 300), clear=clear)
    else:
        draw_grid(d, gx, gy, (left - 900, bottom - 300, right + 300, top + 900), full=False, clear=clear)
    draw_boundary(d, project)
    return d


def roof_faces(part):
    """Sloping faces of a roof part in plan: [(polygon, direction the water runs)], one entry per face."""
    pos, idx = part['positions'], part['indices']
    seen = {}
    for i in range(0, len(idx), 3):
        a, b, c = (pos[3 * idx[i + k]: 3 * idx[i + k] + 3] for k in range(3))
        u, v = [b[k] - a[k] for k in range(3)], [c[k] - a[k] for k in range(3)]
        n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
        length = math.sqrt(sum(k * k for k in n))
        if length < 1e-9:
            continue
        if n[1] < 0:
            n = [-k for k in n]
        key = (round(n[0] / length, 2), round(n[2] / length, 2))
        seen.setdefault(key, []).append(Polygon([T(a[0], a[2]), T(b[0], b[2]), T(c[0], c[2])]))
    found = []
    for (nx, nz), tris in seen.items():
        h = math.hypot(nx, nz)
        for face in polygons(unary_union([t.buffer(2) for t in tris]).buffer(-2)):
            if h >= 1e-6 and face.area >= 4e5:
                found.append((face, (nx / h, -nz / h)))
    return found


def draw_cover(spec, project):
    """A floor seen from above (attic, roof, terrace), projected from the meshes: there is no cut plane up here.
    spec: one entry of "covers" in project.json. It says what each part of the floor is:
      planes    sloping roof parts: eaves, ridges and hips, and an arrow down every face
      thin      small things on the roof, in a thin line (vent pipes)
      under     parts of another floor that show around the planes (the gutter of the attic below the tiles)
      edges     flat parts drawn by their edges (gutter, deck)
      walls     walls standing up through the floor, drawn solid
      fixtures  things standing on the floor, drawn by their outline (water tank)
      names     texts at a model point; level: the level mark and where it goes"""
    d = Drawing()
    gx, gy = project.gx, project.gy

    def pick(codes, floor=None):
        floor = floor or spec['floor']
        parts = {p['code']: p for p in project.model_floor(floor)['parts']}
        missing = [c for c in codes if c not in parts]
        if missing:
            raise SystemExit(f"project.json: cover \"{spec['code']}\" names part {', '.join(missing)} of floor \"{floor}\"; that floor has {', '.join(sorted(parts))}")
        return [parts[c] for c in codes]

    planes, thin = pick(spec.get('planes', [])), pick(spec.get('thin', []))
    walls = silhouette(pick(spec.get('walls', []))) if spec.get('walls') else None
    names = [(T(n['x'], n['z']), n['text']) for n in spec.get('names', [])]
    clear = [text_box(at, name, 220) for at, name in names]
    if spec.get('level'):
        clear.append(d.level_mark(T(spec['level']['x'], spec['level']['z']), project.level_label(spec['level']['id'])))

    cover = silhouette(planes) if planes else None
    for under in spec.get('under', []):
        for part in pick(under['parts'], under['floor']):
            for path in top_view([part]).get(part['code'], []):
                d.lines('A-ROOF', LineString(path).difference(cover.buffer(1)) if cover is not None else LineString(path), weight=9)
    if planes or thin:
        sloping = {p['code'] for p in planes}
        for code, lines in top_view([*planes, *thin], keep='planes').items():
            d.lines('A-ROOF', lines, **({} if code in sloping else dict(weight=9)))
    for part in planes:  # one arrow down each roof face
        for face, (dx, dy) in roof_faces(part):
            at = face.representative_point().coords[0]
            d.arrow('A-ANNO-SYMB', [(at[0] - dx * 300, at[1] - dy * 300), (at[0] + dx * 300, at[1] + dy * 300)], dot=0, weight=9)

    if spec.get('edges'):
        for lines in top_view(pick(spec['edges'])).values():
            for path in lines:
                line = LineString(path)
                d.lines('A-ROOF', cut_around(paths(line.difference(walls.buffer(1)) if walls is not None else line), clear), weight=13)
    if walls is not None:
        d.fill('A-WALL-PATT', walls)
        d.lines('A-WALL', walls.boundary)
    for part in pick(spec.get('fixtures', [])):
        d.lines('A-FLOR-FIXT', silhouette([part]).boundary)
    for at, name in names:
        d.text('A-AREA-IDEN', at, name, 220)

    if not d.items:
        raise SystemExit(f"project.json: cover \"{spec['code']}\" draws nothing; give it planes, edges, walls or fixtures")
    left, bottom, right, top = extents(project, [round(v, -1) for v in d.bounds()])
    clear += d.chain('A-ANNO-DIMS', gx.values(), top + 1000, outward=1)
    draw_grid(d, gx, gy, (left - 1100, bottom - 300, right + 300, top + 1000 + ROW + 300), full=False, clear=clear)
    draw_boundary(d, project)
    return d
