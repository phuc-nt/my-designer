---
name: chuong-3-ky-thuat-lai-xe-video
description: "Sản xuất video cho nhóm bài Kỹ thuật lái xe (Chương III, Bài 1–11) của repo sat-hach-lai-xe: người xem ngồi sau tay lái trong một con đường 3D, cảnh phản ứng theo từng câu lời đọc (đèn, sương, mưa, tốc độ, khoảng cách), cột chữ bên trái sinh từ mốc lời đọc, giọng Gemini Leda, phụ đề, nhạc rồi render MP4. Dùng khi người dùng nói 'làm video bài <số> chương 3', 'video kỹ thuật lái xe', 'làm tiếp bài <tên bài>', 'video BAI-0x', hoặc đưa một brief trong video-briefs/chuong-3-ky-thuat-lai-xe."
---

# Video Kỹ thuật lái xe (góc nhìn người lái)

Skill này đóng gói cách đã làm video thử nghiệm Bài 5 "Khi không nhìn rõ" (5:06, 16 khung) để làm tiếp mười bài còn lại của chương. **Làm một bài thì đọc `references/series.md` trước:** luật nội dung của chương, cách chia một bài thành video, ngân sách thời lượng, bài nào cần dựng thêm gì.

Nó là **lớp "bài học lái xe"** đặt lên hai skill khác và không lặp lại chúng:

- `.claude/skills/vi-explainer-video/SKILL.md`: cài đặt, font, giọng đọc, nhạc, phụ đề, render (bước 0, các nguyên tắc cố định, `references/audio.md`, `references/voices.md`, `references/pitfalls.md`). Đọc trước.
- `.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/`: engine 3D dùng chung (three.js đã đóng gói, 12 mô hình, đọc mốc lời đọc, lắp ráp, chụp ảnh). `new-project.sh` của skill này chép các tệp đó từ `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`, nên skill kia phải có mặt trong repo.

Khác với video sa hình (một góc cố định trên cao nhìn xuống nút giao), video của chương này kể bằng **một chuyến xe**: xe của người xem đứng ở gốc toạ độ, con đường trôi qua, máy quay chủ yếu ở ghế lái và chỉ ra ngoài khi cần thấy cả xe hay khoảng cách.

## Hai bên

| Bên | Việc |
|---|---|
| `sat-hach-lai-xe` (repo nội dung) | Soạn `video-briefs/chuong-3-ky-thuat-lai-xe/BAI-NN-*.md`: câu hỏi mở đầu, ý lớn, từng ý với dòng **Chốt** và phần "vì sao", các dòng ghi nhớ. Luật của chương ở `README.md` cùng thư mục, bảng đối chiếu nguồn ở `DOI-CHIEU.md` |
| `my-designer` (repo này) | Dựng video từ brief, kiểm, render, báo cáo; báo chỗ brief thiếu hay chưa chắc |

Repo kia chỉ đọc. Tệp duy nhất được sửa ở đó là `VIDEO-HANDOFF.md`, và chỉ khi người dùng yêu cầu.

## Trong skill có gì

```
chuong-3-ky-thuat-lai-xe-video/
  SKILL.md
  references/     series.md, world.md, frames.md, qa.md
  scripts/        new-project.sh
  kit/            phần dùng chung của chương, chép nguyên vào mỗi dự án
    assets/lib/world/geom.js       số đo của đường và xe; stopDist()
    assets/lib/world/timeline.js   đường tốc độ, bảng cảnh quay, quãng đã đi, tấp vào lề
    assets/lib/world/road.js       sân khấu: đường, lề, cây, cọc tiêu, trời, sương, đèn xe, máy quay,
                                   dải dừng xe, vạch mép, nhãn bám theo vật; bảng màu night và day
    assets/lib/world/hud.js        lớp 2D: kính chắn gió, mưa, gạt nước, quầng chói, ca-pô và vô lăng,
                                   bảng đồng hồ góc trên phải, dấu ngắm, thanh chờ
    compositions/world.html        lớp 3D của video
    scripts/frames.kit.mjs         vỏ khung, CSS, các hàm chuyển động (IN, PILL, PULSE…), icon
    scripts/frames.ctx.mjs         đọc cues.js và beats.js cho các script sinh
    scripts/frames.lib.mjs         khối dựng cột chữ: thẻ, dòng, số bước, câu sáng dần, ghi nhớ
    scripts/storyboard.lib.mjs     ghi STORYBOARD.md từ SCRIPT.md và mốc thật
    scripts/scan-words.mjs         quét chữ bị cấm của chương
  examples/bai-05-khi-khong-nhin-ro/  điểm xuất phát mặc định: Bài 5, ý 1–3, đêm, sương mù, mưa to
    BRIEF.md, SCRIPT.md, .hyperframes/{tts_request,bgm_request}.json
    assets/lib/world/{beats,drive,world}.js
    scripts/{build-frames,build-storyboard}.mjs
```

