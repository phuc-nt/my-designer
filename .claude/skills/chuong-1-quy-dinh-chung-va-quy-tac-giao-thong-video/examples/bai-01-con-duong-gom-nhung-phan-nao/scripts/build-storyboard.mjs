// What only this lesson knows about its storyboard: the scene of each frame, its sound, and the video
// direction. storyboard.lib.mjs adds the narration and the timings and writes STORYBOARD.md.
//   node scripts/build-storyboard.mjs
import { B, rel, at } from "./frames.ctx.mjs";
import { writeStoryboard } from "./storyboard.lib.mjs";

const R = (n, abs) => rel(n, abs);
const RULE = "thẻ viền tím nhạt mang nhãn \"Quy tắc\": nguyên câu luật hiện mờ sẵn và sáng dần từng chữ theo giọng đọc";
const TRAP = "thẻ viền đỏ mang nhãn \"Dễ nhầm\"";

// per frame: scene (one line), sc: [start, text] phases, sfx + at (seconds in the frame)
const F = [
  {
    scene: "Mô hình một đoạn đường đặt trên bàn vẽ, nhìn chéo từ trên xuống: xe chạy trên mô hình, từng phần của con đường lần lượt được gắn thẻ tên",
    sc: [
      [0, `thẻ tên bài "Con đường gồm những phần nào?"; mô hình con đường hiện ra trong khung bản vẽ, bốn chiếc xe chạy trên đó`],
      [at(1, "Luật đặt") - 0.2, `thẻ "Luật đặt tên riêng cho từng phần của con đường", dòng "Mỗi tên gắn với một công dụng" (${R(1, B.f1.use)}s); trên mô hình các thẻ tên bật lên lần lượt, mỗi thẻ nối với phần nó gọi tên`],
      [R(1, B.f1.rules) - 0.2, `thẻ "Các quy tắc đều dùng những tên này" với ba dòng "về làn" (${R(1, B.f1.lane)}s), "về vượt" (${R(1, B.f1.pass)}s), "về dừng đỗ" (${R(1, B.f1.stop)}s); trên mô hình một xe giữ làn, một xe vượt, một xe tấp vào lề rồi dừng; cuối khung mô hình được tháo rời (${R(1, B.f1.out)}s)`],
    ],
    sfx: "ping", at: R(1, B.f1.ask),
  },
  {
    scene: "Chỉ còn phần đường xe chạy sáng lên trên mô hình, lề đường mờ đi; các loại xe chạy trên phần đó",
    sc: [
      [0, `nhãn mục "Phần đường xe chạy và làn đường" kèm năm chấm tiến độ trượt vào; ${RULE}; phần đường xe chạy được tô sáng và gắn thẻ tên`],
      [R(2, B.f2.veh) - 0.1, `ô tô, xe tải, xe máy, xe đạp chạy trên phần đường vừa tô sáng (${R(2, B.f2.go)}s)`],
    ],
    sfx: "whoosh-short", at: 0.2,
  },
  {
    scene: "Hai cách hiểu sai được diễn ngay trên mô hình rồi bị gạch đỏ: vùng tô lan ra cả lề đường, rồi co lại chỉ còn chỗ của ô tô",
    sc: [
      [0, `câu Quy tắc vừa đọc lùi lên trên, chữ nhỏ; ${TRAP} với tên "Phần đường xe chạy"`],
      [R(3, B.f3.w1) - 0.05, `dòng "không phải là mặt đường cộng lề đường"; trên mô hình vùng tô lan ra lề, rồi bị gạch đỏ (${R(3, B.f3.x1)}s), cụm chữ sai bị gạch ngang`],
      [R(3, B.f3.w2) - 0.05, `dòng "không chỉ là phần dành cho xe cơ giới"; vùng tô co lại chỉ còn chỗ của ô tô, rồi bị gạch đỏ (${R(3, B.f3.x2)}s)`],
    ],
    sfx: "click", at: R(3, B.f3.x1) + 0.25,
  },
  {
    scene: "Phần đường xe chạy được chia theo chiều dọc thành các làn; một mũi tên đo bề rộng của một làn so với chiếc xe chạy trong đó",
    sc: [
      [0, `thẻ Quy tắc dài thêm một câu: câu trước chữ nhỏ ở trên, câu "Làn đường là…" sáng dần từng chữ; các làn được tách ra dọc đường (${R(4, B.f4.along)}s), mũi tên đo bề rộng làn mở ra (${R(4, B.f4.wide)}s)`],
      [R(4, B.f4.sign) - 0.2, `thẻ "Dấu hiệu của làn đường" với dòng có dấu tích "đủ chiều rộng cho xe chạy an toàn" (${R(4, B.f4.wide2)}s); một xe tải chạy vừa trong làn`],
    ],
    sfx: "none",
  },
  {
    scene: "Dải phân cách được đặt vào mô hình ba lần, mỗi lần cho một công dụng: chia hai chiều, tách xe cơ giới với xe thô sơ, tách các loại xe trên cùng một chiều",
    sc: [
      [0, `nhãn mục "Dải phân cách và vạch kẻ đường", chấm thứ hai bật; ${RULE}, câu chia ba dòng theo hai chữ "hoặc"; dải phân cách giữa hạ xuống mô hình, hai chiều xe chạy ngược nhau (${R(5, B.f5.two)}s)`],
      [R(5, B.f5.or2) - 0.1, `một dải phân cách bên tách làn xe đạp khỏi làn ô tô (${R(5, B.f5.kinds)}s)`],
      [R(5, B.f5.or3) - 0.1, `một dải nữa tách các loại xe trên cùng một chiều đường (${R(5, B.f5.same)}s)`],
    ],
    sfx: "pop", at: 0.3,
  },
  {
    scene: "Ống kính hạ thấp xuống mặt đường: vạch chia làn, mũi tên chỉ hướng và vạch dừng lần lượt sáng lên; hai nhãn sai bị gạch",
    sc: [
      [0, `thẻ Quy tắc dài thêm câu "Vạch kẻ đường là…", sáng dần từng chữ; trên mô hình vạch chia làn (${R(6, B.f6.lanes)}s), mũi tên chỉ hướng (${R(6, B.f6.dir)}s), vạch dừng (${R(6, B.f6.stop)}s) sáng lên kèm nhãn`],
      [R(6, B.f6.trap) - 0.2, `${TRAP}: "Định nghĩa vạch kẻ đường không nói tới việc", hai dòng "cảnh báo nguy hiểm" (${R(6, B.f6.w1)}s) và "báo thông tin về đường bộ" (${R(6, B.f6.w2)}s) lần lượt bị gạch ngang; trên mô hình hai nhãn ấy cũng bị gạch đỏ`],
    ],
    sfx: "click", at: R(6, B.f6.w1) + 0.7,
  },
  {
    scene: "Hai nhóm nhãn đứng cạnh hai thứ trên mô hình: dải phân cách bên này, vạch kẻ đường bên kia",
    sc: [
      [0, `thẻ viền hổ phách mang nhãn "Cách nhớ": tên "Dải phân cách" với hai dòng "chia chiều đi" (${R(7, B.f7.way)}s), "chia loại xe" (${R(7, B.f7.kind)}s); dải phân cách trên mô hình sáng lên`],
      [R(7, B.f7.paint) - 0.2, `thẻ "Vạch kẻ đường" với ba dòng "chia làn" (${R(7, B.f7.lane)}s), "chỉ hướng đi" (${R(7, B.f7.dir)}s), "chỉ chỗ dừng" (${R(7, B.f7.stop)}s); từng loại vạch sáng lên theo dòng của nó`],
    ],
    sfx: "none",
  },
  {
    scene: "Một khối trong suốt dựng lên trên mặt đường: khoảng trống mà xe phải lọt qua, có mũi tên đo bề rộng và bề cao",
    sc: [
      [0, `nhãn mục "Khổ giới hạn của đường bộ", chấm thứ ba bật; ${RULE}; khối trong suốt dựng lên (${R(8, B.f8.space)}s), mũi tên đo chiều rộng (${R(8, B.f8.wide)}s) và chiều cao (${R(8, B.f8.high)}s) mở ra`],
      [R(8, B.f8.veh) - 0.2, `một xe tải chở hàng chạy lọt qua khối ấy (${R(8, B.f8.pass)}s), thùng hàng sáng lên ở chữ "kể cả hàng hóa" (${R(8, B.f8.load)}s)`],
      [R(8, B.f8.std) - 0.3, `câu thứ hai của Quy tắc sáng dần: "Nó được xác định theo quy chuẩn, tiêu chuẩn kỹ thuật của đường bộ"`],
    ],
    sfx: "whoosh-short", at: R(8, B.f8.space),
  },
  {
    scene: "Khối khổ giới hạn giữ nguyên; lần lượt chỉ còn mũi tên rộng, rồi chỉ còn mũi tên cao, cả hai lần đều bị gạch",
    sc: [
      [0, `câu Quy tắc lùi lên trên, chữ nhỏ; ${TRAP} với tên "Khổ giới hạn" và hai dòng có dấu tích: "gồm cả chiều rộng lẫn chiều cao" (${R(9, B.f9.wide)}s), "tính cho cả xe lẫn hàng trên xe" (${R(9, B.f9.veh)}s)`],
      [R(9, B.f9.only1) - 0.25, `thẻ thứ hai với hai dòng dấu chéo "Chỉ nói chiều rộng" (${R(9, B.f9.only1)}s), "Chỉ nói chiều cao" (${R(9, B.f9.only2)}s) và dòng "đều thiếu" sáng đỏ (${R(9, B.f9.both)}s); trên mô hình từng mũi tên đứng một mình rồi bị gạch`],
    ],
    sfx: "click", at: R(9, B.f9.only1),
  },
  {
    scene: "Ống kính lùi ra xa: đoạn đường dài hơn, chỉ có ô tô và xe máy chuyên dùng chạy trên đó",
    sc: [
      [0, `nhãn mục "Đường cao tốc", chấm thứ tư bật; ${RULE}; mô hình lùi xa thành một tuyến đường dài`],
      [R(10, B.f10.some) - 0.1, `ô tô chạy trên đường (${R(10, B.f10.motor)}s), một xe lu màu vàng đứng thay cho xe máy chuyên dùng (${R(10, B.f10.special)}s)`],
    ],
    sfx: "whoosh-short", at: 0.2,
  },
  {
    scene: "Đường cao tốc được lắp thêm ba thứ theo ba vế của câu: dải phân cách giữa, cầu vượt, làn ra vào",
    sc: [
      [0, `thẻ Quy tắc dài thêm câu thứ hai, sáng dần từng chữ; dải phân cách giữa sáng lên (${R(11, B.f11.med)}s)`],
      [R(11, B.f11.cross) - 0.1, `con đường cắt ngang được nâng lên thành cầu vượt, xe trên hai đường không còn gặp nhau`],
      [R(11, B.f11.exit) - 0.1, `một làn rẽ ra (${R(11, B.f11.exit)}s) và một làn nhập vào (${R(11, B.f11.entry)}s) sáng lên: xe chỉ ra, vào ở đó`],
    ],
    sfx: "pop", at: R(11, B.f11.cross) + 0.8,
  },
  {
    scene: "Hàng rào chạy dọc hai bên đường, cột đèn và giá long môn mọc lên; dòng xe chạy đều không dừng",
    sc: [
      [0, `thẻ Quy tắc dài thêm câu thứ ba; hàng rào bảo vệ dựng dọc hai bên (${R(12, B.f12.fence)}s), cột đèn và giá long môn mọc lên (${R(12, B.f12.equip)}s)`],
      [R(12, B.f12.flow) - 0.1, `ba nhãn "liên tục" (${R(12, B.f12.flow)}s), "an toàn" (${R(12, B.f12.safe)}s), "rút ngắn thời gian hành trình" (${R(12, B.f12.fast)}s) hiện trên dòng xe chạy đều`],
    ],
    sfx: "none",
  },
  {
    scene: "Hai đầu tuyến đường mang nhãn nơi nó nối tới; các nhãn ấy bị gạch, còn những bộ phận cấu tạo thì sáng lên",
    sc: [
      [0, `cả ba câu Quy tắc lùi lên trên, chữ nhỏ; ${TRAP}: "Đường cao tốc được định nghĩa bằng cấu tạo của nó", cụm cuối sáng xanh (${R(13, B.f13.build)}s); trên mô hình các bộ phận cấu tạo sáng lên`],
      [R(13, B.f13.link) - 0.1, `hai dòng "nối Thủ đô với trung tâm tỉnh" (${R(13, B.f13.capital)}s), "nối các tỉnh với nhau" (${R(13, B.f13.prov)}s); hai đầu tuyến mang nhãn nơi nó nối tới`],
      [R(13, B.f13.not) - 0.1, `hai dòng ấy bị gạch ngang, dòng "không làm nó thành đường cao tốc" sáng đỏ; trên mô hình các nhãn nơi nối tới bị gạch`],
    ],
    sfx: "click", at: R(13, B.f13.not) + 0.1,
  },
  {
    scene: "Mô hình lùi về phía sau, một cột chỉ đường mọc lên giữa hình; tám tấm biển tên gắn vào cột theo đúng thứ tự được đọc",
    sc: [
      [0, `nhãn mục "Các loại đường theo chức năng", chấm thứ năm bật; ${RULE}; cột chỉ đường mọc lên, nhãn "Theo chức năng phục vụ" ở đỉnh cột`],
      [R(14, B.f14.main) - 0.1, `tám tấm biển đánh số trượt vào cột, mỗi tấm đúng lúc tên nó được đọc: đường chính, đường nhánh, đường gom, đường bên, đường dành cho giao thông công cộng (${R(14, B.f14.transit)}s), đường nội bộ, đường dành riêng cho người đi bộ, người đi xe đạp (${R(14, B.f14.walk)}s), các đường khác (${R(14, B.f14.other)}s)`],
      [R(14, B.f14.trap) - 0.2, `${TRAP}: "Hai loại hay bị kể sót", hai dòng "đường bên" (${R(14, B.f14.side2)}s) và "đường nội bộ" (${R(14, B.f14.inner2)}s); trên cột sáu tấm kia mờ đi, hai tấm ấy sáng lên`],
    ],
    sfx: "whoosh-short", at: 0.25,
  },
  {
    scene: "Trở lại mô hình: một xe tải chở hàng cao hơn nóc cabin chạy tới trước một cây cầu bắc ngang đường",
    sc: [
      [0, `nhãn mục "Thử áp dụng" kèm ba chấm, chấm đầu bật; cây cầu bắc ngang đường, xe tải chạy tới (${R(15, B.f15.truck)}s)`],
      [R(15, B.f15.truck) - 0.3, `thẻ "Tình huống": "Xe tải chở hàng cao hơn nóc cabin sắp chui qua gầm cầu"; hai thước đo hiện bên xe: tới nóc cabin và tới đỉnh hàng (${R(15, B.f15.cab)}s); khoảng trống dưới gầm cầu sáng lên (${R(15, B.f15.bridge)}s)`],
      [at(15, "Người lái") - 0.3, `thẻ "Câu hỏi" hiện từng chữ theo giọng đọc: "Người lái so chiều cao nào với khổ giới hạn?"`],
    ],
    sfx: "none",
  },
  {
    scene: "Thước đo tới đỉnh hàng chuyển xanh, thước đo tới nóc cabin mờ đi; xe tải chạy qua gầm cầu",
    sc: [[0, `thẻ tình huống và câu hỏi lùi lại; thẻ viền xanh "Trả lời": "Chiều cao tính cả hàng xếp trên xe", cụm cuối sáng xanh (${R(16, B.f16.load)}s); trên mô hình thước đo tới đỉnh hàng chuyển xanh, xe tải chui qua gầm cầu`]],
    sfx: "chime", at: 0.3,
  },
  {
    scene: "Đường có dải phân cách giữa, nhưng cầu vượt hạ xuống thành một ngã tư cùng mặt bằng; xe trên hai đường phải chờ nhau",
    sc: [
      [0, `chấm thứ hai bật; thẻ "Tình huống": "Một con đường có dải phân cách giữa nhưng vẫn có ngã tư cắt ngang trên cùng mặt bằng"; dải phân cách sáng lên (${R(17, B.f17.med)}s), cầu vượt hạ xuống mặt đường thành ngã tư (${R(17, B.f17.cross)}s), vùng giao nhau sáng lên (${R(17, B.f17.level)}s)`],
      [at(17, "Theo định nghĩa") - 0.3, `thẻ "Câu hỏi" hiện từng chữ: "Theo định nghĩa, đó có phải đường cao tốc không?"`],
    ],
    sfx: "none",
  },
  {
    scene: "Vùng giao nhau cùng mức chuyển đỏ và bị gạch",
    sc: [[0, `thẻ tình huống và câu hỏi lùi lại; thẻ "Trả lời": chữ "Không" đỏ, rồi câu "Đường cao tốc không giao nhau cùng mức với đường khác" sáng dần (${R(18, B.f18.rule)}s); trên mô hình vùng giao nhau chuyển đỏ và bị gạch`]],
    sfx: "chime", at: 0.25,
  },
  {
    scene: "Một chiều đường nhìn gần: dải phân cách bên tách làn xe đạp khỏi làn ô tô, xe đạp và ô tô chạy cùng chiều",
    sc: [
      [0, `chấm thứ ba bật; thẻ "Tình huống": "Trên một chiều đường, có dải phân cách tách xe thô sơ khỏi xe cơ giới"; mũi tên một chiều (${R(19, B.f19.one)}s), dải phân cách bên sáng lên (${R(19, B.f19.sep)}s), thẻ tên đi theo chiếc xe đạp (${R(19, B.f19.slow)}s) và chiếc ô tô (${R(19, B.f19.motor)}s)`],
      [at(19, "Dải phân cách ấy") - 0.3, `thẻ "Câu hỏi" hiện từng chữ: "Dải phân cách ấy có đúng công dụng không?"`],
    ],
    sfx: "none",
  },
  {
    scene: "Dải phân cách bên chuyển xanh; xe đạp và ô tô tiếp tục chạy mỗi bên một phần đường",
    sc: [[0, `thẻ tình huống và câu hỏi lùi lại; thẻ "Trả lời": chữ "Có" xanh, rồi câu "Dải phân cách còn dùng để chia phần đường của xe cơ giới và xe thô sơ trên cùng một chiều đường" sáng dần; trên mô hình dải phân cách chuyển xanh, hai phần đường sáng lên (${R(20, B.f20.motor)}s, ${R(20, B.f20.slow)}s)`]],
    sfx: "chime", at: 0.25,
  },
  {
    scene: "Ống kính lùi ra, cả mô hình hiện lại nguyên vẹn; một thẻ tên bị gắn sai kéo theo một quy tắc đi sai chỗ",
    sc: [
      [0, `thẻ "Hãy nhớ": "Hiểu sai một tên là hiểu sai cả quy tắc đi kèm", hai cụm sáng đỏ (${R(21, B.f21.name)}s, ${R(21, B.f21.rule)}s); thẻ "Những tên trong bài" liệt kê sáu tên; trên mô hình thẻ "làn đường" chuyển đỏ và mũi tên đứt nét kéo sang quy tắc "về làn"`],
    ],
    sfx: "none",
  },
];

