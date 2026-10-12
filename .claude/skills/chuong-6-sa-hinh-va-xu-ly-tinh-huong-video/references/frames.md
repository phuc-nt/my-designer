# Lớp chữ

Mỗi khung của video là một tệp HTML trong suốt đặt trên lớp 3D: cột chữ bên trái và các nhãn. Cả bộ do **một script** của dự án sinh ra, `scripts/build-frames.mjs`, không giao cho worker như `vi-explainer-video` bước 8.

Lý do: chữ và hình phải rơi vào cùng một tiếng trong lời đọc. Script đọc đúng `cues.js`, `plan.js` và `beats.js` mà lớp 3D đọc, nên thẻ chữ hiện cùng lúc với vòng sáng trên bản đồ. Đổi giọng hay đổi lời thì chạy lại, không sửa tay mốc nào.

Không sửa tệp trong `compositions/frames/`. Sửa `build-frames.mjs` rồi chạy `assemble.sh`.

Tệp này tả bộ khung chung. §5 có hai phần: khuôn của loạt (ví dụ `v02-nga-tu-co-bien`, dùng cho mọi video mới) và khuôn cũ (ví dụ `cau-502-504-506`). Chỗ nào bên dưới nhắc đề, phương án, đếm ngược hay `PLATE` là nói về khuôn cũ.

## 1. Ba tệp

| Tệp | Thuộc | Việc |
|---|---|---|
| `scripts/frames.ctx.mjs` | engine | Nạp `CUES`, `plan`, `beats`; đổi mốc tuyệt đối sang giây trong khung; đọc `SCRIPT.md`; đặt tên tệp khung |
| `scripts/frames.kit.mjs` | engine | Màu, font, CSS chung, các hàm chuyển động, icon, vỏ tệp khung |
| `scripts/build-frames.mjs` | **riêng từng video** | Chữ và mốc của từng khung |

### `frames.ctx.mjs`

| Tên | Trả về |
|---|---|
| `CUES`, `plan`, `B` | mốc lời đọc, `buildPlan(CUES)`, `buildBeats(plan)` |
| `K` | `plan.C`, bộ tra mốc (`world.md` §4) |
| `COUNT` | số khung, lấy từ giọng đọc |
| `r2(x)` | làm tròn hai chữ số |
| `rel(n, abs)` | giây **trong khung n** của một mốc tuyệt đối |
| `at(n, phrase, o)` | giây trong khung n lúc đọc cụm `phrase`; `o` như `K.at` (`{ nth, d }`) |
| `voiceDur(n)` | độ dài giọng của khung n |
| `script()` | `{ titles, vo }` đọc từ `SCRIPT.md`; báo lỗi khi số khung khác giọng đọc |
| `frameId(n)` | tên tệp khung, sinh từ tiêu đề: "Tình huống 3: biển Dừng lại" thành `09-tinh-huong-3-bien-dung-lai` |
| `frameDurations()` | độ dài từng khung theo `STORYBOARD.md` nếu đã có, nếu chưa thì theo giọng |

Timeline của khung chạy theo giờ **trong khung**. Mốc lấy từ `B` hay `plan` là giờ tuyệt đối, nên luôn đi qua `rel(n, …)`. Trong ví dụ, mỗi hàm khung mở đầu bằng `const R = (t) => rel(n, t);`.

### `frames.kit.mjs`

- **Màu** `C`: `bg`, `ink`, `mute`, `dim`, `card`, `lilac`, `violet`, `pink`, `sky`, `pos` (xanh lá: đúng), `warn` (vàng: đang xét), `neg` (đỏ: sai). `RGB` là bộ ba số của `warn`, `pos`, `neg`, `sky`, `violet`, dùng cho các hàm tô sáng.
- **`shell(n, dur, body, js, extraCss)`** bọc thành tệp khung: `<template>`, font, CSS chung cộng `extraCss`, `#root` 1920×1080 dài `dur` giây, GSAP, một timeline dừng sẵn đăng ký vào `window.__timelines`. Sau cùng nó thay mọi dấu `§` bằng tiền tố của khung (`f01-`, `f02-`…).
- **`header(no, label, active)`** và **`headerJs(t0)`**: nhãn "TÌNH HUỐNG 1 · BỐN XE" và thanh bốn bước (Tình huống, Quy tắc, Xe chạy, Chốt) ở góc trên trái; các bước mang icon, không mang số; `active` là bước đang sáng (1 đến 4).
- **`wordSpans(id, text)`**: tách câu thành từng chữ, mỗi chữ một `<span>` có id `§<id>0`, `§<id>1`…, để hiện theo lời đọc.
- **`ICON`**: `check`, `cross`, `book`, `pause`, `play`, `glass`, `right`, `ask`, `go`, `flag`, `eye`, `cut`, `swap`, `merge`, `none`, `veh`, `ring`; biển và đèn: `signInv` (nhường đường), `signUp` (giao nhau với đường không ưu tiên), `stop`, `stopLine`, `sub` (biển phụ), `lamp(id)`, `aux(id, lit)`, `noLamp`, `roundabout`, `noRoundabout`. Mỗi cái trả một chuỗi SVG. Tình huống có biển hay đèn khác thì thêm icon mới ở đây, vẽ cùng màu với vật trên bản đồ.

