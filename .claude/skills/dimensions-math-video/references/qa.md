# Kiểm tra, đo và báo cáo

Agent không nghe được âm thanh và không xem được chuyển động. Agent chỉ kiểm được ảnh tĩnh, bản whisper nghe lại, các con số của ffmpeg và kết quả của `bench-check`. Kiểm vừa đủ: người dùng để ý chi phí token, nên không chạy lại các vòng kiểm dài khi chỉ đóng gói việc đã duyệt.

Các lệnh dưới đây chạy trong `videos/<du-an>`.

## 1. Bàn vẽ: `bench-check` và `bench-shots`

```bash
node scripts/bench-check.mjs                     # chạy cả bài mỗi 0,05 s trong Node: lỗi, NaN, dấu vân tay
node scripts/bench-shots.mjs mid 4 mid           # snapshots/bench/mid.jpg: giữa mỗi khung, 4 cột
node scripts/bench-shots.mjs late 4 late         # 0,35 s trước cuối mỗi khung
node scripts/bench-shots.mjs f14 3 "14:1.5,14:6,14:11"   # vài lúc trong một khung đang vẽ
```

- `bench-check` phải in `0 error(s), 0 call(s) given a NaN`. Có lỗi thì nó in giây đầu tiên gặp; xem cue của khung đó (§2).
- `bench-shots` chỉ chụp canvas, vài giây, không cần lắp ráp video. Dùng nó khi vẽ. `snap.sh` (ảnh của cả composition) không cần cho bộ này, vì khung không có gì ngoài canvas.

Đọc ảnh `mid` và `late`, mỗi khung hỏi:

| Hỏi | Ảnh `mid` | Ảnh `late` |
|---|---|---|
| Đúng số đồ vật của ví dụ? Đếm từng cái trên ảnh | ✓ | |
| Đồ vật tách bạch, vòng không chạm nhau, bong bóng không che đồ vật khác? | ✓ | ✓ |
| Bàn tay đang ở đúng việc của khung (đang chạm, đang gạt), không che đồ vật đang được nói tới? | ✓ | |
| Vòng và bong bóng đúng màu nghĩa (`canvas.md` §2)? | ✓ | ✓ |
| Cuối khung, mọi thứ của khung đã hiện đủ (vòng đủ số, số đã viết xong)? | | ✓ |
| Không có chữ nào ngoài "?" và chữ số; chữ số chỉ ở chỗ bài cho phép? | ✓ | ✓ |
| Không còn sót hình của cảnh trước, không có khoảng trống giữa hai cảnh? | | ✓ |

Ảnh chụp không cho thấy nhịp: bàn tay chạm có đúng tiếng đếm không thì xem ở §2.

## 2. Giọng và cue

Sau `voice.mjs align`:

- Danh sách "heard differently" là chỗ whisper nghe khác kịch bản. Khác ở tên riêng hay một âm tiết lơ lớ thì bỏ qua. Thiếu cả từ, thừa từ, hay đọc sai số ("bảy" thành "bẩy" vẫn được; "bảy" thành "tám" thì không) thì tạo lại câu đó: `node scripts/voice.mjs run 07`, rồi `align` lại.

Sau `count-onsets.mjs`:

- Mỗi đoạn tiếng đếm in `ok` (đã đặt từng tiếng lên đúng lúc bật ra) hay `found 5 for 6` (số đoạn tiếng nghe được khác số tiếng đếm). Đoạn không khớp giữ mốc cũ, chia đều, nên bàn tay sẽ lệch dần với tiếng.
- `found` ít hơn: hai tiếng dính nhau. Tạo lại câu đó; câu đếm chậm cách nhau bằng dấu chấm ("Một. Hai. Ba."), và lời dặn giọng trong `tts_request.json` đã nói "tiếng đếm cách nhau dấu chấm đọc cách nhau một giây".
- `found` nhiều hơn: có tiếng thở hay tiếng khác giữa hai số. Xem `bursts` mà nó in; thường vẫn dùng được nếu lệch dưới 0,15 s, không thì tạo lại.
- Chạy lại `count-onsets.mjs` sau **mỗi** lần `align`, vì `align` ghi đè mốc thời gian.

