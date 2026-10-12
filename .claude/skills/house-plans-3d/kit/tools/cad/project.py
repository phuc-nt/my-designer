"""Everything that belongs to one house: the project file, the transcription of the original documents and the model.

  project.json                    names, sheets, which floors are cut plans, which are seen from above, sheet notes
  store/source-dimensions.json    the dimensions and levels printed on the original documents
  the model                       exported by tools/build-plans.mjs from tools/house.mjs

The drafting modules ask this class and hold no figure or name of their own.
"""
import json
from pathlib import Path


def stations(source):
    """Named positions of the documented chains in drawing millimetres: ({'axis-1': 0, ...}, {'axis-A': 0, ...}).
    x grows along the across chain; the along chain runs from the rear (top of the drawing) to the front."""
    def run(chain_id, zero, sign):
        chain = next(c for c in source['chains'] if c['id'] == chain_id)
        values = [0]
        for segment in chain['segments_mm']:
            values.append(values[-1] + segment)
        shift = values[chain['stations'].index(zero)]
        return {name: sign * (v - shift) for name, v in zip(chain['stations'], values)}
    return run('across', source['origin']['x'], 1), run('along', source['origin']['z'], -1)


def boundary(gx, gy):
    """Plot boundary lines the documents give, as (left, bottom, right, top): the position of a chain's end station
    when it is named boundary-*, else None."""
    xs, ys = list(gx.items()), list(gy.items())
    at = lambda item: item[1] if item[0].startswith('boundary-') else None
    return at(xs[0]), at(ys[-1]), at(xs[-1]), at(ys[0])


