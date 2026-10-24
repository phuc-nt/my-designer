---
name: vi-explainer-video
description: "Dựng video giải thích (faceless explainer) tiếng Việt 1920×1080 từ một đoạn văn bản chuẩn bị sẵn: giọng đọc Gemini (mặc định Leda) hoặc giọng nhân bản chạy trên máy (VoiceStudio), phụ đề đúng chữ kịch bản, nhạc nền Lyria, SFX và hình động, bằng HyperFrames faceless-explainer. Dùng khi người dùng nói: 'tạo video giải thích từ text', 'làm video từ nội dung này', 'video tiếng Việt', 'explainer video tiếng Việt', 'dựng video như lần trước', 'dùng giọng của tôi cho video', 'đổi giọng đọc của video'."
---

# Video giải thích tiếng Việt

Skill này là **lớp tiếng Việt** đặt lên quy trình `faceless-explainer` của HyperFrames. Faceless lo phần kể chuyện, thiết kế hình, dựng khung và lắp ráp. Skill này bổ sung những gì faceless không làm đúng cho tiếng Việt:

- font có dấu;
- giọng đọc: Gemini, hoặc giọng nhân bản chạy trên máy (VoiceStudio);
- phụ đề đúng chữ;
- cách tránh các lỗi đã gặp (`references/pitfalls.md`).

Phần lớn các bước là lệnh của HyperFrames, hoặc thao tác mà agent tự làm theo hướng dẫn dưới đây. Skill kèm thêm:

- `scripts/`: tám script Node, chỉ cần Node và ffmpeg, không cần gói npm hay Python.
  - `mix-balance.mjs` đo nhạc nằm dưới giọng đọc bao nhiêu dB, rồi gợi ý `bgm.volume`.
  - `beat-grid.mjs` tìm BPM và nhịp đầu (BEAT0) của bài nhạc.
  - `beat-snap.mjs` kéo điểm cắt khung vào đúng nhịp.
  - `regroup-vi.mjs` gom lại phụ đề theo vế câu tiếng Việt (bước 9).
  - `clone-voice.mjs` tạo giọng đọc bằng giọng nhân bản của VoiceStudio trên máy: từng câu một, tự thử lại khi thiếu chữ, ghi luôn mốc thời gian theo chữ kịch bản (bước 4).
  - `retime-frames.mjs` kéo các khung đã dựng theo giọng đọc mới, khi đổi giọng cho video đã xong (`references/audio.md` §7).
  - `use-scene-template.mjs` chép một scene template thành tệp khung, đặt sẵn tiền tố, id và thời lượng (bước 8).
  - `motion-audit.mjs` đo bản render đứng hình bao nhiêu giây ở từng khung (bước 10).
- `presets/`: ba preset hình cho `build-frame`, đã kèm font tiếng Việt:
  - `glass-keynote`: nền chàm tối, thẻ kính;
  - `comic-multiverse`: truyện tranh, khung viền mực;
  - `win95-pixel`: desktop Windows 95, pixel art, kèm bộ icon pixel và thanh taskbar trong skin phụ đề.
- `scene-templates/`: tám khung dựng sẵn cho các kiểu hay gặp: số lớn, trước và sau, ngộ nhận và sự thật, ba bước, ba mốc thời gian, cột so sánh, chú thích kéo ra từ một vật, danh sách tích dần (`scene-templates/README.md`).

`mix-balance`, `beat-grid`, `beat-snap`, `glass-keynote` và `comic-multiverse` phỏng theo bestagentkits/motion-video-skill (MIT). Năm scene template đầu phỏng theo nutllwhy/hyperframes-motion-library (MIT); ba khung sau viết riêng cho skill này. Ghi công nằm trong từng tệp.

## Hai bản HyperFrames

Skill chạy trên cả hai bản, cùng một quy trình:

