# Thực tế: một video giải thích có giọng nhân bản và cảnh 3D

Tổng hợp một lần làm thật, để người dùng khác tham khảo cách chia việc, công cụ và thời gian. Mọi con số dưới đây là số đo từ lần chạy đó, không phải ước tính. Cách làm từng bước nằm trong skill [`vi-explainer-video`](../.claude/skills/vi-explainer-video/SKILL.md); trang này chỉ ghi lại điều đã xảy ra.

## Bài toán

Ba câu hỏi sa hình trong bộ 600 câu lý thuyết lái xe hạng B1 (đèn tín hiệu, vòng xuyến, biển ưu tiên), giải thích cho người mới học. Yêu cầu: giữ nguyên chữ câu hỏi, đáp án; hình trong sách vẽ lại bằng 3D; giọng đọc là giọng nhân bản của chủ giọng (đã đồng ý), chạy trên máy; chuyển động nhiều nhất có thể.

## Kết quả

| | |
|---|---|
| Video | 1920×1080, 30 fps, 201,3 giây (3 phút 21 giây), 15 khung, 70,8 MB (bản đầu 229,7 MB) |
| Âm thanh | −14,2 LUFS, LRA 4,0, true peak −1,5 dBFS |
| Mô hình 3D | 12 tệp GLB (6 phương tiện, 6 vật thể đường), 4 MB, 1.280 đến 19.146 tam giác mỗi tệp |
| Giọng | 15 đoạn, 637 chữ; cả 15 tệp giọng đều dò ra dấu nhận biết giọng tổng hợp |
| Render | 2 phút 46,6 giây cho 6.039 khung hình (chụp khung 1 phút 52 giây, mã hoá 41 giây); bản đầu 3 phút 44,6 giây |
| Tổng thời gian | bản đầu khoảng 1 giờ 27 phút, từ lúc nhận yêu cầu (20:42) đến khi render và đo xong (22:09); vòng sửa sau phản hồi chưa ghi giờ |

## Công cụ đã dùng

| Việc | Công cụ | Ghi chú |
|---|---|---|
| Hình tham chiếu | Python (PIL) | cắt hình trong trang sách ở độ phân giải đầy đủ |
| Mô hình 3D | `bin/dsa` và skill `my-designer-3d`, xuất `projects export --format glb` | do một sub-agent làm song song |
| Thế giới 3D | three.js trong một sub-composition của HyperFrames | 11 module khoảng 2.350 dòng (có `lens.js` cho kính lúp); camera, mốc hoạt cảnh và danh sách kính lúp đọc từ một tệp spec |
| Kiểm chuyển động | `scripts/audit-motion.mjs` | chạy ba cảnh không cần trình duyệt, bước 30 khung/giây, báo xe chồng nhau và độ gắt của khúc cua |
| Khung, phụ đề, lắp ráp | HyperFrames `faceless-explainer` | 15 khung sinh từ dữ liệu bằng hai script khoảng 700 dòng, không dùng worker từng khung |
| Giọng đọc | VoiceStudio (OmniVoice) qua `scripts/clone-voice.mjs` | từng câu một, tự thử lại khi whisper nghe thiếu chữ |
| Kiểm giọng | whisper nghe lại; dò dấu nhận biết giọng tổng hợp | |
| Nhạc nền | Lyria qua engine audio của `media-use` | |
| Hiệu ứng âm | `fetch-sfx`, 5 tên có sẵn dùng 12 lần | |
| Cân âm | `scripts/mix-balance.mjs` | cho `bgm.volume` = 0,54 |
| Kiểm và render | `hyperframes lint`, `check`, `snapshot`, `render`; ffmpeg (`ebur128`, `blackdetect`) | |

## Thời gian

| Giờ | Việc |
|---|---|
| 20:42 | đọc brief, đọc skill, kiểm máy |
| 20:50 | giao sub-agent dựng 12 GLB (xong 21:43, khoảng 53 phút) |
| 20:51 | dựng thử một clip WebGL 4 giây để kiểm tốc độ render |
| 20:58 | bắt đầu tạo giọng ở nền (xong khoảng 21:27, khoảng 28 phút) |
| 21:01 đến 21:40 | viết mã thế giới 3D, chụp ảnh từng cảnh và sửa, khoảng 10 vòng |
| 21:41 đến 22:01 | sinh khung, storyboard, phụ đề; nhạc nền; hiệu ứng âm; cân âm |
| 22:04 | render (xong 22:08, 3 phút 44 giây: chụp khung 1 phút 55 giây, mã hoá 1 phút 36 giây) |
| 22:09 | đo âm lượng, tìm khung đen, xem lại đoạn mở đầu |

Ba việc chậm nhất (mô hình 3D, giọng, mã thế giới) chạy chồng lên nhau; đó là lý do cả quy trình gói trong dưới 1,5 giờ.

## Điều rút ra

