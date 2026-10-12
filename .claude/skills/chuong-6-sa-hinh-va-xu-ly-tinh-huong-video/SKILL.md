---
name: chuong-6-sa-hinh-va-xu-ly-tinh-huong-video
description: "Sản xuất loạt video giải thích tình huống sa hình (V01–V29) bằng hình động 3D: nhận brief do repo sat-hach-lai-xe soạn, dựng lại nút giao bằng mô hình 3D có sẵn, cho xe chạy đúng thứ tự theo lời đọc, thêm giọng đọc (mặc định Gemini Leda), phụ đề, nhạc rồi render MP4. Dùng khi người dùng nói 'làm video sa hình', 'tạo video V03', 'video câu <số>', 'tạo video theo VIDEO-BRIEF', 'sản xuất video cho sat-hach-lai-xe', hoặc đưa một brief có các tình huống sa hình."
---

# Video sa hình 3D

Skill này đóng gói cách đã làm video thử nghiệm (câu 502, 504, 506) và V02 để làm tiếp loạt video sa hình V01–V29. **Làm một video của loạt thì đọc `references/series.md` trước:** luật nội dung, cấu trúc 17 khung, ngân sách thời lượng, giọng, và danh sách tài sản đã có nằm ở đó. Nó là **lớp sa hình** đặt lên `vi-explainer-video`: skill kia lo cài đặt, font, giọng đọc, nhạc, phụ đề và render; skill này thêm thế giới 3D, lớp chữ sinh từ mốc lời đọc, và các phép kiểm riêng của sa hình.

Đọc `.claude/skills/vi-explainer-video/SKILL.md` trước (bước 0, các nguyên tắc cố định, `references/audio.md`, `references/voices.md`). Skill này không lặp lại những phần đó.

## Hai bên

| Bên | Việc |
|---|---|
| `sat-hach-lai-xe` (repo nội dung) | Chọn tình huống, soạn brief: câu hỏi và kết luận nêu trong video; mô tả hình; giải thích; mẹo nhớ; gợi ý chuyển động; đề và đáp án gốc để đối chiếu |
| `my-designer` (repo này) | Dựng video từ brief, kiểm, render, báo cáo lại; báo chỗ brief không khớp hình hay đáp án |

- Bên soạn brief đọc `VIDEO-HANDOFF.md` ở gốc repo `sat-hach-lai-xe`. Tệp đó nói vai trò của bên này và brief cần có gì. Luật riêng của loạt và danh sách 29 brief nằm ở `video-briefs/README.md` của repo đó.
- Bên này kiểm brief theo `references/brief-contract.md`. Khi đổi điều kiện ở một trong hai tệp, sửa cả tệp kia.

## Trong skill có gì

```
chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/
  SKILL.md
  references/     tài liệu (bảng ở cuối tệp này)
  scripts/        new-project.sh, build-three-bundle.sh, export-models.sh, glbdump.mjs
  kit/            phần dùng chung, chép nguyên vào mỗi dự án
    assets/models/*.glb            12 mô hình 3D
    assets/lib/three-bundle.js     three.js đã đóng gói
    assets/lib/world/              engine: path, stage, models, ground, fx, lens, sitekit, world
    compositions/world.html        lớp 3D của video
    scripts/                       build-cues, audit-motion, frames.kit, frames.ctx, lock-audio,
                                   assemble.sh, patch-index, snap.sh, frame-times, check-frames.sh,
                                   check-watermark.sh, scan-words
  examples/v02-nga-tu-co-bien/     điểm xuất phát mặc định: khuôn của loạt, bốn tình huống, giọng Gemini
    BRIEF.md, SCRIPT.md, .hyperframes/{tts_request,bgm_request}.json
    assets/lib/world/{plan,roads,sites,beats}.js
    scripts/{build-frames,build-storyboard}.mjs
  examples/cau-502-504-506/        khuôn cũ (mở đầu, đọc phương án, đếm ngược, giọng nhân bản);
                                   giữ để lấy ngã ba có đèn tín hiệu và vòng xuyến
```

Skill không chứa tệp giọng, clip mẫu hay profile giọng nào, và không bao giờ được chứa.

