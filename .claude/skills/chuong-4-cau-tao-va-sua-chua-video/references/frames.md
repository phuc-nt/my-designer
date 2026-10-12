# Lớp chữ và storyboard

Các khung của video là lớp chữ **trong suốt** đặt trên bàn máy: một cột bên trái, không khung nào có nền riêng. Mọi tệp `compositions/frames/NN-slug.html` do `scripts/build-frames.mjs` sinh ra. Không sửa tay tệp đã sinh và không giao khung cho worker: sửa `build-frames.mjs` rồi chạy lại.

`build-frames.mjs` chỉ nhập từ một nơi, `./frames.bench.mjs`. Tệp đó đưa ra các khối của chương (§3), và chuyển tiếp mọi thứ của `frames.lib.mjs` (khối chung), `frames.kit.mjs` (màu, icon, hàm chuyển động) và `frames.ctx.mjs` (mốc).

## 1. Bố cục

| Vùng | Toạ độ | Ghi chú |
|---|---|---|
| Nhãn mục (`kick`) | x 64, y 40–80 | Ô tên của ý ("LÀM VIỆC GÌ?") và tên bài. Có trên mọi khung trừ khung mở |
| Thanh ba bước (`tracker`) | x 64, y 98–140 | Chỉ trên các khung thuộc một ý |
| Cột chữ (`col`) | x 64–620 (rộng 556) | Bắt đầu từ y 156 khi có thanh ba bước (`page` tự đặt), y 104 khi chỉ có nhãn mục, y 40 với `col(cards, "§top")` cho khung mở |
| Giới hạn dưới | y 880 | Phụ đề nằm dưới y 896; thẻ cuối cùng phải kết thúc trên 880 |
| Bàn máy | x 720–1860 | Không đặt thẻ ở đây |

Cột hẹp và thấp: dưới thanh ba bước còn 724 px (y 156–880). Các mức đầy nhất đã chạy trong ví dụ: bốn thẻ ngắn (khung 9); một thẻ dẫn và hai thẻ đánh số, mỗi thẻ ba dòng con (khung 12); không có thanh ba bước thì ba thẻ với năm dòng con (khung 20). Đầy hơn thế thì chia khung trong `SCRIPT.md`; không thu nhỏ chữ. Thẻ có tràn hay không chỉ biết được qua ảnh `snap.sh late` (`qa.md` §2).

## 2. Một khung

Một khung "xem nó làm việc" của ví dụ, rút gọn:

```js
import { B, C, J, card, cardIn, ctx, frame, hl, inOrder, kick, page, pill, setSeries, tracker, tt, writeFrames } from "./frames.bench.mjs";

setSeries("ĐỘNG CƠ");                                   // tên bài, đứng cạnh nhãn mục trên mọi khung
const S1 = "LÀM VIỆC GÌ?";                              // tên của ý, như nhãn mục gọi

function f7() {
  const cx = ctx(7), r = cx.r, a = cx.a, f = B.f7;
  const k = kick(S1, false), tr = tracker(1);           // bước 1 đang chạy
  const body = page(k, tr, [
    card("c1", `<div class="§mid">Bánh chủ động quay, ${hl("h1", "bám vào mặt đường")} và ${hl("h2", "đẩy cả chiếc xe đi tới")}</div>`),
  ]);
  inOrder(7, ["grip", f.grip], ["push", f.push]);
  const js = [
    ...k.js, ...tr.js,
    cardIn("#§c1", 0.2),
    pill("h1", r(f.grip), r(f.push) - 0.3, "term"),     // sáng khi được đọc, rồi giữ màu của thứ nó gọi tên
    pill("h2", r(f.push), a("Nhờ vậy") - 0.3, "work"),
  ];
  return frame(7, body, js);
}

writeFrames([f1, f2, /* … */ f21]);
```