## 2. Dấu `§`

Mọi class và id trong `build-frames.mjs` viết với dấu `§` ở đầu: `class="§card"`, `id="§ask"`, `"#§ask"`. `shell()` đổi `§` thành tiền tố của khung, nên hai khung không bao giờ trùng tên và id không bao giờ bắt đầu bằng chữ số.

- Viết thiếu `§` thì class đó trùng giữa các khung và CSS của khung này đè lên khung kia.
- Tệp khung còn sót dấu `§` nghĩa là chuỗi đó được ghép sau `shell()`; `check-frames.sh` bắt lỗi này.

## 3. Các hàm chuyển động

Dán sẵn vào mọi tệp khung. Tham số đầu là selector, tiếp theo là giây trong khung. Tất cả dùng `fromTo` với đủ hai đầu, nên tua tới thời điểm nào cũng ra đúng hình.

| Hàm | Làm gì |
|---|---|
| `IN.up / down / left(sel, t, { y hoặc x, d })` | Trượt vào và hiện |
| `IN.zoom(sel, t, { s, d })` | Thu nhỏ dần về đúng cỡ (tiêu đề lớn) |
| `IN.pop(sel, t, { s, d })` | Bật lên có nảy (nhãn, huy hiệu) |
| `IN.fade(sel, t, { d })` | Hiện tại chỗ |
| `IN.word(sel, t)` | Một chữ của đề bài |
| `OUT(sel, t, { y, d })` | Trượt lên và tắt |
| `DIM(sel, t, a)` | Làm mờ còn `a` (mặc định 0,74) |
| `PILL(sel, t0, t1, rgb, { base, ink, s })` | Chữ sáng thành ô màu phát sáng **trong lúc được đọc**, rồi trở lại |
| `LIT(sel, t, rgb)` | Như `PILL` nhưng giữ sáng |
| `RING(sel, t0, t1)` | Viền sáng của một thẻ, từ `t0` đến `t1` (bỏ `t1` thì giữ) |
| `PULSE(sel, t, rgb, r)` | Một vòng sáng lan ra rồi tắt |
| `SHAKE(sel, t)` | Rung ngang (phương án sai) |
| `FILL(sel, t, from, to, d)` | Đổi màu tô của một phần SVG (bật đèn trong icon) |
| `TONE(sel, t, from, to)` | Vòng số của phương án đổi trạng thái: `idle`, `hot` (vàng), `ok` (xanh), `no` (đỏ) |
| `BUMP(sel, t, k)` | Phồng nhẹ rồi về |

`J(fn, ...args)` trong `build-frames.mjs` viết một dòng timeline: `J("IN.up", "#§card", 1.2, { y: 30 })`. Số được làm tròn hai chữ số. Cần tween không có trong bảng thì viết thẳng một dòng `tl.fromTo(...)`, vẫn đủ hai đầu.

**Thứ đang được đọc tên phải nổi thật mạnh** (yêu cầu cố định số 8 trong `SKILL.md`): dùng `TONE` cho vòng số thứ tự và `PILL` cho từng phần được đọc tên. Đừng thay bằng đổi độ mờ.

## 4. Bố cục

| Vùng | Toạ độ | Ghi chú |
|---|---|---|
| Nhãn câu và thanh bước | trái 64, trên 40 và 98 | `header()` |
| Cột chữ (khung của một câu) | x 64 đến 620 | bản đồ 3D nằm bên phải; panel tối `#world-side` rộng 712 px do lớp 3D vẽ |
| Băng trên (khung tổng kết; khung mở đầu của khuôn cũ) | cả chiều ngang, trên cùng | các ô sa hình nằm bên dưới; nhãn từng ô canh theo tâm ô |
| Vùng phụ đề | y > 896 | không đặt gì vào |

