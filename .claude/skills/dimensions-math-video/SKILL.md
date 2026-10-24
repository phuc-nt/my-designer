---
name: dimensions-math-video
description: "Sản xuất video bài giảng Toán lớp 1 (phỏng theo Dimensions Math, Chương 1 'Các số đến 10' và Chương 2 'Tách và gộp số') cho trẻ sáu tuổi chưa biết đọc: màn hình không có chữ và không phụ đề, mọi ý được diễn trên một bàn vẽ canvas 2D (bàn tay em bé chạm từng đồ vật, mỗi tiếng đếm một bong bóng không chữ, vòng xanh ngọc cho đồ vật đã đếm, vòng hổ phách cho đồ vật bị sót, vòng đỏ cho đồ vật bị đếm hai lần, chữ số viết từng nét bằng bút chì), mọi thay đổi khớp từng tiếng của lời đọc, giọng Gemini Leda, nhạc rồi render MP4. Dùng khi người dùng nói 'làm video bài <số> chương 1 (hay chương 2) toán', 'video toán lớp 1', 'video dimensions-math', 'làm tiếp bài khung mười ô / số 0 / so sánh / số 6…', hoặc đưa một brief trong projects/dimensions-math/video-briefs."
---

# Video Toán lớp 1 (bàn tay đếm, không chữ)

Skill này đóng gói cách đã làm video thử nghiệm Bài 1 Chương 1 "Đếm để biết có bao nhiêu" (5:09, 23 khung, đủ bốn mục và bốn điều Dễ nhầm, xong ngày 2026-10-22), để làm tiếp năm bài còn lại của Chương 1 và tám bài của Chương 2. **Làm một bài thì đọc `references/series.md` trước:** luật nội dung của bộ bài, bảng từ ngữ, khuôn của một video, ngân sách thời lượng, bảng 14 bài và bài nào cần vẽ thêm gì.

Nó là **lớp "bài toán cho trẻ chưa biết đọc"** đặt lên các skill khác và không lặp lại chúng:

- `.claude/skills/vi-explainer-video/SKILL.md`: cài đặt, font, giọng đọc, nhạc, render (bước 0, các nguyên tắc cố định, `references/audio.md`, `references/voices.md`, `references/pitfalls.md`). Đọc trước. Bộ bài này **không dùng phụ đề**, nên bỏ qua mọi phần về `captions.mjs` và `regroup-vi.mjs`.
- `.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`: `new-project.sh` mượn từ đó hai tệp toán (`path.js`, `stage.js`) và bảy script lắp ráp, kiểm, chụp ảnh. Không mượn three.js: bộ bài này vẽ bằng canvas 2D.

Bộ bài này khác các skill video khác ở một điểm: **người xem chưa đọc được chữ.** Không có cột chữ, không có thẻ, không có phụ đề. Thứ duy nhất trẻ đọc trên màn hình là dấu "?" và chữ số. Vì vậy mỗi ý phải *được diễn ra* trên hình: lỗi đếm sót hiện thành một vòng nét đứt và một dấu hỏi, "số cuối là số của cả nhóm" hiện thành bong bóng của con cuối bay ra ôm cả đàn.

## Hai bên

| Bên | Việc |
|---|---|
| `sat-hach-lai-xe` (repo nội dung) | Soạn `projects/dimensions-math/video-briefs/chuong-0N-*/BAI-NN-*.md`: Ý cốt lõi, các mục đánh số (đoạn giảng, **Ví dụ**, **Nói với trẻ**), **Dễ nhầm**, Luyện tập trên máy (của game), Hình gốc. Luật chung và bảng từ ngữ ở `README.md`; mục tiêu và các chỗ đã đổi so với sách ở `BOI-CANH.md`; cách soạn của từng chương ở `README.md` của chương; ảnh trang sách ở `DOI-CHIEU.md` của chương |
| `my-designer` (repo này) | Dựng video từ brief, kiểm, render, báo cáo; báo chỗ brief thiếu, chưa chắc, hay khó diễn bằng hình |

Repo kia chỉ đọc. Tệp duy nhất được sửa ở đó là `VIDEO-HANDOFF.md`, và chỉ khi người dùng yêu cầu.

## Trong skill có gì

