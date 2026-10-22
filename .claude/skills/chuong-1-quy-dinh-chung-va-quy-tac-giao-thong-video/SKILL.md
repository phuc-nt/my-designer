---
name: chuong-1-quy-dinh-chung-va-quy-tac-giao-thong-video
description: "Sản xuất video cho nhóm bài Quy định chung và quy tắc giao thông (Chương I, Bài 1–21) của repo sat-hach-lai-xe: câu luật là kịch bản, và một mô hình con đường thu nhỏ trên bàn vẽ (isometric, canvas 2D) được lắp dần theo đúng từng vế của câu Quy tắc; cách hiểu sai được diễn trên mô hình rồi bị gạch đỏ cùng lúc với cụm từ trong cột chữ; thẻ Quy tắc hiện nguyên văn và sáng dần từng chữ, kèm thẻ Dễ nhầm, Cách nhớ, Thử áp dụng; giọng Gemini Leda, phụ đề, nhạc rồi render MP4. Dùng khi người dùng nói 'làm video bài <số> chương 1', 'video quy tắc giao thông', 'video quy định chung', 'làm tiếp chương 1', hoặc đưa một tệp BAI-NN của thư mục video-briefs/chuong-1-quy-dinh-chung-va-quy-tac-giao-thong."
---

# Video Quy định chung và quy tắc giao thông (câu luật lắp thành mô hình)

Skill này đóng gói cách đã làm video thử nghiệm Bài 1 "Con đường gồm những phần nào?" (3:56, 21 khung, đủ năm mục và ba tình huống, người dùng đã duyệt ngày 2026-10-12), để làm tiếp 20 bài còn lại của chương. **Làm một bài thì đọc `references/series.md` trước:** luật nội dung của chương, khuôn của một video, ngân sách thời lượng, bảng 21 bài và bài nào cần vẽ thêm gì.

Nó là **lớp "bài học luật"** đặt lên các skill khác và không lặp lại chúng:

- `.claude/skills/vi-explainer-video/SKILL.md`: cài đặt, font, giọng đọc, nhạc, phụ đề, render (bước 0, các nguyên tắc cố định, `references/audio.md`, `references/voices.md`, `references/pitfalls.md`). Đọc trước.
- `.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`: `new-project.sh` của skill này mượn từ đó hai tệp toán (`path.js`, `stage.js`) và tám script lắp ráp, kiểm, chụp ảnh. Không mượn three.js hay mô hình 3D nào: mô hình của chương này vẽ bằng canvas 2D với phép chiếu trục đo.
- `.claude/skills/chuong-4-cau-tao-va-sua-chua-video/references/`: tài liệu của phần khung dùng chung mà `kit/` ở đây chép nguyên (`bench.js`, `draw.js`, `timeline.js`, `frames.lib.mjs`, `frames.kit.mjs`, `voice.mjs`, hai công cụ kiểm). Tài liệu ở đây chỉ viết phần riêng của chương I và trỏ sang đó khi cần.

Chương này khác bốn nhóm bài trước. Sa hình nhìn một nút giao từ trên cao; Kỹ thuật lái xe kể một chuyến xe; Cấu tạo mở máy ra trên bàn; Báo hiệu để tấm biển làm nhân vật. Chương I **gần như toàn là luật**: định nghĩa, tên gọi, danh sách, con số. Người học sai vì hiểu lệch một chữ trong câu luật. Vì vậy video lấy **câu luật làm kịch bản**: cột trái mang nguyên văn câu Quy tắc, sáng từng chữ theo giọng đọc; bên phải là một mô hình thu nhỏ trên bàn vẽ, mỗi phần của nó mọc lên đúng lúc câu luật gọi tên phần đó. Cách hiểu sai không chỉ được nói ra: nó được diễn trên mô hình rồi bị gạch đỏ.

## Hai bên

