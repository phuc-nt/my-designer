// What only this lesson knows about its storyboard: the scene of each frame, its sound, and the video
// direction. storyboard.lib.mjs adds the narration and the timings and writes STORYBOARD.md.
//   node scripts/build-storyboard.mjs
import { B, rel } from "./frames.ctx.mjs";
import { writeStoryboard } from "./storyboard.lib.mjs";

const R = (n, abs) => rel(n, abs);
const { f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15 } = B;
const { f16, f17, f18, f19, f20, f21, f22, f23, f24, f25, f26, f27, f28, f29, f30 } = B;
const list = (n, ts) => ts.map((t) => `${R(n, t)}s`).join(", ");

// per frame: scene (one line), sc: [start, text] phases, sfx + at (seconds in the frame)
const F = [
  {
    scene: "Mặt bàn giấy kem; giữa hình một khung mười ô có bảy chấm, bị tấm che nâu đậy kín",
    sc: [
      [R(1, f1.frame), "khung và tấm che bật ra giữa bàn"],
      [R(1, f1.lookEnd), "tấm che nhấc lên chừng một giây rưỡi cho thấy bảy chấm xanh lam (năm hàng trên, hai hàng dưới) rồi đóng lại"],
      [R(1, f1.lookEnd) + 1.7, "bong bóng \"?\" bật ra phía trên khung"],
    ],
    sfx: "pop", at: R(1, f1.frame),
  },
  {
    scene: "Khung còn che thu nhỏ lên góc phải trên; một khung mười ô trống hiện giữa bàn",
    sc: [
      [R(2, f2.name), "bong bóng \"?\" tan; khung có tấm che thu nhỏ, đặt lên góc phải trên, chờ tới cuối bài"],
      [R(2, f2.ten), "khung mười ô trống bật ra giữa bàn; nhịp nhẹ ở \"biết ngay\""],
    ],
    sfx: "pop", at: R(2, f2.ten),
  },
  {
    scene: "Khung trống; bàn tay đếm năm ô hàng trên",
    sc: [
      [R(3, f3.row), "hàng trên sáng xanh ngọc nhạt"],
      [R(3, f3.c[0]) - 0.6, `bàn tay chạm từng ô hàng trên, mỗi ô một vòng xanh ngọc và một bong bóng không chữ phía trên khung (${list(3, f3.c)})`],
      [R(3, f3.five), "bút chì viết chữ số 5 màu tím bên phải hàng trên"],
    ],
    sfx: "click", at: R(3, f3.c[0]),
  },
  {
    scene: "Khung trống; bàn tay đếm năm ô hàng dưới; các đường chấm nối hai ô cùng cột",
    sc: [
      [0, "hàng dưới sáng xanh ngọc nhạt"],
      [R(4, f4.c[0]) - 0.6, `bàn tay chạm từng ô hàng dưới, vòng và bong bóng (${list(4, f4.c)}); bút chì viết 5 bên phải hàng dưới (${R(4, f4.five)}s)`],
      [R(4, f4.pair), "năm đường chấm dọc lần lượt nối mỗi ô hàng trên với ô ngay bên dưới, nhịp ở \"ngay bên dưới\""],
    ],
    sfx: "none",
  },
  {
    scene: "Khung trống; bàn tay đếm cả mười ô",
    sc: [
      [R(5, f5.ask), `bàn tay chạm lần lượt mười ô, hàng trên rồi hàng dưới, mỗi ô một vòng và một bong bóng (${list(5, f5.c)})`],
      [R(5, f5.all), "một vòng xanh ngọc ôm cả khung"],
      [R(5, f5.ten), "bút chì viết 10 dưới khung"],
    ],
    sfx: "chime", at: R(5, f5.all),
  },
  {
    scene: "Khung trống với 5, 5 bên phải và 10 bên dưới",
    sc: [
      [R(6, f6.two), "hai vòng nhỏ ôm từng hàng"],
      [R(6, f6.each), "hai vòng hàng và hai chữ số 5 nhịp lần lượt"],
      [R(6, f6.all), "vòng lớn và chữ số 10 nhịp"],
    ],
    sfx: "none",
  },
  {
    scene: "Vườn thú: bảy con sư tử (bốn trên, ba dưới) bên trái, khung mười ô trống bên phải",
    sc: [
      [R(7, f7.lions), "bảy con sư tử bật ra lần lượt"],
      [R(7, f7.frame), "khung mười ô bật ra bên phải"],
      [R(7, f7.left), "ô trái của hàng trên sáng xanh lam, có vòng đứt nét: chỗ của chấm đầu tiên"],
    ],
    sfx: "pop", at: R(7, f7.lions),
  },
  {
    scene: "Đếm sư tử, mỗi con một chấm bay vào khung",
    sc: [
      [R(8, f8.c[0]) - 0.9, `bàn tay chạm từng con sư tử: vòng xanh ngọc, bong bóng, và một chấm xanh lam bay từ con ấy vào ô kế tiếp của khung (${list(8, f8.c)})`],
      [R(8, f8.full), "hàng trên đầy: cả hàng sáng xanh ngọc và có vòng; mũi tên đứt nét từ cuối hàng trên xuống đầu hàng dưới"],
    ],
    sfx: "click", at: R(8, f8.c[0]),
  },
  {
    scene: "Bảy con sư tử có vòng; khung bảy chấm",
    sc: [
      [R(9, f9.each), "từng con sư tử và chấm của nó nhịp lần lượt"],
      [R(9, f9.top), "vòng hàng trên nhịp; rồi vòng nhỏ ôm hai chấm hàng dưới"],
    ],
    sfx: "none",
  },
  {
    scene: "Bốn ô cạnh nhau: nhóm sư tử, bong bóng tiếng đọc, chữ số 7, khung bảy chấm",
    sc: [
      [0, "nhóm sư tử thu vào ô thứ nhất, bong bóng cuối bay vào ô thứ hai, khung thu vào ô thứ tư"],
      [R(10, f10.group), `từng ô sáng viền xanh ngọc đúng lúc được nhắc: nhóm, tiếng đọc, chữ số (bút chì viết 7 lên thẻ, ${R(10, f10.digit)}s), khung`],
      [R(10, f10.that), "vòng đứt nét xanh ngọc ôm cả bốn ô; cả bốn nhịp ở \"số lượng\""],
    ],
    sfx: "whoosh-short", at: R(10, f10.that),
  },
  {
    scene: "Khung trống giữa bàn; một bàn tay mờ đặt chấm lung tung",
    sc: [
      [R(11, f11.bottom), "bàn tay mờ màu tím xám đặt chấm đầu tiên vào hàng dưới"],
      [R(11, f11.alt), "rồi đặt xen kẽ trên, dưới, trên, dưới: bảy chấm thành một hình lạ"],
    ],
    sfx: "ping", at: R(11, f11.bottom),
  },
  {
    scene: "Bảy chấm lung tung; phải đếm lại từng chấm",
    sc: [
      [R(12, f12.still), "bảy chấm nhịp nhẹ"],
      [R(12, f12.odd), "huy hiệu \"?\" hổ phách ở góc khung: nhìn không biết ngay"],
      [R(12, f12.c[0]) - 0.4, `bàn tay đếm nhanh từng chấm, mỗi chấm một vòng và một bong bóng (${list(12, f12.c)})`],
    ],
    sfx: "ping", at: R(12, f12.odd),
  },
  {
    scene: "Bảy chấm trượt về đúng chỗ",
    sc: [
      [R(13, f13.top), "mũi tên từ trái sang phải phía trên khung; các chấm ở hàng dưới lần lượt trượt lên lấp đầy hàng trên, từ trái sang phải"],
      [R(13, f13.see), "vòng ôm hàng trên đầy; bong bóng mang chữ số 7 bên phải khung"],
    ],
    sfx: "whoosh-short", at: R(13, f13.top),
  },
  {
    scene: "Năm khung nhỏ hiện lần lượt ở hàng trên của hình: 1 đến 5 chấm",
    sc: [
      [R(14, f14.c[0]) - 0.35, `mỗi khung nhỏ bật ra đúng lúc gọi số, chấm vào khung và bút viết chữ số bên dưới (${list(14, f14.c)})`],
      [R(14, f14.notFull), "các ô còn trống của hàng trên ở khung 1–4 sáng hổ phách nhạt: hàng trên chưa đầy"],
      [R(14, f14.row), "khung 5 có hàng trên sáng xanh ngọc và có vòng: đúng một hàng đầy"],
    ],
    sfx: "pop", at: R(14, f14.c[0]),
  },
  {
    scene: "Năm khung nhỏ nữa ở hàng dưới của hình: 6 đến 10 chấm",
    sc: [
      [R(15, f15.c[0]) - 0.35, `khung 6, 7, 8 bật ra với số của nó (${list(15, f15.c.slice(0, 3))}); hàng trên của chúng sáng xanh ngọc, chấm hàng dưới nhịp ở "thêm chấm"`],
      [R(15, f15.c[3]), "khung 9: ô trống cuối cùng có vòng bút chì đứt nét"],
      [R(15, f15.c[4]), "khung 10: một vòng xanh ngọc ôm cả khung đầy"],
    ],
    sfx: "chime", at: R(15, f15.full),
  },
  {
    scene: "Khung tám chấm; bàn tay mờ đếm lại từ một",
    sc: [
      [0, "khung tám chấm bật ra; bong bóng \"?\" bên phải"],
      [R(16, f16.c[0]) - 0.4, `bàn tay mờ chạm ô một, hai, ba (${list(16, f16.c)}), vòng mờ`],
      [R(16, f16.slow), "bàn tay mờ lắc ngang và có dấu gạch đỏ: đếm lại từ một thì chậm lắm"],
    ],
    sfx: "ping", at: R(16, f16.slow),
  },
  {
    scene: "Khung tám chấm; hàng trên đầy là năm, đếm tiếp",
    sc: [
      [R(17, f17.top), "bàn tay thật lướt cả hàng trên; vòng ôm hàng trên đầy"],
      [R(17, f17.five), "bong bóng mang chữ số 5 ở bên trái hàng trên"],
      [R(17, f17.c[0]), `bàn tay chạm sáu, bảy, tám ở hàng dưới, mỗi chấm một vòng và một bong bóng (${list(17, f17.c)})`],
      [R(17, f17.has), "thẻ giấy bật ra bên phải, bút chì viết 8"],
    ],
    sfx: "chime", at: R(17, f17.has),
  },
  {
    scene: "Trò nhìn nhanh: khung năm chấm dưới tấm che",
    sc: [
      [R(18, f18.game), "khung và tấm che bật ra"],
      [R(18, f18.lookEnd), "tấm che nhấc lên chừng một giây rưỡi rồi đóng lại"],
      [R(18, f18.lookEnd) + 1.6, "bong bóng \"?\" phía trên"],
    ],
    sfx: "pop", at: R(18, f18.game),
  },
  {
    scene: "Tấm che mở hẳn: năm chấm; rồi khung thứ hai, chín chấm dưới tấm che",
    sc: [
      [R(19, f19.five), "tấm che bay đi: năm chấm, bong bóng đổi thành chữ số 5; vòng ôm hàng trên đầy"],
      [R(19, f19.next), "khung năm chấm trượt ra bên trái, khung mới có tấm che trượt vào từ bên phải"],
      [R(19, f19.lookEnd), "tấm che nhấc lên chừng một giây rưỡi rồi đóng lại; bong bóng \"?\""],
    ],
    sfx: "whoosh-short", at: R(19, f19.next),
  },
  {
    scene: "Tấm che mở hẳn: chín chấm",
    sc: [
      [R(20, f20.nine), "tấm che bay đi: chín chấm, bong bóng đổi thành chữ số 9"],
      [R(20, f20.empty), "ô trống cuối có vòng bút chì đứt nét; vòng ôm cả khung ở \"đầy khung\""],
      [R(20, f20.good), "pháo sao bung lên hai bên khung"],
    ],
    sfx: "chime", at: R(20, f20.good),
  },
  {
    scene: "Khung bảy chấm ở trên; bàn tay đếm ba ô trống",
    sc: [
      [R(21, f21.empty), "ba ô trống có vòng bút chì đứt nét"],
      [R(21, f21.c[0]) - 0.5, `bàn tay chạm từng ô trống, mỗi ô một vòng xanh ngọc và một bong bóng (${list(21, f21.c)})`],
    ],
    sfx: "click", at: R(21, f21.c[0]),
  },
  {
    scene: "Khung bảy chấm; mười ô sáng lần lượt",
    sc: [
      [R(22, f22.still), "ba ô trống nhịp: vẫn là ô của khung"],
      [R(22, f22.c[0]), `từng ô sáng xanh ngọc nhạt theo tiếng đếm, có chấm hay không cũng sáng; bong bóng bên phải nhịp theo từng tiếng rồi mang số 10 (${list(22, f22.c)})`],
    ],
    sfx: "chime", at: R(22, f22.c[9]) + 0.15,
  },
  {
    scene: "Khung bảy chấm: một vòng ôm bảy chấm, một vòng ôm ba ô trống, một vòng ôm cả khung",
    sc: [
      [R(23, f23.dots), "vòng xanh ngọc ôm bảy chấm"],
      [R(23, f23.empty), "vòng bút chì đứt nét ôm ba ô trống"],
      [R(23, f23.all), "vòng lớn ôm cả khung, nhịp ở \"mười ô\""],
    ],
    sfx: "whoosh-short", at: R(23, f23.all),
  },
  {
    scene: "Thanh mười khối hiện dưới khung: bảy khối xanh lam, ba khối trắng",
    sc: [
      [R(24, f24.bar), "mười khối bật ra lần lượt dưới khung, khối nào nằm dưới ô nấy"],
      [R(24, f24.blue), "bảy khối xanh nhịp; rồi ba khối trắng nhịp"],
      [R(24, f24.all), "vòng xanh ngọc ôm cả thanh"],
    ],
    sfx: "pop", at: R(24, f24.bar),
  },
  {
    scene: "Khung và thanh cùng thêm chấm: 8, 9, 10",
    sc: [
      [R(25, f25.eight), "chấm thứ tám bật vào khung, khối thứ tám đổi xanh; hai ô trống có vòng bút chì"],
      [R(25, f25.nine), "chấm thứ chín, khối thứ chín; còn một ô trống có vòng"],
      [R(25, f25.ten), "chấm thứ mười, khối thứ mười; vòng ôm cả khung ở \"không còn\""],
      [R(25, f25.more), "chấm nhịp ở \"càng nhiều\", vòng và thanh nhịp ở \"càng ít\""],
    ],
    sfx: "chime", at: R(25, f25.ten),
  },
  {
    scene: "Khung sáu chấm; bàn tay đếm nhầm vào bốn ô trống",
    sc: [
      [R(26, f26.ask), "khung sáu chấm; bong bóng \"?\" bên phải"],
      [R(26, f26.c[0]) - 0.4, `bàn tay chạm bốn ô trống, vòng đỏ và bong bóng (${list(26, f26.c)})`],
      [R(26, f26.not), "bốn dấu gạch đỏ trên bốn ô trống, bàn tay lắc ngang: đó là số ô trống, không phải số chấm"],
    ],
    sfx: "ping", at: R(26, f26.not),
  },
  {
    scene: "Khung sáu chấm; chỉ chạm vào chấm",
    sc: [
      [R(27, f27.touch), "vòng đỏ và dấu gạch tan; bàn tay thật chạm chấm đầu; các ô trống xám nhạt: không chạm"],
      [R(27, f27.top), "bàn tay lướt hàng trên; vòng hàng trên và bong bóng chữ số 5"],
      [R(27, f27.six), "chạm chấm thứ sáu: vòng và bong bóng; bong bóng \"?\" đổi thành chữ số 6"],
    ],
    sfx: "chime", at: R(27, f27.has),
  },
  {
    scene: "Khung trống; nhắc lại cách điền",
    sc: [
      [R(28, f28.two), "hai vòng ôm hai hàng; chữ số 5 viết bên phải mỗi hàng"],
      [R(28, f28.fill), "bảy chấm điền vào lần lượt, hàng trên trước; mũi tên từ trái sang phải phía trên khung"],
    ],
    sfx: "none",
  },
  {
    scene: "Khung bảy chấm và thanh bảy khối",
    sc: [
      [R(29, f29.five), "vòng hàng trên và bong bóng chữ số 5; chấm sáu, bảy có vòng ở \"đếm tiếp\""],
      [R(29, f29.both), "thanh bảy khối xanh, ba khối trắng hiện dưới khung"],
      [R(29, f29.all), "vòng ôm cả khung và vòng ôm cả thanh; tất cả nhịp ở \"mười ô\""],
    ],
    sfx: "whoosh-short", at: R(29, f29.all),
  },
  {
    scene: "Khung lúc đầu trở lại, tấm che mở ra: bảy chấm",
    sc: [
      [R(30, f30.back), "khung có tấm che bật ra, tấm che bay đi"],
      [R(30, f30.top), "bàn tay lướt hàng trên; vòng hàng trên và bong bóng chữ số 5"],
      [R(30, f30.c[0]), `chạm sáu, bảy ở hàng dưới (${list(30, f30.c)}); thẻ bật ra bên phải, bút chì viết 7 (${R(30, f30.has)}s)`],
      [R(30, f30.good), "pháo sao bung lên từ khung và thẻ"],
    ],
    sfx: "chime", at: R(30, f30.good),
  },
];