- `§` trong HTML, CSS và selector được thay bằng tiền tố của khung (`f07-`), nên id không trùng giữa các khung.
- `ctx(n)` trả về `{ r, a, dur, n }`. `r(mốc)` đổi một mốc tuyệt đối của `beats.js` thành giây trong khung; `a("cụm từ", { nth, end })` lấy mốc thẳng từ lời đọc. Cả hai **ném lỗi** khi mốc rơi ngoài khung, nên gõ sai số khung là biết ngay.
- **Dùng mốc của `beats.js` (`B.f7.grip`) cho điều mà bàn máy cũng phản ứng**, để chữ và hình sáng cùng lúc. `a("…")` chỉ cho thứ riêng của cột chữ (một thẻ vào, một dòng phụ).
- `tt(t)` giữ mốc trong khung (không muộn hơn 0,55 giây trước khi khung hết) và làm tròn. `pill`, `fade`, `tone`, `cardIn`, `rowIn` đã tự bọc; tự viết `J(…)` thì bọc mốc bằng `tt`.
- `J("TÊN_HÀM", selector, …)` viết một dòng lệnh chuyển động (§4). `inOrder(n, ["tên", mốc], …)` kiểm rằng các mốc tăng dần, tức thứ tự trên thẻ đúng với thứ tự lời đọc.
- `kick(tên ý, fresh)`: `fresh = true` ở khung đầu của một ý (nhãn trượt vào), `false` ở các khung sau. Trả về `{ html, js }`.
- `writeFrames([...])`: số hàm phải bằng số khung của `SCRIPT.md`. Tên tệp lấy từ tiêu đề khung trong `SCRIPT.md`.

## 3. Các khối của chương (`frames.bench.mjs`)

| Khối | Ra gì |
|---|---|
| `tracker(active, { fresh, moved })` | Thanh ba bước: **XEM NÓ LÀM VIỆC → GỌI ĐÚNG TÊN → DỄ NHẦM VỚI**. `active` là 1, 2 hay 3; bước đã qua thành dấu tích, bước chưa tới là icon mờ. `fresh: true` ở khung đầu của ý (thanh trượt vào); `moved: true` ở khung mà bước vừa đổi (bước mới nháy một vòng sáng). Trả về `{ html, js }` |
| `page(k, tr, cards)` | Thân của khung: nhãn mục, thanh ba bước (`null` khi khung không thuộc ý nào: ý lớn, ghi nhớ, khung cuối), rồi cột thẻ |
| `pill(id, t0, t1, kind)` | Cụm `hl(id, …)` sáng thành ô màu từ `t0` tới `t1`, sau đó chữ giữ màu của nghĩa. `kind`: `fuel`, `air`, `heat`, `work`, `wrong`, `term` (bảng màu ở `bench.md` §3) |
| `question(cx, id, câu)` | Câu hỏi hiện từng chữ theo giọng đọc. Câu phải có nguyên văn trong lời đọc của khung. Trả về `{ html, js }`; đặt `html` trong `<div class="§q">` |
| `numbered(id, n, tên, rows)` | Một mục của danh sách đánh số trong bài: số trong vòng tròn, tên, các dòng con. Vòng số có id `<id>n` |
| `line(id, chữ, màu)` | Một dòng con, dẫn đầu bằng chấm màu; vào bằng `rowIn("#§id", t)` |
| `tone(id, t, from, to)` | Vòng số đổi trạng thái: `tone("s1n", t, "idle", "on")` khi mục bắt đầu được đọc, `"on", "idle"` khi sang mục sau. `on` của chương là tím (hổ phách sẽ bị đọc thành "nhiên liệu") |
| `fade(id, t)` | Một dòng đang ẩn (`§hid`) hiện ra |
| `arrow("down" \| "up" \| "spin" \| "loop" \| "push" \| "flame" \| "tag")`, `sm(n)` | Mũi tên tròn nhỏ hay số nhỏ dẫn đầu một dòng |
| `DRAW.*`, `HEAT`, `SPENT`, `TINT`, `STEPS` | Hình nét nhỏ, hai màu thêm của chương, bảng màu của `pill`, tên ba bước |
| `extend({ css, js })` | Kiểu và dòng lệnh riêng của một bài, gọi một lần trước khung đầu. CSS viết với tiền tố `§` |
| `frame(n, body, js)` | Một khung hoàn chỉnh, có kiểu và trạng thái `on` của chương. Thay cho `frame` của `frames.lib.mjs` |

Tên ba bước là của cả chương: không đổi chữ trong `STEPS` cho riêng một bài.

### Khung định nghĩa ("gọi đúng tên")

