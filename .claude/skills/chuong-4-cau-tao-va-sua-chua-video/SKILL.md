---
name: chuong-4-cau-tao-va-sua-chua-video
description: "Sản xuất video cho nhóm bài Cấu tạo và sửa chữa (Chương IV, Bài 1–9) của repo sat-hach-lai-xe: mở máy ra xem trên một bàn máy 2D (mặt cắt xi lanh, chiếc xe thân kính, bộ phận chuyển động khớp từng chữ lời đọc), mỗi ý đi qua ba bước có tên trên hình (xem nó làm việc, gọi đúng tên, dễ nhầm với), cột chữ bên trái sinh từ mốc lời đọc, giọng Gemini Leda, phụ đề, nhạc rồi render MP4. Dùng khi người dùng nói 'làm video bài <số> chương 4', 'video cấu tạo và sửa chữa', 'làm tiếp bài <tên bài>', 'làm phần 2 bài động cơ', 'video BAI-0x' của chương 4, hoặc đưa một brief trong video-briefs/chuong-4-cau-tao-va-sua-chua."
---

# Video Cấu tạo và sửa chữa (mở máy ra xem)

Skill này đóng gói cách đã làm video thử nghiệm Bài 1 "Động cơ: nơi nhiên liệu biến thành chuyển động", phần 1 (5:43, 21 khung, người dùng đã duyệt), để làm tiếp các bài còn lại của chương. **Làm một bài thì đọc `references/series.md` trước:** luật nội dung của chương, khuôn ba bước của một ý, ngân sách thời lượng, bảng 9 bài và bài nào cần vẽ thêm gì.

Nó là **lớp "bài học cấu tạo"** đặt lên hai skill khác và không lặp lại chúng:

- `.claude/skills/vi-explainer-video/SKILL.md`: cài đặt, font, giọng đọc, nhạc, phụ đề, render (bước 0, các nguyên tắc cố định, `references/audio.md`, `references/voices.md`, `references/pitfalls.md`). Đọc trước.
- `.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`: `new-project.sh` của skill này mượn từ đó hai tệp toán (`path.js`, `stage.js`) và tám script lắp ráp, kiểm, chụp ảnh. Không mượn three.js hay mô hình 3D nào: video của chương này vẽ bằng canvas 2D.

Chương này khác hai nhóm bài trước. Sa hình nhìn một nút giao từ trên cao; Kỹ thuật lái xe kể một chuyến xe từ ghế lái. Chương IV phần lớn là **định nghĩa**: bộ phận nào làm việc nào, và không làm việc nào. Người học hay gán nhầm việc của bộ phận này cho bộ phận kia. Vì vậy video **mở máy ra trên một bàn máy**: bộ phận chuyển động trước mắt, tên gọi hiện đúng lúc lời đọc nhắc tới, định nghĩa sáng dần từng chữ, rồi thứ hay bị nhầm được đặt ngay cạnh.

## Hai bên

| Bên | Việc |
|---|---|
| `sat-hach-lai-xe` (repo nội dung) | Soạn `video-briefs/chuong-4-cau-tao-va-sua-chua/BAI-NN-*.md`: câu hỏi mở đầu, ý lớn, từng ý với dòng **Chốt** và phần "vì sao", chỗ hay hiểu sai, các dòng ghi nhớ. Luật của chương, bảng thuật ngữ và danh sách hình có sẵn ở `README.md` cùng thư mục; bảng đối chiếu nguồn ở `DOI-CHIEU.md` |
| `my-designer` (repo này) | Dựng video từ brief, kiểm, render, báo cáo; báo chỗ brief thiếu hay chưa chắc |

Repo kia chỉ đọc. Tệp duy nhất được sửa ở đó là `VIDEO-HANDOFF.md`, và chỉ khi người dùng yêu cầu.

## Trong skill có gì