## Tái sử dụng được gì

| Mức | Thứ |
|---|---|
| **Dùng nguyên** | 12 mô hình GLB (xe con đỏ, xe con tím, xe tải xanh, xe tải sẫm, xe khách, mô tô, cột đèn tín hiệu, cột biển, cột đèn đường, cây, nón giao thông, trụ chắn); toàn bộ engine trong `kit/`; bộ khung chữ `frames.kit.mjs` và icon; mọi script; hệ thiết kế `glass-keynote`; cách làm giọng, nhạc, phụ đề |
| **Sửa từ ví dụ** | Ba kiểu nút giao đã dựng: ngã tư có biển, viết theo tham số (V02: biển ưu tiên, nhường đường, Dừng lại, biển phụ hướng đường ưu tiên), ngã ba có đèn chính và đèn phụ mũi tên (502), vòng xuyến bốn nhánh không biển (504). Khuôn 17 khung và các hàm thẻ chữ của V02. Tình huống mới cùng kiểu: đổi số đo, vị trí xe, đường đi và mốc lời đọc trong `plan.js`, `roads.js`, `sites.js`, `beats.js`, `build-frames.mjs`, `build-storyboard.mjs` |
| **Tạo mới** | Kiểu nút giao khác, mặt biển báo khác, loại xe hay vật thể chưa có mô hình (xe ưu tiên, người điều khiển giao thông, người đi bộ, xe đạp, đường sắt…). Cách làm ở `references/new-cases.md` |

Cấu hình đã chạy thật: **bốn tình huống một video**, một hàng bốn ô, 17 khung, 6:31 (V02, khuôn của loạt); và ba câu, 14 khung, 4,6 phút (khuôn cũ). Số tình huống khác: xem `references/new-cases.md` §5 trước khi nhận. Danh sách đầy đủ biển, icon, kiểu nút giao đã có: `references/series.md` §6.

## Yêu cầu cố định của video sa hình

Đây là các điểm người dùng đã sửa qua ba vòng nhận xét. Coi là yêu cầu, không phải phần trang trí:

1. **Ban ngày, sáng sủa.** Không cảnh đêm.
2. **Mỗi câu một góc nhìn cố định trên cao, thấy trọn nút giao, khung hình vừa khít.** Camera chỉ lướt một lần khi đổi câu. Không bay, không xoay, không zoom trong lúc giải thích.
3. **Bánh xe quay quanh trục của chính nó.**
4. **Không lúc nào hai xe đè lên nhau.**
5. **Xe rẽ theo cung tròn, giảm tốc trong cua.** Không xoay tại chỗ.
6. **Chi tiết nhỏ (đèn, biển) được phóng to bằng kính lúp đặt ngay trên chi tiết đó**, không phải bằng zoom camera. Trong lúc kính mở, phần còn lại của bản đồ chuyển xám để mắt không bị kéo đi; kính đóng thì màu trở lại.
7. **Mũi tên đường đi phải nổi bật.**
8. **Thứ đang được đọc tên sáng mạnh từng cái một theo nhịp đọc** (tên xe, số thứ tự, tên biển): đổi màu hoặc phát sáng, trên cột chữ và trên bản đồ cùng lúc.
9. **Đúng thứ tự và đúng hướng quan trọng hơn hình đẹp.**

Điểm 3, 4, 5 do `scripts/audit-motion.mjs` và ảnh cắt phóng to kiểm; điểm còn lại kiểm bằng ảnh chụp (`references/qa.md`).

## Nguyên tắc nội dung

