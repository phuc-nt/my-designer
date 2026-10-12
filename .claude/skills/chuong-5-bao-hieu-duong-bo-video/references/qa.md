# Kiểm tra và báo cáo

Agent không nghe được âm thanh và không xem được chuyển động. Mọi phép kiểm dưới đây thay cho hai việc đó bằng số đo, phép tính và ảnh tĩnh. Báo cáo cuối phải nói rõ phần nào đã kiểm bằng cách nào, phần nào chưa.

Các lệnh chạy trong thư mục dự án (`$P`). `hyperframes` là `npx -y hyperframes` khi CLI không có trên PATH.

## 1. Thứ tự kiểm

| Lúc nào | Kiểm gì | Đạt khi |
|---|---|---|
| Trước khi vẽ biển mới | Read ảnh tham khảo `images/crops/cau-<số>.jpg` của từng biển | đã ghi vào Notes của `BRIEF.md` ảnh nào đã xem |
| Sau khi viết `SCRIPT.md` | `node scripts/scan-words.mjs`; `node scripts/voice.mjs request` (đếm âm tiết) | `clean`; số âm tiết trong ngân sách (`series.md` §3) |
| Sau khi viết `SCRIPT.md` | Soát tay từng dòng Chốt, tên biển, tên xe, con số và chữ trên biển, chữ rào đón với tệp bài | không thêm, không bớt, đúng từng chữ |
| Sau `voice.mjs align` | Danh sách "heard differently" | mỗi chỗ đã được xem: whisper viết sai chính tả thì bỏ qua; thiếu chữ, sai tên xe, sai số thì `voice.mjs run NN` lại |
| Sau mỗi lần sửa `beats.js`, `world.js`, `signs.js`, `vehicles.js`, `street.js` | `node scripts/bench-check.mjs`; `node scripts/bench-shots.mjs` ở vài mốc | 0 error, 0 NaN; ảnh đúng ý |
| Sau `assemble.sh` | `check-frames.sh` (tự chạy), `scan-words.mjs`, `bench-check.mjs`, `mix-balance.mjs`, `hyperframes lint`, `npm run check` | `frames OK`; `clean`; nhạc dưới giọng khoảng 12 dB; 0 error; "Check passed" |
| Sau `assemble.sh` | Hai bộ contact sheet `mid` và `late`, rồi ảnh chụp thêm (§2) | danh sách ở §2 |
| Sau khi render | Số đo MP4 và ảnh trích từ MP4 so với ảnh chụp | `vi-explainer-video/SKILL.md` bước 10 |

Sửa xong một lỗi thì chạy lại các phép kiểm phía sau nó. `npm run check` và render mất vài phút mỗi lần: gom các sửa đổi lại rồi mới chạy. **Người dùng theo dõi chi phí:** khi chỉ đóng gói hay chuyển thứ đã duyệt về `kit/`, chỉ chạy phép kiểm ở §3, không dựng và render lại.

Kết quả của `lint` và `check` đã biết là báo nhầm: như bảng ở `.claude/skills/chuong-4-cau-tao-va-sua-chua-video/references/qa.md` §3.

## 2. Ảnh phải đọc

Đọc (Read) từng contact sheet; không suy ra từ việc lệnh chạy không lỗi.

**Tấm biển** (quan trọng nhất của chương, vì hình của biển là kiến thức):

- Dáng, màu viền, màu nền, hình bên trong đúng lời tả của bài và ảnh tham khảo. Gạch chéo đi từ trên trái xuống dưới phải. Hình xe quay đúng bên.
- Con số, chữ trên biển đúng từng ký tự.
- Mỗi biển mới có ít nhất **một ảnh phóng to** (`hyperframes snapshot --at <t> --zoom "x,y,w,h" --zoom-scale 2 -o snapshots/zoom`), đặt cạnh ảnh tham khảo. Bài có chi tiết README nêu là dễ vẽ lệch (`series.md` §1) thì phóng to đúng chi tiết đó.
- Không biển nào được đánh số, không mã biển.

**Xe và kết luận** (ảnh `late` là ảnh quyết định):

