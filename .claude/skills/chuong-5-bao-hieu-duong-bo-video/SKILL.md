---
name: chuong-5-bao-hieu-duong-bo-video
description: "Sản xuất video cho nhóm bài Báo hiệu đường bộ (Chương V, Bài 1–28) của repo sat-hach-lai-xe: tấm biển là nhân vật chính trên một con phố 2D (biển tách thành từng lớp để đọc, biển đứng gác và phân xe sang hai phía bị cấm, được đi, mỗi biển một con phố xếp chồng thành bảng của bài), mọi thay đổi khớp từng chữ lời đọc, cột chữ bên trái có thanh các bước đọc biển và thẻ Chốt sáng dần từng chữ, giọng Gemini Leda, phụ đề, nhạc rồi render MP4. Dùng khi người dùng nói 'làm video bài <số> chương 5', 'video báo hiệu đường bộ', 'video biển báo', 'làm tiếp bài <tên bài>', 'video BAI-xx' của chương 5, hoặc đưa một brief trong video-briefs/chuong-5-bao-hieu-duong-bo."
---

# Video Báo hiệu đường bộ (tấm biển là nhân vật)

Skill này đóng gói cách đã làm video thử nghiệm Bài 1 "Biển cấm ô tô và biển cấm mô tô" (5:49, 22 khung, đủ năm ý, người dùng đã duyệt ngày 2026-10-12), để làm tiếp 27 bài còn lại của chương. **Làm một bài thì đọc `references/series.md` trước:** luật nội dung của chương, khuôn của một video, ngân sách thời lượng, bảng 28 bài và nhóm bài nào cần vẽ thêm gì.

Nó là **lớp "bài học biển báo"** đặt lên các skill khác và không lặp lại chúng:

- `.claude/skills/vi-explainer-video/SKILL.md`: cài đặt, font, giọng đọc, nhạc, phụ đề, render (bước 0, các nguyên tắc cố định, `references/audio.md`, `references/voices.md`, `references/pitfalls.md`). Đọc trước.
- `.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`: `new-project.sh` của skill này mượn từ đó hai tệp toán (`path.js`, `stage.js`) và tám script lắp ráp, kiểm, chụp ảnh. Không mượn three.js hay mô hình 3D nào: video của chương này vẽ bằng canvas 2D.
- `.claude/skills/chuong-4-cau-tao-va-sua-chua-video/references/`: tài liệu của phần khung dùng chung mà `kit/` ở đây chép nguyên (`bench.js`, `draw.js`, `timeline.js`, `frames.lib.mjs`, `frames.kit.mjs`, `voice.mjs`, hai công cụ kiểm). Tài liệu ở đây chỉ viết phần riêng của chương V và trỏ sang đó khi cần.

Chương này khác ba nhóm bài trước. Sa hình nhìn một nút giao từ trên cao; Kỹ thuật lái xe kể một chuyến xe; Cấu tạo mở máy ra trên bàn. Ở chương V **kiến thức chính là hình**: mỗi biển là một tổ hợp của dáng, màu, hình bên trong, hướng mũi tên và con số, và người học sai chủ yếu vì nhầm biển nọ với biển kia hoặc gọi sai tên chiếc xe của mình. Vì vậy video để **tấm biển làm nhân vật**: nó tách ra từng lớp cho người xem đọc, nó đứng gác ở đầu phố và phân từng chiếc xe sang bên "bị cấm" hay bên "được đi", và các biển dễ lẫn đứng cạnh nhau, mỗi biển một con phố.

## Hai bên

| Bên | Việc |
|---|---|
| `sat-hach-lai-xe` (repo nội dung) | Soạn `video-briefs/chuong-5-bao-hieu-duong-bo/BAI-NN-*.md`: câu hỏi mở đầu, ý lớn, từng ý với lời tả biển, phần "vì sao" và dòng **Chốt**, chỗ hay hiểu sai, các dòng ghi nhớ. Luật của chương, bốn cách đọc biển, bảng cụm từ tả biển và mức độ kiểm chứng ở `README.md` cùng thư mục; ảnh tham khảo và bảng đối chiếu nguồn ở `DOI-CHIEU.md` |
| `my-designer` (repo này) | Dựng video từ brief, kiểm, render, báo cáo; báo chỗ brief thiếu hay chưa chắc |