```
dimensions-math-video/
  SKILL.md
  references/     series.md, canvas.md, qa.md
  scripts/        new-project.sh
  kit/            phần dùng chung của bộ bài, chép nguyên vào mỗi dự án
    assets/lib/world/zoo.js        đồ vật dạng sticker nhìn thẳng (13 loại: khỉ, ngựa vằn, sư tử, hươu cao
                                   cổ, voi, hổ, cá sấu, gấu, khỉ đột, rắn, kiến, hạt lạc, quả cam), bàn tay
                                   em bé, bút chì, bong bóng lời nói, vòng, gợn sóng, dấu "?", ✓, ✕, vòng ôm
                                   nhóm, chữ số 0–9 viết từng nét, thẻ viết số, tấm tranh, mặt bàn, cây, sao
    assets/lib/world/counting.js   việc đếm thành các đường theo thời gian: tay chạm (handTrack), bút
                                   (penTrack, inks), bong bóng bay (bubbleAt), vòng (ringAt), đàn con vật
                                   (herd), mũi tên, pháo giấy, cảnh hoà vào nhau (scene)
    assets/lib/world/tenframe.js   khung mười ô (thẻ, lưới, ô sáng), chấm đặt hay bay vào đúng thứ tự, vòng
                                   ôm một tập ô, tấm che cho trò nhìn nhanh, thanh mười khối (từ Bài 2)
    assets/lib/world/bench.js      khung canvas 1920×1080: vis, gate, ba nơi (zoo, room, desk), createBench()
    assets/lib/world/draw.js       bảng màu PAL, rgba, mix, hash, rr, disc, polyline, along
    compositions/world.html        lớp canvas của video
    scripts/voice.mjs              giọng đọc từ SCRIPT.md tới mốc từng chữ: request, run, align, pad
    scripts/count-onsets.mjs       đặt từng tiếng đếm "Một. Hai. Ba." lên đúng mốc phát ra trong tệp giọng
    scripts/build-frames.mjs       các khung phủ trống (không chữ), mỗi khung dài đúng lời đọc của nó
    scripts/frames.ctx.mjs, frames.kit.mjs, storyboard.lib.mjs   mốc, vỏ khung, ghi STORYBOARD.md
    scripts/bench-check.mjs        chạy canvas trong Node cho mọi 0,05 giây: lỗi, NaN, dấu vân tay
    scripts/bench-shots.mjs        ảnh riêng canvas trong vài giây, không cần lắp ráp
  examples/bai-01-dem-de-biet-co-bao-nhieu/       điểm xuất phát mặc định: Bài 1 Chương 1
  examples/bai-02-khung-muoi-o/                   Bài 2 Chương 1: mẫu cảnh khung mười ô (đếm ô, chấm bay
                                                  vào, điền lung tung, mười khung nhỏ, đếm tiếp từ năm,
                                                  tấm che nhìn nhanh, ô trống, thanh mười khối)
    BRIEF.md, SCRIPT.md, .hyperframes/{tts_request,bgm_request}.json
    assets/lib/world/{beats,world}.js
    scripts/build-storyboard.mjs
```

Từ `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`, `new-project.sh` chép thêm `assets/lib/world/{path,stage}.js` và các script `assemble.sh`, `build-cues.mjs`, `check-frames.sh`, `frame-times.mjs`, `lock-audio.mjs`, `patch-index.mjs`, `snap.sh`. Skill kia và `vi-explainer-video` phải có mặt trong repo.

Skill không chứa tệp giọng, clip mẫu hay profile giọng nào, và không bao giờ được chứa. Không có khoá API nào trong các tệp request.

## Tái sử dụng được gì

