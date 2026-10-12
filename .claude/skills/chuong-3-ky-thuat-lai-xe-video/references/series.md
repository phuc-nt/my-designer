# Loạt video Chương III · Kỹ thuật lái xe

Brief nằm ở `/Users/phucnt/workspace/sat-hach-lai-xe/video-briefs/chuong-3-ky-thuat-lai-xe/`: `README.md` (luật của chương, bảng thuật ngữ), `BAI-01…BAI-11-*.md` (mỗi bài một tệp), `DOI-CHIEU.md` (bảng đối chiếu nguồn, chỉ để soát). Repo đó chỉ đọc.

## 1. Luật nội dung và cách áp dụng

| Luật của chương | Trong video nghĩa là |
|---|---|
| Dòng **Chốt** là quy tắc chuẩn: nói gọn được, không thêm bớt thao tác, không đổi nghĩa | Lời đọc và thẻ chữ của khung "việc cần làm" đi từ dòng Chốt. Cảnh 3D cũng không được thêm thao tác: bài không nói xi nhan thì xe không nháy xi nhan |
| Danh sách đánh số là trình tự thật | Giữ số và thứ tự. Trên hình dùng `stepCard` (số hổ phách khi đang đọc, xanh khi xong). Danh sách không đánh số trong bài thì dùng dấu chấm hay icon, không tự đánh số |
| Số trong quy tắc giữ nguyên, không tự nghĩ ra số | "khoảng 3 giây", "5 đến 10 mét", "150 mét" lên hình đúng như bài viết, kèm chữ "khoảng" nếu bài có. Bài không có số thì hình không có số: thanh và dải chỉ so độ dài |
| Số trong ví dụ là ước lượng | Giữ lời giả định của bài ngay cạnh con số, trên cùng một thẻ |
| Không thêm kiến thức ngoài bài | Thiếu thì ghi vào báo cáo, không tự bù |
| Nội dung đứng một mình | Không số câu, kỳ thi, sát hạch, cuốn sách. `scan-words.mjs` cấm cả các số 206–263 đứng riêng (dải số câu của chương): bài có một con số thật trong dải đó thì sửa danh sách cấm trong dự án và ghi vào báo cáo |
| Chữ rào đón giữ nguyên | "trên nhiều xe", "trên hầu hết các xe" có mặt trong lời đọc và trên thẻ |
| Thuật ngữ theo bảng của README | Lần đầu: tên chuẩn kèm tên thường gọi ("đèn chiếu xa, thường gọi là đèn pha"); sau đó một tên |

Bốn mạch của chương, dùng làm câu kết hay câu quy tắc sáng dần: lốp bám đường có hạn; để động cơ ghìm xe; nhìn thấy tới đâu, chạy nhanh tới đó; quan sát, báo trước, giảm tốc, rồi mới làm.

Phần "vì sao" trong mọi bài do người soạn viết và mới được AI soát, chưa có giáo viên dạy lái xe duyệt. README của brief nêu hai chỗ kém chắc nhất: Bài 10 ý 3 và Bài 1 ý 4.

## 2. Khuôn kịch bản

Mỗi tệp bài có: Câu hỏi mở đầu, Ý lớn của bài, các ý đánh số, Những chỗ hay hiểu sai, Ghi nhớ, Tự kiểm tra. Video dùng:

| Khung | Lấy từ | Ghi chú |
|---|---|---|
| 1. Mở | Câu hỏi mở đầu | Một hai tình huống người xem tự nhận ra mình, rồi câu hỏi hiện từng chữ. Không trả lời ở khung này |
| 2–3. Ý chính | Ý lớn của bài | Một khung cho cơ chế (vì sao), một khung cho câu quy tắc sáng dần theo giọng đọc (`karaoke`) |
| Mỗi ý: 2–4 khung | Mục đánh số | Việc cần làm (từ dòng Chốt) → vì sao → cách làm sai, nếu bài có. Ý có danh sách dài thì chia hai khung, khung sau giữ dòng gọn của các bước đã xong |
| 1–2 khung cuối | Ghi nhớ | Chỉ các dòng ghi nhớ của những ý có trong video. Khung cuối kết bằng một câu, giữ tới hết |