| Bên | Việc |
|---|---|
| `sat-hach-lai-xe` (repo nội dung) | Soạn `video-briefs/chuong-1-quy-dinh-chung-va-quy-tac-giao-thong/BAI-NN-*.md`: Áp dụng cho, Cốt lõi, các mục đánh số với **Quy tắc** (kèm bảng hay danh sách là một phần của quy tắc), Dễ nhầm, Cách hiểu hoặc Cách nhớ, và ba tình huống Thử áp dụng. Bảy luật của chương, mức độ kiểm chứng và danh sách điều nguồn không nói ở `README.md` cùng thư mục; bảng đối chiếu nguồn ở `DOI-CHIEU.md` |
| `my-designer` (repo này) | Dựng video từ brief, kiểm, render, báo cáo; báo chỗ brief thiếu hay chưa chắc |

Repo kia chỉ đọc. Tệp duy nhất được sửa ở đó là `VIDEO-HANDOFF.md`, và chỉ khi người dùng yêu cầu.

## Trong skill có gì

```
chuong-1-quy-dinh-chung-va-quy-tac-giao-thong-video/
  SKILL.md
  references/     series.md, model.md, frames.md, qa.md
  scripts/        new-project.sh
  kit/            phần dùng chung của chương, chép nguyên vào mỗi dự án
    assets/lib/world/iso.js        phép chiếu trục đo và các khối: điểm P(x, y, z), máy quay look(),
                                   mặt (patch, shape, wall), khối hộp (box, wire), đoạn và mũi tên đo
                                   (seg3, measure), bánh xe; hàng đợi solid()/flush() vẽ từ xa tới gần
    assets/lib/world/road.js       các phần của một con đường: nền và mặt đường, vạch (stripe, lines,
                                   painted, stopLine), mũi tên dòng xe (flow), vùng tô (zone), dải phân
                                   cách (barrier, median, separator), hàng rào, cột đèn, giá long môn,
                                   đường cắt ngang cùng mức hoặc thành cầu vượt (crossing), làn nhánh
                                   (ramps), khối khoảng trống (clearSpace, portal); xe dạng khối:
                                   ô tô con, xe tải (có hàng), mô tô, xe đạp, xe lu
    assets/lib/world/draw.js       nét vẽ chung: chữ, mũi tên, viên chữ, nhãn chỉ vào vật
    assets/lib/world/bench.js      khung canvas: W, H, hàm hiện và tắt theo mốc (vis, litSeq), createBench()
    assets/lib/world/timeline.js   đường theo thời gian
    compositions/world.html        lớp canvas của video
    scripts/frames.law.mjs         lớp chữ của chương: tiêu đề mục kèm hàng chấm, thẻ Quy tắc sáng dần
                                   từng chữ và lớn dần qua nhiều khung (rule, kept), cụm từ bị gạch
                                   (wrong, strike), câu hỏi hiện theo giọng (question), thẻ Trả lời (answer)
    scripts/frames.kit.mjs         vỏ khung, CSS, các hàm chuyển động (IN, PILL, RING…), icon
    scripts/frames.ctx.mjs         đọc cues.js và beats.js cho các script sinh
    scripts/frames.lib.mjs         khối dựng cột chữ: thẻ, dòng, câu sáng dần, ghi nhớ
    scripts/storyboard.lib.mjs     ghi STORYBOARD.md từ SCRIPT.md và mốc thật
    scripts/voice.mjs              giọng đọc từ SCRIPT.md tới mốc từng chữ: request, run, align, pad
    scripts/bench-check.mjs        chạy canvas trong Node cho mọi 0,05 giây: lỗi, NaN, dấu vân tay
    scripts/bench-shots.mjs        ảnh riêng canvas trong vài giây, không cần lắp ráp
    scripts/scan-words.mjs         quét chữ bị cấm của chương: số câu hỏi, số đề, kỳ thi, cuốn sách
  examples/bai-01-con-duong-gom-nhung-phan-nao/      điểm xuất phát mặc định: Bài 1, đủ năm mục
    BRIEF.md, SCRIPT.md, .hyperframes/{tts_request,bgm_request}.json
    assets/lib/world/{beats,world}.js
    scripts/{build-frames,build-storyboard}.mjs
```