Từ `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit`, `new-project.sh` chép thêm: `assets/models/*.glb`, `assets/lib/three-bundle.js`, `assets/lib/world/{path,stage,models}.js`, và các script `assemble.sh`, `build-cues.mjs`, `check-frames.sh`, `check-watermark.sh`, `frame-times.mjs`, `lock-audio.mjs`, `patch-index.mjs`, `snap.sh`.

Skill không chứa tệp giọng, clip mẫu hay profile giọng nào, và không bao giờ được chứa. Không có khoá API nào trong các tệp request.

## Tái sử dụng được gì

| Mức | Thứ |
|---|---|
| **Dùng nguyên** | Toàn bộ `kit/`: đường hai làn có lề và chỗ dừng xe, cây, cọc tiêu, trời đêm hoặc ngày, sương, mưa, gạt nước, đèn chiếu xa, chiếu gần, đèn sương mù, đèn dừng khẩn cấp, đèn phanh; ghế lái có ca-pô và vô lăng; bảy kiểu cảnh quay; dải dừng xe và bảng "tầm nhìn so với quãng dừng xe"; bộ khối cột chữ; các script; hệ thiết kế `glass-keynote`; cách làm giọng, nhạc, phụ đề |
| **Sửa từ ví dụ** | Năm tệp riêng của bài: `beats.js` (mốc lời đọc), `drive.js` (chuyến xe theo thời gian), `world.js` (đạo diễn: xe, máy quay, nhãn, bảng đồng hồ), `build-frames.mjs` (cột chữ), `build-storyboard.mjs` |
| **Tạo mới** | Thứ sân khấu chưa có: dốc, mặt đường trơn hay ngập, khúc cua và quay đầu, đường ngang đường sắt, đường cao tốc nhiều làn, bàn đạp và cần số trong ca-bin, cửa xe mở, xe tự đổ nâng thùng, hình cận cảnh mô tô. Bảng theo từng bài ở `references/series.md` §5; cách thêm ở `references/world.md` §7 |

Cấu hình đã chạy thật: một video, 16 khung, 873 âm tiết lời đọc, 5:06, bối cảnh đêm. Bảng màu `day` mới chỉ được chụp thử trên cảnh của Bài 5 (đọc được, chưa dùng trong video nào): bài đầu tiên dùng ban ngày phải soát kỹ ảnh và chỉnh `PALETTES.day` trong `road.js`.

## Yêu cầu cố định của video chương này

1. **Người xem ngồi sau tay lái.** Máy quay chỉ rời ghế lái khi cần thấy cả hai xe, khoảng cách, hay một chi tiết ở ngoài xe, và trở lại ngay sau đó.
2. **Cảnh làm đúng điều lời đọc đang nói, đúng lúc nó được nói.** Mọi thay đổi (đổi đèn, giảm tốc, sương dày lên, tấp vào lề) neo vào một cụm từ trong lời đọc qua `beats.js`. Không có chuyển động trang trí.
3. **Không vẽ thao tác bài không nói.** Ví dụ ở Bài 5: xe tấp vào chỗ dừng mà không bật xi nhan, vì bài không nhắc tới xi nhan. Thao tác thêm trên hình cũng là thêm kiến thức.
4. **Không có con số nào bài không có.** Tốc độ, số mét, số giây chỉ lên hình khi brief nêu. Thanh và dải màu chỉ so độ dài với nhau.
5. **Ban ngày, sáng sủa là mặc định** (`palette: "day"`). Chỉ dùng đêm khi nội dung của bài là ban đêm.
6. **Xe chạy bên phải, người lái ngồi bên trái.**
7. **Màu có nghĩa cố định:** xanh lá là làm đúng hay an toàn; đỏ là sai hay nguy hiểm; hổ phách là thứ đang được nói tới; xanh da trời là thứ đang được đo (tầm nhìn, khoảng cách). Mỗi bài ghi bảng màu của mình vào Video direction và giữ suốt video.
8. **Chữ nằm ở cột trái** (x 64–620), không gì dưới y 880; góc trên phải dành cho bảng đồng hồ của cảnh 3D.

