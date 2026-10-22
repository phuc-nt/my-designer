# Kiểm tra và báo cáo

Agent không nghe được âm thanh và không xem được chuyển động. Mọi phép kiểm dưới đây thay cho hai việc đó bằng số đo, phép tính và ảnh tĩnh. Báo cáo cuối phải nói rõ phần nào đã kiểm bằng cách nào, phần nào chưa.

Các lệnh chạy trong thư mục dự án (`$P`). `hyperframes` là `npx -y hyperframes` khi CLI không có trên PATH.

## 1. Thứ tự kiểm

| Lúc nào | Kiểm gì | Đạt khi |
|---|---|---|
| Sau khi viết `SCRIPT.md` | `node scripts/scan-words.mjs`; `node scripts/voice.mjs request` (đếm âm tiết) | `clean`; số âm tiết trong ngân sách (`series.md` §3) |
| Sau khi viết `SCRIPT.md` | Soát tay từng câu Quy tắc, từng dòng của bảng và danh sách, từng con số với tệp bài | không thêm, không bớt, đúng từng chữ, đúng thứ tự |
| Sau `voice.mjs align` | Danh sách "heard differently" | mỗi chỗ đã được xem: whisper viết sai chính tả thì bỏ qua; thiếu chữ, sai số, mất "không", "hoặc", "chỉ" thì `voice.mjs run NN` lại |
| Sau mỗi lần sửa `beats.js`, `world.js`, `road.js`, `iso.js` | `node scripts/bench-check.mjs`; `node scripts/bench-shots.mjs` ở vài mốc | 0 error, 0 NaN; ảnh đúng ý |
| Sau `assemble.sh` | `check-frames.sh` (tự chạy), `scan-words.mjs`, `bench-check.mjs`, `mix-balance.mjs`, `hyperframes lint`, `npm run check` | `frames OK`; `clean`; nhạc dưới giọng khoảng 12 dB; 0 error; "Check passed" |
| Sau `assemble.sh` | Hai bộ contact sheet `mid` và `late`, rồi ảnh chụp thêm (§2) | danh sách ở §2 |
| Sau khi render | Số đo MP4 và ảnh trích từ MP4 so với ảnh chụp | `vi-explainer-video/SKILL.md` bước 10; độ to theo §4 |

Sửa xong một lỗi thì chạy lại các phép kiểm phía sau nó. `npm run check` và render mất vài phút mỗi lần: gom các sửa đổi lại rồi mới chạy. **Người dùng theo dõi chi phí:** khi chỉ đóng gói hay chuyển thứ đã duyệt về `kit/`, chỉ chạy phép kiểm ở §3, không dựng và render lại.

Kết quả của `lint` và `check` đã biết là báo nhầm: như bảng ở `.claude/skills/chuong-4-cau-tao-va-sua-chua-video/references/qa.md` §3. Thêm ở chương này: `content_overlap` mức thông tin giữa thẻ Quy tắc của hai khung liền nhau trong lúc mờ chéo (cùng một câu, đứng cùng chỗ, vì quy tắc lớn dần qua các khung) là đúng ý.

## 2. Ảnh phải đọc

Đọc (Read) từng contact sheet; không suy ra từ việc lệnh chạy không lỗi.

**Câu luật** (quan trọng nhất của chương, vì chữ của Quy tắc là kiến thức):

- Ảnh `late` của mỗi khung Quy tắc: nguyên câu của bài, đã sáng hết; so từng chữ với bản chép từ tệp bài.
- Quy tắc đi qua nhiều khung: các câu đã đọc còn đủ ở phía trên, đúng thứ tự.
- Danh sách và bảng: đủ mọi dòng, đúng thứ tự của bài, đúng từng con số và đơn vị.
- Cụm tô màu đúng loại: tím nhạt cho phần được gọi tên, đỏ cho cách hiểu sai, xanh lá cho đúng, hổ phách cho cách nhớ.
- Nhãn của thẻ đúng: QUY TẮC chỉ trên câu luật; CÁCH NHỚ, CÁCH HIỂU không nằm trong thẻ Quy tắc.

**Mô hình:**

