# /// script
# requires-python = ">=3.11"
# dependencies = ["ezdxf>=1.4,<2", "shapely>=2.0", "pymupdf", "pillow"]
# ///
"""Drafts the 2D drawing set and the data store of the house from the exported model.

usage: draft.py <model.json> <project directory>      (run through tools/build-plans.mjs, which exports the model)

What belongs to the house comes from two hand-written files in the project directory: project.json (names, sheets,
which floors are plans) and store/source-dimensions.json (the figures printed on the original documents).

Documented dimensions are drawn from store/source-dimensions.json, never from the model; the model is then checked
against that file and the finished DXF files are read back, so a sheet cannot show a documented figure that differs
from the transcription.
"""
import json
import shutil
import sys
from pathlib import Path

import ezdxf
import pymupdf

import dxf_out
import store
import svg_out
from drawing import SCALE
from geometry import FloorPlan, silhouette
from plan import Marks, draw_cover, draw_floor
from project import Project
from sheet import PAPERS, Sheet, opening_rows, room_rows

ROOM_FOOT = 'Rộng × sâu là kích thước thông thủy đo qua điểm ghi tên phòng, làm tròn 10 mm. Kích thước và diện tích tính từ mô hình, là số ước lượng.'
LARGER = f'Choose a larger "paper" in project.json ({", ".join(PAPERS)}).'

# Notes of the sheets. project.json may give its own lists under "notes"; an item written as {name} stands for the
# sentence of that name, which this script writes from the figures of the house.
SENTENCES = {
    'units': 'Kích thước ghi bằng mm, cao độ ghi bằng m.',
    'estimated': 'Số màu xanh trong ngoặc là số ước lượng theo tỷ lệ hình trên bản vẽ gốc, làm tròn 10 mm. Phải đo thực tế trước khi dùng.',
    'slope': 'Mũi tên chỉ hướng nước chảy trên mái.',
}
FLOOR_NOTES = ['{units}', '{documented}', '{estimated}', '{cut}', '{illustration}']
COVER_NOTES = ['{units}', '{documented}', '{slope}']
VARIANT_NOTES = ['Màu cam là vách nhẹ xây mới. Nét đứt đỏ là tường, cửa tháo dỡ so với bản vẽ gốc.']
LEVELS_FOOT = 'Cột cuối là hiệu hai cao độ ghi trên bản vẽ gốc.'


def printed(chain, overall=True):
    """The figures of a documented chain as the notes quote them."""
    text = ', '.join(str(v) for v in chain['segments_mm'])
    return text + (f" và tổng {chain['overall_mm']}" if overall and chain.get('overall_mm') is not None else '')


def comma(value):
    return f'{value:.2f}'.rstrip('0').rstrip('.').replace('.', ',')


def notes(project, kind, default, **own):
    sentences, items = SENTENCES | own, []
    for item in project.notes(kind, default):
        if item.startswith('{') and item.endswith('}'):
            if item[1:-1] not in sentences:
                raise SystemExit(f'project.json: notes.{kind} asks for {item}; the sentences of that block are {", ".join("{" + k + "}" for k in sentences)}')
            item = sentences[item[1:-1]]
        items.append(item)
    return items


def floor_notes(project, fp):
    return notes(project, 'floor', FLOOR_NOTES,
                 documented=f"Số màu đen chép đúng bản vẽ gốc: {printed(project.chain('across'))} theo chiều ngang; {printed(project.chain('along'))} theo chiều sâu.",
                 cut=f'Mặt cắt ngang ở cao {comma(fp.cut)} m trên sàn hoàn thiện. Nét đứt là phần nằm trên mặt cắt.',
                 illustration='Cây, xe và nội thất vẽ để minh họa.' if project.floors[fp.code].get('site') else 'Nội thất vẽ để minh họa.')


def cover_notes(project):
    # Only the across chain is drawn on the plans seen from above.
    return notes(project, 'cover', COVER_NOTES, documented=f"Số màu đen chép đúng bản vẽ gốc: {printed(project.chain('across'), overall=False)} theo chiều ngang.")