```
chuong-4-cau-tao-va-sua-chua-video/
  SKILL.md
  references/     series.md, bench.md, frames.md, qa.md
  scripts/        new-project.sh
  kit/            phần dùng chung của chương, chép nguyên vào mỗi dự án
    assets/lib/world/draw.js       bảng màu theo nghĩa (PAL) và nét vẽ: mũi tên, nhãn chỉ vào vật,
                                   viên chữ, dấu sai, ngọn lửa, sóng nhiệt
    assets/lib/world/bench.js      bàn máy: nền, vùng vẽ STAGE, hàm hiện và tắt theo mốc (vis, gate,
                                   litSeq), đặt một hình vào chỗ (S), createBench()
    assets/lib/world/timeline.js   đường theo thời gian: linear, stepped, odometer…
    assets/lib/world/engine.js     động cơ: một xi lanh cắt dọc chạy đủ bốn hành trình, dãy bốn xi lanh
                                   chung trục khuỷu có bánh đà, chân người đạp xe
    assets/lib/world/car.js        chiếc ô tô thân kính nhìn ngang (bình nhiên liệu, động cơ, đường
                                   truyền lực, bánh chủ động), bánh xe, phanh đĩa, giá kê
    compositions/world.html        lớp canvas của video
    scripts/voice.mjs              giọng đọc từ SCRIPT.md tới mốc từng chữ: request, run, align, pad
    scripts/bench-check.mjs        chạy bàn máy trong Node cho mọi 0,05 giây: lỗi, NaN, dấu vân tay
    scripts/bench-shots.mjs        ảnh riêng bàn máy trong vài giây, không cần lắp ráp
    scripts/frames.bench.mjs       lớp chữ của chương: thanh ba bước, câu hỏi, viên màu theo nghĩa
    scripts/frames.kit.mjs         vỏ khung, CSS, các hàm chuyển động (IN, PILL, RING…), icon
    scripts/frames.ctx.mjs         đọc cues.js và beats.js cho các script sinh
    scripts/frames.lib.mjs         khối dựng cột chữ: thẻ, dòng, câu sáng dần, ghi nhớ
    scripts/storyboard.lib.mjs     ghi STORYBOARD.md từ SCRIPT.md và mốc thật
    scripts/scan-words.mjs         quét chữ bị cấm của chương
  examples/bai-01-dong-co/            điểm xuất phát mặc định: Bài 1, ý 1 và 2
    BRIEF.md, SCRIPT.md, .hyperframes/{tts_request,bgm_request}.json
    assets/lib/world/{beats,world,widgets}.js
    scripts/{build-frames,build-storyboard}.mjs
```

Từ `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`, `new-project.sh` chép thêm `assets/lib/world/{path,stage}.js` và các script `assemble.sh`, `build-cues.mjs`, `check-frames.sh`, `check-watermark.sh`, `frame-times.mjs`, `lock-audio.mjs`, `patch-index.mjs`, `snap.sh`. Skill kia và `vi-explainer-video` phải có mặt trong repo.

Skill không chứa tệp giọng, clip mẫu hay profile giọng nào, và không bao giờ được chứa. Không có khoá API nào trong các tệp request.

## Tái sử dụng được gì

| Mức | Thứ |
|---|---|
| **Dùng nguyên** | Toàn bộ `kit/`: bàn máy, bảng màu theo nghĩa, nét vẽ, xi lanh và dãy xi lanh, chiếc xe thân kính, bánh xe và phanh; thanh ba bước và bộ khối cột chữ; công cụ giọng đọc, hai công cụ kiểm bàn máy, các script; hệ thiết kế `glass-keynote`; cách làm nhạc, phụ đề, render |
| **Sửa từ ví dụ** | Năm tệp riêng của bài: `beats.js` (mốc lời đọc và các đường chuyển động), `world.js` (các hình trên bàn máy), `widgets.js` (các bảng: dải mắt xích, thanh bốn hành trình, bảng so sánh), `build-frames.mjs` (cột chữ), `build-storyboard.mjs`; cùng `BRIEF.md`, `SCRIPT.md` và hai tệp request |
| **Tạo mới** | Bộ phận chưa vẽ: các-te và que thăm dầu, ly hợp, hộp số, các đăng, vi sai, cơ cấu lái, ắc quy và máy phát, dây đai, túi khí, kính, các ký hiệu trên bảng đồng hồ, kích, búa, bình chữa cháy, đèn xe, ống xả, lốp. Bảng theo từng bài ở `references/series.md` §5; cách thêm ở `references/bench.md` §6 |