| Mức | Thứ |
|---|---|
| **Dùng nguyên** | Toàn bộ `kit/`: 13 loại đồ vật, bàn tay đếm, bút chì, bong bóng, các vòng và dấu, chữ số viết từng nét, thẻ viết số, ba nơi (vườn thú, phòng có bàn, bàn có tranh); các đường theo thời gian của `counting.js`; công cụ giọng đọc và `count-onsets`; hai công cụ kiểm canvas; `build-frames.mjs` (khung trống, không cần sửa); cách làm nhạc, mức nhạc, render |
| **Sửa từ ví dụ** | Ba tệp riêng của bài: `beats.js` (mốc lời đọc, có sẵn `seq` cho dãy tiếng đếm), `world.js` (các cảnh; trong đó có sẵn các mẫu cảnh: đếm đúng, ba cách đếm sai, số cuối ôm cả nhóm, gạt vật đã đếm sang bên, đếm trong tranh theo đường hay bằng vạch, viết chữ số lên thẻ, ba ô "nhóm, tiếng đọc, chữ số", ôn lại), `build-storyboard.mjs`; cùng `BRIEF.md`, `SCRIPT.md` và hai tệp request |
| **Tạo mới** | Mọi hình mà Bài 1 chưa cần (bảng theo bài ở `references/series.md` §5, cách thêm ở `references/canvas.md` §6): **khung mười ô** và chấm (từ Bài 2 Chương 1 trở đi, dùng suốt hai chương); nhóm rỗng, cái đĩa không còn gì (số 0); khối lập phương, bậc thang khối, đoàn tàu khối; dãy thẻ số và ô "?" còn thiếu; đường nối từng cặp giữa hai nhóm; **sơ đồ tách gộp** (Chương 2); hai màu cho hai phần; các đồ vật mới của từng bài (mèo, táo, hoa, vịt, ếch…) |

Cấu hình đã chạy thật: Bài 1 (23 khung, 583 âm tiết lời đọc, 308,9 giây, 18 SFX) và Bài 2 Chương 1 (30 khung, 347,0 giây, 26 SFX), giọng Leda. Bài có khung mười ô thì tạo dự án với `--example bai-02-khung-muoi-o`.

## Yêu cầu cố định của bộ bài

1. **Không chữ, không phụ đề.** Trên hình chỉ có hai loại ký tự: dấu "?" và chữ số 0–10. Không có dấu +, −, >, <, =. `assemble.sh` chạy **không** có `--captions`.
2. **Đồ vật trước, hình sau, chữ số sau cùng.** Chữ số chỉ hiện khi trẻ đã đếm xong đồ vật, và được **viết từng nét bằng bút chì**, màu tím `#6D28D9`, như cô viết trên bảng. Bài 1 để chữ số tới khung 18 mới hiện.
3. **Một chạm, một tiếng, một vòng.** Bàn tay em bé đưa từ dưới lên, chạm đúng lúc giọng đọc nói tiếng đếm; mỗi lần chạm để lại gợn sóng và vòng xanh ngọc; mỗi tiếng đếm là một bong bóng lời nói không chữ, có sóng âm. Bong bóng cuối thành số của cả nhóm, kèm vòng ôm cả nhóm. Mốc tiếng đếm lấy từ `count-onsets.mjs`, không chia đều.
4. **Màu có nghĩa cố định cho cả bộ bài** (`references/canvas.md` §2): xanh ngọc `#0EA5A0` = đã đếm, đúng; hổ phách `#F59E0B` = bị sót, câu hỏi; đỏ `#E5484D` = bị đếm thừa, sai; bút chì xám `#5E5A70` = vạch đánh dấu trên tranh; tím `#6D28D9` = chữ số. Hình mới cần màu mới (hai phần của một nhóm, chấm trên khung mười ô) thì chọn màu khác hẳn năm màu này, thêm vào `PAL` và ghi vào `canvas.md`.
5. **Lỗi được diễn ra, không chỉ nói.** Mỗi điều **Dễ nhầm** của brief có một cảnh cho thấy lỗi ấy xảy ra và vì sao nó cho ra số sai.
6. **Hình làm đúng điều lời đọc đang nói, đúng lúc nó được nói.** Mọi thay đổi trên canvas neo vào một cụm từ của lời đọc qua `beats.js`. Không có chuyển động trang trí, trừ đàn con vật thở nhẹ và mây trôi.
7. **Đồ vật tách bạch, nhìn thẳng, viền trắng như sticker.** Không chồng lên nhau, trừ khi ví dụ cố ý. Không dùng năm nhân vật của sách gốc, không chép hình trang sách.
8. **Xem được trên điện thoại.** Đồ vật cần đếm không nhỏ hơn cỡ Bài 1 (con vật 66–142 px mỗi đơn vị: sư tử 66, khỉ 76, ngựa vằn 142; hạt lạc trên tranh 46–56; quả cam 64); bong bóng `s` ≥ 0,8; chữ số cao ≥ 300 px trên thẻ; mỗi khung chỉ một nhóm cần nhìn.
9. **Khung mười ô luôn điền một cách** (từ Bài 2 Chương 1): hàng trên trước, từ trái sang phải; hàng trên đủ 5 chấm mới sang hàng dưới. Hai phần chung một khung thì phần thứ nhất điền trước, phần thứ hai nối tiếp, khác màu.

