# Lớp chữ và storyboard

Cột chữ bên trái là các khung HTML trong suốt đặt trên canvas, do `scripts/build-frames.mjs` sinh ra từ `SCRIPT.md`, `cues.js` và `beats.js`. Không khung nào viết tay hay giao cho worker. Một khung của `build-frames.mjs`, các khối (`card`, `row`, `txt`, `lab`, `hl`, `karaoke`…) và các hàm chuyển động (`IN`, `PILL`, `RING`, `DIM`) của `frames.lib.mjs`, `frames.kit.mjs` có tài liệu ở `.claude/skills/chuong-4-cau-tao-va-sua-chua-video/references/frames.md` §2 và §4. Tệp này viết phần chương I thêm vào: `scripts/frames.law.mjs`.

## 1. Bố cục

- Cột chữ: x 64–620, từ trên xuống; thẻ cuối kết thúc trên y 880. Không thẻ nào lấn sang khung nhìn của mô hình (x > 640).
- Đầu cột là tiêu đề mục (`kick`); dưới nó là một đến ba thẻ. Nhiều hơn ba thẻ thì chia khung.
- `build-frames.mjs` nhập mọi thứ từ một chỗ: `import { … } from "./frames.law.mjs"`. `frame()`, `kick()`, `page()` của tệp này thay cho bản cùng tên của `frames.lib.mjs`.
- Trong HTML và CSS sinh ra, `§` là tiền tố của khung (mỗi khung một tiền tố riêng, `shell()` thay vào). Mốc trong `js` là giây **trong khung**: `cx.r(mốc tuyệt đối)` đổi từ mốc của `beats.js`, `cx.a("cụm")` lấy thẳng mốc của một cụm trong lời đọc của khung.

## 2. Tiêu đề mục và hàng chấm

```js
const ITEMS = ["PHẦN ĐƯỜNG XE CHẠY VÀ LÀN ĐƯỜNG", "DẢI PHÂN CÁCH VÀ VẠCH KẺ ĐƯỜNG", …];
const item = (i, fresh) => kick(ITEMS[i - 1], fresh, { step: i, of: ITEMS.length, moved: fresh });
```

`kick(tên, fresh, { step, of, moved })` vẽ tên mục và một hàng `of` chấm: chấm của mục đã qua tô tím nhạt, chấm của mục đang học là vạch trắng dài. `fresh` cho tiêu đề trượt vào (khung đầu của mục); các khung sau của cùng mục gọi với `fresh = false` để tiêu đề đứng yên. Trả về `{ html, js }`; đưa `k` vào `page(k, [thẻ…])` và `...k.js` vào danh sách chuyển động.

Tên mục lấy từ tiêu đề mục của bài, viết hoa, không đánh số (số thứ tự mục không phải kiến thức). Phần Thử áp dụng dùng cùng hàm với `of: 3` và tên "THỬ ÁP DỤNG" (`quiz(i)` trong ví dụ).

## 3. Thẻ Quy tắc

```js
const GAUGE = ["Khổ giới hạn của đường bộ là khoảng trống …,", "để các xe, kể cả hàng hoá xếp trên xe, đi qua được an toàn."];
const ru = rule(cx, [[GAUGE[0], [["Khổ giới hạn của đường bộ", "name"], ["chiều rộng", "name"], ["chiều cao", "name"]]]]);
return frame(8, page(k, [ru.card]), [...k.js, ...ru.js]);
```

- `rule(cx, lines, opts)`: `lines` là `[[câu, [[cụm, loại, lần thứ?], …]], …]`. Cả câu hiện mờ sẵn và **sáng từng chữ theo giọng đọc**; mỗi cụm đánh dấu giữ màu của `loại` sau khi được đọc: `"name"` tím nhạt, `"wrong"` đỏ, `"right"` xanh lá, `"memo"` hổ phách (`TINT`).
- Câu trong `lines` phải trùng lời đọc của khung **từng chữ**; lệch thì `rule()` hoặc `karaoke()` ném lỗi khi sinh khung. Vì vậy khai báo câu Quy tắc một lần thành hằng ở đầu tệp và soát hằng đó với tệp bài.
- **Quy tắc đi qua nhiều khung:** khung sau gọi `rule(cx, [[câu mới, …]], { read: [các câu đã đọc], stay: true })`. Các câu đã đọc ở lại phía trên, chữ nhỏ và mờ hơn; thẻ không trượt vào lại.
- `kept([các câu], { label })`: thẻ Quy tắc đã đọc xong, đứng yên phía trên trong khung Dễ nhầm.
- Tuỳ chọn khác: `id` (khi một khung có hai thẻ), `label` (mặc định "QUY TẮC"), `t0`.
- Chọn cụm đánh dấu theo **thứ mô hình sẽ làm sáng**: mỗi cụm tím nhạt trong thẻ ứng với một phần sáng tím nhạt trên mô hình ở cùng mốc.

