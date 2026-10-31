# Bộ giao diện app vẽ bằng code

Đây là phần làm video app sống động nhất. Ảnh chụp màn hình chỉ phóng, trượt và nghiêng được. Màn vẽ bằng HTML/CSS thì bấm được, cuộn được, chữ sáng theo tiếng đọc, và một mảnh có thể tách khỏi màn bay về phía người xem.

## 1. Nguồn: mã của app, không phải ảnh

- **Cỡ, khoảng cách, màu, bo góc** đọc từ mã giao diện:
  - SwiftUI: `.font`, `.padding`, `.frame`, `.cornerRadius`, Asset catalog;
  - Compose: `dp`, `sp`, `MaterialTheme`;
  - web: CSS hoặc token của design system.
- **Chữ trên màn** chép nguyên văn từ tệp chuỗi (`Localizable.xcstrings`, `strings.xml`, i18n JSON) và tệp dữ liệu của app. Không tự viết câu nào gán cho app.
- **Dữ liệu mẫu** (tên sách, mục danh sách, số đếm) lấy đúng bản đang phát hành. Không có thì hỏi chủ dự án, đừng bịa.
- Chủ dự án cấm ảnh chụp thì cấm luôn cả việc dùng ảnh để tham khảo. Chỉ ảnh có sẵn trong app (bìa, tranh minh hoạ, biểu tượng app) mới được đặt vào màn.

## 2. Kích thước theo điểm gốc

| Thiết bị | Màn (điểm) | Vỏ kit | Ở scale 0.86 trên 1920 × 1080 |
|---|---|---|---|
| iPhone 6.9" | 440 × 956 | 464 × 980, viền 12 | 399 × 843; `top:26px` thì đáy ở 869 |
| iPad 11" ngang | 1180 × 820 | 1212 × 852, viền 16 | 1042 × 733; `left:439px; top:80px`, đáy ở 813 |

- Android: lấy kích thước dp của máy mẫu (ví dụ 412 × 915) và đổi `width`/`height` của `.kx-screen` cho khớp.
- Không đổi cỡ từng mảnh. Muốn to nhỏ thì scale cả máy (hoặc đưa camera lại gần). Nhờ vậy toạ độ đo một lần là dùng được ở mọi khung.
- Vỏ máy chỉ là khối bo góc viền mảnh: không khung của hãng, không nút cạnh, không huy hiệu App Store hay Google Play.

## 3. Cấu trúc kit

`new-project.sh` tạo sẵn `.hyperframes/app-ui-kit/`:

| Tệp | Nội dung |
|---|---|
| `kit.css` | `@font-face`, vỏ máy, màu của app (biến trên `.kx-screen`), các thành phần; thêm hai lớp phụ của video: `.kx-dot` (chạm) và `.kx-w.kx-on` (chữ đang được đọc) |
| `screens/<tên>.html` | mỗi tệp một máy: `<div class="kx-phone" data-screen="reader"><div class="kx-screen">…</div></div>`; dòng chú thích đầu tệp thành tiêu đề của snippet |
| `RULES.md` | luật cứng, cách đặt máy, công thức chuyển động của app, icon. Thêm những chỗ dễ sai riêng của app này. |
| `measure.json`, `preview.png` | do `ui-kit.mjs` sinh ra |

Quy ước:
- Mọi lớp và id dùng tiền tố `kx-`. Khung chép vào thì đổi thành `fNN-`.
- Gắn `data-m="khoá"` vào mọi thứ worker cần nhắm tới: nút sẽ chạm, thẻ sẽ bứt ra, chữ sẽ sáng. Một khoá dùng cho nhiều phần tử thì thành danh sách (từng dòng, từng chữ).
- Chữ được đọc to thì bọc từng chữ trong `<span class="kx-w" data-m="words">`.
- Mỗi trạng thái cần dùng là một tệp màn riêng (menu đang mở, sheet đang lên, màn đã cuộn). Đo trạng thái đang hiện, đừng đo phần tử đang ẩn.
- Icon hệ thống (SF Symbols, Material) vẽ bằng SVG nội tuyến. Font hệ thống thay bằng Inter-VN.

