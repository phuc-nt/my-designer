# Bàn vẽ: toạ độ, màu, cue, API và cách thêm hình

Cả bài là **một canvas 1920×1080** trong `compositions/world.html`, vẽ lại từ đầu cho mỗi thời điểm `t` bằng `createWorld({ canvas })` của `assets/lib/world/world.js`. Cùng `t` luôn cho cùng hình, nên tua, chụp hay render theo thứ tự nào cũng được. Các khung trong `compositions/frames/` là khung rỗng (`build-frames.mjs`), chỉ để mang độ dài, giọng và SFX.

| Tệp | Của ai | Sửa khi |
|---|---|---|
| `path.js`, `stage.js` | engine chung (kit chuong-6) | không sửa ở đây |
| `draw.js`, `bench.js`, `counting.js`, `zoo.js` | `kit/` của skill | thêm đồ vật, nơi chốn, công cụ dùng cho nhiều bài (§6) |
| `beats.js`, `world.js` | từng bài (chép từ ví dụ) | mỗi bài |

## 1. Toạ độ, cỡ, đọc được trên điện thoại

- Gốc (0, 0) ở góc trên trái, y đi xuống. `W = 1920`, `H = 1080` (`bench.js`).
- Không có phụ đề, nên không có vùng cấm ở dưới. Bàn tay đi lên từ mép dưới: chừa chỗ dưới đồ vật cho cánh tay, và đặt đồ vật đếm trong khoảng y 250–850.
- Một đồ vật vẽ bằng `thing(c, kind, x, y, s)` có đầu bán kính khoảng `s` pixel; `META[kind]` cho biết vòng và bong bóng đặt ở đâu (§4).

Trên iPhone, 1920 pixel thành khoảng 390 điểm (chia 5). Cỡ dưới đây đã dùng ở Bài 1 và còn đếm được trên điện thoại; **đừng vẽ nhỏ hơn**:

| Thứ | Cỡ ở Bài 1 | Tối thiểu |
|---|---|---|
| Con vật đang được đếm | sư tử 66, khỉ 76–80, ngựa vằn 142 | `s` 66 |
| Đồ vật nhỏ (hạt lạc, quả cam) | hạt lạc 46–56, cam 64 | `s` 46 |
| Bong bóng tiếng đếm | `s` 0.8–1.5 | 0.8 |
| Nét vòng, vòng ôm nhóm | `w` 8, `groupLoop` 9 | 6 |
| Chữ số chính, trên `schoolCard` 440×560 | `h` 300 | |
| Chữ số nhỏ (số của chuồng ở khung 21–22) | `h` 72 | 72 |
| Dấu gạch chéo | `r` 30 | |

Mười đồ vật trên một hàng: cách nhau ít nhất `2.2 × s × META.rx` để vòng không chạm nhau. Con kiến 34 của khung 11 nhỏ có chủ ý, và có kính lúp phóng to đi kèm.

## 2. Màu và nghĩa

`PAL` trong `draw.js`. Màu có nghĩa thì giữ nghĩa ở mọi bài; không dùng chúng để trang trí.

| Tên | Mã | Nghĩa |
|---|---|---|
| `count` / `countSoft` | #0EA5A0 / #CDEFEC | đã đếm: vòng, gợn sóng, bong bóng, vòng ôm nhóm |
| `miss` | #F59E0B | bị sót, câu hỏi: vòng nét đứt, dấu "?" |
| `extra` | #E5484D | thừa, sai: vòng thứ hai, bong bóng viền đỏ, dấu gạch chéo |
| `pencil` | #5E5A70 | vạch đánh dấu, đường đi trên tranh |
| `digit` | #6D28D9 | chữ số (chỉ chữ số) |
| `ink`, `mute` | #3B3355, #8A84A0 | viền; bàn tay mờ "không làm thế" |
| `dot` | #2F6FEB | chấm của khung mười ô; khối "có" của thanh mười khối (từ Chương 1 Bài 2) |
| `lid` | #9C6B43 | tấm che nâu của trò nhìn nhanh; không mang nghĩa đếm |
| `paper`, `sky`, `grass`, `grass2`, `soil` | | nền, vườn thú |
| `table`, `tableEdge`, `card`, `rule`, `margin` | | phòng có bàn, tờ giấy, thẻ, kẻ dòng |

