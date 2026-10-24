# Loạt video Chương I · Quy định chung và quy tắc giao thông

Nguồn: `/Users/phucnt/workspace/sat-hach-lai-xe/projects/sat-hach-lai-xe/video-briefs/chuong-1-quy-dinh-chung-va-quy-tac-giao-thong/` (`README.md`, `BAI-01` … `BAI-21`, `DOI-CHIEU.md`). Đọc `README.md` của thư mục đó trước mỗi bài: tệp này chỉ tóm tắt và nói cách áp dụng vào video.

## 1. Luật nội dung và cách áp dụng

| Luật của chương | Trong video |
|---|---|
| Quy tắc là luật: được nói gọn, không thêm, không bớt, không đổi nghĩa, giữ mọi con số | Mặc định đọc **nguyên văn**. Khung Quy tắc đọc đúng câu của bài; thẻ `rule()` hiện nguyên văn, sáng dần từng chữ. Hằng của câu trong `build-frames.mjs` và lời đọc trong `SCRIPT.md` phải giống nhau từng chữ (script ném lỗi khi lệch). Được tách một Quy tắc dài thành nhiều khung theo câu hay theo vế; ghi vào Notes |
| Cách hiểu, Cách nhớ không phải luật | Lời đọc mở bằng "Cách nhớ" hay "Có thể hiểu"; thẻ hổ phách riêng (`lab("CÁCH NHỚ", "§amber")`), không nằm trong thẻ Quy tắc |
| Dễ nhầm không đặt quy tắc mới | Lời đọc mở bằng "Chỗ dễ nhầm"; thẻ viền đỏ. Mô hình diễn cách hiểu sai (vùng gạch chéo đỏ, nhãn đỏ nét đứt) rồi gạch nó. Thẻ Quy tắc đã đọc ở lại phía trên (`kept()`) để người xem thấy câu luật bác cách hiểu đó |
| Bảng và danh sách là kiến thức, không đổi thứ tự dòng | Mỗi dòng một mốc, hiện theo thứ tự đọc. Không gộp dòng, không làm tròn số. Thứ bài chỉ nêu tên thì chỉ hiện tên |
| Mỗi bài đứng một mình, không nhắc bài khác | Tên gọi nào bài dùng mà không định nghĩa thì dùng như bài dùng, không giải thích thêm từ bài khác |
| Không thêm kiến thức ngoài bài; thiếu thì báo | Canvas chỉ vẽ điều bài nói. Mọi lựa chọn minh hoạ (dáng xe, cảnh vật) ghi vào Notes của `BRIEF.md` và vào báo cáo |
| Không số câu, kỳ thi, cuốn sách | `scan-words.mjs` chặn "câu hỏi 12", "đề số 3", tên kỳ thi và tên sách, ở kịch bản, khung, phụ đề và nhãn canvas |

**Điều nguồn không nói** (README; không tự điền, dù biết): tốc độ của xe buýt và máy kéo trong khu đông dân cư; tuổi tối thiểu của các hạng A, C, D1; còi ban đêm khi gặp nguy hiểm; đèn tín hiệu và biển báo trái nhau thì theo cái nào; cách nhận ra đường ưu tiên. Bài nào chạm tới các điểm này thì video dừng đúng ở chỗ bài dừng, và báo cáo nhắc lại.

**Mức độ kiểm chứng của nguồn** (ghi vào mọi báo cáo): các Quy tắc đã so với đáp án của tài liệu gốc cho 180 câu; chưa so với văn bản luật hiện hành; chưa có người có chuyên môn duyệt; Cách hiểu và Cách nhớ là của người soạn.

## 2. Khuôn của một video

Mỗi tệp bài có: Áp dụng cho, Cốt lõi, các mục đánh số (mỗi mục có Quy tắc, Dễ nhầm, Cách hiểu hoặc Cách nhớ), và Thử áp dụng với ba tình huống. Video dùng:

| Khung | Lấy từ | Mô hình làm gì | Cột chữ |
|---|---|---|---|
| 1. Mở | Cốt lõi | **Trả lời trước:** mô hình hiện đủ mọi phần kèm bảng tên; cuối khung các phần được tháo ra | Thẻ tên bài (chữ gradient duy nhất của video), câu hỏi hiện từng chữ (`question`), hàng viên chữ nêu điều các tên này dẫn tới |
| Mỗi mục: Quy tắc (1–3 khung) | Câu Quy tắc | **Lắp theo vế:** mỗi vế của câu là một phần mọc lên, một xe đi vào, một mũi tên đo. Phần đang được đọc sáng tím nhạt | Tiêu đề mục kèm hàng chấm (`kick`); thẻ QUY TẮC. Khung thứ hai, thứ ba của cùng quy tắc: các câu đã đọc ở lại phía trên, nhỏ hơn |
| Mỗi mục: Dễ nhầm (0–1 khung) | Dễ nhầm | **Diễn rồi gạch:** vùng gạch chéo đỏ phủ lên chỗ cách hiểu sai chỉ vào, nhãn đỏ nét đứt; nét gạch chạy qua nhãn | Thẻ Quy tắc đã đọc (`kept`), thẻ DỄ NHẦM với cụm từ bị gạch cùng lúc (`wrong`, `strike`) |
| Mỗi mục: Cách nhớ (0–1 khung) | Cách hiểu, Cách nhớ | Hai thứ đứng cạnh nhau, mỗi thứ một nhãn ngắn | Thẻ hổ phách |
| Mục dạng danh sách | Quy tắc là một danh sách tên | **Cột bảng tên:** mỗi tên một tấm bảng trên cột chỉ đường, hiện theo thứ tự đọc | Thẻ QUY TẮC với cả câu liệt kê |
| Thử áp dụng: hỏi (3 khung) | Tình huống | Tình huống diễn trên mô hình; dừng ở chỗ phải quyết định, dấu hỏi | Nhãn THỬ ÁP DỤNG kèm hàng chấm 1–3; câu hỏi. Khoảng lặng 1,5 giây cuối khung |
| Thử áp dụng: trả lời (3 khung) | Lời giải | Mô hình cho thấy kết quả: xanh lá khi đúng, đỏ khi sai | Câu hỏi đã hỏi (`asked`), thẻ TRẢ LỜI viền xanh (`answer`). SFX `chime` |
| Khung cuối | Câu cuối của Cốt lõi | Mô hình lắp lại đủ, mọi bảng tên trở về | Câu kết trong thẻ lớn |

Bài 1 đã làm: 21 khung = 1 mở + mục 1 (Quy tắc phần đường xe chạy, Dễ nhầm, Quy tắc làn đường) + mục 2 (dải phân cách, vạch kẻ đường kèm Dễ nhầm, Cách nhớ) + mục 3 (khổ giới hạn, Dễ nhầm) + mục 4 (đường cao tốc qua ba khung, Dễ nhầm) + mục 5 (tám loại đường và Dễ nhầm trong một khung) + 3 × (hỏi, trả lời) + 1 kết.

Được đổi thứ tự **bên trong một mục** khi một Dễ nhầm chỉ nói về câu đầu của Quy tắc (Bài 1: Dễ nhầm về phần đường xe chạy đứng trước định nghĩa làn đường). Không đổi thứ tự các mục. Ghi vào Notes.

Khuôn này sinh từ một bài **định nghĩa các phần của con đường**. Bảng dưới là gợi ý cho các kiểu mục khác, **chưa video nào thử**; bài đầu tiên của mỗi kiểu phải soát kỹ ảnh và ghi lại vào tệp này điều đã chạy được.

| Kiểu mục | Ở bài | Mô hình làm gì |
|---|---|---|
| Định nghĩa một phần đường, một tên gọi | 1, 2 | Lắp theo vế; thứ được định nghĩa đứng riêng một chỗ, sáng tím nhạt |
| Bảng con số (tuổi, tốc độ, khoảng cách) | 3, 8, 9 | Con số gắn vào thứ nó đo, ngay trên mô hình: mũi tên đo `measure` giữa hai xe cho khoảng cách; mỗi làn hay mỗi đoạn đường một xe mang con số của nó cho tốc độ. Cả bảng hiện đủ trong cột chữ ở khung cuối của mục |
| Điều kiện, giấy tờ, danh sách phải có | 4, 19, 20, 21 | Mỗi thứ một tấm thẻ đứng trên bàn vẽ cạnh chiếc xe, theo kiểu cột bảng tên; thiếu một tấm thì chỗ đó viền đỏ |
| Điều bị cấm | 5, 13, 17 | Xe làm đúng điều bị cấm trên mô hình (vùng gạch chéo đỏ), rồi bị gạch; không vẽ tai nạn |
| Thứ tự, quyền đi trước | 6, 14, 15 | Các bên đứng tại chỗ của mình; thứ tự hiện bằng số bước và từng bên đi lần lượt. Cần nút giao (`crossing` mới chỉ là một đường cắt thẳng) |
| Một động tác (chuyển làn, vượt, rẽ, quay đầu, lùi, dừng, đỗ) | 7, 11, 12, 13 | Một xe làm động tác trên đoạn đường; đường đi vẽ bằng `flow`; chỗ không được làm tô đỏ. Rẽ và quay đầu cần xe đi theo đường cong (`path.js`) |
| Nơi đặc biệt | 9, 16, 17 | Thêm phần mới vào mô hình: đường sắt, hầm, cầu hẹp. Bài 17 dùng lại gần hết cảnh `expressway` của Bài 1 |

