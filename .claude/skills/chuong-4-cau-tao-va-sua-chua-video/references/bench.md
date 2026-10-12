# Bàn máy: hình vẽ chạy theo lời đọc

Nửa phải màn hình là một canvas 2D (`compositions/world.html`, lớp `el-world`, track 30). Mọi thứ trên đó do ba tệp của bài vẽ ra: `beats.js` (lúc nào), `world.js` (cái gì, ở đâu), `widgets.js` (các bảng riêng của bài). Các tệp của `kit/` cho sẵn bộ phận, nét vẽ và công tắc thời gian.

| Tệp trong `assets/lib/world/` | Từ đâu | Việc |
|---|---|---|
| `cues.js` | `node scripts/build-cues.mjs` | Mốc từng chữ của lời đọc. Không sửa tay, không `cat` cả tệp |
| `stage.js`, `path.js` | `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit` | `cueKit` (tìm mốc theo cụm từ) và các hàm toán (`smooth`, `seg`, `win`, `easeInOut`…). Tả ở `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/references/world.md` §4–§5 |
| `bench.js`, `draw.js`, `timeline.js`, `engine.js`, `car.js` | `kit/` của skill này | Dùng nguyên |
| `beats.js`, `world.js`, `widgets.js` | ví dụ Bài 1 | Viết lại cho bài |

## 1. Nguyên tắc và toạ độ

- **Hình là hàm thuần của thời gian.** `renderAt(t)` vẽ lại cả bàn máy từ nền trống cho bất kỳ giây `t` nào, và cùng `t` luôn ra cùng một hình. Không biến đếm giữa hai lần vẽ, không `Math.random`, không `Date.now`. Cần hạt li ti (khí, bụi) thì dùng `hash(i, k)` của `draw.js`.
- **Mọi thay đổi bám vào một cụm từ của lời đọc.** Không số giây viết tay: lấy mốc qua `beats.js`, rồi cộng trừ vài phần mười giây.
- Màn hình 1920×1080 (`W`, `H`). Cột chữ của lớp phủ chiếm x 64–620. **Bàn máy là `STAGE`: x 720–1860, tâm 1290.** Phụ đề nằm dưới y 896: **không vẽ gì dưới y 850** (nhãn thấp nhất của Bài 1 ở y 836).
- Dải trên cùng (y 78–214) dành cho một bảng chạy ngang: dải mắt xích, thanh các hành trình (`BAR` trong `widgets.js`). Hình chính nằm dưới dải đó.
- Chữ trên bàn máy từ 26 px trở lên (nhãn `tag` mặc định 28 px), để còn đọc được trên điện thoại.
- Nền (`backdrop`) do `createBench` tự vẽ trước mỗi lần `draw(t)`.

## 2. `beats.js`: kế hoạch thời gian

Một hàm `buildBeats(K)` nhận `K = cueKit(CUES)` và trả về mọi mốc mà bàn máy, lớp chữ và storyboard cùng dùng. Ba nơi đọc chung một nguồn, nên hình và chữ không lệch nhau.

```js
export function buildBeats(K) {
  const T = (n) => K.start(n), E = (n) => K.end(n);
  const a = (n, phrase, o) => K.at(n, phrase, o);
  const b = {
    f1: { tank: a(1, "Xăng"), still: a(1, "nằm yên"), ask: a(1, "lăn bánh"), engine: a(1, "động cơ") },
    f6: { def: a(6, "Bánh xe chủ động", { nth: 2 }) },      // lần thứ hai cụm từ xuất hiện trong khung
    f11: { j4e: a(11, "ra", { end: true }) },                // lúc chữ ấy đọc xong
    // … một mục cho mỗi khung
  };
  // … các đường chạy (xem dưới)
  return { ...b, T, E, total: K.total, crank, wheelAngle, carDist };
}
```

- `a(n, "cụm từ")` là giây tuyệt đối lúc cụm từ ấy bắt đầu được đọc trong khung `n`. Tuỳ chọn: `nth` (lần xuất hiện thứ mấy), `end: true` (lúc đọc xong), `d` (cộng thêm giây).
- Cụm từ phải có đúng như trong `SCRIPT.md`. Sai một chữ thì dừng với `cue not found: frame n "…" #nth`: sửa cụm từ, không đoán số giây. Sửa lời đọc của một khung thì tạo lại giọng khung đó rồi `align`, `pad`, `build-cues` (SKILL.md bước 4); các mốc tự đi theo.
- `T(n)`, `E(n)` là đầu và cuối khung `n`; `total` là độ dài video.
- Đặt tên mốc theo thứ được nói tới (`tank`, `burn`, `def`), không theo hiệu ứng.