Thanh mười khối dùng khối `dot` cho phần "có" và khối trắng (`card`) cho phần "không", như chấm và ô trống. Không dùng xanh lá hay cam như sách: hai màu ấy gần xanh ngọc (đã đếm) và hổ phách (sót). Lời đọc gọi là "khối xanh" và "khối trắng".

Màu mới cho Chương 2 (hai phần của một nhóm) thêm vào `PAL` theo §6.

## 3. Cue: `beats.js`

`beats.js` biến lời đọc thành các mốc giây mà hình phản ứng theo. Mỗi khung một nhóm (`f1`, `f2`, …). Tên mốc là ý của nó (`f9.is`, `f13.messy`), không phải chữ được đọc.

| Hàm | Trả về | Ghi chú |
|---|---|---|
| `T(n)`, `E(n)` | giây bắt đầu, kết thúc của khung n | |
| `at(n)(phrase, { nth, end, d })` | giây cụm từ bắt đầu (`end: true`: kết thúc), cộng `d` | `nth`: lần thứ mấy cụm ấy được đọc trong khung |
| `wAt(n, phrase, idx, nth)` | giây của từ thứ `idx` trong cụm | `wAt(3, "nói một", 1)`: chữ "một" sau chữ "nói" |
| `seq(n, "một hai ba", from)` | mảng giây của từng tiếng đếm, theo thứ tự đọc, từ `from` trở đi | `f6.c = seq(6, "một hai ba bốn", a6("lần"))` |

- Cụm từ viết đúng như lời đọc trong SCRIPT.md, chữ thường hay hoa đều được; dấu câu bị bỏ khi so.
- Không tìm thấy thì báo lỗi ngay: `cue not found: frame 3 "nói một" #1` (từ `at`, `wAt`) hay `count not found: frame 6 "bốn" after 81.2` (từ `seq`). Thường do whisper nghe khác chữ kịch bản; xem `qa.md` §2.
- Mỗi lần align lại giọng, chạy lại `count-onsets.mjs` và `build-cues.mjs`; `beats.js` không cần sửa nếu chữ không đổi.

## 4. API

### `bench.js`: màn hình, công tắc, nơi chốn

- `vis(t, a, b = 1e9, e = 0.3)`: 0 → 1 sau `a`, về 0 sau `b`. Dùng làm alpha.
- `gate(t, a, b)`: một hình chiếm màn hình từ `a` tới `b`.
- `zoo(c, t)`: vườn thú (trời, đồi, cỏ, mây trôi theo `t`). `room(c)`: phòng có bàn. `desk(c)`: mặt bàn có tranh in.
- `createBench({ c, total, beats, draw })`: tô nền giấy rồi gọi `draw(t)`. `world.js` trả về đúng cái này.

### `counting.js`: bàn tay, bút, bong bóng, vòng

`const { handTrack, drawHand, prog, penTrack, drawPen, inks, bubbleAt, ringAt, herd, arrowLine, confetti, scene } = createCounting(c);`

| Hàm | Dùng |
|---|---|
| `handTrack({ tIn, tOut, taps, lead, hold, rel, move, color })` | đường đi của bàn tay. `taps: [{ t, x, y, hold, arc, move, color }]`; `(x, y)` là đầu ngón tay; tay vào từ dưới, ra lại phía dưới |
| `drawHand(t, track, alpha, dx)` | vẽ tay và gợn sóng mỗi lần chạm; trả `{ x, y, press, ang }` hay `null` |
| `bubbleAt(t, { t, x, y, s, tail, until, mark, marks, edges, fly, bumps })` | bong bóng sóng âm bật ra ở `t`. `mark: "?"`; `marks: [[t, m]]` đổi dấu theo thời gian; `edges: [[t, color]]` đổi viền; `fly: [[t0, t1, x, y, s, tail]]` bay tới chỗ mới; `bumps`: những lúc nảy lên; `until`: lúc tắt |
| `ringAt(t, { t, x, y, rx, ry, color, dash, w, until, bumps })` | vòng quanh một đồ vật, vẽ dần trong 0,3 s |
| `herd(t, kind, pts, s, { t0, stagger, sway, hop, bumps, alpha })` | cả một nhóm đồ vật hiện lần lượt, đung đưa nhẹ |
| `penTrack({ tIn, tOut, strokes })`, `drawPen(t, track)`, `inks(t, strokes)` | bút chì. `strokes: [{ t0, t1, pts, ease, ink: { color, w, dash }, until, bumps }]`. `inks` vẽ nét mực, `drawPen` vẽ cây bút ở đầu nét |
| `prog(stroke, t)` | tiến độ 0..1 của một nét (dùng cho `writeNumber`) |
| `arrowLine(pts, p, { color, w, dash, alpha, head })` | đường có mũi tên, vẽ tới tiến độ `p` |
| `confetti(t, t0, origins)` | 30 ngôi sao, khung kết |
| `scene(t, a, b, fn)` | gọi `fn(t)` với độ mờ của một cảnh từ `a` tới `b` (lấn 0,3 s mỗi đầu) |

