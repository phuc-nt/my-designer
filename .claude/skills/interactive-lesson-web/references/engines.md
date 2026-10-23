# Các loại thế giới

Mọi video của repo này có lớp `compositions/world.html` gọi `createWorld(...)` của `assets/lib/world/world.js` rồi `renderAt(t)` theo giây của video (lớp bắt đầu ở 0 và kéo dài cả video). Trang web gọi y như vậy. Khác nhau giữa các loại: canvas nào, hình nằm ở đâu trong khung 1920×1080 (cột chữ của video chiếm bên trái và trang không có cột đó), và có chạm được không.

Xem `compositions/world.html` của video để biết `layers`: mỗi `<canvas>` ở đó là một tên trong `createWorld({ … })`.

| Video (skill) | `layers` | Hình nằm ở đâu | `view` gợi ý | Chạm |
|---|---|---|---|---|
| Sa hình bản giấy (`chuong-6…`, kit hiện tại: `centre`, `callouts`) | `["canvas"]` | cả khung khi `world: { centre: true, callouts: false }` | `[0, 0, 1920, 1080]` | có: `actorsOnScreen()`, `setLabels()` |
| Sa hình bản cũ (`chuong-6-cau-502-504-506`, `chuong-6-v02`) | `["canvas"]` | nút giao lệch phải, cột tối của video ở x < ~330; khung đầu và cuối có ba đảo trải cả khung | `[0, 0, 1920, 1080]` | không (thế giới cũ không có `actorsOnScreen`) |
| Kỹ thuật lái xe (`chuong-3…`) | `["canvas", "fx"]` | cả khung, nhìn từ ghế lái; bảng đồng hồ góc trên phải nằm trong `fx` | `[0, 0, 1920, 1080]` | không |
| Quy định chung (`chuong-1…`), Cấu tạo (`chuong-4…`), Biển báo (`chuong-5…`) | `["canvas"]` | x ≈ 640–1900; x < 620 là chỗ cột chữ của video (trống) | `[620, 0, 1300, 1080]` | không |
| Toán lớp 1 (`dimensions-math-video`) | `["canvas"]` | cả khung, không có cột chữ | `[0, 0, 1920, 1080]`, `portraitShape: 16 / 9` | không |

Luôn kiểm bằng `snap.mjs`: số liệu trên là của các video đã làm tới 2026-10-23, video sau có thể khác.

## Ghi chú

- **Font.** Các thế giới vẽ chữ bằng "Plus Jakarta Sans" (`assets/fonts/PlusJakartaSans-VN.woff2`, `build.mjs` chép). `app.js` chờ font 700 và 800 trước khi `createWorld`, vì thế giới đo chữ một lần khi dựng nhãn.
- **`world.ready`.** Có thế giới không trả `ready` (2D): `Promise.all` nhận `undefined` như đã xong.
- **Khung cắt.** Sân khấu giữ tỉ lệ `w/h` của `view` (trên điện thoại dọc không rộng hơn 4:3) và phủ kín: vùng `view` được phóng cho đầy sân khấu, phần dư hai bên bị cắt. Chọn `view` hơi rộng hơn vùng có hình để khung nào cũng còn đủ. Hình trải cả bề ngang (Toán) thì đặt `portraitShape: 16 / 9` để điện thoại dọc không cắt hai bên.
- **Chạm.** Cần `world.actorsOnScreen()` trả `[{ site, id, x, y }]` theo toạ độ canvas 1920×1080, và phần có `site` + `why`. Thế giới sa hình cũ không có; muốn có thì chép `world.js` của kit sa hình hiện tại vào `lib/world/` của bài web và kiểm rằng nó vẫn đọc `sites.js` của video (hai bản `sites.js` có thể khác định dạng). Không làm khi không cần: bảng bước, câu hỏi và thẻ Chốt vẫn đủ dùng.
- **Không phụ đề (Toán).** `captions: false`; `build.mjs` lấy độ dài từ MP4 và không cho đặt `ask`. Người xem là trẻ chưa biết đọc: tên thẻ và tên bước ngắn, không có gợi ý chữ dài; người lớn bấm cho trẻ xem.
- **Nhãn.** Nút "Ẩn nhãn" chỉ hiện khi thế giới có `setLabels(on)`.
