---
name: vi-explainer-video
description: "Dựng video giải thích (faceless explainer) tiếng Việt 1920×1080 từ một đoạn văn bản chuẩn bị sẵn: giọng đọc Gemini (mặc định Orus), phụ đề đúng chữ kịch bản, nhạc nền Lyria, SFX và hình động, bằng HyperFrames faceless-explainer. Dùng khi người dùng nói: 'tạo video giải thích từ text', 'làm video từ nội dung này', 'video tiếng Việt', 'explainer video tiếng Việt', 'dựng video như lần trước'."
---

# Video giải thích tiếng Việt

Skill này là **lớp tiếng Việt** đặt lên quy trình `faceless-explainer` của HyperFrames. Faceless lo phần kể chuyện, thiết kế hình, dựng khung và lắp ráp. Skill này bổ sung những gì faceless không làm đúng cho tiếng Việt:

- font có dấu;
- giọng đọc Gemini;
- phụ đề đúng chữ;
- cách tránh các lỗi đã gặp (`references/pitfalls.md`).

Skill không kèm script nào. Mọi bước là lệnh của HyperFrames, hoặc thao tác mà agent tự làm theo hướng dẫn dưới đây.

## Đường dẫn dùng trong tài liệu

```bash
SK=<thư mục chứa SKILL.md này>              # trong repo my-designer: .claude/skills/vi-explainer-video
HF=~/.claude/skills                          # nơi `hyperframes skills` cài bộ skill HyperFrames
FX=$HF/faceless-explainer/scripts
ENGINE=$HF/media-use/audio/scripts/audio.mjs
```

Mỗi lệnh Bash chạy trong một shell mới, nên hãy khai báo lại các biến cần dùng ngay trong cùng lệnh.

## Bước 0: kiểm tra máy

```bash
npx -y hyperframes --version && ls ~/.claude/skills/faceless-explainer/scripts/audio.mjs ~/.claude/skills/media-use/audio/scripts/audio.mjs
```

Nếu lệnh lỗi hoặc thiếu tệp, làm theo `references/install.md` rồi quay lại. Nếu chưa có `GEMINI_API_KEY`, cũng xem mục khoá API trong tệp đó.

## Nguyên tắc cố định

1. **Kịch bản được viết lại cho dễ nghe**, như faceless Step 3: được sắp xếp lại và rút gọn, nhưng giữ đúng ý và thuật ngữ của văn bản gốc. Câu ngắn, mỗi khung khoảng 6–13 giây lời đọc.
2. **Thời lượng luôn lấy từ âm thanh thật.** Không sửa tay `- duration:`. Muốn khung dừng lâu hơn thì thêm khoảng lặng vào tệp giọng đọc (`references/audio.md` §3).
3. **SFX chỉ dùng tên có sẵn**, mỗi SFX phải có `- sfx_at:`.
4. **Không đưa lên hình hay vào lời đọc**: dữ liệu cá nhân, token, khoá bí mật, đường dẫn máy riêng.
5. **Khoá API không bao giờ được in ra**, không ghi vào dự án, không ghi vào `.env`, không đưa vào tệp request, không commit.
6. **Chạy tự động** (`mode: autonomous`): chỉ thông báo kế hoạch rồi đi tiếp, không dừng ở các checkpoint của faceless. Chỉ dừng khi người dùng yêu cầu duyệt.
7. **Agent không nghe được âm thanh và không xem được chuyển động.** Agent chỉ kiểm được ảnh chụp, bản whisper nghe lại và số đo ffmpeg. Báo cáo cuối phải nói rõ điều này.

## Quy trình

### 1. Khởi tạo dự án video

Đặt dự án video **ngoài repo này**, trừ khi người dùng chỉ định nơi khác. Mặc định là `~/workspace/videos/<ten-du-an>`.

```bash
cd ~/workspace/videos && npx -y hyperframes init <ten-du-an> --non-interactive --example=blank --skill=faceless-explainer
mkdir -p <ten-du-an>/assets/fonts && cp "$SK"/assets/fonts/*.woff2 <ten-du-an>/assets/fonts/
```

Viết `BRIEF.md` theo `references/brief-template.md`. Chọn giọng ở dòng `voice:` (mặc định `Orus`, xem `references/voices.md`).

### 2. Hệ thiết kế và font tiếng Việt (faceless Step 2)

```bash
node "$FX"/build-frame.mjs --preset code-editorial --hyperframes .
```

Sau đó **nối block font tiếng Việt** trong `references/fonts.md` vào cuối `frame.md`. Font của preset chỉ có chữ Latin, thiếu dấu tiếng Việt. Preset `code-editorial` (nền kem, serif) đã được dùng thành công. Có thể chọn preset khác theo faceless Step 2, rồi làm font theo `references/fonts.md`.