- **Video là nội dung đứng riêng.** Không số câu, không "câu", "đáp án", "phương án", không nhắc kỳ thi, sát hạch hay cuốn sách, ở cả hình, lời đọc và phụ đề; không hiện hay đọc các phương án. Đủ luật ở `references/series.md` §1; kiểm bằng `scripts/scan-words.mjs`.
- **Câu hỏi, kết luận, tên biển, mẹo nhớ lấy từ brief.** Mục "Đối chiếu nguồn" (đề, phương án, đáp án gốc) chỉ dùng để soát rằng lời giải thích dẫn tới đúng đáp án.
- **Bố cục giữ đúng hình trong sách:** vị trí, loại xe, biển, đèn, hướng mũi tên. Mô tả trong brief khác ảnh thì tin ảnh, và ghi vào báo cáo.
- **Ảnh trong sách chỉ để tham chiếu.** Không đưa ảnh chụp vào video; mọi thứ vẽ lại bằng 3D.
- **Không tự sửa luật.** Phần giải thích của brief chưa chắc đã được đối chiếu với luật. Thấy chỗ không khớp đáp án hay hình thì báo chủ repo, không tự viết lại. Lời đọc chỉ nói điều brief nói; điều gì thêm ngoài brief phải nêu trong báo cáo.
- **Giọng mặc định là Gemini Leda.** Giọng nhân bản chỉ khi người dùng yêu cầu: theo đúng điều khoản ở `vi-explainer-video/references/voices.md`. Video phi thương mại; chủ giọng duyệt kịch bản trước khi tạo và duyệt bản ghép trước khi đăng.

## Đường dẫn

```bash
ROOT=$(git rev-parse --show-toplevel)
K=$ROOT/.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video
SK=$ROOT/.claude/skills/vi-explainer-video
HF=<thư mục có faceless-explainer; new-project.sh in ra ở dòng "HF:">
FX=$HF/faceless-explainer/scripts
ENGINE=$HF/media-use/audio/scripts/audio.mjs
P=$ROOT/videos/<ten-du-an>
```

Mỗi lệnh Bash là một shell mới: khai báo lại biến trong cùng lệnh. Không `cd` trần sang thư mục khác; dùng đường dẫn tuyệt đối hoặc `(cd "$P" && …)`. Lệnh CLI viết `hyperframes …`; máy không có lệnh đó thì thay bằng `npx -y hyperframes …`.

## Quy trình

### 1. Đọc brief và đối chiếu

Đọc brief và **mở từng ảnh cắt** của các câu được chọn (Read tệp ảnh). Với mỗi câu, làm theo `references/brief-contract.md`:

- Đáp án gốc (mục "Đối chiếu nguồn"), hình và phần giải thích có khớp nhau không. Chỗ lệch ghi lại để báo, không tự sửa.
- Tình huống thuộc kiểu nút giao nào trong các kiểu đã có (`references/series.md` §6), hay là kiểu mới.
- Cần xe, biển, đèn nào; cái nào đã có mô hình, cái nào phải tạo.

Brief thiếu thứ không suy ra được từ ảnh (đáp án gốc, tình huống nào làm) thì hỏi người dùng một lần. Thiếu giọng thì dùng Leda. Thứ khác thì chọn mặc định hợp lý, ghi vào báo cáo, rồi làm tiếp.

### 2. Tạo dự án

```bash
bash .claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/scripts/new-project.sh chuong-6-v<NN> --example v02-nga-tu-co-bien
```

Lệnh tạo `videos/<ten-du-an>` (HyperFrames trống, font tiếng Việt, `glass-keynote`), chép `kit/` và phần riêng của ví dụ vào. Ghi lại dòng `HF:` nó in ra. `videos/` nằm trong `.gitignore`; không `git add -f` gì ở đó.

Bỏ `--example` khi muốn bắt đầu chỉ với engine. Dự án khi đó chưa chạy được cho tới khi có đủ `plan.js`, `roads.js`, `sites.js`, `beats.js`, `build-frames.mjs`, `build-storyboard.mjs`.

### 3. BRIEF.md và SCRIPT.md

Sửa `BRIEF.md` của ví dụ cho video mới (thông điệp, khán giả, độ dài, `voice: Leda` hoặc `voice: clone:<tên profile>`).

Viết `SCRIPT.md` theo khuôn của loạt: **bốn khung mỗi tình huống, rồi một khung tổng kết; không mở đầu** (`references/series.md` §2).