| | Bản gốc (npm) | Bản secure (bundle nội bộ) |
|---|---|---|
| CLI | `npx -y hyperframes …` | `hyperframes` đã có trên PATH |
| Bộ skill HyperFrames | `~/.claude/skills`, do `hyperframes skills` cài | `<gốc repo>/.claude/skills` (Claude Code) hoặc `<gốc repo>/.kiro/skills` (Kiro), chép từ `kiro-skills/` của bundle |
| Skill này | `<gốc repo>/.claude/skills/vi-explainer-video` | cùng thư mục với bộ skill HyperFrames |
| Không có | | npm, lệnh `skills`, `browser`, `tts`; mạng chỉ tới Gemini |

Trong tài liệu, mọi lệnh CLI viết là `hyperframes …`. Nếu `command -v hyperframes` không thấy gì, thay `hyperframes` bằng `npx -y hyperframes` (chỉ bản gốc có npm). Không bao giờ dùng `npx` trên bản secure.

## Đường dẫn dùng trong tài liệu

```bash
ROOT=$(git rev-parse --show-toplevel)        # gốc repo đang làm việc (my-designer, hoặc dự án Kiro)
SK=<thư mục chứa SKILL.md này>               # xem bảng trên
HF=<thư mục chứa bộ skill HyperFrames>       # thư mục đầu tiên có faceless-explainer: $ROOT/.kiro/skills, $ROOT/.claude/skills, $HOME/.claude/skills
FX=$HF/faceless-explainer/scripts
ENGINE=$HF/media-use/audio/scripts/audio.mjs
```

Mỗi lệnh Bash chạy trong một shell mới, nên hãy khai báo lại các biến cần dùng ngay trong cùng lệnh.

## Bước 0: kiểm tra máy

```bash
ROOT=$(git rev-parse --show-toplevel)
if command -v hyperframes >/dev/null; then echo "CLI: hyperframes"; hyperframes --version; else echo "CLI: npx -y hyperframes"; npx -y hyperframes --version; fi
HF=; for d in "$ROOT/.kiro/skills" "$ROOT/.claude/skills" "$HOME/.claude/skills"; do [ -d "$d/faceless-explainer" ] && { HF=$d; break; }; done; echo "HF: $HF"
[ -d "$HF/hyperframes-blocks" ] && echo "bản secure: không dùng npx"
ls "$HF"/faceless-explainer/scripts/audio.mjs "$HF"/media-use/audio/scripts/audio.mjs
```

Ghi nhớ dòng `CLI:` và `HF:` vừa in ra, và dùng đúng hai giá trị đó cho mọi lệnh sau. **Viết lệnh CLI trực tiếp** (`hyperframes lint` hoặc `npx -y hyperframes lint`), không cất vào biến rồi gọi `$CLI lint`: zsh không tách chữ trong biến, nên `$CLI` có giá trị `npx -y hyperframes` bị chạy như một lệnh tên là cả chuỗi đó và báo `command not found`. Nếu lệnh lỗi hoặc thiếu tệp, làm theo `references/install.md` rồi quay lại. Nếu chưa có `GEMINI_API_KEY`, cũng xem mục khoá API trong tệp đó. Nếu video dùng giọng nhân bản, kiểm thêm VoiceStudio theo mục 5 của tệp đó.

## Nguyên tắc cố định

