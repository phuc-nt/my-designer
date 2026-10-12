# Lớp chữ và storyboard

Các khung của video là lớp chữ **trong suốt** đặt trên cảnh 3D. Không khung nào có nền riêng. Mọi tệp `compositions/frames/NN-slug.html` do `scripts/build-frames.mjs` sinh ra; không sửa tay tệp đã sinh và không giao khung cho worker.

## 1. Bố cục

| Vùng | Toạ độ | Ghi chú |
|---|---|---|
| Nhãn mục (`kick`) | trên trái, y 40 | ô tên mục và tên bài; có mặt trên mọi khung trừ khung mở |
| Cột chữ (`col`) | x 64–620, từ y 104 | `col(cards, "§top")` bắt đầu từ y 40, dùng cho khung không có nhãn mục |
| Giới hạn dưới | y 880 | phụ đề nằm dưới y 896; thẻ cuối cùng phải kết thúc trên 880 |
| Bảng đồng hồ của cảnh 3D | x 1366, y 34, rộng 520 | không đặt chữ của khung vào góc trên phải |
| Phần còn lại | x > 690 | dành cho cảnh; không đặt thẻ ở đây |

Cột hẹp: một khung chứa được khoảng bốn thẻ ngắn, hay hai thẻ dài. Đầy quá thì chia khung trong `SCRIPT.md`, hoặc thu các thẻ đã đọc xong thành một dòng gọn (xem khung 6 và 13 của ví dụ), không thu nhỏ chữ.

## 2. Một khung

```js
function f5() {
  const cx = ctx(5), r = cx.r, a = cx.a, f = B.f5;
  const k = kick("BAN ĐÊM", true);                       // true: nhãn mục trượt vào (khung đầu của mục)
  const body = [k.html, col([
    card("c1", `${lab("TỚI GẦN XE NGƯỢC CHIỀU")}<div class="§mid §mt6">Người lái cần làm ${hl("h1", "hai việc")}</div>`),
    stepCard("s1", 1, "Chuyển từ đèn chiếu xa sang đèn chiếu gần"),
  ])].join("\n");
  const js = [
    ...k.js,
    cardIn("#§c1", 0.22),
    J("PILL", "#§h1", tt(r(f.two)), tt(r(f.two) + 0.9), RGB.warn),
    cardIn("#§s1", r(f.first) - 0.2),
  ];
  return frame(5, body, js);
}
```

- `§` trong HTML, CSS và selector được thay bằng tiền tố của khung (`f05-`), nên id không trùng giữa các khung.
- `ctx(n)` trả về `{ r, a, dur }`: `r(mốcTuyệtĐối)` đổi một mốc của `beats.js` thành giây trong khung; `a("cụm từ", { nth, end })` lấy mốc thẳng từ lời đọc. Cả hai **ném lỗi** khi mốc rơi ngoài khung, nên gõ sai số khung là biết ngay.
- `tt(t)` giữ mốc trong khung (không muộn hơn 0,55 s trước khi khung hết) và làm tròn. Bọc mọi mốc có cộng trừ bằng `tt`.
- `J("TÊN_HÀM", selector, …)` viết một dòng lệnh chuyển động. `inOrder(n, ["tên", mốc], …)` kiểm rằng các mốc tăng dần.
- `setSeries("TÊN BÀI")` một lần ở đầu tệp; `writeFrames([f1, f2, …])` ở cuối, số hàm phải bằng số khung của `SCRIPT.md`.

## 3. Các khối (`frames.lib.mjs`)

| Khối | Ra gì |
|---|---|
| `card(id, inner, cls)` | một thẻ chàm; `ring(id)` bên trong cho viền sáng (`ring(id, "no")` viền đỏ) |
| `lab("CHỮ NHỎ", "§amber")` | nhãn nhỏ in hoa đầu thẻ |
| `txt("mid" \| "big" \| "sub" \| "nm" \| "close", chữ, id)` | một dòng chữ theo cỡ: 27, 30, 23, 24, 30 px |
| `hl(id, "cụm từ")` | cụm từ sẽ sáng thành ô màu; `hlp(id, "cụm từ", ",")` khi sau nó có dấu câu |
| `head(lead, inner)`, `row(id, lead, inner)` | một hàng có thứ dẫn đầu; `row` ẩn sẵn và vào bằng `rowIn` |
| `num(id, n)`, `ib(icon)`, `sw(id, màu)`, `LD.ok`, `LD.no`, `LD.dot(màu)` | thứ dẫn đầu: số trong vòng tròn, ô icon, vạch màu, dấu đúng, dấu sai, chấm |
| `stepCard(id, n, tiêu đề, dòng phụ)` | một bước của danh sách đánh số; số hổ phách khi đang đọc (`TONE … "idle", "hot"`), xanh khi xong (`"hot", "ok"`) |
| `karaoke(cx, id, câu, marks)` | câu hiện mờ sẵn, sáng dần từng chữ theo giọng đọc; `marks = [[chữ đầu, chữ cuối, màu]]` tô màu một đoạn. Câu phải khớp từng chữ với lời đọc |
| `recap(id, nhãn, dòng[])` + `recapJs(id, t0, mốc[])` | thẻ ghi nhớ, mỗi dòng vào đúng lúc được đọc |
| `kick(tên mục, fresh)` | nhãn mục; trả về `{ html, js }` |
| `cardIn(sel, t)`, `rowIn(sel, t)`, `tint(sel, t, màu)` | thẻ trượt lên, dòng trượt từ trái, chữ đổi màu |

