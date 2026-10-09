# Những lỗi đã gặp và cách tránh

Các lỗi dưới đây gặp khi dựng video đầu tiên (my-agent-crew, 11 khung, 101 s) và khi chuyển sang giọng Gemini. Các mục 28–34 lấy từ kinh nghiệm của bestagentkits/motion-video-skill và từ các lần đo trên video đó. Các mục 35–38 gặp khi dựng video kho-sach-win95 (preset `win95-pixel`, 10 khung, 94 s). Cột "Cách tránh" chỉ tới bước tương ứng trong SKILL.md hoặc `audio.md`.

## Hình và font

| # | Triệu chứng | Nguyên nhân | Cách tránh |
|---|---|---|---|
| 1 | Dấu tiếng Việt hiện thành ô vuông, hoặc chữ bị đổi sang font hệ thống | Font của preset chỉ có bảng chữ Latin | Bước 2: chép font `-VN.woff2` và nối block font vào frame.md (`fonts.md`) |
| 2 | Lint báo lỗi `invalid_parent_traversal_in_asset_path` ở mọi khung | Worker viết `../../assets/fonts/…`. Khung được phục vụ từ gốc dự án, nên phải là `assets/…` | Mẫu worker dặn rõ điều này; bước 8 grep `../assets` và sửa |
| 3 | 141 cảnh báo `id_requires_css_escape`; `querySelector('#06-…')` có thể vỡ | id/class bắt đầu bằng chữ số (lấy theo tên khung) | Mẫu worker bắt tiền tố `fNN-`; bước 8 grep `querySelector('#<số>')` |
| 4 | Tên tệp chữ mono tràn khỏi thẻ, chui dưới góc gập | Chữ mono rộng trong thẻ có bề ngang cố định | Mẫu worker: chừa ≥ 24px; đọc contact sheet ở bước 9 |
| 5 | Tương phản 2.57:1 (chú thích alpha 0.58 trên nền kem) | Chữ mờ quá tay | Mẫu worker: alpha ≥ 0.72; bước 9 tách cảnh báo thật khỏi cảnh báo lúc chuyển cảnh |
| 6 | Cảnh báo tương phản hoặc tràn chữ không có thật | Khung đang crossfade; chữ phụ đề lệch 1–4px | Bước 9: bỏ qua cảnh báo phụ đề, đối chiếu thời điểm chuyển cảnh và xem ảnh |
| 7 | Worker e ngại ký hiệu ✱ không có trong font, nên vẽ bằng SVG | Không biết phạm vi glyph của subset | Mẫu worker liệt kê phạm vi glyph (✓ ✗ ✱, mũi tên, hình học) |
| 8 | Worker không biết bảng màu, kiểu chữ, danh sách cấm của cả video | Packet không chứa block `## Video direction` | Bước 8: tách block ra `_video-direction.md`; mẫu worker bắt đọc |
| 9 | `frame-packets` dừng: `frame packet is 50244 bytes (limit 48000)` | Khung trích quá nhiều tên rule trong backtick. Mỗi tên kéo theo toàn văn rule | Khoảng 1 tên rule mỗi khung; còn lại mô tả chuyển động bằng lời |
| 10 | `snapshots/contact-sheet.jpg` không tồn tại | Lệnh snapshot ghi ra `contact-sheet-1..N.jpg` | `ls snapshots/**/contact-sheet*.jpg` rồi đọc từng tệp |
| 28 | Khung đen hoặc chớp đen giữa video; `blackdetect` báo `black_start` | Hơn ~40 phần tử dùng `radial-gradient`, `filter: blur()` hoặc `clip-path` cùng lúc trên màn hình (ghi nhận ở motion-video-skill) | Texture (chấm halftone, nhiễu) nướng sẵn thành một PNG; glow ≤ 3; không `backdrop-filter`. Bước 10 chạy `blackdetect` |
| 29 | Lớp flash, lớp chấm hay tia tốc độ hiện sẵn ngay giây 0, trước khi tới hiệu ứng | `fromTo` áp trạng thái đầu ngay khi timeline được dựng, kể cả khi tween nằm ở giây sau | Thêm `immediateRender: false` cho `fromTo` trên lớp được dùng lại trong khung |
| 30 | Khung chậm hoặc ra đen khi có hiệu ứng tách màu RGB | Bộ lọc SVG (`filter: url(#…)`) gắn suốt cả khung | Chỉ gắn trong lúc hiệu ứng chạy: `tl.set(el, {filter: "url(#rgb)"}, t)` rồi `tl.set(el, {filter: "none"}, t + 0.2)` |
| 35 | Hộp thoại của một khung vẫn nằm đè lên mọi khung sau tới hết video; `check` báo hàng trăm lỗi `content_overlap`/`text_occluded` giữa id của hai khung khác nhau | Runtime ẩn khung đã hết bằng `visibility: hidden` trên thẻ chứa khung. Phần tử con được `tl.set(el, {visibility: "visible"})` ghi đè giá trị kế thừa đó nên vẫn hiện | Hiện phần tử bằng `visibility: "inherit"`, không bao giờ `"visible"` (`autoAlpha` của GSAP đã dùng `inherit`). Trạng thái ẩn ban đầu đặt trong CSS. Mẫu worker đã dặn; sau bước 8 grep `visibility: *["']visible` phải rỗng |
| 36 | Lint báo lỗi ở hiệu ứng mở cửa sổ kiểu zoom-rectangle và ở mốc cuối khung | Tween `left/top/width/height` với `steps(6)` (`gsap_non_transform_motion`); đặt `visibility` trên phần tử `.clip` | Dựng 7 bước bằng `tl.set` với giá trị nội suy; ẩn/hiện lớp con thay vì `.clip`; neo cuối khung bằng `tl.set({}, {}, DURATION)` |
| 37 | Phụ đề chỉ hiện 2–4 âm tiết mỗi lần, nhấp nháy liên tục (149 nhóm cho 94 s) | `captions.mjs` giới hạn 2–4 "từ" mỗi nhóm, mà tiếng Việt mỗi âm tiết là một từ | Bước 9: `regroup-vi.mjs . 9` ngay sau `captions.mjs build` (còn 47 nhóm) |
| 48 | Trong MP4, một ảnh `<img>` lớn biến mất suốt thời gian nó hiện (vùng chứa ảnh trắng trơn), còn snapshot cùng thời điểm vẫn đúng; `blackdetect` không báo gì | Chế độ fast capture của `render` (mặc định trên macOS có GPU) làm rơi ảnh đó. Gặp với CLI 0.8.137, một ảnh chụp màn hình 1760px trong khung `win95-pixel` | Bước 10: trích ảnh từ MP4 ở giữa mỗi khung và nhìn. Nếu thiếu ảnh, render lại với `--experimental-fast-capture=false` (chậm hơn, tệp lớn gấp đôi) |