1. **Kịch bản được viết lại cho dễ nghe**, như faceless Step 3: được sắp xếp lại và rút gọn, nhưng giữ đúng ý và thuật ngữ của văn bản gốc. Câu ngắn, mỗi khung khoảng 6–13 giây lời đọc.
2. **Thời lượng luôn lấy từ âm thanh thật.** Không sửa tay `- duration:`. Muốn khung dừng lâu hơn thì thêm khoảng lặng vào tệp giọng đọc (`references/audio.md` §3).
3. **SFX chỉ dùng tên có sẵn**, mỗi SFX phải có `- sfx_at:`.
4. **Không đưa lên hình hay vào lời đọc**: dữ liệu cá nhân, token, khoá bí mật, đường dẫn máy riêng.
5. **Giọng nhân bản là giọng của một người thật.** Chỉ tạo trên máy này, không tải giọng hay clip mẫu lên dịch vụ nào, chỉ đọc kịch bản chủ giọng đã đồng ý, không gỡ dấu nhận biết giọng tổng hợp, không dùng cho video thương mại (OmniVoice: CC-BY-NC). Đủ điều khoản ở `references/voices.md`.
6. **Khoá API không bao giờ được in ra**, không ghi vào dự án, không ghi vào `.env`, không đưa vào tệp request, không commit.
7. **Chạy tự động** (`mode: autonomous`): chỉ thông báo kế hoạch rồi đi tiếp, không dừng ở các checkpoint của faceless. Chỉ dừng khi người dùng yêu cầu duyệt.
8. **Agent không nghe được âm thanh và không xem được chuyển động.** Agent chỉ kiểm được ảnh chụp, bản whisper nghe lại và số đo ffmpeg. Báo cáo cuối phải nói rõ điều này.

## Quy trình

### 1. Khởi tạo dự án video

Đặt dự án video trong thư mục `videos/` ở gốc repo đang làm việc, trừ khi người dùng chỉ định nơi khác: `videos/<ten-du-an>`. Thư mục `videos/` phải có trong `.gitignore` (my-designer đã có; ở dự án Kiro, thêm dòng `videos/` nếu chưa có), để dự án, âm thanh và bản render không bao giờ vào git. Không bỏ dòng đó khỏi `.gitignore` và không `git add -f` gì trong `videos/`.

```bash
ROOT=$(git rev-parse --show-toplevel)
mkdir -p "$ROOT/videos" && cd "$ROOT/videos" && hyperframes init <ten-du-an> --non-interactive --example=blank --skill=faceless-explainer
mkdir -p <ten-du-an>/assets/fonts && cp "$SK"/assets/fonts/*.woff2 <ten-du-an>/assets/fonts/
```

Trên bản gốc, `init` cũng tự làm mới bộ skill ở `~/.claude/skills`. Trên bản secure, `init` không tải gì; bộ skill là bản đã chép từ bundle vào `.claude/skills` hoặc `.kiro/skills` của repo.

Từ đây, mọi lệnh trong tài liệu chạy trong `$ROOT/videos/<ten-du-an>`. Bản video cuối nằm ở `videos/<ten-du-an>/renders/video.mp4`.

Viết `BRIEF.md` theo `references/brief-template.md`. Chọn giọng ở dòng `voice:`: mặc định `Leda`; `clone:<tên profile>` khi người dùng yêu cầu giọng nhân bản của họ (xem `references/voices.md`).

### 2. Hệ thiết kế và font tiếng Việt (faceless Step 2)

Chọn một trong hai cách, theo `style:` trong BRIEF.md.

**Preset của faceless** (mặc định `code-editorial`, nền kem, serif, đã dùng thành công):

```bash
node "$FX"/build-frame.mjs --preset code-editorial --hyperframes .
```

Sau đó **nối block font tiếng Việt** trong `references/fonts.md` vào cuối `frame.md`. Font của preset faceless chỉ có chữ Latin, thiếu dấu tiếng Việt. Có thể chọn preset faceless khác theo faceless Step 2, rồi làm font theo `references/fonts.md`.

**Preset của skill này** (`glass-keynote`, `comic-multiverse` hoặc `win95-pixel`):

```bash
node "$FX"/build-frame.mjs --preset glass-keynote --preset-dir "$SK/presets" --hyperframes .
# riêng comic-multiverse: chép thêm hai texture
mkdir -p assets/images && cp "$SK"/presets/comic-multiverse/textures/*.png assets/images/
# riêng win95-pixel: chép bộ icon pixel (skin phụ đề cần shelf, book, user)
mkdir -p assets/images/icons && cp "$SK"/presets/win95-pixel/icons/*.svg assets/images/icons/
```

