---
name: interactive-lesson-web
description: "Biến một video bài giảng đã render (có lời đọc, nhạc, phụ đề) thành trang web tương tác: tiếng của chính video phát trên trang, cùng thế giới 3D/2D mà video được dựng ra chạy trực tiếp theo tiếng (renderAt(audio.currentTime)), có danh sách bước theo khung, phụ đề sáng từng chữ, dừng để người xem tự trả lời câu hỏi của bài, chạm vào xe để xem vì sao; rồi gom nhiều bài thành một site có trang mục lục và deploy lên Cloudflare Pages. Dùng khi người dùng nói 'làm bản web tương tác', 'đưa bài lên web', 'trang web cho video bài …', 'làm web cho các bài đã có video', hoặc muốn tận dụng âm thanh của video trên một trang web."
---

# Bài giảng web tương tác từ video đã làm

Skill này đóng gói bản thử V02 sa hình (https://sa-hinh-v02-giay.pages.dev): **trang web không phát MP4**. Nó chép tiếng của video (`ffmpeg -c:a copy`), chép đúng mã thế giới (`assets/lib`, `assets/models`) mà video được render ra, rồi trong vòng lặp rAF gọi `world.renderAt(audio.currentTime)`. Hình vì thế nét ở mọi cỡ màn hình, và trang biết mọi thứ đang ở đâu (xe, khung, câu).

Mọi thứ riêng của một bài nằm trong **một tệp `lesson.js`**. Phần còn lại (trang, kiểu, vòng lặp, câu hỏi, thẻ chạm) là `kit/` dùng chung, không sửa cho từng bài.

## Trong skill có gì

```
interactive-lesson-web/
  SKILL.md
  kit/          index.html (khuôn, có {{TITLE}}…), style.css (bảng màu giấy), app.js (cả trang; lưu tiến độ),
                home.css, home.js (trang chủ có mục lục của một khoá học)
  scripts/
    build.mjs       <lesson-dir> <out-dir> [--back "<href>|<chữ>"] [--next "<href>|<tên bài>"]: dựng một bài
    build-site.mjs  <web-root>: dựng mọi bài + trang chủ, ra <web-root>/dist (xem "Site")
    curriculum.mjs  <MUC-LUC.md> <web-root>/curriculum.json: đọc mục lục chi tiết của repo nội dung
    check.mjs       <bài đã dựng> <thư mục ảnh> [desktop,phone,landscape]: Chrome không đầu, đi một vòng
    snap.mjs        <bài đã dựng> <dự án video> <out.jpg>: bảng ảnh [video | thế giới] giữa mỗi khung
  references/
    lesson-format.md   định dạng lesson.js và luật nội dung
    engines.md         từng loại thế giới (chương 1, 3, 4, 5, 6, Toán): lớp canvas, khung cắt, chạm được không
  examples/chuong-6-v02-paper/lesson.js   bài mẫu đủ mọi phần (câu hỏi xếp thứ tự, chọn một, chạm xe)
```

## Luật cố định

1. **Trang không dạy thêm gì.** Mọi câu chữ người xem đọc (tên bước, lời giải, mẹo, lý do trên thẻ, câu hỏi, đáp án) chép nguyên văn từ `SCRIPT.md` của video, hoặc từ chữ trên khung (`scripts/build-frames.mjs`) cho các phương án mà video hiện trên hình. Không có chỗ nào để chép thì không có phần đó.
2. **Chỉ hỏi chỗ bài hỏi.** Câu hỏi là câu lời đọc hỏi người xem; phương án sai lấy từ chính bài (các xe trong tình huống, các phương án video hiện), không tự nghĩ ra.
3. **Không lộ lời giải trước khi bài giải.** Phần nào có `explain` thì thẻ chạm và thẻ Lời giải chỉ mở khi khung đó bắt đầu.
4. **Không sửa dự án video.** Thế giới cần thêm tuỳ chọn cho trang (ví dụ `actorsOnScreen()`) thì đặt bản sửa trong `lib/` của thư mục bài web; `build.mjs` chép đè lên bản sao. Tuỳ chọn mới mặc định tắt để video render lại vẫn y hệt.
5. **Chữ cho người xem bằng tiếng Việt; tên tệp, định danh, chú thích bằng tiếng Anh.**
6. **Điện thoại dọc và ngang đều dùng được**, không cuộn ngang. `check.mjs` đo.
7. **Repo nội dung `sat-hach-lai-xe` chỉ đọc.**

## Đường dẫn

```bash
ROOT=$(git rev-parse --show-toplevel)
S=$ROOT/.claude/skills/interactive-lesson-web
WEB=$ROOT/projects/sat-hach-lai-xe/web          # site lái xe; Toán: $ROOT/projects/dimensions-math/web
SP=<scratchpad>                                  # ảnh kiểm, bản dựng thử
```

`projects/` không vào git; không `git add -f`.

## Quy trình cho một bài

1. **Chọn video.** Phải có `renders/video.mp4` (âm thanh đã chốt), `index.html` đã lắp, `SCRIPT.md`. Có `caption_groups.json` thì có phụ đề và câu hỏi; không có (Toán) thì `captions: false` và không có câu hỏi dừng.
2. **Tạo `$WEB/<ten-du-an>/lesson.js`** với `META` tối thiểu (`video`, `title`, `heading`, `layers`), `PARTS = []`, `SUMMARY = null`. Dựng thử và chụp bảng ảnh:
   ```bash
   node $S/scripts/build.mjs $WEB/<bai> $SP/b-<bai>
   node $S/scripts/snap.mjs $SP/b-<bai> <dự án video> $SP/sheet-<bai>.jpg
   ```
   Đọc bảng ảnh: mỗi cặp là [video | thế giới] ở giữa một khung. Chọn `META.view` (vùng 1920×1080 có hình, bỏ cột chữ của video) theo `references/engines.md`. Thứ quan trọng chỉ có ở lớp chữ HTML của video (không có trong thế giới) thì ghi vào báo cáo.
3. **Đọc `SCRIPT.md`** (và `BRIEF.md` cho tên ý), chia khung thành phần (`PARTS`): một phần mỗi ý lớn hay mỗi tình huống, khung tổng kết vào `SUMMARY`. Viết `verdict`/`tip` bằng câu Chốt nguyên văn, `ask` cho câu bài hỏi. Định dạng và ví dụ: `references/lesson-format.md`.
4. **Dựng và kiểm một lần:**
   ```bash
   node $S/scripts/build.mjs $WEB/<bai> $SP/b-<bai>
   node $S/scripts/check.mjs $SP/b-<bai> $SP/shots-<bai>
   ```
   Mỗi cỡ màn hình in một dòng JSON: `errs` phải rỗng, `playing.paused` false, `asked`/`right` true nếu bài có câu hỏi, `overflow` false. Xem `desktop-at55-full.png` và `phone-at55-full.png`. Trang cảnh báo `question of "…" not found` trong console nghĩa là câu hỏi không khớp chữ phụ đề: sửa `ask.after`.
   Dòng `static` là phần kiểm tĩnh bằng `ui gate` (gói `ease-design` của my-designer) trên HTML và CSS của bài, chạy trước Chrome:
   - `errors` phải rỗng: lỗi a11y (tương phản, nhãn, thứ tự tiêu đề) hay layout. Có lỗi thì lệnh thoát 1. Sửa trong `kit/`, không sửa `dist/`.
   - `advice` (taste, tell, content, và cảnh báo a11y/layout) chỉ để đọc, không chặn. Hay gặp mà bỏ qua được: `heading-empty` (tiêu đề do `app.js` điền lúc chạy), nhãn đặt trên canvas.
   - `skipped`: chưa `npm install` ở gốc my-designer, hoặc bản không có npm. Ghi "chưa kiểm tĩnh" vào báo cáo.
   - Ngày 2026-10-24 kit đã sửa tương phản (`--teal`, chữ phụ đề mờ, nút Play lúc đang tải) và bọc mọi `:hover` trong `@media (hover: hover)`. Site đã deploy trước đó vẫn là CSS cũ cho tới lần dựng và deploy sau.
5. **Đặt `META.code`** (site có `curriculum`): mã bài trong `curriculum.json` (`C3-B05`); một video chưa khớp bài nào của chương trình thì chỉ mã chương (`C6`), nó vào mục "Luyện thêm" của chương. Hai bài web cùng mã (phần 1, phần 2) đứng liền nhau theo tên thư mục.
6. **Dựng cả site** (`node $S/scripts/build-site.mjs $WEB`), chụp trang chủ, rồi deploy.

## Site

`$WEB/site.json`:

```json
{ "title": "…", "kicker": "…", "intro": "…", "back": "Mục lục",
  "curriculum": "curriculum.json", "exclude": ["<thư mục không đưa lên>"] }
```

- **Có `curriculum`** (lái xe): trang chủ có thanh trên, phần mở đầu (nút "Bắt đầu" / "Học tiếp", số bài đã có trên tổng số bài, phút, số câu tự giải, số bài đã học), các chip chương, và từng chương: bài đã có thành thẻ, bài chưa có gập trong "N bài sắp có". Mỗi bài có nút "← Mục lục" về đúng chương và thẻ "Bài tiếp theo" theo thứ tự chương trình. Bài mới tự có chỗ: mọi thư mục có `lesson.js` đều được dựng, không cần liệt kê.
- **Không có `curriculum`** (Toán): một lưới thẻ theo `lessons` hoặc theo tên thư mục.
- `curriculum.json` sinh từ khối `<!-- muc-luc:chi-tiet -->` của `MUC-LUC.md` trong repo nội dung; chạy lại khi mục lục ở đó đổi: `node $S/scripts/curriculum.mjs /Users/phucnt/workspace/sat-hach-lai-xe/projects/sat-hach-lai-xe/video-briefs/MUC-LUC.md $WEB/curriculum.json`. Tên chương và tên bài trên trang chủ lấy từ đó.
- Tiến độ học lưu trong `localStorage` của trình duyệt (`lesson-progress:<đường dẫn bài>`): trang bài ghi, trang chủ đọc ("Đang nghe · m:ss", "Đã học"), màn chờ có "Nghe tiếp từ m:ss". Không có máy chủ.

## Deploy

```bash
npx wrangler pages project create <ten> --production-branch main      # lần đầu
npx wrangler pages deploy $WEB/dist --project-name <ten> --branch main --commit-dirty=true 2>&1 | sed -E 's/[A-Za-z0-9_-]{36,}/<redacted>/g'
```

Pages không trả lời yêu cầu Range (luôn 200 cả tệp) và Safari không tua được luồng như vậy, nên `app.js` tải `lesson.m4a` một lần vào bộ nhớ (có % trên màn chờ) rồi phát từ `blob:`. Đừng đổi lại thành `<audio src>`. Một site không quá 20 000 tệp, mỗi tệp không quá 25 MB: mỗi bài khoảng 5–10 MB tiếng và vài MB mô hình.

## Báo cáo

- URL site và từng bài; mỗi bài có gì (số bước, câu hỏi nào, chạm được gì, khung cắt).
- Câu chữ chép nguyên văn từ đâu; chỗ nào video có mà trang không có (chữ trên khung, hình chỉ có ở lớp HTML).
- Đã kiểm gì (`check.mjs` ba cỡ màn hình, dòng `static`) và **chưa kiểm trên máy thật**.
- **Agent không nghe được âm thanh và không xem được chuyển động.**
- Chưa commit gì (trừ khi người dùng bảo).