Sau `build-cues.mjs`, `bench-check` báo:

- `cue not found: frame N "cụm" #k`: cụm trong `beats.js` không còn đúng với chữ được đọc (sửa SCRIPT.md mà quên `beats.js`, hay `nth` quá số lần cụm ấy xuất hiện).
- `count not found: frame N "x" after t`: `seq` không tìm đủ tiếng đếm sau mốc `from`. Thường do whisper ghi tiếng đếm khác chữ (`1` thay vì `một`), hay `from` đặt sau tiếng đếm đầu.

## 3. MP4: đo, sửa độ to, ảnh

```bash
ffprobe -v error -show_entries format=duration,size:stream=codec_type,width,height,r_frame_rate -of json renders/video.mp4
ffmpeg -hide_banner -nostats -i renders/video.mp4 -vn -af ebur128=peak=true -f null - 2>&1 | grep -E '^ +(I|LRA|Peak):'
ffmpeg -hide_banner -nostats -i renders/video.mp4 -an -vf blackdetect=d=0.1:pix_th=0.05 -f null - 2>&1 | grep -c black_start
```

Yêu cầu: có luồng audio, 1920×1080, thời lượng bằng tổng các khung (sai lệch dưới 0,1 s), `I` từ −14 đến −16 LUFS, `Peak` ≤ −1 dBFS, `black_start` là 0.

Bài 1 ra −13,0 LUFS dù `mix-balance --target 14` đã đặt nhạc dưới giọng 14,1 dB. To hơn mức yêu cầu thì hạ cả bài, giữ nguyên hình:

```bash
ffmpeg -hide_banner -v error -y -i renders/video.mp4 -c:v copy -af volume=-1.5dB -c:a aac -b:a 192k -movflags +faststart renders/video-tmp.mp4 && mv renders/video-tmp.mp4 renders/video.mp4
```

Hạ đúng số dB cần (ví dụ −13,0 → −14,5 là `-1.5dB`), rồi đo lại một lần. Bài 1 sau khi hạ: −14,5 LUFS, peak −3,0.

Ảnh từ MP4 (render chụp hình khác `bench-shots`, nên ảnh bench đúng chưa chứng minh MP4 đúng). Khoảng mười một lúc rải đều, mỗi phần của bài ít nhất một ảnh, trong đó có khung viết chữ số và khung kết; các mốc dưới đây là của Bài 1 (309 s):

```bash
mkdir -p snapshots/mp4 && i=0
for t in 8 40 70 100 130 160 190 220 250 280 300; do
  i=$((i+1)); ffmpeg -v error -y -ss $t -i renders/video.mp4 -frames:v 1 -vf scale=640:-1 "snapshots/mp4/$(printf %02d $i)-$t.png"
done
ffmpeg -v error -y -pattern_type glob -i 'snapshots/mp4/*.png' -vf tile=4x3:padding=6:color=0x202020 -frames:v 1 snapshots/mp4/sheet.jpg
```

Đọc `sheet.jpg`, so với ảnh `mid` của bench ở cùng các lúc: thiếu hình, khác màu, hay khung trắng thì render lại với `--experimental-fast-capture=false`.

## 4. Mẫu báo cáo