### 3. Kịch bản: SCRIPT.md (faceless Step 3)

Làm theo faceless Step 3 (đọc `story-design.md`) để lên kế hoạch khung và viết lời đọc. Định dạng SCRIPT.md phải đúng như faceless đọc:

```markdown
## Line 1 — Model chỉ biết một việc (Frame 1)

**Delivery:** chậm, nhấn "một việc"

    Một model AI chỉ làm được đúng một việc: nhận tin nhắn, trả tin nhắn.
```

- Tiêu đề chứa `(Frame N)`.
- Dòng lời đọc thụt lề 4 dấu cách.
- Dòng bắt đầu bằng `**` là ghi chú, không được đọc.

Viết cho tai nghe:
- Câu ngắn.
- Thuật ngữ tiếng Anh giữ nguyên.
- Tránh ký hiệu khó đọc (`/`, `→`, `#`). Hãy viết thành chữ.

### 4. Giọng đọc Gemini

Làm theo `references/audio.md` §1–§3:
1. Tạo giọng đọc vào tệp phụ `audio_engine_meta.json`.
2. Sửa chữ phụ đề cho khớp kịch bản.
3. Thêm khoảng lặng cuối.
4. Xem danh sách "whisper nghe khác kịch bản" để phát hiện chỗ đọc sai.

Mốc thời gian từng từ dùng để viết Scene ở bước 6 nằm ở `voices[].words` trong `audio_engine_meta.json`.

### 5. Bắt đầu nhạc nền

Làm theo `references/audio.md` §4, **sau** khi độ dài lời đọc đã chốt. Lyria tạo nhạc dài đúng bằng tổng lời đọc, chạy nền khoảng một đến vài phút.

### 6. STORYBOARD.md (faceless Step 3 + Step 4)

Đọc các tài liệu faceless Step 3–4 chỉ định:
- `story-design.md`
- `visual-design.md`
- `motion-language.md`
- `blueprints-index.md`
- `rules-index.md`
- `storyboard-format.md`

Rồi viết **một** STORYBOARD.md theo `references/storyboard-rules.md`. Trước khi đi tiếp, tự kiểm đủ các điểm sau:

- Số `## Frame N` bằng số `(Frame N)` trong SCRIPT.md.
- `- voiceover:` là bản sao chính xác lời đọc của khung đó.
- `- src:` có dạng `compositions/frames/NN-slug-ascii.html`.
- Có `- status: outline`, `- transition_in:` và `- sfx:`.
- Mỗi khung có SFX thì có `- sfx_at:`.
- Có block `## Video direction` đặt trước `## Frame 1`.
- Mỗi dòng Scene ghi mốc giây thật lấy từ `words`.
- Tên rule trong backtick tối đa khoảng 1 tên mỗi khung.

### 7. Chốt âm thanh

Làm theo `references/audio.md` §5, theo thứ tự:
1. Chờ nhạc nền xong.
2. Chạy `fetch-sfx`.
3. Sửa `offset_s` và âm lượng trong `audio_meta.json`.
4. Chạy `sync-durations`.
5. Cập nhật `duration:` ở frontmatter bằng tổng các khung.

### 8. Dựng từng khung (faceless Step 5, worker song song)

```bash
node "$FX"/frame-packets.mjs --project . --storyboard ./STORYBOARD.md
```

- **Packet vượt 48 KB:** bỏ bớt tên rule trong backtick ở các dòng Scene của khung đó, thay bằng mô tả chuyển động bằng lời, rồi chạy lại lệnh.
- **Tách Video direction:** chép block `## Video direction` (đến trước `## Frame 1`) vào `.hyperframes/frame-packets/_video-direction.md`. Packet không chứa block này.
- **Giao việc:** mỗi khung giao cho một Agent chạy nền (`general-purpose`). Prompt là mẫu trong `references/worker-prompt.md`, đã điền các chỗ trống. Gửi tất cả trong **một** tin nhắn để chúng chạy song song.

Khi mọi worker xong, kiểm từng tệp khung:

```bash
grep -L '^<template' compositions/frames/*.html                                  # phải rỗng
grep -l '<audio\|Math\.random\|Date\.now\|yoyo\|@keyframes\|repeat: *-\?[0-9]' compositions/frames/*.html   # phải rỗng
grep -L 'assets/fonts/[A-Za-z]*-VN\.woff2' compositions/frames/*.html            # phải rỗng
grep -l "\.\./assets\|querySelector[A-Za-z]*(['\"\`]#[0-9]" compositions/frames/*.html   # phải rỗng
```

