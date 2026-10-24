# Kiểm tra và báo cáo

Agent không nghe được âm thanh và không xem được chuyển động. Mọi phép kiểm dưới đây thay cho hai việc đó bằng số đo, phép tính và ảnh tĩnh. Báo cáo cuối phải nói rõ phần nào đã kiểm bằng cách nào, phần nào chưa.

Các lệnh chạy trong thư mục dự án (`$P`). `hyperframes` là `npx -y hyperframes` khi CLI không có trên PATH.

## 1. Thứ tự kiểm

| Lúc nào | Kiểm gì | Đạt khi |
|---|---|---|
| Sau khi viết `SCRIPT.md` | `node scripts/scan-words.mjs`; đếm âm tiết (`series.md` §3) | `clean`; số âm tiết trong ngân sách |
| Sau khi viết `SCRIPT.md` | Soát tay từng dòng Chốt, từng danh sách đánh số, từng con số, từng chữ rào đón với tệp bài | không thêm bớt thao tác, đúng thứ tự, đúng số |
| Sau khi tạo giọng | Danh sách "whisper nghe khác kịch bản" | mỗi chỗ khác đã được xem: lỗi chính tả của whisper thì bỏ qua, đọc sai chữ thì tạo lại đoạn đó |
| Sau mỗi lần sửa `beats.js`, `drive.js`, `world.js` | `bash scripts/snap.sh try "<vài mốc>"` | không lỗi `cue not found`, ảnh đúng ý |
| Sau `assemble.sh` | `check-frames.sh` (tự chạy), `scan-words.mjs`, `mix-balance.mjs`, `lint`, `npm run check` | `clean`; nhạc dưới giọng khoảng 12 dB; 0 error; "Check passed" |
| Sau `assemble.sh` | Hai bộ contact sheet `mid` và `late`, rồi ảnh chụp thêm (§2) | xem danh sách ở §2 |
| Sau khi render | Số đo MP4 và ảnh trích từ MP4 so với ảnh chụp | `vi-explainer-video/SKILL.md` bước 10 |

Sửa xong một lỗi thì chạy lại các phép kiểm phía sau nó, không chỉ phép đã báo lỗi.

## 2. Ảnh phải đọc

Hai bộ bắt buộc:

```bash
bash scripts/snap.sh mid  "$(node scripts/frame-times.mjs mid)"      # giữa mỗi khung
bash scripts/snap.sh late "$(node scripts/frame-times.mjs late)"     # 0,35 giây trước khi hết khung
```

Read từng `snapshots/<tên>/contact-sheet-*.jpg`. Ở mỗi ảnh:

- cảnh đọc được: thấy mặt đường, vạch, xe phía trước; không có khung đen hay trống. Cảnh đêm và sương được phép tối và mờ, nhưng thứ mà lời đọc đang nói tới phải thấy được;
- cột chữ nằm trong x 64–620 và trên y 880; dấu tiếng Việt không bị cắt; chữ không tràn thẻ; không gì lấn vào vùng phụ đề;
- bảng đồng hồ góc trên phải không bị thẻ hay nhãn 3D che;
- chữ trên thẻ khớp lời đọc của khung; số của danh sách đúng thứ tự của bài;
- ảnh `late`: mọi thẻ của khung đã vào đủ, thẻ đã đọc xong vẫn đọc được sau khi mờ bớt.

Ảnh chụp thêm (`snap.sh` với tên khác, mốc lấy từ `beats.js`):

| Chụp | Lúc nào | Tìm gì |
|---|---|---|
| Mỗi kiểu cảnh quay của `SHOTS` | giữa cảnh | máy quay không chui vào xe, không nhìn xuyên mặt đường; ca-pô và vô lăng đúng chỗ ở cảnh ghế lái |
| Mỗi lần cảnh đổi trạng thái | 0,3 s trước và 0,6 s sau mốc | đổi đèn chiếu xa sang chiếu gần, bật đèn sương mù, gạt nước, đèn dừng khẩn cấp: thấy khác nhau rõ trên ảnh, và khác đúng lúc lời đọc nói |
| Mỗi nhãn 3D | lúc nhãn vừa hiện, và lúc vật nó bám đang chuyển động | nhãn bám đúng vật, không đè lên cột chữ hay bảng đồng hồ, không ra khỏi hình |
| Mỗi điểm cắt cảnh `B.cut` | 0,2 s sau điểm cắt | cảnh mới đã sẵn sàng: xe ở đúng chỗ, không có vật của cảnh cũ |
| Quầng sáng mạnh (đèn xe ngược chiều, chói mắt) | lúc mạnh nhất | cột chữ vẫn đọc được; nếu không thì `DIM` với 0,84 |
| Một vùng nhỏ nghi có lỗi | `hyperframes snapshot --at <t> --zoom "x,y,w,h" --zoom-scale 2 -o snapshots/zoom` | chữ sát mép thẻ, dấu câu sau ô sáng, icon |