Repo kia chỉ đọc. Tệp duy nhất được sửa ở đó là `VIDEO-HANDOFF.md`, và chỉ khi người dùng yêu cầu.

## Trong skill có gì

```
chuong-5-bao-hieu-duong-bo-video/
  SKILL.md
  references/     series.md, street.md, frames.md, qa.md
  scripts/        new-project.sh
  kit/            phần dùng chung của chương, chép nguyên vào mỗi dự án
    assets/lib/world/signs.js      tấm biển cấm vẽ bằng bốn lớp (nền tròn trắng, viền đỏ, hình đen,
                                   gạch chéo đỏ): sign, sheet, sheets, pole; năm hình bên trong
    assets/lib/world/vehicles.js   xe ngoài phố nhìn ngang, bánh lăn theo quãng đường: xe gắn máy, xe
                                   mô tô hai bánh, ba bánh, ô tô con, xe khách, xe tải, rơ moóc, xe cứu
                                   thương, xe chữa cháy, người đi bộ; dấu ✓/✕, bảng tên, dấu hỏi
    assets/lib/world/street.js     con phố: nền, mặt đường, dãy nhà, vạch dừng; xe chạy theo mốc
                                   (track, put); phán quyết của biển (verdict), biển trên cột (post),
                                   viên lý do (note), thẻ bước có số (stepTag), mũi tên "BỊ CẤM / ĐƯỢC ĐI"
    assets/lib/world/draw.js       nét vẽ chung: chữ, mũi tên, viên chữ, nhãn chỉ vào vật
    assets/lib/world/bench.js      khung canvas: W, H, hàm hiện và tắt theo mốc (vis, litSeq), createBench()
    assets/lib/world/timeline.js   đường theo thời gian
    compositions/world.html        lớp canvas của video
    scripts/frames.signs.mjs       lớp chữ của chương: thanh các bước đọc biển, câu hỏi hiện theo
                                   giọng, cụm từ đổi màu theo nghĩa, thẻ Chốt sáng dần từng chữ (rule)
    scripts/frames.kit.mjs         vỏ khung, CSS, các hàm chuyển động (IN, PILL, RING…), icon
    scripts/frames.ctx.mjs         đọc cues.js và beats.js cho các script sinh
    scripts/frames.lib.mjs         khối dựng cột chữ: thẻ, dòng, câu sáng dần, ghi nhớ
    scripts/storyboard.lib.mjs     ghi STORYBOARD.md từ SCRIPT.md và mốc thật
    scripts/voice.mjs              giọng đọc từ SCRIPT.md tới mốc từng chữ: request, run, align, pad
    scripts/bench-check.mjs        chạy canvas trong Node cho mọi 0,05 giây: lỗi, NaN, dấu vân tay
    scripts/bench-shots.mjs        ảnh riêng canvas trong vài giây, không cần lắp ráp
    scripts/scan-words.mjs         quét chữ bị cấm của chương: số câu, kỳ thi, cuốn sách, "biển 1",
                                   "biển thứ hai", mã biển
  examples/bai-01-bien-cam-o-to-va-bien-cam-mo-to/      điểm xuất phát mặc định: Bài 1, đủ năm ý
    BRIEF.md, SCRIPT.md, .hyperframes/{tts_request,bgm_request}.json
    assets/lib/world/{beats,world}.js
    scripts/{build-frames,build-storyboard}.mjs
```

