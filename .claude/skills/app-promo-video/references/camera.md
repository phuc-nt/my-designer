# Camera 3D bằng CSS

Ngữ pháp chung cho cả video. Chép phần "Luật" vào `## Video direction` của storyboard, để mọi worker theo cùng một cách. Khung mẫu ở `templates/camera-rig.html`. Rule `3d-camera-flight` và các blueprint `camera-journey`, `device-surface-showcase` của skill `hyperframes-animation` là nền; tệp này là phần đã kiểm trên video thật.

## Luật

- **Một ống kính, một thế giới.**
  - `#fNN-stage3d` mang `perspective: 1000px` (khoảng 800–1200) và `perspective-origin` ở giữa vùng nội dung (960 × 444). Không bao giờ tween ống kính.
  - `#fNN-world` mang `transform-style: preserve-3d`.
- **Một object `cam = {x, y, z, rx, ry}`, một hàm ghi `applyCamera()`**, gọi trong `onUpdate` của tween camera. Mọi chuyển động camera là tween của `cam`, không tween `.world` trực tiếp. Tịnh tiến viết trước, xoay viết sau.
- **Không `filter`, `opacity`, `overflow` trên stage, world hay lớp 3D cha nào.** Chúng làm phẳng 3D. Muốn mờ thì đặt opacity lên từng vật. Glow và blur nằm ở lớp nền phẳng bên ngoài.
- **Ease:**
  - lao tới, lặn sâu: `power4.out`, 0,6–0,9 s;
  - đổi vị trí: `power2.inOut`, 0,9–1,4 s;
  - dừng lại: một chặng ngắn `power2.out`, 0,3–0,4 s.
- **Giới hạn góc:** |rx| ≤ 65°, |ry| ≤ 30°.
- **Giao diện cần đọc thì phẳng.** Máy gần như đối diện camera ít nhất 1 s trước khi lời đọc cần người xem đọc. Chỉ nghiêng khi đang bay vào, bay ra hay đổi máy. Chữ tiêu đề cũng vậy.
- **Bay, dừng để đọc, bay tiếp.** Mỗi chặng kết thúc ở một tư thế phẳng có chữ.
- **Zoom bằng camera, không bằng máy:** `z` dương là lại gần; độ phóng ≈ 1000 / (1000 − z). Ví dụ z = 230 là ×1,3.
- **Vật sát ống kính phải mờ đi** trước khi đi qua mặt phẳng ống kính. Mảng `near` trong khung mẫu tính opacity theo độ sâu hiệu dụng `cam.z + z`.
- **Vùng phụ đề:**
  - Stage cắt ở y = 888, và 80 px dưới cùng mờ vào nền.
  - Vật 3D chỉ được lướt qua vùng dưới y = 896, không dừng ở đó.
- **Giới hạn hiệu ứng:** tối đa 3 quả cầu glow, ngoài thế giới 3D. Không quá khoảng 40 phần tử có `radial-gradient`, `blur` hoặc `clip-path` trên hình cùng lúc, nếu không render sẽ ra khung đen.

## Mẫu chuyển động

| Mẫu | Cách làm | Dùng khi |
|---|---|---|
| Ổn định | `WIDE → FLAT`, `power2.inOut` 0,9 s ở đầu khung | máy vào hơi nghiêng rồi đứng phẳng để đọc |
| Lặn vào chi tiết | `FLAT → DIVE` (z 200–260, x/y lệch về chi tiết), `power4.out` | lời nhắc tới một nút, một chữ |
| Hành lang | các vật đặt dọc trục z (`translateZ` −600, −1200…), camera tiến `z` qua từng vật, dừng ở vật cuối | "cả một tủ", "nhiều lựa chọn" |
| Mặt bàn | vật nằm `rotateX(55–65deg)`, camera lướt `y` dọc theo | trang vở, tờ giấy, dòng thời gian |
| Bản lề | vật thứ hai `rotateY(-180deg)` sau vật thứ nhất, xoay quanh một cạnh | bản dịch, mặt sau, "đằng sau là…" |
| Đổi máy | máy A lùi `z` âm và mờ, máy B tiến ra từ sau, cùng một màn | đồng bộ, "đọc tiếp trên máy khác" |
| Đường hầm | các vòng viền xếp theo `z`, camera lặn xuyên qua, vật rơi xoay qua | "rơi vào", "đắm chìm", thành ngữ có chiều sâu |
| Bứt ra | bản sao ngoài máy tiến `z` 120–180, bóng đổ dày lên | thẻ, thông báo, kết quả bật ra |

