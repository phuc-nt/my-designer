// What only this lesson knows about its storyboard: the scene of each frame, its sound, and the video
// direction. storyboard.lib.mjs adds the narration and the timings and writes STORYBOARD.md.
//   node scripts/build-storyboard.mjs
import { B, rel, at } from "./frames.ctx.mjs";
import { writeStoryboard } from "./storyboard.lib.mjs";

const R = (n, abs) => rel(n, abs);
const C = B.cut;

// per frame: scene (one line), sc: [start, text] phases, sfx + at (seconds in the frame)
const F = [
  {
    scene: "Người xem ngồi sau tay lái một buổi chiều âm u, mưa to quất lên kính, gạt nước quét nhanh, mặt đường ướt; xe tăng tốc khi lời đọc nói \"chạy nhanh cho mau qua\"",
    sc: [
      [0, `thẻ tên "Trời mưa", chữ "mưa" mang gradient`],
      [R(1, B.f1.think) - 0.2, `thẻ "Có người nghĩ": "Mưa to thì chạy nhanh cho mau qua", cụm "chạy nhanh" sáng đỏ ở ${R(1, B.f1.fast)}s`],
      [R(1, B.f1.ask) - 0.35, `thẻ "Câu hỏi" hiện từng chữ theo giọng đọc: "Vì sao người lái cẩn thận lại làm điều ngược lại?"`],
    ],
    sfx: "ping", at: R(1, B.f1.ask) - 0.1,
  },
  {
    scene: "Góc nhìn ngang bên đường, trời tạnh: xe đang chạy thì gặp vật cản; trên mặt đường hiện hai đoạn nối nhau, đoạn hổ phách là lúc người lái kịp phản ứng, đoạn đỏ là lúc phanh, tới chỗ xe dừng hẳn",
    sc: [
      [0, `nhãn mục "Ý chính"; thẻ "Xe không dừng ngay": "mắt thấy nguy hiểm" sáng hổ phách ở ${R(2, B.f2.see)}s, "xe dừng hẳn" sáng đỏ ở ${R(2, B.f2.halt)}s`],
      [R(2, B.f2.that) - 0.25, `thẻ "Quãng đường đó gồm": dòng hổ phách "Quãng đi trong lúc người lái kịp phản ứng" (${at(2, "quãng đi")}s), dấu cộng (${R(2, B.f2.plus)}s), dòng đỏ "Quãng xe còn lăn tới trong lúc phanh" (${at(2, "quãng xe còn lăn")}s)`],
    ],
    sfx: "none",
  },
  {
    scene: "Camera trên cao theo sau xe: dải xanh da trời là đoạn đường nhìn thấy rõ, dải dừng xe nằm gọn trong đó; hai thanh ở góc trên phải so tầm nhìn với quãng dừng xe, không có con số; tầm nhìn co lại thì xe chậm theo",
    sc: [
      [0, `thẻ "Quy tắc bao trùm" viền sáng; câu quy tắc sáng dần từng chữ theo giọng đọc từ ${R(3, B.f3.fast)}s; "dừng được xe" chuyển xanh lá (${R(3, B.f3.stop)}s), "nhìn thấy rõ" chuyển xanh da trời (${R(3, B.f3.seen)}s)`],
      [R(3, B.f3.short) - 0.25, `thẻ "Nhìn được càng ngắn thì phải chạy càng chậm.": "càng ngắn" sáng ở ${at(3, "càng ngắn")}s, "càng chậm" ở ${at(3, "càng chậm")}s`],
    ],
    sfx: "chime", at: R(3, B.f3.rule),
  },
  {
    scene: "Sau tay lái: trời bắt đầu mưa nhỏ rồi mưa to dần, gạt nước bật; màn mưa khép tầm nhìn lại, nhãn \"TẦM NHÌN\" chỉ đoạn đường còn thấy rõ, thanh tầm nhìn ở góc trên phải ngắn lại",
    sc: [
      [0, `nhãn mục "Hai chuyện"; thẻ "Mưa gây ra hai chuyện cùng lúc", cụm "Hai chuyện" sáng ở ${R(4, B.f4.two)}s`],
      [R(4, B.f4.first) - 0.2, `thẻ số 1 "Nhìn kém"; dòng "Tầm nhìn bị hạn chế" (${R(4, B.f4.limit)}s), dòng phụ "đoạn đường nhìn thấy rõ ngắn lại." với "ngắn lại" sáng xanh da trời ở ${R(4, B.f4.short)}s`],
    ],
    sfx: "whoosh", at: R(4, B.f4.two),
  },
  {
    scene: "Camera trên cao theo sau xe trên đường ướt bóng nước, nhãn \"MẶT ĐƯỜNG TRƠN\"; khi lời đọc nói quãng đường phanh dài ra, dải quãng dừng xe trên đường và thanh ở góc trên phải dài ra; xe chậm lại ở \"tốc độ phải giảm\"",
    sc: [
      [0, `dòng gọn chuyện 1 đã xong; thẻ số 2 "Mặt đường trơn" (${R(5, B.f5.slick)}s); dòng phụ "Giữa lốp và mặt đường có thêm một lớp nước"; hình lốp nhìn từ phía trước, lớp nước dưới lốp sáng lên ở ${R(5, B.f5.water)}s`],
      [R(5, B.f5.grip) - 0.1, `dòng "Lực bám giảm đi" (${R(5, B.f5.grip)}s), "Quãng đường phanh dài ra" (${R(5, B.f5.longer)}s)`],
      [R(5, B.f5.both) - 0.2, `thẻ "Nhìn kém và đường trơn cùng lúc, nên tốc độ phải giảm, chứ không tăng.": "giảm" sáng xanh lá, "không tăng" sáng đỏ (${R(5, B.f5.not)}s), viền xanh`],
    ],
    sfx: "none",
  },
  {
    scene: "Camera thấp bên lề đường: xe chạy nhanh tới chỗ đọng nước; đúng lúc bánh trước chạm nước, hình đứng sững lại, nhãn \"CHỖ ĐỌNG NƯỚC\" và \"LỐP CƯỠI LÊN MẶT NƯỚC\"; không vẽ xe trượt hay quay",
    sc: [
      [0, `thẻ viền đỏ "Chạy nhanh qua chỗ đọng nước": "Lốp có thể không kịp ép nước ra hai bên", hình lốp đứng trong nước với hai mũi tên đẩy nước sang hai bên (${R(6, B.f6.tyre)}s), "không kịp" sáng đỏ`],
      [R(6, B.f6.ride) - 0.05, `hai mũi tên mờ đi, lốp nhấc lên khỏi mặt đường, nước tràn vào bên dưới, viền lốp chuyển đỏ; dòng đỏ "Nó cưỡi lên trên mặt nước"`],
      [at(6, "cả vô lăng") - 0.2, `thẻ dấu đỏ "Cả vô lăng lẫn phanh đều gần như mất tác dụng.", cụm cuối sáng đỏ ở ${R(6, B.f6.lost)}s`],
    ],
    sfx: "error", at: R(6, B.f6.ride),
  },
  {
    scene: "Sau tay lái trong mưa: xe chậm lại ở \"giảm tốc độ\"; một xe ngược chiều hiện ra trong màn mưa, nhãn \"XE NGƯỢC CHIỀU\" ở \"tăng cường quan sát\"",
    sc: [
      [0, `nhãn mục "Bốn việc"; thẻ "Lái xe trong trời mưa: cần bốn việc", "bốn việc" sáng ở ${R(7, B.f7.four)}s`],
      [R(7, B.f7.first) - 0.15, `thẻ số 1 "Giảm tốc độ", số sáng hổ phách; dòng phụ "và tăng cường quan sát" (${R(7, B.f7.watch)}s); số chuyển xanh trước khi hết khung`],
    ],
    sfx: "pop", at: R(7, B.f7.first),
  },
  {
    scene: "Sau tay lái trong mưa, xe đi đều; vạch dẫn hướng của làn hiện ra khi lời đọc nói tới vô lăng",
    sc: [
      [0, `dòng gọn việc 1 đã xong; thẻ số 2 "Việc thứ hai" với ba dấu đỏ: "Không phanh gấp" (${R(8, B.f8.brake)}s), "Không tăng ga đột ngột" (${R(8, B.f8.gas)}s), "Không đánh vô lăng đột ngột" (${R(8, B.f8.wheel)}s)`],
      [R(8, B.f8.grip) - 0.2, `thẻ "Vì sao": "Lực bám đã ít" với một thanh xanh da trời ngắn; "Thao tác đột ngột nào cũng đòi một lực bám lớn" với một thanh đỏ dài mọc ra ở ${R(8, B.f8.big)}s; hai thanh chỉ so độ dài, không có số`],
    ],
    sfx: "none",
  },
  {
    scene: "Sau tay lái: đèn chiếu gần bật, nhãn trên bảng đồng hồ đổi sang \"ĐÈN CHIẾU GẦN\"; rồi nhìn từ phía trước đầu xe trong mưa, hai đèn chiếu gần sáng, nhãn \"NGƯỜI KHÁC THẤY MÌNH\"; trở lại ghế lái, mưa nhỏ thì gạt chậm, mưa to thì gạt nhanh",
    sc: [
      [0, `hai dòng gọn việc 1, 2 đã xong; thẻ số 3 "Bật đèn chiếu gần", dòng phụ "thường gọi là đèn cốt"; "Để mình thấy đường" (${R(9, B.f9.see)}s), "Để người khác thấy mình" (${R(9, B.f9.seen)}s); góc trước đầu xe ở ${R(9, C.c9b)}s`],
      [R(9, B.f9.fourth) - 0.15, `thẻ số 4 "Mở gạt nước", dòng phụ "ở chế độ phù hợp với độ lớn của mưa" (${R(9, B.f9.fit)}s); nhãn cảnh "MƯA NHỎ · GẠT CHẬM" rồi "MƯA TO · GẠT NHANH" (${R(9, B.f9.size)}s); "Bảo đảm quan sát được" (${R(9, B.f9.watch)}s)`],
    ],
    sfx: "click-soft", at: R(9, B.f9.low) + 0.2,
  },
  {
    scene: "Sau tay lái: một vũng nước phía trước, nhãn \"VŨNG NƯỚC\"; xe chậm lại từ trước khi tới; rồi camera trên cao theo sau xe, xe đi thẳng qua vũng nước, nhãn xanh \"GIỮ THẲNG TAY LÁI\"",
    sc: [
      [0, `nhãn mục "Vũng nước"; thẻ xanh "Gặp vũng nước": "Giảm tốc độ" (${R(10, B.f10.slow)}s), dòng phụ "từ trước khi tới" (${R(10, B.f10.before)}s)`],
      [R(10, B.f10.straight) - 0.05, `"Giữ thẳng tay lái" (${R(10, B.f10.straight)}s), dòng phụ "mà đi qua"; cảnh đổi sang góc theo sau xe ở ${R(10, C.c10b)}s`],
    ],
    sfx: "none",
  },
  {
    scene: "Camera cao bên đường nhìn một vũng nước: xe phanh gấp khi đang ở trong vũng, nhãn đỏ \"PHANH GẤP\"; ra khỏi vũng thì tăng ga ngay, nhãn đỏ \"TĂNG GA\"; vũng nước ửng đỏ với nhãn \"CHỖ TRƠN NHẤT\"",
    sc: [
      [0, `thẻ "Còn": dấu đỏ "Phanh gấp khi xe đã ở trong vũng nước" (${R(11, B.f11.brake)}s), dấu đỏ "Tăng ga ngay sau khi ra khỏi vũng nước" (${R(11, B.f11.gas)}s)`],
      [R(11, B.f11.two) - 0.2, `thẻ "Hai thao tác đột ngột, đúng ở chỗ trơn nhất.", cụm "chỗ trơn nhất" sáng đỏ và viền đỏ ở ${R(11, B.f11.worst)}s`],
    ],
    sfx: "error", at: R(11, B.f11.worst),
  },
  {
    scene: "Sau tay lái trong mưa, xe đi chậm và đều, đèn chiếu gần sáng, gạt nước quét theo độ lớn của mưa",
    sc: [
      [0, `nhãn mục "Ghi nhớ"; thẻ "Lái xe trong trời mưa" với bốn dòng đánh số đúng thứ tự: 1 "Giảm tốc độ, tăng cường quan sát" (${R(12, B.f12.slow)}s), 2 "Không phanh gấp, không tăng ga hay đánh vô lăng đột ngột" (${R(12, B.f12.brake)}s), 3 "Bật đèn chiếu gần" (${R(12, B.f12.low)}s), 4 "Mở gạt nước ở chế độ phù hợp" (${R(12, B.f12.wiper)}s)`],
    ],
    sfx: "sparkle", at: 0.3,
  },
  {
    scene: "Sau tay lái trong mưa; tầm nhìn và quãng dừng xe trên bảng đồng hồ vừa nhau, xe dừng kịp",
    sc: [
      [0, `thẻ "Quy tắc bao trùm" viền sáng: câu quy tắc sáng dần từng chữ theo giọng đọc từ ${R(13, B.f13.rule)}s`],
      [R(13, B.f13.rain) - 0.25, `thẻ kết "Trời mưa thì tốc độ phải giảm, chứ không tăng.", chữ "giảm" mang gradient, giữ tới hết khung`],
    ],
    sfx: "chime", at: R(13, B.f13.rain) - 0.05,
  },
];
const direction = `## Video direction

- **Palette system**
  - Lấy từ frame.md (glass-keynote): mực \`#F5F3FF\`, chữ phụ \`#AEACD6\`, thẻ chàm gần đặc \`#15163A\`, viền lilac \`rgba(196,181,253,0.28)\`.
  - Nền của video là một cảnh 3D ban ngày trời âm u do \`compositions/world.html\` vẽ (bảng màu \`overcast\`): mặt đường ướt, mưa trên kính, gạt nước, vũng nước. Các khung chỉ là lớp chữ trong suốt đặt lên trên.
  - Mọi chữ nằm trên thẻ chàm gần đặc và dùng màu sáng; không có chữ đặt trực tiếp lên cảnh ngoài các nhãn do cảnh 3D tự vẽ.
  - Màu có nghĩa cố định trong cả video: xanh lá = làm đúng / dừng kịp / đèn chiếu gần; đỏ = sai / nguy hiểm / lúc phanh / chỗ trơn; hổ phách = đang nói tới / lúc phản ứng / chỗ đọng nước; xanh da trời = thứ được đo (tầm nhìn, lớp nước, lực bám đang có).
  - Gradient hồng-tím-xanh chỉ dùng cho tên bài ở khung 1 và chữ "giảm" ở câu kết khung 13.
- **Type**
  - Plus Jakarta Sans 700-800 cho quy tắc, việc cần làm và lý do; JetBrains Mono IN HOA giãn 0.14em cho nhãn nhỏ.
  - Font tiếng Việt trong \`assets/fonts/\` (frame.md § Font faces), line-height dòng lớn ≥ 1.1, không cắt chiều dọc hộp chữ.
  - Chữ trên thẻ là lời đọc rút gọn; không thêm ý nào không có trong lời đọc.
- **Motion grammar**
  - Cảnh 3D chạy liên tục theo lời đọc: mưa to lên, gạt nước đổi nhịp, tầm nhìn co lại, quãng dừng xe dài ra, đèn chiếu gần bật, xe chậm lại đều xảy ra đúng lúc được nói tới.
  - Thẻ chữ vào bằng \`power3.out\`; từng dòng trong thẻ trượt nhẹ từ trái vào đúng lúc được đọc. Cụm từ khoá sáng thành ô màu rồi trả về màu chữ của nó.
  - Câu quy tắc bao trùm hiện mờ sẵn và sáng dần từng chữ theo giọng đọc (khung 3 và 13).
  - Bốn việc khi lái xe trong mưa giữ đúng số và thứ tự, trên lời đọc và trên hình; số sáng hổ phách khi đang đọc, chuyển xanh khi xong.
  - Hình lốp nhìn từ phía trước (khung 5-6) chỉ là sơ đồ: lớp nước sáng lên, lốp nhấc khỏi mặt đường; không có số.
  - Cảnh lốp cưỡi lên mặt nước đứng sững đúng lúc bánh chạm nước: điều xảy ra sau đó được nói, không được vẽ.
- **Rhythm / held frames**: khung 1 mở bằng ý nghĩ sai và một câu hỏi; khung 2-3 là ý chính, khung 3 dừng trên câu quy tắc; khung 4-6 hai chuyện mưa gây ra và lốp cưỡi lên nước; khung 7-9 bốn việc; khung 10-11 gặp vũng nước, cách đúng và cách sai; khung 12-13 ghi nhớ, khung 13 kết bằng một câu giữ tới hết.
- **Framing variety**: chữ luôn ở cột trái (x 64-620, từ y 104); cảnh 3D đổi góc theo nội dung: sau tay lái, nhìn ngang bên đường, trên cao theo sau xe, camera thấp bên lề ở chỗ đọng nước, trước đầu xe, camera cao bên đường ở vũng nước. Góc trên phải dành cho bảng đồng hồ của cảnh 3D.
- **Caption keep-out**
  - Phụ đề nằm ở ~17% dưới cùng (y > 896); mọi thẻ chữ kết thúc trên y 880.
  - Khung không có nền riêng; nền là cảnh 3D ở lớp dưới cùng của index.
- **Language + Negative list**
  - Mọi chữ trên hình là tiếng Việt.
  - Video đứng một mình: không lời hay chữ nào nhắc tới số câu hỏi, kỳ kiểm tra hay tài liệu nguồn; không ghi số thứ tự bài.
  - Bài không có con số nào: không số đo tốc độ, không số mét, không số giây trên hình. Các thanh và dải màu chỉ so độ dài với nhau.
  - Không vẽ thao tác hay hậu quả bài không nói: không vẽ xe trượt hay quay, không đèn báo rẽ, không thêm bước nào vào danh sách bốn việc.
  - Không dữ liệu cá nhân, token hay đường dẫn riêng.
  - Không \`repeat\`/\`yoyo\`/\`Math.random\`/\`@keyframes\`.
  - Cấm cả hai kiểu hỏng: "slideshow" (hiện hết trong 25% đầu rồi đứng im) và "screensaver" (nhiều thứ trôi lung tung).
`;

writeStoryboard({
  title: "Trời mưa: nhìn kém và đường trơn cùng một lúc",
  music: "calm rainy-afternoon underscore, soft warm electric piano and airy pads, slow steady pulse, unobtrusive",
  direction,
  frames: F,
});