Từ `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`, `new-project.sh` chép thêm `assets/lib/world/{path,stage}.js` và các script `assemble.sh`, `build-cues.mjs`, `check-frames.sh`, `check-watermark.sh`, `frame-times.mjs`, `lock-audio.mjs`, `patch-index.mjs`, `snap.sh`. Skill kia và `vi-explainer-video` phải có mặt trong repo.

Skill không chứa tệp giọng, clip mẫu hay profile giọng nào, và không bao giờ được chứa. Không có khoá API nào trong các tệp request.

## Tái sử dụng được gì

| Mức | Thứ |
|---|---|
| **Dùng nguyên** | Toàn bộ `kit/`: biển tròn viền đỏ bốn lớp với năm hình (ô tô con nhìn từ phía trước, người đi xe mô tô, xe tải, xe khách xếp trên xe tải, xe tải kéo rơ moóc); mười loại xe ngoài phố; con phố, xe chạy theo mốc, dấu ✓/✕, thẻ bước; thanh các bước và thẻ Chốt của cột chữ; công cụ giọng đọc, hai công cụ kiểm canvas, các script; hệ thiết kế `glass-keynote`; cách làm nhạc, phụ đề, render |
| **Sửa từ ví dụ** | Bốn tệp riêng của bài: `beats.js` (mốc lời đọc), `world.js` (các cảnh trên phố; trong đó có sẵn các mẫu cảnh: biển tách lớp, biển đứng gác, hai cổng, phố xếp chồng, phóng to một biển, ba thẻ bước), `build-frames.mjs` (cột chữ), `build-storyboard.mjs`; cùng `BRIEF.md`, `SCRIPT.md` và hai tệp request |
| **Tạo mới** | Mọi biển chưa vẽ. `signs.js` mới chỉ có **biển cấm hình tròn viền đỏ**. Chưa có: hình bên trong khác (máy kéo, taxi, mũi tên rẽ, con số…), biển tam giác viền đỏ nền vàng, biển tròn nền xanh lam, biển vuông và chữ nhật nền xanh lam, biển nền xanh lá cây, biển phụ, dải vạch đen "hết lệnh", biển sọc vàng đen, vạch kẻ đường, và các xe chưa có (máy kéo, taxi, xe súc vật kéo, xe đạp, tàu hoả). Bảng theo nhóm bài ở `references/series.md` §5; cách thêm ở `references/street.md` §6 |

Cấu hình đã chạy thật: một video, 22 khung, 977 âm tiết lời đọc, 349 giây, giọng Leda, 11 SFX. Chưa bài nào khác được làm bằng skill này.

## Yêu cầu cố định của video chương này

