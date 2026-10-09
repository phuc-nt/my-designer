# Khuôn của loạt video V01–V29

Loạt video sa hình gồm 29 video; mỗi video bốn tình huống, riêng V01 ba. Brief nằm ở `video-briefs/` của repo `sat-hach-lai-xe`; luật chung của loạt nằm ở `video-briefs/README.md` §2 của repo đó. Tệp này ghi **những gì đã chốt ở V02 và dùng lại cho mọi video sau**: luật nội dung, cấu trúc khung, ngân sách thời lượng, giọng, tài sản đã có, và việc phải làm sau mỗi video.

V02 (`examples/v02-nga-tu-co-bien/`) là điểm xuất phát mặc định. Ví dụ `cau-502-504-506` là khuôn cũ (có mở đầu, đọc phương án, đếm ngược, giọng nhân bản); chỉ mở nó để lấy kiểu nút giao có đèn tín hiệu và vòng xuyến (§7).

Luật của loạt đổi thì `video-briefs/README.md` là bản gốc: đọc lại tệp đó ở đầu mỗi video, và sửa tệp này cho khớp.

## 1. Luật nội dung của loạt

| Luật | Nghĩa là |
|---|---|
| Không mở đầu | Giây đầu tiên đã là Tình huống 1 |
| Không phương án | Không hiện, không đọc các lựa chọn; không đếm ngược 3-2-1; không tô xanh lựa chọn đúng |
| Nội dung đứng riêng | Trên hình, trong lời đọc và phụ đề **không có**: số câu hỏi, "câu", "đáp án", "phương án", "đề", "sát hạch", "kỳ thi", "ôn thi", tên sách, "600" |
| Tên gọi | "Tình huống 1" đến "Tình huống N". Chữ cái trên xe và số hướng đi vẫn dùng được |
| "Đối chiếu nguồn" trong brief | Chỉ để bên này kiểm thứ tự và kết luận. Không lên hình, lời đọc, phụ đề |
| Bước "(suy thêm ngoài câu hỏi gốc)" | Được bỏ khi thiếu thời lượng. Bỏ bước nào thì ghi vào báo cáo |
| Thời lượng | Khoảng 5 phút cho bốn tình huống. **Không vừa thì báo lại; không tự cắt phần lý do** |
| Giọng | Gemini **Leda** khi brief và người dùng không chỉ định khác. Giọng nhân bản chỉ khi chủ giọng đồng ý và video phi thương mại |

Kiểm luật "nội dung đứng riêng" bằng máy, không bằng mắt:

```bash
(cd "$P" && node scripts/scan-words.mjs)      # sau khi viết SCRIPT.md, và lần nữa sau assemble.sh
```

Phải ra `clean (…)`. Lệnh quét `SCRIPT.md`, tệp request giọng, `caption_groups.json` và chữ nhìn thấy được của mọi tệp khung. Từ nối như "câu trả lời" cũng bị bắt: viết lại ("kết luận", "lời giải").

## 2. Cấu trúc: 4N + 1 khung

Mỗi tình huống bốn khung, cuối video một khung tổng kết. Bốn tình huống cho 17 khung.

| Khung | Lời đọc | Cột chữ | Bản đồ 3D |
|---|---|---|---|
| **Tình huống** | "Tình huống N." Tả các xe, rồi câu hỏi lấy từ mục "Câu hỏi nêu trong video" của brief | Câu hỏi hiện từng chữ; thẻ từng xe; thẻ nhỏ "Tự nghĩ thử trước khi xem tiếp" | Camera lướt tới ô; xe đứng chờ; nhãn xe sáng khi được nhắc tên |
| **Quy tắc** | Nhìn biển nào, biển nói gì, quy tắc nào áp dụng | Mỗi biển một thẻ có icon vẽ cùng màu với biển; thẻ quy tắc | **Kính lúp mở trên từng biển**, xung quanh chuyển xám; dải màu tô đường ưu tiên |
| **Xe chạy** | Mỗi xe một cụm riêng: vì sao tới lượt, rồi "… đi" | Danh sách thứ tự, từng dòng sáng theo lời đọc | Xe chạy lần lượt theo mốc lời đọc; mũi tên đường đi nổi lên; xe phải nhường mang nhãn đỏ |
| **Chốt** | Mục "Kết luận nêu trong video", rồi mẹo nhớ | Thẻ kết luận; thẻ "MẸO NHỚ" | Đứng yên; cuối khung panel trượt ra cùng cột chữ |
| **Tổng kết** (một lần) | Mỗi tình huống một dòng mẹo nhớ | Băng trên cả chiều ngang, bốn dòng | Toàn cảnh bốn ô (`VIEWS.wide`, `d: 400`) |