## 3. Ngân sách thời lượng

Số đo thật ở Bài 1: **21 khung, 235,85 giây** với giọng Leda, kể cả khoảng lặng cuối khung; 637 âm tiết lời đọc, tức **2,7 âm tiết mỗi giây**, đúng ước lượng của README.

Lời đọc của video gần bằng "cả bài" của brief (Bài 1: 637 so với 700 âm tiết), vì Quy tắc đọc nguyên văn và Thử áp dụng được giữ đủ. Ước lượng: **âm tiết lời đọc ≈ 0,9 × cột "cả bài"**, và thời lượng ≈ số đó ÷ 2,7.

| Cả bài (âm tiết) | Video ước chừng |
|---|---|
| 330 | 1:50 |
| 550 | 3:05 |
| 700 | 3:55 (Bài 1, số thật) |
| 850 | 4:45 |
| 930 | 5:10 |

Theo đó cả 21 bài đều vừa **một video dưới 6 phút**. Đếm trước khi tạo giọng bằng `(cd "$P" && node scripts/voice.mjs request)`. **Không đếm bằng `wc -w`:** trên macOS nó tách một chữ tại ký tự "à" và đếm dư.

Vượt 6 phút rưỡi thì chia theo mục, mỗi video tự đứng được (có mở, có kết của riêng nó); không tự cắt Dễ nhầm hay Thử áp dụng để vừa thời lượng.

## 4. Bảng 21 bài

Năm chặng của chương: trước khi lên xe (1–5), xe lăn bánh (6–10), đổi vị trí (11–13), gặp xe khác và chỗ đặc biệt (14–17), tuỳ xe và tuỳ việc chở (18–21).

| Bài | Tên | Mục | Âm tiết: phần giảng / cả bài | Trạng thái |
|---|---|---|---|---|
| 1 | Con đường gồm những phần nào? | 5 | 568 / 700 | **đã làm**, 3:56 |
| 2 | Ai là ai, xe nào là xe nào? | 3 | 495 / 609 | |
| 3 | Tuổi và hạng giấy phép | 4 | 756 / 833 | |
| 4 | Điều kiện, giấy tờ | 6 | 742 / 864 | |
| 5 | Điều gì tuyệt đối không được làm? | 6 | 620 / 720 | |
| 6 | Báo hiệu trái nhau | 4 | 504 / 605 | |
| 7 | Đi làn nào, chuyển làn | 2 | 231 / 325 | |
| 8 | Tốc độ tối đa | 4 | 711 / 805 | |
| 9 | Khoảng cách, nơi phải chậm | 4 | 744 / 845 | |
| 10 | Còi và đèn | 3 | 257 / 338 | |
| 11 | Vượt xe | 5 | 520 / 589 | |
| 12 | Rẽ, quay đầu, lùi | 3 | 419 / 524 | |
| 13 | Dừng và đỗ | 3 | 439 / 545 | |
| 14 | Ai nhường ai | 3 | 417 / 522 | |
| 15 | Xe ưu tiên | 3 | 469 / 563 | |
| 16 | Đường sắt và hầm | 4 | 483 / 610 | |
| 17 | Đường cao tốc | 4 | 538 / 661 | |
| 18 | Mô tô, xe gắn máy | 4 | 675 / 775 | |
| 19 | Chở trẻ em | 3 | 538 / 671 | |
| 20 | Chở khách | 6 | 591 / 723 | |
| 21 | Chở hàng, kéo xe | 6 | 776 / 927 | |

Tên trong bảng là tên gọn; tên đầy đủ và tên tệp lấy ở thư mục brief (`BAI-NN-<tên>.md`). Tên trên thẻ tên bài của video lấy đúng tiêu đề trong tệp bài.

## 5. Bài nào cần vẽ gì

`kit/` hiện có: một **đoạn đường thẳng** dài 44 m với phần đường xe chạy, lề, nền; vạch làn, vạch tim, vạch dừng, mũi tên sơn; dải phân cách giữa và dải phân cách cùng chiều; hàng rào, cột đèn, giá long môn; một đường cắt ngang (cùng mức, hoặc nâng thành cầu vượt); hai làn nhánh ra và vào; khối khoảng trống với mũi tên đo; xe dạng khối `car`, `truck` (có hàng), `moto`, `bike`, `roller`. Mọi thứ khác phải vẽ mới theo `model.md` §6.