## Nguyên tắc nội dung

Luật đầy đủ ở `README.md` của thư mục brief; tóm tắt và cách áp dụng ở `references/series.md` §1.

- **Dòng Chốt là quy tắc chuẩn.** Được nói gọn hơn, không thêm, không bớt thao tác, không đổi nghĩa.
- **Danh sách đánh số là trình tự thật.** Giữ đúng số và thứ tự, trên lời đọc và trên hình.
- **Số trong quy tắc giữ nguyên**; không tự nghĩ ra số. Số trong ví dụ là ước lượng: giữ lời giả định đi kèm.
- **Không thêm kiến thức ngoài bài.** Thiếu thì ghi vào báo cáo.
- **Giữ nguyên chữ rào đón** ("trên nhiều xe", "trên hầu hết các xe").
- **Video đứng một mình.** Không số câu, không kỳ thi, không cuốn sách, ở lời đọc, chữ trên hình và phụ đề. `scripts/scan-words.mjs` kiểm.
- **Dùng đúng thuật ngữ của chương** (bảng ở README của brief): lần đầu nói "đèn chiếu xa, thường gọi là đèn pha", sau đó dùng một tên.
- **Phần "vì sao" do người soạn bài viết, chưa có giáo viên dạy lái xe duyệt.** Báo cáo nào cũng ghi điều này.
- **Giọng mặc định là Gemini Leda.** Giọng nhân bản chỉ khi người dùng yêu cầu, theo `vi-explainer-video/references/voices.md`.

## Đường dẫn

```bash
ROOT=$(git rev-parse --show-toplevel)
S=$ROOT/.claude/skills/chuong-3-ky-thuat-lai-xe-video
SK=$ROOT/.claude/skills/vi-explainer-video
HF=<thư mục có faceless-explainer; new-project.sh in ra ở dòng "HF:">
FX=$HF/faceless-explainer/scripts
ENGINE=$HF/media-use/audio/scripts/audio.mjs
P=$ROOT/videos/<ten-du-an>
BRIEFS=/Users/phucnt/workspace/sat-hach-lai-xe/video-briefs/chuong-3-ky-thuat-lai-xe
```

Mỗi lệnh Bash là một shell mới: khai báo lại biến trong cùng lệnh, và dùng `(cd "$P" && …)`. Lệnh CLI viết `hyperframes …`; máy không có lệnh đó thì thay bằng `npx -y hyperframes …` (viết thẳng, không cất vào biến).

## Quy trình

### 1. Đọc brief và chia video

Đọc `$BRIEFS/README.md` rồi `BAI-NN-*.md` của bài. Quyết định trước khi viết gì:

- **Bài này thành mấy video.** Đếm âm tiết của từng ý (`references/series.md` §3). Khoảng 850 âm tiết lời đọc là 5 phút. Bài dài hơn thì chia theo ý, mỗi video trọn một số ý, và nói rõ trong báo cáo ý nào để lại.
- **Mỗi ý cần thấy gì trên đường.** Ghi ra từng ý: cảnh ở ghế lái cho thấy điều gì, lúc nào cần ra ngoài xe. Sân khấu đã có thứ đó chưa (`references/series.md` §5).
- **Bài có số nào, danh sách đánh số nào, chữ rào đón nào.** Chép nguyên văn sang một bên để soát lại ở bước 3 và bước 9.

Brief thiếu thứ không suy ra được thì hỏi người dùng một lần. Thứ khác chọn mặc định hợp lý, ghi vào báo cáo, rồi làm tiếp.

### 2. Tạo dự án

```bash
bash .claude/skills/chuong-3-ky-thuat-lai-xe-video/scripts/new-project.sh chuong-3-bai-<NN>-<ten-ngan>
```

Lệnh tạo `videos/<ten-du-an>` (HyperFrames trống, font tiếng Việt, `glass-keynote`), chép engine dùng chung, `kit/` của chương và các tệp của ví dụ Bài 5. Ghi lại dòng `HF:`. `--bare` bỏ phần ví dụ; dự án khi đó chưa chạy được cho tới khi có đủ năm tệp riêng của bài. `videos/` nằm trong `.gitignore`; không `git add -f` gì ở đó.

### 3. BRIEF.md và SCRIPT.md

Sửa `BRIEF.md` (thông điệp một câu, khán giả, độ dài, `voice: Leda`, ghi chú về số và danh sách của bài). `storyboard.lib.mjs` đọc `message:` và `audience:` từ tệp này.

