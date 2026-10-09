# Hợp đồng brief

Tệp này là bản phía sản xuất của `VIDEO-HANDOFF.md` (nằm ở gốc repo `sat-hach-lai-xe`). Hai tệp nói cùng một bộ điều kiện: tệp kia viết cho người soạn brief, tệp này viết cho người dựng video. Đổi điều kiện ở một tệp thì sửa cả tệp kia.

Loạt V01–V29 có thêm luật riêng ở `video-briefs/README.md` §2 của repo đó (không mở đầu, không phương án, nội dung đứng riêng). Bản phía sản xuất của các luật ấy là `series.md` §1. Chỗ nào tệp này còn nói "đề, phương án, đáp án trên hình" thì luật của loạt thắng: các mục đó nằm ở "Đối chiếu nguồn" và chỉ dùng để soát.

## 1. Brief nằm ở đâu

- Brief của loạt nằm ở `video-briefs/VIDEO-BRIEF-V<NN>-<các số câu>.md` trong repo `sat-hach-lai-xe`; `video-briefs/README.md` có luật của loạt, bảng 29 video và bảng câu nào thuộc video nào. Brief đầu tiên (khuôn cũ) là `VIDEO-BRIEF.md` ở gốc repo. Người dùng thường chỉ nói "làm V03".
- Ảnh cắt của từng câu: `images/crops/cau-<số>.jpg` trong repo đó. Câu sa hình là câu 486 đến 600.
- Bên này **chỉ đọc** repo kia. Tệp duy nhất bên này ghi ở đó là `VIDEO-HANDOFF.md`, và chỉ khi điều kiện thay đổi.

## 2. Mỗi video cần gì

| Mục | Bắt buộc | Thiếu thì |
|---|---|---|
| Danh sách tình huống, theo thứ tự xuất hiện | có | hỏi người dùng |
| Giọng đọc (giọng nhân bản nào, hay giọng Gemini) | không | Gemini Leda |
| Chủ giọng đã duyệt nội dung brief chưa (khi dùng giọng nhân bản) | có | hỏi người dùng; chưa duyệt thì chưa tạo giọng |
| Video có dùng cho mục đích thương mại không | không | coi là không; nếu có thì không dùng giọng nhân bản (`vi-explainer-video/references/voices.md`) |
| Khán giả | không | người mới học lái xe, chưa biết luật |
| Thông điệp của cả video (một câu) | không | tự viết từ các quy tắc của những câu được chọn, ghi vào báo cáo |
| Độ dài mong muốn | không | khoảng 5 phút cho bốn tình huống; V02 ra 6:31, nên đếm âm tiết trước (`series.md` §3) và báo khi vượt |
| Khổ hình | không | 1920×1080, 30 fps, ngang |
| Mẹo nhớ cho từng câu | không | lấy từ phần giải thích; không có thì bỏ thẻ ghi nhớ |
| Điều cần báo lại sau khi làm | không | mẫu ở `qa.md` §7 |

Cấu hình đã chạy thật: **bốn tình huống** (V02, khuôn của loạt) và ba câu (khuôn cũ). Brief có số khác: đọc `new-cases.md` §5, rồi nói với người dùng trước khi nhận.

Tình huống có ảnh vẽ từ ghế lái (brief có mục "Dựng lại từ trên cao") chưa được thử: nói với người dùng trước khi nhận.

Skill mới chạy với câu là **sơ đồ nút giao nhìn từ trên xuống**. Câu dạng khác trong chương VI, và 120 tình huống mô phỏng (`th-N`), chưa được thử: nói với người dùng trước khi nhận.

## 3. Mỗi câu cần gì

| Mục | Dùng để | Thiếu thì |
|---|---|---|
| Số câu | chỉ để tìm ảnh cắt và đối chiếu; không lên video | hỏi |
| "Câu hỏi nêu trong video" | lời đọc và chữ của khung Tình huống | hỏi |
| "Kết luận nêu trong video" | khung Chốt | hỏi |
| "Mẹo nhớ" | thẻ mẹo nhớ và dòng tổng kết | lấy từ phần giải thích, ghi vào báo cáo |
| Đường dẫn ảnh cắt | dựng lại bố cục | hỏi; không dựng theo mô tả chữ khi chưa xem ảnh |
| "Đối chiếu nguồn": đề, phương án, đáp án gốc | soát rằng lời giải thích dẫn tới đúng đáp án; **không lên video** | hỏi; không tự suy ra đáp án |
| Mô tả hình: từng xe (loại, màu, chữ cái nếu có, đứng ở nhánh nào, đi hướng nào), biển, đèn, mũi tên, vạch | đối chiếu với ảnh | đọc từ ảnh, ghi vào báo cáo |
| Tên chính thức của từng biển báo | lời đọc và thẻ biển ở cột chữ | hỏi; không tự đặt tên biển |
| Giải thích: quy tắc áp dụng và thứ tự xe đi | khung quy tắc, khung xe chạy | hỏi; không tự viết phần luật |
| Phần giải thích đã đối chiếu với luật hay chưa | mục "Chưa kiểm" của báo cáo | coi là chưa |
| Gợi ý chuyển động | khung xe chạy | theo khuôn của kiểu nút giao (`new-cases.md` §2) |

