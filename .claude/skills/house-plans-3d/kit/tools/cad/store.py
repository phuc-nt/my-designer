"""The data store: every measured parameter of the building as one JSON document, as CSV tables and as SQLite.

building.json is the document programs read; the CSV tables open in a spreadsheet; house.sqlite answers questions in
SQL. All of them are generated: change the house in tools/house.mjs, then run tools/build-plans.mjs.
"""
import csv
import json
import sqlite3

from geometry import wall_changes
from sheet import clear_size, opening_name

PROVENANCE = {
    'documented': 'Printed on the original drawings and transcribed in source-dimensions.json.',
    'derived': 'Computed from documented figures only: a sum or a difference.',
    'estimated': 'Scaled from the original drawings or assumed in the model. To be measured on site before use.',
}
KINDS = {'room': 'Phòng ở', 'wet': 'Vệ sinh', 'circulation': 'Lối đi', 'service': 'Phụ trợ', 'outdoor': 'Ngoài trời'}


def english(station):
    """'axis-17' -> 'axis 17': a station as the description of the coordinates names it."""
    return station.replace('-', ' ', 1)


def toward(chain, origin):
    """The station a chain runs toward from its origin: its last axis, else its last station."""
    names = [n for n in chain['stations'] if n != origin]
    return next((n for n in reversed(names) if n.startswith('axis-')), names[-1] if names else origin)