- Block font tiếng Việt đã có sẵn trong `frame.md` của ba preset này. **Không** nối thêm block trong `fonts.md`.
- `build-frame` cũng chép skin phụ đề riêng của preset vào `.hyperframes/caption-skin.html`.
- Chọn `glass-keynote` cho giọng ra mắt sản phẩm, điềm tĩnh. Chọn `comic-multiverse` cho video ngắn, nhiều năng lượng, hợp với chế độ khớp nhịp bên dưới. Chọn `win95-pixel` cho video giới thiệu sản phẩm hay trang web theo phong cách retro, dựng lại giao diện thật trong các cửa sổ Win95.
- Với `win95-pixel`: đổi chữ trong `#w95-task-label` của `.hyperframes/caption-skin.html` thành tên sản phẩm (tối đa khoảng 16 ký tự). Mặc định là "Giới thiệu". Skin vẽ taskbar ở 56px dưới cùng, và phụ đề nằm ngay trên nó, nên nội dung khung phải ở trên y = 880.

Đọc mục "Renderer limits" trong `frame.md` của preset. `glass-keynote` và `comic-multiverse` dùng nhiều hiệu ứng, và vượt giới hạn đó sẽ ra khung đen. `win95-pixel` ghi các luật ẩn/hiện cửa sổ bằng `visibility` (xem `references/pitfalls.md` mục 35).

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
- Với giọng nhân bản: mỗi câu là một lần tạo, nên viết câu trọn ý, không quá khoảng 20 âm tiết. Số và chữ viết tắt vẫn viết bình thường ở đây; cách đọc ghi trong `say` của request (bước 4).

### 4. Giọng đọc

**Giọng nhân bản** (`voice: clone:<tên profile>`): làm theo `references/audio.md` §1b. Một lệnh `clone-voice.mjs` làm cả bốn việc dưới đây; chạy nền và đọc log. Rồi sang bước 5.

**Giọng Gemini:** làm theo `references/audio.md` §1–§3:
1. Tạo giọng đọc vào tệp phụ `audio_engine_meta.json`.
2. Sửa chữ phụ đề cho khớp kịch bản.
3. Thêm khoảng lặng cuối.
4. Xem danh sách "whisper nghe khác kịch bản" để phát hiện chỗ đọc sai.

Mốc thời gian từng từ dùng để viết Scene ở bước 6 nằm ở `voices[].words` trong `audio_engine_meta.json`.

### 5. Bắt đầu nhạc nền

Làm theo `references/audio.md` §4, **sau** khi độ dài lời đọc đã chốt. Lyria tạo nhạc dài đúng bằng tổng lời đọc, chạy nền khoảng một đến vài phút.

**Chế độ khớp nhịp** (tuỳ chọn, bật bằng `beat_sync: <BPM>` trong BRIEF.md): mọi điểm cắt khung rơi đúng nhịp nhạc. Hợp với video quảng bá hay video ngắn nhiều năng lượng. Với video giải thích điềm tĩnh, không cần bật. Thứ tự các bước nằm ở `references/audio.md` §6:

1. Ở bước 5 này: `beat-snap --reserve` trước, rồi mới tạo nhạc với prompt có BPM.
2. Ở bước 7: `beat-grid` rồi `beat-snap --grid`, **trước** `fetch-sfx`.

### 6. STORYBOARD.md (faceless Step 3 + Step 4)

Đọc các tài liệu faceless Step 3–4 chỉ định:
- `story-design.md`
- `visual-design.md`
- `motion-language.md`
- `blueprints-index.md`
- `rules-index.md`
- `storyboard-format.md`

Đọc thêm `references/motion-craft.md`: vốn ý về chuyển động và kiểu cảnh để chọn, không phải danh sách phải làm đủ.