| Khung của một tình huống | Nội dung | Ghi chú |
|---|---|---|
| Tình huống | "Tình huống N.", tả các xe, rồi câu hỏi của brief | Khoảng lặng ngắn ở cuối để người xem tự nghĩ; không đếm ngược |
| Quy tắc | Nhìn gì trong hình (đèn, biển, hay không có gì) và quy tắc áp dụng | Kính lúp mở ở đây |
| Xe chạy | Xe đi lần lượt, mỗi câu lời một xe hay một hướng | Nhiều chuyển động nhất |
| Chốt | Kết luận của brief, rồi mẹo nhớ | |

- Tiêu đề `## Line N — <tên> (Frame N)`; lời đọc thụt 4 dấu cách. **Tên tệp khung sinh từ tiêu đề** ("Tình huống 3: biển Dừng lại" thành `09-tinh-huong-3-bien-dung-lai.html`), nên tiêu đề phải khác nhau.
- Mỗi câu lời trọn ý, không quá khoảng 20 âm tiết. Mỗi chuyển động trên hình cần một cụm từ riêng trong lời đọc để neo mốc ("Xe tải đi.", "Đến xe khách."). Tránh lặp nguyên một cụm trong cùng khung; nếu phải lặp, mốc lấy bằng `nth`.
- **Đếm âm tiết trước khi tạo giọng** (`references/series.md` §3): V02 có 1041 âm tiết và dài 6:31; 5 phút là khoảng 800. Vượt thì báo người dùng, không tự cắt lý do.
- Chạy `node scripts/scan-words.mjs` khi viết xong: phải ra `clean`.

### 4. Giọng đọc và mốc lời đọc

**Giọng Gemini (mặc định):** sửa `lines` của `.hyperframes/tts_request.json` (mỗi khung một mục), tạo giọng theo `vi-explainer-video/references/audio.md` §1–§3 và `references/series.md` §4 (giới hạn 10 yêu cầu mỗi phút, cách chạy bù, danh sách whisper nghe khác), rồi `node scripts/build-cues.mjs`. Bỏ `check-watermark.sh`.

**Giọng nhân bản:** lấy `clone_request.json` từ ví dụ `cau-502-504-506`, sửa theo `vi-explainer-video/references/audio.md` §1b. Điền `profile` bằng tên do `clone-voice.mjs --profiles` in ra. App VoiceStudio phải đang mở.

```bash
(cd "$P" && node "$SK"/scripts/clone-voice.mjs --profiles)
(cd "$P" && node "$SK"/scripts/clone-voice.mjs)        # chạy nền, đọc log; mỗi câu là một lần tạo
(cd "$P" && bash scripts/check-watermark.sh)           # mọi tệp giọng phải có dấu giọng tổng hợp
(cd "$P" && node scripts/build-cues.mjs)               # ghi assets/lib/world/cues.js
```

- **Số đọc thành chữ** trong `say`: "Câu 502." thành "Câu năm trăm lẻ hai."; "hướng 2, 3, 4" thành "hướng hai, ba, bốn"; "xe con B" thành "xe con, bê".
- **Đọc log từng đoạn có số.** Script chấm điểm bằng whisper, mà whisper viết số thành chữ số, nên lần tạo bị chọn có thể là lần đọc sai. Thấy whisper nghe ra số khác thì tạo lại và ghim `"seed"`, `"cfg"` của lần nghe đúng (`references/qa.md` §5).
- Khoảng lặng chỉnh bằng `gap_s`, `tail_s` rồi chạy lại; các lần tạo cũ được dùng lại.
- **Chạy lại `build-cues.mjs` sau mọi thay đổi về giọng.** Mọi mốc thời gian phía sau đọc từ `cues.js`.
- `check-watermark.sh` báo thiếu dấu thì dừng và báo người dùng.

### 5. Bắt đầu nhạc nền

Sửa prompt trong `.hyperframes/bgm_request.json` nếu cần, rồi chạy sau khi giọng đã chốt (nhạc dài bằng tổng lời đọc):

```bash
(cd "$P" && node "$ENGINE" --request ./.hyperframes/bgm_request.json --hyperframes . --out ./audio_engine_meta.json --only bgm 2>&1 | sed -E 's/(AIza|key=)[A-Za-z0-9_-]+/\1***/g')
```

