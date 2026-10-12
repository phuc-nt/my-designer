# Viết mô hình nhà: `tools/house.mjs`

`house.mjs` là nơi duy nhất mô tả hình học của ngôi nhà. Bản vẽ CAD, web 3D, studio và kho số liệu đều dựng lại từ file này. Muốn đổi nhà thì sửa ở đây rồi chạy lại các lệnh dựng.

Mẫu để chép: `examples/sample-house/tools/house.mjs`. Thư viện: `tools/lib/floor.mjs` (lớp `Floor`, đồ nội thất), `tools/lib/mesh.mjs` (lớp `MeshBuilder`), `tools/lib/materials.mjs` (bảng vật liệu và ảnh vân).

## 1. Hệ tọa độ

| Trục | Ý nghĩa |
|---|---|
| `x` | Chạy ngang nhà. `x = 0` là trạm ghi ở `origin.x` của `store/source-dimensions.json`. |
| `z` | Chạy từ **phía sau ra phía trước**. `z = 0` là trạm ghi ở `origin.z`. |
| `y` | Hướng lên. Trong mỗi tầng, `y = 0` là mặt sàn hoàn thiện của chính tầng đó. |

- Đơn vị là mét. Bản vẽ đổi sang mm: `X = x × 1000`, `Y = −z × 1000`, nên mặt trước nhà nằm phía dưới tờ giấy.
- Tường bị cắt ở cao 1,25 m (`cut`). Phần trên mặt cắt tự tách thành một bộ phận riêng để ẩn đi khi xem mặt bằng.
- Chọn gốc tọa độ tại giao của hai trục có ghi trên bản vẽ gốc. Khi đó mọi tọa độ trục đọc thẳng được từ chuỗi kích thước.

## 2. Những gì `house.mjs` phải xuất

```js
export const LEVELS = { ground: -0.3, f1: 0, f2: 3.6, roof: 6.9 };   // id trùng với levels[].id của source-dimensions.json
export const floors = () => [site(), floor1(), floor2('original'), floor2('split'), roof()];
```

- `LEVELS`: cao độ theo mét. Việc dựng dừng lại nếu một giá trị khác với `source-dimensions.json`.
- `floors()`: mọi tầng, theo thứ tự từ dưới lên. Các công cụ chỉ đọc hai tên này.
- **Mã tầng phải trùng với một id cao độ** (`f1`, `f2`…). Nếu không trùng thì ghi `level` cho tầng đó trong `project.json`. Phương án chia lại lấy cao độ của tầng gốc.

## 3. Một tầng

```js
const f = new Floor({ code: 'f1', name: 'Tầng 1', level: LEVELS.f1, height: 3.45 });
f.structuralSlab(FOOTPRINT, { y0: -.3 });                    // đúng một lần mỗi tầng
f.flooring('floor-tile', FOOTPRINT, color, { holes: [wc] }); // lớp hoàn thiện, cho biết loại sàn của phòng
f.wallX(-.1, .1, -.1, 6.1, [{ a: 1.0, b: 2.8, type: 'glassDoor', panes: 2 }]);
room(f, 'kitchen', 'BẾP + P.ĂN', 2.0, 1.5);
label(f, 'BẾP + ĂN', '≈ 18 m²', 2.0, 1.5, 1.5);
return f;
```

- `height` là chiều cao tường của tầng. `cut: Infinity` dùng cho khu đất và mái, tức không cắt.
- `rect(x0, x1, z0, z1)` trả về bốn đỉnh của một hình chữ nhật trên mặt bằng.
- **`structuralSlab` gọi đúng một lần mỗi tầng.** Đường bao của nó là đường bao mặt bằng trên bản vẽ. Ô thang, giếng trời khai trong `holes`.

### Sàn

| Hàm | Dùng cho |
|---|---|
| `structuralSlab(poly, { holes, y0 = -.15, c })` | Sàn kết cấu, dày từ `y0` tới −0,04. |
| `flooring(code, poly, c, { holes })` | Lớp hoàn thiện 4 cm, mặt trên đúng cốt sàn. |
| `block(x0, x1, z0, z1, { y0, y1, c, tag })` | Một khối tường đặc hình chữ nhật, ví dụ cột hay hộp kỹ thuật. |

Mã lớp hoàn thiện bắt đầu bằng `floor-`. Bảng phòng lấy tên loại sàn từ đây: `floor-wood` Sàn gỗ, `floor-tile` Sàn gạch, `floor-wc` Sàn WC, `floor-outdoor` Sàn ngoài trời.

### Tường và ô cửa