- **Có `../assets`:** sửa thành `assets/…`. Đường dẫn tính từ gốc dự án.
- **Lỗi khác:** giao lại khung đó cho một worker mới, kèm thông báo lỗi.
- **Đạt:** đổi `- status: outline` thành `- status: animated`.

### 9. Lắp ráp và QA (faceless Step 6)

Lắp ráp:

```bash
node "$FX"/captions.mjs build --storyboard ./STORYBOARD.md --audio-meta ./audio_meta.json --hyperframes . --out ./caption_groups.json
node "$FX"/assemble-index.mjs --storyboard ./STORYBOARD.md --hyperframes .
node "$FX"/transitions.mjs inject --storyboard ./STORYBOARD.md --hyperframes .
node "$FX"/transitions.mjs verify --storyboard ./STORYBOARD.md --index ./index.html
```

Dòng `bgm (track 11)` của `assemble-index` phải là `yes`. Nếu là `no`, nhạc nền chưa được lắp.

Kiểm tra:

```bash
npx hyperframes lint                     # phải 0 error
npx hyperframes check                    # phải "Check passed"
npx hyperframes snapshot --at <giữa mỗi khung, cách nhau dấu phẩy> --describe false
npx hyperframes snapshot --at <cuối mỗi khung − 0.35s> --no-end --describe false -o snapshots/late
```

Kết quả lệnh snapshot là các tệp `contact-sheet-1..N.jpg`. **Đọc (Read) từng contact sheet** và kiểm:
- dấu tiếng Việt có bị cắt không;
- chữ có tràn khỏi thẻ không;
- có gì lấn vào vùng phụ đề (y > 896) không;
- có khung trống hoặc đen không;
- màu coral chỉ xuất hiện một lần mỗi khung.

Cách xử lý kết quả của `check`:
- **Cảnh báo phụ đề lệch 1–4px** (`caption-word`, `caption-line`): bỏ qua.
- **Cảnh báo tương phản trong khoảng ±0.9 s quanh điểm chuyển cảnh:** thường là báo nhầm do crossfade. Vẫn phải nhìn ảnh để xác nhận.
- **Cảnh báo tương phản ở thời điểm khác:** là lỗi thật. Tăng alpha của chữ lên ≥ 0.72 trên nền kem.

Sửa tệp khung cụ thể, rồi lắp ráp và kiểm lại. Muốn xem gần một vùng: `npx hyperframes snapshot --at <t> --zoom "x,y,w,h" --zoom-scale 2 -o snapshots/zoom`.

### 10. Render và báo cáo

```bash
npx hyperframes render --skill=faceless-explainer --quality high --output renders/video.mp4
ffprobe -v error -show_entries format=duration,size:stream=codec_type,width,height,r_frame_rate -of json renders/video.mp4
ffmpeg -hide_banner -i renders/video.mp4 -af volumedetect -vn -f null - 2>&1 | grep -E 'mean_volume|max_volume'
```

Video phải có luồng audio và đỉnh âm lượng ≤ −0.5 dB.

Báo cáo cho người dùng:
- **Kết quả:** đường dẫn MP4, độ phân giải, thời lượng, dung lượng, âm lượng trung bình và đỉnh.
- **Giọng đọc:** giọng đã dùng, và những chỗ whisper nghe khác kịch bản.
- **Đã kiểm:** ảnh tĩnh, lint, check, số đo âm thanh.
- **Chưa kiểm:** giọng thật nghe ra sao, chuyển động, độ khớp hình với lời. Mời người dùng tự xem và nghe.
- **Lỗi đã chấp nhận:** những lỗi còn lại mà không sửa.

## Tham khảo

| Tệp | Khi nào đọc |
|---|---|
| `references/install.md` | Máy chưa có HyperFrames, ffmpeg, Node hoặc khoá Gemini |
| `references/voices.md` | Chọn giọng (Orus mặc định; Kore, Aoede, Charon), prompt phong cách, lỗi phát âm đã biết |
| `references/audio.md` | Toàn bộ quy trình âm thanh: TTS, sửa chữ phụ đề, khoảng lặng, nhạc nền, SFX |
| `references/storyboard-rules.md` | Mẫu một khung storyboard và block Video direction |
| `references/worker-prompt.md` | Mẫu prompt giao việc cho worker dựng khung |
| `references/fonts.md` | Block `@font-face` tiếng Việt cho frame.md; làm font cho preset khác |
| `references/brief-template.md` | Mẫu BRIEF.md |
| `references/pitfalls.md` | Các lỗi đã gặp và cách tránh. **Đọc khi có bước báo lỗi.** |