**Đường chạy** là hàm của `t` cho một đại lượng chuyển động liên tục. Dựng bằng các điểm khoá `[giây, giá trị]` lấy từ mốc:

| Hàm | Ở | Dùng cho |
|---|---|---|
| `monotone(keys)` | `engine.js` | Đường cong không vọt quá và không chạy lùi. Hai khoá liền nhau cùng giá trị là một lần dừng hẳn. Bài 1 dùng cho số hành trình của trục khuỷu |
| `linear(keys)` | `timeline.js` | Đường gấp khúc; hai khoá cùng giây là một bước nhảy. Dùng cho tốc độ |
| `stepped(keys, ramp)` | `timeline.js` | Đi tới giá trị của mỗi khoá trong `ramp` giây (khoá có thể mang `ramp` riêng ở phần tử thứ ba). Dùng cho vị trí, tỉ lệ của một hình |
| `odometer(speed, total)` | `timeline.js` | Tích phân một đường tốc độ: góc bánh xe, quãng đường |
| `crossings(track, total, phase)` | `engine.js` | Những lúc một đường chạy đi qua giá trị `4k + phase`: mọi lần cháy của Bài 1 |

Trong Bài 1 trục khuỷu **chờ lời đọc**: nó dừng ở điểm chết cho tới khi tên của hành trình được đọc, rồi mới đi tiếp (`hold`, `key`, `next`, `fireAt`, `run` ở phần giữa `beats.js` của ví dụ). Cơ chế nào có các pha được gọi tên lần lượt cũng nên làm vậy: hình đợi chữ, không để chữ đuổi theo hình.

## 3. Bảng màu

Màu là nghĩa và giữ nguyên trong cả chương, trên bàn máy (`PAL` của `draw.js`) lẫn cột chữ (`TINT` của `frames.bench.mjs`).

| Nghĩa | Bàn máy | Cột chữ | Mã |
|---|---|---|---|
| Nhiên liệu | `PAL.fuel` | `pill(…, "fuel")`, lớp `§amber` | `#FBBF24` hổ phách |
| Không khí, khí mới | `PAL.air` | `"air"`, `§sky` | `#60A5FA` xanh da trời |
| Sức nóng | `PAL.heat` (ngọn lửa: `PAL.fire` `#F9541A`) | `"heat"`, `§heat` | `#FB923C` cam |
| Chuyển động, lực, sinh công | `PAL.work` | `"work"`, `§grn` | `#34D399` xanh lá |
| Khí đã cháy | `PAL.spent` | `§spent` | `#8D88B5` xám tím (trên chữ `#A9A4D0`) |
| Cách hiểu sai | `PAL.bad` | `"wrong"`, `§red` | `#F87171` đỏ |
| Thuật ngữ trung tính, viền thẻ định nghĩa | `PAL.line` | `"term"` | `#C4B5FD` tím nhạt |
| Kim loại, thân máy, khoang rỗng | `PAL.steel`, `PAL.iron`, `PAL.body`, `PAL.cavity` | | không mang nghĩa |
| Chữ | `PAL.ink`, `PAL.mute`, `PAL.dim` | | |

Quy tắc:

- Một màu chỉ một nghĩa. Thuật ngữ không thuộc nghĩa nào thì dùng tím nhạt, không mượn màu của nghĩa khác.
- **Thêm nghĩa mới** (dầu bôi trơn ở Bài 2, dòng điện ở Bài 5…): chọn một màu chưa dùng và đủ xa các màu trên, thêm khoá vào `PAL` của `kit/assets/lib/world/draw.js`, thêm cặp `[rgb, hex]` cùng tên vào `TINT` của `kit/scripts/frames.bench.mjs`, thêm một dòng vào bảng này, và ghi vào Notes của `BRIEF.md`. Thêm khoá không đổi hình của Bài 1; vẫn chạy phép kiểm ở `qa.md` §4.
- **Ký hiệu của xe (Bài 5, 7, 8) giữ màu của chính nó**, vì màu ấy là kiến thức: đỏ là nguy hiểm, vàng là cần kiểm tra, xanh lá là một chế độ đang bật. Ở các bài đó màu đỏ của ký hiệu sẽ gặp màu đỏ "cách hiểu sai": đánh dấu cái sai bằng dấu gạch chéo (`crossMark`, `LD.no`), không tô đỏ cả ký hiệu, và ghi cách phân biệt vào `BRIEF.md`. Chưa video nào gặp tình huống này.

