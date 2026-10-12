"""A drawing as a flat list of primitives on named layers, in millimetres, independent of the output format.

dxf_out.py turns it into DXF entities (real DIMENSION entities, hatches, layers), svg_out.py into the web plan.
Sizes are real-world millimetres for a sheet plotted at 1:100: a text 250 high prints 2.5 mm high.
"""
import math

from ezdxf.fonts import fonts
from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union

from geometry import paths, polygons

SCALE = 100  # drawing units per paper millimetre

# name: (ACI colour, true colour or None, linetype, lineweight in 1/100 mm, plotted, Vietnamese description)
LAYERS = {
    'S-GRID':            (1, (192, 57, 43), 'PLAN-AXIS', 9, True, 'Trục định vị'),
    'S-GRID-IDEN':       (1, (192, 57, 43), 'Continuous', 13, True, 'Ký hiệu trục'),
    'L-SITE-BNDY':       (6, (142, 68, 173), 'PLAN-PHANTOM', 18, True, 'Ranh lô đất'),
    'L-SITE':            (8, (120, 120, 120), 'Continuous', 13, True, 'Sân, bậc thềm, hàng rào'),
    'L-SITE-VEHC':       (8, (150, 150, 150), 'PLAN-HIDDEN', 9, True, 'Vị trí đỗ xe'),
    'L-PLNT':            (3, (60, 140, 74), 'Continuous', 9, True, 'Cây, bồn cây'),
    'A-FLOR-OTLN':       (7, None, 'Continuous', 18, True, 'Mép sàn, mép ô trống'),
    'A-WALL':            (7, None, 'Continuous', 35, True, 'Tường bị cắt'),
    'A-WALL-PATT':       (253, (178, 178, 178), 'Continuous', 0, True, 'Tô tường bị cắt'),
    'A-WALL-NEW':        (30, (214, 120, 60), 'Continuous', 0, True, 'Vách nhẹ xây mới (phương án chia lại)'),
    'A-WALL-DEMO':       (1, (176, 48, 48), 'PLAN-HIDDEN', 18, True, 'Tường tháo dỡ (phương án chia lại)'),
    'A-WALL-SILL':       (7, None, 'Continuous', 13, True, 'Bệ cửa sổ, gờ, lan can xây dưới mặt cắt'),
    'A-DOOR':            (32, (122, 85, 58), 'Continuous', 13, True, 'Cửa đi'),
    'A-DOOR-IDEN':       (32, (122, 85, 58), 'Continuous', 13, True, 'Ký hiệu cửa đi'),
    'A-GLAZ':            (150, (38, 110, 160), 'Continuous', 13, True, 'Cửa sổ, cửa kính, vách kính'),
    'A-GLAZ-IDEN':       (150, (38, 110, 160), 'Continuous', 13, True, 'Ký hiệu cửa sổ'),
    'A-FLOR-STRS':       (7, None, 'Continuous', 13, True, 'Cầu thang'),
    'A-FLOR-HRAL':       (150, (38, 110, 160), 'Continuous', 13, True, 'Lan can'),
    'A-FLOR-FIXT':       (8, (95, 95, 95), 'Continuous', 9, True, 'Thiết bị vệ sinh'),
    'A-FURN':            (9, (150, 150, 150), 'Continuous', 9, True, 'Nội thất'),
    'A-ROOF':            (7, None, 'Continuous', 18, True, 'Mái'),
    'A-AREA':            (2, (200, 170, 40), 'Continuous', 0, False, 'Ranh phòng để đo diện tích (không in)'),
    'A-AREA-IDEN':       (7, None, 'Continuous', 13, True, 'Tên phòng, diện tích'),
    'A-ANNO-DIMS':       (7, None, 'Continuous', 13, True, 'Kích thước theo tài liệu gốc'),
    'A-ANNO-DIMS-ESTM':  (5, (31, 95, 191), 'Continuous', 13, True, 'Kích thước ước lượng (trong ngoặc)'),
    'A-ANNO-SYMB':       (7, None, 'Continuous', 13, True, 'Cao độ, mũi tên thang'),
    'A-ANNO-TEXT':       (7, None, 'Continuous', 13, True, 'Tên hình vẽ, ghi chú'),
    'A-ANNO-SCHD':       (7, None, 'Continuous', 9, True, 'Bảng thống kê'),
    'A-ANNO-TTLB':       (7, None, 'Continuous', 50, True, 'Khung bản vẽ, khung tên'),
    'A-ANNO-NPLT':       (8, None, 'Continuous', 0, False, 'Khung nhìn (không in)'),
}
# Dash patterns in drawing millimetres: positive = dash, negative = gap.
LINETYPES = {
    'PLAN-AXIS': (1200, -200, 100, -200),
    'PLAN-HIDDEN': (200, -100),
    'PLAN-PHANTOM': (1000, -200, 100, -200, 100, -200),
}