Rồi viết **một** STORYBOARD.md theo `references/storyboard-rules.md`. Trước khi đi tiếp, tự kiểm đủ các điểm sau:

- Số `## Frame N` bằng số `(Frame N)` trong SCRIPT.md.
- `- voiceover:` là bản sao chính xác lời đọc của khung đó.
- `- src:` có dạng `compositions/frames/NN-slug-ascii.html`.
- Có `- status: outline`, `- transition_in:` và `- sfx:`.
- Mỗi khung có SFX thì có `- sfx_at:`.
- Có block `## Video direction` đặt trước `## Frame 1`.
- Mỗi dòng Scene ghi mốc giây thật lấy từ `words`.
- Tên rule trong backtick tối đa khoảng 1 tên mỗi khung.

Nếu bộ skill có `hyperframes-blocks` (bản HyperFrames secure), tra `INDEX.md` của nó trước khi tự nghĩ ra số đếm, biểu đồ hay chữ động. Khi có mục hợp, ghi `block: <tên>` vào dòng Scene. Worker sẽ cài và gắn mục đó theo `_role.md`. Mục có cột VI là `không` phải dùng font `-VN` của dự án cho chữ tiếng Việt.

Khung nào đúng một trong tám kiểu của `scene-templates/` thì ghi `template: <tên>` ngay đầu dòng Scene 1 của khung đó. Bảng chọn kiểu và giới hạn chữ nằm trong `scene-templates/README.md`. Các dòng Scene vẫn ghi mốc giây thật, vì đó là các mốc `T` của template.

### 7. Chốt âm thanh

Làm theo `references/audio.md` §5, theo thứ tự:
1. Chờ nhạc nền xong. Nếu bật khớp nhịp, chạy `beat-grid` và `beat-snap` ngay sau đó (`references/audio.md` §6).
2. Chạy `fetch-sfx`.
3. Sửa `offset_s` và âm lượng trong `audio_meta.json`.
4. Chạy `sync-durations`.
5. Cập nhật `duration:` ở frontmatter bằng tổng các khung.

Âm lượng nhạc nền được đo và chỉnh ở bước 9, sau khi lắp ráp.

**Đổi giọng cho video đã dựng xong** (cùng kịch bản, giọng khác): không làm lại từ bước 4. Làm theo `references/audio.md` §7, rồi bước 9 và 10.

### 8. Dựng từng khung (faceless Step 5, worker song song)

```bash
node "$FX"/frame-packets.mjs --project . --storyboard ./STORYBOARD.md
```

- **Packet vượt 48 KB:** bỏ bớt tên rule trong backtick ở các dòng Scene của khung đó, thay bằng mô tả chuyển động bằng lời, rồi chạy lại lệnh.
- **Tách Video direction:** chép block `## Video direction` (đến trước `## Frame 1`) vào `.hyperframes/frame-packets/_video-direction.md`. Packet không chứa block này.
- **Giao việc:** mỗi khung giao cho một Agent chạy nền (`general-purpose`). Prompt là mẫu trong `references/worker-prompt.md`, đã điền các chỗ trống. Gửi tất cả trong **một** tin nhắn để chúng chạy song song.
- **Khung có `template:`:** điền chỗ `{TEMPLATE}` của prompt theo `references/worker-prompt.md`. Worker chạy `use-scene-template.mjs` rồi chỉ sửa token, chữ và mốc `T`.

Khi mọi worker xong, kiểm từng tệp khung:

```bash
grep -L '^<template' compositions/frames/*.html                                  # phải rỗng
grep -l '<audio\|Math\.random\|Date\.now\|yoyo\|@keyframes\|repeat: *-\?[0-9]' compositions/frames/*.html   # phải rỗng
grep -L 'assets/fonts/[A-Za-z]*-VN\.woff2' compositions/frames/*.html            # phải rỗng
grep -l "\.\./assets\|querySelector[A-Za-z]*(['\"\`]#[0-9]" compositions/frames/*.html   # phải rỗng
grep -l "visibility: *['\"]visible" compositions/frames/*.html                  # phải rỗng: dùng "inherit"
```

