# Kiểm tra và báo cáo

Agent không nghe được âm thanh và không xem được chuyển động. Mọi phép kiểm dưới đây thay cho hai việc đó bằng số đo, phép tính và ảnh tĩnh. Báo cáo cuối phải nói rõ phần nào đã kiểm bằng cách nào, phần nào chưa.

Các lệnh chạy trong thư mục dự án (`$P`). `hyperframes` là `npx -y hyperframes` khi CLI không có trên PATH.

## 1. Thứ tự kiểm

| Lúc nào | Kiểm gì | Đạt khi |
|---|---|---|
| Sau khi viết `SCRIPT.md` | `node scripts/scan-words.mjs`; `node scripts/voice.mjs request` (đếm âm tiết) | `clean`; số âm tiết trong ngân sách (`series.md` §3) |
| Sau khi viết `SCRIPT.md` | Soát tay từng dòng Chốt, danh sách đánh số, con số, chữ rào đón với tệp bài | không thêm, không bớt, đúng thứ tự, đúng số |
| Sau `voice.mjs align` | Danh sách "heard differently" | mỗi chỗ đã được xem: whisper viết sai chính tả thì bỏ qua; thiếu chữ, sai thuật ngữ, sai số thì `voice.mjs run NN` lại |
| Sau mỗi lần sửa `beats.js`, `world.js`, `widgets.js` | `node scripts/bench-check.mjs`; `node scripts/bench-shots.mjs try 3 "<khung:giây,…>"` | 0 error, 0 NaN; ảnh đúng ý |
| Sau `assemble.sh` | `check-frames.sh` (tự chạy), `scan-words.mjs`, `bench-check.mjs`, `mix-balance.mjs`, `hyperframes lint`, `npm run check` | `frames OK`; `clean`; nhạc dưới giọng khoảng 12 dB; 0 error; "Check passed" |
| Sau `assemble.sh` | Hai bộ contact sheet `mid` và `late`, rồi ảnh chụp thêm (§2) | danh sách ở §2 |
| Sau khi render | Số đo MP4 và ảnh trích từ MP4 so với ảnh chụp | `vi-explainer-video/SKILL.md` bước 10 |

Sửa xong một lỗi thì chạy lại các phép kiểm phía sau nó, không chỉ phép đã báo lỗi. `npm run check` và render mất vài phút mỗi lần: gom các sửa đổi lại rồi mới chạy.

## 2. Ảnh phải đọc

Hai bộ bắt buộc, của cả hình lẫn chữ:

```bash
bash scripts/snap.sh mid  "$(node scripts/frame-times.mjs mid)"      # giữa mỗi khung
bash scripts/snap.sh late "$(node scripts/frame-times.mjs late)"     # 0,35 giây trước khi hết khung
```

Read từng `snapshots/<tên>/contact-sheet-*.jpg`. Ở mỗi ảnh:

- hình nằm trong x 720–1860 và trên y 850; không có khung đen hay trống; thứ lời đọc đang nói tới là thứ sáng nhất trên bàn máy;
- cột chữ nằm trong x 64–620 và trên y 880; dấu tiếng Việt không bị cắt; chữ không tràn thẻ; không gì lấn vào vùng phụ đề;
- thanh ba bước chỉ đúng bước của khung; nhãn mục đúng tên ý;
- chữ trên thẻ khớp lời đọc; danh sách đúng số và thứ tự của bài; mọi nhãn trên hình là thuật ngữ của bài;
- màu đúng nghĩa (`bench.md` §3); dấu đúng, dấu sai chỉ có ở khung "dễ nhầm";
- ảnh `late`: mọi thẻ của khung đã vào đủ.

Ảnh chụp thêm. Riêng bàn máy thì `bench-shots.mjs` nhanh hơn nhiều (không cần lắp ráp); cả hình lẫn chữ thì `snap.sh <tên> "<giây,…>"`:

| Chụp | Lúc nào | Tìm gì |
|---|---|---|
| Mỗi hình | lúc vừa hiện đủ | nằm đúng chỗ, không đè hình khác, không chạm dải bảng phía trên |
| Mỗi nhãn | lúc nó sáng | nhãn chỉ đúng bộ phận, đọc được ở ảnh thu nhỏ, không đè nhãn khác |
| Mỗi lần hình đổi trạng thái | 0,3 s trước và 0,6 s sau mốc | khác nhau rõ trên ảnh, và khác đúng lúc lời đọc nói |
| Khung định nghĩa | lúc chữ cuối đã sáng | câu đủ từng vế, thuật ngữ đúng màu, viền tím nhạt đang sáng |
| Bảng (`widgets.js`) | mỗi ô lúc nó vừa hiện | chữ không tràn ô, ô đang đọc là ô sáng |
| Một vùng nhỏ nghi có lỗi | `hyperframes snapshot --at <t> --zoom "x,y,w,h" --zoom-scale 2 -o snapshots/zoom` | chữ sát mép thẻ, dấu câu sau ô sáng |