def floor_legend(project, fp, variant):
    entries = [('wall', f'Tường bị cắt ở cao {comma(fp.cut)} m'), ('documented', 'Số đo ghi trên bản vẽ gốc'), ('estimated', 'Số đo ước lượng, cần đo lại'),
               ('hidden', 'Phần nằm trên mặt cắt')]
    if any(v is not None for v in project.boundary):
        entries.append(('boundary', 'Ranh lô đất'))
    entries += [('axis', 'Trục định vị'), ('marks', 'Ký hiệu cửa, xem bảng thống kê'), ('level', 'Cao độ sàn hoàn thiện (m)')]
    if variant:
        entries += [('new', 'Vách nhẹ xây mới'), ('demolished', 'Tường, cửa tháo dỡ')]
    return entries


def cover_legend(project, specs):
    entries = []
    walls = next((c for c in specs if c.get('walls')), None)
    if walls:
        entries.append(('wall', walls.get('wall_label', 'Tường')))
    entries.append(('documented', 'Số đo ghi trên bản vẽ gốc'))
    if any(v is not None for v in project.boundary):
        entries.append(('boundary', 'Ranh lô đất'))
    entries.append(('axis', 'Trục định vị'))
    if any(c.get('level') for c in specs):
        entries.append(('level', 'Cao độ sàn hoàn thiện (m)'))
    if any(c.get('planes') for c in specs):
        entries.append(('slope', 'Hướng nước chảy trên mái'))
    return entries


def fit(sheet, what, box, right):
    """Stops with advice when a plan reaches past its place on the sheet."""
    if box[2] > right + .01:
        raise SystemExit(f'Sheet {sheet.number}: {what} is {box[2] - box[0]:.0f} mm wide at 1:100, {box[2] - right:.0f} mm more than its place on {sheet.paper}. {LARGER}')


def floor_sheet(spec, fp, dims, layout, marks, project, finishes):
    s = Sheet(spec['number'], spec['title'], project.config)
    x0, x1 = s.plans
    second = x0 + round(.6 * (x1 - x0))  # the dimension plan carries the chains and is the wider of the two
    middle = (min(project.gx.values()) + max(project.gx.values())) / 2
    variant = bool(project.floors[fp.code].get('variant_of'))
    figure = str(project.chain('across')['segments_mm'][0])
    (dx, dy), box = s.place(dims, left=x0)
    fit(s, 'the dimension plan', box, second - 4)
    (ldx, _), lbox = s.place(layout, left=second, dy=dy)
    fit(s, 'the furniture plan', lbox, x1)
    y = s.plan_title((dx + middle) / SCALE, box[1] - 6, 'MẶT BẰNG KÍCH THƯỚC')
    if s.legend(x0, y - 5, floor_legend(project, fp, variant), project.level_label(project.level_of(fp.code)), figure) < s.frame[1] + 2:
        raise ValueError(f'The legend of sheet {s.number} does not fit below the plan')
    y = s.plan_title((ldx + middle) / SCALE, lbox[1] - 6, 'MẶT BẰNG BỐ TRÍ NỘI THẤT')
    s.notes(second - 12, y - 6, x1 - second + 12, 'GHI CHÚ', floor_notes(project, fp))

    rows, odd = room_rows(fp, finishes)
    foot = ROOM_FOOT + (' Dấu * là phòng không phải hình chữ nhật.' if odd else '')
    y = s.table(s.plan_top, 'BẢNG THỐNG KÊ PHÒNG', [42, 34, 24, 30], ['Phòng', 'Rộng × sâu (mm)', 'Diện tích (m²)', 'Sàn'], rows, 'lccl', foot=foot)
    y = s.table(y - 5, 'BẢNG THỐNG KÊ CỬA', [16, 42, 32, 18, 22], ['Ký hiệu', 'Loại', 'Rộng × cao (mm)', 'Bệ (mm)', 'Số lượng'], opening_rows(marks, fp.code), 'clccc',
                foot='Kích thước cửa là số ước lượng, cần đo lại.')
    if variant:
        s.notes(s.column[0], y - 5, s.column[1] - s.column[0], 'GHI CHÚ PHƯƠNG ÁN', project.notes('variant', VARIANT_NOTES), floor=s.title_block[3] + 2)
    if spec is next(k for k in project.sheets if k.get('floor')):  # the register goes on the first floor sheet
        y = s.table(y - 5, 'DANH MỤC BẢN VẼ', [22, 86, 22], ['Số', 'Tên bản vẽ', 'Tỷ lệ'], [[k['number'], k['title'], '1:100'] for k in project.sheets], 'clc')
    if y < s.title_block[3] + 2:
        raise ValueError(f"The schedules of sheet {spec['number']} run into the title block")
    return s