def build(project, plans, marks, register, finishes):
    source, gx, gy, levels = project.source, project.gx, project.gy, project.levels

    grid = []
    for direction, named, sign, origin in (('across', gx, 1, source['origin']['x']), ('along', gy, -1, source['origin']['z'])):
        names = list(named)
        for i, name in enumerate(names):
            kind = 'axis' if name.startswith('axis-') else 'boundary' if name.startswith('boundary-') else 'line'
            # Only a station one printed segment away from the origin has its position printed; the others are sums.
            grid.append(dict(id=name, kind=kind, label=name[5:] if kind == 'axis' else None, direction=direction, position_mm=sign * named[name] + 0,
                             provenance='documented' if abs(i - names.index(origin)) <= 1 else 'derived'))

    level_rows, below = [], None
    for level in source['levels']:
        level_rows.append(dict(id=level['id'], label=level['label'], value_m=level['value_m'], rise_m=None if below is None else round(level['value_m'] - below, 3),
                               provenance='documented'))
        below = level['value_m']

    # The extent of the two documented chains: the plot where they end on its boundaries. Documented where the
    # documents print the overall, otherwise the sum of the printed segments.
    across, along, notes = project.chain('across'), project.chain('along'), project.config.get('plot', {})
    printed = lambda chain: 'documented' if chain.get('overall_mm') is not None else 'derived'
    width, depth = max(gx.values()) - min(gx.values()), max(gy.values()) - min(gy.values())
    plot = dict(width_mm=width, width_provenance=printed(across), width_note=notes.get('width_note', 'From the first to the last station of the across chain.'),
                depth_mm=depth, depth_provenance=printed(along), rectangle_area_m2=round(width * depth / 1e6, 2), rectangle_area_provenance='derived',
                rectangle_area_note=notes.get('area_note', 'Width times depth between the outermost documented stations. Not checked against the land title.'))

    floors, stairs = [], []
    for code, spec in project.floors.items():
        fp, original, above = plans[code], spec.get('variant_of'), project.above(code)
        rooms = []
        for r in fp.rooms:
            size, square = clear_size(r)
            rooms.append(dict(code=r['code'], name=r['name'], kind=r['kind'], kind_name=KINDS[r['kind']], finish=r['finish'], finish_name=finishes.get(r['finish']),
                              area_m2=round(r['area'], 2), perimeter_m=round(r['perimeter'], 2),
                              clear_width_mm=size[0] if size else None, clear_depth_mm=size[1] if size else None, rectangular=bool(square),
                              label_x_mm=round(r['seed'][0]), label_z_mm=round(-r['seed'][1]), provenance='estimated'))
        openings = []
        for number, o in enumerate(fp.openings, 1):
            openings.append(dict(number=number, mark=marks.mark(o, None), type=o['type'], width_mm=round(o['width'] / 10) * 10,
                                 height_mm=round((o['head'] - o['sill']) * 100) * 10, sill_mm=round(o['sill'] * 100) * 10, head_mm=round(o['head'] * 100) * 10,
                                 wall_thickness_mm=round(o['thickness']), x_mm=round(o['mid'][0]), z_mm=round(-o['mid'][1]), between=list(o['rooms']), provenance='estimated'))
        # Up to the next documented level; where the documents give none above this floor, the wall height of the model.
        storey = round(levels[above]['value_m'] - fp.level, 3) if above else fp.height
        floor = dict(code=code, name=fp.name, variant_of=original, level_m=fp.level, level_label=project.level_label(project.level_of(code)),
                     storey_height_m=storey, storey_height_provenance='derived' if above else 'estimated', wall_height_m=fp.height, wall_height_provenance='estimated',
                     slab_area_m2=round(fp.slab.area / 1e6, 2), stair_void_area_m2=round(sum(h.area for h in fp.holes) / 1e6, 2),
                     indoor_area_m2=round(sum(r['area'] for r in fp.rooms if r['kind'] != 'outdoor'), 2),
                     outdoor_area_m2=round(sum((r['area'] for r in fp.rooms if r['kind'] == 'outdoor'), 0.0), 2),
                     cut_wall_area_m2=round(fp.walls.area / 1e6, 2), light_partition_area_m2=round(fp.light.area / 1e6, 3), area_provenance='estimated',
                     rooms=rooms, openings=openings)
        if original:
            new, removed = wall_changes(fp, plans[original])
            floor.update(new_wall_area_m2=round(new.area / 1e6, 3), removed_wall_area_m2=round(removed.area / 1e6, 3))
        floors.append(floor)
        if fp.steps and not original:
            riser = fp.steps[0]['riser']
            stairs.append(dict(from_floor=code, to_level=above, rise_m=storey, risers=round(storey / riser), treads=len(fp.steps), riser_mm=round(riser * 1000, 1),
                               provenance='estimated', note='The rise is documented (difference of two levels); the number of risers is assumed.' if above
                               else 'The rise is the wall height of the model; the number of risers is assumed.'))

    types = [dict(mark=k['mark'], type=k['type'], name=opening_name(k), width_mm=k['width'], height_mm=k['height'], sill_mm=k['sill'], count_by_floor=dict(k['floors']),
                  provenance='estimated') for k in marks.types.values()]
    return dict(
        about='Generated by tools/build-plans.mjs from tools/house.mjs and store/source-dimensions.json. Do not edit: change the model and build again.',
        unit=source['unit'], units=dict(length='mm', area='m2', level='m'),
        coordinates=f"x from {english(source['origin']['x'])} toward {english(toward(across, source['origin']['x']))}, "
                    f"z from {english(source['origin']['z'])} (rear) toward {english(toward(along, source['origin']['z']))} (front), in millimetres.",
        provenance=PROVENANCE, grid=grid, levels=level_rows, plot=plot, floors=floors, opening_types=types, stairs=stairs, sheets=register)


# ---- output ---------------------------------------------------------------------------------------------------------