- Ảnh `mid`: phần đang sáng trên mô hình và cụm đang sáng trong thẻ nói cùng một điều.
- Ảnh `late`: mọi phần mà câu luật của khung đã gọi tên đều đã có mặt; mọi nét gạch của khung Dễ nhầm đã chạy xong, trên mô hình và trong cột chữ.
- Xe gần không bị vật ở xa vẽ đè (thiếu `solid()`); xe không xuyên qua dải phân cách hay hàng rào; bánh xe chạm mặt đường.
- Không nhãn nào đè lên nhãn khác, ra ngoài khung nhìn, hay che thứ nó đang chỉ. Chữ trên canvas từ 20 px.
- Dòng "MÔ HÌNH MINH HOẠ · KHÔNG THEO TỈ LỆ" còn ở góc khung nhìn. Không có con số nào trên mô hình mà bài không nêu.
- Khung trả lời của Thử áp dụng: màu của kết quả (xanh lá, đỏ) khớp với câu trả lời.

**Cột chữ:**

- Ảnh `late`: mọi thẻ đã đủ dòng (thẻ trống là thiếu `rowIn`), thẻ cuối kết thúc trên y = 880, không thẻ nào lấn sang khung nhìn (x > 640).
- Hàng chấm của tiêu đề mục: đúng mục đang bật ở từng khung.
- Dấu tiếng Việt không bị cắt; dấu câu không rơi xuống đầu dòng.
- Phụ đề: một dòng; nhóm nào xuống hai dòng thì ghi vào báo cáo (Bài 1 có một nhóm 11 âm tiết ở khoảng 3:29).

## 3. Kiểm sau khi sửa `kit/`

Sửa bất kỳ tệp nào của `kit/`, hay của hai bộ mà skill này mượn (`chuong-6-…/kit/`, và các tệp chép từ `chuong-4-…/kit/`), thì ví dụ Bài 1 phải ra đúng như trước. Dựng lại phần hình và phần chữ của ví dụ trong một dự án tạm, mượn mốc của video đã làm; không tạo giọng, không lắp ráp, không render:

```bash
ROOT=$(git rev-parse --show-toplevel); T=$ROOT/videos/chuong-1-bai-01-con-duong-gom-nhung-phan-nao; P=$ROOT/videos/chuong-1-kit-check
rm -rf "$P" && bash "$ROOT"/.claude/skills/chuong-1-quy-dinh-chung-va-quy-tac-giao-thong-video/scripts/new-project.sh chuong-1-kit-check
for f in assets/lib/world/cues.js audio_meta.json audio_engine_meta.json audio_request.json caption-overrides.json .hyperframes/whisper_words.json .hyperframes/bgm_status.json; do cp "$T/$f" "$P/$f"; done
(cd "$P" && node scripts/build-frames.mjs | tail -1 && node scripts/build-storyboard.mjs | tail -1)
n=0; for f in "$P"/compositions/frames/*.html; do d=$(diff "$T/compositions/frames/$(basename "$f")" "$f" | grep '^[<>]' | grep -v 'id="root"' | wc -l); n=$((n+d)); done; echo "frame lines differing: $n"
diff "$T/STORYBOARD.md" "$P/STORYBOARD.md" | grep '^[<>]' | grep -vc 'status:'
(cd "$P" && node scripts/scan-words.mjs | tail -1 && node scripts/bench-check.mjs | tail -2)
rm -rf "$P"
```

Hai chỗ khác được phép: dòng `id="root"` của mỗi khung (bước lắp ráp ghi lại `data-duration` có cộng phần chuyển cảnh) và dòng `status:` của storyboard (`outline` trước khi lắp ráp).

Số của lần đóng gói skill (2026-10-12): 21 khung, `frame lines differing: 0`; storyboard khác 0 dòng ngoài `status:`; `scan-words` `clean (29 files, 827 text lines)`; và

```
bench: 4717 renders over 235.85s, 0 error(s), 0 call(s) given a NaN
fingerprint 451f439fef90658a
```

