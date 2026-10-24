---
name: short-film-video
description: "Dựng phim ngắn không lời đọc bằng HyperFrames: sting sản phẩm, logo reveal, phim ra mắt 6 tới 40 giây, cắt theo nhịp, hình động liên tục. Dùng khi người dùng nói: 'làm phim ngắn', 'video ra mắt sản phẩm', 'sting', 'logo reveal', 'intro logo', 'promo không lời', 'motion video ngắn'. Video có giọng đọc thì dùng vi-explainer-video."
---

# Phim ngắn không lời

Phim ngắn khác video giải thích ở ba điểm: không có giọng đọc dẫn, hình phải tự kể; mọi chỗ cắt nằm trên nhịp; gần như không lúc nào hình đứng yên. Skill này là một lớp mỏng trên HyperFrames: một quy trình ngắn, một tệp khởi đầu chạy được, và cách đo. Phần còn lại là việc của người dựng. Đừng coi tệp khởi đầu là khuôn: phim hay thường có hình riêng của sản phẩm.

Đọc `AGENTS.md` ở gốc repo trước. Luật dựng composition nằm trong `hyperframes-core` và `hyperframes-animation` (`~/.claude/skills`); đọc hai SKILL.md đó trước khi viết HTML.

## Trong skill có gì

- `starter/index.html`: một sting 10 giây, một tệp, năm cảnh trên lưới 120 BPM, có sẵn bảng cảnh (`SHOTS`), sổ chỗ cắt (`SEAMS`) và số đếm chạy theo timeline. Sản phẩm và chữ trong đó là bịa, thay hết.
- Dùng chung với `vi-explainer-video`, không chép lại:
  - font tiếng Việt ở `assets/fonts/` (`references/fonts.md` khi cần họ font khác);
  - `scripts/motion-audit.mjs` đo chỗ đứng hình, `beat-grid.mjs` tìm BPM và nhịp đầu của bài nhạc, `mix-balance.mjs` đo âm lượng;
  - `references/motion-craft.md` §1: vốn ý về chuyển động. Đọc trước khi lên bảng cảnh.

```bash
ROOT=$(git rev-parse --show-toplevel)
SK=$ROOT/.claude/skills/short-film-video
VX=$ROOT/.claude/skills/vi-explainer-video
```

## Ba dạng hay gặp

Gợi ý để bắt đầu, không phải khuôn. Dạng khác (vòng lặp, thẻ tiêu đề, phim chữ) làm theo cùng quy trình.

| Dạng | Dài | Các cảnh thường có |
|---|---|---|
| Sting sản phẩm | 6 tới 13 giây | tên, bề mặt người dùng gặp đầu tiên, một con số, một thao tác và kết quả của nó, thẻ kết |
| Logo reveal | 4 tới 8 giây | một hình hay một chuyển động dẫn tới logo, logo khoá lại, một dòng chữ; cả phim là một cú máy |
| Phim ra mắt | 20 tới 40 giây | mở bằng vấn đề hoặc tên, ba tới năm khả năng mỗi cái một cảnh, một khoảnh khắc đáng nhớ, thẻ kết có lời kêu gọi |

## Quy trình

### 1. Brief

Lấy từ lời người dùng; thiếu gì thì dùng mặc định và nói rõ đã mặc định gì, chỉ hỏi khi không có cả tên lẫn nội dung.

| Mục | Mặc định |
|---|---|
| Tên và một ý duy nhất phim phải để lại | phải có |
| Dạng và độ dài | sting, 10 giây |
| Khung hình | 1920×1080, 30 fps |
| Màu, font, logo | bảng màu của `starter`, Inter và JetBrains Mono; logo thật thì người dùng đưa tệp |
| Nhạc | không có; phim vẫn cắt theo lưới nhịp để ghép nhạc sau |
| Chữ | tiếng Việt, ít chữ, mỗi cảnh một ý |

Không bịa số liệu, lời khen hay logo của bên thứ ba cho một sản phẩm thật.

### 2. Dự án

```bash
mkdir -p "$ROOT/videos" && cd "$ROOT/videos" && npx -y hyperframes init <ten-phim> --non-interactive --example=blank
mkdir -p <ten-phim>/assets/fonts && cp "$VX"/assets/fonts/*.woff2 <ten-phim>/assets/fonts/ && cp "$SK"/starter/index.html <ten-phim>/index.html
```

`videos/` nằm trong `.gitignore`; không `git add -f` gì ở đó. Từ đây mọi lệnh chạy trong `videos/<ten-phim>`.

### 3. Bảng cảnh, lưới nhịp, sổ chỗ cắt

Ba thứ này là kế hoạch của phim. Viết chúng thành dữ liệu ở đầu script (`SHOTS`, `SEAMS`, dòng ghi BPM) rồi mới dựng hình.