TEXT_DIM, TEXT_NOTE, TEXT_ROOM, TEXT_TITLE = 200, 220, 280, 400
FONT = 'arial.ttf'
CAP = .716  # cap height of Arial as a share of its font size: DXF text heights are cap heights, SVG font sizes are not
_font = fonts.make_font(FONT, 1.0)


def text_width(string, height):
    """Width of a text in the sheet font, measured the way the DXF renderer draws it."""
    return _font.text_width(string) * height


def vn(value, digits=1):
    """A number the Vietnamese way: decimal comma."""
    return f'{value:.{digits}f}'.replace('.', ',')


class Drawing:
    def __init__(self):
        self.items = []

    def line(self, layer, points, closed=False, **style):
        points = [(float(x), float(y)) for x, y in points]
        if len(points) > 1:
            self.items.append(dict(kind='line', layer=layer, points=points, closed=closed, **style))

    def lines(self, layer, geom, **style):
        for path in (geom if isinstance(geom, list) else paths(geom)):
            self.line(layer, path, **style)

    def arc(self, layer, centre, radius, start, end, **style):
        self.items.append(dict(kind='arc', layer=layer, centre=centre, radius=radius, start=start, end=end, **style))

    def circle(self, layer, centre, radius, **style):
        self.items.append(dict(kind='circle', layer=layer, centre=centre, radius=radius, **style))

    def fill(self, layer, geom, pattern='SOLID', **style):
        for p in polygons(geom):
            if p.area > 1:
                self.items.append(dict(kind='fill', layer=layer, outer=list(p.exterior.coords), holes=[list(r.coords) for r in p.interiors], pattern=pattern, **style))

    def text(self, layer, at, string, height, align='mc', rotation=0, **style):
        self.items.append(dict(kind='text', layer=layer, at=(float(at[0]), float(at[1])), text=str(string), height=height, align=align, rotation=rotation, **style))

    def dim(self, layer, p1, p2, base, vertical=False, estimated=False, location=None):
        self.items.append(dict(kind='dim', layer=layer, p1=p1, p2=p2, base=base, vertical=vertical, estimated=estimated, location=location))

    def room(self, room, floor):
        self.items.append(dict(kind='room', layer='A-AREA', outer=list(room['shape'].exterior.coords), holes=[list(r.coords) for r in room['shape'].interiors],
                               code=room['code'], floor=floor))

    def place(self, other, dx=0.0, dy=0.0):
        """Copies another drawing into this one, moved by (dx, dy)."""
        move = lambda p: (p[0] + dx, p[1] + dy)
        for item in other.items:
            item = dict(item)
            for key in ('points', 'outer'):
                if key in item:
                    item[key] = [move(p) for p in item[key]]
            if 'holes' in item:
                item['holes'] = [[move(p) for p in hole] for hole in item['holes']]
            for key in ('centre', 'at', 'p1', 'p2', 'base', 'location'):
                if item.get(key) is not None:
                    item[key] = move(item[key])
            self.items.append(item)

    def bounds(self):
        xs, ys = [], []
        for item in self.items:
            for key in ('points', 'outer'):
                for x, y in item.get(key, []):
                    xs.append(x), ys.append(y)
            for key in ('at', 'base', 'location'):
                if item.get(key) is not None:
                    xs.append(item[key][0]), ys.append(item[key][1])
            if item['kind'] in ('arc', 'circle'):
                (cx, cy), r = item['centre'], item['radius']
                xs += [cx - r, cx + r]
                ys += [cy - r, cy + r]
        return min(xs), min(ys), max(xs), max(ys)

    # ---- symbols -----------------------------------------------------------------------------------------------
    def arrow(self, layer, points, head=160, dot=45, **style):
        """A walking line: a dot where it starts, an arrowhead where it ends."""
        self.line(layer, points, **style)
        (x0, y0), (x1, y1) = points[-2], points[-1]
        a = math.atan2(y1 - y0, x1 - x0)
        tip = [(x1, y1)] + [(x1 - head * math.cos(a + s), y1 - head * math.sin(a + s)) for s in (.32, -.32)]
        self.fill(layer, Polygon(tip))
        if dot:
            self.fill(layer, Polygon([(points[0][0] + dot * math.cos(t * math.pi / 8), points[0][1] + dot * math.sin(t * math.pi / 8)) for t in range(16)]))

    def bubble(self, at, label, radius=400):
        self.circle('S-GRID-IDEN', at, radius)
        self.text('S-GRID-IDEN', at, label, 320)

    def level_mark(self, at, label, layer='A-ANNO-SYMB'):
        """Level in the notation of the original drawings (FFL:+4.100) beside a small datum triangle. Returns its box."""
        x, y = at
        self.line(layer, [(x - 110, y + 150), (x + 110, y + 150), (x, y), (x - 110, y + 150)])
        self.fill(layer, Polygon([(x, y), (x - 110, y + 150), (x, y + 150)]))
        self.line(layer, [(x + 110, y + 150), (x + 110 + text_width(label, 180) + 60, y + 150)])
        self.text(layer, (x + 150, y + 190), label, 180, align='bl')
        return box(x - 110, y, x + 210 + text_width(label, 180), y + 370)

    def chain(self, layer, stations, at, vertical=False, estimated=False, outward=1):
        """A dimension chain through `stations` (values along the chain), its line at `at` across it.

        A label that does not fit between its extension lines moves to the other side of the dimension line, clear of
        the extension lines; neighbours that both moved are set side by side. Returns the boxes of all labels.
        """
        stations = sorted(set(round(s, 3) for s in stations))
        natural = -1 if vertical else 1  # side of the line the text normally sits on: above, or left of a vertical line
        label = lambda size: f'({round(size / 10) * 10})' if estimated else str(round(size))
        segments = [(a, b, text_width(label(b - a), TEXT_DIM)) for a, b in zip(stations, stations[1:])]
        moved, run, last = {}, [], -math.inf

        def settle():
            nonlocal last
            total = sum(segments[i][2] for i in run) + 90 * (len(run) - 1)
            start = max((segments[run[0]][0] + segments[run[-1]][1]) / 2 - total / 2, last + 90)
            for i in run:
                moved[i] = start + segments[i][2] / 2
                start += segments[i][2] + 90
            last = start - 90
            run.clear()

        for i, (a, b, w) in enumerate(segments):
            if b - a < w + 60:
                run.append(i)
            elif run:
                settle()
        if run:
            settle()
        boxes = []
        for i, (a, b, w) in enumerate(segments):
            mid, location = (a + b) / 2, None
            along, across = moved.get(i, mid), at + natural * (TEXT_DIM / 2 + 60)
            if i in moved:
                across = at - natural * 300
                location = (across, along) if vertical else (along, across)
            near = at - outward * 150  # definition points close to the line: short extension lines
            p1, p2, base = ((near, a), (near, b), (at, mid)) if vertical else ((a, near), (b, near), (mid, at))
            self.dim(layer, p1, p2, base, vertical=vertical, estimated=estimated, location=location)
            half_along, half_across = w / 2 + 40, TEXT_DIM / 2 + 40
            boxes.append(box(across - half_across, along - half_along, across + half_across, along + half_along) if vertical
                         else box(along - half_along, across - half_across, along + half_along, across + half_across))
        return boxes


def cut_around(lines, boxes):
    """Removes the parts of line work that would run through text."""
    if not boxes or not lines:
        return lines
    blocked = unary_union(boxes)
    kept = []
    for path in lines:
        if len(path) > 1:
            kept += paths(LineString(path).difference(blocked))
    return kept


def text_box(at, string, height, pad=60):
    w = text_width(string, height)
    return box(at[0] - w / 2 - pad, at[1] - height / 2 - pad, at[0] + w / 2 + pad, at[1] + height / 2 + pad)