## Nguyên tắc nội dung

Luật đầy đủ ở `README.md`, `BOI-CANH.md` và `README.md` của chương trong thư mục brief; tóm tắt và cách áp dụng ở `references/series.md` §1–§2.

- **Câu "Nói với trẻ" đọc nguyên văn.** Đổi được tên đồ vật, không đổi các từ toán học. Video thay lời người lớn ngồi cạnh trẻ, nên phần giảng phải tự đủ ý.
- **Số lượng trong Ví dụ giữ nguyên.** Chúng được chọn có chủ ý (hai nhóm hơn kém nhau 1, hạt lạc xếp 1-2-3-2-1). Đổi đồ vật thì được.
- **Một từ cho một ý, theo bảng từ ngữ chung** (`references/series.md` §2): "khung mười ô", "nhiều hơn / ít hơn" cho nhóm đồ vật, "lớn hơn / bé hơn" cho số, "thêm 1 / bớt 1", "cả nhóm, hai phần", "6 gồm 2 và 4". Không "cộng", "trừ", "bằng", "tổng"; Chương 1 không "bằng nhau".
- **Không thêm kiến thức ngoài bài**, không dùng điều bài sau mới dạy. Bài 1 không dùng khung mười ô vì đó là việc của Bài 2. Số không vượt quá 10.
- **Video đứng một mình.** Không nhắc sách, trang, số bài tập, "bài trước". Mục Luyện tập trên máy là của game, không đưa vào video.
- **Người dẫn xưng "cô", gọi trẻ là "con".** Mở bằng một câu hỏi ngay trong cảnh ("Có bao nhiêu con khỉ nhỉ?"), kết bằng một khung nhắc lại các ý.
- **Phần "vì sao" và một số từ ngữ** ("khung mười ô", "đếm xuôi", "đếm ngược", "thêm 1", "bớt 1") **chưa có giáo viên tiểu học duyệt và chưa đối chiếu với sách Toán 1 hiện hành.** Báo cáo nào cũng ghi điều này.
- **Giọng mặc định là Gemini Leda.** Giọng nhân bản chỉ khi người dùng yêu cầu, theo `vi-explainer-video/references/voices.md`.

## Đường dẫn

```bash
ROOT=$(git rev-parse --show-toplevel)
S=$ROOT/.claude/skills/dimensions-math-video
SK=$ROOT/.claude/skills/vi-explainer-video
HF=<thư mục có faceless-explainer; new-project.sh in ra ở dòng "HF:">
FX=$HF/faceless-explainer/scripts
ENGINE=$HF/media-use/audio/scripts/audio.mjs
P=$ROOT/projects/dimensions-math/videos/<ten-du-an>
BRIEFS=/Users/phucnt/workspace/sat-hach-lai-xe/projects/dimensions-math/video-briefs
```

Mỗi lệnh Bash là một shell mới: khai báo lại biến trong cùng lệnh, và dùng `(cd "$P" && …)`. Lệnh CLI viết `hyperframes …`; máy không có lệnh đó thì thay bằng `npx -y hyperframes …` (viết thẳng, không cất vào biến). Trong zsh, in dòng phân cách bằng `printf`, không `echo =====`.

## Quy trình

### 1. Đọc brief và chia video

Đọc `$BRIEFS/README.md`, `$BRIEFS/BOI-CANH.md`, `README.md` của chương, rồi `BAI-NN-*.md` của bài, và dòng của bài trong `references/series.md` §5. Quyết định trước khi viết gì:

- **Bài này thành mấy video.** Ước lượng ở `references/series.md` §4: Bài 1 có 684 âm tiết phần giảng, ra 583 âm tiết lời đọc và 309 giây. Dự kiến quá khoảng 6 phút thì chia theo mục, và nói rõ trong báo cáo mục nào để lại.
- **Mỗi mục: đồ vật nào, ở nơi nào** (vườn thú, phòng có bàn, bàn có tranh, hay nơi mới), **bàn tay hay bút chì làm gì**, và mỗi điều Dễ nhầm được diễn ra thế nào (yêu cầu cố định 5).
- **Bài cần vẽ gì mới** (`references/series.md` §5). Ảnh trang sách gốc trong `DOI-CHIEU.md` chỉ để hiểu ý; không chép nhân vật hay bố cục.
- **Chép riêng ra một bên:** mọi câu Nói với trẻ, mọi số lượng của Ví dụ, mọi từ trong bảng từ ngữ mà bài dùng. Soát lại ở bước 3 và bước 9.

Brief thiếu thứ không suy ra được thì hỏi người dùng một lần. Thứ khác chọn mặc định hợp lý, ghi vào báo cáo, rồi làm tiếp.

### 2. Tạo dự án

```bash
bash .claude/skills/dimensions-math-video/scripts/new-project.sh toan-1-chuong-<C>-bai-<NN>-<ten-ngan>
```

Lệnh tạo `projects/dimensions-math/videos/<ten-du-an>` (HyperFrames trống, font tiếng Việt, `glass-keynote` cho vỏ khung), chép phần mượn của `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`, `kit/` của bộ bài và các tệp của ví dụ Bài 1. Ghi lại dòng `HF:`. `--bare` bỏ phần ví dụ; dự án khi đó chưa chạy được cho tới khi có đủ ba tệp riêng của bài. `projects/dimensions-math/videos/` nằm trong `.gitignore`; không `git add -f` gì ở đó.

### 3. BRIEF.md và SCRIPT.md

Sửa `BRIEF.md`: thông điệp một câu (`message:`), `audience:`, `length:` theo ước lượng, `voice: Leda`; phần Intent tả cách diễn từng ý bằng hình; Notes ghi số lượng giữ nguyên, các câu đọc nguyên văn, điều không dùng và mọi lựa chọn minh hoạ. `storyboard.lib.mjs` đọc `message:` và `audience:` từ tệp này.

Viết `SCRIPT.md` theo khuôn ở `references/series.md` §3: khung mở đầu là một câu hỏi trong cảnh; mỗi mục gồm khung làm mẫu trên đồ vật, khung câu Nói với trẻ, các khung Dễ nhầm; chữ số ở cuối mục cần nó; khung cuối nhắc lại.

- Tiêu đề `## Line N — <tên> (Frame N)`; lời đọc thụt 4 dấu cách. Tên tệp khung sinh từ tiêu đề, nên các tiêu đề phải khác nhau.
- **Tiếng đếm viết thành chữ.** Đếm chậm, mỗi tiếng một chạm: cách nhau bằng dấu chấm ("Một. Hai. Ba."). Đếm nhanh một hơi (cảnh miệng nhanh hơn tay): cách nhau bằng dấu phẩy. `style` của request đã dặn giọng đọc hai nhịp này.
- Mỗi câu trọn ý, không quá khoảng 20 âm tiết, mỗi khung khoảng 6–13 giây lời đọc. **Mỗi thay đổi trên hình cần một cụm từ riêng trong lời đọc để neo mốc.** Cụm lặp lại trong cùng khung thì lấy mốc bằng `{ nth: 2 }`.
- Soát từng câu Nói với trẻ, từng số lượng và từng từ toán học với bản chép ở bước 1. Soát không có "cộng", "trừ", "bằng", "tổng", tên sách, số trang.

### 4. Giọng đọc và mốc lời đọc

Sửa `style` trong `.hyperframes/tts_request.json` nếu bài cần nhịp khác (giữ `provider`, `tts_model`, `voice`, `lang`, và hai câu về dấu chấm, dấu phẩy). Rồi:

```bash
(cd "$P" && node scripts/voice.mjs request)            # lines lấy từ SCRIPT.md; in số âm tiết và thời lượng ước tính
(cd "$P" && node scripts/voice.mjs run)                # chạy nền: 7 dòng mỗi phút, tự chạy bù
(cd "$P" && node scripts/voice.mjs align)              # chữ kịch bản lên mốc đã nghe; in chỗ nghe khác kịch bản
(cd "$P" && node scripts/count-onsets.mjs)             # từng tiếng đếm lên đúng mốc phát ra; --dry chỉ báo
(cd "$P" && node scripts/voice.mjs pad 01=3.5 23=2.5)  # khoảng lặng sau chữ cuối: 0,45 giây, hoặc số ghi cho từng khung
(cd "$P" && node scripts/build-cues.mjs)               # ghi assets/lib/world/cues.js
```

- `voice.mjs` đọc khoá từ biến môi trường `GEMINI_API_KEY`, che khoá trong mọi dòng in ra và không ghi khoá vào tệp nào. Khi nó không tự tìm thấy bộ skill HyperFrames, đặt `HF=…` trước lệnh.
- **Whisper hay nghe "Một. Hai. Ba." thành một token** và chia đều thời gian cho các chữ; bàn tay khi đó chạm lệch tiếng. `count-onsets.mjs` tìm các đợt tiếng trong tệp giọng và đặt từng tiếng đếm lên đó. **Chạy lại sau mỗi lần `align`.** Dòng nào nó báo không khớp thì xem `references/qa.md` §2.
- **Đọc danh sách "heard differently" của `align`.** Chỗ nghe khác kịch bản mà đổi nghĩa (sai số, thiếu tiếng đếm, đọc dấu phẩy thành chậm) thì làm lại dòng đó: `node scripts/voice.mjs run 07`, rồi `align`, `count-onsets`, `pad`, `build-cues.mjs`.
- Khoảng lặng dài hơn cho khung mà hình còn việc sau chữ cuối (bàn tay còn đang chạm, bút còn đang viết, pháo giấy). Bài 1 dùng `01=3.5 03=1 06=1 09=1 16=1.2 19=2 22=1.2 23=2.5`. `pad` nhớ các số đã cho trong `.hyperframes/voice_tails.json`; nó chỉ thêm, không cắt bớt.
- Chạy lại `build-cues.mjs` sau mọi thay đổi về giọng. Mọi mốc phía sau đọc từ `cues.js`.

### 5. Bắt đầu nhạc nền

Sửa prompt trong `.hyperframes/bgm_request.json` (Bài 1: hộp nhạc, marimba, pizzicato, nhịp chậm đều, vườn thú nắng), rồi chạy sau khi giọng đã chốt (nhạc dài đúng bằng tổng lời đọc):

```bash
(cd "$P" && node "$ENGINE" --request ./.hyperframes/bgm_request.json --hyperframes . --out ./audio_engine_meta.json --only bgm 2>&1 | sed -E 's/(AIza|key=)[A-Za-z0-9_-]+/\1***/g; s/[A-Za-z0-9_-]{36,}/<redacted>/g')
```

Nhạc chạy nền vài phút; trong lúc đó làm bước 6.

### 6. Bàn vẽ

Hai tệp riêng của bài trong `assets/lib/world/`. Toạ độ, bảng màu, API và các mẫu cảnh ở `references/canvas.md`.

| Tệp | Việc |
|---|---|
| `beats.js` | `buildBeats(K)`: mọi mốc mà hình phản ứng, đặt tên theo khung (`B.f8.c` là sáu tiếng đếm của khung 8). `seq(n, "một hai ba")` lấy dãy tiếng đếm; `wAt(n, "nói hai", 1)` lấy một chữ trong cụm |
| `world.js` | `createWorld({ canvas })`: mỗi phần là một cảnh (`setA`, `setB`…) vẽ lại từ đầu cho mọi thời điểm `t`, dữ liệu (chạm, vòng, bong bóng) dựng một lần ở trên hàm cảnh; `draw(t)` gọi `scene(t, T(a), T(b), setX)`; cuối tệp `return createBench({ c, total, beats: B, draw })` |

Đồ vật hay công cụ mới mà bài khác cũng dùng (khung mười ô, khối, sơ đồ tách gộp) thì viết thẳng vào `zoo.js` hay một tệp mới trong `assets/lib/world/` của dự án, rồi chuyển về `kit/` khi xong (xem "Sau khi xong").

