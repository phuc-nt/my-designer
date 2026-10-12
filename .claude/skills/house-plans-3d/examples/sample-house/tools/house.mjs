// Geometry of the sample house, one function per floor. Copy the patterns, replace the figures with your house.
// Coordinates (metres): origin at the intersection of grid line 1 and grid line C. x toward grid line 3 (6.0 m),
// z from the rear to the front facade (C = 0; B = 4.5; A = 9.0). The plot runs from x = -1 to 6.1 and from
// z = -2 to 13: a side yard on the left, a party wall on the right boundary.
// Within each floor, y = 0 is that floor's finished floor level.
import { Floor, COLORS, rect, label, room, separator, bed, wardrobe, cabinet, table, chair, rug, tv, toilet, vanity, pottedPlant, car } from './lib/floor.mjs';

// The ids are the level ids of store/source-dimensions.json; the build fails when a value differs from that file.
export const LEVELS = { ground: -0.3, f1: 0, f2: 3.6, roof: 6.9 };
export const SITE = { x0: -4.5, x1: 9.5, z0: -4.5, z1: 17 };  // extent of the model base around the plot
const R = 3.6 / 20;                                            // riser of the stair from floor 1 to floor 2: 20 risers
const FLOOR_COLORS = { wood: '#C9A47E', tile: '#DCD8D0', wc: '#C2CCCE', outdoor: '#BBB4AA' };
const FOOTPRINT = rect(-.1, 6.1, -.1, 9.1);                    // outer faces of the 200 mm walls standing on the axes

// ---------------------------------------------------------------- SITE
// Part codes the plans know: yard (the plot, checked against the documented boundary), porch, fence, lawn, shrubs, car.
export function site() {
  const f = new Floor({ code: 'site', name: 'Khu đất', level: LEVELS.ground, height: 3, cut: Infinity });
  const { x0, x1, z0, z1 } = SITE;
  f.layer('base', 'Đế mô hình', 'base').box(x0, x1, -.6, -.3, z0, z1, '#ECE9E2');
  f.layer('road', 'Lòng đường', 'asphalt').box(x0, x1, -.3, -.24, 15.2, z1, '#8F9297');
  const pavement = f.layer('pavement', 'Vỉa hè và đất quanh lô', 'paving');
  pavement.box(x0, x1, -.3, -.1, 13, 15.05, '#CFCBC3');                      // pavement
  pavement.box(x0, x1, -.3, -.07, 15.05, 15.2, '#B9B5AD');                   // kerb
  pavement.box(x0, -1, -.3, -.02, z0, 13, '#DDD9D1'); pavement.box(6.1, x1, -.3, -.02, z0, 13, '#DDD9D1'); pavement.box(-1, 6.1, -.3, -.02, z0, -2, '#DDD9D1'); // neighbouring plots
  f.layer('yard', 'Sân trong lô đất', 'paving').box(-1, 6.1, -.3, 0, -2, 13, '#C9C2B6');
  const lawn = f.layer('lawn', 'Thảm cỏ', 'grass');
  lawn.box(-.88, -.22, 0, .03, -1.88, 8.6, '#A4BE8B', { bottom: false });   // side yard
  lawn.box(3.3, 5.98, 0, .03, -1.88, -.4, '#A4BE8B', { bottom: false });    // rear yard
  const fence = f.layer('fence', 'Tường rào', 'wall');
  fence.box(-1, 6.1, 0, 1.8, -2, -1.9, COLORS.wall);                         // rear
  fence.box(-1, -.9, 0, 1.8, -1.9, 13, COLORS.wall);                         // left
  fence.box(6.0, 6.1, 0, 1.8, -1.9, -.1, COLORS.wall); fence.box(6.0, 6.1, 0, 1.8, 9.1, 13, COLORS.wall);   // right, behind and in front of the house
  fence.box(2.7, 6.0, 0, 1.2, 12.9, 13, COLORS.wall); fence.box(-.9, -.4, 0, 1.2, 12.9, 13, COLORS.wall);   // front, either side of the gate
  const porch = f.layer('porch', 'Thềm và bậc cấp', 'stone');
  porch.box(3.4, 5.0, 0, .28, 9.1, 10.0, FLOOR_COLORS.outdoor); porch.box(3.2, 5.2, 0, .14, 10.0, 10.3, FLOOR_COLORS.outdoor);   // main door
  porch.box(.8, 3.0, 0, .28, -1.0, -.1, FLOOR_COLORS.outdoor); porch.box(.8, 3.0, 0, .14, -1.3, -1.0, FLOOR_COLORS.outdoor);     // rear door
  const shrubs = f.layer('shrubs', 'Cây bụi', 'plant');
  for (const [x, z, r, s] of [[-.55, .6, .3, 1], [-.55, 3.4, .32, 2], [-.55, 6.6, .3, 3], [3.8, -.8, .32, 4], [5.5, -.8, .3, 5]]) shrubs.blob(x, r * .9, z, r, r * .95, r, s % 2 ? COLORS.leaf : COLORS.leafDark, { seed: s });
  const outside = f.layer('trees-outside', 'Cây ngoài lô đất', 'plant');
  const tree = (x, z, h, s) => { outside.cylinder(x, z, .09, -.1, h * .55, COLORS.woodDark, { seg: 8, r1: .06 }); outside.blob(x, h * .78, z, h * .34, h * .36, h * .34, s % 2 ? COLORS.leaf : COLORS.leafDark, { detail: 1, seed: s }); };
  tree(-2.6, 14.0, 3.6, 1); tree(7.6, 14.0, 3.2, 2);
  car(f.item('car', 'Ô tô (minh hoạ)', 'carPaint'), .4, 2.1, 9.3, 12.8);
  return f;
}

