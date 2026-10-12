# Loạt video Chương V · Báo hiệu đường bộ

Nguồn: `/Users/phucnt/workspace/sat-hach-lai-xe/video-briefs/chuong-5-bao-hieu-duong-bo/` (`README.md`, `BAI-01` … `BAI-28`, `DOI-CHIEU.md`, ảnh tham khảo `images/crops/cau-<số câu>.jpg`). Đọc `README.md` của thư mục đó trước mỗi bài: tệp này chỉ tóm tắt và nói cách áp dụng vào video.

## 1. Luật nội dung và cách áp dụng

| Luật của chương | Trong video |
|---|---|
| Dòng Chốt là định nghĩa chuẩn | Khung Chốt đọc nguyên dòng Chốt; thẻ `rule()` hiện nguyên văn, sáng dần từng chữ. Hằng của câu trong `build-frames.mjs` và lời đọc trong `SCRIPT.md` phải giống nhau từng chữ (script ném lỗi khi lệch). Được đặt dòng Chốt sớm hơn chỗ của nó trong bài khi nó thay một câu có cùng nội dung (Bài 1, khung 9), và được tách một dòng Chốt hai câu thành hai khung (Bài 1, khung 16–17); ghi vào Notes của `BRIEF.md` |
| Hình của biển là kiến thức | Vẽ theo lời tả của bài, rồi mở ảnh tham khảo để soát: dáng, màu viền, màu nền, hình, hướng gạch chéo (từ trên trái xuống dưới phải), hình quay về bên nào. Ghi ảnh đã xem vào Notes. Chỗ README nêu là dễ vẽ lệch (một gạch hay hai gạch ở Bài 8; mũi tên đỏ ở Bài 15; hướng người bước ở Bài 17; thùng xe nghiêng ở Bài 20; sọc vàng đen ở Bài 27; vạch ở Bài 28) phải có một ảnh phóng to trong lúc kiểm |
| Tên biển giữ nguyên từng chữ | Tên biển chỉ xuất hiện đúng như bài viết. Biển bài chưa đặt tên thì gọi bằng hình: "biển có hình xe khách xếp trên hình xe tải" |
| Con số và chữ trên biển giữ nguyên | Vẽ đúng chuỗi ký tự của bài ("2.5 t", "500m", "6:00 - 18:00"), kể cả dấu cách |
| Không gọi biển bằng số thứ tự, không mã biển | `scan-words.mjs` chặn "biển 1", "biển số 2", "biển thứ hai", "biển đầu", "biển cuối" và mã dạng `P.103`. Trên hình, các biển đứng cạnh nhau không đánh số; thẻ bước có số (`stepTag`) chỉ đánh số **bước đọc**, không đánh số biển |
| Giữ chữ rào đón | "Phần lớn", "thường", "Có thể hiểu lý do như sau", "Cách nhớ" có mặt trên lời đọc và trên thẻ, màu hổ phách (`pill(…, "hedge")` hay nhãn `lab(…, "§amber")`) |
| Không thêm kiến thức ngoài bài | Canvas chỉ vẽ ô nào bài có kết luận: xe nào bài không nói tới thì không cho tới gặp biển đó. Không mức phạt, không khoảng cách đặt biển |
| Nội dung đứng độc lập | Không số câu, kỳ thi, sách, số thứ tự bài, và không nhắc bài khác. Dải số câu của chương (301–485) nằm trong danh sách cấm của `scan-words.mjs`; bài có con số thật rơi vào dải đó (ví dụ "500m" không bị, "350" thì bị) thì sửa danh sách cấm trong dự án và ghi vào báo cáo |
| Mỗi ý tách được, mang theo "Ý lớn của bài" | Video phần 2, phần 3 của một bài vẫn mở bằng các khung cách đọc, gọn hơn |