Từ `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`, `new-project.sh` chép thêm `assets/lib/world/{path,stage}.js` và các script `assemble.sh`, `build-cues.mjs`, `check-frames.sh`, `check-watermark.sh`, `frame-times.mjs`, `lock-audio.mjs`, `patch-index.mjs`, `snap.sh`. Skill kia và `vi-explainer-video` phải có mặt trong repo.

Skill không chứa tệp giọng, clip mẫu hay profile giọng nào, và không bao giờ được chứa. Không có khoá API nào trong các tệp request.

## Tái sử dụng được gì

| Mức | Thứ |
|---|---|
| **Dùng nguyên** | Toàn bộ `kit/`: phép chiếu và các khối của `iso.js`; mọi phần đường và năm loại xe của `road.js`; lớp chữ luật (`frames.law.mjs`: thẻ Quy tắc, Dễ nhầm, Cách nhớ, câu hỏi và Trả lời); công cụ giọng đọc, hai công cụ kiểm canvas, các script; hệ thiết kế `glass-keynote`; cách làm nhạc, phụ đề, render |
| **Sửa từ ví dụ** | Bốn tệp riêng của bài: `beats.js` (mốc lời đọc), `world.js` (khung nhìn bàn vẽ, bảng máy quay, nhãn và các cảnh; trong đó có sẵn các mẫu cảnh: mô hình đủ tên rồi tháo ra, lắp một phần theo từng vế, diễn cách hiểu sai rồi gạch, khối khoảng trống có mũi tên đo, cột bảng tên cho một danh sách, tình huống rồi trả lời), `build-frames.mjs` (cột chữ), `build-storyboard.mjs`; cùng `BRIEF.md`, `SCRIPT.md` và hai tệp request |
| **Tạo mới** | Mọi thứ con đường của Bài 1 chưa có. `road.js` mới chỉ vẽ **một đoạn đường thẳng** với đường cắt ngang, và năm xe dạng khối. Chưa có: người (người đi bộ, người điều khiển giao thông và hiệu lệnh tay), đèn tín hiệu, biển báo trên cột, nút giao có xe rẽ và vòng xuyến, đường sắt, hầm, cảnh ban đêm và đèn xe, xe khách, xe ưu tiên, rơ moóc và xe được kéo, trẻ em và ghế trong xe, giấy tờ, và **cách trình bày bảng con số** (tuổi, tốc độ, khoảng cách). Bảng theo bài ở `references/series.md` §5; cách thêm ở `references/model.md` §6 |

Cấu hình đã chạy thật: một video, 21 khung, 637 âm tiết lời đọc, 236 giây, giọng Leda, 14 SFX. Chưa bài nào khác được làm bằng skill này.

## Yêu cầu cố định của video chương này

1. **Mô hình ở bên phải, chữ luật ở bên trái.** Mô hình nằm trong khung nhìn bàn vẽ `VP = { x: 684, y: 36, w: 1202, h: 848 }`. Cột chữ ở x 64–620, kết thúc trên y 880. Phụ đề nằm dưới y 896.
2. **Một mô hình, lắp dần.** Cả video dùng một mô hình; máy quay chỉ lia và phóng trên nó (bảng `KEYS` trong `world.js`). Mỗi phần mọc lên, hạ xuống hay sáng lên đúng lúc câu luật gọi tên nó. Khung nhìn luôn mang dòng "MÔ HÌNH MINH HOẠ · KHÔNG THEO TỈ LỆ".
3. **Hình làm đúng điều lời đọc đang nói, đúng lúc nó được nói.** Mọi thay đổi trên canvas neo vào một cụm từ của lời đọc qua `beats.js`. Không có chuyển động trang trí.
4. **Câu Quy tắc hiện nguyên văn trong thẻ viền tím nhạt mang nhãn QUY TẮC, sáng dần từng chữ theo giọng đọc.** Quy tắc dài đi qua nhiều khung thì thẻ lớn dần: các câu đã đọc ở lại phía trên, chữ nhỏ hơn (`rule(…, { read })`).
5. **Mỗi thẻ mang nhãn cho biết nó là gì:** QUY TẮC là luật; DỄ NHẦM (viền đỏ) không đặt quy tắc mới; CÁCH NHỚ hay CÁCH HIỂU (hổ phách) là lời của người soạn, không phải luật; THỬ ÁP DỤNG là tình huống, và TRẢ LỜI (viền xanh) đến ở khung sau để có một nhịp nghĩ.
6. **Cách hiểu sai được diễn rồi bị gạch.** Mô hình làm đúng điều cách hiểu sai nói (vùng gạch chéo đỏ, nhãn đỏ nét đứt), rồi nét gạch đỏ chạy qua nhãn trên mô hình cùng lúc với nét gạch qua cụm từ trong cột chữ.
7. **Màu có nghĩa cố định, ở cột chữ cũng như trên mô hình:** tím nhạt là phần đang được gọi tên; đỏ là cách hiểu sai; xanh lá là đúng; hổ phách là cách nhớ.
8. **Danh sách và bảng của Quy tắc là kiến thức:** đủ mọi dòng, đúng thứ tự của bài, đúng từng con số. Thứ bài chỉ liệt kê tên thì chỉ hiện tên (Bài 1: tám loại đường thành tám bảng tên trên một cột chỉ đường), không vẽ ra điều bài không tả.
9. **Chữ trên canvas từ 20 px trở lên**, nhãn chính 22–30 px, để xem được trên điện thoại.