## 3. Kết quả đã biết là báo nhầm

| Kết quả | Vì sao bỏ qua được |
|---|---|
| `lint`: 1 warning `composition_file_too_large` | Khung do script sinh, CSS chung lặp lại ở mỗi tệp |
| `check`: info `content_overlap` giữa phần tử của hai khung liền nhau, quanh điểm chuyển khung | Hai khung chồng nhau khi crossfade. Vẫn nhìn ảnh `late` để xác nhận |
| `check`: cảnh báo tương phản trên một cụm `hl` đúng lúc `PILL` đang đổi màu | Ảnh rơi vào giữa 0,3 giây chuyển màu của ô sáng. Chụp lại sau đó 0,5 giây để xác nhận chữ đọc được |
| `check`: cảnh báo phụ đề lệch 1–4 px (`caption-word`, `caption-line`) | Sai số làm tròn của skin phụ đề |

Không bỏ qua: `content_overlap` kéo dài hàng chục giây (một khung rò sang khung sau, `vi-explainer-video/references/pitfalls.md` mục 35); cảnh báo tương phản trên chữ đứng yên; mọi error.

## 4. Kiểm sau khi sửa `kit/`

Sửa bất kỳ tệp nào của `kit/`, hay của `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit/` mà skill này mượn, thì ví dụ Bài 1 phải ra đúng như trước. Dựng lại ví dụ trong một dự án tạm, mượn âm thanh và mốc của video đã làm để không tạo lại giọng:

```bash
ROOT=$(git rev-parse --show-toplevel); T=$ROOT/projects/sat-hach-lai-xe/videos/chuong-4-bai-01-dong-co; P=$ROOT/projects/sat-hach-lai-xe/videos/chuong-4-kit-check
rm -rf "$P" && bash "$ROOT"/.claude/skills/chuong-4-cau-tao-va-sua-chua-video/scripts/new-project.sh chuong-4-kit-check     # ghi lại dòng HF:
for f in assets/voice assets/bgm assets/sfx; do rm -rf "$P/$f"; cp -R "$T/$f" "$P/$f"; done
for f in assets/lib/world/cues.js audio_meta.json audio_engine_meta.json audio_request.json caption-overrides.json .hyperframes/whisper_words.json .hyperframes/bgm_status.json; do cp "$T/$f" "$P/$f"; done
(cd "$P" && node scripts/build-frames.mjs && node scripts/build-storyboard.mjs && node scripts/lock-audio.mjs --bgm 0.3)
(cd "$P" && node "$FX"/audio.mjs sync-durations --storyboard ./STORYBOARD.md --audio-meta ./audio_meta.json --hyperframes .)
(cd "$P" && HF="$HF" bash scripts/assemble.sh --captions)
```

So với video đã làm:

```bash
diff -rq "$T/compositions/frames" "$P/compositions/frames"                    # không in gì: khung giống từng byte
for f in STORYBOARD.md index.html compositions/captions.html; do cmp "$T/$f" "$P/$f"; done   # không in gì
(cd "$P" && node scripts/scan-words.mjs && node scripts/bench-check.mjs)
```

Số của lần đóng gói skill (2026-10-12): 21 khung giống từng byte; `STORYBOARD.md`, `index.html` và phụ đề giống từng byte; `scan-words` `clean (31 files, 1555 text lines)`; và

```
bench: 6862 renders over 343.05s, 0 error(s), 0 call(s) given a NaN
fingerprint 889487f1843520e1
```

- **Sửa không nhằm đổi hình:** dấu vân tay phải đúng `889487f1843520e1` (nó băm mọi lệnh vẽ của mọi lần dựng hình), và `diff` không in gì.
- **Sửa có chủ ý đổi hình:** `node scripts/bench-check.mjs --frames` ở cả hai bên cho biết khung nào đổi; chụp các khung đó bằng `bench-shots.mjs` và đọc ảnh để xác nhận chỉ thứ muốn đổi đã đổi. Ghi dấu vân tay mới vào mục này.
- **Thiếu `projects/sat-hach-lai-xe/videos/chuong-4-bai-01-dong-co`** (máy khác): tạo lại giọng cho ví dụ theo bước 4–8 của `SKILL.md`. Mốc sẽ khác, nên dấu vân tay cũng khác; khi đó chỉ so được bằng mắt.