Cấu hình đã chạy thật: một video, 21 khung, 924 âm tiết lời đọc, 343 giây, giọng Leda. Chưa bài nào khác được làm bằng skill này.

## Yêu cầu cố định của video chương này

1. **Bàn máy ở bên phải, chữ ở bên trái.** Hình vẽ trong vùng x 720–1860, trên y 850. Cột chữ ở x 64–620, không gì dưới y 880 (phụ đề nằm dưới y 896).
2. **Mỗi ý đi qua ba bước, và ba bước ấy có tên trên hình:** XEM NÓ LÀM VIỆC → GỌI ĐÚNG TÊN → DỄ NHẦM VỚI. Thanh ba bước nằm đầu cột chữ suốt phần giảng của ý đó.
3. **Hình làm đúng điều lời đọc đang nói, đúng lúc nó được nói.** Mọi thay đổi trên bàn máy neo vào một cụm từ của lời đọc qua `beats.js`. Không có chuyển động trang trí.
4. **Chỉ gọi tên thứ bài gọi tên.** Nhãn trên hình là thuật ngữ của bài, đúng bảng thuật ngữ của chương. Chi tiết bài không nhắc tới thì không có nhãn, kể cả khi hình phải vẽ nó.
5. **Hình là sơ đồ, không theo tỉ lệ.** Mỗi lựa chọn minh hoạ bài không quy định (kiểu xe, chỗ đặt máy, xe kê trên giá) phải ghi vào mục Notes của `BRIEF.md` và vào báo cáo.
6. **Màu là nghĩa, dùng thống nhất cả chương:** hổ phách là nhiên liệu; xanh da trời là không khí, khí mới; cam là sức nóng; xanh lá là chuyển động, lực, sinh công; xám tím là khí đã cháy; đỏ là cách hiểu sai; tím nhạt là thuật ngữ trung tính. Bài mới cần thêm nghĩa (dầu bôi trơn, dòng điện) thì thêm vào bảng ở `references/bench.md` §3, không mượn màu đã có nghĩa.
7. **Hình và màu của ký hiệu là kiến thức** (Bài 5, 7, 8). Vẽ lại đúng lời tả trong bài và ảnh ở mục "Hình có sẵn" của README; màu của ký hiệu thắng bảng màu ở điều 6. Ảnh chỉ để tham khảo, không dán vào video.
8. **Định nghĩa là câu sáng dần từng chữ trong thẻ có viền tím nhạt**, đúng nguyên văn dòng Chốt đã chọn cho lời đọc. Dấu đúng xanh và dấu sai đỏ chỉ dùng ở khung "dễ nhầm". Chữ gradient chỉ dùng cho tên bài ở khung 1.
9. **Không có con số nào bài không có.** Biểu đồ và thanh chỉ so độ lớn với nhau.

## Nguyên tắc nội dung

Luật đầy đủ ở `README.md` của thư mục brief; tóm tắt và cách áp dụng ở `references/series.md` §1.

- **Dòng Chốt là định nghĩa chuẩn.** Được nói gọn hơn, không thêm, không bớt, không đổi nghĩa. Từng chữ có việc của nó: "truyền hoặc ngắt", "một phần lực va đập", "không tắt trong thời gian dài", "trong khoảng giữa hai vạch".
- **Danh sách đánh số là trình tự thật.** Giữ đúng số và thứ tự, trên lời đọc và trên hình.
- **Số trong quy tắc giữ nguyên** (4 hành trình và một lần sinh công, 25 năm, 20 năm, trên 8 chỗ ngồi). Số trong ví dụ là xấp xỉ: giữ chữ "khoảng", "vài".
- **Giữ nguyên chữ rào đón** ("trên nhiều xe", "trên hầu hết các xe", "thường").
- **Không thêm kiến thức ngoài bài.** Thiếu thì ghi vào báo cáo.
- **Video đứng một mình.** Không số câu, không kỳ thi, không cuốn sách, ở lời đọc, chữ trên hình và phụ đề. `scripts/scan-words.mjs` kiểm.
- **Mỗi video mang theo "Ý lớn của bài"**, kể cả phần 2, phần 3 của cùng một bài.
- **Phần "vì sao" do người soạn bài viết, mới được AI soát, chưa có giáo viên dạy lái xe duyệt.** Báo cáo nào cũng ghi điều này.
- **Giọng mặc định là Gemini Leda.** Giọng nhân bản chỉ khi người dùng yêu cầu, theo `vi-explainer-video/references/voices.md`.

