---
workflow: faceless-explainer
flow: automation
storyboard: no
message: "Ở ngã tư có biển, xe trên đường ưu tiên đi trước; các xe ở đường không ưu tiên đi sau, nhường xe bên phải, và rẽ trái đi sau cùng."
destination: youtube
aspect: 1920x1080
language: vi
audience: "Người đang học lái và người đang lái xe muốn hiểu cách đi đúng; không giả định người xem đang ôn thi."
length: 300s
angle: how-to
narration: yes
voice: Leda
style: glass-keynote
---

## Intent

Video giải thích bốn tình huống ở ngã tư có biển báo bằng hình động 3D: bốn xe đi qua theo thứ tự, đường không ưu tiên rẽ trái đi sau, gặp biển Dừng lại, và hai xe cùng ở đường không ưu tiên. Mỗi tình huống đi bốn khung: Tình huống, Quy tắc, Xe chạy, Chốt. Cuối video có phần tổng kết, mỗi tình huống một dòng mẹo nhớ. Giọng điệu như một giáo viên dạy lái xe kiên nhẫn: chậm, rõ, không dùng từ khó.
Nội dung lấy từ `VIDEO-BRIEF-V02-487-496-492-497.md` của repo sat-hach-lai-xe. Chỉ dùng các mục "Câu hỏi nêu trong video", "Giải thích", "Kết luận nêu trong video" và "Mẹo nhớ"; mục "Đối chiếu nguồn" chỉ để soát, không lên hình, không đọc, không vào phụ đề.

## Notes

- Giọng Gemini TTS (`gemini-3.8-flash-tts`), giọng Leda (mặc định của dự án vì brief chưa chốt giọng). Chủ giọng nhân bản chưa đồng ý và mục đích thương mại chưa chốt, nên không dùng giọng nhân bản.
- Phụ đề căn theo chữ kịch bản; nhạc nền Lyria dài bằng lời đọc.
- Không nêu số liệu cá nhân, token hay đường dẫn riêng.
- Video đứng một mình: không có phần mở đầu, không giới thiệu loạt video, không so sánh với sách. Không có số câu, "đáp án", "phương án", kỳ thi, sát hạch hay tên sách trên hình, trong lời đọc và trong phụ đề; không hiện hay đọc các phương án trắc nghiệm, không đếm ngược, không có phương án sáng xanh. Các tình huống gọi là "Tình huống 1" đến "Tình huống 4". Chữ cái trên xe (xe A, xe B) và số hướng đi vẫn dùng làm nhãn trong cảnh.
- Mỗi tình huống đi bốn khung: Tình huống (cảnh hiện ra, giọng đọc đặt vấn đề, dừng một nhịp ngắn để người xem tự nghĩ), Quy tắc (kính lúp phóng to biển, thẻ quy tắc), Xe chạy (các xe lăn bánh đúng thứ tự, đúng hướng), Chốt (câu kết luận và thẻ ghi nhớ).
- Quan trọng nhất: xe chuyển động đúng thứ tự và đúng hướng. Hình đẹp là thứ yếu.
- Ảnh trong brief chỉ để tham chiếu, không đưa vào video: mọi thứ được vẽ lại bằng mô hình 3D.
- Bối cảnh ban ngày, sáng sủa. Mỗi tình huống một góc nhìn trên cao cố định, luôn thấy cả nút giao; không phóng to thu nhỏ trong lúc giải thích.
- Chi tiết nhỏ (biển báo) được phóng to bằng kính lúp ngay trên toàn cảnh.
- Bánh xe quay quanh trục của nó; xe rẽ theo cung tròn mượt; không lúc nào hai xe đè lên nhau.
- Làm mới lần đầu ở video này: biển "Dừng lại", biển "Bắt đầu đường ưu tiên", biển phụ "Hướng đường ưu tiên".
- Phần giải thích chưa đối chiếu với luật (cả bốn tình huống); báo cáo ghi rõ.