```js
const WORK_OF_ENGINE = "Khi làm việc, động cơ ô tô biến nhiệt năng thành cơ năng làm trục khuỷu quay, truyền lực đến các bánh xe chủ động, tạo ra chuyển động tịnh tiến cho xe.";

function f8() {
  const cx = ctx(8), a = cx.a;
  const k = kick(S1, false), tr = tracker(2, { moved: true });
  const ko = karaoke(cx, "k", WORK_OF_ENGINE, [[8, 9, HEAT], [11, 12, C.pos], [14, 16, C.lilac], [21, 24, C.lilac], [27, 30, C.lilac]]);
  const body = page(k, tr, [card("c1", `${ring("g1", "def")}${lab("GỌI CHO ĐÚNG TÊN VIỆC ẤY")}<div class="§big §mt6">${ko.html}</div>`)]);
  const js = [...k.js, ...tr.js, cardIn("#§c1", 0.2), J("RING", "#§g1", tt(a("khi làm việc") - 0.1)), ...ko.js];
  return frame(8, body, js);
}
```

- Dòng Chốt là một hằng ở đầu tệp, chép nguyên văn từ `SCRIPT.md`. **Lời đọc của khung phải là đúng câu ấy, không chữ nào khác:** `karaoke` ghép từng chữ của câu với từng mốc của lời đọc và ném lỗi khi số chữ lệch. Lời dẫn ("Gọi cho đúng tên thì…") đặt ở cuối khung trước.
- `marks` là các đoạn `[chữ đầu, chữ cuối, màu]`, đếm chữ từ 0 theo dấu cách. Tô thuật ngữ theo nghĩa: `HEAT` cho "nhiệt năng", `C.pos` cho "cơ năng", `C.lilac` cho tên bộ phận. Đếm lại chỉ số mỗi khi sửa câu.
- `ring(id, "def")` cùng `J("RING", …)` là viền tím nhạt của thẻ định nghĩa. Không dùng viền này cho thẻ nào khác, trừ câu hỏi để dành ở khung cuối.
- Trên bàn máy, mỗi thuật ngữ của câu làm sáng lại bộ phận của nó: lấy mốc bằng `a(8, "nhiệt năng")` trong `beats.js`.
- Dòng Chốt 31 chữ (Bài 1 ý 1) vừa một thẻ cỡ `§big`. Dài hơn thì chia theo vế thành hai khung định nghĩa nối nhau, mỗi khung một hằng và một `karaoke` (`series.md` §2). **Cách chia này chưa được thử.**

### Khung "dễ nhầm với"

```js
card("c2", `${row("r1", LD.ok, txt("nm", `Bốn là ${hl("h2", "số hành trình")} của pít tông`), "§c")}${row("r2", LD.no, txt("nm", `không phải ${hl("h3", "số lần nổ")}`), "§c")}`),
// …
rowIn("#§r1", a("Bốn là")), pill("h3", r(f.bang), r(f.in4) - 0.2, "wrong"),
```

- `tracker(3, { moved: true })` ở khung đầu của bước, `tracker(3)` ở khung sau.
- Dấu đúng (`LD.ok`), dấu sai (`LD.no`) và màu `wrong` **chỉ dùng ở bước này**. Trên bàn máy tương ứng là `crossMark`.
- Điều đúng đứng trước, điều sai đứng sau, và điều sai luôn đi kèm lý do trong lời đọc.

### Khung khác

- **Khung mở** (khung 1): `col([...], "§top")`, không nhãn mục, không thanh ba bước. Thẻ đầu là `lab("CẤU TẠO VÀ SỬA CHỮA")` và tên bài trong `<div class="§name"><span class="§g">…</span></div>`. Câu hỏi bằng `question`.
- **Ý lớn**: `kick("Ý LỚN", true)` rồi `page(k, null, cards)`.
- **Danh sách đánh số** (khung 12, 13): mỗi mục một `numbered`, các dòng con vào bằng `rowIn` đúng lúc được đọc, vòng số bật bằng `tone`.
- **Ghi nhớ** (khung 19, 20): `kick("GHI NHỚ", true)`; mỗi điều một thẻ có `head(num("n1", 1), txt("mid", …))` và các dòng `line`. Số thứ tự ở đây là số của ba dòng ghi nhớ trong video, do lời đọc đếm ("Một… Hai… Ba…").
- **Khung cuối** (khung 21): `kick("PHẦN SAU", true)`, câu hỏi để dành trong thẻ có `ring("g1", "def")`; viền sáng sau khi câu hỏi đọc xong và giữ tới hết.

## 4. Khối và hàm chuyển động dùng chung

Khối của `frames.lib.mjs`:

| Khối | Ra gì |
|---|---|
| `card(id, inner, cls)` | Một thẻ chàm |
| `ring(id, cls)` | Viền sáng của thẻ, đặt ở đầu `inner`, bật bằng `J("RING", …)`. `"def"` tím nhạt, `"ok"` xanh, `"no"` đỏ. Không có `cls` thì viền hổ phách, là màu nhiên liệu của chương: đừng dùng |
| `lab("CHỮ NHỎ", "§li")` | Nhãn nhỏ in hoa đầu thẻ |
| `txt("mid" \| "big" \| "sub" \| "nm" \| "close", chữ, id)` | Một dòng chữ theo cỡ: 27, 30, 23, 24, 30 px |
| `hl(id, "cụm từ")`, `hlp(id, "cụm từ", ",")` | Cụm từ sẽ được `pill` làm sáng; `hlp` khi ngay sau nó có dấu câu |
| `head(lead, inner)`, `row(id, lead, inner, cls)` | Một hàng có thứ dẫn đầu; `row` ẩn sẵn và vào bằng `rowIn` |
| `num(id, n)`, `ib(icon)`, `sw(id, màu)`, `LD.ok`, `LD.no`, `LD.dot(màu)` | Thứ dẫn đầu: số trong vòng tròn, ô icon, vạch màu, dấu đúng, dấu sai, chấm |
| `karaoke(cx, id, câu, marks)` | Câu hiện mờ sẵn, sáng dần từng chữ |
| `stepCard(id, n, tiêu đề, dòng phụ)`, `recap(id, nhãn, dòng[])` + `recapJs(id, t0, mốc[])` | Khối của Chương III (bước thao tác, thẻ ghi nhớ có dấu tích). Dùng được; Bài 1 không dùng |
| `cardIn(sel, t)`, `rowIn(sel, t)`, `tint(sel, t, màu)` | Thẻ trượt lên, dòng trượt từ trái, chữ đổi màu |

Icon: `ICON.*` của `frames.kit.mjs` (`check`, `cross`, `eye`, `swap`, `ask`, `flag`…), `IC.*` của `frames.lib.mjs` (bộ của Chương III: đèn, vô lăng, mắt), `DRAW.*` của chương. Icon mới viết theo cùng khuôn (viewBox 24, `st(màu, độ dày)`) ngay trong `build-frames.mjs` của bài; bài khác cũng dùng thì thêm vào `DRAW` của `kit/scripts/frames.bench.mjs`. **Ký hiệu trên bảng đồng hồ không phải icon trang trí:** vẽ nó trên bàn máy, đủ lớn và đúng màu (`bench.md` §6).

Màu: `C.ink, mute, dim, card, lilac, violet, pink, sky, pos, warn, neg`; dạng số cho quầng sáng: `RGB.warn, pos, neg, sky, violet`.

Hàm chuyển động (trong khung, gọi qua `J`):

| Hàm | Việc |
|---|---|
| `IN.up / down / left / zoom / pop / fade(sel, t, { d, x, y, s })` | Vào |
| `IN.word(sel, t)` | Một chữ hiện (`question` tự dùng) |
| `OUT(sel, t)` | Ra |
| `DIM(sel, t, a)` | Thẻ đã đọc xong mờ bớt, mặc định còn 0,74 |
| `PILL(sel, t0, t1, rgb, { ink })` | Cụm từ sáng thành ô màu rồi trả về màu chữ `ink` (`pill` tự dùng) |
| `LIT(sel, t, rgb)` | Như `PILL` nhưng giữ sáng |
| `RING(sel, t0, t1)` | Viền sáng của thẻ; bỏ `t1` thì giữ tới hết khung |
| `PULSE(sel, t, rgb, r)` | Một vòng sáng toả ra |
| `SHAKE(sel, t)` | Thẻ rung một lần, cho cách hiểu sai |
| `TONE(sel, t, from, to)` | Vòng số đổi trạng thái: `idle`, `on`, `hot`, `ok`, `no` |
| `BUMP(sel, t, k)` | Nảy nhẹ |

Luật của tệp khung (`check-frames.sh` kiểm khi lắp ráp): không `repeat`, `yoyo`, `Math.random`, `Date.now`, `@keyframes`, `<audio>`; đường dẫn tài sản tính từ gốc dự án; `visibility` dùng `inherit`, không dùng `visible`.

## 5. Chữ trên thẻ