**Bốn cách đọc biển của chương** (README): dáng và màu cho biết loại biển; hình bên trong cho biết lệnh nhằm vào ai, hướng nào, mức nào; vạch gạch chéo có ba nghĩa tuỳ chỗ nó nằm; biển dễ lẫn thì học theo cặp. Video nào cũng dựng "Ý lớn của bài" trên các cách đọc này, bằng chính lời của bài đó. Cách đọc thứ nhất là mẹo, có ngoại lệ: không viết "biển nền xanh lam thì không cấm gì".

**Mức độ kiểm chứng của nguồn** (ghi vào mọi báo cáo): dòng Chốt đã so với bảng đáp án của tài liệu gốc; phần "vì sao", cách đọc hình, mẹo nhớ và nghĩa của từ là của người soạn, mới được AI soát, chưa có giáo viên dạy lái xe duyệt, chưa so với quy chuẩn báo hiệu đường bộ. Dòng Chốt của Bài 1 ý 1 (ý nền) do người soạn viết.

## 2. Khuôn của một video

Mỗi tệp bài có: Câu hỏi mở đầu, Ý lớn của bài, các ý đánh số, Những chỗ hay hiểu sai, Ghi nhớ, Tự kiểm tra. Video dùng:

| Khung | Lấy từ | Tấm biển làm gì | Cột chữ |
|---|---|---|---|
| 1. Mở | Câu hỏi mở đầu | Một con phố; cột biển mọc lên, bốn lớp của biển ghép vào theo lời tả; xe của câu hỏi chạy tới và dừng trước vạch với dấu hỏi | Thẻ tên bài (chữ gradient duy nhất của video), thẻ tả biển, câu hỏi hiện từng chữ (`question`). Không trả lời ở khung này |
| Cách đọc (2–5 khung) | Ý lớn của bài, ý nền nếu có | **Biển tách lớp:** rời cột, phóng to, tách thành các lớp đứng cạnh nhau; lớp đang được đọc sáng lên. Thứ bài phải định nghĩa (các tên xe ở Bài 1) hiện thành từng ô, xe lăn vào đúng ô | Thanh các bước trượt vào ở khung đầu; mỗi bước một thẻ có số |
| Chốt của cách đọc (1 khung) | Dòng Chốt của ý nền, hoặc câu ý lớn | Biển ghép lại; từng lớp sáng lại khi câu Chốt đọc tới nó | Thẻ Chốt. SFX `chime` |
| Mỗi ý: tả biển (1 khung) | Lời tả biển của ý | Biển trở lại cột, hoặc **đổi hình ngay trên cột** (lật quanh cột) | Tên biển trong viên tím nhạt |
| Mỗi ý: Chốt (1 khung) | Dòng Chốt | **Biển đứng gác:** các xe được nêu trong câu sáng lên bên "bị cấm" hay "được đi" đúng lúc được đọc | Thẻ Chốt. SFX `chime` |
| Mỗi ý: xe nào, vì sao (1–3 khung) | Phần giảng và "vì sao" | Từng xe chạy tới, nhận ✓ hoặc ✕ và đi tiếp hay dừng lại; lý do hiện thành viên chữ cạnh xe. **Hai cổng** khi ý so hai biển | Dòng có ✓/✕, dòng lý do có mũi tên; nhãn hổ phách cho chữ rào đón |
| Ý dạng bảng (2–4 khung) | Ý "xe nào ở biển nào" | **Phố xếp chồng:** mỗi biển một con phố, cùng một xe (hay ba xe) thử lần lượt từng biển. **Phóng to** biển có chi tiết quyết định nghĩa | Thẻ theo từng xe hoặc từng biển |
| Khung cuối | Ghi nhớ | Biển trên cột, ba thẻ bước có số chỉ vào viền, hình và chiếc xe đang chờ ở vạch | Thanh các bước, mọi bước đã xong |

Không dùng "Tự kiểm tra" (đó là câu hỏi ôn). Câu hỏi mở đầu phải được trả lời trong video, ở khung "xe nào, vì sao" của ý tương ứng (Bài 1: khung 11).

