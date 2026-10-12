# Loạt video Chương IV · Cấu tạo và sửa chữa

Brief nằm ở `/Users/phucnt/workspace/sat-hach-lai-xe/video-briefs/chuong-4-cau-tao-va-sua-chua/`: `README.md` (luật của chương, bảng thuật ngữ, hình có sẵn, mức độ kiểm chứng), `BAI-01…BAI-09-*.md` (mỗi bài một tệp), `DOI-CHIEU.md` (bảng đối chiếu nguồn, chỉ để soát). Repo đó chỉ đọc.

## 1. Luật nội dung và cách áp dụng

| Luật của chương | Trong video nghĩa là |
|---|---|
| Dòng **Chốt** là định nghĩa chuẩn: nói gọn được, không thêm, không bớt, không đổi nghĩa | Khung "gọi đúng tên" đọc đúng một câu là dòng Chốt, và câu ấy sáng dần từng chữ trên thẻ (`karaoke`). Từng vế có việc của nó: "truyền **hoặc ngắt**", "**một phần** lực va đập", "không tắt **trong thời gian dài**", "trong khoảng **giữa hai vạch**". Bỏ một vế là sai |
| Danh sách đánh số là trình tự thật | Giữ số và thứ tự, trên lời đọc và trên hình (`numbered`, `stepCard`). Bốn bước kiểm tra dầu (Bài 2), ba bước khởi động (Bài 5), năm bước trước khi nâng xe (Bài 8). Danh sách không đánh số trong bài thì dùng dấu chấm hay icon, không tự đánh số |
| Số trong quy tắc giữ nguyên | 4 hành trình và một lần sinh công; 25 năm; 20 năm; trên 8 chỗ ngồi. Lên hình đúng như bài viết |
| Số trong ví dụ là xấp xỉ | Giữ chữ "khoảng", "vài" ngay cạnh con số (50 km/h là khoảng 14 mét mỗi giây; ống xả nóng vài trăm độ). Bài không có số thì hình không có số: thanh và biểu đồ chỉ so độ lớn |
| Màu và hình của ký hiệu là kiến thức (Bài 5, 7, 8) | Vẽ lại ký hiệu đúng lời tả trong bài và ảnh ở "Hình có sẵn"; lời đọc tả hình và màu như bài tả. Màu của ký hiệu thắng bảng màu của bàn máy |
| Chữ rào đón giữ nguyên | "trên nhiều xe", "trên hầu hết các xe", "thường" có mặt trong lời đọc và trên thẻ |
| Không thêm kiến thức ngoài bài | Không nhãn nào cho thứ bài không gọi tên. Thiếu thì ghi vào báo cáo, không tự bù |
| Nội dung đứng một mình | Không số câu, kỳ thi, sát hạch, cuốn sách. `scan-words.mjs` cấm cả các số 264–300 đứng riêng (dải số câu của chương): bài có một con số thật trong dải đó thì sửa danh sách cấm trong dự án và ghi vào báo cáo |
| Mỗi ý tách được thành một đoạn riêng, nhưng nên mang theo "Ý lớn của bài" | Video nào cũng có một đến hai khung ý lớn, kể cả phần 2, phần 3 của cùng một bài |
| Thuật ngữ theo bảng của README | Dùng tên ở cột "Trong bài dùng". Tên thường gọi (côn, phanh tay, mô tơ đề, pô) chỉ nói khi bài nói, và chỉ một lần |

Bốn sợi chỉ của chương, dùng làm câu nối hay câu kết: mỗi bộ phận có một việc riêng; chiếc xe luôn báo tình trạng của nó và người lái phải biết đọc; thiết bị an toàn làm việc theo lớp, chỉ có tác dụng khi còn tốt và được dùng đúng; yêu cầu kỹ thuật nào cũng có lý do.

Mức độ kiểm chứng, phải nhắc lại trong mọi báo cáo: dòng Chốt và các trình tự đã được đặt cạnh nguồn; phần "vì sao" do người soạn viết và mới được AI soát; **chưa có giáo viên dạy lái xe hay người có chuyên môn nào đọc duyệt bộ bài này.** Hai ý nền (Bài 3 ý 4, Bài 7 ý 7) có dòng Chốt do người soạn viết. README của brief liệt kê những điểm kém chắc nhất; đụng tới điểm nào thì nêu trong báo cáo:

- Bài 8 ý 3: xử lý cháy trong khoang máy (hé nắp ca pô).
- Bài 9 ý 5: năm cuối của niên hạn. **Bài cố ý không cho ví dụ "xe sản xuất năm này thì hết niên hạn năm nào"; video cần ví dụ như vậy thì hỏi người dùng trước.**
- Bài 9 ý 1 (câu chữ giống luật cũ); Bài 9, lý do của hướng miệng ống xả và của tay lái bên trái.
- Bài 8 ý 2: đập búa vào góc kính, kính cửa bên nhiều lớp.
- Bài 7 ý 2: đèn kiểm tra động cơ nhấp nháy. Bài 7 ý 4: màu đèn ABS (ảnh gốc in đỏ cam, bài viết theo xe thật là vàng hoặc cam; khi phân vân về màu thì đọc ba chữ ABS).

## 2. Khuôn của một video

Mỗi tệp bài có: Câu hỏi mở đầu, Ý lớn của bài, các ý đánh số, Những chỗ hay hiểu sai, Ghi nhớ, Tự kiểm tra. Video dùng:

| Khung | Lấy từ | Trên hình |
|---|---|---|
| 1. Mở | Câu hỏi mở đầu | Thẻ tên bài (chữ gradient duy nhất của video); một điều quen mắt; câu hỏi hiện từng chữ (`question`). Không trả lời ở khung này. Bàn máy cho thấy cả chiếc xe hay cả bộ phận, rồi phóng vào chỗ sắp mở ra |
| 2–3. Ý lớn | Ý lớn của bài | Cơ chế gốc chạy một lượt trên bàn máy, chưa có thanh ba bước |
| Mỗi ý, bước 1: **Xem nó làm việc** (2–6 khung) | Phần giảng của ý | Bộ phận chuyển động; mỗi tên gọi hiện bằng nhãn đúng lúc được đọc; một cụm từ của lời đọc làm sáng đúng một chỗ trên hình. Khung đầu của ý đưa thanh ba bước vào |
| Mỗi ý, bước 2: **Gọi đúng tên** (1 khung) | Dòng Chốt | Lời đọc là đúng một câu Chốt. Thẻ có viền tím nhạt, câu sáng dần từng chữ, thuật ngữ đổi màu theo nghĩa; mỗi thuật ngữ làm sáng lại đúng bộ phận ấy trên hình. SFX `chime` |
| Mỗi ý, bước 3: **Dễ nhầm với** (1–2 khung) | Những chỗ hay hiểu sai (mục thuộc ý này) | Thứ hay bị nhầm đặt ngay cạnh, cùng cỡ, cùng kiểu vẽ. Dấu đúng và dấu sai chỉ ở đây |
| 1–2 khung ghi nhớ | Ghi nhớ | Chỉ các dòng của những ý có trong video; hình chạy lại từng dòng |
| Khung cuối | Câu hỏi mở đầu thứ hai, hoặc ý của phần sau | Câu hỏi để dành cho phần sau (bài còn ý chưa làm), hoặc một câu kết giữ tới hết |

Không dùng "Tự kiểm tra" (đó là câu hỏi ôn). Mục "hay hiểu sai" nào không thuộc ý có trong video thì để lại cho phần sau.

Bài 1 phần 1 đã làm: 21 khung = 1 mở + 2 ý lớn + ý 1 (4 xem, 1 gọi tên, 1 dễ nhầm) + ý 2 (6 xem, 1 gọi tên, 2 dễ nhầm) + 2 ghi nhớ + 1 câu hỏi để dành.

Ba bước sinh ra từ các ý kiểu "công dụng" (bộ phận này làm việc gì). Chương còn ba kiểu ý khác. Cách đặt ba bước cho chúng dưới đây là **gợi ý, chưa video nào thử**; bài đầu tiên của mỗi kiểu phải soát kỹ ảnh và ghi lại vào tệp này điều đã chạy được.