- Khoảng nghĩ ở cuối khung Tình huống là **khoảng lặng trong tệp giọng** (`vi-explainer-video/references/audio.md` §3), không phải đồng hồ đếm.
- Camera chỉ lướt một lần ở đầu mỗi khung Tình huống và một lần sang toàn cảnh ở khung Tổng kết.
- Tiêu đề trong `SCRIPT.md` theo mẫu `## Line 5 — Tình huống 2: ba xe, xe nào đi cuối (Frame 5)`. Tên tệp khung sinh từ tiêu đề, nên tiêu đề phải khác nhau.
- Thanh bốn bước ở góc trên trái (`header`) ghi: Tình huống, Quy tắc, Xe chạy, Chốt.

## 3. Ngân sách thời lượng

Số đo của V02, giọng Leda với style ở §4:

| | Giây | Âm tiết |
|---|---|---|
| Cả video (17 khung) | 391 (6:31) | 1041 |
| Khung Tình huống | 13–15 | 30–38 |
| Khung Quy tắc | 20–33 | 64–94 |
| Khung Xe chạy | 21–31 | 64–89 |
| Khung Chốt | 16–18 | 37–44 |
| Khung Tổng kết | 42 | 104 |

Nhịp chung: **2,7 âm tiết mỗi giây**, đã tính khoảng lặng. Trung bình 94 giây một tình huống.

Muốn 5 phút thì cả video khoảng **800 âm tiết**: mỗi tình huống khoảng 185 (Tình huống 30, Quy tắc 60, Xe chạy 65, Chốt 30), tổng kết khoảng 60.

Đếm âm tiết của `SCRIPT.md` **trước khi tạo giọng**. Vượt quá 10% thì nói với người dùng ngay lúc đó, kèm các cách rút: bỏ bước "suy thêm"; tổng kết chỉ còn bốn dòng mẹo, không câu dẫn và câu chào; khung Quy tắc không nhắc lại điều khung Tình huống đã nói. Không rút lý do vì sao một xe được đi trước.

## 4. Giọng Gemini

`.hyperframes/tts_request.json` của ví dụ dùng được ngay: `provider: gemini`, `tts_model: gemini-3.8-flash-tts`, `voice: Leda`, `lang: vi`, `style` yêu cầu giọng Bắc, chậm lại ở tên biển và thứ tự xe, đọc số bằng tiếng Việt. Mỗi khung một mục trong `lines` (`id` hai chữ số, `text` là lời đọc của khung).

Làm theo `vi-explainer-video/references/audio.md` §1–§3, rồi `node scripts/build-cues.mjs`.

- **Giới hạn 10 yêu cầu mỗi phút.** 17 khung sẽ gặp lỗi 429 giữa chừng. Chép các mục còn thiếu sang `.hyperframes/tts_redo.json` (cùng phần đầu, `lines` chỉ gồm khung chưa có), chờ một phút, chạy lại với `--out` riêng, rồi gộp `voices` vào `audio_engine_meta.json`.
- **Không in khoá API.** Mọi log qua `sed 's/[A-Za-z0-9_-]\{30,\}/<redacted>/g'`. Không ghi khoá vào tệp nào.
- **Đọc danh sách "whisper nghe khác kịch bản".** Chữ cái tên xe, tên biển và số là chỗ dễ sai. Chỗ nghe khác mà không rõ do whisper hay do giọng thì ghi vào "Chưa kiểm" của báo cáo để người dùng nghe lại.
- Giọng Gemini không có dấu giọng tổng hợp như VoiceStudio: bỏ `check-watermark.sh`. Báo cáo vẫn ghi đây là giọng tổng hợp.
- Phụ đề: `regroup-vi.mjs` đã có danh sách chữ không được đứng cuối dòng ("ngã | tư", "các | xe"). Thấy một cặp bị tách vô lý thì thêm chữ đầu vào `STRANDED` của script đó.