def tables(building, project):
    """The store as flat tables: {file name: (Vietnamese header, rows)}."""
    floors = building['floors']
    codes = [f['code'] for f in floors]
    names = {f['code']: f['name'] for f in floors}
    room_names = {(f['code'], r['code']): r['name'] for f in floors for r in f['rooms']}
    side = lambda floor, code: room_names.get((floor, code), 'Ngoài nhà hoặc ô thang')
    grid_kinds = {'axis': 'Trục', 'line': 'Đường phụ cạnh trục', 'boundary': 'Ranh lô đất'}
    boundaries = {'side': 'Ranh đất bên hông', 'rear': 'Ranh đất phía sau', 'front': 'Ranh đất phía trước', 'left': 'Ranh đất bên trái', 'right': 'Ranh đất bên phải'}
    sources = {'documented': 'Số đo ghi trên bản vẽ gốc', 'derived': 'Cộng dồn các số đo gốc'}
    positions = {g['id']: g['position_mm'] for g in building['grid']}

    def grid_name(station):
        """'axis-17' -> 'Trục 17'; a line beside an axis ('line-18-outer') is named by its distance from that axis."""
        kind, _, rest = station.partition('-')
        if kind == 'axis':
            return f'Trục {rest}'
        if kind == 'boundary':
            return boundaries.get(rest, f'Ranh đất {rest}')
        axis = f"axis-{rest.split('-')[0]}"
        return f"Đường cách trục {rest.split('-')[0]} {abs(positions[station] - positions[axis]):g} mm" if axis in positions else f'Đường phụ {rest}'

    origin = lambda axis: grid_name(project.source['origin'][axis])
    lower = lambda name: name[0].lower() + name[1:]
    directions = {'across': f"Ngang nhà (từ {lower(origin('x'))})", 'along': f"Dọc nhà (từ {lower(origin('z'))} ra trước)"}
    return {
        'floors.csv': (['Tầng', 'Mã', 'Cao độ sàn (m)', 'Chiều cao tầng (m)', 'Diện tích sàn (m²)', 'Trong nhà thông thủy (m²)', 'Ngoài trời (m²)', 'Tường bị cắt (m²)', 'Ô thang (m²)'],
                       [[f['name'], f['code'], f['level_m'], f['storey_height_m'], f['slab_area_m2'], f['indoor_area_m2'], f['outdoor_area_m2'], f['cut_wall_area_m2'], f['stair_void_area_m2']] for f in floors]),
        'rooms.csv': (['Tầng', 'Phòng', 'Loại', 'Diện tích (m²)', 'Chu vi (m)', 'Rộng thông thủy (mm)', 'Sâu thông thủy (mm)', 'Hình chữ nhật', 'Sàn', 'Mã tầng', 'Mã phòng'],
                      [[f['name'], r['name'], r['kind_name'], r['area_m2'], r['perimeter_m'], r['clear_width_mm'], r['clear_depth_mm'], 'có' if r['rectangular'] else 'không', r['finish_name'], f['code'], r['code']]
                       for f in floors for r in f['rooms']]),
        'openings.csv': (['Tầng', 'Ký hiệu', 'Loại', 'Rộng (mm)', 'Cao (mm)', 'Bệ (mm)', 'Dày tường (mm)', 'Phía thứ nhất', 'Phía thứ hai', 'Mã tầng'],
                         [[f['name'], o['mark'], next(t['name'] for t in building['opening_types'] if t['mark'] == o['mark']), o['width_mm'], o['height_mm'], o['sill_mm'], o['wall_thickness_mm'],
                           side(f['code'], o['between'][0]), side(f['code'], o['between'][1]), f['code']] for f in floors for o in f['openings']]),
        'opening-types.csv': (['Ký hiệu', 'Loại', 'Rộng (mm)', 'Cao (mm)', 'Bệ (mm)', *[names[c] for c in codes]],
                              [[t['mark'], t['name'], t['width_mm'], t['height_mm'], t['sill_mm'], *[t['count_by_floor'].get(c, 0) for c in codes]] for t in building['opening_types']]),
        'levels.csv': (['Vị trí', 'Ghi trên bản vẽ gốc', 'Cao độ (m)', 'Cao hơn mức dưới (m)'],
                       [[project.place(l['id']), l['label'], l['value_m'], '' if l['rise_m'] is None else l['rise_m']] for l in building['levels']]),
        'grid.csv': (['Tên', 'Loại', 'Hướng', 'Vị trí (mm)', 'Nguồn'],
                     [[grid_name(g['id']), grid_kinds[g['kind']], directions[g['direction']], g['position_mm'], sources[g['provenance']]] for g in building['grid']]),
    }


