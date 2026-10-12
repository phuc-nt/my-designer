"""A sheet at 1:100: frame, plans, schedules, legend, notes and title block.

Positions and sizes in this file are paper millimetres; the Sheet class converts them to drawing units.
"""
from shapely.geometry import box

from drawing import SCALE, Drawing, text_width, vn

PAPERS = {'A3': (420, 297), 'A2': (594, 420), 'A1': (841, 594)}  # landscape
TEXT, HEAD, PITCH, ROW = 2.0, 2.5, 3.6, 5.0

OPENING_NAMES = {'door': 'Cửa đi cánh mở', 'window': 'Cửa sổ', 'opening': 'Ô trống không cánh'}
STATUS = 'BẢN DỰNG LẠI ĐỂ THAM KHẢO, KHÔNG DÙNG ĐỂ THI CÔNG'


def opening_name(kind):
    if kind['type'] == 'glassDoor':
        return 'Cửa kính lùa' if kind['width'] >= 1500 else 'Cửa kính mở'
    return OPENING_NAMES[kind['type']]


def wrap(string, height, width):
    """Breaks a text into lines no wider than `width` at text height `height`."""
    lines, line = [], ''
    for word in string.split():
        trial = f'{line} {word}'.strip()
        if line and text_width(trial, height) > width:
            lines.append(line)
            line = word
        else:
            line = trial
    return lines + [line]