## Đường dẫn

```bash
ROOT=$(git rev-parse --show-toplevel)
S=$ROOT/.claude/skills/chuong-4-cau-tao-va-sua-chua-video
SK=$ROOT/.claude/skills/vi-explainer-video
HF=<thư mục có faceless-explainer; new-project.sh in ra ở dòng "HF:">
FX=$HF/faceless-explainer/scripts
ENGINE=$HF/media-use/audio/scripts/audio.mjs
P=$ROOT/videos/<ten-du-an>
BRIEFS=/Users/phucnt/workspace/sat-hach-lai-xe/video-briefs/chuong-4-cau-tao-va-sua-chua
```

Mỗi lệnh Bash là một shell mới: khai báo lại biến trong cùng lệnh, và dùng `(cd "$P" && …)`. Lệnh CLI viết `hyperframes …`; máy không có lệnh đó thì thay bằng `npx -y hyperframes …` (viết thẳng, không cất vào biến).

## Quy trình

### 1. Đọc brief và chia video

Đọc `$BRIEFS/README.md` rồi `BAI-NN-*.md` của bài, và dòng của bài trong `references/series.md` §4–§5. Quyết định trước khi viết gì:

- **Bài này thành mấy video.** Một video khoảng 5 đến 6 phút, trọn hai ý (bài nào ý dài thì một ý). Khoảng 890 âm tiết lời đọc là 5 phút rưỡi (`references/series.md` §3). Nói rõ trong báo cáo ý nào để lại.
- **Mỗi ý: bộ phận nào lên bàn máy, nó chuyển động thế nào, thứ gì đặt cạnh ở bước "dễ nhầm".** Thứ dễ nhầm lấy từ mục "Những chỗ hay hiểu sai" của brief, không tự nghĩ ra. Bộ phận đã có trong `kit/` chưa (`references/series.md` §5).
- **Bài có dòng Chốt nào, danh sách đánh số nào, con số nào, chữ rào đón nào.** Chép nguyên văn sang một bên để soát lại ở bước 3 và bước 9.

Brief thiếu thứ không suy ra được thì hỏi người dùng một lần. Thứ khác chọn mặc định hợp lý, ghi vào báo cáo, rồi làm tiếp.

### 2. Tạo dự án

```bash
bash .claude/skills/chuong-4-cau-tao-va-sua-chua-video/scripts/new-project.sh chuong-4-bai-<NN>-<ten-ngan>
```

Lệnh tạo `videos/<ten-du-an>` (HyperFrames trống, font tiếng Việt, `glass-keynote`), chép phần mượn của `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`, `kit/` của chương và các tệp của ví dụ Bài 1. Ghi lại dòng `HF:`. `--bare` bỏ phần ví dụ; dự án khi đó chưa chạy được cho tới khi có đủ năm tệp riêng của bài. `videos/` nằm trong `.gitignore`; không `git add -f` gì ở đó.

### 3. BRIEF.md và SCRIPT.md

Sửa `BRIEF.md`: thông điệp một câu, khán giả, độ dài, `voice: Leda`; mục Notes ghi dòng Chốt, danh sách, con số của bài và mọi lựa chọn minh hoạ. `storyboard.lib.mjs` đọc `message:` và `audience:` từ tệp này.

Viết `SCRIPT.md` theo khuôn ở `references/series.md` §2: một khung câu hỏi mở đầu; một đến hai khung ý lớn; mỗi ý gồm các khung "xem nó làm việc", một khung định nghĩa, một đến hai khung "dễ nhầm với"; một đến hai khung ghi nhớ; khung cuối là câu hỏi để dành cho phần sau, hoặc một câu kết.