## 4. Dễ nhầm, Cách nhớ, Thử áp dụng

**Dễ nhầm** (viền đỏ):

```js
const TRAP = (id) => `${ring(id, "no")}${lab("DỄ NHẦM", "§red")}`;
card("c1", `${TRAP("g1")}${txt("big", "Phần đường xe chạy")}${line("n1", `không phải là ${wrong("w1", "mặt đường cộng lề đường")}`, C.neg)}`)
// js:
rowIn("#§n1", r(f.w1) - 0.05), ...strike("w1", r(f.x1) + 0.25)
```

`wrong(id, chữ)` là cụm sẽ bị gạch; `strike(id, t)` trả về **một mảng** hai lệnh (nét gạch chạy, chữ đổi sang đỏ), nên phải viết `...strike(…)`. Mốc `t` của nó là mốc `x` trong `beats.js`, cùng mốc với `strike()` trên canvas. Mỗi `line`, `yes`, `no` cần một `rowIn` (hoặc `fade`) trong `js`, nếu không dòng đó không bao giờ hiện.

**Cách nhớ, Cách hiểu** (hổ phách): một thẻ riêng với `lab("CÁCH NHỚ", "§amber")`; cụm chính dùng `pill(id, t0, t1, "memo")`. Không đặt trong thẻ Quy tắc.

**Thử áp dụng**, mỗi tình huống hai khung (`ask`, `reply` trong ví dụ):

- Khung hỏi: thẻ TÌNH HUỐNG (lời tả, các cụm chính sáng dần bằng `pill(…, "name")`), rồi thẻ CÂU HỎI với `question(cx, "q", câu)`: câu hỏi hiện từng chữ theo giọng. Câu hỏi phải trùng lời đọc từng chữ.
- Khung trả lời: hai thẻ trên đứng lại và mờ đi (`"§vis"`, `dim`), câu hỏi viết bằng `asked(câu)`; thẻ TRẢ LỜI là `answer(cx, lines)`, đọc như một thẻ Quy tắc, viền xanh. Chữ "Có" đánh dấu `"right"`, "Không" đánh dấu `"wrong"`.

**Các khối khác:** `line(id, chữ, màu)` dòng có chấm; `yes`, `no` dòng có ✓, ✕; `pill`, `fade`, `dim`. Dấu câu đứng ngay sau một cụm tô màu thì dùng `hlp(id, chữ, ",")` để dấu không rơi xuống đầu dòng.

## 5. Storyboard và SFX

`scripts/build-storyboard.mjs` giữ một mảng `F`, mỗi khung một mục: `scene` (một câu tả cảnh), `sc` (các pha `[giây trong khung, mô tả]`), `sfx` và `at`. `R(n, mốc)` đổi mốc tuyệt đối của `beats.js` thành giây trong khung. `writeStoryboard()` ghép với `SCRIPT.md` và mốc thật thành `STORYBOARD.md`. Câu tả cảnh phải đúng với thứ canvas vẽ.

SFX của chương, ít và có nghĩa cố định (Bài 1: 14 tiếng trong 21 khung):

| SFX | Khi nào | Bài 1 |
|---|---|---|
| `ping` | Câu hỏi mở đầu | 1 |
| `whoosh-short` | Mở một mục mới, máy quay lia tới chỗ mới | 4 |
| `pop` | Một phần lớn được đặt vào mô hình | 2 |
| `click` | Một cách hiểu sai bị gạch (đặt ở mốc gạch đầu tiên của khung) | 4 |
| `chime` | Câu trả lời của Thử áp dụng | 3 |

Khung Quy tắc thuần đọc, khung Cách nhớ và khung hỏi của Thử áp dụng để `sfx: "none"`. Mỗi khung nhiều nhất một SFX. Âm lượng do `lock-audio.mjs` đặt (0.22).

Dòng nhạc của Bài 1: nhạc nền điềm tĩnh, không lời, không trống mạnh, để giọng đọc câu luật rõ từng chữ; `bgm.volume` 0.3 cho nhạc nằm dưới giọng 10,7 dB.
