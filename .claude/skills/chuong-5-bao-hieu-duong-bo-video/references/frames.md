# Lớp chữ và storyboard

Các khung của video là lớp chữ **trong suốt** đặt trên con phố: một cột bên trái, không khung nào có nền riêng. Mọi tệp `compositions/frames/NN-slug.html` do `scripts/build-frames.mjs` sinh ra. Không sửa tay tệp đã sinh và không giao khung cho worker: sửa `build-frames.mjs` rồi chạy lại.

`build-frames.mjs` chỉ nhập từ một nơi, `./frames.signs.mjs`. Tệp đó đưa ra các khối của chương (§2–§4) và chuyển tiếp mọi thứ của `frames.lib.mjs`, `frames.kit.mjs`, `frames.ctx.mjs`. Cách viết một khung (`ctx(n)`, `r`, `a`, `card`, `row`, `cardIn`, `rowIn`, `hl`, `J`) và các khối dùng chung có tài liệu ở `.claude/skills/chuong-4-cau-tao-va-sua-chua-video/references/frames.md` §2 và §4; đọc hai mục đó trước.

## 1. Bố cục

| Vùng | Toạ độ | Ghi chú |
|---|---|---|
| Nhãn mục (`kick`) | x 64, y 40–80 | Tên phần ("BA BƯỚC ĐỌC BIỂN") và tên loạt "BÁO HIỆU ĐƯỜNG BỘ" (`setSeries`). `kick(tên, true)` khi sang phần mới, `false` khi còn ở phần cũ |
| Thanh các bước (`tracker`) | x 64, y 98–140 | Chỉ ở các khung cách đọc và khung cuối |
| Cột chữ | x 64–620 | Bắt đầu từ y 156 khi có thanh các bước, y 104 khi chỉ có nhãn mục. `page(k, tr, cards)` tự đặt; `tr` là `null` khi không có thanh |
| Giới hạn dưới | y 880 | Phụ đề nằm dưới y 896 |
| Con phố | x 690–1880 | Không đặt thẻ ở đây |

Mỗi khung ghép bằng `frame(n, page(k, tr, [thẻ, …]), [...k.js, ...js])`. Tên các phần khai báo một lần ở đầu `build-frames.mjs` (`S0 … S6` trong ví dụ): một phần cho câu hỏi mở, một cho cách đọc, một cho mỗi ý hay nhóm ý, một cho khung cuối. Tên phần nói phần đó về gì, không đánh số ý.

Cột hẹp: đầy nhất đã chạy ở Bài 1 là một thẻ dẫn và ba thẻ có ba dòng con. Đầy hơn thì chia khung trong `SCRIPT.md`; không thu nhỏ chữ. Thẻ có tràn hay không chỉ biết qua ảnh `late` (`qa.md` §2).

## 2. Thanh các bước

`STEPS` là các bước đọc biển của bài, mặc định là ba bước của Bài 1: DÁNG VÀ MÀU, HÌNH BÊN TRONG, TÊN ĐÚNG CỦA XE. Bài khác đặt lại **một lần ở đầu `build-frames.mjs`**:

```js
import { DRAW, setSteps, … } from "./frames.signs.mjs";
setSteps([["DÁNG VÀ MÀU", DRAW.shape], ["HÌNH BÊN TRONG", DRAW.inside], ["ĐỘNG TÁC BỊ CẤM", DRAW.tag]]);
```

Mỗi bước là `[tên, hàm vẽ icon(màu) → SVG]`. Icon có sẵn: `DRAW.shape` (vòng tròn có viền), `DRAW.inside` (hình trong vòng), `DRAW.tag` (thẻ tên), `DRAW.why`. Icon mới viết cùng kiểu trong `frames.signs.mjs`. Tên bước tối đa khoảng 16 ký tự, viết hoa, rút từ "Ý lớn của bài"; hai đến bốn bước.