def cover_sheet(spec, drawings, project):
    """The plans seen from above, side by side, with the table of levels."""
    s = Sheet(spec['number'], spec['title'], project.config)
    x0, x1 = s.plans
    specs = [project.covers[code] for code in spec['covers']]
    step = (x1 - x0) / len(specs)
    middle = (min(project.gx.values()) + max(project.gx.values())) / 2
    placed, dy = [], None
    for i, cover in enumerate(specs):
        (dx, dy), box = s.place(drawings[cover['code']], left=x0 + 10 + i * step, dy=dy)
        fit(s, f"the plan of \"{cover['code']}\"", box, x0 + (i + 1) * step - 2 if i + 1 < len(specs) else x1)
        placed.append((dx, box))
    bottom = min(box[1] for _, box in placed)
    label = next((project.level_label(c['level']['id']) for c in specs if c.get('level')), '')
    for i, (cover, (dx, box)) in enumerate(zip(specs, placed)):
        y = s.plan_title((dx + middle) / SCALE, bottom - 6, cover.get('title', spec['title']))
        if i == 0 and s.legend(x0 + 6, y - 6, cover_legend(project, specs), label, str(project.chain('across')['segments_mm'][0])) < s.frame[1] + 2:
            raise ValueError(f'The legend of sheet {s.number} does not fit below the plan')
    left = placed[-1][1][0] + 2 if len(specs) > 1 else x0 + 144  # beside the legend where one plan stands alone
    s.notes(left, y - 6, x1 - left, 'GHI CHÚ', cover_notes(project))
    rows, below = [], None
    for level in project.source['levels']:
        step = '-' if below is None else f"{level['value_m'] - below:.3f}".replace('.', ',')
        rows.append([project.place(level['id']), level['label'], step])
        below = level['value_m']
    s.table(s.plan_top, 'BẢNG CAO ĐỘ', [50, 40, 40], ['Vị trí', 'Ghi trên bản vẽ gốc', 'Cao hơn mức dưới (m)'], rows, 'lcc', foot=project.notes('levels_foot', LEVELS_FOOT))
    return s


def check_model(project):
    """The model must stand on the documented figures before anything is drawn from it."""
    errors = []
    for level in project.source['levels']:
        if abs(project.model['levels'].get(level['id'], float('nan')) - level['value_m']) > 1e-9:
            errors.append(f"level {level['id']}: model {project.model['levels'].get(level['id'])}, documents {level['value_m']}")
    # The part "yard" of a site floor is the plot: its edges lie on the boundaries the documents give.
    for spec in project.floors.values():
        site = spec.get('site')
        yard = next((p for p in project.model_floor(site['floor'])['parts'] if p['code'] == 'yard'), None) if site else None
        if yard is None:
            continue
        x0, y0, x1, y1 = silhouette([yard]).bounds
        for name, got, want in zip(('left', 'front', 'right', 'rear'), (x0, y0, x1, y1), project.boundary):
            if want is not None and abs(got - want) > 1:
                errors.append(f'{name} boundary: model {got:.0f} mm, documents {want:.0f} mm')
    for chain in project.source['chains']:
        if chain.get('overall_mm') is not None and sum(chain['segments_mm']) != chain['overall_mm']:
            errors.append(f"chain {chain['id']}: segments add up to {sum(chain['segments_mm'])}, printed overall is {chain['overall_mm']}")
    if errors:
        raise SystemExit('The model disagrees with store/source-dimensions.json:\n  ' + '\n  '.join(errors))


def check_sheet(path, expected):
    """Reads a finished DXF back: it must pass the audit and its documented dimensions must measure what the documents print."""
    doc = ezdxf.readfile(path)
    auditor = doc.audit()
    if auditor.has_errors:
        raise SystemExit(f'{path.name}: DXF audit found {len(auditor.errors)} errors: {[e.message for e in auditor.errors[:5]]}')
    documented = sorted(round(d.get_measurement(), 3) for d in doc.modelspace().query('DIMENSION[layer=="A-ANNO-DIMS"]'))
    if documented != sorted(float(v) for v in expected):
        raise SystemExit(f'{path.name}: documented dimensions measure {documented}, the documents print {sorted(expected)}')
    estimated = len(doc.modelspace().query('DIMENSION[layer=="A-ANNO-DIMS-ESTM"]'))
    return len(documented), estimated