## 4. Bộ phận có sẵn trong `kit/`

Mỗi bộ phận vẽ trong hệ toạ độ riêng của nó; đặt lên màn hình bằng `c.translate` và `c.scale` (§5).

### Động cơ (`engine.js`)

Mọi thứ theo một con số: **số hành trình `s`**. Góc quay của trục khuỷu là `π·s`; `s mod 4` cho biết đang ở hành trình nào (0 nạp, 1 nén, 2 cháy và giãn nở, 3 xả). Gốc toạ độ ở tâm trục khuỷu, y hướng xuống.

| Thứ | Dùng |
|---|---|
| `cycleState(s)` | Trạng thái của xi lanh tại `s` (hành trình, đã đi được bao nhiêu, độ mở của hai van, khí trong buồng). Trả về một đối tượng sửa được trước khi vẽ |
| `drawCylinder(c, st, o)` | Một xi lanh cắt dọc: pít tông, thanh truyền, trục khuỷu, hai van, chi tiết châm lửa, khí. `o.gas` 0..1 (0 là chỉ còn cơ cấu trần); `o.lit` = `{ piston, rod, crank, wall, valveIn, valveEx, chamber }`, mỗi mục `[alpha, màu]`; `o.push` = `{ dir: 1 xuống / -1 lên, color, a }` mũi tên trên mặt pít tông; `o.spin` 0..1 mũi tên vòng quanh trục khuỷu; `o.igniter` 0..1 (0 là ẩn chi tiết châm lửa, cho động cơ diesel); `o.ghost` 0..1 biến nó thành nét đứt; `o.tick` giây, cho khí chuyển động |
| `SPOT` | Điểm để nhãn chỉ vào: `valveIn`, `valveEx`, `igniter`, `portIn`, `portEx`, `wall`, `crank`; `top`, `bottom` là chiều cao của hình |
| `GEO`, `pinY(th)`, `crownY(th)`, `crankPin(th)`, `TOP`, `BOTTOM`, `HEAD` | Hình học, để đặt thêm thứ gì bám theo pít tông hay chốt khuỷu |
| `drawBank(c, s, o)`, `BANK` | Bốn xi lanh trên một trục khuỷu, có bánh đà, nhìn ngang. `o.lit` = `{ shaft, fly }`; `o.flashes` 0..1 độ sáng của các lần cháy. Thứ tự nổ không được gọi tên trên hình |
| `drawBore(c, x, y, w, h, pos, o)` | Một xi lanh thu nhỏ làm biểu tượng (trong bảng, trong ô). `pos` 0 là pít tông ở trên, 1 là ở dưới; `o.gas` = `[màu, alpha]`; `o.dir` mũi tên |
| `drawLeg(c, th, o)`, `legPoints(th)` | Chân người đạp xe: đầu gối lên xuống, đĩa xích quay. Phép so sánh của Bài 1 ý 1 |

### Chiếc xe (`car.js`)

Xe nhìn ngang, thân như bằng kính, mũi xe hướng sang phải. Gốc toạ độ trên mặt đường, giữa hai bánh; x về phía trước, y xuống.

| Thứ | Dùng |
|---|---|
| `drawCar(c, o)` | `o.s` số hành trình của động cơ trong mũi xe; `o.rear`, `o.front` góc bánh xe; `o.lit` = `{ tank, engine, line, rear, front, body }`; `o.flow` 0..1 lực chạy dọc đường truyền; `o.fuel` mức nhiên liệu; `o.tick` |
| `CAR` | Điểm neo: `engine`, `tank`, `shaft`, `rear`, `front`, `roof`, `driveline` (bốn điểm của đường truyền lực), bán kính bánh `r`, mép `left`, `right`, `top` |
| `drawWheel(c, x, y, r, angle, o)` | Một bánh xe; vạch trên lốp và nan hoa cho thấy nó đã quay bao nhiêu |
| `drawStands(c, h, a)` | Hai giá kê dưới sàn xe, lấp khoảng hở `h`. **Là giá kê, không phải cái kích của Bài 8** |
| `drawBrake(c, o)`, `BRAKE_GRIP` | Một bánh xe nhìn thẳng với phanh đĩa: `o.angle`, `o.grip` 0..1 má phanh kẹp vào, `o.heat` 0..1 đĩa nóng lên |