1. **Phố ở bên phải, chữ ở bên trái.** Hình vẽ trong vùng x 690–1870. Cột chữ ở x 64–620: ở cảnh có phố chạy ngang hết khung (xe đi vào từ mép trái), thẻ chữ kết thúc trên y ≈ 660; ở cảnh khác, trên y 880. Phụ đề nằm dưới y 896.
2. **Tấm biển là nhân vật, và nó được vẽ đúng.** Dáng, màu viền, màu nền, hình bên trong, hướng mũi tên, trái hay phải, một gạch hay hai gạch: đổi một chi tiết là thành biển khác. Vẽ theo lời tả trong bài và ảnh tham khảo `images/crops/cau-<số>.jpg` (tra ở `DOI-CHIEU.md`). Ảnh chỉ để tham khảo, không dán vào video. Màu của biển thắng bảng màu của video.
3. **Hình làm đúng điều lời đọc đang nói, đúng lúc nó được nói.** Mọi thay đổi trên canvas neo vào một cụm từ của lời đọc qua `beats.js`. Không có chuyển động trang trí.
4. **Mỗi phần của video có một cách "diễn" của tấm biển, chọn theo việc bài đang làm** (`references/street.md` §4): dạy cách đọc → biển tách lớp; nói biển cấm ai → biển đứng gác, xe tới và bị phân sang hai phía; hai biển dễ lẫn → hai cổng cạnh nhau; bảng "xe nào, biển nào" → mỗi biển một con phố xếp chồng; một chi tiết nhỏ quyết định nghĩa → phóng to biển đó.
5. **Màu là phán quyết, dùng thống nhất cả chương:** đỏ là bị cấm; xanh lá là được đi; hổ phách là câu hỏi và chữ rào đón; tím nhạt là tên biển, tên xe, thuật ngữ. Dấu ✓ xanh và ✕ đỏ chỉ đặt lên chiếc xe mà bài có nói kết luận. Ô nào bài không nói thì không vẽ.
6. **Thanh các bước đọc biển nằm đầu cột chữ** suốt phần dạy cách đọc, và trở lại ở khung cuối. Bài 1 dùng ba bước DÁNG VÀ MÀU → HÌNH BÊN TRONG → TÊN ĐÚNG CỦA XE; bài có cách đọc khác thì đặt lại bằng `setSteps()` theo "Ý lớn của bài" của brief.
7. **Dòng Chốt hiện nguyên văn trong thẻ viền tím nhạt, sáng dần từng chữ theo giọng đọc.** Mỗi cụm trong câu giữ màu theo nghĩa của nó sau khi được đọc.
8. **Tên biển và tên xe giữ nguyên từng chữ**, trên lời đọc, trên thẻ và trên nhãn canvas. Biển chưa có tên trong bài thì gọi bằng hình của nó ("biển có hình xe tải kéo rơ moóc"). Không gọi biển bằng số thứ tự, không ghi mã biển.
9. **Chữ trên canvas từ 20 px trở lên**, tên xe và nhãn chính 22–30 px, để xem được trên điện thoại.

## Nguyên tắc nội dung

Luật đầy đủ ở `README.md` của thư mục brief; tóm tắt và cách áp dụng ở `references/series.md` §1.

- **Dòng Chốt là định nghĩa chuẩn.** Được nói gọn hơn, không thêm, không bớt, không đổi nghĩa. Từng chữ có việc của nó: "trừ xe mô tô hai bánh, xe gắn máy và các xe ưu tiên theo quy định", "cả hai biển", "tối đa", "tối thiểu".
- **Con số và chữ trên biển giữ nguyên:** "50", "2.5 t", "14 m", "500m", "6:00 - 18:00", "ZONE".
- **Giữ nguyên chữ rào đón** ("Phần lớn", "thường", "Có thể hiểu lý do như sau", "Cách nhớ"). Chúng đánh dấu phần giải thích của người soạn; trên hình chúng mang màu hổ phách.
- **Không thêm kiến thức ngoài bài**: không mức phạt, không mã biển, không khoảng cách đặt biển, không ngoại lệ bài không nêu. Thiếu thì ghi vào báo cáo.
- **Video đứng một mình.** Không số câu, không kỳ thi, không cuốn sách, không nhắc bài khác, ở lời đọc, chữ trên hình và phụ đề. `scripts/scan-words.mjs` kiểm.
- **Mỗi video mang theo "Ý lớn của bài"**, kể cả phần 2, phần 3 của cùng một bài.
- **"Biển nền xanh lam thì không cấm gì" là sai.** Cách phân loại theo dáng và màu là mẹo nhận loại biển, có ngoại lệ; giữ đúng mức khẳng định của bài.
- **Vài ý README nêu là chưa chắc** (Bài 7 ý 3, Bài 21 ý 4, và các chỗ ở `references/series.md` §4): hỏi người dùng trước khi dựng ý đó.
- **Phần "vì sao", cách đọc hình và mẹo nhớ do người soạn bài viết, mới được AI soát, chưa có giáo viên dạy lái xe duyệt và chưa so với quy chuẩn báo hiệu đường bộ.** Báo cáo nào cũng ghi điều này.
- **Giọng mặc định là Gemini Leda.** Giọng nhân bản chỉ khi người dùng yêu cầu, theo `vi-explainer-video/references/voices.md`.

## Đường dẫn