```markdown
**Kết quả:** [renders/video.mp4](videos/<du-an>/renders/video.mp4), 1920×1080, <m:ss> (<N> khung), <I> LUFS, peak <P> dBFS, 0 khung đen.

**Phạm vi:** <Bài, tên bài>: mục <…> (khung <…>), Dễ nhầm <…> (khung <…>); để lại <…> vì <…>.

**Đối chiếu brief:** câu Nói với trẻ đọc nguyên văn ở khung <…>. Số lượng giữ đúng ví dụ (<…>) / đổi <…> vì <…>. Từ ngữ theo bảng chung. Brief thiếu hay chưa chắc: <…>.

**Cách diễn bằng hình:** <mỗi ý, mỗi lỗi hiện ra thế nào>. Hình tự chọn khi bài không quy định: <đồ vật, nơi chốn, cách xếp>.

**Tài sản:** dùng lại <…>; vẽ mới <…>; đã chuyển về `kit/`: <…> (dấu vân tay Bài 1 vẫn `550799323e1e7bf7`).

**Âm thanh:** giọng <Leda>, <n> SFX, nhạc nền dưới giọng <d> dB. <Chỗ đã tạo lại giọng, chỗ count-onsets không khớp nếu còn.>

**Đã kiểm:** bench-check 0 lỗi; ảnh bench giữa và cuối mỗi khung; <k> ảnh từ MP4 (sheet: [snapshots/mp4/sheet.jpg](…)).

**Chưa kiểm được:** agent không nghe được âm thanh và không xem được chuyển động: nhịp bàn tay với tiếng đếm, cách đọc, độ to của nhạc cần người xem lại. Câu giải thích "vì sao" và các từ <khung mười ô, đếm xuôi…> chưa có giáo viên duyệt, chưa đối chiếu với sách Toán 1 hiện hành, chưa thử với trẻ.
```

## 5. Sau khi sửa kit: kiểm dấu vân tay của Bài 1

Sửa `kit/assets/lib/world/` (thêm kind, thêm hàm, đổi hàm dùng chung) thì Bài 1 phải vẽ y như cũ. Dự án Bài 1 có sẵn `cues.js` từ giọng thật, nên chạy được `bench-check` mà không tạo giọng:

```bash
ROOT=/Users/phucnt/workspace/my-designer
P="$ROOT/videos/toan-1-chuong-1-bai-01-dem"
cp "$ROOT"/.claude/skills/dimensions-math-video/kit/assets/lib/world/*.js "$P/assets/lib/world/"
cd "$P" && node scripts/bench-check.mjs | tail -1      # phải là: fingerprint 550799323e1e7bf7
```

- Chỉ chép các tệp của kit (`bench.js`, `counting.js`, `draw.js`, `zoo.js`); `world.js`, `beats.js` và `cues.js` của dự án giữ nguyên.
- Khác dấu vân tay: chạy `--frames` trên bản cũ và bản mới để biết khung nào đổi, rồi sửa kit cho tới khi trùng. Chỉ chấp nhận dấu vân tay mới khi thay đổi là cố ý (sửa một lỗi vẽ của Bài 1); khi đó ghi dấu mới vào đây và vào bảng "Đã làm" của `series.md` §6.
- `videos/` không vào git. Máy khác không có dự án Bài 1 thì không kiểm được bằng cách này; ghi điều đó vào báo cáo.

## 6. Những lỗi đã gặp

| Gặp | Cách xử lý |
|---|---|
| Whisper nghe "Một. Hai. Ba." thành một tiếng, mốc chia đều, tay lệch tiếng | `count-onsets.mjs` sau mỗi `align` (§2) |
| `cue not found`, `count not found` | §2 |
| `lint` báo `index.html` quá lớn | Bỏ qua: canvas một tệp, không ảnh hưởng render |
| `mix-balance` báo "Decoding error" với tệp wav của Lyria | Bỏ qua: số đo vẫn đúng |
| MP4 ra −13 LUFS | Hạ độ to (§3) |
| zsh: `echo =====` báo lỗi (`=` mở rộng thành đường dẫn lệnh) | Dùng `printf '=== …\n'` |
| Tách một module ra kit làm hỏng hình | Kiểm import thừa hay thiếu (cả hàm chỉ dùng qua `...along(`); kiểm dấu vân tay (§5) |
| Log của bước nhạc nền có thể chứa khoá API | Lọc qua `sed -E 's/(AIza\|key=)[A-Za-z0-9_-]+/\1***/g; s/[A-Za-z0-9_-]{36,}/<redacted>/g'` |
| Render dài bằng thời lượng video (Bài 1: 5 phút video, khoảng 5,5 phút render) | Chạy nền, đọc `render.log` |