Bài 1 đã làm: 22 khung = 1 mở + 5 cách đọc (ba bước, ba khung tên xe) + 1 Chốt + ý 2 (tả, Chốt, xe bị cấm, lý do và câu trả lời) + ý 3 (đổi hình, hai cổng, Chốt) + ý 4 (bảng ba xe ba biển, hai khung Chốt) + ý 5 (ba khung xe tải với ba biển, Chốt) + 1 khung cuối.

Khuôn này sinh từ một bài **biển cấm theo loại xe**. Bảng dưới là gợi ý cho các kiểu ý khác, **chưa video nào thử**; bài đầu tiên của mỗi kiểu phải soát kỹ ảnh và ghi lại vào tệp này điều đã chạy được.

| Kiểu ý | Ở nhóm bài | Tấm biển làm gì | Thanh các bước (đặt bằng `setSteps`) |
|---|---|---|---|
| Cấm theo loại xe | 1–3 | Biển đứng gác, xe bị phân hai phía | DÁNG VÀ MÀU · HÌNH BÊN TRONG · TÊN ĐÚNG CỦA XE |
| Cấm một động tác (đi vào, vượt, rẽ, quay đầu, dừng, đỗ) | 4–8 | Phố nhìn từ trên hoặc nhìn ngang; một xe thử từng động tác, động tác bị cấm nhận ✕, động tác bài nói còn được làm nhận ✓ | theo "Ý lớn của bài": thường DÁNG VÀ MÀU · HÌNH BÊN TRONG · ĐỘNG TÁC BỊ CẤM |
| Giới hạn bằng con số (kích thước, tải trọng, tốc độ) | 9, 11 | Xe mang con số của mình tới gặp con số trên biển; thước đo hiện ra so hai số | DÁNG VÀ MÀU · CON SỐ · SO VỚI XE MÌNH |
| Biển phụ, biển hết lệnh | 10, 12 | Biển chính và tấm thêm vào: tách lớp theo chiều dọc; dải vạch đen là một lớp nữa phủ lên biển | theo bài |
| Báo nguy hiểm và quyền đi trước | 13–20 | Biển tam giác đứng trước đoạn đường nó báo; con đường phía sau hiện ra đúng thứ biển vẽ. Cặp dễ lẫn đứng hai cổng | DÁNG VÀ MÀU · HÌNH BÊN TRONG · ĐIỀU SẮP GẶP |
| Hiệu lệnh, chỉ dẫn, làn đường, cao tốc | 21–27 | Biển nền xanh lam hoặc xanh lá; mũi tên trên biển thành đường đi trên mặt đường | theo bài |
| Vạch kẻ đường | 28 | Mặt đường nhìn từ trên; không có cột biển | MÀU VẠCH · NÉT VẠCH · ĐƯỢC ĐÈ LÊN KHÔNG |

Tên các bước phải rút từ "Ý lớn của bài" của chính bài đó; các dòng trên chỉ để hình dung.

## 3. Ngân sách thời lượng

Số đo thật ở Bài 1: **22 khung, 349 giây** với giọng Leda, kể cả khoảng lặng cuối khung. README của brief ước 2,7 âm tiết mỗi giây; Bài 1 có 977 âm tiết lời đọc, tức khoảng 2,8 âm tiết mỗi giây tính cả khoảng lặng.

| Mục tiêu | Âm tiết lời đọc |
|---|---|
| 5 phút | khoảng 810 |
| 5 phút rưỡi | khoảng 890 |
| 6 phút | khoảng 970 |

Đếm trước khi tạo giọng bằng `(cd "$P" && node scripts/voice.mjs request)`. **Không đếm bằng `wc -w`:** trên macOS nó tách một chữ tại ký tự "à" và đếm dư.

Lời đọc của video không dài bằng phần giảng của brief: nó rút gọn lời giảng, nhưng thêm lời tả cảnh để neo mốc. Ở Bài 1, 1296 âm tiết phần giảng (năm ý) thành một video gần 6 phút. Bài 1 có một ý nền dài và bốn ý dùng chung biển, nên dồn được vào một video; đừng lấy đó làm chuẩn cho bài có nhiều biển khác nhau.