## 4. Đối chiếu

Làm với **từng câu**, trước khi viết kịch bản:

1. Mở ảnh cắt bằng Read. Đếm xe, ghi loại xe, màu, chữ cái trên xe, xe ở nhánh nào, mũi tên chỉ hướng nào, biển và đèn ở góc nào.
2. So với mô tả trong brief. Khác nhau thì **tin ảnh** và ghi lại chỗ khác.
3. Đi theo phần giải thích trên ảnh: thứ tự xe mà phần giải thích nêu có ra đúng phương án được ghi là đáp án không.
4. So chữ: đề và phương án trong brief có đúng với chữ in trong ảnh không (nếu ảnh có chữ).
5. Xếp tình huống vào một trong các kiểu nút giao đã có (`series.md` §6), hoặc ghi là kiểu mới (`new-cases.md` §1).
6. Liệt kê xe, biển, đèn, vật thể cần có; đánh dấu thứ chưa có mô hình hay mặt biển (`new-cases.md` §4).

| Thấy gì | Làm gì |
|---|---|
| Mô tả hình khác ảnh | Dựng theo ảnh. Ghi vào "Đối chiếu brief" |
| Phần giải thích không dẫn tới đáp án được ghi | **Dừng câu đó** và hỏi người dùng. Không tự chọn bên nào đúng |
| Phần giải thích có vẻ trái luật nhưng vẫn khớp đáp án | Làm theo brief. Ghi nghi vấn vào "Đối chiếu brief" để chủ repo kiểm |
| Brief không nói vì sao một xe được đi trước | Lời đọc chỉ nêu thứ tự, không bịa lý do. Ghi vào báo cáo |
| Ảnh mờ, không đọc được biển hay hướng mũi tên | Hỏi người dùng |
| Đề hay phương án trong brief khác chữ trong ảnh | Dùng chữ trong brief (đó là bản đã gõ lại), ghi chỗ khác vào báo cáo |

## 5. Hỏi hay tự quyết

- **Hỏi một lần, gộp mọi câu hỏi:** thiếu đáp án gốc, thiếu danh sách tình huống, chủ giọng chưa duyệt (khi dùng giọng nhân bản), giải thích mâu thuẫn với đáp án, ảnh không đọc được, cần tên chính thức của biển.
- **Tự quyết rồi ghi vào báo cáo:** khán giả, thông điệp, độ dài, màu xe khi ảnh đen trắng, cỡ và góc xoay của ô, vị trí nhãn, nhạc, hiệu ứng âm thanh, cách chia câu lời đọc.
- **Không bao giờ tự làm:** đổi ý của câu hỏi hay kết luận trong brief; cắt lý do để vừa thời lượng; đưa số câu, "đáp án", "phương án", tên kỳ thi hay tên sách lên video; sửa phần luật; đưa ảnh chụp của sách vào video; tạo giọng nhân bản cho kịch bản chủ giọng chưa duyệt.

Câu hỏi về nội dung thì người dùng chuyển cho bên `sat-hach-lai-xe`. Bên này không tự sửa tệp nào ở repo đó.

## 6. Trả lại gì cho bên soạn brief

Mục "Đối chiếu brief" của báo cáo (`qa.md` §7), viết sao cho người dùng chép nguyên sang bên kia được:

- từng chỗ mô tả khác ảnh: câu nào, brief ghi gì, ảnh cho thấy gì, video dựng theo cái nào;
- từng nghi vấn về luật hay đáp án;
- từng điều lời đọc nói thêm ngoài brief (câu mở đầu, câu nối, mẹo nhớ tự đặt);
- thứ đã tạo mới vì brief cần (mô hình, mặt biển, kiểu nút giao), để brief sau biết là đã có.