```bash
ROOT=$(git rev-parse --show-toplevel)
S=$ROOT/.claude/skills/chuong-5-bao-hieu-duong-bo-video
SK=$ROOT/.claude/skills/vi-explainer-video
HF=<thư mục có faceless-explainer; new-project.sh in ra ở dòng "HF:">
FX=$HF/faceless-explainer/scripts
ENGINE=$HF/media-use/audio/scripts/audio.mjs
P=$ROOT/projects/sat-hach-lai-xe/videos/<ten-du-an>
BRIEFS=/Users/phucnt/workspace/sat-hach-lai-xe/projects/sat-hach-lai-xe/video-briefs/chuong-5-bao-hieu-duong-bo
```

Mỗi lệnh Bash là một shell mới: khai báo lại biến trong cùng lệnh, và dùng `(cd "$P" && …)`. Lệnh CLI viết `hyperframes …`; máy không có lệnh đó thì thay bằng `npx -y hyperframes …` (viết thẳng, không cất vào biến).

## Quy trình

### 1. Đọc brief và chia video

Đọc `$BRIEFS/README.md` rồi `BAI-NN-*.md` của bài, các dòng của bài trong `$BRIEFS/DOI-CHIEU.md` (để biết ảnh tham khảo), và dòng của bài trong `references/series.md` §4–§5. Quyết định trước khi viết gì:

- **Bài này thành mấy video.** Một video khoảng 5 đến 6 phút. Bài 1 trọn năm ý trong 977 âm tiết lời đọc (`references/series.md` §3); bài dài hơn thì chia theo ý và nói rõ trong báo cáo ý nào để lại.
- **Mỗi ý: tấm biển "diễn" theo cách nào** (yêu cầu cố định 4), biển nào đứng cạnh biển nào, xe nào tới gặp biển. Biển dễ lẫn lấy từ chính ý đó và mục "Những chỗ hay hiểu sai", không tự nghĩ ra.
- **Bài cần vẽ gì mới** (`references/series.md` §5): dáng biển, hình bên trong, loại xe. Mở ảnh tham khảo của từng biển (Read `images/crops/cau-<số>.jpg`) trước khi vẽ.
- **Bài có dòng Chốt nào, tên biển nào, con số nào, chữ rào đón nào.** Chép nguyên văn sang một bên để soát lại ở bước 3 và bước 9.

Brief thiếu thứ không suy ra được thì hỏi người dùng một lần. Thứ khác chọn mặc định hợp lý, ghi vào báo cáo, rồi làm tiếp.

### 2. Tạo dự án

```bash
bash .claude/skills/chuong-5-bao-hieu-duong-bo-video/scripts/new-project.sh chuong-5-bai-<NN>-<ten-ngan>
```

Lệnh tạo `projects/sat-hach-lai-xe/videos/<ten-du-an>` (HyperFrames trống, font tiếng Việt, `glass-keynote`), chép phần mượn của `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`, `kit/` của chương và các tệp của ví dụ Bài 1. Ghi lại dòng `HF:`. `--bare` bỏ phần ví dụ; dự án khi đó chưa chạy được cho tới khi có đủ bốn tệp riêng của bài. `projects/sat-hach-lai-xe/videos/` nằm trong `.gitignore`; không `git add -f` gì ở đó.

### 3. BRIEF.md và SCRIPT.md

Sửa `BRIEF.md`: thông điệp một câu, khán giả, độ dài, `voice: Leda`; mục Notes ghi dòng Chốt đặt ở khung nào, tên biển được dùng, chữ rào đón, ảnh tham khảo đã xem và mọi lựa chọn minh hoạ. `storyboard.lib.mjs` đọc `message:` và `audience:` từ tệp này.

Viết `SCRIPT.md` theo khuôn ở `references/series.md` §2: một khung câu hỏi mở đầu ngay tại con phố; các khung cách đọc (ý lớn của bài); mỗi ý gồm khung tả biển, khung Chốt, khung "xe nào bị cấm, vì sao"; khung cuối nhắc lại các bước đọc.