Sau mỗi lần sửa, kiểm và xem ngay, không chờ lắp ráp:

```bash
(cd "$P" && node scripts/bench-check.mjs)                          # 0 error, 0 NaN trên mọi 0,05 giây
(cd "$P" && node scripts/bench-shots.mjs try 3 "5:2.5,5:6,9:1")    # snapshots/bench/try.jpg, khung:giây-trong-khung
(cd "$P" && node scripts/bench-shots.mjs mid 4 mid)                # mỗi khung một ảnh ở giữa khung
(cd "$P" && node scripts/bench-shots.mjs late 4 late)              # mỗi khung một ảnh ngay trước khi hết khung
```

Lỗi `cue not found: frame N "…"` hay `count not found` nghĩa là cụm từ không có trong lời đọc của khung đó: sửa cụm cho khớp chữ trong `SCRIPT.md`.

### 7. Khung và storyboard

- `scripts/build-frames.mjs` của kit dùng nguyên: nó sinh các khung trống, mỗi khung dài đúng lời đọc của nó, để lắp giọng, SFX và điểm cắt. Không viết chữ vào khung.
- `scripts/build-storyboard.mjs`: mỗi khung một `scene`, các pha `sc`, SFX; tiêu đề, dòng nhạc và block Video direction; cuối tệp `writeStoryboard({ … })`. **Câu tả cảnh phải đúng với thứ canvas vẽ**; sửa cảnh thì sửa cả dòng này.

```bash
(cd "$P" && node scripts/build-storyboard.mjs)         # STORYBOARD.md từ SCRIPT.md và mốc thật
```

Khung không giao cho worker.

### 8. Chốt âm thanh

```bash
(cd "$P" && node "$HF"/media-use/audio/scripts/wait-bgm.mjs --audio-meta ./audio_engine_meta.json --hyperframes . --timeout-ms 300000 --out ./.hyperframes/bgm_status.json)   # phải "ready"
(cd "$P" && node "$FX"/audio.mjs fetch-sfx --storyboard ./STORYBOARD.md --hyperframes .)
(cd "$P" && node scripts/lock-audio.mjs --bgm 0.48)    # SFX về đúng sfx_at; nhạc 0.48
(cd "$P" && node "$FX"/audio.mjs sync-durations --storyboard ./STORYBOARD.md --audio-meta ./audio_meta.json --hyperframes .)
```

Tên SFX phải có trong `$HF/media-use/audio/assets/sfx/`; tên sai bị bỏ qua không báo. Bài 1 dùng 18 SFX: `pop` khi một nhóm đồ vật hiện ra, `click` cho cú chạm đầu tiên và nét bút đầu tiên, `ping` ở mỗi lỗi đếm (sót, thừa, miệng nhanh hơn tay, sót trong tranh), `chime` khi đếm xong và ra số của cả nhóm, `whoosh-short` khi bong bóng nở thành vòng ôm nhóm hay các ô gom lại. Không đặt SFX lên từng tiếng đếm: tiếng đếm đã là nhịp của khung.

### 9. Lắp ráp và kiểm

```bash
(cd "$P" && HF="$HF" bash scripts/assemble.sh)         # không --captions
(cd "$P" && node scripts/bench-check.mjs)              # 0 error, 0 NaN
(cd "$P" && node "$SK"/scripts/mix-balance.mjs --target 14)   # trẻ nhỏ: nhạc dưới giọng 14 dB; Bài 1 chốt bgm 0.48 (14,1 dB)
(cd "$P" && hyperframes lint)                          # 0 error; cảnh báo "index.html too large" bỏ qua được
```

- `assemble.sh` sinh lại khung, chạy `check-frames.sh`, lắp `index.html`, gắn lớp canvas và đặt thời lượng cho `world.html` (`patch-index.mjs`), chèn chuyển cảnh. Dòng `bgm (track 11)` phải là `yes`.
- `mix-balance` có thể in một dòng "Decoding error" với tệp wav của Lyria; vô hại.
- **Đọc ảnh `bench-shots`** (`mid` và `late`) theo `references/qa.md` §1: đồ vật đủ số, không chồng nhau, vòng và bong bóng đúng màu, đúng đồ vật, không có chữ nào ngoài "?" và chữ số. Vì khung phủ trống, ảnh canvas chính là hình của video; không cần `snap.sh` hay `npm run check` cho mỗi lần sửa.
- Người dùng theo dõi chi phí: gom các sửa rồi lắp ráp một lần.