- **Có `../assets`:** sửa thành `assets/…`. Đường dẫn tính từ gốc dự án.
- **Có `visibility: "visible"`:** đổi thành `"inherit"` (`references/pitfalls.md` mục 35).
- **Lỗi khác:** giao lại khung đó cho một worker mới, kèm thông báo lỗi.
- **Đạt:** đổi `- status: outline` thành `- status: animated`.

### 9. Lắp ráp và QA (faceless Step 6)

Lắp ráp:

```bash
node "$FX"/captions.mjs build --storyboard ./STORYBOARD.md --audio-meta ./audio_meta.json --hyperframes . --out ./caption_groups.json
node "$SK"/scripts/regroup-vi.mjs . 9
node "$FX"/assemble-index.mjs --storyboard ./STORYBOARD.md --hyperframes .
node "$FX"/transitions.mjs inject --storyboard ./STORYBOARD.md --hyperframes .
node "$FX"/transitions.mjs verify --storyboard ./STORYBOARD.md --index ./index.html
```

`captions.mjs` đếm mỗi âm tiết tiếng Việt là một từ, nên mỗi lần chỉ hiện 2–4 âm tiết, nhấp nháy liên tục. `regroup-vi.mjs` gom lại theo câu và vế câu (ngắt ở `, ; :`), tối đa 9 âm tiết mỗi nhóm, không vượt qua cuối câu hay ranh giới khung. Khi một vế quá dài phải cắt giữa chừng, điểm cắt được dời tối đa hai chữ để một dòng không kết thúc ở "ngã", "các", "và", "là"… (danh sách `STRANDED` trong script), nhờ đó "ngã tư" không bị tách đôi. Nó ghi lại `caption_groups.json` và `GROUPS` trong `compositions/captions.html`. Mốc thời gian từng chữ giữ nguyên. Chạy lại lệnh này **mỗi khi** chạy lại `captions.mjs build`. Lệnh in từng nhóm để đọc nhanh; ở video 16:9, 9 âm tiết vừa một dòng phụ đề.

Dòng `bgm (track 11)` của `assemble-index` phải là `yes`. Nếu là `no`, nhạc nền chưa được lắp.

Đo độ cân bằng giữa nhạc và giọng đọc:

```bash
node "$SK"/scripts/mix-balance.mjs              # video giải thích: mặc định --target 12
node "$SK"/scripts/mix-balance.mjs --target 7   # khớp nhịp hoặc quảng bá: 6–8
```

- Lệnh in ra nhạc nằm dưới giọng bao nhiêu dB, cùng một giá trị `bgm.volume ≈ …`. Nếu chênh quá 2 dB so với mục tiêu, ghi giá trị đó vào `bgm.volume` trong `audio_meta.json`, rồi chạy lại `assemble-index` và `transitions.mjs inject`.
- Dòng `louder than the voice` là SFX to hơn giọng đọc. Hạ `volume` của SFX đó.
- Với nhạc Lyria đã đo, `bgm.volume` 0.1 cũ nằm dưới giọng khoảng 22 dB, tức gần như không nghe thấy nhạc.

Kiểm tra:

```bash
hyperframes lint                     # phải 0 error
hyperframes check                    # phải "Check passed"
hyperframes snapshot --at <giữa mỗi khung, cách nhau dấu phẩy> --describe false
hyperframes snapshot --at <cuối mỗi khung − 0.35s> --no-end --describe false -o snapshots/late
```

