"""Writes a Drawing as DXF (real DIMENSION entities, hatches, layers with lineweights) and renders it to PDF and PNG."""
import ezdxf
import pymupdf
from ezdxf import bbox, units
from ezdxf.addons.drawing import Frontend, RenderContext, config, layout
from ezdxf.addons.drawing.pymupdf import PyMuPdfBackend
from ezdxf.enums import TextEntityAlignment
from ezdxf.math import BoundingBox2d

from drawing import LAYERS, LINETYPES, SCALE

STYLE = 'PLAN'
ALIGN = {'mc': TextEntityAlignment.MIDDLE_CENTER, 'ml': TextEntityAlignment.MIDDLE_LEFT, 'mr': TextEntityAlignment.MIDDLE_RIGHT,
         'bl': TextEntityAlignment.LEFT, 'bc': TextEntityAlignment.CENTER, 'tl': TextEntityAlignment.TOP_LEFT, 'tc': TextEntityAlignment.TOP_CENTER}
ORDER = {'fill': 0, 'room': 1}  # fills go in first so the line work lies on top of them


def new_document():
    doc = ezdxf.new('R2010', setup=False)
    doc.units = units.MM
    doc.header['$MEASUREMENT'] = 1
    doc.header['$LTSCALE'] = 1
    doc.header['$LUNITS'] = 2
    doc.header['$LUPREC'] = 0
    doc.styles.add(STYLE, font='arial.ttf')
    for name, pattern in LINETYPES.items():
        doc.linetypes.add(name, [sum(abs(v) for v in pattern), *pattern], description=name)
    for name, (aci, rgb, linetype, weight, plotted, description) in LAYERS.items():
        layer = doc.layers.add(name, color=aci, linetype=linetype, lineweight=weight, plot=plotted)
        if rgb:
            layer.rgb = rgb
        layer.description = description
    # Dimension styles: sizes are paper millimetres, DIMSCALE brings them to the 1:100 model.
    for name, extra in (('PLAN', {}), ('PLAN-EST', dict(dimpost='(<>)', dimrnd=10))):
        style = doc.dimstyles.add(name)
        for key, value in dict(dimscale=SCALE, dimtxt=2.0, dimtxsty=STYLE, dimgap=.6, dimtad=1, dimexe=1.0, dimexo=.5, dimdle=1.0, dimasz=1.2, dimtsz=.9,
                               dimdec=0, dimzin=8, dimlfac=1, dimtih=0, dimtoh=0, dimtmove=2, dimclrd=256, dimclre=256, dimclrt=256, **extra).items():
            style.dxf.set(key, value)
    return doc


def add(msp, drawing, dx=0.0, dy=0.0):
    """Adds the items of a drawing to a layout, moved by (dx, dy)."""
    move = lambda p: (p[0] + dx, p[1] + dy)
    for item in sorted(drawing.items, key=lambda i: ORDER.get(i['kind'], 2)):
        kind, attribs = item['kind'], {'layer': item['layer']}
        if item.get('linetype'):
            attribs['linetype'] = item['linetype']
        if item.get('weight') is not None:
            attribs['lineweight'] = item['weight']
        if kind == 'line':
            msp.add_lwpolyline([move(p) for p in item['points']], close=item['closed'], dxfattribs=attribs)
        elif kind == 'arc':
            msp.add_arc(move(item['centre']), item['radius'], item['start'], item['end'], dxfattribs=attribs)
        elif kind == 'circle':
            msp.add_circle(move(item['centre']), item['radius'], dxfattribs=attribs)
        elif kind == 'fill':
            hatch = msp.add_hatch(color=256, dxfattribs={'layer': item['layer']})
            hatch.dxf.hatch_style = 0
            hatch.paths.add_polyline_path([move(p) for p in item['outer']], is_closed=True, flags=ezdxf.const.BOUNDARY_PATH_EXTERNAL)
            for hole in item['holes']:
                hatch.paths.add_polyline_path([move(p) for p in hole], is_closed=True, flags=ezdxf.const.BOUNDARY_PATH_OUTERMOST)
        elif kind == 'room':
            for ring in [item['outer'], *item['holes']]:
                msp.add_lwpolyline([move(p) for p in ring[:-1]], close=True, dxfattribs=attribs)
        elif kind == 'text':
            text = msp.add_text(item['text'], height=item['height'], rotation=item['rotation'], dxfattribs={**attribs, 'style': STYLE})
            text.set_placement(move(item['at']), align=ALIGN[item['align']])
        elif kind == 'dim':
            dim = msp.add_linear_dim(base=move(item['base']), p1=move(item['p1']), p2=move(item['p2']), angle=90 if item['vertical'] else 0,
                                     location=move(item['location']) if item['location'] else None,
                                     dimstyle='PLAN-EST' if item['estimated'] else 'PLAN', dxfattribs=attribs)
            dim.render()


def paper_layout(doc, name, width, height):
    """A paper-space layout named after the paper, showing the sheet at 1:100, for CAD programs that plot from layouts."""
    doc.layouts.rename('Layout1', name)  # the one layout a new document starts with
    psp = doc.layouts.get(name)
    psp.page_setup(size=(width, height), margins=(0, 0, 0, 0), units='mm')
    psp.add_viewport(center=(width / 2, height / 2), size=(width, height), view_center_point=(width * SCALE / 2, height * SCALE / 2),
                     view_height=height * SCALE, dxfattribs={'layer': 'A-ANNO-NPLT'})


def render(doc, width, height, pdf=None, png=None, dpi=200, box=None):
    """Plots the model space the way a CAD program would: at 1:100, with layer colours and lineweights."""
    backend = PyMuPdfBackend()
    cfg = config.Configuration(background_policy=config.BackgroundPolicy.WHITE, color_policy=config.ColorPolicy.COLOR,
                               lineweight_policy=config.LineweightPolicy.ABSOLUTE, lineweight_scaling=1.0, min_lineweight=.05)
    Frontend(RenderContext(doc, export_mode=True), backend, config=cfg).draw_layout(doc.modelspace())
    page = layout.Page(width, height, layout.Units.mm, margins=layout.Margins.all(0))
    settings = layout.Settings(fit_page=False, scale=1 / SCALE)
    box = box or BoundingBox2d([(0, 0), (width * SCALE, height * SCALE)])
    # One output per backend: a second call on the same backend scales the recorded drawing a second time.
    if pdf:
        pdf.write_bytes(backend.get_pdf_bytes(page, settings=settings, render_box=box))
        if png:  # the picture is the PDF itself, rasterised, so looking at it checks the PDF
            with pymupdf.open(pdf) as book:
                book[0].get_pixmap(dpi=dpi).save(png)
    elif png:
        png.write_bytes(backend.get_pixmap_bytes(page, fmt='png', settings=settings, dpi=dpi, render_box=box))


def extents(doc):
    return bbox.extents(doc.modelspace())