- **Sửa không nhằm đổi hình:** dấu vân tay phải đúng `451f439fef90658a` (nó băm mọi lệnh vẽ của mọi lần dựng hình) và hai phép đếm phải ra 0.
- **Sửa có chủ ý đổi hình** (ví dụ `vehicle` nhận thêm một loại xe, hay thêm tham số góc): `node scripts/bench-check.mjs --frames` ở cả hai bên cho biết khung nào đổi. Với một thay đổi chỉ thêm, không khung nào của Bài 1 được đổi. Nếu có khung đổi theo ý muốn, chụp bằng `bench-shots.mjs`, đọc ảnh, rồi ghi dấu vân tay mới vào mục này.
- **Thiếu dự án Bài 1** (máy khác): tạo lại giọng cho ví dụ theo các bước của `SKILL.md`. Mốc sẽ khác nên dấu vân tay cũng khác; khi đó chỉ so được bằng mắt.

Phép này không kiểm âm thanh, phụ đề, `lint`, `check` hay render: các tệp của những bước đó là script mượn, không sửa ở đây.

## 4. Độ to và bản gửi qua kênh giới hạn dung lượng

**Độ to ngoài khoảng −14 đến −16 LUFS:** chỉnh riêng luồng âm thanh, giữ nguyên hình, không render lại. Bài 1 render ra −13,0 LUFS; hạ 1,6 dB thành −14,6 LUFS, true peak −3,0 dBFS:

```bash
ffmpeg -hide_banner -v error -y -i renders/video.mp4 -c:v copy -af volume=-1.6dB -c:a aac -b:a 192k renders/video-fixed.mp4 && mv renders/video-fixed.mp4 renders/video.mp4
ffmpeg -hide_banner -nostats -i renders/video.mp4 -vn -af ebur128=peak=true -f null - 2>&1 | grep -E '^ +(I|LRA|Peak):'
```

Số dB cần hạ = độ to đo được − (−14,6). Đo lại sau khi chỉnh và ghi cả hai số vào báo cáo.

**Bản xem thử 720p** cho kênh giới hạn 30 MiB (bản 1080p của Bài 1 khoảng 100 MB):

```bash
ffmpeg -hide_banner -v error -y -i renders/video.mp4 -vf scale=1280:-2 -c:v libx264 -preset slow -b:v 700k -pass 1 -passlogfile "$TMPDIR/law" -an -f null /dev/null
ffmpeg -hide_banner -v error -y -i renders/video.mp4 -vf scale=1280:-2 -c:v libx264 -preset slow -b:v 700k -pass 2 -passlogfile "$TMPDIR/law" -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 112k renders/video-preview.mp4
ls -l renders/video-preview.mp4
```

`b:v ≈ (dung lượng đích tính bằng kbit ÷ số giây) − 112`; 700k hợp với video 4 phút, video dài hơn thì tính lại. Kiểm dung lượng thật trước khi gửi. Bản này chỉ để xem nhanh; bản xuất bản là `renders/video.mp4`.

## 5. Mẫu báo cáo

Viết bằng tiếng Việt, cho người dùng.

```markdown
**Kết quả:** videos/<tên dự án>/renders/video.mp4 — 1920×1080, 30 fps, <thời lượng>, <dung lượng>.

**Phạm vi:** Bài <N> · <tên bài>, mục <…>, <số> tình huống Thử áp dụng. <Số> khung, <số> âm tiết lời đọc. Mục để lại: <…> vì <…>, hoặc "không".

**Đối chiếu brief:** <số> câu Quy tắc đọc nguyên văn (câu đã rút gọn: <…>; câu tách nhiều khung: <…>); bảng và danh sách: <…>, đủ dòng, đúng thứ tự; con số: <…>; thứ tự đã đổi trong mục: <…>. Chỗ brief thiếu hay nguồn không nói: <…>.

**Cách thể hiện:** <mục nào dùng mẫu cảnh nào>; lựa chọn minh hoạ, tức điều hình vẽ ra mà bài không quy định: <…>; điều cố ý không vẽ: <…>.

**Giọng đọc:** Gemini <tên giọng>, <số> đoạn; chỗ whisper nghe khác kịch bản: <…>.

**Âm thanh:** <LUFS> (render ra <LUFS>, đã chỉnh <dB>), true peak <dBFS>; nhạc dưới giọng <dB>; <số> SFX.

**Tài sản:** dùng lại <…>; vẽ mới <…>.

**Đã kiểm:**
- nội dung: từng câu Quy tắc, từng dòng bảng, từng con số so với tệp bài: khớp; scan-words: clean;
- mô hình: bench-check 0 lỗi, 0 NaN; <số> ảnh;
- hình và chữ: <số> contact sheet (giữa khung và cuối khung);
- lint 0 lỗi; check passed (<các cảnh báo, đều là báo nhầm đã biết>); blackdetect 0; ảnh trích từ MP4 khớp ảnh chụp.

**Chưa kiểm:**
- chưa nghe âm thanh: cách phát âm, ngữ điệu, độ hợp của nhạc;
- chưa xem chuyển động: độ mượt, nhịp;
- mô hình là hình minh hoạ, không theo tỉ lệ;
- các Quy tắc mới được so với đáp án của tài liệu gốc, chưa so với văn bản luật hiện hành, chưa có người có chuyên môn duyệt; Cách hiểu và Cách nhớ là của người soạn bài.

**Chọn mặc định:** <những gì brief không nói mà agent tự chọn>.

**Mới thêm vào skill:** <thứ đã chuyển về kit/, kết quả phép kiểm §3> hoặc "không".
```