## Giọng đọc và âm thanh

| # | Triệu chứng | Nguyên nhân | Cách tránh |
|---|---|---|---|
| 11 | `audio.mjs generate` của faceless không dùng Gemini, và báo thiếu HeyGen cho nhạc nền | Lệnh này cố định `provider: "auto"` và nhạc nền kiểu `retrieve` | Gọi thẳng engine `media-use` (`audio.md` §1, §4) |
| 12 | Phụ đề hiện chữ sai ("My Asian crew", "chết mấy bạc") | `words` của engine là chữ whisper nghe lại, không phải chữ kịch bản | `audio.md` §2: thay chữ theo kịch bản, giữ mốc thời gian |
| 13 | Tạo lại một khung thì các khung khác biến mất khỏi `voices` | `--only tts` thay toàn bộ `voices` bằng các câu của lần chạy đó | Tạo lại vào tệp `--out` riêng rồi chép vào tệp phụ (`audio.md` §1) |
| 14 | Sửa chữ phụ đề hoặc độ dài rồi mà sau `fetch-sfx` lại mất | `fetch-sfx` dựng lại `audio_meta.json` từ `audio_engine_meta.json` | Mọi sửa về giọng làm trong tệp phụ; chỉ sửa `audio_meta.json` sau lần `fetch-sfx` cuối |
| 15 | Engine báo thiếu khoá dù người dùng đã thêm vào `~/.zshrc` | VS Code hoặc terminal mở trước khi thêm khoá, nên tiến trình không có biến đó | Đặt dòng `eval …` đầu mỗi lệnh gọi engine (`install.md` §4); không in khoá |
| 16 | `audio_request.json` bị đổi nội dung | `fetch-sfx` ghi đè tệp này | Request TTS và nhạc nền để ở `.hyperframes/tts_request.json` và `.hyperframes/bgm_request.json` |
| 17 | Một khung không có giọng mà không có lỗi dừng | Câu TTS lỗi chỉ được ghi trong "anomalies (non-fatal)" rồi bị bỏ | Đếm `voices` bằng số khung sau mỗi lần chạy |
| 18 | Tạo lại giọng thì Scene lệch khỏi lời đọc | Gemini không cố định: cùng câu có thể ra độ dài và nhịp khác | Sau khi tạo lại: sửa chữ phụ đề, chạy `sync-durations`, cập nhật mốc Scene của khung đó |
| 19 | Nhạc nền chỉ dài 30 s rồi lặp, hoặc ngắn hơn video | Chạy nhạc nền trước khi có giọng, hoặc engine chuyển sang MusicGen | Chạy §4 sau §3; kiểm dòng `bgm: launched lyria` |
| 20 | Video không có nhạc nền mà không có lỗi dừng | `assemble-index` âm thầm bỏ nhạc khi `track.wav` chưa có | `wait-bgm` phải báo `ready`; dòng `bgm (track 11)` của assemble phải là `yes` |
| 21 | `fetch-sfx` bỏ qua SFX mà không báo gì | Tên SFX mô tả (vd "soft paper click") không có trong thư viện | Đối chiếu tên với `media-use/audio/assets/sfx/*.mp3`; đếm số `sfx` |
| 22 | Mọi SFX kêu ngay giây 0 của khung, và to hơn giọng | `fetch-sfx` ghi `offset_s: 0`, `volume: 0.35` | `audio.md` §5 bước 3: ghi offset theo `sfx_at`, volume 0.22 |
| 23 | Khung cuối kết thúc ngay khi giọng dứt, không có chỗ dừng | Độ dài khung bằng độ dài giọng; sửa tay `duration` thì bị `sync-durations` ghi đè | `audio.md` §3: thêm khoảng lặng vào tệp WAV |
| 24 | `duration:` ở frontmatter storyboard sai | `sync-durations` chỉ sửa `- duration:` của từng khung | Tự sửa frontmatter bằng tổng các khung |
| 31 | Người xem nói video "không có nhạc" | `bgm.volume` 0.1 đặt cố định: đo được nhạc nằm dưới giọng khoảng 22 dB | Bước 9: `mix-balance.mjs`, lấy `bgm.volume` theo gợi ý (mục tiêu 12 dB, khớp nhịp 6–8 dB) |
| 32 | Bản social có true peak cao hơn bản gốc khoảng 1 dB | Mã hoá lại AAC làm đỉnh tăng | Bản social giữ `-c:a copy` (bước 10) |
| 33 | Khớp nhịp xong thì nhạc lặp lại ở đoạn cuối, hoặc `beat-snap` báo nhạc ngắn hơn | Nhạc tạo theo tổng lời đọc chưa khớp nhịp; khớp nhịp làm mỗi khung dài thêm tới một phách | `beat-snap --reserve` trước khi tạo nhạc (`audio.md` §6) |
| 34 | Điểm cắt nghe lệch nhịp dù đã khớp | Dùng BPM trong prompt thay vì BPM đo được; Lyria không giữ đúng BPM yêu cầu | Luôn `beat-snap --grid .hyperframes/beat-grid.json`, lưới đo từ bài nhạc thật |
| 39 | Giọng nhân bản bỏ mất một vế câu | Một lần gọi chứa hai câu trở lên | `audio.md` §1b: mỗi `segment` một câu; `clone-voice.mjs` thử lại seed khác và giữ lần khớp nhất |
| 40 | Giọng nhân bản đọc "tám nghìn sáu trăm" thành "tám sáu", ở mọi seed | OmniVoice nuốt cụm số có "nghìn" | Viết "ngàn" trong `say`; phụ đề vẫn là "8.600" (`voices.md`) |
| 41 | Phụ đề của từ đầu câu hiện sớm nửa giây, trong lúc còn im lặng | Whisper nghe tệp đã nối và đặt từ đầu câu sau vào khoảng lặng giữa hai câu | Lấy mốc từ lần whisper của **từng đoạn** rồi cộng độ lệch, không nghe lại tệp đã nối (`clone-voice.mjs` làm sẵn) |
| 42 | Nhiều từ liền nhau có mốc thời gian gần như trùng nhau | Whisper trả mốc suy biến cho một lần tạo | `clone-voice.mjs` trừ điểm lần tạo đó và chọn seed khác; nếu vẫn phải dùng thì chia đều thời gian theo độ dài từ |
| 43 | Đổi giọng xong, hình chạy lệch lời | Giọng mới nhanh hoặc chậm hơn, mốc GSAP trong khung vẫn theo giọng cũ | `audio.md` §7: `retime-frames.mjs apply`, không sửa tay từng mốc |
| 44 | Sau khi đổi giọng, điểm chuyển cảnh lộ khung trống | Khung có `data-duration` dài hơn giọng (giữ hình cho crossfade) bị đặt lại bằng đúng độ dài giọng | `retime-frames.mjs` giữ nguyên khoảng giữ thêm; không tự sửa `data-duration` |
| 45 | Sau khi đổi giọng, mọi SFX lại kêu ở giây 0 | Chạy lại `fetch-sfx`, nó đặt `offset_s` về 0 | `retime-frames.mjs apply` tự chuyển offset; không chạy lại `fetch-sfx` (`audio.md` §7) |
| 46 | Nhạc dứt đột ngột hoặc lặp lại ở cuối video sau khi đổi giọng | Bài nhạc vẫn dài theo giọng cũ | `audio.md` §7 bước 4: cắt và mờ dần, hoặc tạo lại nhạc |