| Hàm | Ý nghĩa |
|---|---|
| `wallX(z0, z1, xa, xb, openings, o)` | Tường chạy theo `x`, dày từ `z0` tới `z1`, dài từ `xa` tới `xb`. |
| `wallZ(x0, x1, za, zb, openings, o)` | Tường chạy theo `z`, dày từ `x0` tới `x1`, dài từ `za` tới `zb`. |
| `slantedWindowWall(p, q, thickness, { sill, head, margin, y1, panes, c })` | Tường xiên có một cửa sổ chạy gần hết chiều dài. |

Tùy chọn `o` của tường: `{ y0 = -.04, y1 = chiều cao tầng, c = COLORS.wall, tag }`. `tag: 'light'` đánh dấu vách nhẹ: bản vẽ phương án tô màu cam và kho số liệu tính riêng diện tích vách.

Mỗi ô cửa là `{ a, b, type, sill, head, panes, hinge, swing, leafColor }`. `a`, `b` là tọa độ hai mép ô cửa dọc theo tường.

| `type` | Bệ, đỉnh mặc định (m) | Ghi chú |
|---|---|---|
| `window` | 0,9 và 2,4 | Cửa sổ. `panes` là số ô kính. |
| `glassDoor` | 0 và 2,5 | Cửa kính. Từ 1500 mm trở lên bảng cửa gọi là cửa lùa. |
| `door` | 0 và 2,15 | Cửa đi cánh mở. `hinge: 'a'` hoặc `'b'` là mép gắn bản lề. |
| `opening` | 0 và 2,3 | Ô trống không cánh. |

Chiều mở của cánh: `swing: 1` mở về pháp tuyến trái của hướng tường. Trên `wallX` là về phía `+z` (phía trước), trên `wallZ` là về phía `−x`. `swing: -1` mở ngược lại. Luôn nhìn bản vẽ sau khi dựng để chắc cánh cửa không quét vào giường hay tủ.

Cửa và kính đứng riêng, không nằm trong tường:

| Hàm | Ý nghĩa |
|---|---|
| `door(P, Q, thickness, head, { hinge, swing, angle = 78, leafColor })` | Một cánh cửa giữa hai điểm. |
| `window(P, Q, y0, y1, { panes, frosted })` | Khung và kính giữa hai điểm. |
| `glass(P, Q, y0, y1, c, code = 'glass')` | Tấm kính trơn. `code: 'glass-frosted'` là kính mờ. |

### Lan can, bồn cây, bậc thang

| Hàm | Ý nghĩa |
|---|---|
| `railing(pts, { h = 1.1, kerb = .3, thickness = .12, closed = false, y0 = -.17 })` | Lan can kính trên gờ xây, chạy qua các điểm `pts`. |
| `planter(cx, cz, length, width, { angle, h = .4, seed, y, plantHeight })` | Bồn cây, xoay được. |
| `rectPlanter(x0, x1, z0, z1, o)` | Bồn cây chữ nhật. |
| `step(poly, top, r, { floorY })` | Một bậc thang có mặt bậc ở cao `top`, chiều cao bậc `r`. |
| `rectStep(x0, x1, z0, z1, top, r, o)` | Bậc chữ nhật. |
| `winderSteps(pivot, x0, x1, z0, z1, startAngle, turn, top0, r)` | Ba bậc chéo 30° ở chỗ thang đổi hướng. |

Cầu thang viết bằng một vòng lặp, mỗi bậc một lần gọi:

```js
const R = 3.6 / 20;   // 20 bậc lên tầng trên
for (let k = 1; k <= 19; k++) f.rectStep(5.0, 5.9, 6.5 - .25 * k, 6.5 - .25 * (k - 1), k * R, R, { floorY: 0 });
```

Bậc nào có chân nằm dưới mặt cắt thì vẽ nét liền và khép kín phòng. Các bậc phía trên vẽ nét đứt. Mũi tên "LÊN" hoặc "XUỐNG" tự đặt ở đầu đường đi. Tầng trên nhìn thấy thang của tầng dưới qua ô thang, không cần viết lại.

### Phòng, nhãn, đường phân cách

| Hàm | Ý nghĩa |
|---|---|
| `room(f, code, name, x, z, kind = 'room')` | Một điểm nằm trong phòng. Bản vẽ tự tìm đường bao, diện tích, thông thủy. |
| `separator(f, p, q)` | Đường ngăn hai phòng thông nhau, ví dụ sảnh thang với phòng khách. |
| `label(f, title, sub, x, z, width = 1.5)` | Nhãn trên mô hình 3D. |

Loại phòng (`kind`): `room` Phòng ở, `wet` Vệ sinh, `circulation` Lối đi, `service` Phụ trợ, `outdoor` Ngoài trời. Chỉ phòng loại `room` được ghi kích thước thông thủy trên bản vẽ. Phòng `outdoor` cho biết mặt tường nào là mặt ngoài.