| Kiểu ý | Ở bài | Xem nó làm việc | Gọi đúng tên | Dễ nhầm với |
|---|---|---|---|---|
| Công dụng | Bài 1; 2 ý 1, 3; 3; 4 ý 1, 3, 4; 5 ý 1, 2; 6 ý 1, 3; 8 | Bộ phận chạy trên bàn máy | Dòng Chốt | Bộ phận bị gán nhầm việc (động cơ và phanh; ly hợp và hộp số; ắc quy và máy phát) |
| Trình tự thao tác | Bài 2 ý 2; 5 ý 3; 8 ý 1–3 | Từng bước một, có số, bước đang đọc sáng lên, bước xong giữ dòng gọn | Dòng Chốt | Bước hay bị bỏ hay làm sai thứ tự, đúng như mục "hay hiểu sai" nêu |
| Yêu cầu kỹ thuật | Bài 4 ý 2; 6 ý 2, 4; 9 | Từng yêu cầu chỉ vào đúng chỗ trên bộ phận, kèm lý do của nó | Dòng Chốt, chia theo vế khi dài | Cách hiểu thiếu một vế |
| Ký hiệu | Bài 7; 8 ý 4; 5 ý 3 | Ký hiệu được vẽ ra từng nét với đúng màu, cạnh thứ nó nói tới | Dòng Chốt: hình, màu, nghĩa | Ký hiệu trông giống nó, đặt cạnh (bảng bốn ký hiệu ở Bài 7 ý 7) |

Dòng Chốt dài (Bài 4 ý 2, Bài 9 ý 1, Bài 9 ý 3 và ý 4) chưa được thử trên thẻ định nghĩa. Chia theo dấu chấm hay dấu chấm phẩy của chính dòng Chốt thành hai, ba khung "gọi đúng tên" nối nhau, mỗi khung đọc trọn một vế; không rút gọn để vừa thẻ.

## 3. Ngân sách thời lượng

Số đo thật: **924 âm tiết lời đọc, 21 khung, 343 giây** với giọng Leda, tức 2,69 âm tiết mỗi giây kể cả khoảng lặng cuối khung (README của brief ước 2,7).

| Mục tiêu | Âm tiết lời đọc |
|---|---|
| 4 phút | khoảng 650 |
| 5 phút | khoảng 810 |
| 5 phút rưỡi | khoảng 890 |
| 6 phút | khoảng 970 |

Đếm trước khi tạo giọng:

```bash
(cd "$P" && node scripts/voice.mjs request)   # "… 21 lines, 924 syllables, about 343 s with Leda"
```

**Không đếm bằng `wc -w`:** trên macOS nó tách một chữ tại ký tự "à" và đếm dư (kịch bản Bài 1: 974 thay vì 924).

Lời đọc dài hơn phần giảng của các ý được chọn: nó còn câu hỏi mở đầu, ý lớn, phần dễ nhầm và ghi nhớ. Ở Bài 1 phần 1, hai ý dài 625 âm tiết trong brief thành 924 âm tiết lời đọc, tức thêm khoảng 300. Dùng số đó để ước lượng khi chia bài: **âm tiết của các ý + khoảng 300**. Một video chở được chừng 500 đến 650 âm tiết của các ý.

Chia theo ý, không cắt giữa một ý; mỗi video tự đứng được (có mở, có ý lớn, có ghi nhớ của riêng nó). Vượt 6 phút rưỡi thì chia tiếp, không tự cắt phần "vì sao".

## 4. Chín bài

Cột "Âm tiết các ý" lấy từ tệp bài, theo thứ tự các ý. "Gợi ý chia" tính bằng cách ở §3 và chỉ là ước lượng: đếm lại bằng `voice.mjs request` khi đã có kịch bản.

