# Những lỗi đã gặp và cách tránh

Các lỗi dưới đây gặp khi dựng video đầu tiên (my-agent-crew, 11 khung, 101 s) và khi chuyển sang giọng Gemini. Cột "Cách tránh" chỉ tới bước tương ứng trong SKILL.md hoặc `audio.md`.

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

## Giọng đọc và âm thanh

| # | Triệu chứng | Nguyên nhân | Cách tránh |
|---|---|---|---|
| 11 | `audio.mjs generate` của faceless không dùng Gemini, và báo thiếu HeyGen cho nhạc nền | Lệnh này cố định `provider: "auto"` và nhạc nền kiểu `retrieve` | Gọi thẳng engine `media-use` (`audio.md` §1, §4) |
| 12 | Phụ đề hiện chữ sai ("My Asian crew", "chết mấy bạc") | `words` của engine là chữ whisper nghe lại, không phải chữ kịch bản | `audio.md` §2: thay chữ theo kịch bản, giữ mốc thời gian |
| 13 | Tạo lại một khung thì các khung khác biến mất khỏi `voices` | `--only tts` thay toàn bộ `voices` bằng các câu của lần chạy đó | Tạo lại vào tệp `--out` riêng rồi chép vào tệp phụ (`audio.md` §1) |
| 14 | Sửa chữ phụ đề hoặc độ dài rồi mà sau `fetch-sfx` lại mất | `fetch-sfx` dựng lại `audio_meta.json` từ `audio_engine_meta.json` | Mọi sửa về giọng làm trong tệp phụ; chỉ sửa `audio_meta.json` sau lần `fetch-sfx` cuối |
| 15 | Engine báo thiếu khoá dù người dùng đã thêm vào `~/.zshrc` | VS Code hoặc terminal mở trước khi thêm khoá, nên tiến trình không có biến đó | Đặt dòng `eval …` đầu mỗi lệnh gọi engine (`install.md` §3); không in khoá |
| 16 | `audio_request.json` bị đổi nội dung | `fetch-sfx` ghi đè tệp này | Request TTS và nhạc nền để ở `.hyperframes/tts_request.json` và `.hyperframes/bgm_request.json` |
| 17 | Một khung không có giọng mà không có lỗi dừng | Câu TTS lỗi chỉ được ghi trong "anomalies (non-fatal)" rồi bị bỏ | Đếm `voices` bằng số khung sau mỗi lần chạy |
| 18 | Tạo lại giọng thì Scene lệch khỏi lời đọc | Gemini không cố định: cùng câu có thể ra độ dài và nhịp khác | Sau khi tạo lại: sửa chữ phụ đề, chạy `sync-durations`, cập nhật mốc Scene của khung đó |
| 19 | Nhạc nền chỉ dài 30 s rồi lặp, hoặc ngắn hơn video | Chạy nhạc nền trước khi có giọng, hoặc engine chuyển sang MusicGen | Chạy §4 sau §3; kiểm dòng `bgm: launched lyria` |
| 20 | Video không có nhạc nền mà không có lỗi dừng | `assemble-index` âm thầm bỏ nhạc khi `track.wav` chưa có | `wait-bgm` phải báo `ready`; dòng `bgm (track 11)` của assemble phải là `yes` |
| 21 | `fetch-sfx` bỏ qua SFX mà không báo gì | Tên SFX mô tả (vd "soft paper click") không có trong thư viện | Đối chiếu tên với `media-use/audio/assets/sfx/*.mp3`; đếm số `sfx` |
| 22 | Mọi SFX kêu ngay giây 0 của khung, và to hơn giọng | `fetch-sfx` ghi `offset_s: 0`, `volume: 0.35` | `audio.md` §5 bước 3: ghi offset theo `sfx_at`, volume 0.22 |
| 23 | Khung cuối kết thúc ngay khi giọng dứt, không có chỗ dừng | Độ dài khung bằng độ dài giọng; sửa tay `duration` thì bị `sync-durations` ghi đè | `audio.md` §3: thêm khoảng lặng vào tệp WAV |
| 24 | `duration:` ở frontmatter storyboard sai | `sync-durations` chỉ sửa `- duration:` của từng khung | Tự sửa frontmatter bằng tổng các khung |

## Quy trình

| # | Triệu chứng | Nguyên nhân | Cách tránh |
|---|---|---|---|
| 25 | Lời đọc trong storyboard lệch với SCRIPT, phụ đề và hình lệch nhau | Chép lại bằng tay | Kiểm danh sách ở bước 6: `voiceover` là bản sao chính xác |
| 26 | Công cụ Write báo "file changed since read" | Tệp bị lệnh khác sửa sau lần đọc | Đọc lại (Read) rồi mới ghi; ưu tiên Edit |
| 27 | Báo cáo nói video "ổn" nhưng người dùng nghe thấy lỗi | Agent không nghe được âm thanh và không xem được chuyển động | Báo rõ phần đã kiểm và phần chưa kiểm; mời người dùng xem và nghe |

## Đã chấp nhận, không sửa

- **Hai phần tử chồng lên nhau thoáng qua** (~0.3 s) khi đang chuyển động. Vẫn ghi vào báo cáo cuối.
- **Cảnh báo tương phản đúng lúc crossfade.** Chấp nhận nếu contact sheet cho thấy chữ vẫn đọc được.
- **Whisper nghe sai tiếng Việt.** Danh sách "nghe khác kịch bản" chỉ là gợi ý nơi cần nghe kỹ, không phải bằng chứng đọc sai.