- Tên phòng viết hoa, ngắn, theo đúng bản vẽ gốc (ghi lại trong `room_names` của `source-dimensions.json`).
- Điểm `(x, z)` chỉ là chỗ bắt đầu. Bản vẽ tự dời và thu nhỏ tên cho vừa phòng. Phòng hẹp ở chân thang cần tên thật ngắn, ví dụ `SẢNH`.
- Diện tích trên nhãn 3D là chuỗi viết tay. Sau khi dựng, chép số từ `store/tables/rooms.csv` và giữ dấu `≈`.

### Bộ phận và đồ nội thất

| Hàm | Ý nghĩa |
|---|---|
| `f.layer(code, name, material, group)` | Một bộ phận của công trình. Trả về `MeshBuilder`. |
| `f.item(code, name, material = 'matte', upper = false)` | Một món nội thất. `upper: true` là món nằm trên mặt cắt, ẩn cùng phần tường trên. |
| `f.box(code, x0, x1, y0, y1, z0, z1, c, tag)` | Hộp, tự tách ở mặt cắt. |
| `f.rotatedBox(code, cx, cz, length, thickness, angle, y0, y1, c, tag)` | Hộp xoay quanh trục đứng. |
| `f.prism(code, poly, y0, y1, c, tag)` | Lăng trụ đáy đa giác. |

Đồ dựng sẵn, tham số đầu là `MeshBuilder` của món đó:

```js
bed(f.item('bed-1', 'Giường 1,6 m'), x0, x1, z0, z1, 'z0', COLORS.fabricBlue);   // đầu giường ở cạnh z0
wardrobe(m, x0, x1, z0, z1, 2.3);      cabinet(m, x0, x1, z0, z1, .5);
table(m, x0, x1, z0, z1, .75);         chair(m, cx, cz, 'z0');      barStool(m, cx, cz);
rug(m, x0, x1, z0, z1);                tv(m, 'x1', t, a, b, 1.0, 1.6);
toilet(m, cx, cz, 'z0');               vanity(m, x0, x1, z0, z1, [[cx, cz]]);   bathtub(m, x0, x1, z0, z1);
pottedPlant(m, cx, cz, 1.1, seed);     car(m, x0, x1, z0, z1);
const metres = bookshelf(m, 'x0', t, a, b, { depth: .3, levels: [0, 4], pitch: .29, seed: 1 });
f.slidingLeaf('slide-1', 'Cánh cửa lùa', [x, z0], [x, z1], .012, 2.8);
```

- `bookshelf` dựng một kệ sách dựa vào cạnh `x0`, `x1`, `z0` hoặc `z1` tại tọa độ `t`, chạy từ `a` tới `b`, và trả về số mét kệ. `levels: [từ, tới]` chọn các tầng kệ. Kệ cao quá mặt cắt thì gọi hai lần: tầng dưới vào một `item` thường, tầng trên vào một `item` có `upper: true`. Cộng số mét lại để ước lượng số sách (khoảng 30 cuốn mỗi mét) và ghi là số ước lượng.
- `slidingLeaf` dựng một cánh cửa kính khung gỗ rời khỏi tường và tạo bốn bộ phận: `<mã>`, `<mã>-upper`, `<mã>-glass`, `<mã>-glass-upper`. Vì là bộ phận riêng nên trình xem dời được từng cánh (xem `actions` trong `viewer-studio.md`). Ô cửa trên bản vẽ vẫn phải khai trong tường.

- Mỗi món một `item` riêng, tên tiếng Việt. Tên này hiện ở danh sách lớp của studio.
- Thiết bị vệ sinh đặt vào `f.layer('sanitary')`, không dùng `item`, để bản vẽ kích thước vẫn vẽ chúng.
- `car()` chỉ quay mũi về phía `+z`.
- Món nào thiếu thì tự dựng bằng `box`, `cylinder`, `blob`, `bar` của `MeshBuilder` (xem `tools/lib/mesh.mjs`).

## 4. Mã bộ phận mà bản vẽ dựa vào

Bản vẽ không đoán hình học. Nó đọc mã bộ phận. Dùng sai mã thì phần đó không được vẽ hoặc vẽ sai nét.

| Mã | Bản vẽ làm gì |
|---|---|
| `walls` | Tường bị cắt, tô đặc. Chỉ mã này tạo ra tường trên mặt bằng. |
| `slab` | Đường bao mặt bằng. |
| `floor-<loại>` | Loại sàn của phòng trong bảng phòng. |
| `stairs` | Bậc thang, mũi tên hướng đi. |
| `sanitary` | Thiết bị vệ sinh, vẽ trên cả hai mặt bằng. |
| `planters` | Bồn cây. |
| nhóm nội thất (`item`) | Chỉ vẽ trên mặt bằng bố trí nội thất. |