Nhạc chạy nền vài phút; trong lúc đó làm bước 6.

### 6. Thế giới 3D

Sửa bốn tệp riêng của video trong `assets/lib/world/`. Chi tiết API ở `references/world.md`; công thức từng kiểu nút giao ở `references/new-cases.md`.

| Tệp | Việc |
|---|---|
| `plan.js` | Số đo từng nút giao, đường đi của từng xe, xe nào chạy lúc nào (theo cụm từ trong lời đọc), góc nhìn `VIEWS`, các cảnh `shots`, cỡ và độ phóng của kính lúp `GLASS` |
| `roads.js` | Vẽ mặt đường từng ô (`PAINT`) và hàm "điểm này có nằm trên đường không" (`ROAD`) |
| `beats.js` | Các mốc mà hình phản ứng: lúc nhắc tên xe, lúc nêu tên biển, lúc nêu quy tắc. Lớp 3D và lớp chữ cùng đọc tệp này |
| `sites.js` | Dựng từng ô: mặt đất, cây, xe, mũi tên, nhãn, đèn, biển, kính lúp; hàm `update(t)` tô sáng theo `beats` |

Sau mỗi lần sửa `plan.js`:

```bash
(cd "$P" && node scripts/audit-motion.mjs)             # thêm --verbose để xem từng xe
```

Phải ra `OK: no overlap, no sharp turn, nothing left moving off camera`. Lỗi `cue not found: frame N "…"` nghĩa là cụm từ không có trong lời đọc của khung đó: sửa cụm cho khớp chữ trong `SCRIPT.md`.

### 7. Lớp chữ và storyboard

Sửa hai tệp sinh:

- `scripts/build-frames.mjs`: nội dung cột chữ của từng khung (câu hỏi, thẻ xe, thẻ biển và quy tắc, danh sách thứ tự, kết luận và mẹo nhớ, dòng tổng kết). Cách dùng bộ khung ở `references/frames.md`.
- `scripts/build-storyboard.mjs`: một dòng `scene`, các pha `sc`, và SFX của từng khung; tiêu đề, nhạc và block Video direction.

```bash
(cd "$P" && node scripts/build-storyboard.mjs)         # STORYBOARD.md từ SCRIPT.md và mốc thật
```

Khung không giao cho worker: mọi tệp khung do `build-frames.mjs` sinh ra (bước 9 gọi nó), nên chữ và hình luôn rơi cùng một mốc.

### 8. Chốt âm thanh

```bash
(cd "$P" && node "$HF"/media-use/audio/scripts/wait-bgm.mjs --audio-meta ./audio_engine_meta.json --hyperframes . --timeout-ms 300000 --out ./.hyperframes/bgm_status.json)   # phải "ready"
(cd "$P" && node "$FX"/audio.mjs fetch-sfx --storyboard ./STORYBOARD.md --hyperframes .)
(cd "$P" && node scripts/lock-audio.mjs)               # SFX về đúng sfx_at, âm lượng 0.22; nhạc 0.3 lần đầu
(cd "$P" && node "$FX"/audio.mjs sync-durations --audio-meta ./audio_meta.json --storyboard ./STORYBOARD.md)
```

Tên SFX trong `build-storyboard.mjs` phải có trong `$HF/media-use/audio/assets/sfx/`; tên sai bị bỏ qua không báo. Đếm số SFX mà `lock-audio.mjs` in ra.

### 9. Lắp ráp và kiểm

```bash
(cd "$P" && HF="$HF" bash scripts/assemble.sh --captions)
(cd "$P" && node "$SK"/scripts/mix-balance.mjs)        # mục tiêu: nhạc dưới giọng 12 dB
(cd "$P" && hyperframes lint)                          # 0 error
(cd "$P" && hyperframes check)                         # "Check passed"; chạy nền, mất vài phút
(cd "$P" && bash scripts/snap.sh mid  "$(node scripts/frame-times.mjs mid)")
(cd "$P" && bash scripts/snap.sh late "$(node scripts/frame-times.mjs late)")
```