Xe được vẽ máy đặt trước, bánh sau chủ động. Bài không quy định điều đó: dùng lại thì ghi vào Notes của `BRIEF.md` như Bài 1.

## 5. Viết một hình trong `world.js`

`world.js` xuất `createWorld({ canvas })`. Bên trong: lấy mốc, dựng các đường chạy riêng của hình (vị trí, độ phóng), viết mỗi hình một hàm, rồi gọi chúng theo thứ tự trong `draw(t)`.

```js
export function createWorld({ canvas }) {
  const c = canvas.getContext("2d");
  const K = cueKit(CUES), B = buildBeats(K), { T, E, total } = B;
  const { f5 } = B;
  const LEG = { x: 1560, y: 690, k: 1.15 };          // chỗ đứng của hình: tâm và tỉ lệ

  function legPicture(t) {
    const a = vis(t, f5.bike + 0.3, T(6) - 0.5);     // có mặt từ lúc đọc "Chân người" tới gần hết khung 5
    if (a <= 0.004) return;
    const th = Math.PI * B.crank(t), { x, y, k } = LEG, L = legPoints(th);
    const kn = vis(t, f5.knee, T(6) - 0.5), rg = vis(t, f5.ring, T(6) - 0.5);
    c.save();
    c.globalAlpha *= a;
    c.save();
    c.translate(x + 30 * (1 - a), y);                // trượt vào 30 px khi hiện
    c.scale(k, k);
    drawLeg(c, th, { lit: { knee: [kn, PAL.ink], ring: [rg, PAL.work] } });
    c.restore();                                     // nhãn vẽ ngoài phép co giãn, để cỡ chữ không đổi
    tag(c, "đầu gối", 1770, 330, x + L.knee[0] * k + 8, y + L.knee[1] * k - 14, { alpha: kn });
    tag(c, "đĩa xích", 1770, 836, x + 44 * k, y + 30 * k, { color: PAL.work, alpha: rg });
    c.restore();
  }

  function draw(t) {
    // … hình chính trước, bảng và nhãn sau
    legPicture(t);
  }
  return createBench({ c, total, beats: B, draw });
}
```

Cách làm lặp lại ở mọi hình:

- **Một công tắc 0..1 cho mỗi thứ xuất hiện**, tính từ mốc, rồi nhân vào `alpha` hay đưa vào `lit`. Không `if (t > …)` bật tắt tức thì: thứ gì cũng hiện và tắt dần trong khoảng 0,3 giây.
- **Thoát sớm** khi công tắc của cả hình gần 0, để hình không còn trên bàn máy thì không tốn công vẽ.
- **Bộ phận vẽ trong `save / translate / scale / restore`; nhãn vẽ sau `restore`** bằng toạ độ màn hình. Đổi một điểm của bộ phận ra màn hình bằng `S(P, điểm)`.
- **Làm sáng đúng thứ đang được đọc** qua `lit`: `[alpha, màu]`, màu theo nghĩa ở §3.
- **Hai hình không chồng nhau.** Hình thứ hai vào thì hình thứ nhất dời sang trái (`stepped` cho `x`, `y`, `k`: `P0` đứng một mình, `PL` có bảng bên cạnh, `PB` có hình thứ hai bên cạnh), hoặc tắt hẳn bằng `gate`.
- Thứ tự gọi trong `draw(t)` là thứ tự lớp: hình chính, hình phụ, bảng, rồi tới nhãn và bong bóng.

### Công tắc và khung (`bench.js`)