| Gọi | Khi nào |
|---|---|
| `tracker(1, { fresh: true })` | Khung đầu của phần cách đọc: thanh trượt vào, bước một bật |
| `tracker(n, { moved: true })` | Khung chuyển sang bước `n`: ô sáng trượt từ bước trước sang |
| `tracker(n)` | Còn ở bước `n` |
| `tracker(STEPS.length + 1)` | Khung cuối: mọi bước đã xong |

`tracker` trả về `{ html, js }`: đưa `html` cho `page`, nối `js` vào danh sách của khung. Các khung của từng ý không có thanh (`page(k, null, …)`): lúc đó người xem đang áp dụng, không còn học cách đọc.

## 3. Thẻ Chốt

Dòng Chốt của bài hiện **nguyên văn**, mờ sẵn từ đầu khung, và sáng dần từng chữ theo giọng đọc.

```js
const RULE2 = "Biển tròn viền đỏ có hình ô tô con nhìn từ phía trước bị gạch chéo đỏ cấm các loại xe cơ giới đi vào, trừ xe mô tô hai bánh, xe gắn máy và các xe ưu tiên theo quy định.";

function f9() {
  const cx = ctx(9), k = kick(S2, false);
  const ru = rule(cx, [[RULE2, [["cấm các loại xe cơ giới đi vào", "ban"], ["xe mô tô hai bánh, xe gắn máy và các xe ưu tiên theo quy định", "go"]]]]);
  return frame(9, page(k, null, [ru.card]), [...k.js, ...ru.js]);
}
```

- `rule(cx, [[câu, [[cụm từ, loại, nth?], …]], …], { id, label, t0 })` trả về `{ card, js }`. Mỗi phần tử là một câu của dòng Chốt; dòng Chốt hai câu thì hai phần tử (hoặc hai khung).
- Câu phải **trùng từng chữ với lời đọc của khung** trong `SCRIPT.md`: mốc từng chữ lấy từ lời đọc, lệch một chữ là script ném lỗi. Khung Chốt vì vậy không có lời dẫn; lời dẫn ("Chốt lại") đặt ở cuối khung trước.
- Loại của cụm từ (`TINT`): `"ban"` đỏ (điều bị cấm), `"go"` xanh (điều được làm, ngoại lệ), `"hedge"` hổ phách (chữ rào đón: "Phần lớn", "thường"), `"term"` tím nhạt (tên gọi, thuật ngữ). Cụm từ đổi màu khi được đọc tới. Cụm lặp lại trong câu thì thêm số thứ tự lần xuất hiện ở vị trí thứ ba.
- Tô tối đa ba cụm một câu; chữ rào đón có trong dòng Chốt thì luôn tô.
- Khai báo các dòng Chốt thành hằng ở đầu tệp (`RULE1 … RULE5`), dưới chú thích "the rules of the lesson, word for word", để người soát đối chiếu với brief trong một chỗ.

## 4. Các khối khác và chữ trên thẻ

| Khối | Việc |
|---|---|
| `question(cx, id, q)` | Câu hỏi hiện từng chữ theo giọng đọc (khung mở). `q` phải có nguyên văn trong lời đọc. Trả về `{ html, js }` |
| `numbered(id, n, tên, rows)` | Thẻ có số trong vòng tròn: một bước đọc ("1 · Nhìn dáng và màu") |
| `line(id, chữ, màu)` | Dòng có chấm màu |
| `yes(id, chữ)`, `no(id, chữ)` | Dòng có ✓ xanh, ✕ đỏ: xe được đi, xe bị cấm |
| `why(id, chữ)` | Dòng lý do, có mũi tên tím |
| `pill(id, t0, t1, loại)` | Tô nền một cụm đã bọc bằng `hl(id, chữ)` từ `t0` tới `t1`; loại như ở §3 |
| `fade(id, t)`, `tone(id, t, từ, tới)` | Hiện dần một phần tử; đổi màu chữ |
| `lab(chữ, "§amber")` | Nhãn nhỏ viết hoa; màu hổ phách cho "CÓ THỂ HIỂU LÝ DO NHƯ SAU", "CÁCH NHỚ" |