Viết `SCRIPT.md` theo khuôn đã dùng (`references/series.md` §2): một khung mở bằng tình huống và câu hỏi; một đến hai khung ý lớn; mỗi ý hai đến bốn khung (việc cần làm, vì sao, cách làm sai nếu bài có); một đến hai khung ghi nhớ, khung cuối kết bằng một câu.

- Tiêu đề `## Line N — <tên> (Frame N)`; lời đọc thụt 4 dấu cách. Tên tệp khung sinh từ tiêu đề, nên các tiêu đề phải khác nhau.
- Mỗi câu trọn ý, không quá khoảng 20 âm tiết. **Mỗi thay đổi trên hình cần một cụm từ riêng trong lời đọc để neo mốc.** Cụm lặp lại trong cùng khung thì lấy mốc bằng `{ nth: 2 }`.
- Soát từng dòng Chốt, từng danh sách đánh số và từng con số với bản chép ở bước 1.
- `node scripts/scan-words.mjs` phải ra `clean`.

### 4. Giọng đọc và mốc lời đọc

Sửa `lines` của `.hyperframes/tts_request.json` (mỗi khung một mục, giọng Leda). Tạo giọng theo `vi-explainer-video/references/audio.md` §1–§3 và `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/references/series.md` §4 (giới hạn yêu cầu mỗi phút, chạy bù, danh sách "whisper nghe khác kịch bản"). Rồi:

```bash
(cd "$P" && node scripts/build-cues.mjs)               # ghi assets/lib/world/cues.js
```

Chạy lại `build-cues.mjs` sau mọi thay đổi về giọng. Mọi mốc phía sau đọc từ `cues.js`. Log của Gemini luôn đi qua `sed -E 's/(AIza|key=)[A-Za-z0-9_-]+/\1***/g'`.

### 5. Bắt đầu nhạc nền

Sửa prompt trong `.hyperframes/bgm_request.json`, rồi chạy sau khi giọng đã chốt:

```bash
(cd "$P" && node "$ENGINE" --request ./.hyperframes/bgm_request.json --hyperframes . --out ./audio_engine_meta.json --only bgm 2>&1 | sed -E 's/(AIza|key=)[A-Za-z0-9_-]+/\1***/g')
```

Nhạc chạy nền vài phút; trong lúc đó làm bước 6.

### 6. Chuyến xe và cảnh 3D

Ba tệp riêng của bài trong `assets/lib/world/`. API và hợp đồng giữa chúng ở `references/world.md`.

| Tệp | Việc |
|---|---|
| `beats.js` | `buildBeats(K)`: mọi mốc mà hình phản ứng, đặt tên theo khung (`B.f5.sw`), và các điểm cắt cảnh `B.cut`. Lớp 3D và lớp chữ cùng đọc tệp này |
| `drive.js` | `buildDrive(CUES, B)`: chuyến xe là hàm thuần của thời gian. Bảng cảnh quay `SHOTS`, đường tốc độ, lúc tấp vào lề, đèn nào bật lúc nào, thời tiết, xe khác. Không three.js, không DOM |
| `world.js` | `createWorld({ canvas, fx })`: đạo diễn trên `createRoad()`: dựng xe, đặt máy quay theo kiểu cảnh, nhãn bám theo vật, số liệu cho bảng đồng hồ |

Sau mỗi lần sửa, chụp vài mốc để xem ngay, không chờ lắp ráp xong:

```bash
(cd "$P" && bash scripts/snap.sh try "12.5,40.1,128.3")
```

Lỗi `cue not found: frame N "…"` nghĩa là cụm từ không có trong lời đọc của khung đó: sửa cụm cho khớp chữ trong `SCRIPT.md`.

### 7. Lớp chữ và storyboard

- `scripts/build-frames.mjs`: một hàm cho mỗi khung, trả về `frame(n, body, js)`; cuối tệp `writeFrames([f1, f2, …])`. Chữ trên thẻ là lời đọc rút gọn, không thêm ý. Cách dùng các khối ở `references/frames.md`.
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

Tên SFX phải có trong `$HF/media-use/audio/assets/sfx/`; tên sai bị bỏ qua không báo. Đếm số SFX mà `lock-audio.mjs` in ra.

### 9. Lắp ráp và kiểm