- **Dựng thử trước.** Một clip WebGL 4 giây dùng một lần cho biết three.js chạy được trong HyperFrames và render nhanh cỡ nào, trước khi viết mã thật.
- **Một thế giới 3D dùng chung.** Một sub-composition three.js nằm dưới 15 khung chữ trong suốt; khung nào cũng chỉ là lớp chữ, còn camera và xe do một spec điều khiển theo mốc lời đọc.
- **Khung sinh từ dữ liệu.** Các khung có cấu trúc giống nhau (đề, quy tắc, xe chạy, đáp án), nên một script sinh cả 15 khung nhanh hơn và đồng nhất hơn là giao 15 worker.
- **Chụp, nhìn, sửa.** Hầu hết lỗi hình (xe bị nhân đôi, mặt phẳng chớp do z-fighting, cửa sổ xe tải, sương mù) lộ ra ở ảnh chụp, không lộ ở `lint`.
- **Chụp ảnh khi vật đang chuyển động.** Lần giao đầu, người xem thấy bánh xe "bay vòng quanh xe". Ảnh tĩnh không lộ lỗi vì bánh chưa quay. Nút bánh trong GLB đã mang sẵn phép dịch về tâm bánh, còn mã đặt lại vị trí con thành `-tâm`, nên bánh bị ném về gốc xe và quay quanh hốc bánh. Sửa bằng `position.sub(tâm)` thay vì gán. Từ nay chụp thêm ở thời điểm xe đang chạy và phóng to vào bánh.
- **Video dạy luật đường cần một tư thế camera cố định.** Bản đầu có camera ban đêm bay, zoom và xoay quanh từng xe; người xem không còn thấy chiều đi của các xe, mà đó chính là nội dung bài. Bản sửa chỉ giữ một tư thế tổng thể cho mỗi câu (nhìn thấy cả mảnh đất, kể cả mép), chỉ trượt ngang để nhường chỗ cho chữ, và khung mở đầu, khung cuối thấy cả ba mảnh đất cùng lúc. Việc "sinh động" dồn vào xe, mũi tên, nhãn và đèn, không dồn vào camera.
- **Ban ngày dễ nhìn hơn.** Nền, sương mù, bầu trời, ánh sáng và màu nhà đều đổi sang tông sáng. Đổi nền cũng làm lộ lỗi tương phản của các pill bước (chữ mờ trên nền bán trong suốt, chữ trắng trên tím) mà `check` bắt được; làm đặc nền pill và đậm màu tím là đủ.
- **Xe chồng lên nhau chỉ lộ khi chuyển động giao nhau.** Ở vòng phản hồi thứ hai, một ảnh chụp câu 504 cho thấy hai xe đè lên nhau; ảnh tĩnh từng cảnh của vòng trước không bắt được vì lỗi chỉ xảy ra khi hai xe đi qua cùng một chỗ cùng lúc. `scripts/audit-motion.mjs` dựng ba cảnh bằng mô hình giả, bước 30 khung/giây, so từng cặp xe bằng hình chữ nhật có hướng (đệm 0,25 m) và đo tốc độ quay lẫn gia tốc ngang. Sau sửa: 0 cặp xe thật chồng nhau. Có 3 cặp "xe ma" (bản mờ trong câu 502) chồng lên xe tải lúc vừa tách ra; đó là chủ ý và script tách riêng trong báo cáo.
- **Xe rẽ phải như xe thật.** Rẽ gắt là do đường rẽ gấp khúc làm mượt bằng spline, độ cong dồn thành đỉnh nhọn. Sửa bằng ba việc: đường rẽ là cung nối tiếp tuyến với vòng xuyến; tốc độ đi tính từ độ cong (`drive()` đặt trần gia tốc ngang 2,4 m/s² và phanh trước khúc cua); các điểm trên đường cách đều nhau. Số đo sau sửa: tốc độ quay tối đa 0,72 rad/s, gia tốc ngang tối đa đo được 2,9 m/s² (hơi cao hơn trần thiết kế vì đo từ vị trí từng khung hình), trên 21 xe.
- **Kính lúp là vẽ lại cảnh thật, không phải phóng to ảnh.** Với mỗi kính, cảnh được vẽ lại bằng cùng camera qua một cửa sổ hẹp (`setViewOffset`) vào một render target 512×512 bốn lần khử răng cưa, rồi một lớp ngoài cùng vẽ kính tròn, cán, vòng ở mục tiêu và nét đứt nối. Chi tiết nét hơn hẳn so với phóng ảnh. Ba điều phải biết: chiếu hết mọi mục tiêu ra toạ độ màn hình **trước khi** vẽ kính đầu tiên (mỗi lần vẽ kính đổi cửa sổ camera, nên kính thứ hai trỏ sai chỗ và chỉ thấy trời trống); ẩn mọi nhãn và quầng sáng trong lượt vẽ kính (phóng to chúng chỉ thành nhiễu); biển báo phải quay ra hướng camera tổng thể, nếu không kính chỉ soi thấy cạnh biển như một cây gậy mỏng.
- **Màu phát sáng bị cắt về xanh lơ.** Mũi tên đèn phụ phát sáng 3,4 làm kênh xanh lá vượt trần, nên mũi tên xanh lá hiện ra màu xanh lơ nhất là qua kính lúp. Hạ cường độ phát sáng xuống 1,25 là màu trở lại đúng.
- **Nhấn đúng chỗ: số đếm và vòng quanh xe.** Số thứ tự trên bản đồ và vòng quanh xe được đọc đến thì đổi sang vàng, to hơn, có quầng; các số khác ở xanh nhỏ. Mỗi nhịp chỉ sáng một số: các mốc đọc cách nhau khoảng 0,45 s, nên khung sáng dài 0,85 s làm hai số sáng cùng lúc, phải cắt khung sáng tại mốc kế tiếp.
- **Lỗi im lặng thì phải thăm dò bằng số.** Vòng highlight quanh xe thực ra không bao giờ hiện: một dòng dở dang ở cuối vòng lặp đặt lại mức highlight của xe bên cạnh về 0 sau khi nó vừa được bật. `lint`, `check` và script kiểm chuyển động đều không báo. Lộ ra khi in thẳng trạng thái highlight của từng xe ở các thời điểm cần có vòng (đều bằng 0). Một lỗi nữa cùng chỗ: hàm cập nhật xe chạy trước hàm đặt highlight trong cùng khung hình, nên vòng dùng giá trị của khung trước; ảnh chụp ở một thời điểm bất kỳ và render liên tục ra khác nhau. Sửa bằng cách vẽ lại vòng ngay khi đặt highlight, để kết quả không phụ thuộc thứ tự gọi.
- **Mặt cầu bầu trời bị cắt bởi mặt phẳng xa.** Camera đứng cách tâm cảnh khoảng 360 đơn vị, nên phía xa của mặt cầu (bán kính 1.100) nằm ngoài mặt phẳng xa 1.400 và bị cắt, lộ ra một "đốm" nhợt có cạnh góc sau các mảnh đất. Nâng mặt phẳng xa lên 2.600 và cho màu dưới chân trời bằng màu nền là hết.
- **Mô hình 3D từ kit có vài chỗ phải xử lý.** Thân xe là mesh tham số viết thẳng vào tài liệu studio, chỉ lốp dùng `loft`. Bộ xuất GLB luôn thêm camera, đèn và vài nút rỗng; sub-agent gỡ chúng khỏi phần JSON của GLB và kiểm lại tên nút bằng cách đọc chính tệp GLB.
- **Lyria có thể đứt kết nối.** Lần tạo nhạc đầu lỗi `1006 abnormal closure`; chạy lại lần hai xong sau khoảng 3,5 phút. Giữ nhật ký lần lỗi và chạy lại, đừng sửa mã.
- **Nhạc phải đo.** `mix-balance` cho biết nhạc nằm dưới giọng bao nhiêu dB; mặc định cũ làm nhạc gần như không nghe thấy.
- **Điều khoản giọng đi trước tiện lợi.** Giọng không rời máy; bản ghép chưa gửi đi đâu và chưa phát hành cho tới khi chủ giọng duyệt. Chi tiết ở [`references/voices.md`](../.claude/skills/vi-explainer-video/references/voices.md).