Luật chữ:

- Chữ trên thẻ là lời đọc rút gọn, không thêm ý. Tên biển, tên xe, con số viết đúng như bài.
- Thẻ đi **cùng nhịp với hình**: dòng "✕ xe tải" hiện đúng mốc xe tải nhận dấu ✕ trên phố (cùng một `B.fN.<mốc>`).
- **Mỗi `row` phải có một `rowIn`** (hoặc `fade`) trong danh sách `js`. Dòng không có lệnh hiện thì ẩn suốt khung, và thẻ trông như bị trống.
- Dấu câu đứng ngay sau một cụm tô nền: dùng `hlp(id, chữ, ",")` thay cho `hl(…)` rồi gõ dấu. Cụm tô nền là `inline-block`, dấu câu rời có thể rơi xuống đầu dòng sau.
- Chữ gradient chỉ dùng một lần trong video, ở tên bài của khung mở (`txt("title", …)`).
- Không số câu, không mã biển, không "biển thứ nhất" (`scan-words.mjs` quét cả các tệp khung).

## 5. Storyboard và SFX

`scripts/build-storyboard.mjs` chỉ chứa thứ riêng của bài; `storyboard.lib.mjs` thêm lời đọc, thời lượng, `src`, `status`, `transition_in`, rồi ghi `STORYBOARD.md` và `_video-direction.md`. Hình dạng tệp như chương IV (`frames.md` §6 của skill đó): một mảng `F`, mỗi khung `{ scene, sc: [[giây trong khung, mô tả], …], sfx, at }`, mốc lấy qua `rel(n, B.fN.<mốc>)`, không gõ tay.

- `scene` và `sc` tả **cả con phố lẫn cột chữ**, và phải khớp với thứ `world.js` thật sự vẽ. Sửa hình thì sửa luôn dòng tả; người đọc storyboard không mở canvas.
- Khung Chốt dùng chung một câu tả thẻ (hằng `CHOT` trong ví dụ).
- `direction`: sửa từ ví dụ phần nghĩa của màu (đỏ và xanh chỉ dành cho ✕ và ✓; màu của biển là màu thật), nhịp theo số khung, và danh sách cấm.
- `music`: một dòng cho máy tạo nhạc, cùng nội dung với `prompt` trong `.hyperframes/bgm_request.json`: nền êm, tò mò, không lời, không trống mạnh.

**SFX của chương**, như đã dùng ở Bài 1 (11 lần trên 22 khung):

| SFX | Ở đâu | Bài 1 |
|---|---|---|
| `ping` | Câu hỏi mở đầu, lúc câu hỏi bắt đầu hiện | khung 1 |
| `whoosh-short` | Tấm biển đổi cách "diễn": tách lớp, đổi hình trên cột, sang phố xếp chồng | khung 2, 12, 15 |
| `chime` | Mỗi khung Chốt, lúc thẻ Chốt hiện | khung 7, 9, 14, 16, 21 |
| `pop` | Câu hỏi mở đầu được trả lời (dấu ✓ quyết định) | khung 11 |
| `click` | Một lần đổi trạng thái đáng nhớ của xe | khung 20, tháo rơ moóc |

Không đặt SFX cho từng dấu ✓/✕ hay từng thẻ. Âm lượng SFX 0,22. Nhạc nền bắt đầu ở 0,3 (`lock-audio.mjs --bgm 0.3`), rồi đo bằng `mix-balance.mjs` và đặt theo số nó gợi ý (Bài 1: 0,35). Tên SFX phải có trong `$HF/media-use/audio/assets/sfx/`; tên sai bị bỏ qua không báo, nên đếm số SFX mà `lock-audio.mjs` in ra.