- **Không đặt chữ HTML lên bản đồ 3D để gọi tên biển.** Kính lúp nằm ngay trên biển và phần còn lại chuyển xám (`series.md` §5); tên biển nằm ở thẻ của cột chữ, sáng lên (`RING`, `PILL`) đúng lúc kính mở. Hàm `plate` trong `build-frames.mjs` của V02 trả chuỗi rỗng vì lý do này.
- **Khung Chốt của tình huống cuối rời theo panel.** Panel tối trượt ra ở `plan.side.out`; cả cột chữ phải trượt theo cùng lúc, không để thẻ chữ lơ lửng trên bản đồ.
- **Chữ tĩnh cần class `§vis`.** `.§chip` và `.§mark` mặc định ẩn để chờ tween; cái nào hiện từ đầu khung thì thêm `§vis`.
- Vị trí nhãn của các ô ở khung tổng kết tính theo `TILE_X` và `VIEWS.wide`; số ô khác thì tính lại (`new-cases.md` §5).

## 5. Sửa gì cho video mới

### Khuôn của loạt (`v02-nga-tu-co-bien`)

Theo thứ tự trong tệp:

1. **`SIT_LABEL`**: tên ngắn viết hoa của từng tình huống, hiện cạnh "TÌNH HUỐNG N".
2. **Khung Tình huống** (`f1`, `f5`, `f9`, `f13`): `question(cx, text)` cho câu hỏi hiện từng chữ, đúng chữ của lời đọc; `vehCard` cho từng xe, sáng khi được nhắc tên; `pauseCard` hiện trong khoảng lặng cuối khung.
3. **Khung Quy tắc**: `rulesFrame(n, o)` dựng cả khung từ danh sách thẻ biển (`signCard`: icon, tên biển, một dòng nghĩa) và thẻ quy tắc. Mốc của mỗi thẻ là lúc kính lúp của biển đó mở, lấy từ `B`.
4. **Khung Xe chạy**: `rowCard` và `rowJs` cho từng dòng của danh sách thứ tự; dòng sáng vàng khi xe được xét, xanh khi xe đi. Thứ tự các mốc được kiểm bằng `inOrder`.
5. **Khung Chốt**: thẻ kết luận rồi `memo(id, rows, tCard)` cho thẻ "MẸO NHỚ".
6. **Khung Tổng kết** (hàm cuối): mỗi tình huống một `miniRow`.
7. **`build`** ở cuối tệp: mảng hàm theo đúng thứ tự khung, 4N + 1 phần tử.

Câu hỏi, kết luận, tên biển và mẹo nhớ chép từ brief. Sau đó chạy `node scripts/scan-words.mjs`.

### Khuôn cũ (`cau-502-504-506`)

Chỉ dùng khi người dùng yêu cầu video có đề và phương án. Theo thứ tự trong tệp:

1. **`Q`**: mỗi câu một mục `{ no, label, ans, q, opts }`. `q` và `opts` chép **nguyên văn** từ brief, kể cả dấu câu. `label` là tên kiểu tình huống viết hoa.
2. **`NAME` và `marked(id)`**: phần nào trong chữ phương án sẽ sáng lên khi được đọc. Mỗi câu một nhánh: câu 502 bắt từng chữ số hướng đi, câu 504 bắt tên loại xe, câu 506 bắt chữ cái của xe. Câu mới cần một nhánh mới bắt đúng thứ mà phương án của nó liệt kê. Chữ của phương án giữ nguyên, chỉ bọc thêm `<span>`.
3. **`question(n, id)`** dùng chung cho khung đề của mọi câu: đề hiện từng chữ, bốn thẻ phương án, vòng đếm ngược 3-2-1. Thường không phải sửa.
4. **Khung quy tắc và khung xe chạy** (`f3`, `f4`, `f7`, `f8`, `f11`, `f12` trong ví dụ): viết riêng cho từng câu. Chép hàm của câu cùng kiểu rồi thay chữ và mốc. Mốc lấy từ `B[<số câu>]` và `plan.sites[<số câu>]`, không gõ số giây.
5. **`answer(n, id, tSay, memo, extra)`** dùng chung cho khung đáp án: thẻ phương án đúng đổi sang xanh ở `tSay`, các thẻ khác mờ đi, rồi thẻ ghi nhớ `memo`. `extra.body` và `extra.js` thêm phần riêng.
6. **Khung mở đầu và tổng kết** (`f1`, `f14`): sửa tên câu, tên kiểu tình huống, một dòng quy tắc cho mỗi câu.
7. **`build`** ở cuối tệp: mảng hàm theo đúng thứ tự khung. Số phần tử phải bằng số khung của `SCRIPT.md`.