Kết quả lệnh snapshot là các tệp `contact-sheet-1..N.jpg`. **Đọc (Read) từng contact sheet** và kiểm:
- dấu tiếng Việt có bị cắt không;
- chữ có tràn khỏi thẻ không;
- có gì lấn vào vùng phụ đề (y > 896) không;
- có khung trống hoặc đen không;
- màu nhấn dùng đúng luật của `frame.md` (ví dụ coral của `code-editorial`, hay gradient của `glass-keynote`, chỉ một lần mỗi khung).

Cách xử lý kết quả của `check`:
- **Cảnh báo phụ đề lệch 1–4px** (`caption-word`, `caption-line`): bỏ qua.
- **Cảnh báo tương phản trong khoảng ±0.9 s quanh điểm chuyển cảnh:** thường là báo nhầm do crossfade. Vẫn phải nhìn ảnh để xác nhận.
- **Cảnh báo tương phản ở thời điểm khác:** là lỗi thật. Tăng alpha của chữ lên ≥ 0.72 trên nền kem.
- **Lỗi layout (`content_overlap`, `text_occluded`) giữa phần tử của hai khung khác nhau** (id `f01-…` chồng lên `f07-…`), kéo dài hàng chục giây: rất có thể có khung "rò" sang các khung sau (`references/pitfalls.md` mục 35). Chụp snapshot ở giữa các khung sau để xác nhận. Nếu ảnh sạch mà lỗi vẫn báo, đó là báo nhầm: gắn `data-layout-allow-overlap` vào **từng** phần tử chữ bị nêu tên. Thuộc tính này không kế thừa, nên gắn vào thẻ cha không có tác dụng.

Sửa tệp khung cụ thể, rồi lắp ráp và kiểm lại. Muốn xem gần một vùng: `hyperframes snapshot --at <t> --zoom "x,y,w,h" --zoom-scale 2 -o snapshots/zoom`.

### 10. Render và báo cáo

```bash
hyperframes render --skill=faceless-explainer --quality high --output renders/video.mp4
ffprobe -v error -show_entries format=duration,size:stream=codec_type,width,height,r_frame_rate -of json renders/video.mp4
ffmpeg -hide_banner -nostats -i renders/video.mp4 -vn -af ebur128=peak=true -f null - 2>&1 | grep -E '^ +(I|LRA|Peak):'
ffmpeg -hide_banner -nostats -i renders/video.mp4 -an -vf blackdetect=d=0.1:pix_th=0.05 -f null - 2>&1 | grep -c black_start
mkdir -p snapshots/mp4 && for t in <giữa mỗi khung, cách nhau dấu cách>; do ffmpeg -v error -y -ss $t -i renders/video.mp4 -frames:v 1 -vf scale=640:-1 snapshots/mp4/$t.png; done
```

**Đọc (Read) các ảnh trong `snapshots/mp4/`** và so với contact sheet ở bước 9. Snapshot và render chụp hình bằng hai cách khác nhau, nên ảnh snapshot đúng chưa chứng minh được MP4 đúng. Nếu MP4 thiếu ảnh hay có vùng trắng mà snapshot không có, render lại với `--experimental-fast-capture=false` (`references/pitfalls.md` mục 48).

Yêu cầu:
- Video có luồng audio.
- `I` (độ to tích hợp) khoảng −14 đến −16 LUFS.
- `Peak` (true peak) ≤ −1 dBFS.
- Số `black_start` là 0. Nếu khác 0, bỏ `| grep -c black_start` để xem thời điểm, chụp snapshot ở đó, rồi xem `references/pitfalls.md` mục khung đen.

**Đo chỗ đứng hình:**

```bash
node "$SK"/scripts/motion-audit.mjs
```

Lệnh in mỗi khung đứng hình bao nhiêu giây và đánh dấu `!` ở khung dừng yên hơn 40% thời lượng tới hết khung, hoặc có một đoạn đứng từ 4 giây. Dấu `!` là chỗ nên xem lại, không phải lỗi: lời đọc dài có thể cần hình đứng. Khung nào sửa được rẻ (rải lại mốc theo lời, thêm một thứ chạy suốt khung, `references/motion-craft.md` §2) thì sửa rồi render lại; còn lại thì ghi vào báo cáo.