Bài 5 dùng 2 bộ bắt buộc và khoảng 60 ảnh chụp thêm. Bài có nhiều kiểu cảnh hay nhiều lần đổi trạng thái thì cần nhiều hơn.

## 3. Kết quả đã biết là báo nhầm

Với ví dụ Bài 5, `npm run check` ra 0 error, 0 warning, 6 info, tương phản 74/74.

| Kết quả | Vì sao bỏ qua được |
|---|---|
| `lint`: 1 warning `composition_file_too_large` | Khung do script sinh, CSS chung lặp lại ở mỗi tệp. Không phải lỗi |
| `check`: info `content_overlap` giữa phần tử của hai khung liền nhau, trong khoảng ±0,9 s quanh điểm chuyển khung | Hai khung chồng nhau khi crossfade. Vẫn nhìn ảnh `late` để xác nhận |
| `check`: cảnh báo phụ đề lệch 1–4 px (`caption-word`, `caption-line`) | Sai số làm tròn của skin phụ đề |

Không bỏ qua: `content_overlap` kéo dài hàng chục giây (một khung rò sang khung sau, `vi-explainer-video/references/pitfalls.md` mục 35); cảnh báo tương phản ở giữa khung; mọi error.

## 4. Kiểm sau khi sửa `kit/`

Sửa bất kỳ tệp nào của `kit/` hay của `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit/` thì ví dụ Bài 5 phải ra hình giống hệt trước khi sửa. Dựng lại ví dụ trong một dự án tạm, mượn phần âm thanh của video đã làm để không tạo lại giọng:

```bash
ROOT=$(git rev-parse --show-toplevel); T=$ROOT/projects/sat-hach-lai-xe/videos/chuong-3-bai-05-khi-khong-nhin-ro; P=$ROOT/projects/sat-hach-lai-xe/videos/chuong-3-kit-check
rm -rf "$P" && bash "$ROOT"/.claude/skills/chuong-3-ky-thuat-lai-xe-video/scripts/new-project.sh chuong-3-kit-check     # ghi lại dòng HF:
for f in assets/voice assets/bgm assets/sfx; do rm -rf "$P/$f"; cp -R "$T/$f" "$P/$f"; done
for f in assets/lib/world/cues.js audio_meta.json audio_engine_meta.json audio_request.json caption-overrides.json .hyperframes/whisper_words.json .hyperframes/bgm_status.json; do cp "$T/$f" "$P/$f"; done
(cd "$P" && node scripts/build-storyboard.mjs && node scripts/lock-audio.mjs --bgm 0.3)
(cd "$P" && node "$FX"/audio.mjs sync-durations --storyboard ./STORYBOARD.md --audio-meta ./audio_meta.json --hyperframes .)
(cd "$P" && HF="$HF" bash scripts/assemble.sh --captions && node scripts/scan-words.mjs && npm run check)
```

So với video đã làm:

```bash
diff -rq "$T/compositions/frames" "$P/compositions/frames"            # không in gì: khung giống từng byte
(cd "$P" && bash scripts/snap.sh cmp "$(node scripts/frame-times.mjs mid)")
(cd "$T" && bash scripts/snap.sh cmp "$(node scripts/frame-times.mjs mid)")
for f in "$P"/snapshots/cmp/contact-sheet-*.jpg; do ffmpeg -hide_banner -nostats -i "$f" -i "$T/snapshots/cmp/$(basename "$f")" -lavfi ssim -f null - 2>&1 | grep -o 'All:[0-9.]*'; done
```