## Nguyên tắc nội dung

Luật đầy đủ ở `README.md` của thư mục brief; tóm tắt và cách áp dụng ở `references/series.md` §1.

- **Quy tắc là luật.** README cho phép nói gọn hơn nhưng không thêm, không bớt, không đổi nghĩa, và giữ mọi con số. Bài 1 đọc **nguyên văn** mọi câu Quy tắc; đó là mặc định của skill này. Chỉ rút gọn khi bài không vừa một video, và ghi rõ trong báo cáo câu nào đã rút.
- **Cách hiểu, Cách nhớ không phải luật.** Lời đọc mở bằng "Cách nhớ" hay "Có thể hiểu", thẻ màu hổ phách, tách khỏi thẻ Quy tắc.
- **Dễ nhầm không đặt quy tắc mới.** Lời đọc mở bằng "Chỗ dễ nhầm"; chỉ nói cách hiểu sai và câu luật đã bác nó.
- **Bảng là kiến thức:** không đổi thứ tự dòng, không gộp dòng, không làm tròn số.
- **Không thêm kiến thức ngoài bài**: không mức phạt, không số điều luật, không ngoại lệ bài không nêu. README có danh sách điều nguồn **không nói** (tốc độ của xe buýt và máy kéo trong khu đông dân cư, tuổi tối thiểu của vài hạng, còi ban đêm khi gặp nguy hiểm, đèn và biển trái nhau, cách nhận ra đường ưu tiên): không tự điền. Thiếu thì ghi vào báo cáo.
- **Video đứng một mình.** Không số câu, không kỳ thi, không cuốn sách, không nhắc bài khác, ở lời đọc, chữ trên hình và phụ đề. `scripts/scan-words.mjs` kiểm.
- **Mức độ kiểm chứng của nguồn** (ghi vào mọi báo cáo): các Quy tắc đã so với đáp án của tài liệu gốc cho 180 câu; chưa so với văn bản luật hiện hành; chưa có người có chuyên môn duyệt; Cách hiểu và Cách nhớ là của người soạn.
- **Giọng mặc định là Gemini Leda.** Giọng nhân bản chỉ khi người dùng yêu cầu, theo `vi-explainer-video/references/voices.md`.

## Đường dẫn

```bash
ROOT=$(git rev-parse --show-toplevel)
S=$ROOT/.claude/skills/chuong-1-quy-dinh-chung-va-quy-tac-giao-thong-video
SK=$ROOT/.claude/skills/vi-explainer-video
HF=<thư mục có faceless-explainer; new-project.sh in ra ở dòng "HF:">
FX=$HF/faceless-explainer/scripts
ENGINE=$HF/media-use/audio/scripts/audio.mjs
P=$ROOT/videos/<ten-du-an>
BRIEFS=/Users/phucnt/workspace/sat-hach-lai-xe/video-briefs/chuong-1-quy-dinh-chung-va-quy-tac-giao-thong
```