**Bản nhẹ để đăng mạng xã hội** (tuỳ chọn, khi người dùng cần):

```bash
ffmpeg -hide_banner -v error -y -i renders/video.mp4 -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -profile:v high -movflags +faststart -c:a copy renders/video-social.mp4
ffmpeg -hide_banner -nostats -i renders/video-social.mp4 -i renders/video.mp4 -lavfi ssim -f null - 2>&1 | grep -o 'All:[0-9.]*'
```

- SSIM `All` phải ≥ 0.98. Bản thử đạt 0.9994 và nhẹ còn một nửa.
- Giữ `-c:a copy`. Mã hoá lại AAC làm true peak tăng khoảng 1 dB.

Báo cáo cho người dùng:
- **Kết quả:** đường dẫn MP4 (và bản social nếu có), độ phân giải, thời lượng, dung lượng, LUFS, true peak.
- **Giọng đọc:** giọng đã dùng, và những chỗ whisper nghe khác kịch bản. Với giọng nhân bản: nhắc gửi bản ghép cho chủ giọng duyệt trước khi xuất bản, và video là phi thương mại.
- **Âm thanh:** nhạc nằm dưới giọng bao nhiêu dB (`mix-balance`), `bgm.volume` đã dùng. Nếu bật khớp nhịp: BPM đo được so với BPM đã yêu cầu.
- **Đã kiểm:** ảnh tĩnh, lint, check, số đo âm thanh, blackdetect, tỉ lệ đứng hình (`motion-audit`) và các khung bị đánh dấu.
- **Chưa kiểm:** giọng thật nghe ra sao, chuyển động, độ khớp hình với lời. Mời người dùng tự xem và nghe.
- **Lỗi đã chấp nhận:** những lỗi còn lại mà không sửa.

## Tham khảo

| Tệp | Khi nào đọc |
|---|---|
| `references/install.md` | Máy chưa có HyperFrames, ffmpeg, Node hoặc khoá Gemini; kiểm VoiceStudio khi dùng giọng nhân bản |
| `references/voices.md` | Chọn giọng (Leda mặc định; Orus, Kore, Aoede, Charon và các giọng khác; giọng nhân bản), prompt phong cách, lỗi phát âm đã biết, điều khoản và cách viết chữ cho giọng nhân bản |
| `references/audio.md` | Toàn bộ quy trình âm thanh: TTS, giọng nhân bản (§1b), sửa chữ phụ đề, khoảng lặng, nhạc nền, SFX, khớp nhịp (§6), đổi giọng cho video đã dựng (§7) |
| `presets/<tên>/FRAME.md` | Hệ thiết kế của preset `glass-keynote`, `comic-multiverse` hoặc `win95-pixel` (đã thành `frame.md` sau bước 2) |
| `scene-templates/README.md` | Khung có kiểu quen thuộc (số lớn, trước và sau, ngộ nhận và sự thật, ba bước, ba mốc, cột so sánh, chú thích, danh sách tích): chọn kiểu, cách điền, giới hạn đã thấy |
| `references/motion-craft.md` | Trước khi viết storyboard: điều làm chuyển động có nghề, cách giữ hình sống khi lời còn đọc, vốn kiểu cảnh |
| `references/storyboard-rules.md` | Mẫu một khung storyboard và block Video direction |
| `references/worker-prompt.md` | Mẫu prompt giao việc cho worker dựng khung |
| `references/fonts.md` | Block `@font-face` tiếng Việt cho frame.md; làm font cho preset khác |
| `references/brief-template.md` | Mẫu BRIEF.md |
| `references/pitfalls.md` | Các lỗi đã gặp và cách tránh. **Đọc khi có bước báo lỗi.** |
