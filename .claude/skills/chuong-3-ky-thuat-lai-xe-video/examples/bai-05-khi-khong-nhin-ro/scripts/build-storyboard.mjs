// What only this lesson knows about its storyboard: the scene of each frame, its sound, and the video
// direction. storyboard.lib.mjs adds the narration and the timings and writes STORYBOARD.md.
//   node scripts/build-storyboard.mjs
import { B, rel, at, r2 } from "./frames.ctx.mjs";
import { writeStoryboard } from "./storyboard.lib.mjs";

const R = (n, abs) => rel(n, abs);
const C = B.cut;

// per frame: scene (one line), sc: [start, text] phases, sfx + at (seconds in the frame)
const F = [
  {
    scene: "Người xem ngồi sau tay lái trong đêm: một xe ngược chiều bật đèn pha chói mắt, rồi cảnh chuyển sang sương mù với đèn hậu của xe tải ngay phía trước; cột chữ bên trái nêu hai người lái và câu hỏi",
    sc: [
      [0, `thẻ tên "Khi không nhìn rõ"; thẻ "Ban đêm, gặp xe ngược chiều": "Bật đèn pha thật sáng để nhìn cho rõ", cụm "đèn pha thật sáng" sáng ở ${at(1, "đèn pha")}s, đúng lúc đèn xe ngược chiều loá trên kính`],
      [R(1, B.f1.fog) - 0.1, `cảnh chuyển sang sương mù (${R(1, C.c1)}s); thẻ "Trời sương mù": "Bám sát đèn hậu của xe trước để khỏi lạc đường", cụm "Bám sát đèn hậu" sáng ở ${R(1, B.f1.tail)}s`],
      [R(1, B.f1.both) - 0.2, `thẻ "Cả hai đều nghĩ mình đang lái an toàn hơn", cụm "an toàn hơn" sáng ở ${R(1, B.f1.safer)}s`],
      [R(1, B.f1.ask) - 0.35, `thẻ "Câu hỏi" hiện từng chữ theo giọng đọc: "Vì sao cả hai đều đang làm điều ngược lại?"`],
    ],
    sfx: "ping", at: R(1, B.f1.ask) - 0.1,
  },
  {
    scene: "Góc nhìn ngang bên đường: xe đang chạy thì gặp vật cản; trên mặt đường hiện hai đoạn nối nhau, đoạn hổ phách là lúc người lái kịp phản ứng, đoạn đỏ là lúc phanh, tới chỗ xe dừng hẳn",
    sc: [
      [0, `nhãn mục "Ý chính"; thẻ "Xe không dừng ngay": "mắt thấy nguy hiểm" sáng hổ phách ở ${R(2, B.f2.see)}s, "xe dừng hẳn" sáng đỏ ở ${R(2, B.f2.halt)}s`],
      [R(2, B.f2.that) - 0.25, `thẻ "Quãng đường đó gồm": dòng hổ phách "Quãng xe đi trong lúc người lái kịp phản ứng" (${at(2, "quãng xe đi")}s), dấu cộng (${R(2, B.f2.plus)}s), dòng đỏ "Quãng xe còn lăn tới trong lúc phanh" (${at(2, "quãng xe còn lăn")}s); hai đoạn cùng màu chạy trên mặt đường`],
    ],
    sfx: "none",
  },
  {
    scene: "Camera theo sau xe trong đêm: vùng đèn soi là đoạn đường nhìn thấy rõ, dải dừng xe nằm gọn trong đó; hai thanh ở góc trên phải so tầm nhìn với quãng dừng xe, không có con số",
    sc: [
      [0, `thẻ "Quy tắc bao trùm" viền sáng; câu "Chỉ chạy nhanh tới mức dừng được xe trong đoạn đường mình đang nhìn thấy rõ." sáng dần từng chữ theo giọng đọc từ ${R(3, B.f3.fast)}s; "dừng được xe" chuyển xanh lá (${R(3, B.f3.stop)}s), "nhìn thấy rõ" chuyển xanh da trời (${R(3, B.f3.seen)}s)`],
      [R(3, B.f3.short) - 0.25, `thẻ "Nhìn được càng ngắn thì phải chạy càng chậm.": "càng ngắn" sáng ở ${at(3, "càng ngắn")}s, "càng chậm" ở ${at(3, "càng chậm")}s; trên cảnh, vùng nhìn thấy co lại và xe chậm theo`],
    ],
    sfx: "chime", at: R(3, B.f3.rule),
  },
  {
    scene: "Sơ đồ nhìn ngang hai xe đối đầu trong đêm: chùm đèn chiếu xa vươn dài tới mắt người đối diện, chùm đèn chiếu gần chúi xuống mặt đường",
    sc: [
      [0, `nhãn mục "Đèn xe"; thẻ "Đèn xe có hai nhiệm vụ": "Giúp mình thấy đường" (${R(4, B.f4.see)}s), "Giúp người khác thấy mình" (${R(4, B.f4.seen)}s), dòng phụ "mà không làm ai lóa mắt" (${R(4, B.f4.noGlare)}s)`],
      [R(4, B.f4.high) - 0.25, `thẻ "Đèn chiếu xa" màu xanh da trời, dòng "thường gọi là đèn pha" (${at(4, "thường gọi là")}s); "Soi được rất xa" (${R(4, B.f4.far)}s); dòng đỏ "nhưng cũng rọi thẳng vào mắt người đối diện" (${at(4, "nhưng cũng")}s)`],
      [R(4, B.f4.low) - 0.25, `thẻ "Đèn chiếu gần" màu xanh lá, dòng "thường gọi là đèn cốt" (${at(4, "thường gọi là", { nth: 2 })}s); "Chúi xuống mặt đường" (${R(4, B.f4.dip)}s); "nên ít làm lóa mắt người đối diện" (${at(4, "nên ít")}s)`],
    ],
    sfx: "click-soft", at: R(4, B.f4.low),
  },
  {
    scene: "Sau tay lái, một xe ngược chiều đang tới gần; xe mình chuyển từ đèn chiếu xa sang đèn chiếu gần; rồi một góc nhìn giả định từ ghế người lái bên kia cho thấy họ bị loá thế nào nếu mình vẫn để đèn chiếu xa",
    sc: [
      [0, `nhãn mục "Ban đêm"; thẻ "Tới gần xe ngược chiều vào ban đêm": "Người lái cần làm hai việc", cụm "hai việc" sáng ở ${R(5, B.f5.two)}s`],
      [R(5, B.f5.first) - 0.2, `thẻ số 1: "Chuyển từ đèn chiếu xa sang đèn chiếu gần", hai cụm sáng lần lượt ở ${at(5, "đèn chiếu xa")}s và ${at(5, "đèn chiếu gần")}s; chùm đèn trên đường hạ xuống cùng lúc`],
      [R(5, B.f5.think) - 0.2, `thẻ "Vì sao": "Nhiều người nghĩ: làm vậy là nhường nhịn người khác", rồi "Thực ra là tự bảo vệ mình" (${at(5, "nhưng thực ra")}s)`],
      [R(5, B.f5.dazzled) - 0.1, `góc nhìn của người lái bên kia (${R(5, C.c5b)}s); thẻ "Một người lái đang bị lóa mắt, và đang chạy về phía mình," rồi dòng đỏ "chính là mối nguy lớn nhất trên đoạn đường đó." (${at(5, "chính là")}s), viền đỏ ở ${R(5, B.f5.danger)}s`],
    ],
    sfx: "click", at: R(5, B.f5.sw),
  },
  {
    scene: "Sau tay lái: một dấu ngắm cho thấy mắt rời khỏi đèn xe ngược chiều, trượt sang vạch mép đường bên phải; một đoạn minh hoạ cảnh mắt bị loá rồi nhìn rõ dần trong lúc xe vẫn chạy",
    sc: [
      [0, `dòng gọn việc 1 đã xong; thẻ số 2 "Việc thứ hai": "Không nhìn thẳng vào đèn của xe ngược chiều" (${R(6, B.f6.noLook)}s), "Nhìn chếch sang phía bên phải" (${R(6, B.f6.right)}s), dòng phụ "theo chiều chuyển động của xe mình" (${R(6, B.f6.dir)}s)`],
      [R(6, B.f6.hit) - 0.2, `thẻ "Vì sao": "Mắt bị rọi sáng mạnh cần vài giây mới nhìn lại được bình thường", cụm "vài giây" sáng ở ${at(6, "vài giây")}s; dòng hổ phách "Trong vài giây ấy xe vẫn chạy" (${at(6, "và trong vài giây")}s)`],
      [R(6, B.f6.again) - 0.2, `thẻ "Nhìn chếch sang phải": "Mắt tránh được luồng sáng" (${at(6, "thì mắt tránh")}s), "Vẫn bám được vào mép đường để giữ hướng" (${at(6, "đồng thời")}s); vạch mép đường bên phải sáng lên trên cảnh`],
    ],
    sfx: "none",
  },
  {
    scene: "Sau tay lái: mình đã về đèn chiếu gần nhưng xe đối diện vẫn để đèn pha; quầng chói phủ kính, đoạn đường nhìn thấy co ngắn lại, thanh tầm nhìn ở góc trên phải ngắn theo và xe chậm dần",
    sc: [
      [0, `nhãn mục "Bị chói mắt"; thẻ "Có khi": dấu xanh "Mình đã chuyển sang đèn chiếu gần", dấu đỏ "mà xe đối diện vẫn để đèn pha" (${at(7, "mà xe đối diện")}s)`],
      [R(7, B.f7.now) - 0.2, `thẻ "Tầm nhìn của mình ngắn hẳn lại, nên tốc độ cũng phải giảm theo.": "ngắn hẳn lại" sáng ở ${R(7, B.f7.short)}s, "giảm theo" ở ${at(7, "giảm theo")}s`],
      [R(7, B.f7.how) - 0.2, `thẻ "Cách xử lý gồm ba việc", ba dòng có hình vẽ, không đánh số: "Giảm tốc độ" (${R(7, B.f7.slow)}s), "Giữ vững tay lái" (${R(7, B.f7.wheel)}s), "Nhìn chếch sang lề đường bên phải" (${R(7, B.f7.edge)}s)`],
    ],
    sfx: "pop", at: R(7, B.f7.slow),
  },
  {
    scene: "Sau tay lái, vẫn đang bị chói: quãng dừng xe thu lại cho vừa tầm nhìn, xe giữ đúng làn, vạch mép đường bên phải được tô sáng làm đường mốc",
    sc: [
      [0, `thẻ "Giảm tốc độ" viền sáng, dòng phụ "để quãng đường dừng xe vừa với tầm nhìn còn lại" (${at(8, "để quãng đường")}s)`],
      [R(8, B.f8.wheel) - 0.2, `thẻ "Giữ vững tay lái" viền sáng, thẻ trước mờ bớt; dòng phụ "để xe không lệch khỏi làn trong lúc mắt nhìn kém" (${at(8, "để xe không lệch")}s)`],
      [R(8, B.f8.edge) - 0.2, `thẻ "Nhìn sang lề phải" viền sáng; dòng phụ "để có một đường mốc mà đi theo" (${at(8, "để có một đường mốc")}s)`],
    ],
    sfx: "none",
  },
  {
    scene: "Hai xe đối đầu cùng bật đèn pha, hai chùm sáng rọi thẳng vào nhau; rồi trở lại sau tay lái, xe lao nhanh vào khoảng tối không nhìn thấy gì",
    sc: [
      [0, `thẻ dấu đỏ "Bật đèn pha để đáp trả"; nhãn "TỆ NHẤT" bật ra ở ${R(9, B.f9.worst)}s, thẻ rung nhẹ một lần; dòng phụ "Hai người lái cùng không nhìn thấy gì, và đang chạy về phía nhau." (${at(9, "vì khi đó")}s)`],
      [R(9, B.f9.keep) - 0.2, `thẻ dấu đỏ "Giữ nguyên tốc độ hoặc tăng tốc"; nhãn "CŨNG SAI" ở ${R(9, B.f9.wrong)}s; dòng phụ "Đó là chạy nhanh vào một đoạn đường mình không nhìn thấy." (${at(9, "vì đó là")}s); cảnh về sau tay lái ở ${R(9, C.c9b)}s`],
    ],
    sfx: "error", at: R(9, B.f9.worst),
  },
  {
    scene: "Sau tay lái trong sương mù dày: những hạt nước lơ lửng trong chùm đèn; khi bật đèn chiếu xa, ánh sáng hắt ngược lại thành một màn trắng che hết đường",
    sc: [
      [0, `nhãn mục "Sương mù, mưa to"; thẻ "Trong sương mù và mưa to": "Không khí chứa đầy những hạt nước nhỏ" (${at(10, "không khí")}s), dòng hổ phách "và chúng hắt ánh sáng trở lại" (${at(10, "và chúng")}s)`],
      [R(10, B.f10.high) - 0.2, `thẻ "Đèn chiếu xa rọi thẳng vào màn nước ấy"; dòng lớn "tạo ra một bức tường trắng ngay trước mắt" (${at(10, "sẽ tạo ra")}s), cụm "bức tường trắng" sáng trắng ở ${R(10, B.f10.wall)}s; dòng đỏ "khiến người lái càng nhìn kém hơn" (${at(10, "khiến người lái")}s)`],
    ],
    sfx: "whoosh", at: 0.15,
  },
  {
    scene: "Vẫn trong sương mù: đèn chiếu gần chúi xuống nên mặt đường hiện ra lại; rồi nhìn từ phía trước đầu xe, hai đèn sương mù màu vàng đặt thấp, quét rộng sát mặt đường",
    sc: [
      [0, `thẻ "Đèn chiếu gần" màu xanh lá, dòng phụ "chúi xuống mặt đường, nên ít bị hắt lại" (${at(11, "chúi xuống")}s)`],
      [R(11, B.f11.fogLamp) - 0.2, `thẻ "Đèn sương mù" màu hổ phách, dòng phụ "trên nhiều xe là đèn màu vàng" (${at(11, "trên nhiều xe")}s); "được lắp thấp" (${R(11, B.f11.mount)}s), "và chiếu rộng sát mặt đường" (${R(11, B.f11.wide)}s); góc nhìn trước đầu xe ở ${R(11, C.c11b)}s; "nên càng có ích trong lúc này" (${at(11, "nên càng có ích")}s)`],
    ],
    sfx: "click-soft", at: R(11, B.f11.fogLamp),
  },
  {
    scene: "Sau tay lái trong sương mù: xe chậm lại, khoảng cách tới xe phía trước giãn ra, đèn chiếu gần và đèn sương mù cùng sáng",
    sc: [
      [0, `thẻ tiêu đề "Cách lái khi tầm nhìn bị hạn chế"`],
      [R(12, B.f12.one) - 0.15, `thẻ số 1 "Giảm tốc độ", số sáng hổ phách rồi chuyển xanh; dòng phụ "và đi chậm tới mức mình có thể quan sát được" (${at(12, "và đi chậm")}s)`],
      [R(12, B.f12.two) - 0.15, `thẻ số 2 "Chạy cách xa xe phía trước"; dòng phụ "với khoảng cách an toàn" (${at(12, "với khoảng cách")}s)`],
      [R(12, B.f12.three) - 0.15, `thẻ số 3 "Bật đèn chiếu gần"; dòng phụ "và đèn sương mù nếu xe có" (${R(12, B.f12.fogLamp)}s)`],
    ],
    sfx: "pop", at: R(12, B.f12.one),
  },
  {
    scene: "Mưa trên kính, gạt nước quét cho kính trong; mưa dày thêm tới lúc không còn nhìn rõ, xe rời đường vào chỗ dừng; nhìn từ phía sau, đèn dừng khẩn cấp nhấp nháy khi xe đã đứng yên",
    sc: [
      [0, `ba việc đầu thu gọn thành ba dòng đã xong; thẻ số 4 "Điều khiển gạt nước", dòng phụ "để kính chắn gió luôn trong" (${at(13, "để kính chắn gió")}s)`],
      [R(13, B.f13.five) - 0.15, `thẻ số 5 "Khi mưa hoặc sương dày tới mức đi chậm cũng không nhìn rõ nữa:"; "Tìm chỗ an toàn để dừng xe" (${at(13, "thì tìm chỗ")}s); "Bật đèn dừng khẩn cấp" (${at(13, "và bật đèn")}s), dòng phụ "để báo hiệu cho các xe khác biết" (${at(13, "để báo hiệu")}s)`],
      [R(13, B.f13.means) - 0.1, `góc nhìn phía sau xe (${R(13, C.c13b)}s); thẻ viền sáng "Đèn dừng khẩn cấp là để báo xe đang dừng.", cụm "báo xe đang dừng" sáng hổ phách ở ${R(13, B.f13.parked)}s`],
    ],
    sfx: "click", at: R(13, B.f13.hazard),
  },
  {
    scene: "Sau tay lái trong sương mù, hai cách làm sai: xe tăng tốc, quãng dừng xe vượt quá đoạn nhìn thấy; rồi xe bám sát đèn hậu xe tải, xe tải phanh, và xe tải lao khỏi đường",
    sc: [
      [0, `thẻ tiêu đề "Hai cách làm sai rất phổ biến"`],
      [R(14, B.f14.one) - 0.2, `thẻ dấu đỏ "Tăng tốc để mau thoát khỏi vùng mưa, vùng sương"; dòng phụ "Đó là chạy nhanh nhất, đúng vào lúc nhìn kém nhất." (${at(14, "Đó là")}s), "nhanh nhất" và "kém nhất" sáng đỏ ở ${at(14, "nhanh nhất")}s và ${at(14, "kém nhất")}s`],
      [R(14, B.f14.twoIs) - 0.2, `thẻ dấu đỏ "Chạy gần xe trước, và nhìn đèn hậu của nó để định hướng", thẻ trước mờ bớt; "Khi xe trước phanh, mình sẽ không còn đủ khoảng cách để dừng." (${R(14, B.f14.brake)}s); dòng đỏ "Xe trước lao vào đâu, thì mình lao theo vào đó." (${at(14, "Và xe trước")}s)`],
    ],
    sfx: "error", at: R(14, B.f14.one) - 0.1,
  },
  {
    scene: "Sau tay lái, đường đêm trong và êm; cột chữ tóm lại quy tắc bao trùm, hai việc khi gặp xe ngược chiều và ba việc khi bị chói mắt",
    sc: [
      [0, `nhãn mục "Ghi nhớ"; thẻ "Quy tắc bao trùm": câu quy tắc sáng dần từng chữ theo giọng đọc từ ${R(15, B.f15.rule)}s`],
      [R(15, B.f15.night) - 0.2, `thẻ "Ban đêm gặp xe ngược chiều": "Chuyển đèn chiếu xa sang đèn chiếu gần" (${R(15, B.f15.sw)}s), "Không nhìn thẳng vào đèn xe kia" (${R(15, B.f15.noLook)}s), "Nhìn chếch sang phải" (${R(15, B.f15.right)}s)`],
      [R(15, B.f15.glare) - 0.2, `thẻ "Bị chói mắt": "Giảm tốc độ" (${R(15, B.f15.slow)}s), "Giữ vững tay lái" (${R(15, B.f15.wheel)}s), "Nhìn chếch sang lề phải" (${R(15, B.f15.edge)}s)`],
    ],
    sfx: "sparkle", at: R(15, B.f15.memo) + 0.1,
  },
  {
    scene: "Sau tay lái trong sương mù với đèn chiếu gần và đèn sương mù; cuối cùng nhìn từ phía sau, xe đã dừng ở chỗ an toàn, đèn dừng khẩn cấp nhấp nháy",
    sc: [
      [0, `thẻ "Sương mù, mưa to": "Giảm tốc độ" (${R(16, B.f16.slow)}s), "Giữ khoảng cách xa" (${R(16, B.f16.gap)}s), "Đèn chiếu gần và đèn sương mù" (${R(16, B.f16.low)}s), "Gạt nước" (${R(16, B.f16.wiper)}s)`],
      [R(16, B.f16.cant) - 0.2, `thẻ "Không quan sát được nữa": "Tìm chỗ an toàn dừng xe" (${at(16, "thì tìm chỗ")}s), "Bật đèn dừng khẩn cấp" (${at(16, "và bật đèn")}s); góc nhìn phía sau xe ở ${R(16, C.c16b)}s`],
      [r2(at(16, "khẩn cấp", { end: true }) + 0.2), `thẻ kết "Nhìn được càng ngắn thì phải chạy càng chậm.", cụm "càng chậm" mang gradient, giữ tới hết khung`],
    ],
    sfx: "chime", at: at(16, "khẩn cấp", { end: true }) - 0.05,
  },
];
const direction = `## Video direction

- **Palette system**
  - Lấy từ frame.md (glass-keynote): mực \`#F5F3FF\`, chữ phụ \`#AEACD6\`, thẻ chàm gần đặc \`#15163A\`, viền lilac \`rgba(196,181,253,0.28)\`.
  - Nền của video là một cảnh 3D ban đêm do \`compositions/world.html\` vẽ: phần lớn thời gian người xem ngồi sau tay lái, nhìn qua kính chắn gió. Các khung chỉ là lớp chữ trong suốt đặt lên trên.
  - Vì cảnh tối, mọi chữ nằm trên thẻ chàm gần đặc và dùng màu sáng; không có chữ đặt trực tiếp lên cảnh ngoài các nhãn do cảnh 3D tự vẽ.
  - Màu có nghĩa cố định trong cả video: xanh da trời = đèn chiếu xa / tầm nhìn; xanh lá = đèn chiếu gần / dừng được / làm đúng; hổ phách = đang nói tới / đèn sương mù / lúc phản ứng; đỏ = sai / nguy hiểm / lúc phanh.
  - Gradient hồng-tím-xanh chỉ dùng cho tên bài ở khung 1 và câu kết ở khung 16.
- **Type**
  - Plus Jakarta Sans 700-800 cho quy tắc, việc cần làm và lý do; JetBrains Mono IN HOA giãn 0.14em cho nhãn nhỏ.
  - Font tiếng Việt trong \`assets/fonts/\` (frame.md § Font faces), line-height dòng lớn ≥ 1.1, không cắt chiều dọc hộp chữ.
  - Chữ trên thẻ là lời đọc rút gọn; không thêm ý nào không có trong lời đọc.
- **Motion grammar**
  - Cảnh 3D chạy liên tục theo lời đọc: đèn đổi chùm, quầng chói, sương, mưa, gạt nước, xe chậm lại hay dừng đều xảy ra đúng lúc được nói tới.
  - Thẻ chữ vào bằng \`power3.out\`; từng dòng trong thẻ trượt nhẹ từ trái vào đúng lúc được đọc. Cụm từ khoá sáng thành ô màu rồi trả về màu chữ của nó.
  - Câu quy tắc bao trùm hiện mờ sẵn và sáng dần từng chữ theo giọng đọc (khung 3 và 15).
  - Danh sách có số trong bài (năm việc khi tầm nhìn bị hạn chế, việc thứ nhất và việc thứ hai) giữ đúng số và thứ tự; số sáng hổ phách khi đang đọc, chuyển xanh khi xong. Danh sách không đánh số trong bài thì dùng hình vẽ hoặc dấu chấm, vẫn đúng thứ tự.
  - Nhãn "TỆ NHẤT", "CŨNG SAI" bật một lần kèm thẻ rung nhẹ.
- **Rhythm / held frames**: khung 1 mở bằng hai tình huống và một câu hỏi; khung 2-3 là ý chính, khung 3 dừng trên câu quy tắc; khung 4 nói về đèn; khung 5-6 ban đêm gặp xe ngược chiều; khung 7-9 khi bị chói mắt; khung 10-14 sương mù và mưa to; khung 15-16 ghi nhớ, khung 16 kết bằng một câu giữ tới hết.
- **Framing variety**: chữ luôn ở cột trái (x 64-620, từ y 104); cảnh 3D đổi góc theo nội dung: sau tay lái, nhìn ngang bên đường, theo sau xe, sơ đồ hai xe đối đầu, ghế người lái bên kia, trước đầu xe, phía sau xe đang dừng. Góc trên phải dành cho bảng so tầm nhìn với quãng dừng xe của cảnh 3D.
- **Caption keep-out**
  - Phụ đề nằm ở ~17% dưới cùng (y > 896); mọi thẻ chữ kết thúc trên y 880.
  - Khung không có nền riêng; nền là cảnh 3D ở lớp dưới cùng của index.
- **Language + Negative list**
  - Mọi chữ trên hình là tiếng Việt.
  - Video đứng một mình: không lời hay chữ nào nhắc tới số câu hỏi, kỳ kiểm tra hay tài liệu nguồn; không ghi số thứ tự bài.
  - Bài không có con số nào: không số đo tốc độ, không số mét, không số giây trên hình. Các thanh và dải màu chỉ so độ dài với nhau.
  - Không thêm thao tác ngoài bài: không vẽ đèn báo rẽ khi xe tấp vào chỗ dừng, không thêm bước nào vào các danh sách.
  - Không dữ liệu cá nhân, token hay đường dẫn riêng.
  - Không \`repeat\`/\`yoyo\`/\`Math.random\`/\`@keyframes\`.
  - Cấm cả hai kiểu hỏng: "slideshow" (hiện hết trong 25% đầu rồi đứng im) và "screensaver" (nhiều thứ trôi lung tung).
`;

writeStoryboard({
  title: "Khi không nhìn rõ: lái xe ban đêm, sương mù và mưa to",
  music: "calm night-drive underscore, warm electric piano and soft analog pads, slow steady pulse, unobtrusive",
  direction,
  frames: F,
});