Bộ phận của tầng khu đất (tầng ghi ở `site.floor` của `project.json`):

| Mã | Bản vẽ làm gì |
|---|---|
| `yard` | Lô đất. **Phải khớp ranh đất của `source-dimensions.json` trong 1 mm**, nếu lệch thì việc dựng dừng. |
| `porch` | Thềm và bậc cấp. |
| `fence` | Tường rào. |
| `lawn` | Thảm cỏ. |
| `shrubs` | Cây bụi, chỉ vẽ trên mặt bằng nội thất. |
| `car` | Xe, chỉ vẽ trên mặt bằng nội thất. |

Các mã khác của khu đất (`base`, `road`, `pavement`…) chỉ có trong mô hình 3D.

Mã có đuôi `-upper` là phần trên mặt cắt, do thư viện tự tạo. Đừng tự đặt mã có đuôi này cho bộ phận công trình.

## 5. Mái và các mặt bằng nhìn từ trên

Mái không cắt. Viết nó thành một tầng riêng có `cut: Infinity`, rồi khai trong `covers` của `project.json` bộ phận nào là mặt mái dốc (`planes`), bộ phận nào vẽ theo mép (`edges`), xem [project-files.md](project-files.md).

- Mỗi mặt mái dốc là một mặt phẳng riêng trong lưới. Bản vẽ tự tìm mép mái, bờ nóc, bờ chảy và vẽ mũi tên dốc trên mọi mặt từ 0,4 m² trở lên.
- Nhà mẫu dựng mái hai dốc bằng hàm `roofHeight(z)` và `MeshBuilder.planFace`. Chép cách làm đó cho mái bốn dốc hay mái lệch.
- Sân thượng, mái bằng cũng là một tầng. Chỉ cần nhìn từ trên thì khai nó là một `cover` với `edges`, `walls`, `fixtures`. Có phòng cần thống kê thì cho nó mặt cắt bình thường và khai trong `floors`.

## 6. Phương án chia lại

Viết hàm tầng nhận tham số phương án, phần chung giữ nguyên:

```js
export function floor2(variant = 'original') {
  const split = variant === 'split';
  const f = new Floor({ code: split ? 'f2a' : 'f2', name: split ? 'Tầng 2, phương án A' : 'Tầng 2', level: LEVELS.f2, height: 3.15 });
  ...
  if (split) f.wallZ(2.95, 3.05, 4.55, 8.9, [], { c: '#EFE7D8', tag: 'light' });   // vách nhẹ xây mới
```

- Mỗi phương án có mã tầng riêng và khai trong `project.json` với `variant_of`.
- Bản vẽ tự so tường của phương án với tầng gốc: tường mới tô cam, tường và cửa tháo dỡ vẽ nét đứt đỏ. Không cần khai tay.
- Trước khi vẽ, viết yêu cầu của chủ nhà thành danh sách trong `CLAUDE.md` của dự án. Mỗi phương án phải giữ đủ các yêu cầu đó.

## 7. Vật liệu và màu

- `COLORS` trong `floor.mjs` có sẵn màu tường, gỗ, vải, kim loại, cây. Dùng tên, đừng rải mã màu khắp file.
- `MATERIALS` trong `materials.mjs`: `concrete`, `wall`, `woodFloor`, `tile`, `tileWc`, `tileOutdoor`, `glass`, `frostedGlass`, `frame`, `wood`, `plant`, `porcelain`, `matte`, `roofTile`, `carPaint`, `steel`, `ghost`, `base`, `asphalt`, `paving`, `grass`, `stone`.
- `TEXTURES`: ảnh vân và cỡ một viên theo mét, ví dụ `tile` 1,2 m, `wood` 2,4 m. Thêm ảnh mới thì đặt vào `textures/` và thêm một dòng vào bảng này.

## 8. Lỗi hay gặp khi dựng

| Thông báo | Cách sửa |
|---|---|
| `the point of room '…' is inside a wall or outside the slab` | Dời điểm của `room()` vào giữa phòng. |
| `rooms '…' and '…' are one open space; add a separator between them` | Thêm `separator(f, p, q)` giữa hai phòng, hoặc bỏ một phòng. |
| `The model disagrees with store/source-dimensions.json: …` | Sửa `LEVELS` hoặc bộ phận `yard` cho khớp số trên bản vẽ gốc. Không sửa file số liệu để chiều theo mô hình. |
| Tên phòng đè lên chữ "LÊN" hay lên tường | Đặt tên ngắn hơn. |

Các lỗi về khổ giấy và ghi chú nằm trong [plans.md](plans.md).