Ước lượng khi chia bài: một video chở **hai đến ba ý, hoặc khoảng 600 đến 900 âm tiết phần giảng**. Bài trên 1100 âm tiết phần giảng thường thành hai video; Bài 17, 22, 26 (trên 1500) có thể thành ba. Chia theo ý, không cắt giữa một ý; mỗi video tự đứng được (có mở, có cách đọc, có khung cuối của riêng nó). Vượt 6 phút rưỡi thì chia tiếp, không tự cắt phần "vì sao".

## 4. Hai mươi tám bài

Số ý và số âm tiết lấy từ bảng của README (2026-10-12); chạy lại theo README nếu brief đã đổi.

| Bài | Tên bài | Số ý | Âm tiết phần giảng | Trạng thái |
|---|---|---|---|---|
| 1 | Biển cấm ô tô và biển cấm mô tô | 5 | 1296 | **đã làm, đã duyệt** (một video, đủ năm ý) |
| 2 | Biển cấm xe tải, máy kéo và xe kéo rơ moóc | 4 | 851 | |
| 3 | Biển cấm taxi, xe khách, xe chở hàng nguy hiểm, xe ba bánh và súc vật kéo | 5 | 875 | |
| 4 | Đường cấm, cấm đi ngược chiều, dừng lại | 4 | 877 | |
| 5 | Biển cấm vượt | 4 | 815 | |
| 6 | Biển cấm rẽ và cấm quay đầu | 4 | 942 | |
| 7 | Quay đầu xe: biển nào cho, biển nào cấm | 4 | 766 | ý 3 chưa chắc, hỏi trước |
| 8 | Cấm dừng, cấm đỗ và nơi đỗ xe | 4 | 930 | |
| 9 | Biển hạn chế kích thước và tải trọng | 6 | 1291 | ý 5: lý do là suy luận của người soạn |
| 10 | Biển phụ đặt dưới biển cấm | 4 | 998 | |
| 11 | Biển tốc độ và biển khu đông dân cư | 4 | 839 | ví dụ mở đầu do người soạn đặt |
| 12 | Biển báo hết lệnh | 5 | 843 | |
| 13 | Biển báo nơi đường bộ giao nhau với đường sắt | 6 | 1309 | |
| 14 | Đường ưu tiên và nơi giao nhau | 5 | 1078 | |
| 15 | Đường bị thu hẹp và quyền đi trước qua đường hẹp | 4 | 1036 | |
| 16 | Đường hai chiều, đường đôi và chướng ngại vật | 5 | 1129 | |
| 17 | Biển báo về người đi bộ, trẻ em và xe thô sơ | 6 | 1671 | |
| 18 | Cửa chui, đường hầm, cầu, bến phà và kè vực | 5 | 1339 | |
| 19 | Mặt đường xấu và đường dốc | 5 | 1337 | |
| 20 | Gió ngang, công trường và những nguy hiểm khác trên đường | 6 | 1225 | |
| 21 | Biển hiệu lệnh chỉ hướng đi | 5 | 1234 | ý 4 chưa chắc, hỏi trước; ý 2: cách đọc là của người soạn |
| 22 | Biển báo làn đường | 5 | 1528 | |
| 23 | Biển đường dành cho ô tô | 4 | 1062 | |
| 24 | Biển khu vực, biển tên đường và biển địa giới | 4 | 1002 | |
| 25 | Đường cụt, trạm cảnh sát giao thông và cầu vượt | 4 | 1302 | |
| 26 | Biển chỉ dẫn trên đường cao tốc | 6 | 1550 | |
| 27 | Làn đường cứu nạn và các biển sọc vàng đen | 4 | 1382 | |
| 28 | Vạch kẻ đường | 7 | 1339 | |

Mục "Những điểm còn chưa chắc nhất" của README còn nêu phạm vi chính xác của một số lệnh ở Bài 2, 3, 4, 5, 6, 12, 13, 23, 24, 28: video giữ đúng mức khẳng định của bài, không nói rộng hơn, và báo cáo nhắc lại điều đó.