- **Lưới nhịp.** Chọn BPM (100 tới 128 hợp với phần lớn phim ngắn), một nhịp dài `60 / BPM` giây. Mọi chỗ cắt và cú nhấn chính rơi vào nhịp; chuyển động bắt đầu sớm hơn nhịp một chút để chạm đích đúng nhịp. Có nhạc thật thì lấy BPM và nhịp đầu từ `beat-grid.mjs`.
- **Bảng cảnh.** Mỗi cảnh một dòng: từ giây nào tới giây nào, trên hình có gì, cảnh để làm gì, rời đi thế nào. Hai cảnh liền nhau khác cỡ và khác bố cục. Hình đầu tiên đã là một bức hoàn chỉnh; thẻ kết đọc được trong ít nhất một giây rưỡi.
- **Sổ chỗ cắt.** Mỗi chỗ cắt một dòng: hình đang đi theo trục nào, về phía nào. Cảnh cũ rời đi đang tăng tốc, cảnh mới vào từ phía đối diện đang hãm, tốc độ hai bên ở đúng chỗ cắt xấp xỉ nhau thì mắt đọc thành một chuyển động. Cách tính có trong comment của `starter`. Một chỗ cắt cũng có thể là vật ở tiền cảnh phóng to che hết hình, hoặc một cú cắt thẳng khi hai hình cùng vị trí và cùng cỡ; ghi vào sổ là được.

Phim dài hơn khoảng 15 giây: đưa bảng cảnh cho người dùng xem trong chat trước khi dựng.

### 4. Dựng

- Tới khoảng 15 giây: một tệp `index.html` như `starter`. Các cảnh là lớp chồng nhau không gắn `data-start`; timeline bật cảnh sau và tắt cảnh trước ở chỗ cắt. Dài hơn thì mỗi cảnh một sub-composition (`hyperframes-core` → `references/sub-compositions.md`).
- Một timeline dừng sẵn, mọi giá trị tính từ thời gian của nó: không `Math.random`, không `Date.now`, không `repeat: -1`, số đếm dùng tween với `onUpdate`.
- Chỉ tween `x`, `y`, `scale`, `rotation`, `opacity`. Trạng thái đầu đặt trong `fromTo`, không đặt bằng CSS `transform`.
- Chọn một họ ease cho mọi cú vào và dạng ngược của nó cho mọi cú ra.
- Giữ một thứ chạy suốt mỗi cảnh (đẩy máy chậm, một đường vẽ dần, một số đếm) để không lúc nào hình đứng hẳn.
- Hình riêng của sản phẩm (ảnh chụp giao diện, svg, logo) đặt trong `assets/`, đường dẫn tính từ gốc dự án.

### 5. Xem ảnh tĩnh trước khi render

```bash
npx -y hyperframes check
npx -y hyperframes snapshot --at <giữa mỗi cảnh, và 0,05 giây trước và sau mỗi chỗ cắt> --no-end --describe false -o snaps
```

`check` phải đạt cả năm mục. **Đọc (Read) các ảnh**: chữ có dấu không bị cắt, không có gì tràn khung, hai ảnh hai bên chỗ cắt cho thấy hình đang đi cùng một hướng.

### 6. Nhạc (khi người dùng cần)

Dùng bài nhạc người dùng đưa (họ phải có quyền dùng nó), đặt trong `assets/`. Tạo nhạc bằng Lyria thì theo `"$VX"/references/audio.md` §4: luồng đó viết cho dự án có giọng đọc và chưa được thử cho phim ngắn, cần `GEMINI_API_KEY` trong môi trường, không bao giờ in hay ghi khoá ra tệp. Đo bài nhạc bằng `node "$VX"/scripts/beat-grid.mjs`; BPM lệch thì dời `SHOTS` và `SEAMS` theo nhịp thật. Gắn vào root bằng một thẻ `<audio id="bgm" src="assets/…" data-start="0" data-duration="…" data-track-index="10" data-volume="…">`. Đích âm lượng: khoảng −14 LUFS, true peak ≤ −1 dBFS.

### 7. Render và đo

```bash
npx -y hyperframes render --quality high --output renders/film.mp4
node "$VX"/scripts/motion-audit.mjs --video renders/film.mp4 --caption-top 1 --min 0.3
ffmpeg -hide_banner -nostats -i renders/film.mp4 -an -vf blackdetect=d=0.1:pix_th=0.05 -f null - 2>&1 | grep -c black_start
```

- Đứng hình: nhắm dưới khoảng 1 giây cho mỗi 30 giây phim, không đoạn nào quá nửa giây trừ chỗ cố ý dừng. `starter` đo được 0 giây.
- `black_start` là 0, trừ khi phim cố ý có hình đen.
- Chụp lại vài khung từ MP4 quanh các chỗ cắt và đọc chúng; ảnh snapshot đúng chưa chứng minh MP4 đúng.

### 8. Báo cáo

Đường dẫn MP4, độ dài, độ phân giải; BPM và các chỗ cắt; số đo đứng hình; những gì đã mặc định ở brief. Nói rõ **chưa kiểm được**: agent không xem được chuyển động và không nghe được nhạc, nên nhịp có "ăn" hay không là việc người dùng phải tự xem.

## Đã thử và chưa thử

- `starter`: `check` đạt (lint 0 cảnh báo, tương phản 19/19), render 10 giây ở 1920×1080, `motion-audit` 0 giây đứng hình, ảnh hai bên ba chỗ cắt cho thấy hình đi cùng hướng.
- Chưa thử trong skill này: ghép nhạc, phim dài hơn 15 giây bằng sub-composition, khung dọc 1080×1920, logo thật.
- `motion-audit` chỉ nói hình có động hay không. Nó không nói phim có đẹp hay không.
