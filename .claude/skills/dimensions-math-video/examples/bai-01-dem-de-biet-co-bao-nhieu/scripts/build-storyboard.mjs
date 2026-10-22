// What only this lesson knows about its storyboard: the scene of each frame, its sound, and the video
// direction. storyboard.lib.mjs adds the narration and the timings and writes STORYBOARD.md.
//   node scripts/build-storyboard.mjs
import { B, rel } from "./frames.ctx.mjs";
import { writeStoryboard } from "./storyboard.lib.mjs";

const R = (n, abs) => rel(n, abs);
const { f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15, f16, f17, f18, f19, f20, f21, f22, f23 } = B;
const list = (n, ts) => ts.map((t) => `${R(n, t)}s`).join(", ");

// per frame: scene (one line), sc: [start, text] phases, sfx + at (seconds in the frame)
const F = [
  {
    scene: "Vườn thú buổi sáng: trời xanh nhạt, đồi cỏ, hai cây lớn; sáu con khỉ nhảy nhót khắp hình",
    sc: [
      [0, "nền vườn thú, mây trôi chậm"],
      [R(1, f1.monkeys) - 0.1, `sáu con khỉ bật ra lần lượt ở các chỗ khác nhau, trên cây và dưới cỏ, nhún nhảy liên tục`],
      [R(1, f1.ask), `bong bóng lời nói có dấu "?" bật ra giữa trời, giữ tới khi trẻ được mời thử đếm`],
    ],
    sfx: "pop", at: R(1, f1.monkeys),
  },
  {
    scene: "Vẫn đàn khỉ; một bàn tay trẻ con từ dưới đưa lên",
    sc: [
      [0, "khỉ dịu lại, đứng yên chỗ cũ; bong bóng \"?\" mờ đi"],
      [R(2, f2.count) - 0.5, `bàn tay đưa lên, ngón trỏ chạm một con khỉ (${R(2, f2.each)}s): gợn sóng xanh ngọc và vòng xanh ngọc khoanh con khỉ`],
      [R(2, f2.one), "một bong bóng lời nói không có chữ, chỉ có sóng âm, bật ra trên con khỉ đó: chạm một con, nói một tiếng"],
    ],
    sfx: "click", at: R(2, f2.each),
  },
  {
    scene: "Ba con ngựa vằn đứng thành hàng trên đồng cỏ",
    sc: [
      [0, `ba con ngựa vằn bật ra (${R(3, f3.zebra)}s)`],
      [R(3, f3.p1) - 0.8, `bàn tay chỉ con thứ nhất (${R(3, f3.p1)}s), rồi bong bóng và vòng xanh ngọc khi nói "một"; lặp lại với con thứ hai và thứ ba (${list(3, [f3.c1, f3.c2, f3.c3])})`],
      [R(3, f3.none), `ba vòng nhịp nhẹ lần lượt: không còn con nào; dấu tích xanh khi đếm xong (${R(3, f3.done)}s)`],
    ],
    sfx: "chime", at: R(3, f3.done),
  },
  {
    scene: "Ba con ngựa vằn; đếm lại, tay và tiếng đi cùng lúc",
    sc: [
      [0, "các vòng cũ mờ đi"],
      [R(4, f4.together), `mỗi lần chạm có ngay một bong bóng và một vòng, đúng cùng lúc (${list(4, [f4.together, f4.oneA, f4.oneB])})`],
      [R(4, f4.each), "ba bộ vòng và bong bóng nhịp theo \"cũng\", \"chỉ đếm\", \"một lần\""],
    ],
    sfx: "none",
  },
  {
    scene: "Ba con ngựa vằn; bàn tay nhảy cóc qua con giữa",
    sc: [
      [0, "đếm lại từ đầu"],
      [R(5, f5.c1) - 1, `chạm con đầu (${R(5, f5.c1)}s), rồi tay vòng cao qua con giữa sang chạm con cuối (${R(5, f5.c2)}s)`],
      [R(5, f5.short), "con giữa nhận vòng hổ phách đứt nét và huy hiệu \"?\": bị bỏ sót, nên thiếu"],
    ],
    sfx: "ping", at: R(5, f5.short),
  },
  {
    scene: "Ba con ngựa vằn; con giữa bị chạm hai lần",
    sc: [
      [0, "đếm lại từ đầu"],
      [R(6, f6.c[0]) - 1, `bốn lần chạm cho ba con (${list(6, f6.c)}); lần chạm thứ hai vào con giữa có vòng lớn màu đỏ và một bong bóng thứ hai lệch lên trên`],
      [R(6, f6.extra), "vòng đỏ và bong bóng thừa nhịp mạnh, viền bong bóng chuyển đỏ: thành ra thừa"],
    ],
    sfx: "ping", at: R(6, f6.extra),
  },
  {
    scene: "Ba con ngựa vằn; miệng đếm nhanh hơn tay",
    sc: [
      [0, "đếm lại từ đầu"],
      [R(7, f7.notyet) - 1, `năm bong bóng bật ra thành một hàng phía trên (${list(7, f7.c)}), trong khi bàn tay chậm chạp mới chạm được ba con`],
      [R(7, f7.wrong), "hai bong bóng cuối viền đỏ và bị gạch chéo đỏ"],
      [R(7, f7.each), `một bàn tay mới đếm lại đúng: chạm, vòng và bong bóng cùng lúc ở "đếm đi" (${R(7, f7.go)}s), "đúng" (${R(7, f7.exact)}s), "lần" (${R(7, f7.once)}s)`],
    ],
    sfx: "ping", at: R(7, f7.wrong),
  },
  {
    scene: "Sáu con khỉ xếp một hàng ngang trên đồng cỏ",
    sc: [
      [0, "sáu con khỉ bật ra lần lượt từ trái sang phải"],
      [R(8, f8.c[0]) - 1, `bàn tay chạm từng con, mỗi lần một vòng xanh ngọc và một bong bóng (${list(8, f8.c)}); bong bóng cũ mờ khi con sau được đếm, bong bóng thứ sáu ở lại`],
    ],
    sfx: "none",
  },
  {
    scene: "Sáu con khỉ đã khoanh vòng; bong bóng cuối cùng đổi vai",
    sc: [
      [0, `bong bóng thứ sáu nhịp ở "sáu" (${R(9, f9.six)}s)`],
      [R(9, f9.but), `bong bóng bay xuống dưới con khỉ thứ sáu như một thẻ tên (${R(9, f9.name)}s); dấu gạch đỏ hiện lên trên thẻ (${R(9, f9.that)}s): sáu không phải tên con khỉ ấy`],
      [R(9, f9.is), "dấu gạch tan đi, bong bóng bay lên giữa và phóng to; một vòng xanh lớn khoanh cả đàn"],
      [R(9, f9.upto), "sáu vòng nhỏ nhịp lần lượt từ trái sang phải, vòng lớn nhịp ở \"có sáu\""],
    ],
    sfx: "whoosh-short", at: R(9, f9.is),
  },
  {
    scene: "Vẫn đàn khỉ trong vòng lớn; câu hỏi lặp lại",
    sc: [
      [0, `bong bóng "?" ở góc trái trên (${R(10, f10.ask)}s)`],
      [R(10, f10.no), "một bàn tay mờ quay lại chạm con khỉ đầu rồi lắc ngang, dấu gạch đỏ dưới bàn tay: không cần đếm lại"],
      [R(10, f10.last), "vòng con khỉ thứ sáu và bong bóng lớn nhịp; vòng lớn nhịp ở \"cả nhóm\""],
      [R(10, f10.has), "dấu tích xanh thay cho bong bóng \"?\""],
    ],
    sfx: "chime", at: R(10, f10.has),
  },
  {
    scene: "Một con voi thật to bên trái, một con kiến bé xíu bên phải, kèm kính lúp phóng to con kiến",
    sc: [
      [0, `voi bật ra (${R(11, f11.el)}s), phồng nhẹ ở "rất to"; kiến bật ra (${R(11, f11.ant)}s), kính lúp mở ra cho thấy rõ con kiến`],
      [R(11, f11.elOne) - 0.9, `bàn tay chạm con voi rồi con kiến; mỗi con một vòng xanh và một bong bóng giống hệt nhau (${list(11, [f11.elOne, f11.antOne])})`],
      [R(11, f11.both), "bong bóng của kiến bay lên ngang bong bóng của voi: hai bong bóng như nhau, to hay nhỏ đều là một; hai vòng nhịp ở \"đếm không\""],
    ],
    sfx: "pop", at: R(11, f11.el),
  },
  {
    scene: "Trong phòng có cửa sổ: bốn quả cam trên bàn gỗ và một tấm lót xanh ngọc nhạt",
    sc: [
      [0, `bốn quả cam bật ra ở bên trái (${R(12, f12.oranges)}s); tấm lót hiện ra bên phải (${R(12, f12.push)}s)`],
      [R(12, f12.side) - 0.5, `ngón tay gạt từng quả sang tấm lót, mỗi quả vào một ô, có vòng và bong bóng (${list(12, f12.c)})`],
      [R(12, f12.done), "tấm lót nhịp, dấu tích xanh: quả nào đếm rồi đã nằm riêng"],
    ],
    sfx: "chime", at: R(12, f12.done),
  },
  {
    scene: "Một tờ tranh in mười hạt lạc rải lung tung trên mặt bàn",
    sc: [
      [0, "tờ tranh nằm trên bàn, các hạt lạc hiện ra"],
      [R(13, f13.push), "bàn tay thử gạt một hạt: hạt chỉ rung tại chỗ, không đi đâu được"],
      [R(13, f13.messy), "bút chì vẽ một đường đứt nét đi lung tung giữa các hạt, mỗi hạt đi qua có vòng xanh"],
      [R(13, f13.miss), "một hạt bị bỏ qua nhận vòng hổ phách đứt nét và huy hiệu \"?\"; đường đi quay lại một hạt đã đếm, hạt ấy nhận vòng đỏ"],
    ],
    sfx: "ping", at: R(13, f13.miss),
  },
  {
    scene: "Hai tờ tranh cạnh nhau: bên trái chín hạt lạc xếp ba hàng, bên phải tám hạt rải rác",
    sc: [
      [0, "hai tờ tranh hiện ra, hạt lạc bật lên"],
      [R(14, f14.lr), `bên trái: chấm xanh ngọc chạy dọc từng hàng từ trái sang phải, hết hàng thì quay xuống hàng dưới (${R(14, f14.down)}s); biểu tượng quyển sách mở (${R(14, f14.book)}s)`],
      [R(14, f14.second), "tờ trái mờ đi, tờ phải sáng lên; bút chì gạch một nét lên từng hạt đã đếm"],
    ],
    sfx: "none",
  },
  {
    scene: "Một tờ tranh: chín hạt lạc xếp hình thoi 1-2-3-2-1",
    sc: [
      [0, `chín hạt bật ra (${R(15, f15.nuts)}s); đường viền hình thoi đứt nét hiện lên rồi tan (${R(15, f15.diamond)}s)`],
      [R(15, f15.top), `mũi tên đi xuống ở mép trái, rồi mỗi hàng một mũi tên nhỏ từ trái sang phải (${R(15, f15.lr)}s)`],
      [R(15, f15.mark), "bút chì đi vào, sẵn sàng đánh dấu"],
    ],
    sfx: "pop", at: R(15, f15.nuts),
  },
  {
    scene: "Hình thoi hạt lạc, đếm từ trên xuống",
    sc: [
      [0, `bút chì gạch từng hạt theo từng hàng, mỗi hạt một bong bóng nhỏ (${list(16, f16.c)})`],
      [R(16, f16.got), "vòng xanh lớn khoanh cả chín hạt, bong bóng cuối bay lên đỉnh vòng"],
    ],
    sfx: "chime", at: R(16, f16.got),
  },
  {
    scene: "Hai hình thoi cạnh nhau: bên trái đã đếm từ trên xuống, bên phải đếm từ dưới lên",
    sc: [
      [0, `tờ tranh trái thu nhỏ sang trái (${R(17, f17.if)}s), tờ tranh phải hiện ra với mũi tên đi lên (${R(17, f17.up)}s)`],
      [R(17, f17.c[0]) - 0.2, `bút chì khoanh vòng xanh từng hạt từ hàng dưới lên (${list(17, f17.c)})`],
      [R(17, f17.still), "vòng lớn khoanh hình phải; hai bong bóng cuối nhịp cùng lúc ở \"chín hạt\", hai vòng lớn nhịp ở \"cùng một\", các dấu nhịp lần lượt ở \"mỗi hạt\""],
    ],
    sfx: "chime", at: R(17, f17.same),
  },
  {
    scene: "Bảy con sư tử xếp hai hàng (4 và 3) bên trái; một tấm thẻ giấy kẻ ô bên phải",
    sc: [
      [0, `tấm thẻ giấy trắng bật ra bên phải (${R(18, f18.digits)}s); bảy con sư tử bật ra (${R(18, f18.lions)}s)`],
      [R(18, f18.c[0]) - 1, `bàn tay chạm từng con, vòng và bong bóng theo từng tiếng (${list(18, f18.c)}); bong bóng thứ bảy ở lại`],
    ],
    sfx: "none",
  },
  {
    scene: "Bảy con sư tử trong vòng lớn; bút chì viết chữ số bảy lên thẻ",
    sc: [
      [0, "vòng lớn khoanh cả bảy con, bong bóng cuối bay lên đỉnh vòng"],
      [R(19, f19.write), "bút chì viết chữ số 7 màu tím lên tấm thẻ, nét đi đúng chiều viết, chậm và rõ"],
    ],
    sfx: "click", at: R(19, f19.write),
  },
  {
    scene: "Ba ô đứng cạnh nhau: nhóm sư tử, bong bóng tiếng đọc, chữ số 7",
    sc: [
      [0, "nhóm sư tử thu vào ô trái, bong bóng phóng to vào ô giữa, tấm thẻ số 7 vào ô phải"],
      [R(20, f20.group), `từng ô sáng viền xanh ngọc đúng lúc được nhắc: nhóm (${R(20, f20.group)}s), tiếng đọc (${R(20, f20.say)}s), chữ số (${R(20, f20.digit)}s)`],
      [R(20, f20.that), "một vòng đứt nét xanh ngọc khoanh cả ba ô; cả ba nhịp cùng lúc ở \"số lượng\""],
    ],
    sfx: "whoosh-short", at: R(20, f20.that),
  },
  {
    scene: "Năm chuồng thú xếp hàng, mỗi chuồng có một tấm bảng nhỏ ở trên",
    sc: [
      [0, "hàng chuồng trượt vào từ bên phải"],
      [R(21, f21.n[0]), `khi gọi tên chuồng nào, chuồng ấy sáng viền, bảng của nó được viết chữ số, các con thú bật ra: 1 hươu cao cổ, 2 voi, 3 ngựa vằn, 4 hổ, 5 cá sấu (${list(21, f21.n)})`],
    ],
    sfx: "whoosh-short", at: 0.2,
  },
  {
    scene: "Năm chuồng tiếp theo",
    sc: [
      [0, "hàng chuồng đầu trượt sang trái, hàng mới trượt vào"],
      [R(22, f22.n[0]), `6 khỉ, 7 sư tử, 8 gấu, 9 khỉ đột, 10 rắn, viết số và bật thú theo từng tên (${list(22, f22.n)})`],
      [R(22, B.E(22)) - 1.4, "cả hai hàng thu nhỏ, xếp chồng thành bức tranh vườn thú từ 1 đến 10"],
    ],
    sfx: "none",
  },
  {
    scene: "Sáu con khỉ xếp hai hàng; cả bốn ý của bài diễn lại một lần",
    sc: [
      [0, `sáu con khỉ bật ra; bong bóng "?" (${R(23, f23.many)}s)`],
      [R(23, f23.count) - 0.3, `bàn tay chạm nhanh từng con, mỗi con một vòng (${R(23, f23.each)}s trở đi)`],
      [R(23, f23.last), "bong bóng \"?\" thành bong bóng sóng âm, vòng lớn khoanh cả nhóm"],
      [R(23, f23.that) - 0.4, `tấm thẻ hiện ra bên phải, mũi tên đứt nét từ bong bóng sang thẻ; bút chì viết chữ số 6 (${R(23, f23.write)}s)`],
      [R(23, f23.good), "pháo sao nhiều màu bung lên từ nhóm khỉ và tấm thẻ"],
    ],
    sfx: "chime", at: R(23, f23.good),
  },
];