Âm thanh đã chốt ở V02: nhạc 0,3 (dưới giọng 11,9 dB), mỗi khung một SFX ở 0,22, tổng −16,4 LUFS.

## 5. Kính lúp

Hành vi do người dùng chốt, đã nằm trong `kit/assets/lib/world/lens.js`:

- Kính nằm **ngay trên chi tiết nó phóng to**. Không còn vị trí kính trên màn hình.
- Trong lúc kính mở, **phần còn lại của bản đồ 3D chuyển xám**; kính đóng thì màu trở lại. Cột chữ giữ màu.
- Không có bảng tên trên bản đồ. Tên biển nằm ở thẻ của cột chữ, sáng cùng lúc kính mở.

`GLASS` trong `plan.js` chỉ còn cỡ, độ phóng và hướng tay cầm:

```js
const RIGHT = { r: 124, zoom: 3.0, hand: [0.64, -0.77] };   // tay cầm chỉ về phía bãi cỏ
export const GLASS = { "1S": RIGHT, "4S": { ...RIGHT, zoom: 1.4 } };   // khoá = tình huống + nhánh có biển
```

- Biển đơn: `zoom` 3,0. Biển có biển phụ bên dưới cao gấp đôi: `zoom` 1,4 để cả hai tấm nằm trong kính.
- Kính bán kính 124 px sẽ che một phần xe đứng cạnh biển. Chấp nhận được, vì khung Quy tắc nói về biển. Đừng mở kính trong lúc xe đang chạy.
- Hai kính mở nối nhau thì để kính trước đóng xong rồi kính sau mới mở; lớp xám giữ nguyên qua khoảng nối.

## 6. Tài sản đã có

### Mô hình (`kit/assets/models/`)

Xe con đỏ, xe con tím, xe tải xanh, xe tải sẫm, xe khách, mô tô; cột đèn tín hiệu, cột biển, cột đèn đường, cây, nón giao thông, trụ chắn.

### Biển báo (`makeSign(T, kind, { size, post, lean, sub, back })`)

| `kind` | Biển | Dùng lần đầu |
|---|---|---|
| `yield` | Giao nhau với đường ưu tiên (tam giác vàng viền đỏ, đỉnh chúc xuống) | 506 |
| `priority` | Giao nhau với đường không ưu tiên (tam giác đỉnh lên, mũi tên đậm cắt vạch ngang) | 506 |
| `stop` | Dừng lại (bát giác đỏ, chữ STOP) | V02 tình huống 3 |
| `diamond` | Bắt đầu đường ưu tiên (hình thoi vàng viền trắng) | V02 |

- `sub: "left" | "right" | "blank"`: biển phụ "Hướng đường ưu tiên" treo dưới biển chính, nét đậm rẽ trái hoặc phải.
- `back: true`: biển quay lưng về camera, thấy mặt sau màu xám. Dùng cho biển của nhánh đi về phía camera, đúng như hình trong sách.
- `center()` trả điểm cho kính lúp nhắm; có biển phụ thì điểm nằm giữa hai tấm.

Tên biển trong lời đọc và trên thẻ lấy từ brief, không lấy từ bảng này.

### Nút giao

| Kiểu | Ở đâu | Tham số |
|---|---|---|
| Ngã tư vuông góc có biển, hai đường cùng bề rộng | `v02-nga-tu-co-bien` | `G`, `ARM`, `CORNER`, `route(arm, dist, turn)`, `SIT` |
| Ngã ba có đèn chính và đèn phụ mũi tên | `cau-502-504-506` (502) | `G502`, `makeSignal` |
| Vòng xuyến bốn nhánh không biển | `cau-502-504-506` (504) | `G504`, `ringPath` |

Ngã tư của V02 viết theo tham số: một tình huống mới trên cùng kiểu ngã tư chỉ cần một dòng trong `SIT` và các biển của nó.

```js
export const SIT = {
  2: { car: ["N", 15.2, "left"], truck: ["E", 17.2, "right"], bus: ["W", 17.6, "left"] },   // [nhánh, cách tâm, đi đâu]
};
placeSign(b, T, "W", "yield", { sub: "left" });      // biển của nhánh W, đứng ở CORNER.W
```

Ô xoay 45°, nên trên màn hình: nhánh N ở trên trái, E trên phải, S dưới phải, W dưới trái.