| Bài | Tên | Âm tiết các ý | Tệp brief | Gợi ý chia | Trạng thái |
|---|---|---|---|---|---|
| 1 | Động cơ: nơi nhiên liệu biến thành chuyển động | 269, 356, 390 | `BAI-01-dong-co.md` | P1: ý 1–2 · P2: ý 3 (khoảng 4:20) | **P1 đã làm**; P2 chưa |
| 2 | Dầu bôi trơn và việc bảo dưỡng xe | 391, 423, 306 | `BAI-02-dau-boi-tron-va-bao-duong.md` | P1: ý 1 (4:20) · P2: ý 2 (4:30) · P3: ý 3 (3:45); hoặc gộp ý 2–3 (6:20) | chưa làm |
| 3 | Đường đi của lực: ly hợp, hộp số và cầu chủ động | 157, 255, 320, 408 | `BAI-03-duong-di-cua-luc.md` | P1: ý 1–2 (4:25) · P2: ý 3–4 (6:20) | chưa làm |
| 4 | Hệ thống lái, hệ thống phanh và đèn phanh | 215, 374, 194, 282 | `BAI-04-he-thong-lai-va-phanh.md` | P1: ý 1–2 (5:30) · P2: ý 3–4 (4:50) | chưa làm |
| 5 | Ắc quy, máy phát điện và nút khởi động | 218, 244, 315 | `BAI-05-ac-quy-may-phat-nut-khoi-dong.md` | P1: ý 1–2 (4:45) · P2: ý 3 (3:50) | chưa làm |
| 6 | Dây đai an toàn, túi khí và kính chắn gió | 218, 304, 293, 364 | `BAI-06-day-dai-tui-khi-kinh-chan-gio.md` | P1: ý 1–2 (5:05) · P2: ý 3–4 (5:55) | chưa làm |
| 7 | Đọc đèn báo trên bảng đồng hồ | 257, 221, 238, 294, 248, 208, 367 | `BAI-07-den-bao-tren-bang-dong-ho.md` | P1: ý 1–2 · P2: ý 3–4 · P3: ý 5–6 · P4: ý 7 (mỗi phần 4:30–5:30) | chưa làm |
| 8 | Kích, búa thoát hiểm, bình chữa cháy và nút đèn khẩn cấp | 351, 396, 399, 315 | `BAI-08-do-nghe-va-den-khan-cap.md` | Mỗi ý một video (khoảng 4 phút) | chưa làm |
| 9 | Chiếc xe đủ điều kiện ra đường | 474, 199, 465, 312, 277 | `BAI-09-xe-du-dieu-kien-ra-duong.md` | P1: ý 1 (4:50) · P2: ý 2–3 (6:00) · P3: ý 4–5 (5:30) | chưa làm |

Bài 7 có "Ý lớn" dài (242 âm tiết: đọc màu trước); mỗi phần của bài mang một bản rút gọn của nó. Bài 9 dùng lại nhiều bộ phận của các bài trước, hợp làm sau cùng.

**Hình có sẵn** (ảnh chụp từ tài liệu gốc, ở `images/crops/` của repo nội dung; chỉ để tham khảo hình dạng và màu, vẽ lại bằng canvas, không dán ảnh):

| Bài | Ảnh |
|---|---|
| 5 ý 3 | `cau-290.jpg` nút khởi động và chìa khoá thông minh |
| 7 ý 1–6 | `cau-286` nhiệt kế trên hai đường lượn sóng, đỏ · `cau-287` khối động cơ, vàng · `cau-288` chấm than trong mặt cắt lốp đáy răng cưa, vàng · `cau-289` chữ ABS trong vòng tròn giữa hai cung tròn · `cau-295` vô lăng kèm chấm than, đỏ · `cau-300` chữ ECO trên nền xanh lá |
| 7 ý 7 | `cau-227` đèn báo phanh · `cau-231` đèn báo nhiên liệu (ảnh thuộc Chương III). Đèn chiếu xa nhắc ở ý 6 không có ảnh |
| 8 | `cau-296` kích hình thoi kèm tay quay · `cau-297` búa thoát hiểm màu cam, đầu nằm ngang · `cau-298` bình chữa cháy đỏ kẹp trong xe · `cau-299` hai tam giác lồng nhau, đỏ |

## 5. Bài nào cần vẽ gì

Cột "Phải vẽ" suy từ tên ý và dòng Chốt, để ước lượng công; đọc brief rồi mới chốt. Bộ phận trong `kit/` tả ở `bench.md` §4; các bảng (dải mắt xích, thanh bốn ô, bảng ba thứ, bảng so sánh hai cột) nằm trong `widgets.js` của ví dụ Bài 1.