## 5. Nhóm bài nào cần vẽ gì

`kit/` hiện có: biển **tròn, viền đỏ, nền trắng, gạch chéo đỏ** với năm hình bên trong (`carFront`, `motoRider`, `truck`, `busOverTruck`, `truckTrailer`); xe ngoài phố `moped`, `moto2`, `trike`, `car`, `bus`, `truck`, `trailer`, `amb`, `fire`, `walker`. Mọi thứ khác phải vẽ mới theo `street.md` §6. Cột dưới suy từ tên bài và README, **không thay cho việc đọc brief và mở ảnh tham khảo**.

| Bài | Dùng lại | Cần vẽ mới |
|---|---|---|
| 2–3 | Biển tròn viền đỏ, `truck`, `truckTrailer`, `busOverTruck`; mọi xe; biển đứng gác, phố xếp chồng | Hình bên trong: máy kéo, taxi, xe khách một mình, xe chở hàng nguy hiểm, xe ba bánh, xe súc vật kéo; chữ trên biển ("2.5 t"). Xe ngoài phố: máy kéo, taxi, xe súc vật kéo |
| 4–8 | Lớp nền, viền, gạch chéo; `car`, `moto2`, `truck` | Biển không có gạch chéo hoặc có dáng riêng (đường cấm, cấm đi ngược chiều, dừng lại); hình mũi tên rẽ, quay đầu, mũi tên hai đầu; hai xe cạnh nhau của biển cấm vượt (một xe màu đỏ); biển nền xanh lam viền đỏ một gạch và hai gạch (Bài 8); biển vuông nền xanh lam (chỗ quay xe, nơi đỗ xe). Cảnh nhìn từ trên cho động tác rẽ, quay đầu, vượt |
| 9–12 | Lớp nền, viền | Con số và đơn vị trên biển; mũi tên đo chiều cao, chiều ngang, chiều dài; biển phụ chữ nhật dưới biển chính; **dải vạch đen gạch chéo** của biển hết lệnh; biển tốc độ tối thiểu nền xanh lam; biển khu đông dân cư. Thước đo cạnh xe |
| 13–20 | Xe, phố, `walker` | **Biển tam giác viền đỏ nền vàng** và mọi hình bên trong; biển chữ X của đường sắt và các biển vạch chéo báo khoảng cách; **hình vuông đặt chéo** của đường ưu tiên; hai biển qua đường hẹp; tàu hoả, rào chắn, cầu, hầm, dốc |
| 21–27 | Xe, phố | **Biển tròn nền xanh lam** với mũi tên trắng; **biển vuông và chữ nhật nền xanh lam**; **biển nền xanh lá cây** của đường cao tốc; vạch đỏ gạch chéo "hết đoạn đường"; biển sọc vàng đen, mũi tên chữ V, ô ca rô đỏ trắng. Mặt đường nhiều làn nhìn từ trên |
| 28 | Xe nhìn từ trên (chưa có) | Mặt đường nhìn từ trên; vạch trắng, vạch vàng, nét liền, nét đứt, vạch đôi, mũi tên trên mặt đường, cụm vạch chữ V |

Thứ vẽ mới ở bài nào thì chuyển về `kit/` ngay sau bài đó (SKILL.md, "Sau khi xong"), để các bài cùng nhóm dùng lại và các biển trong cả loạt cùng một nét.

## 6. Đã làm

| Ngày | Bài | Dự án | Video | Ghi chú |
|---|---|---|---|---|
| 2026-10-12 | 1 · Biển cấm ô tô và biển cấm mô tô (đủ năm ý) | `videos/chuong-5-bai-01-bien-cam-o-to-va-bien-cam-mo-to` | 22 khung, 977 âm tiết lời đọc, 5:49, Leda, 11 SFX, −13,8 LUFS | Video thử nghiệm của chương, người dùng duyệt ("rất tốt"). Nguồn của `kit/` và `examples/bai-01-bien-cam-o-to-va-bien-cam-mo-to` |
