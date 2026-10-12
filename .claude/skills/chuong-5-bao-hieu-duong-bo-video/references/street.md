# Con phố: biển, xe và cách tấm biển "diễn"

Lớp hình bên phải là một canvas 2D vẽ lại ở mỗi khung hình, từ thời điểm `t` (giây của cả video). Tệp này nói phần riêng của chương: `signs.js`, `vehicles.js`, `street.js` và các mẫu cảnh trong `world.js` của ví dụ. Phần dùng chung (`beats.js`, `bench.js`, `draw.js`, `timeline.js`) có tài liệu ở `.claude/skills/chuong-4-cau-tao-va-sua-chua-video/references/bench.md` §2 và §5; đọc hai mục đó trước.

## 1. Nguyên tắc và toạ độ

- Canvas 1920 × 1080. Cột chữ chiếm bên trái tới x ≈ 640; **mọi thứ của canvas nằm trong x 690–1880**. Phụ đề chiếm y > 896: không đặt chữ hay dấu ✓/✕ dưới y = 880.
- Hình là hàm thuần của `t`: không `Math.random`, không `Date.now`, không trạng thái giữ giữa hai lần vẽ. Xe đứng ở đâu là do `track([[t, x], …])` trả về.
- **Mọi thay đổi có một mốc lấy từ lời đọc.** Không viết số giây bằng tay trong `world.js`; mốc nào cũng là `B.fN.<tên>` của `beats.js`, cộng trừ vài phần mười giây khi cần.
- Mỗi lúc chỉ **một thứ sáng** (một lớp của biển, một xe, một dấu). Thứ vừa nói xong dịu lại.
- Chỉ vẽ điều bài có kết luận. Xe không được bài nhắc tới ở một biển thì không chạy tới biển đó.

Ba bố cục đã dùng ở Bài 1 (hằng ở đầu `world.js` của ví dụ):

| Bố cục | Hằng | Dùng cho |
|---|---|---|
| Một biển trên phố | `G=820` mặt đường, `PX=960` cột biển, `SY=295` tâm biển, `SR=130` bán kính, `KV=0.7` cỡ xe, `STOP=900` vạch dừng | mở, tả biển, biển đứng gác, khung cuối |
| Hai cổng | `GATE=[800,1400]`, `GY=320`, `GR=105` | hai biển dễ lẫn đứng cạnh nhau |
| Phố xếp chồng | `RY=[300,550,800]` mặt đường của ba phố, `MX=1240` cột biển, `MR=58`, `MK=0.6`, `LINE=1196` vạch dừng, `ROW0=690`, `ROW1=1870` | bảng "xe nào ở biển nào" |

Xe chạy từ trái sang phải; vạch dừng nằm ngay trước cột biển. Bên trái vạch là "chưa qua biển", bên phải là "đã đi vào".

## 2. `beats.js`

Hợp đồng như chương IV (`bench.md` §2): `buildBeats(K)` trả về `{ T, E, total, f1: {...}, f2: {...}, … }`, mỗi mốc là `K.at(n, "cụm từ")`, cụm từ viết đúng như lời đọc. `cueKit` ném lỗi khi không tìm thấy cụm từ; cụm lặp lại trong khung thì thêm `{ nth: 2 }` hoặc `{ after: "…" }`.

Đặt tên mốc theo việc hình làm tại đó: `rim`, `pic`, `slash` (lớp sáng), `arrive`, `ask` (xe tới, dấu hỏi), `ban`, `go` (dấu ✕, ✓), `flip` (đổi hình). `build-frames.mjs` và `build-storyboard.mjs` dùng lại đúng các mốc này, nên chữ, hình và storyboard không lệch nhau.

## 3. Bảng màu

| Vai | Màu | Ở đâu |
|---|---|---|
| Biển | `SIGN.red #D62828`, `SIGN.white #FBFBF6`, `SIGN.black #16171C`, cột `SIGN.pole` | `signs.js`. Màu của biển là kiến thức: không đổi theo ý thích, không tô sáng bằng cách đổi màu (dùng `lit`) |
| Được đi | `OK #34D399` (dấu ✓), chữ `GREEN #7FE3BD` | `vehicles.js`, `street.js` |
| Bị cấm | `NO #F0544F` (dấu ✕), chữ `RED #FF9C98` | |
| Còn phân vân, rào đón | `AMBER #FBBF24` | dấu hỏi, nhãn "Có thể hiểu lý do như sau" |
| Chữ | `INK` chính, `SOFT` tên xe, `MUTE` nhãn phụ | |
| Xe | thân `BODY #E9EBF7`, kính `GLASS`, lốp `TYRE` | xe không tô màu riêng: màu chỉ dùng để nói ✓/✕ (`tone`) |