Không dùng "Tự kiểm tra" (đó là câu hỏi ôn). "Những chỗ hay hiểu sai" chỉ dùng khi nó thuộc một ý có trong video, đặt làm khung "cách làm sai" của ý đó.

Bài 5 đã làm: 16 khung = 1 mở + 2 ý chính + 1 về đèn + 2 (ý 1) + 3 (ý 2) + 5 (ý 3) + 2 ghi nhớ.

## 3. Ngân sách thời lượng

Số đo thật: **873 âm tiết lời đọc, 16 khung, 306 giây** với giọng Leda, tức khoảng 2,85 âm tiết mỗi giây kể cả khoảng lặng.

| Mục tiêu | Âm tiết lời đọc |
|---|---|
| 4 phút | khoảng 680 |
| 5 phút | khoảng 850 |
| 6 phút | khoảng 1020 |

Đếm trước khi tạo giọng:

```bash
(cd "$P" && grep -E '^    ' SCRIPT.md | wc -w)
```

Cột "âm tiết" ở bảng §4 là độ dài của tệp bài (kể cả câu hỏi tự kiểm tra), không phải của lời đọc; dùng để ước lượng. Bài trên 1300 âm tiết gần như chắc chắn cần hai video. Chia theo ý, không cắt giữa một ý; mỗi video tự đứng được (có mở, có ghi nhớ của riêng nó). Vượt mục tiêu thì báo người dùng và nêu cách chia, không tự cắt phần "vì sao".

## 4. Mười một bài

| Bài | Tên | Số ý | Âm tiết | Tệp brief | Trạng thái |
|---|---|---|---|---|---|
| 1 | Ngồi vào ghế lái | 4 | 1362 | `BAI-01-ngoi-vao-ghe-lai.md` | chưa làm |
| 2 | Cho xe lăn bánh: khởi hành, phanh tay, đổi số | 4 | 1399 | `BAI-02-cho-xe-lan-banh.md` | chưa làm |
| 3 | Lên dốc và xuống dốc | 5 | 1448 | `BAI-03-len-doc-xuong-doc.md` | chưa làm |
| 4 | Mặt đường xấu: trơn, ổ gà, rãnh, ngập nước | 6 | 1567 | `BAI-04-mat-duong-xau.md` | chưa làm |
| 5 | Khi không nhìn rõ: ban đêm, đèn chói, mưa, sương mù | 4 | 1204 | `BAI-05-khi-khong-nhin-ro.md` | ý 1–3 xong; ý 4 còn |
| 6 | Đổi hướng: đường vòng, rẽ, quay đầu, lùi, ra đường chính | 6 | 1545 | `BAI-06-doi-huong.md` | chưa làm |
| 7 | Qua đường sắt | 3 | 1275 | `BAI-07-qua-duong-sat.md` | chưa làm |
| 8 | Đường cao tốc và vượt xe dài | 4 | 1645 | `BAI-08-duong-cao-toc-va-vuot-xe-dai.md` | chưa làm |
| 9 | Mở cửa xe, phố đông và điện thoại | 3 | 1177 | `BAI-09-mo-cua-xe-pho-dong-dien-thoai.md` | chưa làm |
| 10 | Xe mô tô hai bánh | 6 | 1976 | `BAI-10-xe-mo-to-hai-banh.md` | chưa làm |
| 11 | Xe tự đổ, nhiên liệu sạch, lái xe tiết kiệm | 3 | 1303 | `BAI-11-xe-tu-do-nhien-lieu-lai-tiet-kiem.md` | chưa làm |

Hình có sẵn của chương chỉ có ở Bài 1 ý 4 (`images/crops/cau-227..231.jpg` của repo nội dung, năm đèn báo trên bảng đồng hồ). Ảnh chỉ để tham chiếu: vẽ lại, không đưa ảnh chụp vào video.

## 5. Bài nào cần dựng thêm gì

Cột "đã có" là thứ `kit/` làm được ngay. Cột "phải dựng" là ước lượng khi đọc mục lục của bài, chưa phải thiết kế: đọc brief rồi mới chốt. Thứ nào dựng xong mà bài khác dùng được thì chuyển về `kit/` (`world.md` §7).