Chép ví dụ rồi sửa thì chạy lệnh này để chắc không còn chữ của video cũ:

```bash
grep -n "502\|504\|506" scripts/build-frames.mjs scripts/build-storyboard.mjs
```

## 6. Các chốt chặn có sẵn

Script dừng với thông báo lỗi khi chữ trên hình và lời đọc lệch nhau:

| Thông báo | Nghĩa | Sửa ở |
|---|---|---|
| `frame N: question has X words, the voice Y` | Đề trong `Q` khác số chữ với lời đọc khung đề | `Q[…].q` hoặc `SCRIPT.md` cho giống nhau |
| `…: the voice names … but the options read …` | Lời đọc nêu một thứ (hướng, xe) mà chữ phương án không có, hay ngược lại | `Q[…].opts`, `SCRIPT.md`, hoặc nhánh của `marked()` |
| `cue not found: frame N "…"` | Cụm từ không có trong lời đọc của khung | cụm trong `at(n, "…")` cho khớp chữ trong `SCRIPT.md` |
| `frame N starts at … in STORYBOARD.md but at … in the cues` | `STORYBOARD.md` lệch giọng đọc quá 0,03 giây | chạy lại `build-cues.mjs`, `build-storyboard.mjs`, rồi bước 8 |
| `N builders for M frames` | mảng `build` khác số khung | mảng `build` |
| `frame 4, direction D: verdict cue at … is outside the try …` | (ví dụ, kiểu 502) lời chốt "sai" của một hướng rơi ngoài lúc xe ảo chạy thử hướng đó | cụm mốc trong `plan.js`, hoặc lời đọc |
| `frame 8, <xe>: beats out of order` | (ví dụ, kiểu 504) bốn mốc của một xe (nhắc tên, nhìn bên phải, trống, đi) không theo thứ tự | cụm mốc trong `plan.js`, hoặc lời đọc |
| `SCRIPT.md has X frames, the voice has Y` | Thêm bớt khung mà chưa tạo lại giọng | tạo giọng, `build-cues.mjs` |

Đừng tắt chốt chặn để chạy cho qua. Chúng bắt đúng loại lỗi mà brief cấm: chữ trên hình khác đề.

## 7. Luật của tệp khung

`scripts/check-frames.sh` chạy trong `assemble.sh` và dừng khi một tệp khung:

- không mở đầu bằng `<template>`;
- có thẻ audio, `Math.random`, `Date.now`, `yoyo`, `@keyframes`, hoặc `repeat`;
- không nạp font `-VN.woff2`;
- dùng đường dẫn `../assets` hoặc id bắt đầu bằng chữ số;
- đặt `visibility: "visible"` (phải là `"inherit"`);
- chứa `NaN`, `undefined` hoặc `§`;
- có tween ở thời điểm âm.

`NaN` và `undefined` gần như luôn là một mốc không có trong `beats.js`: tên trường gõ sai, hoặc câu mới chưa có mốc đó. Tween ở thời điểm âm là mốc của khung khác bị đưa qua `rel(n, …)` với `n` sai.

## 8. Storyboard

`scripts/build-storyboard.mjs` viết `STORYBOARD.md` từ `SCRIPT.md` và các mốc thật. Faceless cần tệp này để lắp ráp, đặt SFX và chuyển cảnh; không ai đọc nó để dựng khung.

Mảng `F` có một mục cho mỗi khung:

```js
{
  scene: "Một dòng tả khung",
  sc: [[0, "pha đầu"], [R(2, B[502].ask), "pha sau"]],   // [giây trong khung, mô tả]
  sfx: "ping", at: 0.15,                                  // hoặc sfx: "none"
}
```

- `sfx` là tên có trong `$HF/media-use/audio/assets/sfx/`. Tên sai bị bỏ qua không báo. Ví dụ dùng `ping`, `chime`, `sparkle`, `whoosh`, `whoosh-short`.
- Khung có SFX phải có `at` là số; `lock-audio.mjs` dừng với `frame N has a sound effect but no numeric sfx_at` khi thiếu.
- Tiêu đề video, dòng `music:` của frontmatter và block `## Video direction` cũng nằm trong tệp này; sửa cho đúng chủ đề của video mới. Prompt thật của nhạc nằm ở `.hyperframes/bgm_request.json`.
- Số mục của `F` phải bằng số khung: `N frame notes for M frames`.
- Độ dài khung không gõ tay. Lần đầu lấy theo giọng; `audio.mjs sync-durations` ghi lại sau khi chốt âm thanh.