- Tiêu đề `## Line N — <tên> (Frame N)`; lời đọc thụt 4 dấu cách. Tên tệp khung sinh từ tiêu đề, nên các tiêu đề phải khác nhau.
- Mỗi câu trọn ý, không quá khoảng 20 âm tiết. **Mỗi thay đổi trên hình cần một cụm từ riêng trong lời đọc để neo mốc.** Cụm lặp lại trong cùng khung thì lấy mốc bằng `{ nth: 2 }`.
- Khung Chốt đọc đúng dòng Chốt (một hoặc hai câu). Lời dẫn đặt ở cuối khung trước.
- Soát từng dòng Chốt, từng tên biển và từng con số với bản chép ở bước 1.
- `node scripts/scan-words.mjs` phải ra `clean`.

### 4. Giọng đọc và mốc lời đọc

Sửa `style` trong `.hyperframes/tts_request.json` cho hợp bài (giữ `provider`, `tts_model`, `voice`, `lang`). Rồi:

```bash
(cd "$P" && node scripts/voice.mjs request)            # lines lấy từ SCRIPT.md; in số âm tiết và thời lượng ước tính
(cd "$P" && node scripts/voice.mjs run)                # chạy nền: 7 dòng mỗi lượt, nghỉ 66 giây giữa hai lượt, tự chạy bù tới 3 vòng
(cd "$P" && node scripts/voice.mjs align)              # chữ kịch bản lên mốc đã nghe; in chỗ nghe khác kịch bản
(cd "$P" && node scripts/voice.mjs pad 01=1.3 07=1.5 22=2.6)  # khoảng lặng sau chữ cuối: 0,45 giây, hoặc số ghi cho từng khung
(cd "$P" && node scripts/build-cues.mjs)               # ghi assets/lib/world/cues.js
```

- `voice.mjs` đọc khoá từ biến môi trường `GEMINI_API_KEY`, che khoá trong mọi dòng in ra và không ghi khoá vào tệp nào. Khi nó không tự tìm thấy bộ skill HyperFrames, đặt `HF=…` trước lệnh.
- **Đọc danh sách "heard differently" của `align`.** Chỗ nghe khác kịch bản mà đổi nghĩa (thiếu chữ "trừ", sai tên xe, sai số) thì làm lại dòng đó: `node scripts/voice.mjs run 07`, rồi `align`, `pad`, `build-cues.mjs`.
- Khoảng lặng dài hơn cho khung mà hình còn việc sau chữ cuối. Bài 1 dùng: khung 1 là 1,3 giây; khung Chốt 1,5 giây; khung có bảng vừa đủ ô 1,0 giây; khung cuối 2,6 giây. `pad` nhớ các số đã cho trong `.hyperframes/voice_tails.json`; nó chỉ thêm, không cắt bớt.
- Chạy lại `build-cues.mjs` sau mọi thay đổi về giọng. Mọi mốc phía sau đọc từ `cues.js`.

### 5. Bắt đầu nhạc nền

Sửa prompt trong `.hyperframes/bgm_request.json`, rồi chạy sau khi giọng đã chốt (nhạc dài đúng bằng tổng lời đọc):

```bash
(cd "$P" && node "$ENGINE" --request ./.hyperframes/bgm_request.json --hyperframes . --out ./audio_engine_meta.json --only bgm 2>&1 | sed -E 's/(AIza|key=)[A-Za-z0-9_-]+/\1***/g; s/[A-Za-z0-9_-]{36,}/<redacted>/g')
```

Nhạc chạy nền vài phút; trong lúc đó làm bước 6.

### 6. Con phố

Hai tệp riêng của bài trong `assets/lib/world/`. API, các mẫu cảnh và cách thêm biển mới ở `references/street.md`.

