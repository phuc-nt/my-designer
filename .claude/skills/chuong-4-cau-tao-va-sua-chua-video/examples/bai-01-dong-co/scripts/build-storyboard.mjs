// What only this lesson knows about its storyboard: the scene of each frame, its sound, and the video
// direction. storyboard.lib.mjs adds the narration and the timings and writes STORYBOARD.md.
//   node scripts/build-storyboard.mjs
import { B, rel, at } from "./frames.ctx.mjs";
import { writeStoryboard } from "./storyboard.lib.mjs";

const R = (n, abs) => rel(n, abs);

// per frame: scene (one line), sc: [start, text] phases, sfx + at (seconds in the frame)
const F = [
  {
    scene: "Bàn máy: chiếc ô tô thân kính nhìn ngang, thấy bình nhiên liệu, động cơ và đường truyền lực; cuối khung hình phóng vào động cơ, tới một xi lanh cắt dọc",
    sc: [
      [0, `thẻ tên bài "Động cơ, nơi nhiên liệu biến thành chuyển động"; thẻ "Xăng và dầu diesel chỉ là chất lỏng nằm yên trong bình"; bình nhiên liệu trên xe sáng hổ phách kèm nhãn "xăng, dầu diesel"`],
      [at(1, "Bằng cách nào") - 0.35, `thẻ "Câu hỏi" hiện từng chữ theo giọng đọc: "Bằng cách nào chúng làm cho một chiếc xe nặng hơn một tấn lăn bánh?"; trên xe hiện nhãn "nặng hơn một tấn" (${R(1, B.f1.ton)}s) và một dấu hỏi (${R(1, B.f1.ask)}s)`],
      [at(1, "Muốn biết") - 0.2, `thẻ "Muốn biết, hãy nhìn vào bên trong động cơ"; động cơ sáng lên kèm nhãn "động cơ" (${R(1, B.f1.engine)}s), rồi hình phóng vào một xi lanh`],
    ],
    sfx: "ping", at: at(1, "Bằng cách nào") - 0.1,
  },
  {
    scene: "Một xi lanh cắt dọc chiếm bàn máy: nhiên liệu cháy trong buồng đốt, khí nóng đẩy pít tông xuống, trục khuỷu quay",
    sc: [
      [0, `nhãn mục "Ý lớn"; thẻ "Động cơ đốt trong": "Một chiếc máy đổi năng lượng"`],
      [at(2, "Nó đốt") - 0.1, `thẻ ngọn lửa "Đốt nhiên liệu ngay bên trong xi lanh để lấy nhiệt": "nhiên liệu" sáng hổ phách, "lấy nhiệt" sáng cam (${R(2, B.f2.heat)}s); trên hình lửa bùng trong buồng đốt (${R(2, B.f2.burn)}s), nhãn "xi lanh" (${R(2, B.f2.cyl)}s)`],
      [at(2, "dùng sức") - 0.1, `thẻ "Dùng sức giãn nở của khối khí nóng để đẩy pít tông"; trên hình nhãn "khí nóng" (${R(2, B.f2.gas)}s) và "pít tông" (${R(2, B.f2.piston)}s), pít tông bị đẩy xuống`],
      [at(2, "rồi biến") - 0.1, `thẻ "Biến cú đẩy ấy thành chuyển động quay", cụm cuối sáng xanh lá (${R(2, B.f2.spin)}s); trục khuỷu sáng kèm nhãn "chuyển động quay"`],
    ],
    sfx: "none",
  },
  {
    scene: "Xi lanh lùi sang trái; bên phải là bảng ba thứ cần cho sự cháy, mỗi thứ một màu, nối về buồng đốt",
    sc: [
      [0, `thẻ "Muốn có sự cháy": "Phải đủ ba thứ"; trên bảng lần lượt hiện "Nhiên liệu" (${R(3, B.f3.fuel)}s), "Không khí" (${R(3, B.f3.air)}s), "Một cách châm lửa" (${R(3, B.f3.spark)}s)`],
      [R(3, B.f3.know) - 0.2, `thẻ "Nắm được ba thứ này thì": "Hiểu động cơ làm việc ra sao" (${at(3, "thì hiểu")}s), "Hiểu vì sao có lúc nó không chịu nổ" (${at(3, "và hiểu")}s); ba ô trên bảng hiện dấu hỏi ở ${R(3, B.f3.stall)}s`],
    ],
    sfx: "none",
  },
  {
    scene: "Cận cảnh xi lanh: nhiên liệu và không khí vào buồng đốt, cháy thành khí rất nóng, khí giãn nở đẩy pít tông xuống; dải năm mắt xích ở trên cùng bắt đầu bằng nhiệt năng và cơ năng",
    sc: [
      [0, `nhãn mục "Làm việc gì?" và ba bước "Xem nó làm việc, Gọi đúng tên, Dễ nhầm với" trượt vào, bước một đang bật; thẻ "Trước hết": "Động cơ làm việc gì?"`],
      [R(4, B.f4.inCyl) - 0.15, `thẻ "Trong xi lanh": dòng "Nhiên liệu cháy cùng không khí và tạo ra khí rất nóng" (${R(4, B.f4.fuel)}s), ba cụm sáng hổ phách, xanh da trời, cam đúng lúc được đọc; trên hình nhãn "nhiên liệu", "không khí", rồi "khí rất nóng" (${R(4, B.f4.hot)}s)`],
      [R(4, B.f4.expand) - 0.45, `dòng "Khí nóng giãn nở, đẩy pít tông đi xuống", cụm sau sáng xanh lá (${R(4, B.f4.push)}s); mũi tên xanh trên pít tông`],
      [at(4, "Đây là lúc") - 0.1, `thẻ "Nhiệt năng trở thành cơ năng" (${R(4, B.f4.heatE)}s và ${R(4, B.f4.workE)}s), dòng phụ "tức là sức nóng trở thành sức đẩy" (${at(4, "tức là")}s); hai mắt xích đầu của dải trên cùng sáng theo`],
    ],
    sfx: "none",
  },
  {
    scene: "Xi lanh chỉ còn cơ cấu: pít tông, thanh truyền, trục khuỷu; rồi một cái chân đạp xe đạp đứng cạnh, đầu gối lên xuống còn đĩa xích quay tròn",
    sc: [
      [0, `thẻ "Pít tông chỉ đi lên và đi xuống"; khí trong xi lanh mờ đi, nhãn "pít tông"`],
      [at(5, "Nó nối") - 0.1, `thẻ "Nó nối với trục khuỷu qua một thanh truyền": nhãn "trục khuỷu" (${R(5, B.f5.crank)}s), "thanh truyền" (${R(5, B.f5.rod)}s); dòng phụ "Cơ cấu này đổi chuyển động lên xuống thành chuyển động quay" (${R(5, B.f5.mech)}s), trên hình hai mũi tên "lên xuống" (${R(5, B.f5.updown)}s) và vòng "quay" (${R(5, B.f5.rot)}s); mắt xích "trục khuỷu quay" sáng`],
      [R(5, B.f5.bike) - 0.15, `xi lanh lùi sang trái, chân người đạp xe hiện bên phải; thẻ "Chân người đạp xe đạp cũng vậy": "Đầu gối đi lên đi xuống" (${R(5, B.f5.knee)}s), "Đĩa xích thì quay tròn" (${at(5, "còn đĩa xích")}s)`],
    ],
    sfx: "none",
  },
  {
    scene: "Hình lùi ra cả chiếc xe, được kê lên để bánh quay tự do: lực chạy từ động cơ dọc đường truyền lực tới hai bánh sau, hai bánh trước đứng yên",
    sc: [
      [0, `thẻ "Trục khuỷu quay rồi thì lực được đưa tiếp qua hệ thống truyền lực tới các bánh xe chủ động": dòng chấm xanh chạy dọc gầm xe (${R(6, B.f6.force)}s), nhãn "hệ thống truyền lực" (${R(6, B.f6.line)}s), "bánh xe chủ động" (${R(6, B.f6.drive)}s)`],
      [R(6, B.f6.def) - 0.15, `thẻ "Bánh xe chủ động": "Những bánh nhận lực từ động cơ" (${R(6, B.f6.recv)}s), dòng phụ "Các bánh còn lại chỉ lăn theo" (${R(6, B.f6.rest)}s); bánh trước được đánh dấu "chỉ lăn theo"`],
    ],
    sfx: "none",
  },
  {
    scene: "Xe hạ xuống mặt đường và đi tới: bánh chủ động quay và bám đường, cả thân xe mang ba mũi tên cùng chiều",
    sc: [
      [0, `thẻ "Bánh chủ động quay, bám vào mặt đường và đẩy cả chiếc xe đi tới": nhãn "bám" dưới bánh sau (${R(7, B.f7.grip)}s), mũi tên đẩy tới (${R(7, B.f7.push)}s), vạch trên mặt đường trôi về sau`],
      [at(7, "Nhờ vậy") - 0.2, `thẻ "Chuyển động quay của bánh trở thành chuyển động tịnh tiến của xe": vòng "quay" quanh bánh (${R(7, B.f7.rot)}s), ba mũi tên xanh trên thân xe kèm nhãn "tịnh tiến" (${R(7, B.f7.trans)}s); mắt xích cuối của dải trên cùng sáng`],
      [at(7, "nghĩa là") - 0.1, `thẻ "Chuyển động tịnh tiến": "Cả chiếc xe dời chỗ theo một hướng" (${R(7, B.f7.dir)}s)`],
    ],
    sfx: "none",
  },
  {
    scene: "Xe vẫn chạy, một ô kính tròn cho thấy xi lanh đang làm việc bên trong; dải năm mắt xích sáng lần lượt theo câu định nghĩa",
    sc: [
      [0, `bước hai "Gọi đúng tên" bật; thẻ viền tím nhạt "Gọi cho đúng tên việc ấy"; câu "Khi làm việc, động cơ ô tô biến nhiệt năng thành cơ năng làm trục khuỷu quay, truyền lực đến các bánh xe chủ động, tạo ra chuyển động tịnh tiến cho xe." hiện mờ sẵn và sáng dần từng chữ theo giọng đọc từ ${at(8, "khi làm việc")}s`],
      [R(8, B.f8.heat), `"nhiệt năng" chuyển cam, "cơ năng" chuyển xanh lá (${R(8, B.f8.work)}s); năm mắt xích "nhiệt năng, cơ năng, trục khuỷu quay, bánh xe chủ động, chuyển động tịnh tiến" sáng lần lượt tới ${R(8, B.f8.trans)}s, các bộ phận tương ứng trên xe sáng theo`],
    ],
    sfx: "chime", at: at(8, "khi làm việc"),
  },
  {
    scene: "Xi lanh ở bên trái với hàng chữ nhiệt năng sang cơ năng; bên phải hiện một bánh xe có phanh với hàng chữ ngược lại, đĩa phanh nóng đỏ và toả nhiệt",
    sc: [
      [0, `bước ba "Dễ nhầm với" bật; thẻ "Điều cần nhớ là chiều biến đổi": "Từ nhiệt năng sang cơ năng" (${R(9, B.f9.heat)}s), dòng đỏ "không phải ngược lại" (${R(9, B.f9.notRev)}s); trên hình mũi tên ngược bị gạch chéo`],
      [R(9, B.f9.other) - 0.15, `thẻ "Trên xe cũng có": "Bộ phận biến cơ năng thành nhiệt năng" (${R(9, B.f9.work2)}s), bên phải là một vòng dấu hỏi; rồi "nhưng đó là phanh" (${R(9, B.f9.brake)}s), dấu hỏi thành bánh xe có phanh`],
      [at(9, "Phanh dùng") - 0.1, `thẻ "Phanh dùng ma sát để đổi chuyển động của xe thành sức nóng": nhãn "ma sát" (${R(9, B.f9.fric)}s), bánh quay chậm dần, đĩa phanh đỏ lên (${R(9, B.f9.hot)}s); dòng phụ "rồi tỏa ra không khí" (${R(9, B.f9.out)}s) cùng các vệt nhiệt bay lên`],
      [R(9, B.f9.both) - 0.15, `thẻ "Động cơ và phanh làm hai việc trái ngược nhau"; nhãn "trái ngược" nối hai hàng chữ (${R(9, B.f9.opp)}s)`],
    ],
    sfx: "click-soft", at: R(9, B.f9.brake),
  },
  {
    scene: "Xi lanh chỉ còn cơ cấu, hai vạch đứt đánh dấu điểm cao nhất và điểm thấp nhất của pít tông; pít tông đi một hành trình xuống rồi một hành trình lên",
    sc: [
      [0, `nhãn mục đổi thành "Thế nào là 4 kỳ?", ba bước trở về bước một; thẻ "Tiếp theo": "Thế nào là động cơ 4 kỳ?", dòng phụ "Trước hết cần hai khái niệm" (${at(10, "Trước hết cần")}s)`],
      [R(10, B.f10.term) - 0.15, `thẻ "Hành trình": "Một lần pít tông đi hết quãng đường của nó trong xi lanh"; hai vạch và nhãn "quãng đường" hiện ở ${R(10, B.f10.travel)}s`],
      [R(10, B.f10.from) - 0.05, `dòng mũi tên xuống "Từ điểm cao nhất xuống điểm thấp nhất": pít tông đi xuống, nhãn "điểm cao nhất", "điểm thấp nhất", "một hành trình"; rồi dòng mũi tên lên "hoặc từ điểm thấp nhất lên điểm cao nhất" (${R(10, B.f10.or)}s), pít tông đi lên`],
    ],
    sfx: "none",
  },
  {
    scene: "Xi lanh chạy đủ một vòng việc; phía trên hiện thanh bốn ô của một chu trình công tác, mỗi ô một việc, một con trỏ chạy theo",
    sc: [
      [0, `dòng nhắc "Hành trình" giữ ở trên; thẻ "Chu trình công tác": "Chuỗi việc động cơ phải làm xong để có được một lần đẩy pít tông" (${at(11, "một lần đẩy")}s)`],
      [R(11, B.f11.j1) - 0.05, `bốn dòng hiện đúng thứ tự được đọc: "Đưa khí mới vào" (${R(11, B.f11.j1)}s), "Nén lại" (${R(11, B.f11.j2)}s), "Đốt cháy" (${R(11, B.f11.j3)}s), "Thải khí đã cháy ra" (${R(11, B.f11.j4)}s); ô tương ứng trên thanh sáng, xi lanh làm đúng việc đó`],
      [at(11, "Xong chuỗi") - 0.1, `thẻ mũi tên vòng "Xong chuỗi ấy thì lặp lại từ đầu"; mũi tên vòng trên thanh (${R(11, B.f11.loop)}s)`],
    ],
    sfx: "none",
  },
  {
    scene: "Xi lanh làm hành trình nạp rồi hành trình nén, chậm vừa đủ để theo; thanh bốn ô nhận số 1 tới 4 và tên từng hành trình",
    sc: [
      [0, `thẻ "Động cơ 4 kỳ làm bốn việc ấy trong bốn hành trình của pít tông" (${R(12, B.f12.four)}s, bốn số bật trên thanh), dòng phụ "mỗi hành trình một việc" (${R(12, B.f12.each)}s)`],
      [R(12, B.f12.n1) - 0.15, `thẻ số 1 "Nạp": "Pít tông đi xuống" (${R(12, B.f12.down)}s), "Xu páp nạp mở" (${R(12, B.f12.valve)}s), "Khí mới được hút vào xi lanh" (${R(12, B.f12.fresh)}s); trên hình xu páp nạp mở, khí xanh da trời tràn vào`],
      [R(12, B.f12.n2) - 0.15, `thẻ số 2 "Nén": "Pít tông đi lên" (${R(12, B.f12.up)}s), "Các xu páp đều đóng" (${R(12, B.f12.closed)}s), "Khối khí bị ép nhỏ lại và nóng lên" (${R(12, B.f12.squeezed)}s); khối khí co lại và ngả sang cam, nhãn "nóng lên" (${R(12, B.f12.hot)}s)`],
    ],
    sfx: "none",
  },
  {
    scene: "Xi lanh làm hành trình cháy và giãn nở rồi hành trình xả: lửa bùng, khí nóng đẩy pít tông xuống, rồi khí đã cháy bị đẩy ra qua xu páp xả",
    sc: [
      [0, `dòng gọn "1 Nạp, 2 Nén" giữ ở trên; thẻ số 3 "Cháy và giãn nở": "Nhiên liệu bốc cháy" (${R(13, B.f13.fuel)}s), "Khí nóng đẩy pít tông đi xuống" (${R(13, B.f13.hot)}s)`],
      [at(13, "Đây là") - 0.05, `dòng "Đây là hành trình sinh công" sáng xanh lá, số 3 chuyển xanh (${R(13, B.f13.work)}s), dòng phụ "thường gọi là kỳ nổ" (${R(13, B.f13.hedge)}s); ô thứ ba trên thanh nhận nhãn "sinh công"`],
      [R(13, B.f13.n4) - 0.15, `thẻ số 4 "Xả": "Pít tông đi lên" (${R(13, B.f13.up)}s), "Xu páp xả mở" (${R(13, B.f13.valve)}s), "Khí đã cháy bị đẩy ra ngoài" (${R(13, B.f13.spent)}s); khí xám tím thoát ra`],
    ],
    sfx: "pop", at: R(13, B.f13.work),
  },
  {
    scene: "Xi lanh lùi sang trái; bên phải là một biểu đồ sơ lược bốn cột, chỉ cột thứ ba vươn lên là tạo ra sức đẩy, ba cột kia chìm xuống dưới vạch",
    sc: [
      [0, `thẻ "Trong bốn hành trình chỉ có một hành trình sinh công" (${R(14, B.f14.one)}s): cột thứ ba mọc lên, nhãn "tạo ra sức đẩy"`],
      [R(14, B.f14.three) - 0.15, `thẻ "Ba hành trình còn lại không tạo ra sức đẩy" (${R(14, B.f14.noPush)}s), dòng phụ "mà còn tiêu bớt sức" (${at(14, "mà còn")}s): ba cột kia chìm xuống, nhãn "tiêu bớt sức" (${R(14, B.f14.cost)}s)`],
    ],
    sfx: "none",
  },
  {
    scene: "Bốn xi lanh trên cùng một trục khuỷu, một bánh đà ở đầu trục: lửa lần lượt bùng ở từng xi lanh, hai vòng đếm số vòng quay của trục khuỷu",
    sc: [
      [0, `thẻ "Động cơ vẫn quay đều được là nhờ": dòng "Đà quay của bánh đà" (${at(15, "đà quay")}s) kèm dòng phụ "một đĩa kim loại nặng gắn ở một đầu trục khuỷu" (${R(15, B.f15.disc)}s); bánh đà sáng, nhãn "bánh đà"`],
      [at(15, "và nhờ") - 0.05, `dòng "Các xi lanh khác lần lượt tới kỳ nổ của mình": ngọn lửa trên đầu từng xi lanh sáng theo lượt, nhãn "lần lượt tới kỳ nổ" (${R(15, B.f15.turn)}s)`],
      [at(15, "Cứ một") - 0.15, `thẻ "Cứ một chu trình như vậy, trục khuỷu quay được hai vòng" (${R(15, B.f15.two)}s); hai vòng đếm đầy dần, nhãn "một chu trình = hai vòng trục khuỷu"`],
    ],
    sfx: "none",
  },
  {
    scene: "Một xi lanh chạy đều dưới thanh bốn ô; khung của một chu trình công tác, rồi bốn ô, rồi ô sinh công sáng theo câu định nghĩa",
    sc: [
      [0, `bước hai "Gọi đúng tên" bật; thẻ viền tím nhạt "Vậy định nghĩa là"; câu "Động cơ 4 kỳ là loại động cơ mà để hoàn thành một chu trình công tác, pít tông thực hiện 4 hành trình, trong đó có một lần sinh công." hiện mờ sẵn và sáng dần từng chữ theo giọng đọc từ ${R(16, B.f16.def)}s`],
      [R(16, B.f16.cyc), `"một chu trình công tác" và "4 hành trình" chuyển tím nhạt (${R(16, B.f16.four)}s), "một lần sinh công" chuyển xanh lá (${R(16, B.f16.one)}s); trên thanh, khung chu trình sáng, bốn ô sáng lần lượt, rồi chỉ còn ô thứ ba`],
    ],
    sfx: "chime", at: R(16, B.f16.def),
  },
  {
    scene: "Bốn ô lớn đánh số 1 tới 4 chiếm bàn máy: đó là bốn hành trình, không phải bốn lần nổ; chỉ ô thứ ba giữ ngọn lửa",
    sc: [
      [0, `bước ba "Dễ nhầm với" bật; thẻ "Chỗ dễ nhầm": "Nằm ở con số bốn" (${R(17, B.f17.num)}s); bốn ô cùng sáng`],
      [at(17, "Bốn là") - 0.2, `thẻ hai dòng: dấu đúng "Bốn là số hành trình của pít tông" (${R(17, B.f17.is)}s), nhãn "4 hành trình của pít tông" dưới bốn ô; dấu sai "không phải số lần nổ" (${R(17, B.f17.not)}s), bốn ngọn lửa hiện trên bốn ô rồi bị gạch (${R(17, B.f17.bang)}s)`],
      [R(17, B.f17.in4) - 0.15, `thẻ "Trong bốn hành trình ấy chỉ có một lần sinh công" (${R(17, B.f17.one)}s); nhãn xanh "1 lần sinh công" dưới ô thứ ba`],
    ],
    sfx: "none",
  },
  {
    scene: "Bảng hai hàng: động cơ 4 kỳ với bốn ô hành trình, động cơ 2 kỳ với hai ô; hai cột bên phải so số hành trình và số lần sinh công",
    sc: [
      [0, `thẻ "Ngoài động cơ 4 kỳ còn có động cơ 2 kỳ" (${R(18, B.f18.e2)}s): hàng thứ hai của bảng hiện ra`],
      [at(18, "Loại này") - 0.05, `dòng "Làm xong cả chu trình chỉ trong hai hành trình của pít tông" (${R(18, B.f18.two)}s): hai ô của hàng 2 kỳ sáng; dòng "Cũng có một lần sinh công" (${R(18, B.f18.one)}s): nhãn "1 lần sinh công" ở cả hai hàng`],
      [at(18, "Vậy thứ") - 0.15, `thẻ "Thứ phân biệt hai loại": "Số hành trình của một chu trình: bốn hay hai"; cột thứ nhất hiện 4 và 2 (${R(18, B.f18.four)}s, ${R(18, B.f18.twoV)}s), nhãn "khác nhau"`],
      [R(18, B.f18.col2) - 0.15, `thẻ "Số lần sinh công trong một chu trình: ở cả hai loại đều là một"; cột thứ hai hiện 1 và 1 (${R(18, B.f18.oneV)}s), nhãn xanh "giống nhau"`],
    ],
    sfx: "none",
  },
  {
    scene: "Chiếc xe chạy trên đường, ô kính tròn cho thấy xi lanh bên trong; dải năm mắt xích sáng lại lần lượt theo điều ghi nhớ thứ nhất",
    sc: [
      [0, `nhãn mục "Ghi nhớ"; thẻ số 1 "Động cơ biến nhiệt năng thành cơ năng" (${R(19, B.f19.heat)}s, ${R(19, B.f19.work)}s)`],
      [at(19, "làm trục khuỷu") - 0.05, `ba dòng: "làm trục khuỷu quay" (${R(19, B.f19.crank)}s), "Lực được truyền tới các bánh xe chủ động" (${R(19, B.f19.line)}s), "để xe chuyển động tịnh tiến" (${at(19, "để xe")}s); mắt xích và bộ phận tương ứng trên xe sáng theo, cuối cùng là ba mũi tên trên thân xe`],
    ],
    sfx: "none",
  },
  {
    scene: "Bảng hai hàng trở lại, đã đủ số: bốn ô của động cơ 4 kỳ sáng lần lượt theo tên bốn hành trình, rồi tới hàng động cơ 2 kỳ",
    sc: [
      [0, `dòng gọn điều 1 giữ ở trên; thẻ số 2 "Động cơ 4 kỳ": "Một chu trình công tác gồm 4 hành trình của pít tông" (${R(20, B.f20.four)}s), "là nạp, nén, cháy giãn nở và xả" (${R(20, B.f20.nap)}s, bốn ô sáng lần lượt), "Trong đó có một lần sinh công" (${R(20, B.f20.one)}s)`],
      [at(20, "Ba") - 0.2, `thẻ số 3 "Động cơ 2 kỳ": "Một chu trình gồm 2 hành trình" (${R(20, B.f20.two)}s), "Cũng có một lần sinh công" (${R(20, B.f20.one2)}s); ô số tương ứng trên bảng sáng`],
    ],
    sfx: "none",
  },
  {
    scene: "Trở lại xi lanh và bảng ba thứ cần cho sự cháy; cuối khung bộ phận châm lửa được gọi tên rồi mờ thành nét đứt, ô thứ ba của bảng mang dấu hỏi",
    sc: [
      [0, `nhãn mục "Phần sau"; thẻ "Còn một câu hỏi để dành cho phần sau"`],
      [at(21, "Muốn có sự cháy") - 0.15, `thẻ "Muốn có sự cháy thì phải đủ ba thứ"; trên bảng lần lượt hiện "Nhiên liệu" (${R(21, B.f21.fuel)}s), "Không khí" (${R(21, B.f21.air)}s), "Một cách châm lửa" (${R(21, B.f21.spark)}s)`],
      [at(21, "Vậy vì sao") - 0.3, `thẻ "Câu hỏi" hiện từng chữ theo giọng đọc: "Vậy vì sao động cơ diesel không có bugi đánh lửa mà vẫn nổ được?"; trên hình nhãn "bugi đánh lửa" (${R(21, B.f21.plug)}s), rồi bugi mờ thành nét đứt; thẻ câu hỏi nhận viền sáng và giữ tới hết`],
    ],
    sfx: "ping", at: at(21, "Vậy vì sao") - 0.1,
  },
];