- Ở cuối mỗi khung "xe nào, vì sao" và mỗi khung của bảng: **mỗi xe bài có kết luận đều đã có dấu**, đúng ✓ hay ✕ theo dòng Chốt; xe bị cấm đứng bên trái vạch, xe được đi đã qua cột biển.
- Lập bảng xe × biển từ dòng Chốt trước khi nhìn ảnh, rồi dò từng ô. Không xe nào có dấu mà bài không nói tới.
- Tên xe dưới xe đúng tên của bài; không tên nào đè lên xe bên cạnh, lên dấu, hay lên vạch dừng.
- Khung cuối: mỗi thẻ bước còn đủ đường chỉ và thứ nó chỉ vào (viền, hình, chiếc xe đang chờ).

**Cột chữ:**

- Ảnh `late`: mọi thẻ đã đủ dòng (thẻ trống là thiếu `rowIn`), thẻ cuối kết thúc trên y = 880, không thẻ nào lấn sang con phố (x > 640).
- Thẻ Chốt: nguyên câu của bài, đã sáng hết ở ảnh `late`; cụm tô màu đúng loại (đỏ cho điều bị cấm, xanh cho điều được làm, hổ phách cho chữ rào đón).
- Dấu tiếng Việt không bị cắt; dấu câu không rơi xuống đầu dòng.
- Thanh các bước: đúng bước đang bật ở từng khung cách đọc.

**Khớp giữa hai lớp:** ở ảnh `mid`, thứ đang sáng trên phố và dòng đang hiện trên thẻ nói cùng một điều.

## 3. Kiểm sau khi sửa `kit/`

Sửa bất kỳ tệp nào của `kit/`, hay của hai bộ mà skill này mượn (`chuong-6-…/kit/`, và các tệp chép từ `chuong-4-…/kit/`), thì ví dụ Bài 1 phải ra đúng như trước. Dựng lại phần hình và phần chữ của ví dụ trong một dự án tạm, mượn mốc của video đã làm; không tạo giọng, không lắp ráp, không render:

```bash
ROOT=$(git rev-parse --show-toplevel); T=$ROOT/videos/chuong-5-bai-01-bien-cam-o-to-va-bien-cam-mo-to; P=$ROOT/videos/chuong-5-kit-check
rm -rf "$P" && bash "$ROOT"/.claude/skills/chuong-5-bao-hieu-duong-bo-video/scripts/new-project.sh chuong-5-kit-check
for f in assets/lib/world/cues.js audio_meta.json audio_engine_meta.json audio_request.json caption-overrides.json .hyperframes/whisper_words.json .hyperframes/bgm_status.json; do cp "$T/$f" "$P/$f"; done
(cd "$P" && node scripts/build-frames.mjs | tail -1 && node scripts/build-storyboard.mjs | tail -1)
n=0; for f in "$P"/compositions/frames/*.html; do d=$(diff "$T/compositions/frames/$(basename "$f")" "$f" | grep '^[<>]' | grep -v 'id="root"' | wc -l); n=$((n+d)); done; echo "frame lines differing: $n"
diff "$T/STORYBOARD.md" "$P/STORYBOARD.md" | grep '^[<>]' | grep -vc 'status:'
(cd "$P" && node scripts/scan-words.mjs | tail -1 && node scripts/bench-check.mjs | tail -2)
rm -rf "$P"
```

Hai chỗ khác được phép: dòng `id="root"` của mỗi khung (bước lắp ráp ghi lại `data-duration` có cộng phần chuyển cảnh) và dòng `status:` của storyboard (`outline` trước khi lắp ráp).

Số của lần đóng gói skill (2026-10-12): 22 khung, `frame lines differing: 0`; storyboard khác 0 dòng ngoài `status:`; `scan-words` `clean (31 files, 847 text lines)`; và

```
bench: 6984 renders over 349.2s, 0 error(s), 0 call(s) given a NaN
fingerprint b0cf0f25246fc150
```

