"""Writes a Drawing as SVG for the web viewer.

One group per layer (data-layer) so the viewer can switch layers, strokes that keep their width when zoomed, and the
room outlines as paths that can be tapped (data-room). Drawings have y up, SVG has y down: every y is negated here.
"""
import math
from collections import defaultdict
from xml.sax.saxutils import escape

from drawing import CAP, LAYERS, TEXT_DIM

DASHES = {'PLAN-AXIS': '14 3 2 3', 'PLAN-HIDDEN': '4 3', 'PLAN-PHANTOM': '14 3 2 3 2 3'}  # screen pixels: strokes do not scale
MARGIN = 500


def colour(layer):
    rgb = LAYERS[layer][1]
    return '#161616' if rgb is None else '#%02x%02x%02x' % rgb


def stroke_width(weight):
    """Lineweight in 1/100 mm on paper to screen pixels."""
    return max(.55, weight * .045)


def path(points, closed=False):
    head, *rest = points
    return f'M{head[0]:.0f} {-head[1]:.0f}' + ''.join(f'L{x:.0f} {-y:.0f}' for x, y in rest) + ('Z' if closed else '')


def arc(centre, radius, start, end):
    """A counter-clockwise arc of the drawing; with y negated it runs against SVG's positive direction (sweep 0)."""
    (cx, cy), a, b = centre, math.radians(start), math.radians(end)
    large = 1 if (end - start) % 360 > 180 else 0
    return (f'M{cx + radius * math.cos(a):.0f} {-(cy + radius * math.sin(a)):.0f}'
            f'A{radius:.0f} {radius:.0f} 0 {large} 0 {cx + radius * math.cos(b):.0f} {-(cy + radius * math.sin(b)):.0f}')


def circle(centre, radius):
    (cx, cy), r = centre, radius
    return f'M{cx - r:.0f} {-cy:.0f}a{r:.0f} {r:.0f} 0 1 0 {2 * r:.0f} 0a{r:.0f} {r:.0f} 0 1 0 {-2 * r:.0f} 0'


def text(at, string, height, align='mc', rotation=0):
    """DXF text heights are cap heights and alignment points lie on the cap box; SVG wants a font size and a baseline."""
    x, y = at[0], -at[1]
    baseline = y + {'m': height / 2, 'b': 0, 't': height}[align[0]]
    anchor = {'l': '', 'c': ' text-anchor="middle"', 'r': ' text-anchor="end"'}[align[1]]
    turn = f' transform="rotate({-rotation:g} {x:.0f} {y:.0f})"' if rotation else ''
    return f'<text x="{x:.0f}" y="{baseline:.0f}" font-size="{height / CAP:.0f}"{anchor}{turn}>{escape(string)}</text>'


def dimension(item):
    """A linear dimension the way dxf_out's dimension styles draw it: line, extension lines, oblique ticks, figure."""
    along = 1 if item['vertical'] else 0
    across = 1 - along
    position = item['base'][across]
    point = lambda u, v: (v, u) if item['vertical'] else (u, v)
    ends = sorted((item['p1'][along], item['p2'][along]))
    lines = [path([point(ends[0] - 100, position), point(ends[1] + 100, position)])]
    for p in (item['p1'], item['p2']):
        gap = position - p[across]
        if abs(gap) > 1:
            side = math.copysign(1, gap)
            lines.append(path([point(p[along], p[across] + side * 50), point(p[along], position + side * 100)]))
    for end in ends:
        x, y = point(end, position)
        dx, dy = (-80, 80) if item['vertical'] else (80, 80)
        lines.append(path([(x - dx, y - dy), (x + dx, y + dy)]))
    size = ends[1] - ends[0]
    figure = f'({round(size / 10) * 10})' if item['estimated'] else str(round(size))
    natural = -1 if item['vertical'] else 1
    at = item['location'] or point((ends[0] + ends[1]) / 2, position + natural * (TEXT_DIM / 2 + 60))
    return lines, text(at, figure, TEXT_DIM, rotation=90 if item['vertical'] else 0)


def render(drawing, code):
    x0, y0, x1, y1 = drawing.bounds()
    strokes, fills, texts, rooms = defaultdict(list), defaultdict(list), defaultdict(list), []
    for item in drawing.items:
        layer, kind = item['layer'], item['kind']
        _, _, linetype, weight, _, _ = LAYERS[layer]
        key = (layer, item.get('linetype') or linetype, weight if item.get('weight') is None else item['weight'])
        if kind == 'line':
            strokes[key].append(path(item['points'], item['closed']))
        elif kind == 'arc':
            strokes[key].append(arc(item['centre'], item['radius'], item['start'], item['end']))
        elif kind == 'circle':
            strokes[key].append(circle(item['centre'], item['radius']))
        elif kind == 'fill':
            fills[layer].append(path(item['outer'], True) + ''.join(path(hole, True) for hole in item['holes']))
        elif kind == 'room':
            d = path(item['outer'], True) + ''.join(path(hole, True) for hole in item['holes'])
            rooms.append(f'<path data-room="{escape(item["code"])}" d="{d}"/>')
        elif kind == 'text':
            texts[layer].append(text(item['at'], item['text'], item['height'], item['align'], item['rotation']))
        elif kind == 'dim':
            lines, figure = dimension(item)
            strokes[key] += lines
            texts[layer].append(figure)
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0 - MARGIN:.0f} {-(y1 + MARGIN):.0f} {x1 - x0 + 2 * MARGIN:.0f} {y1 - y0 + 2 * MARGIN:.0f}" '
           f'data-plan="{code}" font-family="Arial, Helvetica, sans-serif" stroke-linecap="round" stroke-linejoin="round">']
    if rooms:
        out.append('<g data-layer="A-AREA" class="rooms" fill="transparent" fill-rule="evenodd">' + ''.join(rooms) + '</g>')
    for layer in LAYERS:
        if layer in fills:
            out.append(f'<g data-layer="{layer}" fill="{colour(layer)}" fill-rule="evenodd"><path d="{"".join(fills[layer])}"/></g>')
    for layer in LAYERS:
        for (name, linetype, weight), pieces in strokes.items():
            if name == layer:
                dash = f' stroke-dasharray="{DASHES[linetype]}"' if linetype in DASHES else ''
                out.append(f'<g data-layer="{layer}" fill="none" stroke="{colour(layer)}" stroke-width="{stroke_width(weight):.2f}"{dash}>'
                           f'<path vector-effect="non-scaling-stroke" d="{"".join(pieces)}"/></g>')
    for layer in LAYERS:
        if layer in texts:
            out.append(f'<g data-layer="{layer}" fill="{colour(layer)}">' + ''.join(texts[layer]) + '</g>')
    out.append('</svg>')
    return '\n'.join(out)


def write(folder, drawings):
    for code, drawing in drawings.items():
        (folder / f'{code}.svg').write_text(render(drawing, code), encoding='utf-8')