- Tiêu đề `## Line N — <tên> (Frame N)`; lời đọc thụt 4 dấu cách. Tên tệp khung sinh từ tiêu đề, nên các tiêu đề phải khác nhau.
- Mỗi câu trọn ý, không quá khoảng 20 âm tiết. **Mỗi thay đổi trên hình cần một cụm từ riêng trong lời đọc để neo mốc.** Cụm lặp lại trong cùng khung thì lấy mốc bằng `{ nth: 2 }`.
- Khung định nghĩa đọc đúng một câu: dòng Chốt. Lời dẫn đặt ở cuối khung trước.
- Soát từng dòng Chốt, từng danh sách đánh số và từng con số với bản chép ở bước 1.
- `node scripts/scan-words.mjs` phải ra `clean`.

### 4. Giọng đọc và mốc lời đọc

Sửa `style` trong `.hyperframes/tts_request.json` cho hợp bài (giữ `provider`, `tts_model`, `voice`, `lang`). Rồi:

```bash
(cd "$P" && node scripts/voice.mjs request)            # lines lấy từ SCRIPT.md; in số âm tiết và thời lượng ước tính
(cd "$P" && node scripts/voice.mjs run)                # chạy nền: 7 dòng mỗi lượt, nghỉ 66 giây giữa hai lượt, tự chạy bù tới 3 vòng
(cd "$P" && node scripts/voice.mjs align)              # chữ kịch bản lên mốc đã nghe; in chỗ nghe khác kịch bản
(cd "$P" && node scripts/voice.mjs pad 08=1.5 16=1.7)  # khoảng lặng sau chữ cuối: 0,45 giây, hoặc số ghi cho từng khung
(cd "$P" && node scripts/build-cues.mjs)               # ghi assets/lib/world/cues.js
```

- `voice.mjs` đọc khoá từ biến môi trường `GEMINI_API_KEY`, che khoá trong mọi dòng in ra và không ghi khoá vào tệp nào. Khi nó không tự tìm thấy bộ skill HyperFrames, đặt `HF=…` trước lệnh.
- **Đọc danh sách "heard differently" của `align`.** Chỗ nghe khác kịch bản mà đổi nghĩa (thiếu chữ, sai thuật ngữ, sai số) thì làm lại dòng đó: `node scripts/voice.mjs run 07`, rồi `align`, `pad`, `build-cues.mjs`.
- Khoảng lặng dài hơn cho khung mà hình còn việc sau chữ cuối: khung định nghĩa 1,5–1,7 giây, khung cuối khoảng 2,6 giây, khung 1 khoảng 1,3 giây. `pad` nhớ các số đã cho trong `.hyperframes/voice_tails.json`; nó chỉ thêm, không cắt bớt.
- Chạy lại `build-cues.mjs` sau mọi thay đổi về giọng. Mọi mốc phía sau đọc từ `cues.js`.

### 5. Bắt đầu nhạc nền

Sửa prompt trong `.hyperframes/bgm_request.json`, rồi chạy sau khi giọng đã chốt (nhạc dài đúng bằng tổng lời đọc):

```bash
(cd "$P" && node "$ENGINE" --request ./.hyperframes/bgm_request.json --hyperframes . --out ./audio_engine_meta.json --only bgm 2>&1 | sed -E 's/(AIza|key=)[A-Za-z0-9_-]+/\1***/g; s/[A-Za-z0-9_-]{36,}/<redacted>/g')
```

Nhạc chạy nền vài phút; trong lúc đó làm bước 6.

### 6. Bàn máy

Ba tệp riêng của bài trong `assets/lib/world/`. API và hợp đồng giữa chúng ở `references/bench.md`.

| Tệp | Việc |
|---|---|
| `beats.js` | `buildBeats(K)`: mọi mốc mà hình phản ứng, đặt tên theo khung (`B.f5.knee`), và các đường chuyển động của bài (góc trục khuỷu, bánh xe, vị trí xe). Bàn máy, lớp chữ và storyboard cùng đọc tệp này |
| `world.js` | `createWorld({ canvas })`: mỗi hình trên bàn máy là một hàm `xxxPicture(t)` tự hiện và tự tắt theo mốc; `draw(t)` gọi lần lượt các hình; cuối tệp `return createBench({ c, total, beats: B, draw })` |
| `widgets.js` | Các bảng của bài (dải mắt xích, thanh bốn hành trình, bảng so sánh), là hàm thuần của trạng thái truyền vào |