## 4. Lệnh

```bash
AP=<thư mục skill app-promo-video>
node "$AP"/scripts/ui-kit.mjs preview .          # đo lại + preview.png: đọc ảnh này để soát kit
node "$AP"/scripts/ui-kit.mjs doc . --title "Tên app"   # .hyperframes/frame-packets/_app-ui-kit.md cho worker
node "$AP"/scripts/ui-kit.mjs snippet reader f06 .      # HTML của màn reader, kx- → f06-
node "$AP"/scripts/ui-kit.mjs snippet css f06 .         # kit.css, kx- → f06-
node "$AP"/scripts/ui-kit.mjs point reader cta --left 760 --top 26 .           # tâm nút trên khung
node "$AP"/scripts/ui-kit.mjs point reader words --index 4 --anchor tl --left 760 --top 26 .   # góc trái trên của chữ thứ 5
```

- `measure` dựng một trang chứa mọi màn, đặt `<base href>` về gốc dự án, chờ `document.fonts.ready` và ảnh, rồi ghi hình chữ nhật của từng `data-m` (tính từ góc màn) vào `measure.json`.
- Dòng `FONT FAILED` nghĩa là đường dẫn `url()` sai. Lần làm Open Book, sửa font xong thì 57/105 toạ độ thay đổi, nên đừng dùng số đo khi font chưa nạp.
- `doc` cảnh báo khi `measure.json` cũ hơn `kit.css` hay một màn. Sửa kit thì chạy `preview` rồi `doc` lại, trước khi giao việc cho worker.
- Tệp `_app-ui-kit.md` có thể lớn. Worker đọc theo từng phần, không nhét vào packet.

## 5. Soát kit trước khi dựng khung

Đọc `preview.png` và đối chiếu với mã nguồn của app. Không đối chiếu với ảnh chụp.

- Chữ có đúng nguyên văn, đúng chữ in đậm, đúng thứ tự không.
- Màu nằm trên nền của app. Xám hệ thống trên nền video có thể không đủ tương phản.
  - Đỏ huy hiệu iOS `#FF453A` với chữ trắng chỉ 3,41:1; `#D42F28` đạt 4,96:1 mà vẫn trông như huy hiệu.
  - Đo bằng `ui color contrast` nếu có (`vi-explainer-video/references/external-tools.md`).
- Không có ô nào bị tràn chữ hay dấu tiếng Việt bị cắt.
- Có đủ màn và trạng thái cho mọi thao tác trong lời đọc.

## 6. Trong khung

- Đặt máy theo `RULES.md` §2: wrapper được animate, máy bên trong giữ `scale(0.86)` tĩnh.
- Chạm: `.fNN-dot` đặt đúng `ui-kit.mjs point`, vào đúng lúc lời đọc nhắc tới thao tác. **Mỗi khung có ít nhất một thao tác thật trong app.**
- Bứt ra khỏi màn: `.kx-screen` có `overflow:hidden`, nên vật bay ra phải là **bản sao đặt ngoài máy**, trong `.world` (`templates/camera-rig.html`, hàm `burst`). Bản sao khởi đầu đúng chỗ bản gốc (`point … --anchor tl`, kích thước nhân 0.86). Ẩn bản gốc bằng một tween opacity ngắn, cùng lúc hiện bản sao.
- Chữ sáng theo tiếng: bật `fNN-on` cho từng `span` đúng mốc chữ trong `timing-NN.json` (khi là tiếng thật của app) hoặc `words` của giọng đọc.
- Trang cuộn dưới thanh công cụ là đúng như app thật, nhưng `check` báo `content_overlap`. Đặt `data-layout-allow-overlap` lên `.fNN-screen`.
