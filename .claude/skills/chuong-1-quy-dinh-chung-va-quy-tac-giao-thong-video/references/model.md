# Mô hình con đường: toạ độ, các phần và cách mô hình "diễn"

Phần hình của video là một canvas 2D (`compositions/world.html`) nằm dưới các khung chữ trong suốt. Nó vẽ lại toàn bộ cho mọi thời điểm `t`, nên seek tới đâu cũng ra đúng hình. Khung dùng chung (`bench.js`, `draw.js`, `timeline.js`, hợp đồng của `beats.js`) có tài liệu ở `.claude/skills/chuong-4-cau-tao-va-sua-chua-video/references/bench.md` §2 và §5; tệp này chỉ viết phần riêng của chương I.

## 1. Nguyên tắc và toạ độ

- **Màn hình:** 1920 × 1080. Khung nhìn bàn vẽ `VP = { x: 684, y: 36, w: 1202, h: 848, r: 26 }`, tâm `CX = 1285`, `CY = 470`. Mọi thứ của mô hình bị cắt theo khung nhìn; không gì nằm dưới y 880. Cột chữ giữ x 64–620.
- **Mô hình:** đơn vị là mét. `x` chạy dọc đường (0 → 44), `y` ngang đường (0 là tim đường), `z` lên trên. Máy quay đứng về phía +x, +y, +z, nên một khối hộp lộ mặt trên, mặt `x1` và mặt `y1`. Một mét chiều cao cao bằng `ZK = 1.1` lần một mét dọc đường.
- **Kích thước của đoạn đường** (`road.js`): `RD = { x0: 0, x1: 44, cw: 8, sh: 9.6, vg: 11, deep: 1.2 }`: nửa bề rộng phần đường xe chạy 8, tới mép lề 9,6, tới mép nền 11, bề dày tấm mô hình 1,2. Đường cắt ngang `BR = { x0: 20, x1: 24, y: 15, h: 5.2, t: 0.5 }`. Xe tải `TRUCK = { cab: 2.7, bed: 1.15, half: 4.1, wide: 1.15 }`.
- **Máy quay** chỉ có ba số: `iso.look(vx, vy, k, cx, cy)` đặt điểm mặt đất `(vx, vy)` vào điểm màn hình `(cx, cy)` với `k` điểm ảnh mỗi mét. `world.js` giữ bảng `KEYS`, mỗi dòng `[mốc, vx, vy, k, dịch xuống]`, và `camera(t)` trượt giữa các dòng trong 1,2 giây quanh mốc. Toàn cảnh là `k ≈ 15`; cận một làn `k ≈ 27`; nhường chỗ cho cột bảng tên `k = 6.5` với dịch xuống 290.
- **Điểm màn hình của một điểm mô hình:** `iso.P(x, y, z)`. Nhãn trên canvas đặt theo toạ độ màn hình và có đường chỉ tới một điểm mô hình, nên nó đứng yên khi máy quay lia.
- Khung nhìn luôn có giấy kẻ ô, bốn dấu góc và dòng "MÔ HÌNH MINH HOẠ · KHÔNG THEO TỈ LỆ" (`frame()` trong `world.js`). Giữ dòng này: hình không được hiểu là số đo thật.

## 2. `beats.js`

`buildBeats(K)` trả về mọi mốc mà hình phản ứng, gom theo khung: `B.f8 = { name: a8("Khổ giới hạn"), wide: a8("chiều rộng"), high: a8("chiều cao"), … }`. `a8(cụm)` là giây tuyệt đối khi giọng đọc tới cụm đó trong khung 8; `a8(cụm, { nth: 2 })` lấy lần thứ hai. `T(n)`, `E(n)` là đầu và cuối khung. Không số nào gõ tay: đổi giọng thì cả bài tự dời.

Với Dễ nhầm, đặt hai mốc cho mỗi cách hiểu sai: `w` là lúc nó hiện ra, `x` là lúc nó bị gạch. Lớp chữ dùng đúng hai mốc đó (`frames.md` §4), nên nét gạch trên mô hình và trong cột chữ chạy cùng lúc.