// ---------------------------------------------------------------- FLOOR 1
export function floor1() {
  const f = new Floor({ code: 'f1', name: 'Tầng 1', level: LEVELS.f1, height: 3.45 });
  const wc = rect(3.4, 4.9, .1, 1.9);
  f.structuralSlab(FOOTPRINT, { y0: -.3, c: '#A9A297' });   // exactly one structural slab per floor: it is the outline of the plan
  f.flooring('floor-tile', FOOTPRINT, FLOOR_COLORS.tile, { holes: [wc] });
  f.flooring('floor-wc', wc, FLOOR_COLORS.wc);

  // Outside walls. The rear and front walls take the corners; the side walls run between them.
  f.wallX(-.1, .1, -.1, 6.1, [{ a: 1.0, b: 2.8, type: 'glassDoor', panes: 2 }, { a: 3.9, b: 4.5, type: 'window', sill: 1.6, head: 2.2, panes: 1 }]);
  f.wallX(8.9, 9.1, -.1, 6.1, [{ a: .8, b: 3.0, type: 'window', sill: .6, panes: 3 }, { a: 3.7, b: 4.7, type: 'door', head: 2.4, hinge: 'b', swing: -1, leafColor: COLORS.walnut }]);
  f.wallZ(-.1, .1, .1, 8.9, [{ a: 1.4, b: 2.8, type: 'window', panes: 2 }, { a: 5.8, b: 7.4, type: 'window', panes: 2 }]);
  f.wallZ(5.9, 6.1, .1, 8.9);                                                                    // party wall on the boundary: no openings

  // Inside walls, 100 mm
  f.wallX(4.45, 4.55, .1, 4.9, [{ a: 1.4, b: 3.0, type: 'opening' }]);                          // kitchen | living room, on axis B
  f.wallZ(4.9, 5.0, .1, 6.5, [{ a: 2.5, b: 3.3, type: 'door', head: 1.9, hinge: 'b', swing: 1 }]); // wall of the stair, door of the store under it
  f.wallZ(3.3, 3.4, .1, 1.9);
  f.wallX(1.9, 2.0, 3.3, 4.9, [{ a: 3.75, b: 4.5, type: 'door', hinge: 'a', swing: 1 }]);
  const sanitary = f.layer('sanitary');
  vanity(sanitary, 3.42, 3.9, .12, .9, [[3.66, .5]]); toilet(sanitary, 4.45, .47, 'z0');

  // Stair up to floor 2: 19 treads of 250 mm between two walls, rising toward the rear.
  for (let k = 1; k <= 19; k++) f.rectStep(5.0, 5.9, 6.5 - .25 * k, 6.5 - .25 * (k - 1), k * R, R, { floorY: 0 });

  // Furniture: one item per piece. An item made with upper = true stands above the 1.25 m cut plane and is
  // hidden together with the upper part of the walls.
  const kitchen = f.item('kitchen', 'Tủ bếp');
  kitchen.box(.12, .68, 0, .1, .3, 4.2, COLORS.darkGrey); kitchen.box(.1, .7, .1, .86, .3, 4.2, COLORS.woodLight);
  kitchen.box(.1, .73, .86, .9, .3, 4.2, '#EDEBE6');
  kitchen.box(.2, .62, .9, .91, .7, 1.25, COLORS.black);                                  // hob
  kitchen.box(.2, .62, .9, .905, 3.2, 3.95, COLORS.steel, { bottom: false });               // sink
  f.item('kitchen-upper', 'Tủ bếp trên (phần trên)', 'matte', true).box(.1, .45, 1.5, 2.2, 3.0, 4.2, COLORS.woodLight);
  const dining = f.item('dining-table', 'Bàn ăn 4 ghế');
  table(dining, 1.7, 3.1, 2.6, 3.5, .75, COLORS.wood);
  for (const x of [2.05, 2.75]) { chair(dining, x, 2.4, 'z0', COLORS.fabricBeige); chair(dining, x, 3.7, 'z1', COLORS.fabricBeige); }
  const sofa = f.item('sofa', 'Sofa');
  sofa.box(.12, 1.0, .08, .42, 5.4, 7.8, COLORS.fabricGrey); sofa.box(.12, .36, .42, .84, 5.4, 7.8, COLORS.fabricGrey);
  rug(f.item('rug-living', 'Thảm phòng khách'), 1.2, 3.6, 5.5, 7.7, COLORS.rug);
  const coffeeTable = f.item('coffee-table', 'Bàn trà');
  coffeeTable.box(1.9, 2.6, .3, .36, 6.0, 7.2, COLORS.walnut); coffeeTable.box(1.97, 2.53, .04, .3, 6.07, 7.13, COLORS.woodDark);
  const tvUnit = f.item('tv-cabinet', 'Kệ tivi');
  cabinet(tvUnit, 4.5, 4.88, 4.8, 6.3, .42, COLORS.woodLight); tv(tvUnit, 'x1', 4.89, 5.0, 6.1, .95, 1.25);
  tv(f.item('tv-upper', 'Tivi (phần trên)', 'matte', true), 'x1', 4.89, 5.0, 6.1, 1.25, 1.6);
  pottedPlant(f.item('plant-living', 'Cây cảnh'), .45, 8.5, 1.2, 3);

  // Rooms: a point inside each. Two rooms that share one open space need a separator between them.
  room(f, 'kitchen', 'BẾP + P.ĂN', 2.0, 1.5); room(f, 'living', 'P.KHÁCH', 2.5, 8.2); room(f, 'wc', 'WC', 4.15, 1.25, 'wet');
  room(f, 'store', 'KHO', 5.45, 2.2, 'service'); room(f, 'stair-hall', 'SẢNH', 5.45, 7.9, 'circulation');
  separator(f, [4.95, 6.5], [4.95, 8.9]);
  // Labels of the 3D view. The areas are written by hand: copy them from store/tables/rooms.csv after a build.
  label(f, 'BẾP + ĂN', '≈ 18 m²', 2.0, 1.5, 1.5); label(f, 'PHÒNG KHÁCH', '≈ 21 m²', 2.5, 8.2, 1.9); label(f, 'WC', '≈ 2,7 m²', 4.15, 1.25, .75);
  label(f, 'THANG', 'lên tầng 2', 5.45, 5.6, .8);
  return f;
}