Ngoài ra `bumpAt(t, list, d)` (nảy ở mỗi mốc trong `list`) và `fadeOut(t, until)`.

### `zoo.js`: đồ vật và nét vẽ

- `thing(c, kind, x, y, s, { alpha, rot, flip })`: một đồ vật kiểu sticker (bóng, viền trắng, màu). Có sẵn: monkey, zebra, lion, giraffe, elephant, tiger, crocodile, bear, gorilla, snake, ant, peanut, orange.
- `META[kind] = { cy, rx, ry, top, bot }`: tâm và bán kính vòng, đỉnh và đáy đồ vật, theo đơn vị `s`. Vòng đặt ở `(x, y + cy·s)` với `rx·s`, `ry·s`; bong bóng treo trên `y + top·s`; ngón tay chạm ở `y + bot·s` hay giữa thân.
- `hand`, `pencil`, `bubble`, `ring`, `ripple`: phần vẽ thô mà `counting.js` dùng.
- `badge(c, x, y, r, color, glyph)` (dấu "?" tròn), `tick`, `cross(c, x, y, r, p)`.
- `boxPoints(x0, y0, x1, y1, r)`: đường viền chữ nhật bo góc thành điểm, để `polyline` vẽ dần. `groupLoop(c, x0, y0, x1, y1, p, { color, fill, w })`: vòng ôm cả nhóm.
- `numberStrokes(str, cx, cy, h)`: các nét của một số (0–10), theo thứ tự viết. 4 có hai nét; 10 là nét của 1 rồi nét của 0. `writeNumber(c, str, cx, cy, h, p)` vẽ số tới tiến độ `p`.
- `schoolCard`, `pictureCard`, `tableTop`, `tree`, `star`.

### `tenframe.js`: khung mười ô, chấm, tấm che, thanh mười khối

Có từ Chương 1 Bài 2. Một khung là `f = { x, y, cell, t0, until, bumps, lit }`: tâm khung và cỡ một ô. Ô `k` (0..9) ở hàng `ROW(k)`, cột `COL(k)`.

- `cellXY(f, k)`: tâm ô k. `firstCells(n, from = 0)`: các ô của n chấm đầu. `cellsOutline(f, cells, pad)`: đường viền quanh một tập ô (mỗi hàng một đoạn). `cubeXY(bar, k)`: tâm khối k.

`const TF = createTenFrame(c);`

| Hàm | Dùng |
|---|---|
| `TF.board(t, f)` | thẻ trắng, bóng, lưới, viền; `lit: [{ t, until, cells, color, a }]` tô sáng ô. Bật ra ở `f.t0`; trả độ mờ |
| `TF.dotsAt(t, f, dots)` | chấm bán kính 0,34 ô. `dots: [{ k, t, from: [x, y], d, arc, moves: [[t0, t1, k]], until, color, bumps }]`; có `from` thì bay vào và để lại gợn sóng; `moves` trượt sang ô khác |
| `TF.dot(x, y, r, { alpha, color })` | một chấm sticker đứng riêng |
| `TF.cellLoop(t, f, { t, d, cells, color, w, pad, dash, until, bumps, fill })` | vòng ôm một tập ô, vẽ dần trong `d`; `pad` âm thì nằm trong ô |
| `TF.lid(t, f, { t0, opens: [[t0, t1]], off, until })` | tấm che: nhấc lên trong mỗi khoảng `opens`, bay hẳn đi ở `off` |
| `TF.bar(t, { x, y, size, t0, stagger, n, steps: [[t, n]], until, bumps: [[t, k0, k1]] })` | mười khối liền; n khối đầu màu `dot`, còn lại trắng; `steps` đổi n theo thời gian |