Sau báo cáo, cập nhật cột trạng thái ở `series.md` §4 và thêm một dòng vào §6.

## 6. Lỗi đã gặp

Lỗi chung của cách dựng (mốc, giọng, công cụ) có ở `.claude/skills/chuong-4-cau-tao-va-sua-chua-video/references/qa.md` §7 và `vi-explainer-video/references/pitfalls.md`. Dưới đây là lỗi đã gặp ở chương này.

| Hiện tượng | Nguyên nhân | Cách sửa |
|---|---|---|
| Nét gạch trên mô hình chạy muộn, chỉ kịp hiện 0,4 giây trước khi hết khung | Canvas và cột chữ tính mốc gạch theo hai cách khác nhau | Cả hai lấy cùng mốc của `beats.js` cộng cùng một độ trễ (Bài 1, khung vạch kẻ đường: `w + 0.7` và `w + 0.85`); xem ảnh `late` của mọi khung Dễ nhầm |
| `rule()` ném lỗi `"…" is not in the rule`, hoặc sai số chữ của câu | Hằng câu Quy tắc lệch lời đọc của khung một chữ hay một dấu | Sửa cho hai bên trùng nhau, theo đúng câu của bài |
| Thẻ hiện viền và nhãn nhưng không có dòng nào | `line`, `yes`, `no` không có `rowIn` trong danh sách `js` | Mỗi dòng một `rowIn` (hoặc `fade`) |
| Lệnh gạch không chạy, khung báo lỗi cú pháp | `strike()` trả về một mảng mà viết thiếu `...` | `...strike("w1", t)` |
| Dấu phẩy rơi xuống đầu dòng sau | Dấu câu gõ sau một cụm tô màu (`inline-block`) | `hlp(id, chữ, ",")` |
| Xe ở gần bị dải phân cách hay cột đèn vẽ đè | Vật có chiều cao vẽ thẳng, không qua hàng đợi | Bọc trong `iso.solid(x, y, z, …)`; mọi `solid` phải trước `iso.flush()` |
| Storyboard tả một cảnh mà canvas không vẽ | Sửa `world.js` sau khi đã viết `build-storyboard.mjs` | Soát lại `scene` và `sc` của khung đó sau mỗi lần đổi cảnh |
| Độ to −13,0 LUFS sau render | Nhạc 0.3 cộng 14 SFX trên giọng Leda | Hạ riêng âm thanh theo §4, không render lại |
| Một nhóm phụ đề xuống hai dòng | Nhóm 11 âm tiết không có dấu câu để ngắt | Chấp nhận khi chỉ một, hai nhóm; nhiều hơn thì thêm dấu phẩy vào câu trong `SCRIPT.md` nếu câu không phải Quy tắc |
| `build-frames.mjs` in `a moment at …s is moved to …s` | Một mốc rơi quá sát cuối khung, script tự kéo về | Thông tin, không phải lỗi; nếu hình cần thêm thời gian sau mốc đó thì tăng khoảng lặng bằng `voice.mjs pad` |
| `wc -w` đếm dư âm tiết | macOS tách chữ tại "à" | `node scripts/voice.mjs request` |
| `tr`, `sed -i ''` báo `Illegal byte sequence` | Tệp có ký tự UTF-8 | `LC_ALL=C …` |