- Sửa không nhằm đổi hình: `diff` không in gì và SSIM `All:1.000000` ở mọi tờ. Lần đóng gói skill đạt đúng như vậy.
- Sửa có chủ ý đổi hình (ví dụ đổi màu vạch): khung vẫn phải giống từng byte nếu không đụng `frames.*`; đọc các tờ `cmp` của hai bên để xác nhận chỉ thứ muốn đổi đã đổi.
- Muốn thấy **chỗ nào** khác thay vì một con số SSIM: `vr-check.sh` (cùng cách như `chuong-6-…/references/qa.md` §4b) cho ảnh tô vùng khác ở `snapshots/vr-diff/`. Dự án `$P` vừa tạo đã có script; `$T` thì chép từ `chuong-6-…/kit/scripts/`:

  ```bash
  cp "$ROOT"/.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit/scripts/vr-check.sh "$T/scripts/"
  (cd "$T" && bash scripts/vr-check.sh base "$(node scripts/frame-times.mjs mid)")
  mkdir -p "$P/snapshots" && cp -R "$T/snapshots/vr-base" "$P/snapshots/"
  (cd "$P" && bash scripts/vr-check.sh check "$(node scripts/frame-times.mjs mid)")   # 0 giống; 1 xem vr-diff/; 3 không có ui
  ```

- Thiếu `projects/sat-hach-lai-xe/videos/chuong-3-bai-05-khi-khong-nhin-ro` (máy khác): tạo lại giọng cho ví dụ theo bước 4–8 của `SKILL.md`, rồi chỉ so được bằng mắt.

Xong thì xoá `projects/sat-hach-lai-xe/videos/chuong-3-kit-check`. Bảng màu `day` của `road.js` mới được chụp thử trên cảnh của Bài 5 (đổi `palette: "day"` trong `world.js`), chưa dùng trong video nào: video đầu tiên dùng ban ngày phải kiểm màu chữ nhãn 3D và độ nổi của vạch đường.

## 5. Bản gửi qua kênh giới hạn dung lượng

Bản 1080p của Bài 5 nặng hơn giới hạn 30 MiB của một số kênh gửi tệp. Bản 720p hai lượt, nhắm khoảng 28 MiB cho video 5 phút:

```bash
ffmpeg -hide_banner -v error -y -i renders/video.mp4 -vf scale=1280:-2 -c:v libx264 -preset slow -b:v 630k -pass 1 -passlogfile "$TMPDIR/ktlx" -an -f null /dev/null
ffmpeg -hide_banner -v error -y -i renders/video.mp4 -vf scale=1280:-2 -c:v libx264 -preset slow -b:v 630k -pass 2 -passlogfile "$TMPDIR/ktlx" -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k renders/video-720p.mp4
ls -l renders/video-720p.mp4
```

Video dài khác thì tính lại: `b:v ≈ (dung lượng đích tính bằng kbit ÷ số giây) − 96`. Kiểm dung lượng thật trước khi gửi. Bản này chỉ để xem nhanh; bản xuất bản là `renders/video.mp4`.

## 6. Mẫu báo cáo

Viết bằng tiếng Việt, cho người dùng.

```markdown
**Kết quả:** projects/sat-hach-lai-xe/videos/<tên dự án>/renders/video.mp4 — 1920×1080, 30 fps, <thời lượng>, <dung lượng>.
Bài <N> · <tên bài>, ý <…>. <Số> khung, <số> âm tiết lời đọc. Ý để lại cho video sau: <…> vì <…>.

**Giọng đọc:** Gemini <tên giọng>, <số> đoạn; chỗ whisper nghe khác kịch bản: <…>.

**Âm thanh:** <LUFS>, true peak <dBFS>; nhạc dưới giọng <dB>; <số> SFX.

**Đã kiểm:**
- nội dung: từng dòng Chốt, danh sách đánh số, con số và chữ rào đón so với tệp bài: khớp; scan-words: clean;
- hình: <số> contact sheet, <số> ảnh chụp thêm (kiểu cảnh quay, lúc đổi trạng thái, nhãn 3D, điểm cắt cảnh);
- lint 0 lỗi; check passed (<số> info, đều là báo nhầm đã biết); blackdetect 0; ảnh trích từ MP4 khớp ảnh chụp.

**Chưa kiểm:**
- chưa nghe âm thanh: cách phát âm, ngữ điệu, độ hợp của nhạc;
- chưa xem chuyển động: độ mượt, nhịp, cảm giác tốc độ;
- phần "vì sao" của bài mới được AI soát, chưa có giáo viên dạy lái xe duyệt<; bài này có chỗ README nêu là kém chắc: …>.

**Chọn mặc định:** <những gì brief không nói mà agent tự chọn>.

**Mới thêm vào skill:** <thứ đã chuyển về kit/, kết quả phép kiểm §4> hoặc "không".
```