| Bài | Đã có | Phải vẽ |
|---|---|---|
| 1 P2 (diesel không nổ) | Xi lanh cắt dọc chạy đủ bốn hành trình; chi tiết châm lửa ẩn được hoặc thành nét đứt (`igniter`, `ghost`); bảng "ba thứ cần cho sự cháy"; xe thân kính có bình nhiên liệu và dòng chảy (`flow`) | Đường nhiên liệu từ bình tới động cơ với lõi lọc; lọc khí trên đường nạp; bọt khí và tạp chất trong nhiên liệu; khí bị nén nóng lên rồi nhiên liệu tự cháy |
| 2 | Xi lanh (chỗ có ma sát: pít tông với thành xi lanh, trục khuỷu) | Các-te chứa dầu, đường dầu đi tới các chi tiết (màu mới cho dầu); bảng sáu công dụng; que thăm dầu có hai vạch và bốn bước; hình cho việc bảo dưỡng |
| 3 | Xe thân kính với đường truyền lực là một nét (`CAR.driveline`); bánh chủ động; giá kê | Tách đường truyền lực thành động cơ, ly hợp, hộp số, truyền động các đăng, cầu chủ động, bánh xe chủ động; ly hợp nối và ngắt; cặp bánh răng to nhỏ, số lùi, số 0; trục các đăng lệch góc; truyền lực chính vuông góc; vi sai khi xe vào cua (nhìn từ trên) |
| 4 | Bánh xe và phanh đĩa (`drawBrake`: má kẹp, sức nóng); xe nhìn ngang | Xe nhìn từ trên với vô lăng và bánh xe dẫn hướng; cơ cấu lái; xe đứng yên trên dốc; mô tô nhìn từ phía sau với đèn phanh, cảnh ban đêm |
| 5 | Dãy xi lanh hoặc hình động cơ nhỏ (`drawBank`, `drawBore`) để cho thấy máy đang chạy hay đứng | Ắc quy; máy phát điện kéo bởi động cơ; phụ tải; dòng điện (màu mới); nút khởi động và chìa khoá thông minh; bàn đạp phanh và hành trình của nó |
| 6 | Xe nhìn ngang chạy rồi dừng (đường `carX`) | Người ngồi trên ghế; dây đai, khoá cài, hộp cuốn và cơ cấu hãm; túi khí bung; mặt cắt kính nhiều lớp và kính tôi |
| 7 | Bộ phận mà ký hiệu nói tới: xi lanh, bánh xe, phanh | Bảng đồng hồ; tám ký hiệu đúng hình và màu; bảng so sánh bốn ký hiệu dễ lẫn |
| 8 | Xe nhìn ngang, bánh xe | Kích hình thoi và tay quay, xe được nâng; búa và cửa kính; bình chữa cháy và các bước dùng; nút hai tam giác, đèn báo rẽ nháy cùng lúc |
| 9 | Xe nhìn ngang | Xe nhìn từ trước và từ sau với từng loại đèn, biển số; ống xả và hướng miệng thoát (nhìn từ trên); lốp; thước niên hạn 25 năm và 20 năm |

Thứ tự gợi ý nếu người dùng không chỉ định, tính theo phần dùng lại được: Bài 1 P2 → Bài 3 → Bài 4 → Bài 2 → Bài 5 → Bài 6 → Bài 8 → Bài 7 → Bài 9. Bài nào thêm bộ phận nào vào `kit/` thì sửa bảng này.

## 6. Đã làm

| Video | Dự án | Nội dung | Số đo | Ghi chú |
|---|---|---|---|---|
| Bài 1, phần 1 | `videos/chuong-4-bai-01-dong-co` | Câu hỏi mở đầu thứ nhất, ý lớn, ý 1 (động cơ làm việc gì), ý 2 (động cơ 4 kỳ), ba dòng ghi nhớ tương ứng; khung cuối nêu câu hỏi của ý 3 | 21 khung, 924 âm tiết, 343 giây (5:43), 1920×1080, 30 khung/giây; −13,7 LUFS, true peak −1,6 dBFS; 6 SFX | Người dùng duyệt ngày 2026-10-12. Độ to cao hơn khoảng mục tiêu 0,3 LU và được giữ. Xe vẽ máy đặt trước, bánh sau chủ động; xe kê trên giá ở khung bánh xe chủ động: hai lựa chọn minh hoạ, ghi trong BRIEF.md |