Đỏ của biển và đỏ của dấu ✕ là hai màu khác nhau có chủ ý: biển là vật thật, dấu ✕ là lời giảng.

## 4. Cách tấm biển "diễn"

Mỗi phần của video chọn một cách theo việc bài đang làm. Tên hàm ở cột cuối là hàm trong `world.js` của ví dụ: chép cả hàm rồi sửa, đừng viết lại từ đầu.

| Bài đang làm gì | Tấm biển làm gì | Dựng bằng | Ví dụ |
|---|---|---|---|
| Hỏi câu mở đầu | Cột mọc lên (`post` với `rise`), bốn lớp ghép vào theo lời tả (`show`), xe tới vạch, dấu hỏi | `street()`, `post`, `put`, `unsure` | `opening` (khung 1) |
| Dạy cách đọc | **Tách lớp:** biển rời cột, phóng to, bốn lớp đứng cạnh nhau; lớp đang đọc sáng (`lit`) và có nhãn bên dưới | `sheets(c, x, y, R, kind, { spread, lit })`, `label`, `under` | `layers` (khung 2–3) |
| Định nghĩa tên gọi | Các ô nhóm xe; từng xe lăn vào đúng ô khi tên được đọc; hai ô dễ lẫn có dấu "khác nhau" | `panel`, `put`, `notSame` | `names` (khung 4–6) |
| Đọc dòng Chốt của cách đọc | Biển ghép lại, từng lớp sáng lại theo câu | `sign` với `lit` | `chot` (khung 7) |
| Nói biển cấm ai | **Đứng gác:** xe xếp hàng nhỏ, từng xe tới vạch nhận ✕ (đỏ, dừng) hoặc ✓ (xanh, đi qua); lý do là dòng chữ cạnh xe | `put` + `track`, `verdict`, `note`, `tone` | `gate` (khung 8–11) |
| Sang biển khác cùng dáng | **Đổi hình trên cột:** biển lật quanh cột, hình cũ mờ thành hình mới | `sign` với `flip` và `swap` | `gate` (khung 12) |
| So hai biển dễ lẫn | **Hai cổng:** hai cột cạnh nhau, cùng một xe thử lần lượt | `post` × 2, `GATE`, `wayLabel` | `gate` (khung 13–14) |
| Bảng "xe nào ở biển nào" | **Phố xếp chồng:** mỗi biển một con phố; tiêu đề "BỊ CẤM" bên trái vạch, "ĐƯỢC ĐI" bên phải; xe dừng lại hay đi qua | `band`, `headers`, `caption`, `ride`, `mark`, `reason` | `matrixA`, `matrixB` (khung 15–21) |
| Chi tiết quyết định nghĩa | **Phóng to** một biển trong bảng, rồi thu về | `closeUp(t, i, kind, tin, tout, draw)` | `matrixB` (khung 18–20) |
| Xe đổi trạng thái (tháo rơ moóc) | Xe tách làm hai phần, dấu ✕ đổi thành ✓ | hai `put` với hai `track`, `verdict` có `to` | `matrixB` (khung 20) |
| Nhắc lại | Biển trên cột; ba thẻ bước có số chỉ vào viền, hình và xe đang chờ | `stepTag` | `closing` (khung 22) |

Quy ước chung:

- **Xe bị cấm dừng trước vạch và ở lại đó**, tô đỏ nhạt (`tone: -1`), dấu ✕ trên nóc. **Xe được đi chạy qua cột biển** rồi mới nhận ✓ (`tone: +1`). Người xem đọc được kết luận từ vị trí của xe, kể cả khi tắt tiếng.
- Dấu ✓/✕ bật đúng chữ "cấm", "được đi" của lời đọc, không bật khi xe vừa tới.
- Khi câu Chốt nhắc lại một xe đã có dấu, dấu nảy lại (`bumps: [mốc]`) thay vì hiện lần nữa.
- Chuyển cảnh trong canvas là mờ chéo 0,6 giây của `scene(t, T(a), T(b), fn)`. Hai cảnh liên tiếp dùng chung biển thì đặt biển cùng toạ độ ở cuối cảnh trước và đầu cảnh sau, để mờ chéo không làm biển nhảy.
- Trong phố xếp chồng, vạch dừng cao 7 (`stopLine(c, x, y, a, 7)`); cao hơn thì đè lên bánh xe.

