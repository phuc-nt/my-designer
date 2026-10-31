# Khung `## Video direction` cho video app

Chép khung này vào STORYBOARD.md, trước `## Frame 1`, rồi điền theo app và preset. Phần trong `<…>` là chỗ phải điền; luật camera và luật app giữ nguyên trừ khi có lý do. Bản đã điền cho Open Book nằm ở `videos/open-book-promo-v3/STORYBOARD.md`, nếu máy còn dự án đó.

```markdown
## Video direction

- **Palette system**
  - Lấy từ frame.md (<preset>). Nền `<#…>` ở mọi khung; thẻ `<…>`; mực `<…>`, chữ phụ `<…>`.
  - Glow: tối đa 3 quả cầu mờ (<màu>), opacity 0.35–0.55, trôi chậm bằng tween tường minh, nằm ngoài `.world` 3D.
  - Màu trạng thái chỉ mang nghĩa: <xanh = đúng/đã xong, vàng = chú ý, đỏ = lỗi/quên>. Không dùng để trang trí.
  - Một khoảnh khắc màu nhấn mỗi khung, ghi ở trường `accent:` của từng khung.
  - Bên trong thiết bị là màu của app (<nền, accent của app>), đúng như bộ kit. Không pha màu video vào màn app.
- **App UI: vẽ lại bằng code**
  - Mọi màn app là HTML/CSS của bộ kit. **Đọc `.hyperframes/frame-packets/_app-ui-kit.md` trước khi dựng** (theo từng phần: luật, đặt thiết bị, toạ độ, chuyển động, rồi snippet cần dùng) và xem `.hyperframes/app-ui-kit/preview.png`.
  - Màn có sẵn: <liệt kê tên màn trong screens/ và trạng thái của chúng>.
  - Đổi tiền tố `kx-` thành `fNN-` (`ui-kit.mjs snippet`). Không `<img>` màn app; ảnh trong máy chỉ là ảnh có sẵn trong app (<…>).
  - Chạm = chấm `.fNN-dot` đúng toạ độ đo (`ui-kit.mjs point`). Mỗi khung có ít nhất một thao tác thật trong app đúng lúc giọng đọc nói tới.
  - Chữ của app là nguyên văn trong kit. Không tự viết thêm.
- **3D camera grammar** (CSS 3D, không WebGL; khung mẫu `_camera-rig.html`)
  - Một `#fNN-stage3d` tĩnh (`perspective: 1000px`) bọc một `#fNN-world` (`preserve-3d`). Không `filter`, `opacity`, `overflow` trên stage, world hay lớp 3D cha.
  - Một object `cam = {x, y, z, rx, ry}`, một hàm `applyCamera()` trong `onUpdate`; tịnh tiến trước, xoay sau. Không tween `.world` trực tiếp.
  - Lao tới / lặn sâu `power4.out`; đổi vị trí `power2.inOut` (0.9–1.4 s). |rx| ≤ 65°, |ry| ≤ 30°.
  - UI app phẳng khi người xem cần đọc (ít nhất 1 s); chỉ nghiêng khi đang bay hay đổi máy. Chữ tiêu đề cũng vậy.
  - Vật bứt ra khỏi màn là bản sao đặt ngoài thiết bị, khởi đầu đúng chỗ bản gốc, rồi mới tiến `translateZ`.
  - Sáng tạo được phép: <các hình đã chọn ở bước tìm ý>. Tối đa ~40 phần tử có `radial-gradient` / `blur` / `clip-path` trên hình cùng lúc.
- **Type**
  - Ngoài thiết bị: <font tiêu đề, font thân, font kicker> (font -VN trong `assets/fonts/`, line-height tiêu đề ≥ 1.1).
  - Trong thiết bị: <font giao diện thay font hệ thống, thường Inter>, đúng như kit.
  - Ký hiệu font không có (✓ ✱ …) vẽ bằng SVG nội tuyến.
- **Facts**
  - Mọi số, tên và câu khẳng định trên hình lấy từ `<đường dẫn tuyệt đối>/facts.md`. Không có trong tệp đó thì không vẽ.
- **Motion grammar**
  - Vào cảnh `power3.out` / `expo.out` (0.5–0.7 s); `back.out(1.4)` chỉ cho chip và huy hiệu. Không bounce, không elastic.
  - Chuyển cảnh: <các cầu nối đã chọn, mỗi chỗ cắt một dòng: vật, toạ độ (x, y, w, h)>. Vật cầu nối nằm đúng cùng chỗ ở hai bên điểm cắt. Không crossfade mặc định, không wipe ngẫu nhiên, không zoom chậm liên tục.
  - Motion blur: <tắt | engine (`data-motion-blur="on"` trên root) | component trên các phần tử: …> (`camera.md`, mục Motion blur).
  - Thao tác trong app theo §3 của kit (chạm, cuộn, sheet, menu, chữ sáng theo tiếng).
  - Mỗi chi tiết hiện đúng lúc giọng đọc nói tới (mốc ở từng Scene); sau lần hiện cuối thì đứng yên, chỉ camera và glow trôi rất chậm.
- **Rhythm / held frames**
  - <Khung móc câu, khung tin cậy, các khung tính năng, khung chính có tiếng app (mốc giây, không lời đọc, không phụ đề), khung đổi nhịp, khung chốt đứng yên ~2 s.>
- **Framing variety**
  - <Mỗi khung một dòng: vị trí máy và vật chính ở đầu → giữa → cuối khung. Không ba khung liền nhau cùng một dàn khung.>
- **Caption keep-out**
  - Phụ đề ở dưới y = 896. Mọi nội dung chính, kể cả đáy thiết bị, ở trên đường đó (điện thoại `top:26px` → đáy 869; khi zoom thì stage cắt ở 888). Vật 3D chỉ lướt qua vùng đó.
- **Language + Negative list**
  - Chữ trên hình là tiếng Việt, trừ định danh nguyên văn: <tên app, tên tính năng, chữ trong app, tên thiết bị>.
  - <Danh sách cấm của BRIEF: không số liệu tự bịa, không "nhất", không giá hay gói trả phí nếu brief không nói, không logo nền tảng khác, không huy hiệu cửa hàng, không khung máy của hãng.>
  - Không dữ liệu cá nhân, token hay đường dẫn riêng. Không `repeat`/`yoyo`/`Math.random`/`@keyframes`.
```