Mỗi lệnh Bash là một shell mới: khai báo lại biến trong cùng lệnh, và dùng `(cd "$P" && …)`. Lệnh CLI viết `hyperframes …`; máy không có lệnh đó thì thay bằng `npx -y hyperframes …` (viết thẳng, không cất vào biến).

## Quy trình

### 1. Đọc brief và lên kế hoạch

Đọc `$BRIEFS/README.md` rồi `BAI-NN-*.md` của bài, và dòng của bài trong `references/series.md` §4–§5. Quyết định trước khi viết gì:

- **Bài này thành mấy video.** Theo số đo của Bài 1, mọi bài của chương vừa một video dưới 6 phút (`references/series.md` §3). Bài nào vượt thì chia theo mục, không cắt giữa một mục.
- **Mỗi mục: mô hình làm gì.** Với từng câu Quy tắc, gạch ra các vế; mỗi vế là một phần được lắp, một xe đi vào, hay một con số hiện lên. Với từng Dễ nhầm: cách hiểu sai trông thế nào trên mô hình.
- **Bài cần vẽ gì mới** (`references/series.md` §5). Bài 6 có hai ảnh tham khảo (`cau-36.jpg`, `cau-37.jpg`): Read chúng trước khi vẽ hiệu lệnh của người điều khiển giao thông.
- **Bài có câu Quy tắc nào, bảng nào, con số nào.** Chép nguyên văn sang một bên để soát lại ở bước 3 và bước 9.

Brief thiếu thứ không suy ra được thì hỏi người dùng một lần. Thứ khác chọn mặc định hợp lý, ghi vào báo cáo, rồi làm tiếp.

### 2. Tạo dự án

```bash
bash .claude/skills/chuong-1-quy-dinh-chung-va-quy-tac-giao-thong-video/scripts/new-project.sh chuong-1-bai-<NN>-<ten-ngan>
```

Lệnh tạo `videos/<ten-du-an>` (HyperFrames trống, font tiếng Việt, `glass-keynote`), chép phần mượn của `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`, `kit/` của chương và các tệp của ví dụ Bài 1. Ghi lại dòng `HF:`. `--bare` bỏ phần ví dụ; dự án khi đó chưa chạy được cho tới khi có đủ bốn tệp riêng của bài. `videos/` nằm trong `.gitignore`; không `git add -f` gì ở đó.

### 3. BRIEF.md và SCRIPT.md

Sửa `BRIEF.md`: thông điệp một câu, khán giả, độ dài, `voice: Leda`; mục Notes ghi câu Quy tắc nào ở khung nào, thứ tự nào đã đổi so với bài, và mọi lựa chọn minh hoạ (thứ hình vẽ ra mà bài không quy định). `storyboard.lib.mjs` đọc `message:` và `audience:` từ tệp này.

Viết `SCRIPT.md` theo khuôn ở `references/series.md` §2: một khung mở từ Cốt lõi; mỗi mục gồm các khung Quy tắc, rồi Dễ nhầm, rồi Cách nhớ; ba cặp khung Thử áp dụng; một khung kết.

- Tiêu đề `## Line N — <tên> (Frame N)`; lời đọc thụt 4 dấu cách. Tên tệp khung sinh từ tiêu đề, nên các tiêu đề phải khác nhau.
- Khung Quy tắc đọc đúng câu Quy tắc. Lời dẫn, nếu có, đặt ở cuối khung trước. **Mỗi thay đổi trên hình cần một cụm từ riêng trong lời đọc để neo mốc**; câu luật thường đã có sẵn các cụm đó. Cụm lặp lại trong cùng khung thì lấy mốc bằng `{ nth: 2 }`.
- Một câu Quy tắc dài hơn khoảng 30 âm tiết thì tách theo câu hay theo vế thành nhiều khung (Bài 1: định nghĩa đường cao tốc đi qua ba khung).
- Soát từng câu Quy tắc và từng con số với bản chép ở bước 1.
- `node scripts/scan-words.mjs` phải ra `clean`.