Khung của `draw(t)`:

```js
function draw(t) {
  sky(c);
  scene(t, T(1), T(2), opening);
  scene(t, T(2), T(4), layers);
  // …
  scene(t, T(22), total, closing);
}
return createBench({ c, total, beats: B, draw });
```

## 5. API của `kit/`

### `signs.js`

Hiện chỉ có **biển cấm hình tròn**: nền trắng, viền đỏ, hình đen, gạch chéo đỏ từ trên trái xuống dưới phải.

| Tên | Việc |
|---|---|
| `SIGN`, `RIM = 0.78`, `SLASH = 0.13` | Màu; mép trong của viền và bề dày gạch chéo, tính theo bán kính |
| `PICTURES` | Hình bên trong: `carFront` (ô tô con nhìn từ phía trước), `motoRider` (người đi xe mô tô), `truck` (xe tải), `busOverTruck` (xe khách xếp trên xe tải), `truckTrailer` (xe tải kéo rơ moóc). Mỗi hình là hàm `(c, ink, gap)` vẽ trong vòng tròn đơn vị, xe quay đầu về bên trái |
| `sheet(c, part, R, kind, { alpha, lit, loose })` | Một lớp tại gốc toạ độ: `"plate"`, `"rim"`, `"picture"`, `"slash"`. `loose` cho lớp đứng riêng một tấm nền mờ |
| `sign(c, x, y, R, kind, { alpha, show, lit, swap, flip, slash })` | Cả biển. `show: { rim: 0..1, … }` độ hiện của từng lớp; `lit: { picture: 0..1 }` lớp nào sáng; `swap: [hình khác, 0..1]` mờ chéo hình; `flip` (1 → 0 → 1) lật quanh cột; `slash: false` bỏ gạch chéo |
| `SHEETS`, `sheets(c, x, y, R, kind, { spread, gap, lit, show, alpha })` | Bốn lớp kéo rời theo hàng ngang: `spread` 0 là một biển, 1 là bốn lớp cách nhau `gap`. Trả về vị trí từng lớp để đặt nhãn |
| `pole(c, x, y0, y1, alpha, w)` | Cột biển |

### `vehicles.js`

| Tên | Việc |
|---|---|
| `SIZE`, `len(kind, k)`, `tall(kind, k)` | Kích thước `[dài, cao]` ở cỡ 1: `moped` (xe gắn máy), `moto2` (mô tô hai bánh), `trike` (mô tô ba bánh chở hàng), `car`, `bus`, `truck`, `trailer` (rơ moóc), `amb` (cứu thương), `fire` (chữa cháy), `walker` (người đi bộ) |
| `vehicle(c, kind, x, y, k, { alpha, roll, tone, dim, beacon, bar })` | Một xe: `x` là đuôi xe, `y` là mặt đường, xe quay đầu sang phải. `roll` quãng đã lăn (bánh quay), `tone` +1 xanh / −1 đỏ, `dim` làm mờ, `beacon` đèn ưu tiên, `bar` thanh kéo của rơ moóc |
| `badge(c, ok, x, y, r, a, bump)` | Dấu ✓ hoặc ✕ trong vòng tròn |
| `nameplate(c, lines, x, y, { size, alpha, color, gap })` | Tên xe dưới xe, một hay nhiều dòng |
| `ask(c, x, y, r, a, color)` | Dấu hỏi |

Tên xe trên hình viết đúng tên của bài ("xe mô tô hai bánh", không viết "xe máy" trừ khi bài đang nói về cách gọi hằng ngày).

### `street.js`