## Motion blur

Blur là vệt màn trập để lại khi vật đi qua khung nhanh. Đặt lên chuyển động chậm thì nó chỉ làm hình nhoè như render rẻ tiền. Chỉ dùng cho **1–3 nhịp gắt mỗi video**: camera lao tới, máy quăng sang, thẻ đập xuống, chữ số bật vào. Chữ cần đọc thì không bao giờ nhoè: **nhoè lúc lao tới, tới nơi thì sắc, rồi đứng.**

Hai cách, không thay nhau được:

| | Engine (cả khung hình) | Component `motion-blur` (từng phần tử) |
|---|---|---|
| Bật | `data-motion-blur="on"` trên root của composition; tuỳ chọn `data-motion-blur-shutter`, `data-motion-blur-samples` | `npx hyperframes add motion-blur`, dán snippet, gắn `data-hf-motion-blur` vào phần tử chuyển động |
| Nhoè cái gì | mọi thứ đang chuyển động, kể cả tổ tiên có transform. **Hợp với camera 3D**: world chuyển động thì cả cảnh nhoè đúng | chỉ `transform` của phần tử được gắn (x, y, scale, rotation). `left`/`top`/`width`/`height` không nhoè |
| Không chạy khi | có canvas WebGL; có lật 3D dùng `backface-visibility` (mẫu Bản lề); root có transform hay opacity; render HDR | tổ tiên đang chuyển động (vệt bị trễ); cả phần tử lẫn tổ tiên đều được gắn |
| Kiểm | `hyperframes check` báo `motion_blur_off` kèm lý do | console cảnh báo theo tên |
| Giá | render chậm khoảng ×1,7 | N+1 bản sao mỗi phần tử; `{"samplesPerFrame": 8}` giảm một nửa |

Chọn:
- **Camera lao, lặn, hành lang, đường hầm:** engine, vì vật chuyển động là cả thế giới 3D. Root composition không được mang transform hay opacity; camera chỉ ghi `#fNN-world`, nên khung mẫu đã đúng.
- **Một thẻ bứt ra, một chip đập xuống trên nền đứng yên:** component trên đúng phần tử đó, gắn trên bản sao (`#fNN-pop`), không gắn trên máy cha.
- **Video có mẫu Bản lề:** engine tắt ở khung đó. Dùng component cho các nhịp khác, hoặc bỏ blur.
- Chuyển động dưới khoảng một bề ngang phần tử mỗi khung hình: không cần blur, để sắc.

Đủ tuỳ chọn của hai cách: `hyperframes-animation/references/motion-blur.md`. Thông số tốc độ (theo `hyperframes/references/motion.md`): nhịp gắt 0,3–0,6 s, vệt lớn nhất ở khung nhanh nhất, khoảng 6–12 px với vật cỡ chữ, 15–20 px khi cả khung lướt. Tới nơi chậm (`expo.out`, `power4.out`), đi khỏi gọn (`power3.in`).

Sau khi bật engine, chạy `hyperframes check`. Có `motion_blur_off` thì sửa theo lý do, hay chuyển sang component. Render thử một đoạn ngắn quanh nhịp đó (`hyperframes render --start <t−1> --end <t+1>`), trích 3 khung bằng ffmpeg và đọc ảnh, trước khi render cả video.

## Bẫy

- `tl.set(el, { visibility: "hidden" }, t)` đặt ở giây sau làm phần tử ẩn ngay từ đầu khung, cả trong snapshot lẫn render. Muốn ẩn giữa khung thì dùng tween opacity 0,02 s (`burst` trong khung mẫu). Hiện ra bằng `visibility: "inherit"` thì vẫn đúng.
- Linter không đọc được `immediateRender` bọc trong hàm phụ kiểu `L({...})`. Hãy viết thẳng `immediateRender: false` vào object, như hàm `leg`.
- Tiêu đề còn trên hình khi máy khác bay tới thì trông như va nhau. Cho chữ mờ xong trước khi vật mới tới: bắt đầu sớm hơn khoảng 0,25 s, ease `power2.out`.
- Camera trôi chậm khi đứng yên là được. Nhưng khung cuối phải đứng hẳn, khoảng 2 s, rồi mới mờ.