### 4. Giọng đọc và mốc lời đọc

Sửa `style` trong `.hyperframes/tts_request.json` cho hợp bài (giữ `provider`, `tts_model`, `voice`, `lang`). Rồi:

```bash
(cd "$P" && node scripts/voice.mjs request)            # lines lấy từ SCRIPT.md; in số âm tiết và thời lượng ước tính
(cd "$P" && node scripts/voice.mjs run)                # chạy nền: 7 dòng mỗi lượt, nghỉ 66 giây giữa hai lượt, tự chạy bù tới 3 vòng
(cd "$P" && node scripts/voice.mjs align)              # chữ kịch bản lên mốc đã nghe; in chỗ nghe khác kịch bản
(cd "$P" && node scripts/voice.mjs pad 01=1.7 15=1.5 16=1.1 21=1.6)  # khoảng lặng sau chữ cuối: 0,45 giây, hoặc số ghi cho từng khung
(cd "$P" && node scripts/build-cues.mjs)               # ghi assets/lib/world/cues.js
```

- `voice.mjs` đọc khoá từ biến môi trường `GEMINI_API_KEY`, che khoá trong mọi dòng in ra và không ghi khoá vào tệp nào. Khi nó không tự tìm thấy bộ skill HyperFrames, đặt `HF=…` trước lệnh.
- **Đọc danh sách "heard differently" của `align`.** Chỗ nghe khác kịch bản mà đổi nghĩa của câu luật (thiếu chữ "không", "hoặc", "chỉ", sai số) thì làm lại dòng đó: `node scripts/voice.mjs run 07`, rồi `align`, `pad`, `build-cues.mjs`.
- Khoảng lặng dài hơn cho khung mà hình còn việc sau chữ cuối. Bài 1 dùng: khung mở 1,7 giây; khung câu hỏi của Thử áp dụng 1,5 giây (nhịp nghĩ); khung trả lời 1,1 giây; khung kết 1,6 giây. `pad` nhớ các số đã cho trong `.hyperframes/voice_tails.json`; nó chỉ thêm, không cắt bớt.
- Chạy lại `build-cues.mjs` sau mọi thay đổi về giọng. Mọi mốc phía sau đọc từ `cues.js`.

### 5. Bắt đầu nhạc nền

Sửa prompt trong `.hyperframes/bgm_request.json`, rồi chạy sau khi giọng đã chốt (nhạc dài đúng bằng tổng lời đọc):

```bash
(cd "$P" && node "$ENGINE" --request ./.hyperframes/bgm_request.json --hyperframes . --out ./audio_engine_meta.json --only bgm 2>&1 | sed -E 's/(AIza|key=)[A-Za-z0-9_-]+/\1***/g; s/[A-Za-z0-9_-]{36,}/<redacted>/g')
```

Nhạc chạy nền vài phút; trong lúc đó làm bước 6.

### 6. Mô hình

Hai tệp riêng của bài trong `assets/lib/world/`. Toạ độ, API, các mẫu cảnh và cách thêm phần mới ở `references/model.md`.

| Tệp | Việc |
|---|---|
| `beats.js` | `buildBeats(K)`: mọi mốc mà hình phản ứng, đặt tên theo khung (`B.f8.high`). Canvas, lớp chữ và storyboard cùng đọc tệp này |
| `world.js` | `createWorld({ canvas })`: bảng máy quay `KEYS`; mỗi phần của video là một hàm cảnh (`carriageway`, `gauge`, `expressway`…) được gọi bốn lần cho bốn lớp vẽ; bảng `SCENES` nói cảnh nào giữ khung nào; cuối tệp `return createBench({ c, total, beats: B, draw })` |

Phần đường hay xe mới mà bài khác cũng dùng thì vẽ thẳng vào `road.js` của dự án (rồi chuyển về `kit/` khi xong, xem "Sau khi xong").