## 3. Bảng màu

`COL` trong `road.js`. Màu của vật (nền, lề, nhựa đường, sơn, bê tông, thép, gỗ) chỉ để vật trông ra vật; **màu có nghĩa** chỉ có bốn:

| Màu | Nghĩa | Dùng ở |
|---|---|---|
| `COL.lilac` tím nhạt | phần đang được gọi tên | vùng tô, viền sáng của phần đường, nhãn tên, mũi tên dòng xe |
| `COL.red` đỏ | cách hiểu sai, điều không được | vùng gạch chéo (`zone(…, { hatch })`), nhãn nét đứt, nét gạch |
| `COL.green` xanh lá | đúng, câu trả lời | dấu tích, khối khoảng trống khi xe qua lọt |
| `COL.amber` hổ phách | cách nhớ, câu hỏi | nhãn ngắn của khung Cách nhớ, dấu hỏi |

`COL.ice`, `COL.peri`, `COL.teal`, `COL.sky` là màu phụ cho thứ cần phân biệt mà không mang phán quyết (hai chiều xe, đường bộ nói chung). Một phần sáng lên bằng tham số `lit` hay `a`; không đổi màu của vật để trang trí.

## 4. Cách mô hình "diễn"

Các mẫu cảnh có sẵn trong `world.js` của ví dụ Bài 1. Chọn theo việc câu luật đang làm.

| Mẫu | Hàm trong ví dụ | Khi nào | Cách làm |
|---|---|---|---|
| Trả lời trước, rồi tháo ra | `opening`, `closing` | Khung mở và khung kết | Mọi phần có mặt, mỗi phần một bảng tên hiện theo lời đọc; cuối khung mở các phần hạ xuống để các khung sau lắp lại |
| Lắp theo vế | `carriageway`, `laneScene`, `medians`, `expressway` | Khung Quy tắc | Mỗi cụm của câu là một mốc: vùng tô hiện (`zone`), vật mọc lên (`barrier`, `fence`, tham số `a` và `drop`), xe đi vào (`drive`), mũi tên chạy (`flow`). Phần vừa được đọc sáng tím nhạt qua `lit(t, [từ, tới, màu])` |
| Diễn cách hiểu sai rồi gạch | trong `carriageway`, `markings`, `gauge`, `expressway` | Khung Dễ nhầm | Vùng tô phình ra hay co lại thành đúng điều cách hiểu sai nói, đổi sang đỏ và gạch chéo; một viên chữ đỏ ở góc trên phải ghi cách hiểu đó; `strike()` chạy nét gạch qua viên chữ ở mốc `x` |
| Khối khoảng trống có mũi tên đo | `gauge`, `underBridge` | Kích thước, giới hạn | `clearSpace` vẽ khối trong suốt (gọi `.back()` trước vật đi qua nó và `.front()` sau); `measure` vẽ mũi tên hai đầu lớn dần theo lời đọc; `portal` vẽ khung cổng. Không ghi con số bài không nêu |
| Cột bảng tên | `signpost` | Quy tắc là một danh sách tên | Máy quay lùi xa (`k` nhỏ), một cột mọc lên, mỗi tên một tấm bảng trượt ra đúng thứ tự đọc; tấm của Dễ nhầm đổi sang đỏ rồi trở lại |
| Tình huống rồi trả lời | `underBridge`, `junction`, `oneWay` | Thử áp dụng, mỗi tình huống hai khung | Khung hỏi: tình huống dựng lên, xe dừng ở chỗ phải quyết định, dấu hỏi hổ phách. Khung trả lời: kết quả hiện bằng xanh lá hoặc đỏ. Một hàm cảnh giữ cả hai khung |
| Hai thứ cạnh nhau | `markings` (khung Cách nhớ) | Cách nhớ so hai tên | Cả hai sáng cùng lúc, mỗi thứ một nhãn ba, bốn chữ |