Icon nét mảnh cho hàng (`IC.*`, bọc bằng `ib(...)`): `slow`, `wheel`, `lookRight`, `noStare`, `eye`, `seen`, `gap`, `lampFar`, `lampNear`, `lampFog`, `wiper`, `hazard`, `pull`. Icon mới: viết thêm vào `IC` theo cùng khuôn (viewBox 24, `st(màu, độ dày)`); dùng được cho bài khác thì thêm vào `frames.lib.mjs` của skill. `ICON` của `frames.kit.mjs` là bộ của loạt sa hình (dấu đúng, dấu sai, biển, đèn tín hiệu), vẫn dùng được.

Màu: `C.ink, mute, dim, card, lilac, violet, pink, sky, pos, warn, neg`; dạng số cho quầng sáng: `RGB.warn, pos, neg, sky, violet`.

## 4. Các hàm chuyển động (trong khung, từ `frames.kit.mjs`)

| Hàm | Việc |
|---|---|
| `IN.up / down / left / zoom / pop / fade(sel, t, { d, x, y, s })` | vào |
| `IN.word(sel, t)` | một chữ hiện, cho câu hỏi hiện từng chữ (`wordSpans(id, câu)` tạo các span) |
| `OUT(sel, t)` | ra |
| `DIM(sel, t, a)` | thẻ đã đọc xong mờ bớt. Trên cảnh có quầng sáng mạnh dùng `a = 0.84`, mặc định 0.74 để chữ xuyên nền |
| `PILL(sel, t0, t1, rgb, { ink })` | cụm từ sáng thành ô màu từ `t0`, trả về lúc `t1`; `ink` là màu chữ sau khi trả về |
| `LIT(sel, t, rgb)` | như `PILL` nhưng giữ sáng |
| `RING(sel, t0, t1)` | viền sáng của thẻ |
| `PULSE(sel, t, rgb, r)` | một vòng sáng toả ra |
| `SHAKE(sel, t)` | thẻ rung một lần: cho cách làm sai |
| `TONE(sel, t, from, to)` | vòng số đổi trạng thái: `idle`, `hot`, `ok`, `no` |
| `BUMP(sel, t, k)` | nảy nhẹ |

Luật của tệp khung (do `check-frames.sh` kiểm): không `repeat`, `yoyo`, `Math.random`, `Date.now`, `@keyframes`, `<audio>`; đường dẫn tài sản tính từ gốc dự án; `visibility` dùng `inherit`, không dùng `visible`.

## 5. Chữ trên thẻ

- **Chữ trên thẻ là lời đọc rút gọn.** Không thêm ý, không thêm thao tác. Dòng Chốt lên thẻ đủ từng thao tác.
- Danh sách đánh số trong bài: `stepCard` với đúng số của bài. Danh sách không đánh số: `LD.dot()` hay icon.
- Con số chỉ có khi bài có, kèm chữ "khoảng" và lời giả định nếu bài viết vậy.
- Chữ rào đón của bài có mặt trên thẻ.
- Tên bài ở khung 1 và câu kết ở khung cuối dùng gradient (`<span class="§g">`); không dùng gradient ở chỗ nào khác.
- Dấu câu ngay sau một cụm tô sáng: dùng `hlp`, nếu không dấu câu có thể rơi xuống đầu dòng sau.

## 6. Storyboard

`scripts/build-storyboard.mjs` chỉ chứa thứ riêng của bài:

```js
const F = [
  { scene: "một câu tả cảnh 3D và cột chữ của khung",
    sc: [[0, "pha đầu: thẻ nào, cụm nào sáng lúc mấy giây"], [R(1, B.f1.fog) - 0.1, "pha sau…"]],
    sfx: "ping", at: R(1, B.f1.ask) - 0.1 },          // sfx: "none" khi không có
  …
];
writeStoryboard({ title, music, direction, frames: F });
```

- `sc` là các pha `[giây trong khung, mô tả]`; mốc lấy từ `beats.js` qua `rel(n, mốc)` hay `at(n, "cụm từ")`, không gõ tay.
- `direction` là block `## Video direction` (bảng màu và nghĩa của màu trong bài này, chữ, ngữ pháp chuyển động, nhịp, bố cục, vùng cấm của phụ đề, danh sách cấm). Sửa từ ví dụ: đổi phần nghĩa của màu, phần nhịp theo số khung, và danh sách cấm theo bài (bài không có số thì ghi "không số đo trên hình").
- `storyboard.lib.mjs` thêm lời đọc nguyên văn, thời lượng, `src`, `status`, `transition_in`, đọc `message:` và `audience:` từ `BRIEF.md`, ghi `STORYBOARD.md` và `.hyperframes/frame-packets/_video-direction.md`.
- SFX đã dùng: `ping`, `chime`, `click`, `click-soft`. Tên phải có trong `$HF/media-use/audio/assets/sfx/`. Dùng thưa: khoảng một nửa số khung.