| Tệp | Việc |
|---|---|
| `beats.js` | `buildBeats(K)`: mọi mốc mà hình phản ứng, đặt tên theo khung (`B.f9.except`). Canvas, lớp chữ và storyboard cùng đọc tệp này |
| `world.js` | `createWorld({ canvas })`: mỗi phần của video là một hàm cảnh (`opening`, `layers`, `gate`, `matrixA`…) vẽ lại từ đầu cho mọi thời điểm `t`; `draw(t)` gọi `scene(t, T(a), T(b), fn)` cho từng cảnh; cuối tệp `return createBench({ c, total, beats: B, draw })` |

Biển hay xe mới mà bài khác cũng dùng thì vẽ thẳng vào `signs.js`, `vehicles.js` của dự án (rồi chuyển về `kit/` khi xong, xem "Sau khi xong").

Sau mỗi lần sửa, kiểm và xem ngay, không chờ lắp ráp:

```bash
(cd "$P" && node scripts/bench-check.mjs)                          # 0 error, 0 NaN trên mọi 0,05 giây
(cd "$P" && node scripts/bench-shots.mjs try 3 "4:2.5,4:6,9:1")    # snapshots/bench/try.jpg, khung:giây-trong-khung
(cd "$P" && node scripts/bench-shots.mjs mid 4 mid)                # mỗi khung một ảnh ở giữa khung
```

Lỗi `cue not found: frame N "…"` nghĩa là cụm từ không có trong lời đọc của khung đó: sửa cụm cho khớp chữ trong `SCRIPT.md`.

### 7. Lớp chữ và storyboard