Sau báo cáo, cập nhật cột trạng thái ở `series.md` §4 và thêm một dòng vào §6.

## 7. Lỗi đã gặp

Mỗi dòng là một lỗi có thật ở video Bài 5.

### Hình và chữ

| Lỗi | Nguyên nhân | Cách tránh |
|---|---|---|
| Dấu phẩy sau một cụm tô sáng rơi xuống đầu dòng sau | Ô sáng là `inline-block`, trình duyệt được ngắt dòng ngay sau nó | `hlp(id, "cụm từ", ",")` giữ dấu câu dính với ô |
| Ô sáng đè lên chữ đứng trước | Lề âm của ô quá lớn | Giữ `margin` −2 px của `.§hl` như trong kit |
| Ô sáng phình ra làm xô dòng | `PILL` phóng to ô | Kit để `PILL` ở tỉ lệ 1; không truyền `s` lớn hơn 1 trong cột hẹp |
| Nhãn 3D trôi lên cột chữ hay ra ngoài hình | Vật nó bám đi qua mép hình | `hud.js` kẹp hộp nhãn trong hình và làm mờ nhãn khi điểm neo vào x < 600–690; chụp ảnh lúc vật đang chuyển động |
| Thẻ cũ khó đọc khi đèn xe ngược chiều rọi vào | Thẻ mờ bớt để lộ cảnh | `DIM` với 0,84 ở các khung có quầng sáng mạnh |
| Cột chữ đầy, thẻ cuối chạm vùng phụ đề | Quá nhiều bước trong một khung | Chia khung trong `SCRIPT.md`; khung sau mở bằng dòng gọn của các bước đã xong |
| Cảnh đêm tối tới mức không thấy mặt đường trên ảnh thu nhỏ | Chỉ nhìn ảnh đủ kích thước | Kiểm trên contact sheet: vạch và mép đường phải còn thấy |

### Mốc và dữ liệu

| Lỗi | Cách tránh |
|---|---|
| Cụm từ lặp trong một khung trả về mốc của lần đầu | `{ nth: 2 }` |
| `cue not found: frame N "…"` | Cụm phải khớp từng chữ với lời đọc trong `SCRIPT.md`, kể cả dấu |
| Mốc cộng trừ rơi ra ngoài khung | Bọc bằng `tt(...)`; `ctx(n).r` ném lỗi khi mốc gốc không thuộc khung |
| Sửa giọng xong hình lệch lời | Chạy lại `build-cues.mjs`, rồi `build-storyboard.mjs`, `sync-durations`, `assemble.sh` |
| `scan-words` báo một con số thật của bài trong dải 206–263 | Sửa danh sách cấm trong `scripts/scan-words.mjs` của dự án và ghi vào báo cáo |

### Công cụ

| Lỗi | Cách tránh |
|---|---|
| zsh không tách chữ trong biến (`$CLI lint` báo `command not found`) | Gõ thẳng `npx -y hyperframes …` |
| zsh dừng cả lệnh khi một glob không khớp tệp nào (`rm -f snapshots/x/*.png`) | Xoá cả thư mục (`rm -rf snapshots/x`), hoặc để glob trong ngoặc kép cho lệnh tự xử lý |
| Lệnh `cd` trần làm lệch thư mục của các lệnh sau | `(cd "$P" && …)` |
| ffmpeg trên máy không có bộ lọc `drawtext` | Không ghi chữ lên ảnh bằng ffmpeg; đặt tên tệp theo mốc thời gian |
| Tên SFX sai bị bỏ qua không báo | Đếm số SFX `lock-audio.mjs` in ra, so với số khung có `sfx` |
| Mở `assets/lib/three-bundle.js` hay in cả `cues.js` làm đầy ngữ cảnh | Không `cat`, không `grep` hai tệp đó; đọc `cues.js` bằng `node -e` và in đúng khung cần |
| Khoá Gemini lọt vào log | Mọi lệnh gọi Gemini đi qua `sed -E 's/(AIza|key=)[A-Za-z0-9_-]+/\1***/g'` |