| Bài | Đã có | Phải dựng |
|---|---|---|
| 5 ý 4 (mưa, đường trơn) | Gần như tất cả: mưa, gạt nước, mặt đường ướt, dải dừng xe, xe tải phía trước, khoảng cách | Cách cho thấy quãng dừng dài ra trên đường ướt (đổi `decel` của `stopDist`), nếu bài nói vậy |
| 4 Mặt đường xấu | Đường, mưa, mặt ướt, dải dừng xe, ghế lái | Ổ gà, rãnh cắt ngang, đoạn ngập nước trên mặt đường; xe trượt ngang (thêm góc lệch vào `drive.js`) |
| 8 Cao tốc, vượt xe dài | Ghế lái, xe tải, khoảng cách, đèn dừng khẩn cấp, chỗ dừng xe | Đường nhiều làn một chiều có dải phân cách, làn tăng tốc và giảm tốc, làn dừng khẩn cấp; xe kéo rơ moóc (ghép từ mô hình xe tải, hoặc mô hình mới) |
| 3 Lên dốc, xuống dốc | Ghế lái, xe tải, bảng đồng hồ có thanh | Mặt đường dốc (nghiêng cả sân khấu hay nghiêng máy quay và đường chân trời); chỉ báo số đang gài và phanh động cơ trên bảng đồng hồ |
| 6 Đổi hướng | Đường thẳng, tấp vào lề, cảnh nhìn từ trên (`chase`) | Khúc cua, ngã ba, chỗ quay đầu, lùi xe: đường hiện chỉ thẳng. Có thể mượn nút giao và đường cong của `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video` (`path.js` đã có trong dự án) cho các cảnh ngoài xe; xi nhan đã có (`blinkL`, `blinkR`) |
| 7 Qua đường sắt | Đường, ghế lái, dừng xe | Đường ngang: ray, thanh chắn, chuông và đèn báo, tàu. Chưa có mô hình nào |
| 9 Mở cửa xe, phố đông, điện thoại | Xe đỗ ở lề, xe khác chạy qua (`pass`), mô tô có mô hình | Cửa xe mở (mô hình hiện không có khớp cửa: vẽ 2D trên kính hay làm mô hình mới), người đi bộ, phố có nhà hai bên |
| 1 Ngồi vào ghế lái | Ca-pô, bảng táp-lô và vô lăng vẽ 2D trong `hud.js` | Gần như cả video ở trong ca-bin: ghế, tư thế, bàn đạp, năm đèn báo. Hợp với hình 2D vẽ trong `hud.js` hay trong khung hơn là 3D; đường chỉ làm nền |
| 2 Cho xe lăn bánh | Ghế lái, xe lăn bánh và dừng theo đường tốc độ | Bàn đạp côn, phanh, ga; cần số; phanh tay: hình cận cảnh 2D đồng bộ với chuyển động của xe |
| 10 Xe mô tô hai bánh | Mô hình mô tô (`moto.glb`), đường, dốc nếu Bài 3 đã dựng | Góc nhìn người lái mô tô (tay lái, gương), tay ga và hai phanh cận cảnh; `road.vehicle` chưa được thử với mô tô |
| 11 Xe tự đổ, nhiên liệu, tiết kiệm | Xe tải, đường | Thùng xe nâng lên (mô hình xe ben mới); hai ý sau thiên về sơ đồ hơn là cảnh lái, có thể chủ yếu là cột chữ và hình 2D |

Thứ tự gợi ý theo lượng dùng lại: Bài 5 ý 4 → Bài 4 → Bài 8 → Bài 3 → Bài 6 → Bài 7 → Bài 9 → Bài 2 → Bài 1 → Bài 10 → Bài 11. Người dùng chọn bài nào thì làm bài đó.

## 6. Đã làm

| Video | Dự án | Nội dung | Số đo | Ghi chú |
|---|---|---|---|---|
| Bài 5 · Khi không nhìn rõ (ý 1–3) | `videos/chuong-3-bai-05-khi-khong-nhin-ro` | Đêm gặp xe ngược chiều, bị chói mắt, sương mù và mưa to | 16 khung, 873 âm tiết, 306,3 s, 1920×1080, 30 fps, giọng Leda | Video thử nghiệm của chương, người dùng đã duyệt. Thành ví dụ `bai-05-khi-khong-nhin-ro`. Ý 4 chưa làm |