Xe chạy bằng `lap(t, t0, x0, v, y)` (vị trí của một xe chạy vòng lại trên đoạn đường từ mốc `t0`) và `drive(kind, l, a, o)`. Xe là minh hoạ: khối đơn giản, không biển số, không nhãn hiệu.

## 5. API của `kit/`

Chữ ký đầy đủ nằm ở đầu mỗi hàm trong tệp nguồn; dưới đây là thứ cần biết để chọn.

### `iso.js`: `createIso(c)`

| Hàm | Vẽ gì |
|---|---|
| `cam`, `P(x, y, z = 0)`, `look(vx, vy, k, cx, cy)` | Máy quay và phép chiếu |
| `poly(pts, fill, { a, stroke, lw, dash })` | Đa giác theo điểm màn hình |
| `patch(x0, y0, x1, y1, z, fill, o)` | Hình chữ nhật nằm ngang ở cao độ `z` |
| `shape(pts, z, fill, o)` | Đa giác nằm ngang theo điểm mô hình |
| `wall(x0, y0, x1, y1, z0, z1, fill, o)` | Mặt đứng giữa hai điểm mặt đất |
| `box(x0, y0, z0, x1, y1, z1, col, a, o)` | Khối hộp ba mặt, tự tô sáng tối |
| `wire(…, col, a, lw)` | Khung dây của một khối hộp |
| `seg3(p, q, col, w, a, dash)` | Đoạn thẳng giữa hai điểm mô hình |
| `measure(p, q, col, a, { w, head, grow })` | Mũi tên đo hai đầu; `grow` 0 → 1 kéo dài dần |
| `circle`, `wheel`, `rim`, `drum` | Hình tròn, bánh xe, vành, trống lăn |
| `solid(x, y, z, fn)`, `flush()` | Xếp một vật vào hàng đợi theo độ sâu, rồi vẽ cả hàng từ xa tới gần |

**Mọi vật có chiều cao phải đi qua `solid()`**, nếu không xe ở gần sẽ bị vật ở xa vẽ đè. Mặt đất và vạch sơn vẽ thẳng, trước hàng đợi.

### `road.js`: `createRoad(c, iso)`

Mọi hàm nhận `a` (0 → 1) là mức hiện diện; `a = 0` thì không vẽ gì.

| Hàm | Vẽ gì |
|---|---|
| `ground()` | Tấm mô hình: nền, lề, mặt nhựa, cạnh dày |
| `stripe(y, grow, { on, off, w, xa, xb, col, a })` | Một vạch dọc đường, liền hoặc đứt, kéo dài dần theo `grow` |
| `lines(grow, { a, col, lane })` | Bộ vạch của đoạn đường: tim đường và vạch làn |
| `painted(x, y, ang, kind, a, col, s)` | Mũi tên sơn trên mặt đường; `kind` là `"ahead"` hoặc `"turn"` |
| `stopLine(…)` | Vạch dừng |
| `flow(x, y, len, dir, col, a, w, axis)` | Mũi tên dòng xe nằm trên mặt đường |
| `zone(xa, ya, xb, yb, col, a, { fill, lw, hatch, dash })` | Vùng tô trên mặt đất; `hatch` gạch chéo cho cách hiểu sai |
| `barrier(y, xa, xb, a, { lit, gap, half, core, h, drop })` | Dải phân cách bê tông; `drop` cho nó hạ từ trên xuống |
| `median(a, o)`, `separator(y, xa, xb, a, o)` | Dải phân cách giữa; dải phân cách trong cùng một chiều |
| `fence(a, lit)`, `lamps(a, lit)`, `gantry(a, lit)` | Hàng rào hai bên, cột đèn, giá long môn |
| `crossing(a, lift, tint)` | Đường cắt ngang; `lift` 0 là cùng mức, 1 là cầu vượt |
| `ramps(a, lit)` | Hai làn nhánh: xe ra và xe vào |
| `clearSpace(x0, y0, x1, y1, h, col, a, { wide, tall })` | Khối khoảng trống trong suốt, có `.back()` và `.front()` |
| `portal(x, y0, y1, h, col, a, lw)` | Khung cổng đứng ngang đường |
| `vehicle(kind, x, y, { dir, axis, a, z, col, load, bias })` | Xe dạng khối: `car`, `truck`, `moto`, `bike`, `roller`. `dir` ±1 là chiều chạy, `axis` cho xe chạy ngang đường, `load` là chiều cao hàng trên xe tải |