const direction = `## Video direction

- **Palette system**
  - Nền giấy kem \`#FBF6EA\`; ba nơi chốn vẽ trên canvas: vườn thú (trời xanh nhạt, đồi cỏ \`#D7E8C2\`), căn phòng có bàn gỗ, mặt bàn có tờ tranh in.
  - Mực \`#3B3355\`. Màu chỉ mang nghĩa: xanh ngọc \`#0EA5A0\` = đã đếm đúng; hổ phách \`#F59E0B\` = bị sót; đỏ \`#E5484D\` = thừa hoặc sai; tím \`#6D28D9\` chỉ dành cho chữ số.
- **Type**
  - Không có chữ trên hình và không có phụ đề: trẻ chưa biết đọc. Ký tự duy nhất là chữ số (từ khung 18) và dấu "?".
  - Chữ số được viết từng nét bằng bút chì, nét to, màu tím.
- **Motion grammar**
  - Một bàn tay trẻ con làm việc đếm: mỗi lần chạm để lại gợn sóng và một vòng xanh ngọc vẽ quanh vật được đếm.
  - Mỗi tiếng đếm là một bong bóng lời nói không có chữ, chỉ có sóng âm. Bong bóng của số cuối cùng lớn lên thành số của cả nhóm, và một vòng lớn khoanh cả nhóm.
  - Lỗi được diễn ra, không nói suông: sót = vòng hổ phách đứt nét và "?"; đếm hai lần = vòng đỏ và bong bóng thừa; miệng nhanh hơn tay = nhiều bong bóng hơn số lần chạm.
  - Con vật nhún nhẹ liên tục, không đứng im; mọi chuyển động là hàm của thời gian, tua đi đâu cũng ra cùng một hình.
- **Rhythm / held frames**: khung 1-2 đặt câu hỏi và cách trả lời; khung 3-7 là ba con ngựa vằn, đếm đúng rồi ba kiểu sai; khung 8-10 là đàn khỉ và ý số cuối cùng; khung 11 voi và kiến; khung 12-17 là đồ vật thật và tranh; khung 18-20 là chữ số; khung 21-22 vườn thú 1-10; khung 23 nhắc lại và giữ tới hết.
- **Framing variety**: vườn thú rộng, hàng ngang, một cặp to nhỏ có kính lúp, mặt bàn trong phòng, tờ tranh nhìn từ trên xuống, hai tờ tranh cạnh nhau, ba ô, dãy chuồng.
- **Caption keep-out**: không có phụ đề, nên không cần chừa vùng dưới; bàn tay vẫn đi vào từ mép dưới.
- **Language + Negative list**
  - Không dấu cộng, trừ, lớn hơn, bé hơn, bằng; không khung mười ô; không đường nối đứt nét giữa các ô có thể đọc thành dấu trừ hay dấu bằng.
  - Không chữ số trước khung 18; không nhắc sách hay tài liệu nguồn.
  - Không dữ liệu cá nhân; không \`repeat\`/\`yoyo\`/\`Math.random\`/\`@keyframes\`.
`;

writeStoryboard({
  title: "Đếm để biết có bao nhiêu",
  music: "gentle playful instrumental for a counting lesson for six-year-old children at a sunny zoo: soft music box, warm marimba and light pizzicato strings, a slow even bouncy pulse, happy and calm, no vocals",
  direction,
  frames: F,
});