SCHEMA = """
CREATE TABLE levels (id TEXT PRIMARY KEY, label TEXT, value_m REAL, rise_m REAL, provenance TEXT);
CREATE TABLE grid (id TEXT PRIMARY KEY, kind TEXT, label TEXT, direction TEXT, position_mm REAL, provenance TEXT);
CREATE TABLE source_segments (chain TEXT, position INTEGER, from_station TEXT, to_station TEXT, length_mm REAL, PRIMARY KEY (chain, position));
CREATE TABLE floors (code TEXT PRIMARY KEY, name TEXT, variant_of TEXT, level_m REAL, storey_height_m REAL, wall_height_m REAL, slab_area_m2 REAL, stair_void_area_m2 REAL,
                     indoor_area_m2 REAL, outdoor_area_m2 REAL, cut_wall_area_m2 REAL, light_partition_area_m2 REAL, new_wall_area_m2 REAL, removed_wall_area_m2 REAL);
CREATE TABLE rooms (floor TEXT REFERENCES floors(code), code TEXT, name TEXT, kind TEXT, kind_name TEXT, finish TEXT, finish_name TEXT, area_m2 REAL, perimeter_m REAL,
                    clear_width_mm REAL, clear_depth_mm REAL, rectangular INTEGER, PRIMARY KEY (floor, code));
CREATE TABLE opening_types (mark TEXT PRIMARY KEY, type TEXT, name TEXT, width_mm REAL, height_mm REAL, sill_mm REAL);
CREATE TABLE openings (floor TEXT REFERENCES floors(code), number INTEGER, mark TEXT REFERENCES opening_types(mark), type TEXT, width_mm REAL, height_mm REAL, sill_mm REAL,
                       wall_thickness_mm REAL, x_mm REAL, z_mm REAL, room_a TEXT, room_b TEXT, PRIMARY KEY (floor, number));
CREATE TABLE stairs (from_floor TEXT PRIMARY KEY, to_level TEXT, rise_m REAL, risers INTEGER, treads INTEGER, riser_mm REAL);
CREATE TABLE sheets (number TEXT PRIMARY KEY, title TEXT, floor TEXT, scale TEXT, paper TEXT, issued TEXT);
"""


def write(folder, building, project):
    source = project.source
    (folder / 'building.json').write_text(json.dumps(building, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (folder / 'tables').mkdir(exist_ok=True)
    for name, (header, rows) in tables(building, project).items():
        with open(folder / 'tables' / name, 'w', newline='', encoding='utf-8-sig') as handle:  # the BOM makes Excel read UTF-8
            writer = csv.writer(handle)
            writer.writerow(header)
            writer.writerows(rows)

    path = folder / 'house.sqlite'
    path.unlink(missing_ok=True)
    db = sqlite3.connect(path)
    db.executescript(SCHEMA)
    insert = lambda table, columns, rows: db.executemany(f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({', '.join('?' * len(columns))})", rows)
    pick = lambda record, columns: [record.get(c) for c in columns]
    for table, key in (('levels', 'levels'), ('grid', 'grid'), ('stairs', 'stairs'), ('sheets', 'sheets'), ('opening_types', 'opening_types'), ('floors', 'floors')):
        columns = [row[1] for row in db.execute(f'PRAGMA table_info({table})')]
        insert(table, columns, [pick(record, columns) for record in building[key]])
    for chain in source['chains']:
        rows = [(chain['id'], i, a, b, length) for i, (a, b, length) in enumerate(zip(chain['stations'], chain['stations'][1:], chain['segments_mm']), 1)]
        insert('source_segments', ['chain', 'position', 'from_station', 'to_station', 'length_mm'], rows)
    for floor in building['floors']:
        columns = ['code', 'name', 'kind', 'kind_name', 'finish', 'finish_name', 'area_m2', 'perimeter_m', 'clear_width_mm', 'clear_depth_mm', 'rectangular']
        insert('rooms', ['floor', *columns], [[floor['code'], *pick(r, columns)] for r in floor['rooms']])
        columns = ['number', 'mark', 'type', 'width_mm', 'height_mm', 'sill_mm', 'wall_thickness_mm', 'x_mm', 'z_mm']
        insert('openings', ['floor', *columns, 'room_a', 'room_b'], [[floor['code'], *pick(o, columns), *o['between']] for o in floor['openings']])
    db.commit()
    db.close()