- **Chữ trên thẻ là lời đọc rút gọn.** Không thêm ý, không thêm tên gọi, không thêm số. Riêng thẻ định nghĩa mang nguyên văn dòng Chốt.
- Mỗi thẻ một ý; cụm được tô sáng là thứ bàn máy đang chỉ vào.
- Màu chữ theo nghĩa: lớp `§amber` (nhiên liệu), `§blu` (không khí), `§heat` (nhiệt), `§grn` (cơ năng, điều đúng), `§spent` (khí đã cháy), `§red` (điều sai), `§mu` (chữ phụ); hay để `pill` tự đổi màu sau khi sáng. Không tô màu cho đẹp.
- Danh sách đánh số trong bài: `numbered` với đúng số của bài. Danh sách không đánh số: `line` (chấm màu) hay icon.
- Chữ rào đón của bài ("trên nhiều xe", "thường") có mặt trên thẻ.
- Gradient (`<span class="§g">`) chỉ ở tên bài trên khung 1.
- Dấu câu ngay sau một cụm tô sáng: dùng `hlp`, nếu không dấu câu có thể rơi xuống đầu dòng sau.
- Ẩn sẵn một dòng bằng `§hid` rồi `fade`, không dựng thẻ mới cho một dòng phụ.

## 6. Storyboard và SFX

`scripts/build-storyboard.mjs` chỉ chứa thứ riêng của bài; `storyboard.lib.mjs` thêm lời đọc nguyên văn, thời lượng, `src`, `status`, `transition_in`, đọc `message:` và `audience:` từ `BRIEF.md`, rồi ghi `STORYBOARD.md` và `.hyperframes/frame-packets/_video-direction.md`.

```js
import { B, rel, at } from "./frames.ctx.mjs";
import { writeStoryboard } from "./storyboard.lib.mjs";
const R = (n, abs) => rel(n, abs);

const F = [
  { scene: "Bàn máy: chiếc ô tô thân kính nhìn ngang, … Cột chữ: tên bài, câu hỏi mở đầu.",
    sc: [[0, "thẻ tên bài trượt vào…"], [at(1, "Bằng cách nào") - 0.35, `thẻ "Câu hỏi", câu hỏi hiện từng chữ; xe được đánh dấu (${R(1, B.f1.ton)}s)…`]],
    sfx: "ping", at: at(1, "Bằng cách nào") - 0.1 },
  { scene: "…", sc: [/* … */], sfx: "none" },
  // … một mục cho mỗi khung
];
writeStoryboard({ title: "Động cơ: nơi nhiên liệu biến thành chuyển động (phần 1)", music: "…", direction, frames: F });
```

- `scene` là một câu tả cả bàn máy lẫn cột chữ của khung. `sc` là các pha `[giây trong khung, mô tả]`; mốc lấy qua `rel(n, mốc)` hay `at(n, "cụm từ")`, không gõ tay.
- `direction` là block `## Video direction`: bảng màu và nghĩa của màu, chữ, ngữ pháp chuyển động, nhịp, bố cục, vùng cấm của phụ đề, danh sách cấm. Sửa từ ví dụ: nghĩa của màu mới, nhịp theo số khung, số của khung "dễ nhầm" trong dòng "dấu đúng và dấu sai chỉ dùng ở khung…".
- `music` là một dòng cho máy tạo nhạc, cùng nội dung với `prompt` trong `.hyperframes/bgm_request.json`: nhạc nền êm, tò mò, không lời, không trống mạnh.

**SFX của chương**, đã dùng ở Bài 1 (6 lần trên 21 khung):

| SFX | Ở đâu |
|---|---|
| `ping` | Câu hỏi mở đầu (khung 1) và câu hỏi để dành (khung cuối) |
| `chime` | Mỗi khung định nghĩa, lúc viền thẻ sáng |
| `click-soft` hoặc `pop` | Một lần đổi trạng thái đáng nhớ trong bước "dễ nhầm" hay giữa bước "xem" (Bài 1: phanh kẹp lại ở khung 9, ngọn lửa duy nhất ở khung 13) |

Không đặt SFX cho từng thẻ. Âm lượng SFX 0,22; nhạc nền 0,3 (`lock-audio.mjs --bgm 0.3`), rồi đo lại bằng `mix-balance.mjs`. Tên có sẵn trong `$HF/media-use/audio/assets/sfx/`: `chime`, `click`, `click-soft`, `error`, `glitch-1`…`3`, `impact-bass-1`, `impact-bass-2`, `key-press`, `notification`, `ping`, `pop`, `riser`, `sparkle`, `typing`, `whoosh`, `whoosh-short`, `whoosh-cinematic`. Tên sai bị bỏ qua không báo: đếm số SFX mà `lock-audio.mjs` in ra.