class Project:
    def __init__(self, folder, model):
        self.folder = Path(folder)
        self.config = self._read('project.json')
        self.source = self._read('store/source-dimensions.json')
        self.model = model
        self.model_floors = {f['code']: f for f in model['floors']}
        self.floors = {f['code']: f for f in self.config.get('floors', [])}    # cut plans, in storey order
        self.covers = {c['code']: c for c in self.config.get('covers', [])}    # plans seen from above
        self.sheets = self.config.get('sheets', [])
        self._check()
        self.gx, self.gy = stations(self.source)
        self.boundary = boundary(self.gx, self.gy)
        self.levels = {l['id']: l for l in self.source['levels']}

    def _read(self, name):
        path = self.folder / name
        if not path.exists():
            raise SystemExit(f'{name} is missing in {self.folder}')
        try:
            return json.loads(path.read_text(encoding='utf-8'))
        except json.JSONDecodeError as error:
            raise SystemExit(f'{name} is not valid JSON: {error}')

    def _check(self):
        """Mistakes in the two hand-written files, said in their own terms before any drawing starts."""
        errors = []
        for key in ('slug', 'title', 'title_block', 'issued', 'source_line'):
            if not self.config.get(key):
                errors.append(f'project.json: "{key}" is missing')
        chains = {c.get('id'): c for c in self.source.get('chains', [])}
        for chain_id, axis in (('across', 'x'), ('along', 'z')):
            chain = chains.get(chain_id)
            if chain is None:
                errors.append(f'source-dimensions.json: chain "{chain_id}" is missing')
                continue
            if len(chain['stations']) != len(chain['segments_mm']) + 1:
                errors.append(f'source-dimensions.json: chain "{chain_id}" needs one station more than it has segments')
            if len(set(chain['stations'])) != len(chain['stations']):
                errors.append(f'source-dimensions.json: chain "{chain_id}" names a station twice')
            if self.source.get('origin', {}).get(axis) not in chain['stations']:
                errors.append(f'source-dimensions.json: origin.{axis} must be one of the stations of chain "{chain_id}"')
        levels = {l['id'] for l in self.source.get('levels', [])}
        for code, spec in self.floors.items():
            for key in ('variant_of', 'below'):
                if spec.get(key) and spec[key] not in self.floors:
                    errors.append(f'project.json: floor "{code}" has {key} "{spec[key]}", which is not a floor of the list')
            for key, where in (('code', self.model_floors), ('level', levels), ('above', levels)):
                value = spec.get(key)
                if value and value not in where:
                    errors.append(f'project.json: floor "{code}" names {key} "{value}", unknown to ' + ('the model' if key == 'code' else 'the levels of source-dimensions.json'))
            site = spec.get('site')
            if site and site.get('floor') not in self.model_floors:
                errors.append(f'project.json: the site of floor "{code}" names floor "{site.get("floor")}", unknown to the model')
            if site and site.get('level') not in levels:
                errors.append(f'project.json: the site of floor "{code}" names level "{site.get("level")}", unknown to source-dimensions.json')
        for code, spec in self.covers.items():
            for name in [spec.get('floor'), *[u.get('floor') for u in spec.get('under', [])]]:
                if name not in self.model_floors:
                    errors.append(f'project.json: cover "{code}" names floor "{name}", unknown to the model')
            if spec.get('level') and spec['level'].get('id') not in levels:
                errors.append(f'project.json: cover "{code}" names level "{spec["level"].get("id")}", unknown to source-dimensions.json')
        drawn = []
        for sheet in self.sheets:
            names = [sheet['floor']] if sheet.get('floor') else list(sheet.get('covers', []))
            if not names or not sheet.get('number') or not sheet.get('title'):
                errors.append(f'project.json: every sheet needs "number", "title" and either "floor" or "covers": {sheet}')
            for name in names:
                if name not in (self.floors if sheet.get('floor') else self.covers):
                    errors.append(f'project.json: sheet {sheet.get("number")} shows "{name}", which is not in ' + ('"floors"' if sheet.get('floor') else '"covers"'))
            drawn += names
        for code in [*self.floors, *self.covers]:
            if drawn.count(code) != 1:
                errors.append(f'project.json: "{code}" must be on exactly one sheet, it is on {drawn.count(code)}')
        if not self.floors:
            errors.append('project.json: "floors" lists no floor')
        if errors:
            raise SystemExit('The project files need correcting:\n  ' + '\n  '.join(dict.fromkeys(errors)))

    # ---- lookups ---------------------------------------------------------------------------------------------------
    def chain(self, chain_id):
        return next(c for c in self.source['chains'] if c['id'] == chain_id)

    def model_floor(self, code):
        return self.model_floors[code]

    def _base(self, code):
        return self.floors[code].get('variant_of') or code

    def _storeys(self):
        return [c for c, spec in self.floors.items() if not spec.get('variant_of')]

    def level_of(self, code):
        """Id of the documented level a floor stands on. A variant stands on the level of its original."""
        spec = self.floors[code]
        return spec.get('level') or (self.level_of(spec['variant_of']) if spec.get('variant_of') else code)

    def level_label(self, level_id):
        if level_id not in self.levels:
            raise SystemExit(f'source-dimensions.json has no level "{level_id}"; project.json or the floor codes of the model ask for it')
        return self.levels[level_id]['label']

    def below(self, code):
        """The floor whose stair shows through the stairwell: the storey under this one, unless "below" says otherwise."""
        if 'below' in self.floors[code]:
            return self.floors[code]['below']
        storeys = self._storeys()
        i = storeys.index(self._base(code))
        return storeys[i - 1] if i else None

    def above(self, code):
        """Id of the documented level this storey reaches up to: the level of the next storey, unless "above" names
        one. None where the documents give no level above the floor."""
        if 'above' in self.floors[code] or 'above' in self.floors[self._base(code)]:
            return self.floors[code].get('above', self.floors[self._base(code)].get('above'))
        storeys = self._storeys()
        i = storeys.index(self._base(code))
        return self.level_of(storeys[i + 1]) if i + 1 < len(storeys) else None

    def place(self, level_id):
        """What a level is the level of, in the viewer's language."""
        return self.config.get('level_places', {}).get(level_id, level_id)

    def notes(self, kind, default):
        return self.config.get('notes', {}).get(kind, default)