- **Sửa không nhằm đổi hình:** dấu vân tay phải đúng `b0cf0f25246fc150` (nó băm mọi lệnh vẽ của mọi lần dựng hình) và hai phép đếm phải ra 0.
- **Sửa có chủ ý đổi hình** (ví dụ `sheet` nhận dáng biển mới): `node scripts/bench-check.mjs --frames` ở cả hai bên cho biết khung nào đổi. Với một thay đổi chỉ thêm dáng, không khung nào của Bài 1 được đổi. Nếu có khung đổi theo ý muốn, chụp bằng `bench-shots.mjs`, đọc ảnh, rồi ghi dấu vân tay mới vào mục này.
- **Thiếu dự án Bài 1** (máy khác): tạo lại giọng cho ví dụ theo các bước của `SKILL.md`. Mốc sẽ khác nên dấu vân tay cũng khác; khi đó chỉ so được bằng mắt.

Phép này không kiểm âm thanh, phụ đề, `lint`, `check` hay render: các tệp của những bước đó là script mượn, không sửa ở đây.

## 4. Bản gửi qua kênh giới hạn dung lượng

Bản 1080p của một video gần 6 phút vượt giới hạn 30 MiB của một số kênh gửi tệp. Bản 720p hai lượt:

```bash
ffmpeg -hide_banner -v error -y -i renders/video.mp4 -vf scale=1280:-2 -c:v libx264 -preset slow -b:v 500k -pass 1 -passlogfile "$TMPDIR/sign" -an -f null /dev/null
ffmpeg -hide_banner -v error -y -i renders/video.mp4 -vf scale=1280:-2 -c:v libx264 -preset slow -b:v 500k -pass 2 -passlogfile "$TMPDIR/sign" -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 112k renders/video-preview.mp4
ls -l renders/video-preview.mp4
```

Video dài khác thì tính lại: `b:v ≈ (dung lượng đích tính bằng kbit ÷ số giây) − 112`. Kiểm dung lượng thật trước khi gửi. Bản này chỉ để xem nhanh; bản xuất bản là `renders/video.mp4`.

## 5. Mẫu báo cáo

Viết bằng tiếng Việt, cho người dùng.

```markdown
**Kết quả:** videos/<tên dự án>/renders/video.mp4 — 1920×1080, 30 fps, <thời lượng>, <dung lượng>.

**Phạm vi:** Bài <N> · <tên bài>, ý <…>. <Số> khung, <số> âm tiết lời đọc. Ý để lại cho phần sau: <…> vì <…>.

**Đối chiếu brief:** <số> dòng Chốt giữ nguyên văn (đặt sớm hơn / tách hai khung ở <…>); tên biển: <…>; con số và chữ trên biển: <…>; chữ rào đón: <…>. Chỗ brief thiếu hay chưa chắc: <…>.

**Hình của biển:** <biển nào>, vẽ theo lời tả của bài và đã soát với ảnh tham khảo <tên ảnh>; chi tiết dễ lệch đã phóng to: <…>.

**Cách thể hiện:** <phần nào dùng cách "diễn" nào>; điều hình vẽ ra mà bài không quy định: <…>.

**Giọng đọc:** Gemini <tên giọng>, <số> đoạn; chỗ whisper nghe khác kịch bản: <…>.

**Âm thanh:** <LUFS>, true peak <dBFS>; nhạc dưới giọng <dB>; <số> SFX.

**Tài sản:** dùng lại <…>; vẽ mới <…>.

**Đã kiểm:**
- nội dung: từng dòng Chốt, tên biển, tên xe, con số và chữ rào đón so với tệp bài: khớp; scan-words: clean;
- bảng xe × biển: <số> ô, từng ô đã dò trên ảnh cuối khung;
- con phố: bench-check 0 lỗi, 0 NaN; <số> ảnh;
- hình và chữ: <số> contact sheet, <số> ảnh phóng to biển;
- lint 0 lỗi; check passed (<các cảnh báo, đều là báo nhầm đã biết>); blackdetect 0; ảnh trích từ MP4 khớp ảnh chụp.

**Chưa kiểm:**
- chưa nghe âm thanh: cách phát âm, ngữ điệu, độ hợp của nhạc;
- chưa xem chuyển động: độ mượt, nhịp;
- hình của biển là hình vẽ lại, mới so bằng mắt với ảnh tham khảo, chưa so với quy chuẩn báo hiệu đường bộ;
- phần "vì sao", cách đọc hình và mẹo nhớ do người soạn bài viết, mới được AI soát; chưa có giáo viên dạy lái xe hay người có chuyên môn nào đọc duyệt bộ bài này<; bài này có chỗ README nêu là kém chắc: …>.

**Chọn mặc định:** <những gì brief không nói mà agent tự chọn>.

**Mới thêm vào skill:** <thứ đã chuyển về kit/, kết quả phép kiểm §3> hoặc "không".
```