| Tên | Việc |
|---|---|
| `INK, MUTE, SOFT, AMBER, GREEN, RED` | Màu chữ |
| `sky(c)` | Nền trời chạng vạng, gọi đầu `draw` |
| `ground(c, y, x0, x1, { alpha, grow, band })` | Mặt đường; `grow` 0→1 cho đường dài ra |
| `stopLine(c, x, y, alpha, h)` | Vạch dừng |
| `houses(c, y, alpha)` | Dãy nhà mờ phía sau |
| `track([[t, x], …])` | Vị trí theo mốc, có giảm tốc; đứng yên ngoài khoảng |
| `put(c, t, kind, k, y, at, o)` | Đặt một xe; `at` là số hoặc `track`. `o`: `from`, `to`, `name`, `nameDy`, `nameX`, `nameA`, `nameColor`, `size`, `tone`, `dim`, `beacon`, `bar`, `alpha`. Trả về `{ x, cx, top, front, a }` để đặt dấu và chữ |
| `verdict(c, t, ok, x, y, t0, { r, to, bumps, alpha })` | Dấu ✓/✕ bật tại `t0`, nảy lại ở các mốc `bumps`, tắt tại `to` |
| `post(c, x, y, R, kind, G, { rise, alpha, w, …tuỳ chọn của sign })` | Biển trên cột; `rise` cho cột mọc lên |
| `note(c, s, x, y, { color, alpha, size, align })` | Dòng lý do cạnh một dấu |
| `stepTag(c, n, s, x, y, tx, ty, { alpha, lineA })` | Thẻ bước có số và đường chỉ tới `(tx, ty)` |
| `wayLabel(c, s, x, y, dir, color, { alpha, size })` | Nhãn có mũi tên hướng |

Dừng một xe đúng vạch: `stopAt(kind, k, front) = front - len(kind, k)` (trong `world.js` của ví dụ), rồi `track([[tới − 1.6, điểm xuất phát], [tới, stopAt(…)]])`.

## 6. Thêm biển, hình và xe mới

Làm trong dự án trước (sửa bản chép trong `assets/lib/world/`), bài xong thì chuyển về `kit/` (SKILL.md, "Sau khi xong").

**Trước khi vẽ:** đọc lời tả biển trong bài, rồi Read ảnh tham khảo `images/crops/cau-<số>.jpg` (tra số ở `DOI-CHIEU.md`). Ảnh chỉ để soát hình; không đưa ảnh vào video, không đưa số câu vào đâu cả.

**Hình bên trong mới** (biển vẫn tròn viền đỏ):

1. Viết một hàm `(c, ink, gap)` trong `signs.js`, vẽ trong vòng tròn đơn vị, giữ hình trong bán kính khoảng 0,5 để không chạm viền. `ink` tô hình, `gap` tô các khe (cửa kính, khe giữa hai xe). Dùng `box`, `dot`, `poly`, `limb` có sẵn trong tệp.
2. Thêm vào `PICTURES`. Từ đó `sign`, `sheets`, `post` nhận tên mới.
3. Hình xe quay về bên nào thì theo ảnh tham khảo. Con số hay chữ trên biển vẽ bằng `text` của `draw.js`, đúng chuỗi ký tự của bài.

**Dáng biển mới** (tam giác, vuông, chữ nhật, nền xanh lam, nền xanh lá): `sheet` hiện vẽ cứng hình tròn. Thêm một bảng dáng, mỗi dáng tự vẽ các lớp của nó, và cho `sheet` chọn theo `kind`:

- Mỗi biển vẫn là **các lớp tách được**: nền, viền, hình, và lớp thứ tư nếu có (gạch chéo, dải vạch hết lệnh, biển phụ). Cách "tách lớp" ở §4 dựa vào điều này.
- Giữ nguyên chữ ký của `sign`, `sheets`, `post`, để `world.js` của các bài đã làm không phải sửa.
- Thêm màu vào `SIGN` (vàng của biển nguy hiểm, xanh lam, xanh lá), không viết mã màu rải rác.
- Biển không có gạch chéo: đã có `slash: false`.

**Xe mới:** thêm `[dài, cao]` vào `SIZE` và một hàm vào `DRAW` của `vehicles.js` (`(c, B, a, o)`: `B` là màu thân đã tính `tone`, `a` góc quay bánh). Vẽ với đuôi xe ở x = 0, mặt đường ở y = 0, đầu xe sang phải; dùng `wheel` có sẵn.

**Góc nhìn mới** (phố nhìn từ trên cho rẽ, quay đầu, vượt, làn đường, vạch kẻ): chưa có trong `kit/`. Viết trong `world.js` của bài, dùng `path.js` của bộ chương VI (có sẵn trong dự án sau `new-project.sh`) cho đường cong của xe; xong bài thì tách phần dùng lại được thành một tệp mới trong `kit/assets/lib/world/` và thêm một mục vào tệp này.

**Sau khi thêm:** chạy `node scripts/bench-shots.mjs` ở vài mốc có thứ mới và đọc ảnh, đặt cạnh ảnh tham khảo. Sau khi chuyển về `kit/`, kiểm theo `qa.md` §3 rằng ví dụ Bài 1 vẫn dựng ra đúng như cũ.