// ---------------------------------------------------------------- FLOOR 2
// variant = 'original': as on the documents. 'split' divides the front bedroom in two with a light partition
// on axis 2 and cuts a second door into the corridor wall. project.json lists it as a variant of f2.
export function floor2(variant = 'original') {
  const split = variant === 'split';
  const f = new Floor({ code: split ? 'f2a' : 'f2', name: split ? 'Tầng 2, phương án A' : 'Tầng 2', level: LEVELS.f2, height: 3.15 });
  const stairwell = rect(5.0, 5.9, 1.75, 6.5), wc = rect(3.05, 4.2, .1, 3.2), balcony = rect(-.1, 6.1, 9.1, 10.3);
  f.structuralSlab(rect(-.1, 6.1, -.1, 10.3), { holes: [stairwell] });
  f.flooring('floor-wood', FOOTPRINT, FLOOR_COLORS.wood, { holes: [stairwell, wc] });
  f.flooring('floor-wc', wc, FLOOR_COLORS.wc);
  f.flooring('floor-outdoor', balcony, FLOOR_COLORS.outdoor);

  // Outside walls
  f.wallX(-.1, .1, -.1, 6.1, [{ a: .9, b: 2.3, type: 'window', panes: 2 }, { a: 3.3, b: 3.9, type: 'window', sill: 1.5, head: 2.1, panes: 1 }, { a: 4.6, b: 5.6, type: 'window', panes: 1 }]);
  f.wallX(8.9, 9.1, -.1, 6.1, [{ a: .9, b: 2.4, type: 'glassDoor', panes: 2 }, { a: 3.5, b: 4.9, type: 'window', panes: 2 }]);
  f.wallZ(-.1, .1, .1, 8.9, [{ a: 1.0, b: 2.2, type: 'window', panes: 2 }, { a: 6.0, b: 7.4, type: 'window', panes: 2 }]);
  f.wallZ(5.9, 6.1, .1, 8.9);

  // Inside walls
  f.wallZ(2.95, 3.05, .1, 3.2);                                                                  // bedroom 2 | bathroom, on axis 2
  f.wallX(3.2, 3.3, .1, 4.3, [{ a: 1.9, b: 2.7, type: 'door', hinge: 'b', swing: -1 }, { a: 3.25, b: 3.95, type: 'door', hinge: 'a', swing: -1 }]);
  f.wallZ(4.2, 4.3, .1, 3.2);
  const doors = [{ a: 3.9, b: 4.7, type: 'door', hinge: 'b', swing: 1 }];
  if (split) doors.push({ a: 1.9, b: 2.7, type: 'door', hinge: 'b', swing: 1 });                  // the second door the variant needs
  f.wallX(4.45, 4.55, .1, 4.9, doors);                                                            // corridor | front bedroom, on axis B
  f.wallZ(4.9, 5.0, 4.45, 6.6); f.wallX(6.5, 6.6, 5.0, 5.9);                                      // around the stairwell
  if (split) f.wallZ(2.95, 3.05, 4.55, 8.9, [], { c: '#EFE7D8', tag: 'light' });                  // new light partition: orange on the plan
  f.railing([[4.95, 1.75], [4.95, 4.45]], { kerb: .08, y0: -.04, thickness: .06 });               // stairwell
  f.railing([[-.04, 9.1], [-.04, 10.24], [6.04, 10.24], [6.04, 9.1]]);                            // balcony
  const sanitary = f.layer('sanitary');
  toilet(sanitary, 3.62, .47, 'z0'); vanity(sanitary, 3.72, 4.18, 1.3, 2.3, [[3.95, 1.8]]);

  // Bedroom 2 (rear)
  bed(f.item('bed-2', 'Giường phòng ngủ 2'), .12, 2.12, .15, 1.55, 'x0', COLORS.fabricMoss);
  wardrobe(f.item('wardrobe-2', 'Tủ áo phòng ngủ 2'), 2.35, 2.93, .15, 1.75);
  const desk2 = f.item('desk-2', 'Bàn học phòng ngủ 2');
  table(desk2, .12, .72, 1.9, 3.1); chair(desk2, 1.0, 2.5, 'x1');

  // Front bedroom: one room as drawn, two rooms in the variant
  if (split) {
    bed(f.item('bed-1', 'Giường phòng ngủ 1'), .12, 2.12, 5.6, 7.0, 'x0', COLORS.fabricBlue);
    const desk1 = f.item('desk-1', 'Bàn học phòng ngủ 1');
    table(desk1, .12, .72, 7.5, 8.7); chair(desk1, 1.0, 8.1, 'x1');
    bed(f.item('bed-3', 'Giường phòng ngủ 3'), 3.07, 5.07, 7.4, 8.85, 'x0', COLORS.fabricOrange);
    const desk3 = f.item('desk-3', 'Bàn học phòng ngủ 3');
    table(desk3, 3.07, 3.67, 5.0, 6.2); chair(desk3, 3.97, 5.6, 'x1');
  } else {
    bed(f.item('bed-1', 'Giường phòng ngủ 1'), .12, 2.12, 5.0, 6.8, 'x0', COLORS.fabricBlue);
    rug(f.item('rug-bedroom', 'Thảm phòng ngủ 1'), 2.3, 4.3, 5.2, 7.2, COLORS.rugWarm);
    wardrobe(f.item('wardrobe-1', 'Tủ áo phòng ngủ 1'), 5.3, 5.88, 6.7, 8.8);
    const desk = f.item('desk-1', 'Bàn làm việc');
    table(desk, 3.5, 4.9, 8.28, 8.88); chair(desk, 4.2, 7.95, 'z0');
  }

  room(f, 'bed-2', 'P.NGỦ 2', 1.7, 2.3); room(f, 'wc', 'WC', 3.5, 1.05, 'wet'); room(f, 'hall', 'HÀNH LANG', 2.0, 3.87, 'circulation');
  if (split) { room(f, 'bed-1', 'P.NGỦ 1', 1.9, 7.9); room(f, 'bed-3', 'P.NGỦ 3', 4.2, 6.7); }
  else room(f, 'bed-1', 'P.NGỦ 1', 2.9, 7.9);
  room(f, 'balcony', 'BAN CÔNG', 3.0, 9.67, 'outdoor');
  label(f, 'PHÒNG NGỦ 2', '≈ 8,8 m²', 1.7, 2.3, 1.7); label(f, 'WC', '≈ 3,6 m²', 3.6, 1.6, .75); label(f, 'BAN CÔNG', '≈ 6,4 m²', 3.0, 9.67, 1.4);
  if (split) { label(f, 'PHÒNG NGỦ 1', '≈ 12 m²', 1.5, 7.6, 1.7); label(f, 'PHÒNG NGỦ 3', '≈ 10 m²', 4.2, 6.7, 1.7); }
  else label(f, 'PHÒNG NGỦ 1', '≈ 23 m²', 2.9, 7.9, 1.7);
  return f;
}