Thứ tự vẽ một khung: `board`, `dotsAt`, `cellLoop`, `lid`. Mẫu cảnh ở `examples/bai-02-khung-muoi-o/assets/lib/world/world.js`.

### `draw.js`

`PAL`, `FONT`, `font(size, weight)`, `rgba(hex, a)`, `mix(a, b, t)`, `hash(i, k)` (số giả ngẫu nhiên cố định), `TAU`, `rr` (chữ nhật bo góc), `disc`, `glow`, `polyline(c, pts, p)`, `along(pts, p)`.

Từ engine (`path.js`): `clamp`, `lerp`, `smooth`, `seg(t, a, b)`, `win`, `easeOut`, `easeInOut`, `easeOutBack`, `pop`.

## 5. Mẫu cảnh trong ví dụ Bài 1

`draw(t)` gọi một cảnh cho mỗi đoạn khung: `scene(t, T(3), T(8), setB)`. Dữ liệu của cảnh (vòng, bong bóng, bàn tay) dựng **một lần** trong một IIFE (`Bz`, `Cz`, `Iz`), không dựng lại mỗi `t`.

| Cảnh | Khung | Mẫu đáng chép |
|---|---|---|
| A | 1–2 | bong bóng "?" mở đầu; một lần chạm làm mẫu |
| B | 3–7 | đếm đúng, rồi ba lỗi: sót (vòng `miss` nét đứt), đếm hai lần (vòng `extra` to hơn, bong bóng thứ hai `edges`), miệng nhanh hơn tay (bong bóng thừa bị `cross`) |
| C | 8–10 | bong bóng cuối bay tới thẻ tên bị gạch, rồi tới số của cả đàn, `groupLoop` ôm đàn; bàn tay mờ `PAL.mute` lắc và bị gạch (khung 10, "không cần đếm lại") |
| D | 11 | to và nhỏ: voi 190, kiến 34 và kính lúp; mỗi con một lần chạm, một bong bóng: to hay nhỏ cũng là một |
| E | 12 | đồ vật thật được gạt sang một bên khi đếm |
| F | 13 | tranh: đồ vật đứng yên; đường bút chì lộn xộn đi qua một hạt hai lần |
| G | 14 | hai cách: đọc từng hàng như đọc sách, hoặc gạch từng hạt đã đếm |
| H | 15–17 | cùng chín hạt, hai đường đếm khác nhau, cùng ra một số |
| I | 18–20 | đếm sư tử, bong bóng cuối bay lên, thẻ và chữ số viết bằng bút, rồi cả cảnh thu vào ba ô |
| J | 21–22 | mười chuồng 1 đến 10, `penLayout` xếp con vật theo `META` |
| K | 23 | nhắc lại bốn ý, pháo giấy |

Đoạn cần chép nhiều nhất:

```js
// helpers that place a tap, a ring and a bubble from the size of the thing (scene B)
const zt = (i, t, o) => ({ t, x: ZX[i], y: ZY + 0.5 * ZS, ...o });
const zr = (i, t, o) => ({ t, x: ZX[i], y: ZY - 0.08 * ZS, rx: 0.95 * ZS, ry: 1.36 * ZS, ...o });
const zb = (i, t, o) => ({ t, x: ZX[i], y: ZB, s: 1.15, tail: [ZX[i], ZB + 92], ...o });

// a count: one ring and one bubble per counting word, one hand for all the taps
const c = B.f18.c; // seq(18, "một hai ba bốn năm sáu bảy", ...)
const rings = c.map((tc, i) => ({ t: tc, x: LI[i][0], y: LI[i][1] + 3, rx: 98, ry: 98 }));
const hand = handTrack({ tIn: c[0] - 0.8, tOut: c[6] + 0.5, taps: c.map((tc, i) => ({ t: tc, x: LI[i][0], y: LI[i][1] + 0.5 * LS })) });

// the last bubble leaves its animal and becomes the number of the group
{ ...lastBubble, fly: [[f19.seven + 0.1, f19.seven + 1.0, 595, 212, 1.0, null]] }

// a digit written with the pencil on a card
const seven = { t0: f19.write, t1: f19.write + 2.0, pts: numberStrokes("7", 1500, 470, 300)[0], ease: easeInOut };
const pen = penTrack({ tIn: f19.write - 0.7, tOut: seven.t1 + 0.3, strokes: [seven] });
// in draw: schoolCard(c, 0, 0, 440, 560); writeNumber(c, "7", 0, 0, 300, prog(seven, t)); drawPen(t, pen);
```