### `world.js` của ví dụ

- `lit(t, …[từ, tới, màu])`: mức sáng và màu của một phần tại `t`. `tone`: trộn màu vật với màu sáng.
- Nhãn: `name(chữ, x, y, [điểm mô hình], { a, col, size, on })` có đường chỉ; `nameL` neo trái; `follow` đi theo một vật; `chip(chữ, x, y, { a, col, on, size, align, dash })` là viên chữ, trả về hộp của nó; `chipRow` một hàng viên chữ; `strike(hộp, tiến độ, a)` nét gạch; `tick`, `num`, `ring` là dấu tích, số bước, vòng nhấn.
- `draw(t)` vẽ theo thứ tự: nền và giấy kẻ ô → `road.ground()` → cảnh lớp `"g"` (mặt đất, dưới vạch sơn) → `paint(t)` (vạch sơn) → lớp `"p"` (mặt đất, trên vạch sơn) → `solids(t)` rồi lớp `"s"` (xếp vật vào hàng đợi) → `iso.flush()` → lớp `"o"` (nhãn, mũi tên đo, trên mô hình) → viền khung nhìn.
- Một hàm cảnh nhận `(t, w, ph)`: `w` là mức hiện của cảnh (tự mờ chéo 0,6 giây ở hai đầu), `ph` là lớp đang vẽ. Bảng `SCENES` ghi `[khung đầu, khung cuối, hàm]`.
- `lift(t)`, `paint(t)`, `solids(t)` giữ những thứ sống qua nhiều cảnh (dải phân cách, vạch, hàng rào): mỗi thứ có một khoảng `vis(t, từ, tới)` riêng. Thứ chỉ thuộc một cảnh thì vẽ trong hàm cảnh.

## 6. Thêm phần mới, xe mới

1. **Vẽ vào `road.js` của dự án**, không vào `world.js`, khi bài khác cũng sẽ dùng (đèn tín hiệu, người, nút giao, đường sắt). Hàm mới nhận `a` và, nếu nó có thể được gọi tên, nhận `lit`. Vật có chiều cao thì bọc trong `iso.solid(x, y, z, () => …)`.
2. **Giữ nét của bộ:** khối hộp ba mặt qua `iso.box`, không viền đen, không bóng đổ, không chi tiết nhỏ hơn 4 điểm ảnh ở `k = 15`. Xe mới thêm vào `vehicle()` với kích thước tính bằng mét như các xe đã có.
3. **Xe đi theo đường cong** (rẽ, quay đầu, vượt): lấy vị trí và hướng từ `path.js` (đã có trong dự án), rồi vẽ xe ở hướng gần nhất mà `vehicle` có (`dir`, `axis`); cần góc tuỳ ý thì thêm tham số góc cho `vehicle` trong `road.js`. Việc này **chưa làm**: bài đầu tiên cần nó phải thử và ghi lại ở đây.
4. **Người** chưa có. Vẽ dạng khối như xe (thân, đầu, tay), cao khoảng 1,7 m; hiệu lệnh tay của người điều khiển giao thông phải soát với ảnh tham khảo của Bài 6.
5. **Bảng con số:** con số là chữ trên canvas gắn vào vật (`chip`, `name`), cỡ từ 26 px; cả bảng đầy đủ nằm ở cột chữ. Không vẽ lại cả bảng trên mô hình.
6. Sau khi thêm: `node scripts/bench-check.mjs` (0 lỗi, 0 NaN), `node scripts/bench-shots.mjs` ở vài mốc, đọc ảnh. Xong bài thì chuyển về `kit/` và chạy phép kiểm ở `qa.md` §3; ghi hàm mới vào §5 của tệp này.