## Chưa kiểm và còn tồn tại

- **Agent không nghe được và không xem được chuyển động.** Chưa ai nghe giọng đọc, xem chuyển động (độ mượt của khúc cua, nhịp bật kính lúp, vòng nhấp nháy quanh xe) hay kiểm độ khớp hình với lời. Việc xe không chồng nhau chỉ được kiểm bằng script động học, chưa xem bằng mắt. Mọi chỗ trên là kết quả đo và ảnh tĩnh, gồm tám khung trích từ chính tệp MP4.
- Nhật ký tạo giọng ghi 73 dòng lệch chữ và 9 dòng dưới ngưỡng khớp (đã gồm các lần thử lại). Nhiều dòng trông như whisper nghe sai chữ có dấu, nhưng không thể kết luận nếu chưa nghe; coi danh sách là chỗ cần nghe.
- `hyperframes check` đạt, 39/39 kiểm tra tương phản đạt WCAG AA. `lint` 0 lỗi, 1 cảnh báo (`index.html` dài 463 dòng).
- Bản sau sửa không còn khung đen (cả bản mới nhất: 0 lần). Bản đầu có 1 lần ở 0 đến 0,23 giây, do nền đêm trống trước khi thành phố hiện lên.
- Câu 504: xe khách và xe con còn chạy tiếp đến khoảng 149,7 s và 155,8 s, sau khi cảnh đã chuyển sang câu 506, nên nằm ngoài khung hình.
- Phần "Giải thích" của đề không được đối chiếu với luật; theo brief, chỉ báo, không sửa.

## Làm lại với video khác

1. Đọc `SKILL.md`, chọn nguồn giọng, ghi `BRIEF.md`.
2. Giao việc chậm cho nền: mô hình, giọng, nhạc. Làm việc khác trong lúc đó.
3. Dựng thử nhỏ trước khi viết mã lớn.
4. Chụp ảnh nhiều lần, đọc từng ảnh.
5. Chạy `lint`, `check`, `mix-balance`, render, rồi đo bằng ffmpeg.
6. Báo rõ điều chưa kiểm, và nhờ người nghe trước khi đăng.