| Hàm | Trả về |
|---|---|
| `vis(t, a, b = ∞, e = 0.3)` | 0..1: hiện từ `a`, tắt sau `b`, mỗi đầu `e` giây |
| `gate(t, a, b)` | 0..1 cho một hình giữ bàn máy từ `a` tới `b`: vào sau `a`, ra trước `b` |
| `litSeq(t, cues, tail = 1.6)` | Mảng 0..1: mỗi mốc sáng tới khi mốc sau được đọc. Dùng cho một danh sách được đọc lần lượt |
| `at(arr, i, d = 0)` | Phần tử thứ `i` của một mảng trạng thái, hay `d` khi mảng ngắn hơn |
| `S(P, p)` | Điểm `p` của hình đứng ở `P = { x, y, k }`, tính ra điểm ảnh màn hình |
| `convRow(c, cx, y, from, to, aFrom, aTo, bump)` | "Thứ này biến thành thứ kia": hai tấm tên và một mũi tên. `from`, `to` = `[tên, màu]` |
| `backdrop(c)` | Nền của bàn máy |
| `createBench({ c, total, beats, draw })` | `{ ready, total, renderAt, beats }`: thứ `world.html` cần |
| `W`, `H`, `STAGE`, `CARD` | Kích thước, vùng vẽ, màu nền của một bảng |

Thêm của `timeline.js`: `inside(t, a, b)`, `on(list, t)` (bật trong các khoảng `[từ, tới)`), `span(list, t)` (hiện rồi tắt dần trong các khoảng).

### Nét vẽ (`draw.js`)

| Hàm | Vẽ |
|---|---|
| `tag(c, s, x, y, tx, ty, o)` | **Nhãn**: chữ ở `(x, y)`, đường dẫn tới điểm `(tx, ty)` trên hình. `o.alpha`, `o.color`, `o.size` (28), `o.lit` |
| `pill(c, s, x, y, o)` | Tấm chữ bo tròn: `size`, `weight`, `color`, `fill`, `stroke`, `alpha` |
| `text(c, s, x, y, o)`, `textWidth`, `font` | Chữ trần: `size` 24, `weight` 700, `align`, `base` |
| `arrow(c, x0, y0, x1, y1, o)` | Mũi tên thẳng: `w`, `head`, `color`, `alpha`, `grow` 0..1 (mọc dần), `dash` |
| `arcArrow(c, cx, cy, r, a0, a1, o)` | Mũi tên cong, cho chuyển động quay |
| `line`, `disc`, `rr`, `glow` | Đoạn thẳng, hình tròn, chữ nhật bo góc, quầng sáng |
| `flame(c, x, y, s, alpha, color)`, `heatWaves(c, x, y, o)` | Ngọn lửa; làn hơi nóng bốc lên |
| `crossMark(c, x, y, r, alpha)` | Dấu gạch chéo đỏ, chỉ dùng trong khung "dễ nhầm" |
| `rgba(hex, a)`, `mix(a, b, t)`, `hash(i, k)` | Màu trong suốt, pha hai màu, số giả ngẫu nhiên cố định |

### Bảng của ví dụ (`widgets.js`)

Riêng của Bài 1, nhưng là khuôn cho các bảng của bài khác. Mỗi bảng là một hàm thuần của trạng thái được đưa vào (`o.show[i]`, `o.lit[i]`, …), còn `world.js` tính trạng thái ấy từ mốc.

| Bảng | Là gì | Dùng lại cho |
|---|---|---|
| `drawChain`, `CHAIN` | Dải mắt xích trên cùng: năm tấm tên nối bằng mũi tên, sáng dần theo lời đọc | Mọi chuỗi "thứ này dẫn tới thứ kia": đường đi của lực (Bài 3), điện từ máy phát tới phụ tải (Bài 5) |
| `drawBar`, `BAR`, `STROKES` | Thanh bốn ô có con trỏ chạy theo `s`, một ô đánh dấu, mũi tên quay vòng | Một trình tự có số bước cố định: bốn bước kiểm tra dầu, ba bước khởi động |
| `drawHero` | Bốn ô lớn, mỗi ô một xi lanh nhỏ; dùng ở khung "dễ nhầm" (gạch những ngọn lửa sai) | Đếm lại cho đúng một thứ hay bị đếm sai |
| `drawTable` | Hai hàng, hai cột giá trị, kết luận "khác" và "giống" | So sánh hai thứ dễ lẫn theo từng thuộc tính: bảng bốn ký hiệu của Bài 7 ý 7 |
| `drawNeeds`, `NEEDS` | Cột ba thẻ, mỗi thẻ biến được thành dấu hỏi | Danh sách điều kiện; Bài 1 phần 2 dùng nguyên (ba thứ cần cho sự cháy) |
| `drawPushChart` | Biểu đồ so độ lớn, không có số | Chỉ khi bài so hai độ lớn mà không cho số |

## 6. Thêm bộ phận hoặc bảng mới