## Quy trình

| # | Triệu chứng | Nguyên nhân | Cách tránh |
|---|---|---|---|
| 25 | Lời đọc trong storyboard lệch với SCRIPT, phụ đề và hình lệch nhau | Chép lại bằng tay | Kiểm danh sách ở bước 6: `voiceover` là bản sao chính xác |
| 26 | Công cụ Write báo "file changed since read" | Tệp bị lệnh khác sửa sau lần đọc | Đọc lại (Read) rồi mới ghi; ưu tiên Edit |
| 27 | Báo cáo nói video "ổn" nhưng người dùng nghe thấy lỗi | Agent không nghe được âm thanh và không xem được chuyển động | Báo rõ phần đã kiểm và phần chưa kiểm; mời người dùng xem và nghe |
| 47 | Lệnh chờ tạo giọng nhân bản bị ngắt sau 10 phút | Mỗi câu mất 13–20 s; lệnh Bash chạy trước có giới hạn 10 phút | Chạy `clone-voice.mjs` nền, ghi ra tệp log, rồi đọc log |
| 38 | `zsh: command not found: npx -y hyperframes` | Cất lệnh vào biến `CLI="npx -y hyperframes"` rồi gọi `$CLI`; zsh không tách chữ trong biến | Bước 0: viết lệnh trực tiếp, không qua biến |

## Đã chấp nhận, không sửa

- **Hai phần tử chồng lên nhau thoáng qua** (~0.3 s) khi đang chuyển động. Vẫn ghi vào báo cáo cuối.
- **Cảnh báo tương phản đúng lúc crossfade.** Chấp nhận nếu contact sheet cho thấy chữ vẫn đọc được.
- **Giọng nhân bản đọc tên riêng tiếng Anh theo cách của nó** (ví dụ EPUB). Chỉ đổi cách viết trong `say`; không chỉnh tham số khác, không xử lý tệp tiếng.
- **Whisper nghe sai tiếng Việt.** Danh sách "nghe khác kịch bản" chỉ là gợi ý nơi cần nghe kỹ, không phải bằng chứng đọc sai.