- `scripts/build-frames.mjs`: một hàm cho mỗi khung, trả về `frame(n, body, js)`; cuối tệp `writeFrames([f1, f2, …])`. Chữ trên thẻ là lời đọc rút gọn, không thêm ý. Thanh các bước, câu hỏi, thẻ Chốt và các khối khác ở `references/frames.md`.
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
(cd "$P" && node "$SK"/scripts/mix-balance.mjs)        # mục tiêu: nhạc dưới giọng 12 dB; Bài 1 chốt bgm.volume 0.35
(cd "$P" && hyperframes lint)                          # 0 error
(cd "$P" && npm run check)                             # "Check passed"; mất vài phút, chạy một lần khi mọi thứ đã xong
(cd "$P" && bash scripts/snap.sh mid  "$(node scripts/frame-times.mjs mid)")
(cd "$P" && bash scripts/snap.sh late "$(node scripts/frame-times.mjs late)")
```

- `assemble.sh` sinh lại khung, chạy `check-frames.sh`, dựng phụ đề, lắp `index.html`, gắn lớp canvas và đặt thời lượng cho `world.html` (`patch-index.mjs`), chèn chuyển cảnh. Dòng `bgm (track 11)` phải là `yes`.
- **Đọc từng contact sheet** theo `references/qa.md` §2. Ảnh `late` quan trọng nhất ở chương này: nó cho thấy mọi thẻ đã có đủ dòng, mọi xe đã nhận đủ dấu ✓/✕ và không nhãn nào đè lên nhau.
- **Soát nội dung trên ảnh:** từng biển so với ảnh tham khảo; dòng Chốt đủ từng vế; tên biển và tên xe đúng chữ; mỗi dấu ✓/✕ đúng với bài.
- Sửa ở tệp nguồn, không sửa tệp khung đã sinh, rồi `assemble.sh` lại.
- Người dùng theo dõi chi phí: không chạy lại `npm run check` và ảnh chụp sau mỗi sửa nhỏ. Dùng `bench-check` và `bench-shots` (nhanh, không cần lắp ráp) cho canvas; gom các sửa rồi lắp ráp một lần.

### 10. Render, đo, báo cáo

```bash
(cd "$P" && hyperframes render --skill=faceless-explainer --quality high --output renders/video.mp4)   # chạy nền
```

Đo và so ảnh trích từ MP4 với ảnh chụp theo `vi-explainer-video/SKILL.md` bước 10 (ffprobe, LUFS −14 đến −16, true peak ≤ −1 dBFS, `blackdetect` 0). Bản gửi qua kênh có giới hạn dung lượng: `references/qa.md` §4.

Báo cáo theo `references/qa.md` §5. Ngoài sáu mục của `vi-explainer-video`, video chương này có thêm:

- **Phạm vi:** video gồm ý nào của bài, ý nào để lại cho phần sau.
- **Đối chiếu brief:** từng dòng Chốt, tên biển, con số và chữ rào đón đã giữ thế nào; chỗ brief thiếu hay chưa chắc.
- **Biển đã vẽ:** biển nào, theo ảnh tham khảo nào; chi tiết nào không chắc đã vẽ đúng.
- **Lựa chọn minh hoạ:** hình vẽ ra điều gì mà bài không quy định (dáng xe ngoài phố, khung cảnh), và ô nào đã cố ý không vẽ.
- **"Vì sao" chưa có giáo viên duyệt.**
- **Tài sản:** dùng lại gì, vẽ mới gì.
- **Agent không nghe được âm thanh và không xem được chuyển động.**

### Sau khi xong

1. Thêm một dòng vào bảng "Đã làm" của `references/series.md` §6 và cập nhật cột trạng thái ở §4.
2. Biển, hình bên trong, loại xe hay mẫu cảnh mới mà bài khác cũng dùng được thì chuyển từ dự án về `kit/` của skill (`signs.js`, `vehicles.js`, `street.js`, `frames.signs.mjs`), ghi vào `references/street.md` hay `references/frames.md`, rồi kiểm rằng ví dụ Bài 1 vẫn ra đúng dấu vân tay cũ (`references/qa.md` §3).
3. Người dùng đã duyệt video của một bài có loại hình khác hẳn (biển tam giác báo nguy hiểm, biển hiệu lệnh có mũi tên, biển phụ, vạch kẻ đường) thì chép phần riêng của nó thành một thư mục mới trong `examples/`: `BRIEF.md`, `SCRIPT.md`, hai tệp request, `beats.js`, `world.js`, `build-frames.mjs`, `build-storyboard.mjs`. Không kèm `assets/voice`, `assets/bgm`, `assets/sfx`, `renders`, `snapshots`, `audio_*.json`, `cues.js`, `.hyperframes/whisper_words.json`.

## Tham khảo

| Tệp | Khi nào đọc |
|---|---|
| `references/series.md` | **Trước tiên:** luật nội dung, khuôn của một video, ngân sách thời lượng, bảng 28 bài, nhóm bài nào cần vẽ gì, bảng "Đã làm" |
| `references/street.md` | Bước 6: toạ độ, `beats.js`, bảng màu, API của `signs`, `vehicles`, `street`, các mẫu cảnh trong `world.js` của ví dụ, cách thêm biển, hình và xe mới |
| `references/frames.md` | Bước 7: bố cục cột chữ, thanh các bước, thẻ Chốt, các khối, storyboard, SFX |
| `references/qa.md` | Bước 9–10: phép kiểm, ảnh cần đọc, kiểm sau khi sửa `kit/`, bản xem thử, mẫu báo cáo, lỗi đã gặp |
| `.claude/skills/chuong-4-cau-tao-va-sua-chua-video/references/bench.md` §2, §5 | Hợp đồng của `beats.js`; `bench.js` (`vis`, `litSeq`, `createBench`), `draw.js`, `timeline.js` |
| `.claude/skills/chuong-4-cau-tao-va-sua-chua-video/references/frames.md` §2, §4 | Một khung của `build-frames.mjs`; các khối và hàm chuyển động của `frames.lib.mjs`, `frames.kit.mjs` |
| `.claude/skills/vi-explainer-video/` | Cài đặt, giọng, nhạc, phụ đề, render, `references/pitfalls.md` |
| `.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/references/world.md` | `path.js`, `stage.js` (`cueKit`), các script mượn |