Sau mỗi lần sửa, kiểm và xem ngay, không chờ lắp ráp:

```bash
(cd "$P" && node scripts/bench-check.mjs)                          # 0 error, 0 NaN trên mọi 0,05 giây
(cd "$P" && node scripts/bench-shots.mjs try 3 "4:2.5,4:6,9:1")    # snapshots/bench/try.jpg, khung:giây-trong-khung
(cd "$P" && node scripts/bench-shots.mjs mid 4 mid)                # mỗi khung một ảnh ở giữa khung
```

Lỗi `cue not found: frame N "…"` nghĩa là cụm từ không có trong lời đọc của khung đó: sửa cụm cho khớp chữ trong `SCRIPT.md`.

### 7. Lớp chữ và storyboard

- `scripts/build-frames.mjs`: một hàm cho mỗi khung, trả về `frame(n, body, js)`; cuối tệp `writeFrames([f1, f2, …])`. Chữ trên thẻ là lời đọc rút gọn, không thêm ý. Thanh ba bước, câu hỏi, thẻ định nghĩa và các khối khác ở `references/frames.md`.
- `scripts/build-storyboard.mjs`: mỗi khung một `scene`, các pha `sc`, SFX; tiêu đề, dòng nhạc và block Video direction; cuối tệp `writeStoryboard({ … })`.

```bash
(cd "$P" && node scripts/build-storyboard.mjs)         # STORYBOARD.md từ SCRIPT.md và mốc thật
```

Khung không giao cho worker: mọi tệp khung do `build-frames.mjs` sinh ra, nên chữ và hình rơi cùng một mốc.

### 8. Chốt âm thanh

```bash
(cd "$P" && node "$HF"/media-use/audio/scripts/wait-bgm.mjs --audio-meta ./audio_engine_meta.json --hyperframes . --timeout-ms 300000 --out ./.hyperframes/bgm_status.json)   # phải "ready"
(cd "$P" && node "$FX"/audio.mjs fetch-sfx --storyboard ./STORYBOARD.md --hyperframes .)
(cd "$P" && node scripts/lock-audio.mjs --bgm 0.3)     # SFX về đúng sfx_at, âm lượng 0.22
(cd "$P" && node "$FX"/audio.mjs sync-durations --storyboard ./STORYBOARD.md --audio-meta ./audio_meta.json --hyperframes .)
```

Tên SFX phải có trong `$HF/media-use/audio/assets/sfx/`; tên sai bị bỏ qua không báo. Đếm số SFX mà `lock-audio.mjs` in ra. Cách dùng SFX của chương ở `references/frames.md` §6.

### 9. Lắp ráp và kiểm

```bash
(cd "$P" && HF="$HF" bash scripts/assemble.sh --captions)
(cd "$P" && node scripts/scan-words.mjs)               # clean; lần này quét cả khung, phụ đề và nhãn trên bàn máy
(cd "$P" && node scripts/bench-check.mjs)              # 0 error, 0 NaN
(cd "$P" && node "$SK"/scripts/mix-balance.mjs)        # mục tiêu: nhạc dưới giọng 12 dB
(cd "$P" && hyperframes lint)                          # 0 error
(cd "$P" && npm run check)                             # "Check passed"; mất vài phút
(cd "$P" && bash scripts/snap.sh mid  "$(node scripts/frame-times.mjs mid)")
(cd "$P" && bash scripts/snap.sh late "$(node scripts/frame-times.mjs late)")
```

- `assemble.sh` sinh lại khung, chạy `check-frames.sh`, dựng phụ đề, lắp `index.html`, gắn lớp canvas và đặt thời lượng cho `world.html` (`patch-index.mjs`), chèn chuyển cảnh. Dòng `bgm (track 11)` phải là `yes`.
- **Đọc từng contact sheet**, rồi chụp thêm theo `references/qa.md` §2: mỗi hình lúc nó vừa hiện đủ, mỗi nhãn lúc nó sáng, mỗi lần hình đổi trạng thái một ảnh trước và một ảnh sau, khung định nghĩa lúc chữ cuối đã sáng.
- **Soát nội dung trên ảnh:** dòng Chốt đủ từng vế; danh sách đúng số và thứ tự; nhãn nào cũng là chữ của bài; màu đúng nghĩa.
- Sửa ở tệp nguồn, không sửa tệp khung đã sinh, rồi `assemble.sh` lại.
- Kết quả đã biết là báo nhầm: xem `references/qa.md` §3.