const direction = `## Video direction

- **Palette system**
  - Lấy từ frame.md (glass-keynote): mực \`#F5F3FF\`, chữ phụ \`#AEACD6\`, thẻ chàm gần đặc \`#15163A\`, viền lilac \`rgba(196,181,253,0.28)\`.
  - Nền của video là một bàn máy 2D do \`compositions/world.html\` vẽ trên canvas: chiếc xe thân kính, một xi lanh cắt dọc, và các bảng của bài. Các khung chỉ là lớp chữ trong suốt đặt lên trên.
  - Màu có nghĩa cố định trong cả video, ở cả hình lẫn chữ: hổ phách = nhiên liệu; xanh da trời = không khí, khí mới; cam = nhiệt, khí nóng, lửa; xanh lá = chuyển động, lực, sinh công, bánh chủ động; xám tím = khí đã cháy; đỏ = ý sai.
  - Tím nhạt (lilac) là màu nhấn trung tính cho thuật ngữ không thuộc nhóm nào ở trên; không dùng hổ phách để nhấn chung, vì hổ phách là nhiên liệu.
  - Gradient hồng-tím-xanh chỉ dùng cho tên bài ở khung 1.
- **Type**
  - Plus Jakarta Sans 700-800 cho định nghĩa, tên bộ phận và tên hành trình; JetBrains Mono IN HOA giãn 0.14em cho nhãn nhỏ.
  - Font tiếng Việt trong \`assets/fonts/\` (frame.md § Font faces), line-height dòng lớn ≥ 1.1, không cắt chiều dọc hộp chữ.
  - Chữ trên thẻ là lời đọc rút gọn; không thêm ý nào không có trong lời đọc. Nhãn trên hình từ 26 px trở lên.
- **Motion grammar**
  - Bàn máy chạy liên tục theo lời đọc: trục khuỷu, pít tông, xu páp, khí trong xi lanh và bánh xe đều là hàm của thời gian, bộ phận nào được nói tới thì sáng đúng lúc đó.
  - Mỗi ý đi qua ba bước, ghi tên ở đầu cột chữ: "Xem nó làm việc", "Gọi đúng tên", "Dễ nhầm với". Bước đang nói được tô tím, bước đã qua mang dấu tích tím nhạt.
  - Thẻ chữ vào bằng \`power3.out\`; từng dòng trong thẻ trượt nhẹ từ trái vào đúng lúc được đọc. Cụm từ khoá sáng thành ô màu rồi giữ màu của thứ nó gọi tên.
  - Hai câu định nghĩa (khung 8 và 16) hiện mờ sẵn trong thẻ viền tím nhạt và sáng dần từng chữ theo giọng đọc; chữ trên thẻ là nguyên câu định nghĩa.
  - Bốn hành trình và ba điều ghi nhớ giữ đúng số và thứ tự của bài; số được tô tím khi đang đọc, riêng số 3 (hành trình sinh công) chuyển xanh lá. Chuỗi không đánh số trong bài thì dùng hình vẽ hoặc dấu chấm, vẫn đúng thứ tự.
- **Rhythm / held frames**: khung 1 mở bằng một câu hỏi; khung 2-3 là ý lớn; khung 4-7 xem động cơ làm việc từ buồng đốt ra tới mặt đường, khung 8 dừng trên câu định nghĩa, khung 9 đặt động cơ cạnh phanh; khung 10-15 xem bốn hành trình, khung 16 dừng trên câu định nghĩa, khung 17-18 gỡ chỗ nhầm về con số bốn và đặt cạnh động cơ 2 kỳ; khung 19-20 ghi nhớ; khung 21 để lại một câu hỏi, giữ tới hết.
- **Framing variety**: chữ luôn ở cột trái (x 64-620, từ y 104, hoặc y 156 khi có ba bước); bàn máy bên phải đổi hình theo nội dung: cả chiếc xe, cận cảnh một xi lanh, xi lanh cạnh chân người đạp xe, xi lanh cạnh bánh xe có phanh, biểu đồ sức đẩy, bốn xi lanh với bánh đà, bốn ô lớn, bảng so 4 kỳ với 2 kỳ. Dải trên cùng của bàn máy dành cho chuỗi năm mắt xích hoặc thanh bốn hành trình.
- **Caption keep-out**
  - Phụ đề nằm ở ~17% dưới cùng (y > 896); mọi thẻ chữ kết thúc trên y 880.
  - Khung không có nền riêng; nền là bàn máy ở lớp dưới cùng của index.
- **Language + Negative list**
  - Mọi chữ trên hình là tiếng Việt.
  - Video đứng một mình: không lời hay chữ nào nhắc tới số câu hỏi, kỳ kiểm tra hay tài liệu nguồn; không ghi số thứ tự bài.
  - Con số của bài giữ nguyên: 4 hành trình, 2 hành trình, một lần sinh công, hai vòng trục khuỷu. Không thêm con số nào khác: không dung tích, không vòng tua, không nhiệt độ, không tỉ số nén.
  - Không thêm kiến thức ngoài bài: bộ phận châm lửa không mang tên cho tới khung 21, nơi lời đọc tự gọi "bugi đánh lửa"; các bộ phận của đường truyền lực không được gọi tên riêng; hai ô của động cơ 2 kỳ không ghi tên việc.
  - Các lời rào đón được giữ trên hình: "thường gọi là kỳ nổ".
  - Dấu đúng xanh và dấu sai đỏ chỉ dùng ở khung 17.
  - Không dữ liệu cá nhân, token hay đường dẫn riêng.
  - Không \`repeat\`/\`yoyo\`/\`Math.random\`/\`@keyframes\`.
  - Cấm cả hai kiểu hỏng: "slideshow" (hiện hết trong 25% đầu rồi đứng im) và "screensaver" (nhiều thứ trôi lung tung).
`;

writeStoryboard({
  title: "Động cơ: nơi nhiên liệu biến thành chuyển động (phần 1)",
  music: "warm, curious instrumental underscore, soft muted electric piano and marimba over gentle analog pads, a light steady pulse like a slowly turning flywheel, unobtrusive",
  direction,
  frames: F,
});