const direction = `## Video direction

- **Palette system**
  - Lấy từ frame.md (glass-keynote): mực \`#F5F3FF\`, chữ phụ \`#AEACD6\`, thẻ chàm gần đặc \`#15163A\`, viền lilac \`rgba(196,181,253,0.28)\`.
  - Nền của video là một mô hình con đường đặt trên bàn vẽ, nhìn chéo từ trên xuống, do \`compositions/world.html\` vẽ trên canvas trong một khung bản vẽ ở bên phải. Các khung chỉ là lớp chữ trong suốt đặt lên trên, ở cột trái.
  - Màu chỉ mang nghĩa, ở cả mô hình lẫn chữ: tím nhạt (lilac) = phần đang được gọi tên, đỏ = cách hiểu sai, xanh lá = cách hiểu đúng, hổ phách = cách nhớ.
- **Type**
  - Plus Jakarta Sans 700-800 cho câu luật và tên các phần; JetBrains Mono IN HOA cho nhãn nhỏ.
  - Font tiếng Việt trong \`assets/fonts/\` (frame.md § Font faces), line-height dòng lớn ≥ 1.1, không cắt chiều dọc hộp chữ.
  - Câu Quy tắc hiện nguyên văn, không rút gọn. Chữ trên các thẻ khác là lời đọc rút gọn; không thêm ý nào không có trong lời đọc. Chữ trên hình từ 20 px trở lên.
- **Motion grammar**
  - Mô hình là nhân vật chính. Nó được lắp dần theo từng vế của câu luật: vế nào đọc tới thì bộ phận ấy hạ xuống, sáng lên hoặc được đo.
  - Cách hiểu sai được diễn ngay trên mô hình (vùng tô lan ra lề, chỉ còn một mũi tên đo, nhãn nơi nối tới) rồi bị gạch đỏ; cụm chữ sai ở cột trái bị gạch ngang cùng lúc.
  - Ống kính chỉ có một góc nhìn; nó lại gần khi nói về vạch kẻ, lùi ra khi nói về đường cao tốc. Xe là những khối đơn giản chạy đều, không trang trí.
  - Thẻ Quy tắc dài dần qua các khung của cùng một mục: câu đã đọc lùi lên trên với chữ nhỏ, câu đang đọc sáng dần từng chữ.
  - Mỗi mốc chuyển động lấy từ chữ của lời đọc (\`assets/lib/world/beats.js\`), không gõ tay.
- **Rhythm**
  - Năm mục, mỗi mục: Quy tắc, rồi Dễ nhầm hoặc Cách nhớ. Sau đó ba tình huống, mỗi tình huống một khung hỏi và một khung trả lời.
  - Chuyển khung bằng crossfade; mô hình ở dưới chạy liên tục suốt video.
- **Negative list**
  - Mọi chữ trên hình là tiếng Việt.
  - Video đứng một mình: không lời hay chữ nào nhắc tới số câu hỏi, kỳ kiểm tra hay tài liệu nguồn; không ghi số thứ tự bài.
  - Mô hình là hình minh hoạ, không theo tỉ lệ: không ghi con số kích thước nào, không vẽ biển báo, không vẽ địa danh thật.
  - Không thêm kiến thức ngoài bài: không tốc độ, không mức phạt, không số làn tối thiểu, không tên văn bản luật.
  - Thẻ "Cách nhớ" là cách nhớ của bài, không trình bày như lời của luật.
  - Không dữ liệu cá nhân, token hay đường dẫn riêng.
  - Không \`repeat\`/\`yoyo\`/\`Math.random\`/\`@keyframes\`.
  - Cấm cả hai kiểu hỏng: "slideshow" (hiện hết trong 25% đầu rồi đứng im) và "screensaver" (nhiều thứ trôi lung tung).
`;

writeStoryboard({
  title: "Con đường gồm những phần nào?",
  music: "calm, precise instrumental underscore, soft felt piano and warm marimba notes over a slow analog pad, a light steady pulse like careful measured work, minimal, unobtrusive",
  direction,
  frames: F,
});