Xong thì xoá `projects/sat-hach-lai-xe/videos/chuong-4-kit-check`.

## 5. Bản gửi qua kênh giới hạn dung lượng

Bản 1080p của Bài 1 nặng 76 MB, quá giới hạn 30 MiB của một số kênh gửi tệp. Bản 720p hai lượt cho video 343 giây ra 26,1 MB:

```bash
ffmpeg -hide_banner -v error -y -i renders/video.mp4 -vf scale=1280:-2 -c:v libx264 -preset slow -b:v 500k -pass 1 -passlogfile "$TMPDIR/ctsc" -an -f null /dev/null
ffmpeg -hide_banner -v error -y -i renders/video.mp4 -vf scale=1280:-2 -c:v libx264 -preset slow -b:v 500k -pass 2 -passlogfile "$TMPDIR/ctsc" -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k renders/video-preview.mp4
ls -l renders/video-preview.mp4
```

Video dài khác thì tính lại: `b:v ≈ (dung lượng đích tính bằng kbit ÷ số giây) − 96`. Kiểm dung lượng thật trước khi gửi. Bản này chỉ để xem nhanh; bản xuất bản là `renders/video.mp4`.

## 6. Mẫu báo cáo

Viết bằng tiếng Việt, cho người dùng.

```markdown
**Kết quả:** projects/sat-hach-lai-xe/videos/<tên dự án>/renders/video.mp4 — 1920×1080, 30 fps, <thời lượng>, <dung lượng>.

**Phạm vi:** Bài <N> · <tên bài>, ý <…>. <Số> khung, <số> âm tiết lời đọc. Ý để lại cho phần sau: <…> vì <…>.

**Đối chiếu brief:** <số> dòng Chốt giữ nguyên văn / nói gọn ở <…>; danh sách đánh số: <…>; con số: <…>; chữ rào đón: <…>. Chỗ brief thiếu hay chưa chắc: <…>.

**Lựa chọn minh hoạ:** <hình vẽ ra điều gì mà bài không quy định>; nhãn cố ý không đặt: <…>.

**Giọng đọc:** Gemini <tên giọng>, <số> đoạn; chỗ whisper nghe khác kịch bản: <…>.

**Âm thanh:** <LUFS>, true peak <dBFS>; nhạc dưới giọng <dB>; <số> SFX.

**Tài sản:** dùng lại <…>; vẽ mới <…>.

**Đã kiểm:**
- nội dung: từng dòng Chốt, danh sách, con số và chữ rào đón so với tệp bài: khớp; scan-words: clean;
- bàn máy: bench-check 0 lỗi, 0 NaN; <số> ảnh bàn máy;
- hình và chữ: <số> contact sheet, <số> ảnh chụp thêm;
- lint 0 lỗi; check passed (<các cảnh báo, đều là báo nhầm đã biết>); blackdetect 0; ảnh trích từ MP4 khớp ảnh chụp.

**Chưa kiểm:**
- chưa nghe âm thanh: cách phát âm, ngữ điệu, độ hợp của nhạc;
- chưa xem chuyển động: độ mượt, nhịp;
- phần "vì sao" do người soạn bài viết, mới được AI soát; chưa có giáo viên dạy lái xe hay người có chuyên môn nào đọc duyệt bộ bài này<; bài này có chỗ README nêu là kém chắc: …>.

**Chọn mặc định:** <những gì brief không nói mà agent tự chọn>.

**Mới thêm vào skill:** <thứ đã chuyển về kit/, kết quả phép kiểm §4> hoặc "không".
```

Sau báo cáo, cập nhật cột trạng thái ở `series.md` §4 và thêm một dòng vào §6.

## 7. Lỗi đã gặp

Mỗi dòng là một lỗi có thật khi làm video Bài 1 hoặc khi đóng gói skill.

### Hình và chữ