### Lớp chữ (`build-frames.mjs` của V02)

Các hàm dùng lại được cho mọi video theo khuôn này: `question` (câu hỏi hiện từng chữ), `pauseCard` (thẻ tự nghĩ), `vehCard` (thẻ một xe), `signCard` (thẻ một biển), `rulesFrame` (cả khung Quy tắc), `rowCard` (một dòng trong danh sách thứ tự), `memo` (thẻ mẹo nhớ), `miniRow` (một dòng tổng kết).

Icon đã vẽ trong `frames.kit.mjs`: `veh`, `ask`, `signInv`, `signUp`, `stop`, `stopLine`, `sub`, `flag`, `go`, `cut`, `swap`, `merge`, `eye`, `none`, `pause`, `play`, `check`, `cross`, `book`, `glass`, `right`, `ring`, `lamp`, `aux`, `noLamp`, `roundabout`, `noRoundabout`.

### Bố cục camera

```js
const SITUATION = { tz: 0, d: 90, ox: -356, oy: 92 };          // một tình huống: ngã tư vừa khít phần bên phải cột chữ
export const VIEWS = { wide: { tx: 0, tz: 0, d: 400, ox: 0, oy: -60 }, 1: { tx: TILE_X[1], ...SITUATION } };
```

`d: 400` vừa bốn ô một hàng. Nút giao to hơn ngã tư của V02 thì tăng `d` của tình huống đó, không thu nhỏ đường.

## 7. Làm video kế tiếp

1. Đọc `video-briefs/README.md` (luật có đổi không) và brief `VIDEO-BRIEF-V<NN>-….md`; mở ảnh cắt của cả bốn câu.
2. Xếp từng tình huống vào bảng "Nút giao" ở §6. Thứ chưa có (biển, đèn, loại xe, kiểu nút giao) thì liệt kê và nói trong tin nhắn nhận việc. Tình huống có ảnh vẽ từ ghế lái (brief có mục "Dựng lại từ trên cao") chưa được thử: hỏi người dùng trước khi nhận.
3. `bash .claude/skills/sa-hinh-video/scripts/new-project.sh sa-hinh-v<NN> --example v02-nga-tu-co-bien`
4. Viết `SCRIPT.md` theo §2, đếm âm tiết theo §3, chạy `scan-words.mjs`.
5. Tạo giọng theo §4, rồi làm tiếp từ bước 5 của `SKILL.md`.
6. Tình huống cần đèn tín hiệu hay vòng xuyến: chép phần của nó (số đo, đường đi, hàm dựng ô) từ ví dụ `cau-502-504-506` vào `plan.js`, `roads.js`, `sites.js` của dự án. Phần kính lúp của ví dụ đó viết theo cách cũ: bỏ `glass: …` và bảng tên `PLATE`, dùng cách ở §5.

Sau khi người dùng duyệt:

- Engine sửa trong dự án mà đúng cho mọi video: chép về `kit/`.
- Biển, icon, mô hình, kiểu nút giao mới: thêm vào bảng ở §6 và vào danh sách "đã có" của `VIDEO-HANDOFF.md`.
- Kiểu nút giao mới: chép phần riêng của video thành một thư mục trong `examples/`.
- Số đo thời lượng lệch nhiều so với §3 (giọng khác, tốc độ khác): cập nhật bảng.
- Nhận xét mới của người dùng về hình: thêm vào "Yêu cầu cố định" của `SKILL.md`.

## 8. Đã làm

| Video | Tình huống | Kiểu nút giao | Kết quả | Tạo mới |
|---|---|---|---|---|
| (thử nghiệm, khuôn cũ) | 502, 504, 506 | ngã ba có đèn, vòng xuyến, ngã tư có biển | 14 khung, 4,6 phút, giọng nhân bản | engine, 12 mô hình, biển `yield` và `priority` |
| V02 | 487, 496, 492, 497 | ngã tư có biển (bốn lần) | 17 khung, 6:31, giọng Leda | biển `stop`, `diamond`, biển phụ hướng đường ưu tiên, mặt sau biển; kính lúp trên chi tiết với nền xám; `scan-words.mjs` |

V01 trong danh sách brief là ba câu 502, 504, 506 viết lại theo luật mới; bản thử nghiệm ở dòng đầu làm theo khuôn cũ và không thay cho V01.