Sau mỗi lần sửa, kiểm và xem ngay, không chờ lắp ráp:

```bash
(cd "$P" && node scripts/bench-check.mjs)                          # 0 error, 0 NaN trên mọi 0,05 giây
(cd "$P" && node scripts/bench-shots.mjs try 3 "4:2.5,4:6,9:1")    # snapshots/bench/try.jpg, khung:giây-trong-khung
(cd "$P" && node scripts/bench-shots.mjs mid 4 mid)                # mỗi khung một ảnh ở giữa khung
```

Lỗi `cue not found: frame N "…"` nghĩa là cụm từ không có trong lời đọc của khung đó: sửa cụm cho khớp chữ trong `SCRIPT.md`.

### 7. Lớp chữ và storyboard

- `scripts/build-frames.mjs`: câu Quy tắc khai báo một lần thành hằng ở đầu tệp; một hàm cho mỗi khung, trả về `frame(n, body, js)`; cuối tệp `writeFrames([f1, f2, …])`. `rule()` ném lỗi khi hằng lệch lời đọc một chữ. Các khối ở `references/frames.md`.
- `scripts/build-storyboard.mjs`: mỗi khung một `scene`, các pha `sc`, SFX; tiêu đề, dòng nhạc và block Video direction; cuối tệp `writeStoryboard({ … })`. **Câu tả cảnh phải đúng với thứ canvas vẽ**; sửa cảnh thì sửa cả dòng này.

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

Tên SFX phải có trong `$HF/media-use/audio/assets/sfx/`; tên sai bị bỏ qua không báo. Đếm số SFX mà `lock-audio.mjs` in ra. Cách dùng SFX của chương ở `references/frames.md` §5.

### 9. Lắp ráp và kiểm

```bash
(cd "$P" && HF="$HF" bash scripts/assemble.sh --captions)
(cd "$P" && node scripts/scan-words.mjs)               # clean; lần này quét cả khung, phụ đề và nhãn trên canvas
(cd "$P" && node scripts/bench-check.mjs)              # 0 error, 0 NaN
(cd "$P" && node "$SK"/scripts/mix-balance.mjs)        # mục tiêu: nhạc dưới giọng 12 dB; Bài 1 ở 0.3 ra 10,7 dB
(cd "$P" && hyperframes lint)                          # 0 error
(cd "$P" && npm run check)                             # "Check passed"; mất vài phút, chạy một lần khi mọi thứ đã xong
(cd "$P" && bash scripts/snap.sh mid  "$(node scripts/frame-times.mjs mid)")
(cd "$P" && bash scripts/snap.sh late "$(node scripts/frame-times.mjs late)")
```

- `assemble.sh` sinh lại khung, chạy `check-frames.sh`, dựng phụ đề, lắp `index.html`, gắn lớp canvas và đặt thời lượng cho `world.html` (`patch-index.mjs`), chèn chuyển cảnh. Dòng `bgm (track 11)` phải là `yes`.
- **Đọc từng contact sheet** theo `references/qa.md` §2. Ảnh `late` cho thấy câu Quy tắc đã sáng hết, mọi nét gạch đã chạy xong và mô hình đã lắp đủ phần của khung đó.
- **Soát nội dung trên ảnh:** từng thẻ Quy tắc so với bản chép ở bước 1, từng chữ; đủ dòng của mỗi danh sách, đúng thứ tự; đúng từng con số.
- Sửa ở tệp nguồn, không sửa tệp khung đã sinh, rồi `assemble.sh` lại.
- Người dùng theo dõi chi phí: không chạy lại `npm run check` và ảnh chụp sau mỗi sửa nhỏ. Dùng `bench-check` và `bench-shots` (nhanh, không cần lắp ráp) cho canvas; gom các sửa rồi lắp ráp một lần.

### 10. Render, đo, báo cáo

```bash
(cd "$P" && hyperframes render --skill=faceless-explainer --quality high --output renders/video.mp4)   # chạy nền
```