1. **Đọc bài trước, liệt kê thứ bài gọi tên.** Chỉ những thứ ấy có nhãn. Chi tiết vẽ thêm cho hình dễ hiểu thì không gắn tên, và ghi vào Notes của `BRIEF.md` là lựa chọn minh hoạ.
2. **Viết trong dự án trước**, ở `world.js` (hình) hay `widgets.js` (bảng), theo khuôn của `engine.js`: một hệ toạ độ riêng có gốc dễ nhớ, một bảng điểm neo cho nhãn (như `SPOT`, `CAR`), một hàm `drawX(c, trạng thái, o)` thuần, trạng thái là vài con số 0..1 hay một con số chạy liên tục (như `s`). Không đọc `t` bên trong bộ phận, trừ `o.tick` cho thứ trôi liên tục.
3. **Vẽ sơ đồ, không vẽ kỹ thuật:** nét dày 4–6 px, bo tròn, khối tô `PAL.body`, viền `PAL.steel`, khoang rỗng `PAL.cavity`. Không theo tỉ lệ thật; ghi điều đó vào Notes.
4. **Xem ngay** bằng `bench-shots.mjs` (§7) ở vài trạng thái, kể cả hai đầu của chuyển động, trước khi nối vào lời đọc.
5. **Nối vào mốc:** thêm mốc vào `beats.js`, viết hàm hình trong `world.js`, gọi nó trong `draw(t)`.
6. **Xong video rồi mới chuyển về `kit/`**, và chỉ những gì bài khác cũng dùng được: bộ phận vào một tệp mới cạnh `engine.js` (ví dụ `electric.js`, `symbols.js`), bảng đã tổng quát hoá vào một tệp bảng chung. Ghi vào §4 của tệp này và vào `series.md` §5, rồi chạy phép kiểm ở `qa.md` §4.

Ký hiệu trên bảng đồng hồ và trên nút bấm (Bài 5, 7, 8): vẽ lại bằng đường nét canvas theo ảnh ở `images/crops/`, đúng hình và đúng màu, đủ lớn để thấy chi tiết phân biệt (đáy răng cưa của mặt cắt lốp, hai cung tròn quanh vòng tròn). Không dán ảnh gốc vào video. Chưa ký hiệu nào được vẽ.

## 7. Kiểm khi đang vẽ

Cả hai lệnh chạy trong dự án, không cần lắp ráp video:

```bash
node scripts/bench-check.mjs                       # vẽ mọi 0,05 giây bằng một canvas giả: lỗi, toạ độ NaN, dấu vân tay
node scripts/bench-check.mjs --frames              # thêm một dấu vân tay cho mỗi khung
node scripts/bench-shots.mjs try 3 "4:2.5,4:6,9:1" # ảnh thật: khung 4 giây thứ 2,5 và 6, khung 9 giây thứ 1
node scripts/bench-shots.mjs mid 4 mid             # mỗi khung một ảnh ở giữa khung ("late": gần cuối)
node scripts/bench-shots.mjs at 2 "12.4,80"        # theo giây của video
```

- `bench-check` phải in `0 error(s), 0 call(s) given a NaN`. Nó không cần trình duyệt, chạy vài giây; chạy sau mỗi lần sửa `beats.js` hay `world.js`. Nó đo chữ xấp xỉ (12 px một ký tự) nên không bắt được chữ tràn: việc đó phải nhìn ảnh.
- **Dấu vân tay** (`fingerprint <16 ký tự>`) tóm tắt mọi lệnh vẽ của cả video. Sửa mã mà không định đổi hình (dọn dẹp, chuyển một hàm về `kit/`) thì dấu vân tay phải giữ nguyên; khi nó đổi, `--frames` cho biết khung nào đổi.
- `bench-shots` ghi `snapshots/bench/<tên>.jpg`: chỉ có bàn máy, không cột chữ, không phụ đề. Cần Chrome (đặt `CHROME` khi nó không ở chỗ thường lệ) và ffmpeg. **Đọc ảnh** và soát: nhãn có đè lên hình hay lên nhau không, có gì ra ngoài x 720–1860 hay xuống dưới y 850 không, thứ đang được đọc có sáng không, hai hình có chồng nhau không.
- Ảnh tĩnh không cho thấy chuyển động: chụp hai, ba ảnh sát nhau quanh mỗi lần đổi trạng thái để thấy nó đi qua những gì.
