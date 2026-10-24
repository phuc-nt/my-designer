# Nghề chuyển động: gợi ý cho bước storyboard

Đọc trước khi viết `STORYBOARD.md`. Đây là vốn từ để chọn, không phải danh sách phải làm đủ. Mỗi video dùng vài ý hợp với nội dung của nó. Ý nào trái với hệ thiết kế đã chọn thì bỏ. Một ý hay mà không có ở đây vẫn nên làm.

Các ý được rút từ việc đọc bộ prompt công khai [awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos) (khoảng 700 prompt làm video chuyển động) và mô tả các nhóm skill video trên Skillry, viết lại bằng lời của skill này. Không có prompt hay gói skill nào được chép vào đây.

## 1. Điều làm một video trông như có người dựng

- **Một vật mang câu chuyện.** Chọn một thứ (một thẻ, một chấm, một con số, một đường kẻ) có mặt qua nhiều khung và đổi vai dần. Người xem bám theo nó nên các khung thành một mạch.
- **Vật ở tiền cảnh làm cầu nối.** Thứ đang to nhất trên hình phóng lên, trượt đi hoặc mở ra thành khung sau. Đỡ phải dùng crossfade ở mọi chỗ.
- **Một chuyển động chính, vài chuyển động phụ.** Mỗi lúc chỉ một thứ dẫn mắt. Thứ phụ đi sau một nhịp ngắn và nhỏ hơn.
- **Tốc độ luôn đổi.** Vào nhanh rồi hãm, không đi đều. Một họ ease cho mọi cú vào là đủ để video có một giọng.
- **Việc gì xảy ra cũng để lại kết quả thấy được.** Bấm thì có thứ đổi màu, đếm thì có cột cao lên, gạch thì có chữ khác thay vào.
- **Đổi cỡ và đổi bố cục.** Hai khung liền nhau không cùng một kiểu xếp. Xen khung rất to (một chữ, một số) với khung nhiều chi tiết.
- **Hình đầu tiên đã là một bức hoàn chỉnh.** Khung mở không bắt đầu từ màn hình trống.
- **Tắt tiếng vẫn hiểu.** Ý chính của mỗi khung đọc được từ hình.
- **Mọi giá trị tính từ thời gian của timeline.** Con số đang đếm, vị trí, độ mờ đều phải ra đúng khi nhảy tới một giây bất kỳ. Không dùng đồng hồ thật hay số ngẫu nhiên.

Những thứ hay làm video trông rẻ, cân nhắc trước khi dùng: hạt bay tung, phát sáng quanh mọi thứ, loé ống kính, rung máy, tách màu RGB, nảy tưng tưng, crossfade ở mọi chỗ cắt.

## 2. Giữ hình sống khi lời còn đang đọc

Video có lời đọc được phép dừng hình lâu hơn phim quảng cáo, nhưng một khung đứng yên quá nửa thời lượng thì thành slide. Vài cách:

- **Rải mốc theo lời.** Mỗi phần hiện ra khi lời chạm tới nó, thay vì hiện hết ở giây đầu.
- **Để một thứ chạy suốt khung:** thanh tiến độ, số đếm, đường vẽ dần, máy quay đẩy rất chậm (khoảng 2 tới 4% cả khung).
- **Chia khung dài.** Lời dài hơn khoảng 12 giây thì tách thành hai khung, hoặc đổi trọng tâm giữa chừng: phóng vào một chi tiết, làm mờ phần đã nói.
- **Đo sau khi render** bằng `scripts/motion-audit.mjs` (bước 10). Số đo ba video đã làm: 52%, 24% và 4% thời lượng đứng hình. Con số này chỉ nói hình có động hay không, không nói động có đẹp hay không.

## 3. Vốn kiểu cảnh

Dùng khi nghĩ "khung này nên trông thế nào". Kiểu có sẵn khung dựng ghi trong ngoặc (`scene-templates/README.md`); các kiểu còn lại worker tự dựng.

| Nhóm | Hợp với lời… | Vài cách dựng |
|---|---|---|
| So sánh | đặt hai hay nhiều thứ cạnh nhau | cột mọc lần lượt (`bar-compare`), trước và sau (`before-after-stat`), bảng tính năng lật từng ô, một đấu nhiều, đường xu hướng vẽ dần, bốn góc phần tư |
| Sơ đồ | giải thích một thứ gồm những phần nào, chạy ra sao | chú thích kéo ra từ vật (`callout-anchor`), nhánh mọc từng nhánh, vòng lặp khép lại, phễu, trục và nan hoa, ống dẫn toả ra kết quả, kim tự tháp nhiều tầng |
| Trình tự | kể các bước hay các mốc | ba bước (`three-step-flow`), dòng thời gian (`timeline-scan`), danh sách tích dần (`checklist-tick`), thẻ dồn lại kèm số đếm |
| Chữ | nêu một ý, một định nghĩa, một câu hỏi | chữ chiếm cả khung, định nghĩa rồi nói lại, từ khoá hiện theo lời, câu hỏi rồi lặng một nhịp, ngộ nhận và sự thật (`myth-fact-swap`) |
| Con số | nêu một số liệu | số lớn (`big-number-card`), số đếm lên, số gắn với một chi tiết trên hình |
| Soi vào | chỉ một chỗ trên ảnh, giao diện, trang giấy | khoanh vùng rồi phóng, trích dẫn có nguồn, làm tối phần còn lại |
| Chia đôi và ghép | hai mạch song song, nhiều mảnh nhỏ | chia đôi màn hình, lưới ảnh lật, hình nhỏ trong hình |
| Chương | mở một phần mới | thẻ chương đóng dấu, chồng nhãn, quét đa giác hoặc tan ô sang phần sau |

Không cần gắn mỗi khung vào một nhóm. Khung có hình riêng của nội dung (một cỗ máy, một bản đồ, một cảnh 3D) thường hay hơn mọi kiểu trong bảng.