Số có nhiều nét (4, 10): cho mỗi nét của `numberStrokes` một `{ t0, t1 }` nối tiếp nhau trong cùng `penTrack`, và đặt `t0`, `t1` của số trong `writeNumber` là đầu nét đầu, cuối nét cuối.

Bàn tay mờ "không làm thế" (khung 10): một `handTrack` có `color: PAL.mute`, vẽ với `drawHand(t, ghost, 0.5, shake)`, rồi `cross` lên nó.

Cả cảnh thu nhỏ vào một ô (khung 20): `c.save(); c.translate(lerp(x0, x1, e), lerp(y0, y1, e)); c.scale(k, k); c.translate(-x0, -y0); … c.restore();`.

## 6. Thêm đồ vật, công cụ, màu

### Một đồ vật mới (mèo, táo, hoa, vịt, ếch, khối…)

1. Thêm một hàm vào `KINDS` trong `kit/assets/lib/world/zoo.js`, vẽ ở cỡ đơn vị quanh (0, 0), đầu hay thân bán kính khoảng 1, nhìn thẳng mặt. Hàm nhận `p` (bút) và chỉ dùng:
   - `p.fill(build, color, { line })`: hình đặc có viền mực; là một phần của bóng và viền trắng.
   - `p.detail(build, color)`: màu tô lên trên, không viền, không thuộc bóng (mắt, má, vệt sáng).
   - `p.stroke(build, color, w)`: nét dày thuộc bóng (đuôi, cuống, thân rắn).
   - `p.line(build, color, w)`: nét mảnh trang trí (sọc, gân lá).
   - `p.clip(build, paint)`: tô trong một hình (sọc trong thân).
   - Hình dựng từ `C(x, y, r)`, `E(x, y, rx, ry, rot)`, `R(x, y, w, h, r)`, `all(...)`; mặt có `eye`, `smile`, `blush`, `tri`.
2. Thêm `META[kind] = { cy, rx, ry, top, bot }` ngay dưới.
3. Xem bằng `bench-shots` (một khung có đồ vật ấy) ở cỡ nhỏ nhất sẽ dùng.
4. Chạy kiểm dấu vân tay của Bài 1 (`qa.md` §5): thêm một kind không được đổi gì của Bài 1.

### Một công cụ mới cho nhiều bài

Khối và bậc thang, thẻ số có ô "?", đường nối từng cặp, sơ đồ tách gộp: mỗi thứ một module mới trong `kit/assets/lib/world/` (`cubes.js`, `partwhole.js`, …), cùng kiểu với `counting.js` và `tenframe.js` (đã có, §4):

- Một hàm `createX(c)` trả các hàm `xAt(t, spec)` thuần theo thời gian; dữ liệu dựng một lần, vẽ mọi `t`.
- Toạ độ, cỡ, mốc đều đến từ `spec`, không có số của một bài cụ thể trong module.
- Ghi lên đầu tệp một đoạn chú thích nói module vẽ gì và dùng thế nào, như các tệp kit khác.
- Khung mười ô điền hàng trên trước, trái sang phải; ô thứ k (0..9) ở hàng `k < 5 ? 0 : 1`, cột `k % 5`.
- Sơ đồ tách gộp: ba ô, hai đường nối từ ô cả nhóm tới mỗi ô phần, không nối hai ô phần; có tham số chiều (`whole: "top" | "left" | "right"`).

Bài đầu tiên cần công cụ thì làm nó trong `world.js` của bài, rồi chuyển vào kit khi bài đã duyệt (SKILL.md, "Sau khi xong" 2).

### Màu mới

Thêm vào `PAL` với tên theo nghĩa (`partA`, `partB`, `whole`, `dot`), không theo màu. Không trùng hay gần năm màu có nghĩa ở §2: hai phần của Chương 2 không được là xanh ngọc (đã đếm), hổ phách (sót), đỏ (thừa), xám bút chì hay tím chữ số. Một quy ước cho cả chương, chốt ở bài đầu tiên dùng nó (Chương 1 Bài 2 cho chấm, Chương 2 Bài 1 cho hai phần), rồi ghi vào bảng §2 này.