Đo và so ảnh trích từ MP4 với ảnh chụp theo `vi-explainer-video/SKILL.md` bước 10 (ffprobe, LUFS −14 đến −16, true peak ≤ −1 dBFS, `blackdetect` 0). Độ to nằm ngoài khoảng đó thì chỉnh riêng âm thanh, không render lại (`references/qa.md` §4).

Báo cáo theo `references/qa.md` §5. Ngoài sáu mục của `vi-explainer-video`, video chương này có thêm:

- **Phạm vi:** video gồm mục nào của bài, mục nào để lại.
- **Đối chiếu brief:** câu Quy tắc nào đọc nguyên văn, câu nào đã rút gọn; bảng và con số; thứ tự nào đã đổi; chỗ brief thiếu hay chưa chắc.
- **Lựa chọn minh hoạ:** hình vẽ ra điều gì mà bài không quy định (Bài 1: xe thô sơ vẽ bằng xe đạp, xe máy chuyên dùng vẽ bằng xe lu, "không giao nhau cùng mức" vẽ bằng cầu vượt), và điều gì đã cố ý không vẽ.
- **Mức độ kiểm chứng của nguồn** (mục Nguyên tắc nội dung).
- **Tài sản:** dùng lại gì, vẽ mới gì.
- **Agent không nghe được âm thanh và không xem được chuyển động.**

### Sau khi xong

1. Thêm một dòng vào bảng "Đã làm" của `references/series.md` §6 và cập nhật cột trạng thái ở §4.
2. Phần đường, loại xe, khối chữ hay mẫu cảnh mới mà bài khác cũng dùng được thì chuyển từ dự án về `kit/` của skill (`road.js`, `iso.js`, `frames.law.mjs`), ghi vào `references/model.md` hay `references/frames.md`, rồi kiểm rằng ví dụ Bài 1 vẫn ra đúng dấu vân tay cũ (`references/qa.md` §3).
3. Người dùng đã duyệt video của một bài có cách trình bày khác hẳn (bảng con số, nút giao có xe rẽ, người và hiệu lệnh, giấy tờ) thì chép phần riêng của nó thành một thư mục mới trong `examples/`: `BRIEF.md`, `SCRIPT.md`, hai tệp request, `beats.js`, `world.js`, `build-frames.mjs`, `build-storyboard.mjs`. Không kèm `assets/voice`, `assets/bgm`, `assets/sfx`, `renders`, `snapshots`, `audio_*.json`, `cues.js`, `.hyperframes/whisper_words.json`.

## Tham khảo

| Tệp | Khi nào đọc |
|---|---|
| `references/series.md` | **Trước tiên:** luật nội dung, khuôn của một video, ngân sách thời lượng, bảng 21 bài, bài nào cần vẽ gì, bảng "Đã làm" |
| `references/model.md` | Bước 6: toạ độ và khung nhìn, `beats.js`, bảng màu, cách mô hình "diễn", API của `iso` và `road`, cấu trúc `world.js` của ví dụ, cách thêm phần mới |
| `references/frames.md` | Bước 7: bố cục cột chữ, tiêu đề mục, thẻ Quy tắc, Dễ nhầm, Cách nhớ, Thử áp dụng, storyboard, SFX |
| `references/qa.md` | Bước 9–10: phép kiểm, ảnh cần đọc, kiểm sau khi sửa `kit/`, chỉnh độ to, mẫu báo cáo, lỗi đã gặp |
| `.claude/skills/chuong-4-cau-tao-va-sua-chua-video/references/bench.md` §2, §5 | Hợp đồng của `beats.js`; `bench.js` (`vis`, `litSeq`, `createBench`), `draw.js`, `timeline.js` |
| `.claude/skills/chuong-4-cau-tao-va-sua-chua-video/references/frames.md` §2, §4 | Một khung của `build-frames.mjs`; các khối và hàm chuyển động của `frames.lib.mjs`, `frames.kit.mjs` |
| `.claude/skills/vi-explainer-video/` | Cài đặt, giọng, nhạc, phụ đề, render, `references/pitfalls.md` |
| `.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/references/world.md` | `path.js`, `stage.js` (`cueKit`), các script mượn |
