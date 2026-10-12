---
workflow: faceless-explainer
flow: automation
storyboard: no
message: "Động cơ đốt nhiên liệu để lấy nhiệt, đổi nhiệt thành chuyển động quay rồi thành chuyển động của xe; động cơ 4 kỳ làm xong một chu trình công tác trong 4 hành trình của pít tông và chỉ có một lần sinh công."
destination: youtube
aspect: 1920x1080
language: vi
audience: "Người đang học lái và người đang lái ô tô muốn hiểu chiếc xe của mình làm việc ra sao; không giả định người xem biết gì về máy móc, và không giả định người xem đang ôn thi."
length: 330s
angle: how-it-works
narration: yes
voice: Leda
style: glass-keynote
---

## Intent

Video thử nghiệm cho chương Cấu tạo và sửa chữa: Bài 1, "Động cơ: nơi nhiên liệu biến thành chuyển động", phần 1 (ý 1 và ý 2). Chương này phần lớn là định nghĩa, và người học hay gán nhầm việc của bộ phận này cho bộ phận kia. Vì vậy video không kể một chuyến đi như chương Kỹ thuật lái xe, mà mở máy ra trên một "bàn máy": mặt cắt 2D của xi lanh, của chiếc xe, chuyển động khớp từng chữ với lời đọc.

Mỗi ý đi theo ba nhịp, và ba nhịp ấy có tên trên hình:

1. **Xem nó làm việc.** Bộ phận chuyển động trước, tên gọi hiện lên đúng lúc lời đọc nhắc tới nó.
2. **Gọi đúng tên việc.** Dòng Chốt của bài sáng dần từng chữ; mỗi thuật ngữ trong câu làm sáng đúng bộ phận ấy trên hình.
3. **Dễ nhầm với.** Thứ hay bị nhầm đặt ngay cạnh: động cơ và phanh; số hành trình và số lần nổ; 4 kỳ và 2 kỳ.

Giọng điệu như một người thợ cả kiên nhẫn chỉ cho người mới: chậm, rõ, gọi tên từng chi tiết.

Nội dung lấy từ `video-briefs/chuong-4-cau-tao-va-sua-chua/BAI-01-dong-co.md` của repo sat-hach-lai-xe: câu hỏi mở đầu thứ nhất, ý lớn của bài, ý 1, ý 2 và ba dòng ghi nhớ tương ứng. Ý 3 (vì sao động cơ diesel không nổ) cùng câu hỏi mở đầu thứ hai để dành cho phần 2; khung cuối của video này nêu lại câu hỏi ấy.

## Notes

- Giọng Gemini TTS (`gemini-3.8-flash-tts`), giọng Leda (mặc định của dự án).
- Phụ đề căn theo chữ kịch bản; nhạc nền Lyria dài bằng lời đọc.
- Dòng Chốt của từng ý là định nghĩa chuẩn: lời đọc và chữ trên hình giữ đủ từng vế, không thêm, không bớt, không đổi nghĩa.
- Bốn hành trình là danh sách đánh số của bài: giữ số 1 đến 4 và thứ tự Nạp, Nén, Cháy và giãn nở, Xả.
- Con số của quy tắc giữ nguyên: 4 hành trình, một lần sinh công, hai vòng trục khuỷu, 2 hành trình ở động cơ 2 kỳ. "Nặng hơn một tấn" là con số ví dụ của bài.
- Giữ chữ rào đón "thường gọi là kỳ nổ".
- Không thêm kiến thức ngoài bài. Hình không gọi tên chi tiết nào bài không gọi tên: đường truyền lực chỉ ghi "hệ thống truyền lực" (ly hợp, hộp số là việc của Bài 3); chi tiết châm lửa trên nắp xi lanh không có nhãn cho tới khung cuối, nơi câu hỏi để dành của bài gọi nó là "bugi đánh lửa" (bugi và vòi phun làm việc ra sao là việc của ý 3); hai ô của động cơ 2 kỳ không có tên và không ô nào được chỉ là ô sinh công.
- Xe vẽ theo kiểu máy đặt trước, bánh sau chủ động, để thấy rõ đường đi của lực và phân biệt bánh chủ động với bánh lăn theo. Đây là lựa chọn minh họa, bài không quy định.
- Ở khung nói về bánh xe chủ động, xe được kê lên hai giá đỡ để thấy chỉ bánh nhận lực quay còn bánh kia đứng yên. Cũng là lựa chọn minh họa, bài không tả cảnh này.
- Các hình còn lại vẽ theo sơ đồ, không theo tỉ lệ: hạt nhiên liệu hiện ra trong buồng cháy mà không vẽ nguồn phun; bốn xi lanh lần lượt nổ nhưng không ghi thứ tự; biểu đồ "tạo ra sức đẩy, tiêu bớt sức" chỉ cho thấy một hành trình đẩy và ba hành trình tiêu sức, không đo độ lớn.
- Màu là nghĩa, dùng thống nhất: cam là sức nóng (nhiệt năng), xanh lá là chuyển động và lực (cơ năng, sinh công, bánh xe chủ động), xanh da trời là không khí và khí mới, hổ phách là nhiên liệu, xám tím là khí đã cháy, đỏ là cách hiểu sai.
- Video đứng một mình: lời đọc, chữ trên hình và phụ đề không nhắc tới số câu, kỳ kiểm tra hay cuốn sách nào.
- Phần "vì sao" trong bài do người soạn bài viết và mới được AI soát, chưa có giáo viên dạy lái xe duyệt; báo cáo ghi rõ.