```bash
(cd "$P" && HF="$HF" bash scripts/assemble.sh --captions)
(cd "$P" && node scripts/scan-words.mjs)               # clean; lần này quét cả khung, phụ đề và nhãn 3D
(cd "$P" && node "$SK"/scripts/mix-balance.mjs)        # mục tiêu: nhạc dưới giọng 12 dB
(cd "$P" && hyperframes lint)                          # 0 error
(cd "$P" && npm run check)                             # "Check passed"; mất vài phút
(cd "$P" && bash scripts/snap.sh mid  "$(node scripts/frame-times.mjs mid)")
(cd "$P" && bash scripts/snap.sh late "$(node scripts/frame-times.mjs late)")
```

- `assemble.sh` sinh lại khung, chạy `check-frames.sh`, dựng phụ đề, lắp `index.html`, gắn lớp 3D và đặt thời lượng cho `world.html` (`patch-index.mjs`), chèn chuyển cảnh. Dòng `bgm (track 11)` phải là `yes`.
- **Đọc từng contact sheet**, rồi chụp thêm theo `references/qa.md` §2: mỗi kiểu cảnh quay một ảnh, mỗi lần cảnh đổi trạng thái một ảnh trước và một ảnh sau, mỗi nhãn 3D lúc nó hiện.
- Sửa ở tệp nguồn, không sửa tệp khung đã sinh, rồi `assemble.sh` lại.
- Kết quả đã biết là báo nhầm: xem `references/qa.md` §3.

### 10. Render, đo, báo cáo

```bash
(cd "$P" && hyperframes render --skill=faceless-explainer --quality high --output renders/video.mp4)   # chạy nền
```

Đo và so ảnh trích từ MP4 với ảnh chụp theo `vi-explainer-video/SKILL.md` bước 10 (ffprobe, LUFS −14 đến −16, true peak ≤ −1 dBFS, `blackdetect` 0). Bản gửi qua kênh có giới hạn dung lượng: `references/qa.md` §5.

Báo cáo theo `references/qa.md` §6. Ngoài sáu mục của `vi-explainer-video`, video chương này có thêm:

- **Phạm vi:** video gồm ý nào của bài, ý nào để lại.
- **Đối chiếu brief:** từng dòng Chốt, danh sách và con số đã giữ thế nào; điều gì hình vẽ ra mà bài không nói (phải là không có); chỗ brief thiếu hay chưa chắc.
- **"Vì sao" chưa có giáo viên duyệt.**
- **Tài sản:** dùng lại gì, tạo mới gì.
- **Agent không nghe được âm thanh và không xem được chuyển động.**

### Sau khi xong

1. Thêm một dòng vào bảng "Đã làm" của `references/series.md` §6 và cập nhật cột trạng thái ở §4.
2. Thứ mới dựng mà bài khác cũng dùng được (dốc, làn thứ hai, mô hình mới, icon mới) thì chuyển từ `world.js` hay `build-frames.mjs` của dự án về `kit/` của skill, rồi kiểm rằng ví dụ Bài 5 vẫn ra ảnh giống hệt (`references/qa.md` §4).
3. Người dùng đã duyệt video có bối cảnh khác hẳn (ban ngày, ca-bin, mô tô) thì chép phần riêng của nó thành một thư mục mới trong `examples/`: `BRIEF.md`, `SCRIPT.md`, hai tệp request, `beats.js`, `drive.js`, `world.js`, `build-frames.mjs`, `build-storyboard.mjs`. Không kèm `assets/voice`, `assets/bgm`, `assets/sfx`, `renders`, `snapshots`, `audio_*.json`, `cues.js`.

## Tham khảo

| Tệp | Khi nào đọc |
|---|---|
| `references/series.md` | **Trước tiên:** luật nội dung, khuôn kịch bản, ngân sách thời lượng, bảng 11 bài, bài nào cần dựng gì, bảng "Đã làm" |
| `references/world.md` | Bước 6: hệ toạ độ, `beats`, `drive`, `createRoad`, bảng đồng hồ, cách thêm thứ mới vào sân khấu |
| `references/frames.md` | Bước 7: bố cục cột chữ, các khối, các hàm chuyển động, storyboard |
| `references/qa.md` | Bước 9–10: phép kiểm, báo nhầm đã biết, lỗi đã gặp, kiểm sau khi sửa `kit/`, mẫu báo cáo |
| `.claude/skills/vi-explainer-video/` | Cài đặt, giọng, nhạc, phụ đề, render, `references/pitfalls.md` |
| `.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/references/world.md` | `path.js`, `stage.js`, `models.js` (engine dùng chung) |
| `.claude/skills/my-designer-3d/SKILL.md` | Dựng mô hình 3D mới bằng `bin/dsa` |