Cột "Cần vẽ mới" suy từ tên bài và kiểu mục, **chưa đọc kỹ từng tệp bài**: đọc bài rồi mới chốt.

| Bài | Dùng lại | Cần vẽ mới (dự kiến) |
|---|---|---|
| 2 | Năm loại xe, đoạn đường, cột bảng tên | Người (người đi bộ, người lái, người điều khiển giao thông); xe còn thiếu theo tên bài nêu (xe khách, máy kéo, rơ moóc, xe thô sơ khác) |
| 3 | Xe, cột bảng tên | Bảng tuổi và hạng: mỗi hạng một xe mang con số; xe khách, xe kéo rơ moóc |
| 4 | Xe, cột bảng tên | Giấy tờ dạng tấm thẻ đứng trên bàn vẽ; người lái |
| 5 | Đoạn đường, xe, vùng gạch đỏ | Tuỳ từng điều cấm của bài |
| 6 | Đường cắt ngang | Người điều khiển giao thông với các hiệu lệnh tay (soát với `cau-36.jpg`, `cau-37.jpg`), đèn tín hiệu, biển trên cột, nút giao |
| 7 | Đoạn đường nhiều làn, `flow`, xe | Xe chuyển làn (đi chéo giữa hai làn); đèn xi nhan |
| 8 | Đoạn đường, dải phân cách, xe, `measure` | Dấu hiệu khu đông dân cư; cách bày bảng tốc độ; xe còn thiếu |
| 9 | Xe, `measure`, cầu vượt | Khoảng cách theo tốc độ; các nơi phải chậm (đường cong, dốc, cầu hẹp, trường học…) theo bài |
| 10 | Đoạn đường, xe | Cảnh ban đêm (bảng màu tối, chùm đèn xa và gần), sóng âm của còi |
| 11 | Đoạn đường, hai xe, `flow` | Xe vượt (đi vòng qua xe trước); tín hiệu xin vượt |
| 12 | Đường cắt ngang | Nút giao đủ bốn nhánh; xe rẽ và quay đầu theo đường cong; xe lùi |
| 13 | Đoạn đường, lề, vùng gạch đỏ | Lề và vỉa hè có khoảng cách tới bánh xe; các nơi cấm dừng, đỗ theo bài |
| 14 | Đường cắt ngang, xe | Nút giao, vòng xuyến; số bước chỉ thứ tự đi |
| 15 | Đoạn đường, xe | Xe ưu tiên (chữa cháy, cứu thương, công an, quân sự, hộ đê… theo bài), đèn và còi ưu tiên |
| 16 | Đoạn đường, `portal`, `clearSpace` | Đường sắt, rào chắn, tàu; hầm |
| 17 | Gần hết cảnh `expressway`: dải phân cách, hàng rào, cột đèn, giá long môn, làn nhánh | Làn dừng khẩn cấp; xe nhập làn và tách làn |
| 18 | `moto`, đoạn đường | Người ngồi trên xe, mũ bảo hiểm, các tư thế bị cấm |
| 19 | `car` | Trẻ em, ghế và thiết bị an toàn; mặt cắt thân xe |
| 20 | Đoạn đường | Xe khách, hành khách, cửa xe |
| 21 | `truck` có hàng, `clearSpace`, `measure` | Hàng vượt kích thước, rơ moóc, xe kéo xe, dây và thanh nối |

Thứ vẽ mới ở bài nào thì chuyển về `kit/` ngay sau bài đó (SKILL.md, "Sau khi xong"), để các bài sau dùng lại và cả loạt cùng một nét.

## 6. Đã làm

| Ngày | Bài | Dự án | Video | Ghi chú |
|---|---|---|---|---|
| 2026-10-12 | 1 · Con đường gồm những phần nào? (đủ năm mục, ba tình huống) | `projects/sat-hach-lai-xe/videos/chuong-1-bai-01-con-duong-gom-nhung-phan-nao` | 21 khung, 637 âm tiết lời đọc, 3:56, Leda, 14 SFX, −14,6 LUFS | Video thử nghiệm của chương, người dùng duyệt ("rất tốt"). Nguồn của `kit/` và `examples/bai-01-con-duong-gom-nhung-phan-nao`. Mọi câu Quy tắc đọc nguyên văn. Bản render ra −13,0 LUFS, đã hạ riêng âm thanh 1,6 dB |