### 10. Render, đo, báo cáo

```bash
(cd "$P" && hyperframes render --skill=faceless-explainer --quality high --output renders/video.mp4 > renders/render.log 2>&1)   # chạy nền; Bài 1 (5 phút video) mất khoảng 5,5 phút
```

Đo và trích ảnh từ MP4 theo `references/qa.md` §3: ffprobe, LUFS −14 đến −16, true peak ≤ −1 dBFS, `blackdetect` 0, một tấm ảnh ghép ở giữa vài khung. Bài 1 ra −13,0 LUFS và được hạ 1,5 dB (lệnh ở `qa.md` §3).

Báo cáo theo `references/qa.md` §4. Ngoài các mục của `vi-explainer-video`, video bộ bài này có thêm:

- **Phạm vi:** video gồm mục nào và điều Dễ nhầm nào của bài, mục nào để lại.
- **Đối chiếu brief:** các câu Nói với trẻ, số lượng và từ ngữ đã giữ thế nào; chỗ brief thiếu hay chưa chắc.
- **Cách diễn bằng hình:** mỗi ý và mỗi lỗi hiện ra thế nào; chỗ nào hình buộc phải chọn điều bài không quy định (đồ vật, nơi chốn, cách xếp).
- **"Vì sao" và từ ngữ chưa có giáo viên duyệt.**
- **Tài sản:** dùng lại gì, vẽ mới gì, đã chuyển gì về `kit/`.
- **Agent không nghe được âm thanh và không xem được chuyển động.** Nhịp tay chạm khớp tiếng đếm chỉ kiểm được bằng số đo, không bằng mắt.

### Sau khi xong

1. Thêm một dòng vào bảng "Đã làm" của `references/series.md` §6 và cập nhật cột trạng thái ở §5.
2. Đồ vật, công cụ hay mẫu cảnh mới mà bài khác cũng dùng thì chuyển từ dự án về `kit/` (`zoo.js`, `counting.js`, hay tệp mới như `tenframe.js`), ghi vào `references/canvas.md`, rồi kiểm rằng Bài 1 vẫn ra đúng dấu vân tay cũ (`references/qa.md` §5).
3. Người dùng đã duyệt video của một bài có loại hình khác hẳn (khung mười ô ở Bài 2 Chương 1, sơ đồ tách gộp ở Chương 2, khuôn chung của Bài 2–5 Chương 2) thì chép phần riêng của nó thành một thư mục mới trong `examples/`: `BRIEF.md`, `SCRIPT.md`, hai tệp request, `beats.js`, `world.js`, `build-storyboard.mjs`. Không kèm `assets/voice`, `assets/bgm`, `assets/sfx`, `renders`, `snapshots`, `audio_*.json`, `cues.js`, `.hyperframes/whisper_words.json`.

## Tham khảo

| Tệp | Khi nào đọc |
|---|---|
| `references/series.md` | **Trước tiên:** luật nội dung, bảng từ ngữ, khuôn của một video, ngân sách thời lượng, bảng 14 bài và bài nào cần vẽ gì, bảng "Đã làm" |
| `references/canvas.md` | Bước 6: toạ độ, bảng màu, `beats.js`, API của `zoo`, `counting`, `bench`, `draw`, các mẫu cảnh trong `world.js` của ví dụ, cách thêm đồ vật và công cụ mới |
| `references/qa.md` | Bước 4, 9, 10: ảnh cần đọc, `count-onsets`, mức nhạc, đo MP4, mẫu báo cáo, kiểm sau khi sửa `kit/`, lỗi đã gặp |
| `.claude/skills/vi-explainer-video/` | Cài đặt, giọng, nhạc, render, `references/pitfalls.md` |
| `.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/references/world.md` | `path.js` (`seg`, `smooth`, `easeOutBack`, `pop`…), `stage.js` (`cueKit`), các script mượn |