def main():
    model = json.loads(Path(sys.argv[1]).read_text())
    folder = Path(sys.argv[2])
    project = Project(folder, model)
    check_model(project)

    plans = {}
    def plan(code):
        if code not in plans:
            below = project.below(code)
            plans[code] = FloorPlan(project.model_floor(code), plan(below) if below else None)
        return plans[code]

    def draw(code, mode):
        original = project.floors[code].get('variant_of')
        return draw_floor(plan(code), project, marks, mode, original=plan(original) if original else None)

    # Opening marks are numbered in sheet order, so the dimension plans are drawn first, all of them.
    marks = Marks()
    codes = [s['floor'] for s in project.sheets if s.get('floor')]
    dims = {code: draw(code, 'dims') for code in codes}
    finishes = {p['code']: p['name'] for f in model['floors'] for p in f['parts'] if p['code'].startswith('floor-')}
    covers = {code: draw_cover(spec, project) for code, spec in project.covers.items()}

    # What the documented dimensions of a sheet must measure when the DXF is read back.
    across, along = project.chain('across'), project.chain('along')
    overall = lambda chain: [chain['overall_mm']] if chain.get('overall_mm') is not None else []
    cad, web = folder / 'cad', folder / 'web'
    cad.mkdir(exist_ok=True)
    (web / 'cad').mkdir(parents=True, exist_ok=True)
    register = []
    for spec in project.sheets:
        try:
            if spec.get('floor'):
                sheet = floor_sheet(spec, plan(spec['floor']), dims[spec['floor']], draw(spec['floor'], 'layout'), marks, project, finishes)
                expected = [*across['segments_mm'], *overall(across), *along['segments_mm'], *overall(along)]
            else:
                sheet = cover_sheet(spec, covers, project)
                expected = across['segments_mm'] * len(spec['covers'])
        except ValueError as error:
            raise SystemExit(f'{error}. {LARGER}')
        doc = dxf_out.new_document()
        dxf_out.add(doc.modelspace(), sheet.d)
        dxf_out.paper_layout(doc, sheet.paper, sheet.width, sheet.height)
        path = cad / f"{spec['number']}.dxf"
        doc.saveas(path)
        dxf_out.render(doc, sheet.width, sheet.height, pdf=path.with_suffix('.pdf'), png=path.with_suffix('.png'), dpi=150)
        documented, estimated = check_sheet(path, expected)
        register.append(dict(number=spec['number'], title=spec['title'], floor=spec.get('floor') or ', '.join(spec['covers']), scale='1:100', paper=sheet.paper,
                             issued=project.config['issued'], files=[f"cad/{path.stem}.{ext}" for ext in ('dxf', 'pdf', 'png')],
                             documented_dimensions=documented, estimated_dimensions=estimated))
        print(f"cad/{path.stem}: {documented} documented and {estimated} estimated dimensions, audit clean")

    book = pymupdf.open()
    for spec in project.sheets:
        with pymupdf.open(cad / f"{spec['number']}.pdf") as page:
            book.insert_pdf(page)
    book.save(cad / f"{project.config['slug']}-plans.pdf", garbage=3, deflate=True)
    book.close()
    for path in sorted(cad.iterdir()):
        if path.suffix in ('.dxf', '.pdf'):
            shutil.copyfile(path, web / 'cad' / path.name)

    # The web plans: everything drawn once, the viewer switches layers.
    drawings = {code: draw(code, 'web') for code in project.floors} | covers
    svg_out.write(web / 'cad', drawings)
    building = store.build(project, plans, marks, register, finishes)
    store.write(folder / 'store', building, project)
    (web / 'data').mkdir(exist_ok=True)
    shutil.copyfile(folder / 'store' / 'building.json', web / 'data' / 'building.json')
    for path in sorted((folder / 'store' / 'tables').iterdir()):
        shutil.copyfile(path, web / 'cad' / path.name)
    print(f"store/building.json: {sum(len(f['rooms']) for f in building['floors'])} rooms, {sum(len(f['openings']) for f in building['floors'])} openings, {len(building['opening_types'])} opening types")


if __name__ == '__main__':
    main()