class Sheet:
    def __init__(self, number, title, project):
        """project: the project file as a dict; it gives the paper size and the texts of the title block."""
        self.d, self.number, self.title = Drawing(), number, title
        self.paper = project.get('paper', 'A3')
        if self.paper not in PAPERS:
            raise SystemExit(f'project.json: paper "{self.paper}" is not one of {", ".join(PAPERS)}')
        self.width, self.height = PAPERS[self.paper]
        self.frame = (20, 10, self.width - 10, self.height - 10)  # left, bottom, right, top: the wider margin is the binding side
        self.title_block = (self.width - 148, 10, self.width - 10, 52)
        self.column = (self.width - 144, self.width - 14)          # schedules, above the title block
        self.plans = (self.frame[0] + 4, self.column[0] - 8)       # left and right limit of the plans
        self.plan_top = self.height - 14
        l, b, r, t = self.frame
        self.rect('A-ANNO-TTLB', 0, 0, self.width, self.height, weight=5)  # trimmed edge of the paper
        self.rect('A-ANNO-TTLB', l, b, r, t)
        self._title_block(project)

    # ---- primitives --------------------------------------------------------------------------------------------
    def line(self, layer, points, **style):
        self.d.line(layer, [(x * SCALE, y * SCALE) for x, y in points], **style)

    def rect(self, layer, x0, y0, x1, y1, **style):
        self.d.line(layer, [(x0 * SCALE, y0 * SCALE), (x1 * SCALE, y0 * SCALE), (x1 * SCALE, y1 * SCALE), (x0 * SCALE, y1 * SCALE)], closed=True, **style)

    def text(self, layer, at, string, height=TEXT, align='ml', width=None):
        """A text; narrowed to `width` by a smaller height when it is a little too long, an error when far too long."""
        if width is not None:
            natural = text_width(string, height * SCALE) / SCALE
            if natural > width:
                if natural > width / .7:
                    raise ValueError(f'Text does not fit {width:.0f} mm on sheet {self.number}: {string}')
                height *= width / natural
        self.d.text(layer, (at[0] * SCALE, at[1] * SCALE), string, height * SCALE, align=align)

    def place(self, drawing, left, dy=None):
        """Puts a plan on the sheet, its top at the top of the plan area unless `dy` moves it with another plan.
        Returns (dx, dy) in drawing units and its paper box (left, bottom, right, top)."""
        x0, y0, x1, y1 = drawing.bounds()
        dx = left * SCALE - x0
        dy = self.plan_top * SCALE - y1 if dy is None else dy
        self.d.place(drawing, dx, dy)
        return (dx, dy), ((x0 + dx) / SCALE, (y0 + dy) / SCALE, (x1 + dx) / SCALE, (y1 + dy) / SCALE)

    # ---- blocks ------------------------------------------------------------------------------------------------
    def plan_title(self, x, y, title, scale='TỶ LỆ 1:100'):
        w = text_width(title, 3.5 * SCALE) / SCALE
        self.text('A-ANNO-TEXT', (x, y), title, 3.5, 'mc')
        self.line('A-ANNO-TEXT', [(x - w / 2 - 2, y - 3.3), (x + w / 2 + 2, y - 3.3)], weight=35)
        self.text('A-ANNO-TEXT', (x, y - 6.8), scale, HEAD, 'mc')
        return y - 6.8 - HEAD / 2

    def table(self, top, title, widths, header, rows, aligns, foot=None):
        """A schedule in the column above the title block. Returns the y of its lower edge."""
        layer, y, x = 'A-ANNO-SCHD', top - 6, self.column[0]
        self.text('A-ANNO-TEXT', (x, top - 2.5), title, HEAD)
        grid_top, right = y, x + sum(widths)
        for cells, h, centred in [(header, 6, True)] + [(r, ROW, False) for r in rows]:
            cx = x
            for cell, w, align in zip(cells, widths, aligns):
                align = 'c' if centred else align
                at = {'l': cx + 1.5, 'c': cx + w / 2, 'r': cx + w - 1.5}[align]
                self.text(layer, (at, y - h / 2), cell, TEXT, 'm' + align, width=w - 3)
                cx += w
            y -= h
            self.line(layer, [(x, y), (right, y)], **(dict(weight=25) if centred else {}))
        cx = x
        for w in widths[:-1]:
            cx += w
            self.line(layer, [(cx, grid_top), (cx, y)])
        self.rect(layer, x, y, right, grid_top, weight=25)
        if foot:
            for line in wrap(foot, 1.8 * SCALE, (right - x) * SCALE):
                y -= 3.2
                self.text('A-ANNO-TEXT', (x, y), line, 1.8)
            y -= 1
        return y

    def notes(self, x, top, width, title, items, floor=None):
        """Numbered notes with a hanging indent, not lower than `floor`. Returns the y below the last line."""
        floor = self.frame[1] + 2 if floor is None else floor
        self.text('A-ANNO-TEXT', (x, top - 1.5), title, HEAD)
        y = top - 7
        for i, item in enumerate(items, 1):
            for k, line in enumerate(wrap(item, TEXT * SCALE, (width - 5) * SCALE)):
                if y - TEXT / 2 < floor:
                    raise ValueError(f'The notes of sheet {self.number} do not fit their block')
                if k == 0:
                    self.text('A-ANNO-TEXT', (x, y), f'{i}.', TEXT)
                self.text('A-ANNO-TEXT', (x + 5, y), line, TEXT)
                y -= PITCH
            y -= .6
        return y

    def legend(self, x, top, entries, level, figure, columns=2, column_width=66):
        """entries: (sample, text) with sample one of the kinds drawn below. level: the label shown beside the level
        mark; figure: a documented figure of this house, the sample of a documented dimension."""
        self.text('A-ANNO-TEXT', (x, top - 1.5), 'KÝ HIỆU', HEAD)
        per = -(-len(entries) // columns)
        for i, (sample, string) in enumerate(entries):
            cx, cy = x + (i // per) * column_width, top - 8 - (i % per) * ROW
            a, b, c = cx * SCALE, (cx + 12) * SCALE, cy * SCALE
            if sample in ('wall', 'new'):
                shape = box(a, c - 130, b, c + 130)
                self.d.fill('A-WALL-PATT' if sample == 'wall' else 'A-WALL-NEW', shape)
                self.d.lines('A-WALL', shape.boundary)
            elif sample == 'documented':
                self.d.text('A-ANNO-DIMS', ((a + b) / 2, c), figure, TEXT * SCALE)
            elif sample == 'estimated':
                self.d.text('A-ANNO-DIMS-ESTM', ((a + b) / 2, c), '(3340)', TEXT * SCALE)
            elif sample == 'hidden':
                self.d.line('A-FLOR-STRS', [(a, c), (b, c)], linetype='PLAN-HIDDEN', weight=9)
            elif sample == 'boundary':
                self.d.line('L-SITE-BNDY', [(a, c), (b + 400, c)])
            elif sample == 'axis':
                self.d.line('S-GRID', [(a, c), (b - 300, c)])
                self.d.circle('S-GRID-IDEN', (b - 150, c), 150)
            elif sample == 'demolished':
                self.d.line('A-WALL-DEMO', [(a, c - 100), (b, c - 100), (b, c + 100), (a, c + 100)], closed=True)
            elif sample == 'marks':
                self.d.text('A-DOOR-IDEN', (a + 300, c), 'D1', 150)
                self.d.text('A-GLAZ-IDEN', (a + 900, c), 'S1', 150)
            elif sample == 'level':
                self.d.level_mark((a + 110, c - 170), level)
            elif sample == 'slope':
                self.d.arrow('A-ANNO-SYMB', [(a + 100, c), (b - 300, c)], dot=0, weight=9)
            self.text('A-ANNO-TEXT', (cx + 23, cy), string, TEXT, width=column_width - 25)
        return top - 8 - per * ROW

    def _title_block(self, project):
        layer = 'A-ANNO-TTLB'
        l, b, r, t = self.title_block
        self.rect(layer, l, b, r, t)
        rows = [t - 8, t - 19, t - 28, t - 35]
        for y in rows:
            self.line(layer, [(l, y), (r, y)], weight=18)
        label = lambda x, y, string: self.text('A-ANNO-TEXT', (x + 1.5, y - 2), string, 1.5)
        label(l, t, 'CÔNG TRÌNH')
        self.text('A-ANNO-TEXT', (l + 24, t - 4), project['title_block'], 2.8, width=r - l - 26)
        label(l, rows[0], 'TÊN BẢN VẼ')
        self.text('A-ANNO-TEXT', ((l + r) / 2, rows[0] - 6.5), self.title, 3.5, 'mc', width=r - l - 6)
        cells = (('TỶ LỆ', '1:100', 26), ('KHỔ GIẤY', self.paper, 24), ('NGÀY', project['issued'], 40), ('SỐ BẢN VẼ', self.number, r - l - 90))
        x = l
        for i, (name, value, w) in enumerate(cells):
            label(x, rows[1], name)
            self.text('A-ANNO-TEXT', (x + w / 2, rows[1] - 5.6), value, 3.5 if i == 3 else 2.8, 'mc', width=w - 3)
            x += w
            if i < 3:
                self.line(layer, [(x, rows[1]), (x, rows[2])], weight=18)
        label(l, rows[2], 'NGUỒN')
        self.text('A-ANNO-TEXT', (l + 14, rows[2] - 3.5), project['source_line'], TEXT, width=r - l - 16)
        self.text('A-ANNO-TEXT', ((l + r) / 2, (rows[3] + b) / 2), project.get('status', STATUS), 2.5, 'mc', width=r - l - 6)


# ---- schedules ------------------------------------------------------------------------------------------------------

def clear_size(room):
    """Clear width x depth of a room through its name point, rounded to 10 mm, and whether the room is a rectangle."""
    if not room['across'] or not room['along']:
        return None, False
    w, h = room['across'][1] - room['across'][0], room['along'][1] - room['along'][0]
    return (round(w / 10) * 10, round(h / 10) * 10), abs(w * h / 1e6 - room['area']) <= .03 * room['area']


def room_rows(fp, finishes):
    rows, odd = [], False
    for r in fp.rooms:
        size, square = clear_size(r)
        odd = odd or (size is not None and not square)
        rows.append([r['name'], f"{size[0]} × {size[1]}{'' if square else ' *'}" if size else '-', vn(r['area'], 2), finishes.get(r['finish'], '-')])
    return rows, odd


def opening_rows(marks, code):
    order = {'door': 0, 'glassDoor': 1, 'window': 2, 'opening': 3}
    kinds = sorted((k for k in marks.types.values() if k['floors'].get(code)), key=lambda k: (order[k['type']], int(k['mark'].lstrip('DKSO'))))
    return [[k['mark'], opening_name(k), f"{k['width']} × {k['height']}", str(k['sill']), str(k['floors'][code])] for k in kinds]