- `assemble.sh` sinh lại khung, chạy `check-frames.sh`, dựng phụ đề (`--captions`), lắp `index.html`, gắn lại lớp 3D (`patch-index.mjs`) và chèn chuyển cảnh. Dòng `bgm (track 11)` phải là `yes`. Bỏ `--captions` khi chỉ sửa hình.
- `mix-balance` gợi ý `bgm.volume` khác quá 2 dB so với mục tiêu: `node scripts/lock-audio.mjs --bgm <giá trị>` rồi `assemble.sh` lại. Video đầu dùng 0.6; V02 dùng 0.3 (nhạc dưới giọng 11,9 dB).
- `node scripts/scan-words.mjs` lần nữa: lần này quét cả chữ trên khung và phụ đề.
- **Đọc từng contact sheet** trong `snapshots/mid` và `snapshots/late`, rồi chụp thêm theo `references/qa.md`: lúc xe đang chạy, từng kính lúp ở độ phân giải đầy đủ, bánh xe lúc đang rẽ, quanh mỗi lần camera đổi câu.
- Sửa ở tệp nguồn (`plan.js`, `sites.js`, `build-frames.mjs`…), không sửa tệp khung đã sinh, rồi `assemble.sh` lại.

### 10. Render, đo, báo cáo

```bash
(cd "$P" && hyperframes render --skill=faceless-explainer --quality high --output renders/video.mp4)   # chạy nền; khoảng 10 phút cho 6,5 phút video
```

Đo và so ảnh MP4 với ảnh chụp theo `vi-explainer-video/SKILL.md` bước 10 (ffprobe, LUFS −14 đến −16, true peak ≤ −1 dBFS, `blackdetect` 0, ảnh trích từ MP4).

Báo cáo theo `references/qa.md` §7. Ngoài sáu mục của `vi-explainer-video`, video sa hình có thêm:

- **Đối chiếu brief:** chỗ brief khác hình, khác đáp án, hay thiếu lý do; điều gì lời đọc nói thêm ngoài brief. Phần này để người dùng chuyển cho bên `sat-hach-lai-xe`.
- **Tài sản:** dùng lại gì, tạo mới gì.
- **Thời lượng so với mục tiêu:** dài hơn mục tiêu của brief thì nói rõ bao nhiêu và nêu các cách rút để người dùng chọn.

### Sau khi xong

Làm theo danh sách ở cuối `references/series.md` §7 và thêm một dòng vào bảng "Đã làm" (§8) của tệp đó. Sửa lỗi của engine trong dự án rồi thấy đúng cho mọi video thì chép tệp đó về `kit/` của skill. Video có kiểu nút giao mới và người dùng đã duyệt thì chép phần riêng của nó thành một thư mục mới trong `examples/` (không kèm `assets/voice`, `assets/bgm`, `renders`, `snapshots`, `audio_*.json`, `cues.js`), và thay tên profile giọng bằng `<tên profile>`.

## Tham khảo

| Tệp | Khi nào đọc |
|---|---|
| `references/series.md` | **Trước tiên, với mọi video của loạt:** luật nội dung, khuôn 17 khung, ngân sách thời lượng, giọng Gemini, kính lúp, tài sản đã có, việc sau mỗi video |
| `references/brief-contract.md` | Bước 1: brief phải có gì, đối chiếu thế nào, thiếu thì làm gì |
| `references/world.md` | Bước 6: hệ toạ độ, camera, API của engine, hợp đồng giữa `plan`, `beats`, `sites` |
| `references/new-cases.md` | Tình huống mới: sửa từ kiểu có sẵn; nút giao, biển, xe, mô hình mới; số tình huống khác bốn |
| `references/frames.md` | Bước 7: bộ khung chữ, bố cục, luật của tệp khung |
| `references/qa.md` | Bước 9–10: các phép kiểm, lỗi đã gặp và cách tránh, mẫu báo cáo |
| `.claude/skills/vi-explainer-video/` | Cài đặt, giọng, nhạc, phụ đề, render, `references/pitfalls.md` |
| `.claude/skills/my-designer-3d/SKILL.md` | Dựng mô hình 3D mới bằng `bin/dsa` |