### 10. Render, đo, báo cáo

```bash
(cd "$P" && hyperframes render --skill=faceless-explainer --quality high --output renders/video.mp4)   # chạy nền
```

Đo và so ảnh trích từ MP4 với ảnh chụp theo `vi-explainer-video/SKILL.md` bước 10 (ffprobe, LUFS −14 đến −16, true peak ≤ −1 dBFS, `blackdetect` 0). Bản gửi qua kênh có giới hạn dung lượng: `references/qa.md` §5.

Báo cáo theo `references/qa.md` §6. Ngoài sáu mục của `vi-explainer-video`, video chương này có thêm:

- **Phạm vi:** video gồm ý nào của bài, ý nào để lại cho phần sau.
- **Đối chiếu brief:** từng dòng Chốt, danh sách và con số đã giữ thế nào; chỗ brief thiếu hay chưa chắc.
- **Lựa chọn minh hoạ:** hình vẽ ra điều gì mà bài không quy định, và nhãn nào đã cố ý không đặt.
- **"Vì sao" chưa có giáo viên duyệt.**
- **Tài sản:** dùng lại gì, vẽ mới gì.
- **Agent không nghe được âm thanh và không xem được chuyển động.**

### Sau khi xong

1. Thêm một dòng vào bảng "Đã làm" của `references/series.md` §6 và cập nhật cột trạng thái ở §4.
2. Bộ phận hay bảng mới vẽ mà bài khác cũng dùng được (ắc quy, ký hiệu đèn báo, thanh các bước) thì chuyển từ `world.js`, `widgets.js` hay `build-frames.mjs` của dự án về `kit/` của skill, ghi vào `references/bench.md` hay `references/frames.md`, rồi kiểm rằng ví dụ Bài 1 vẫn ra đúng dấu vân tay cũ (`references/qa.md` §4).
3. Người dùng đã duyệt video của một bài có loại hình khác hẳn (ký hiệu trên bảng đồng hồ, các bước thao tác với dụng cụ) thì chép phần riêng của nó thành một thư mục mới trong `examples/`: `BRIEF.md`, `SCRIPT.md`, hai tệp request, `beats.js`, `world.js`, `widgets.js`, `build-frames.mjs`, `build-storyboard.mjs`. Không kèm `assets/voice`, `assets/bgm`, `assets/sfx`, `renders`, `snapshots`, `audio_*.json`, `cues.js`, `.hyperframes/whisper_words.json`.

## Tham khảo

| Tệp | Khi nào đọc |
|---|---|
| `references/series.md` | **Trước tiên:** luật nội dung, khuôn ba bước, ngân sách thời lượng, bảng 9 bài, bài nào cần vẽ gì, bảng "Đã làm" |
| `references/bench.md` | Bước 6: toạ độ, `beats.js`, cách viết một hình, bảng màu, API của `bench`, `draw`, `engine`, `car`, `timeline`, cách thêm bộ phận mới |
| `references/frames.md` | Bước 7: bố cục cột chữ, thanh ba bước, thẻ định nghĩa, các khối, các hàm chuyển động, storyboard, SFX |
| `references/qa.md` | Bước 9–10: phép kiểm, ảnh cần đọc, báo nhầm đã biết, kiểm sau khi sửa `kit/`, bản xem thử, mẫu báo cáo, lỗi đã gặp |
| `.claude/skills/vi-explainer-video/` | Cài đặt, giọng, nhạc, phụ đề, render, `references/pitfalls.md` |
| `.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/references/world.md` | `path.js`, `stage.js` (`cueKit`), các script mượn |
| `.claude/skills/chuong-3-ky-thuat-lai-xe-video/` | Nhóm bài chương III, cùng bộ khối cột chữ |