Sau báo cáo, cập nhật cột trạng thái ở `series.md` §4 và thêm một dòng vào §6.

## 6. Lỗi đã gặp

Lỗi chung của cách dựng (mốc, giọng, công cụ) có ở `.claude/skills/chuong-4-cau-tao-va-sua-chua-video/references/qa.md` §7 và `vi-explainer-video/references/pitfalls.md`. Dưới đây là lỗi đã gặp ở chương này.

### Hình và chữ

| Hiện tượng | Nguyên nhân | Cách sửa |
|---|---|---|
| Thẻ hiện viền và nhãn nhưng không có dòng nào | `row` không có `rowIn` trong danh sách `js` | Mỗi dòng một `rowIn` (hoặc `fade`); xem ảnh `late` của mọi khung |
| Dấu phẩy rơi xuống đầu dòng sau | Dấu câu gõ sau một cụm `hl`, mà cụm đó là `inline-block` | `hlp(id, chữ, ",")` |
| Vạch dừng đè lên bánh xe ở phố xếp chồng | Vạch cao mặc định 20 trong một dải đường thấp | `stopLine(c, x, y, a, 7)` |
| Thẻ bước ở khung cuối chỉ vào chỗ trống | Xe hay biển nó chỉ tới đã bị cho mờ đi ở cuối cảnh | Giữ thứ được chỉ tới cho hết khung; đường chỉ lấy toạ độ từ kết quả của `put` |
| Tên hai xe cạnh nhau đè lên nhau | Xe ngắn đứng sát nhau, tên dài | Tách tên thành hai dòng (`name: ["xe mô tô", "hai bánh"]`), hoặc `nameX` |
| Biển nhảy khi chuyển cảnh trong canvas | Hai cảnh đặt biển ở hai toạ độ khác nhau lúc mờ chéo | Cuối cảnh trước và đầu cảnh sau cùng `x, y, R` |

### Nội dung

| Hiện tượng | Nguyên nhân | Cách sửa |
|---|---|---|
| Storyboard tả một cảnh mà canvas không vẽ | Sửa `world.js` sau khi đã viết `build-storyboard.mjs` | Soát lại `scene` và `sc` của khung đó sau mỗi lần đổi cách "diễn" |
| `rule()` ném lỗi không tìm thấy chữ | Hằng `RULEn` lệch lời đọc của khung một chữ hay một dấu | Sửa cho hai bên trùng nhau, theo đúng dòng Chốt của bài |
| Một xe có dấu ✓ mà bài không kết luận | Cho cả hàng xe chạy qua cho "đủ bộ" | Chỉ xe nào dòng Chốt hay phần giảng nêu mới tới biển |

### Công cụ

| Hiện tượng | Nguyên nhân | Cách sửa |
|---|---|---|
| `scan-words.mjs` báo sai hoặc bỏ sót quanh chuỗi có dấu nháy | Biểu thức tách chuỗi của bản cũ | Bản trong `kit/` của skill này đã sửa (khớp cặp nháy trước). Bản trong `kit/` của ba chương kia chưa sửa |
| `scan-words.mjs` chặn một con số thật của bài | Số đó rơi vào dải số câu của chương (301–485) | Sửa danh sách cấm trong dự án cho bài đó, ghi vào báo cáo |
| `wc -w` đếm dư âm tiết | macOS tách chữ tại "à" | `node scripts/voice.mjs request` |
| `tr` báo `Illegal byte sequence` khi lọc log | Log có ký tự UTF-8 | `LC_ALL=C tr …` |
| Độ to −13,8 LUFS, cao hơn đích −14 một chút | Nhạc đặt 0,35 theo `mix-balance` | Chấp nhận khi true peak ≤ −1 dBFS; ghi số đo vào báo cáo |