// ---------------------------------------------------------------- ROOF
// A gable roof: the ridge runs across the house above axis B, the two faces fall to the rear and to the front.
// The sample has no section drawing, so the pitch is an assumption: 30°.
const SLOPE = Math.tan(30 * Math.PI / 180), COS = Math.cos(30 * Math.PI / 180), EAVE_Y = .1, ROOF_THICKNESS = .14;
const EAVE = { x0: -.4, x1: 6.1, z0: -.6, z1: 9.6 }, RIDGE_Z = (EAVE.z0 + EAVE.z1) / 2;
export const roofHeight = z => EAVE_Y + SLOPE * Math.min(z - EAVE.z0, EAVE.z1 - z);

export function roof() {
  const f = new Floor({ code: 'roof', name: 'Mái', level: LEVELS.roof, height: 3, cut: Infinity });
  f.layer('ceiling', 'Sàn mái (giả định)', 'wall').extrude('y', FOOTPRINT, -.15, -.03, '#F1EEE7');
  // Gable walls: a section (z, y) extruded along x, up to the underside of the roof. Low walls close the two eaves.
  const under = z => roofHeight(z) - ROOF_THICKNESS - .01, walls = f.layer('walls', 'Tường thu hồi');
  for (const [x0, x1] of [[-.1, .1], [5.9, 6.1]]) walls.extrude('x', [[-.1, -.03], [9.1, -.03], [9.1, under(9.1)], [RIDGE_Z, under(RIDGE_Z)], [-.1, under(-.1)]], x0, x1, COLORS.wall);
  walls.box(.1, 5.9, -.03, under(-.1), -.1, .1, COLORS.wall); walls.box(.1, 5.9, -.03, under(9.1), 8.9, 9.1, COLORS.wall);
  const P = { A: [EAVE.x0, EAVE.z0], B: [EAVE.x1, EAVE.z0], C: [EAVE.x1, RIDGE_Z], D: [EAVE.x0, RIDGE_Z], E: [EAVE.x1, EAVE.z1], F: [EAVE.x0, EAVE.z1] };
  const v = (k, dy = 0) => [P[k][0], roofHeight(P[k][1]) + dy, P[k][1]];
  const tiles = f.layer('tiles', 'Mái ngói', 'roofTile'), soffit = f.layer('soffit', 'Mặt dưới mái và diềm', 'wall');
  for (const keys of [['A', 'B', 'C', 'D'], ['D', 'C', 'E', 'F']]) {   // the rear face and the front face
    tiles.planFace(keys.map(k => v(k)), '#56606B', { n: [0, 1, 0], uv: p => [p[0], (p[1] - EAVE_Y) / SLOPE / COS] });
    soffit.planFace(keys.map(k => v(k, -ROOF_THICKNESS)), COLORS.wall, { n: [0, -1, 0] });
  }
  const edge = ['A', 'B', 'C', 'E', 'F', 'D', 'A'];
  for (let i = 0; i < edge.length - 1; i++) soffit.face([v(edge[i], -ROOF_THICKNESS), v(edge[i + 1], -ROOF_THICKNESS), v(edge[i + 1]), v(edge[i])], COLORS.wall); // fascia and gable ends
  f.layer('ridges', 'Bờ nóc', 'roofTile').bar(v('D', .03), v('C', .03), .2, .09, '#3F4750');
  return f;
}

// Every floor of the model, once. The three builders (studio, web viewer, plans) read this list; project.json says
// which of these floors become cut plans and which are drawn from above.
export const floors = () => [site(), floor1(), floor2('original'), floor2('split'), roof()];