| Lỗi | Nguyên nhân | Cách tránh |
|---|---|---|
| Dấu phẩy sau một cụm tô sáng rơi xuống đầu dòng sau | Ô sáng là `inline-block` | `hlp(id, "cụm từ", ",")` |
| Con trỏ của thanh bốn hành trình đè lên đỉnh bugi khoảng một giây ở ranh giới nén và cháy | Dải bảng phía trên và hình xi lanh sát nhau | Chưa sửa ở Bài 1. Hình cao thì hạ `P0.y` hoặc giảm `k`, rồi chụp lúc con trỏ đi qua |
| Số đang đọc trông như "nhiên liệu" | Trạng thái `hot` của vòng số là hổ phách | Dùng `tone(…, "idle", "on")`: `on` của chương là tím |
| Viền thẻ ra màu hổ phách | `ring(id)` không có lớp | `ring(id, "def")`, `"ok"` hay `"no"` |
| Cột chữ đầy, thẻ cuối chạm vùng phụ đề | Quá nhiều thẻ dưới thanh ba bước | Chia khung trong `SCRIPT.md` (`frames.md` §1) |
| Hình trên bàn máy lấn sang cột chữ khi phóng to | Phóng to quanh một điểm đẩy mép trái của hình ra ngoài x 720 | Vẽ dải che mờ dần ở mép trái trong lúc phóng to, như `draw(t)` của ví dụ |

### Mốc và dữ liệu

| Lỗi | Cách tránh |
|---|---|
| Đếm âm tiết bằng `wc -w` ra 974 thay vì 924 | `wc -w` của macOS tách một chữ ở "à". Đếm bằng `node scripts/voice.mjs request` |
| `align` chạy lần hai sau `pad` cho mốc khác lần đầu | Đã sửa trong `voice.mjs`: mốc đã nghe được giữ trong độ dài tệp lúc mới tạo. Sau khi tạo lại một dòng vẫn phải chạy đủ `align`, `pad`, `build-cues.mjs` |
| `audio_engine_meta.json` thiếu các khoá đầu tệp khi chỉ chạy lại vài dòng | Đã sửa trong `voice.mjs`. Không tự viết tệp này bằng tay |
| Cụm từ lặp trong một khung trả về mốc của lần đầu | `{ nth: 2 }` |
| `cue not found: frame N "…"` | Cụm phải khớp từng chữ với lời đọc trong `SCRIPT.md`, kể cả dấu |
| `frame n: X cue words for the Y words of "…"` | Lời đọc của khung định nghĩa khác hằng của dòng Chốt. Hai nơi phải giống nhau từng chữ |
| Mốc cộng trừ rơi ra ngoài khung | Bọc bằng `tt(...)`; `ctx(n).r` và `ctx(n).a` ném lỗi khi mốc gốc không thuộc khung |
| Sửa giọng xong hình lệch lời | `build-cues.mjs`, rồi `build-storyboard.mjs`, `sync-durations`, `assemble.sh` |
| `scan-words` báo một con số thật của bài trong dải 264–300 | Sửa danh sách cấm trong `scripts/scan-words.mjs` của dự án và ghi vào báo cáo |

### Công cụ

| Lỗi | Cách tránh |
|---|---|
| Gemini từ chối khi gửi quá 10 yêu cầu một phút | `voice.mjs run` đã chia lượt 7 dòng và nghỉ 66 giây. Chạy nền, đừng chạy hai lệnh cùng lúc |
| Nhập `frames.kit.mjs` ngay trong `kit/` của skill báo không thấy `cues.js` | `kit/` không phải một dự án. Thử trong dự án tạm (§4) |
| Chrome không tự thoát sau khi chụp ảnh bàn máy | `bench-shots.mjs` tự dừng nó khi ảnh đã ghi xong. Mốc sai thì lệnh thoát với mã 2 |
| zsh không tách chữ trong biến (`$CLI lint` báo `command not found`) | Gõ thẳng `npx -y hyperframes …` |
| zsh hiểu một chữ bắt đầu bằng `=` là tên lệnh, và dừng khi glob không khớp | Để trong ngoặc kép |
| Lệnh `cd` trần làm lệch thư mục của các lệnh sau | `(cd "$P" && …)` |
| ffmpeg trên máy không có bộ lọc `drawtext` | Không ghi chữ lên ảnh bằng ffmpeg; đặt tên tệp theo mốc |
| Tên SFX sai bị bỏ qua không báo | Đếm số SFX `lock-audio.mjs` in ra, so với số khung có `sfx` |
| In cả `cues.js` làm đầy ngữ cảnh | Không `cat`; đọc bằng `node -e` và in đúng khung cần |
| Khoá Gemini lọt vào log | `voice.mjs` tự che. Lệnh nhạc nền đi qua `sed` như ở bước 5 của `SKILL.md` |
| Bản 1080p không gửi được qua kênh 30 MiB | Bản 720p ở §5 |
| Độ to ra −13,7 LUFS, cao hơn khoảng mục tiêu 0,3 LU | Bài 1 được giữ như vậy. Muốn vào khoảng −14 đến −16 thì hạ `bgm.volume` hoặc âm lượng giọng rồi render lại |