const direction = `## Video direction

- **Palette system**
  - Nền giấy kem \`#FBF6EA\`; hai nơi chốn vẽ trên canvas: mặt bàn giấy kẻ và vườn thú (trời xanh nhạt, đồi cỏ).
  - Mực \`#3B3355\`. Màu chỉ mang nghĩa: chấm và khối "có" là xanh lam \`#2F6FEB\`; ô trống và khối "không" là trắng; xanh ngọc \`#0EA5A0\` = đã đếm, đúng; hổ phách \`#F59E0B\` = chưa đầy, câu hỏi; đỏ \`#E5484D\` = đếm nhầm; tím xám \`#8A84A0\` = bàn tay "không làm thế"; bút chì \`#5E5A70\` = vòng đánh dấu ô trống; tím \`#6D28D9\` chỉ dành cho chữ số; tấm che nâu \`#9C6B43\`.
- **Type**
  - Không có chữ trên hình và không có phụ đề: trẻ chưa biết đọc. Ký tự duy nhất là chữ số 1–10 và dấu "?".
  - Chữ số chỉ hiện sau khi đã đếm, viết từng nét bằng bút chì màu tím.
- **Motion grammar**
  - Khung mười ô luôn điền một cách: hàng trên trước, từ trái sang phải; hàng trên đầy mới xuống hàng dưới.
  - Một bàn tay trẻ con làm việc đếm: mỗi lần chạm để lại gợn sóng, một vòng xanh ngọc và một bong bóng lời nói không chữ.
  - Lỗi được diễn ra: bàn tay mờ điền lung tung thì phải đếm lại; bàn tay mờ đếm lại từ một bị gạt đi; chạm vào ô trống thì vòng đỏ và gạch chéo.
  - Mọi chuyển động là hàm của thời gian, tua đi đâu cũng ra cùng một hình.
- **Rhythm / held frames**: khung 1-2 câu hỏi và tên khung; 3-6 đếm ô; 7-10 sư tử thành chấm và bốn cách nói một số; 11-13 điền lung tung; 14-15 mười khung nhỏ; 16-17 đếm tiếp từ năm; 18-20 nhìn nhanh; 21-25 ô trống và thanh mười khối; 26-27 đếm nhầm ô trống; 28-29 nhắc lại; 30 trả lời câu hỏi đầu và giữ tới hết.
- **Framing variety**: một khung lớn giữa bàn, khung cạnh đàn sư tử, bốn ô, mười khung nhỏ hai hàng, khung có tấm che, khung trên thanh khối.
- **Caption keep-out**: không có phụ đề; bàn tay đi vào từ mép dưới.
- **Language + Negative list**
  - Không dấu cộng, trừ, lớn hơn, bé hơn, bằng; không "cộng", "trừ", "bằng", "tổng", "bằng nhau".
  - Không chữ số trước khi đếm xong; không nhắc sách hay tài liệu nguồn.
  - Không dữ liệu cá nhân; không \`repeat\`/\`yoyo\`/\`Math.random\`/\`@keyframes\`.
`;

writeStoryboard({
  title: "Khung mười ô: nhìn là biết bao nhiêu",
  music: "gentle playful instrumental for a counting lesson for six-year-old children with dots on a ten-frame: soft music box, warm marimba, light glockenspiel and pizzicato strings, a slow even bouncy pulse like small careful taps, happy, calm and curious, simple melody, no vocals, no heavy drums, no big drops, unobtrusive under narration",
  direction,
  frames: F,
});
