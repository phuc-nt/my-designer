// What only this lesson knows about its storyboard: the scene of each frame, its sound, and the video
// direction. storyboard.lib.mjs adds the narration and the timings and writes STORYBOARD.md.
//   node scripts/build-storyboard.mjs
import { B, rel, at } from "./frames.ctx.mjs";
import { writeStoryboard } from "./storyboard.lib.mjs";

const R = (n, abs) => rel(n, abs);
const CHOT = "thẻ viền tím nhạt mang nhãn \"Chốt\": nguyên câu của bài hiện mờ sẵn và sáng dần từng chữ theo giọng đọc";

// per frame: scene (one line), sc: [start, text] phases, sfx + at (seconds in the frame)
const F = [
  {
    scene: "Đầu một con phố lúc chạng vạng: tấm biển tròn dựng dần lên giữa hình, một người đi xe máy, một xe tải và một xe khách chạy tới rồi dừng trước vạch",
    sc: [
      [0, `thẻ tên bài "Biển cấm ô tô và biển cấm mô tô"; mặt đường và dãy nhà hiện ra, cột biển mọc lên`],
      [R(1, B.f1.sign) - 0.5, `thẻ "Đầu phố có tấm biển tròn viền đỏ, bên trong là hình một chiếc ô tô con bị gạch chéo"; trên hình bốn lớp của biển ghép vào lần lượt: nền trắng (${R(1, B.f1.round)}s), viền đỏ (${R(1, B.f1.rim)}s), hình ô tô con (${R(1, B.f1.pic)}s), gạch chéo (${R(1, B.f1.slash)}s)`],
      [R(1, B.f1.ask) - 0.3, `người đi xe máy tới nơi (${R(1, B.f1.arrive)}s); thẻ "Người đi xe máy phân vân" hiện câu hỏi từng chữ theo giọng đọc: "Biển chỉ có hình ô tô con, vậy xe máy có bị cấm không?", dòng "Còn xe tải, xe khách thì sao?" (${R(1, B.f1.truck)}s); mỗi xe mang một dấu hỏi hổ phách`],
    ],
    sfx: "ping", at: R(1, B.f1.q1),
  },
  {
    scene: "Tấm biển rời khỏi cột, phóng to và tách thành bốn lớp đứng cạnh nhau: nền tròn trắng, viền đỏ, hình đen, gạch chéo đỏ",
    sc: [
      [0, `nhãn mục "Ba bước đọc biển" và ba bước "Dáng và màu, Hình bên trong, Tên đúng của xe" trượt vào, bước một đang bật; thẻ "Gặp một biển cấm: nên đọc theo ba bước"`],
      [R(2, B.f2.step) - 0.1, `thẻ số 1 "Nhìn dáng và màu"; bốn lớp tách ra, các lớp "tròn" (${R(2, B.f2.round)}s), "viền đỏ" (${R(2, B.f2.rim)}s), "nền trắng" (${R(2, B.f2.white)}s) sáng lên kèm nhãn; dòng "Tròn, viền đỏ, nền trắng là lệnh cấm", cụm cuối sáng đỏ (${R(2, B.f2.ban)}s)`],
      [R(2, B.f2.slash) - 0.1, `lớp gạch chéo đỏ sáng lên; dòng "Gạch chéo đỏ nhấn thêm chữ không" (${R(2, B.f2.no)}s)`],
    ],
    sfx: "whoosh-short", at: R(2, B.f2.step),
  },
  {
    scene: "Bốn lớp vẫn tách rời; lớp hình đen được kéo ra trước, hình bên trong đổi lần lượt rồi một hình xoè ra thành cả một nhóm xe",
    sc: [
      [0, `bước hai bật trên dải ba bước; thẻ số 2 "Nhìn hình bên trong"; lớp hình sáng lên (${R(3, B.f3.pic)}s)`],
      [R(3, B.f3.tells) - 0.1, `dòng "Hình cho biết loại xe hoặc việc làm bị cấm"; hình trên lớp đổi qua vài hình khác nhau`],
      [R(3, B.f3.group) - 0.1, `dòng "Có hình đại diện cho cả một nhóm xe" (${R(3, B.f3.fan)}s); từ một hình xoè ra một dãy xe bên dưới`],
    ],
    sfx: "none",
  },
  {
    scene: "Biển lùi đi; một chiếc xe hai bánh mang hai bảng tên, rồi bảng \"Xe cơ giới\" mở ra với bốn ô xe",
    sc: [
      [0, `bước ba bật; thẻ số 3 "Tên đúng của chiếc xe": "Tên mỗi loại xe có nghĩa riêng trong luật" (${R(4, B.f4.law)}s), "Nghĩa ấy không trùng hẳn với cách gọi hằng ngày" (${R(4, B.f4.differ)}s, cụm "không trùng hẳn" sáng hổ phách); trên hình một chiếc xe với hai tên gọi và dấu khác nhau`],
      [R(4, B.f4.motor) - 0.15, `thẻ "Xe cơ giới: là xe chạy bằng động cơ" (${R(4, B.f4.engine)}s); bảng xe cơ giới mở ra, bốn ô hiện đúng lúc được đọc: "Ô tô các loại" (${R(4, B.f4.cars)}s), "Xe mô tô" (${R(4, B.f4.moto)}s), "Xe gắn máy" (${R(4, B.f4.moped)}s), "Các xe tương tự" (${R(4, B.f4.etc)}s)`],
    ],
    sfx: "none",
  },
  {
    scene: "Bảng xe cơ giới: ô xe mô tô và ô xe gắn máy sáng lần lượt, các ô khác mờ đi; giữa hai ô là dấu khác nhau",
    sc: [
      [0, `thẻ "Xe mô tô hai bánh: là thứ mọi người quen gọi là xe máy" (${R(5, B.f5.alias)}s); xe mô tô hai bánh sáng trong ô của nó`],
      [R(5, B.f5.moped) - 0.1, `thẻ "Xe gắn máy": "là loại xe máy nhỏ, chạy chậm hơn" (${R(5, B.f5.small)}s), "Luật xếp nó thành một loại riêng" (${R(5, B.f5.own)}s), "Không gọi là xe mô tô" (${R(5, B.f5.not)}s); ô xe gắn máy sáng, dấu khác nhau hiện giữa hai ô`],
    ],
    sfx: "none",
  },
  {
    scene: "Bảng xe cơ giới: xe mô tô ba bánh vào cùng ô với xe mô tô hai bánh; dải xe ưu tiên hiện bên dưới với xe chữa cháy và xe cứu thương",
    sc: [
      [0, `thẻ "Xe mô tô ba bánh": "Vẫn là xe mô tô" (${R(6, B.f6.still)}s), "nhưng không phải xe mô tô hai bánh" (${R(6, B.f6.not)}s)`],
      [R(6, B.f6.prio) - 0.1, `thẻ "Xe ưu tiên": "Xe đang đi làm nhiệm vụ khẩn cấp theo quy định" (${R(6, B.f6.duty)}s), "như xe chữa cháy hay xe cứu thương"; hai xe chạy vào dải ưu tiên với đèn nháy (${R(6, B.f6.fire)}s, ${R(6, B.f6.amb)}s)`],
      [R(6, B.f6.sum) - 0.1, `thẻ "Nắm chắc mấy cái tên này thì phần còn lại chỉ là suy ra"; cả bảng sáng đều`],
    ],
    sfx: "none",
  },
  {
    scene: "Một tấm biển cấm lớn đứng giữa hình, bốn nhãn chỉ vào bốn phần của nó",
    sc: [
      [0, `${CHOT}; "Phần lớn" và "thường" giữ màu hổ phách`],
      [R(7, B.f7.round) - 0.1, `trên biển lần lượt sáng: hình tròn, viền đỏ (${R(7, B.f7.rim)}s), nền trắng (${R(7, B.f7.white)}s), hình màu đen (${R(7, B.f7.black)}s), gạch chéo đỏ (${R(7, B.f7.slash)}s)`],
      [R(7, B.f7.pic) - 0.1, `câu thứ hai sáng dần; hình bên trong biển sáng lên, nhãn "loại xe hoặc nhóm xe bị cấm"`],
    ],
    sfx: "chime", at: 0.35,
  },
  {
    scene: "Trở lại đầu phố: tấm biển có hình ô tô con nhìn từ phía trước đứng giữa đường như người gác cổng, bên trái là phía bị cấm, bên phải là phía được đi",
    sc: [
      [0, `nhãn mục "Biển cấm xe ô tô"; thẻ "Tấm biển ở đầu phố: hình một chiếc ô tô con nhìn từ phía trước, có gạch chéo đỏ"; hình trong biển sáng (${R(8, B.f8.pic)}s), gạch chéo sáng (${R(8, B.f8.slash)}s)`],
      [R(8, B.f8.name) - 0.1, `thẻ "Đây là: Biển cấm xe ô tô"; bảng tên hiện dưới biển`],
      [R(8, B.f8.stand) - 0.6, `thẻ "Chiếc ô tô con đứng thay cho cả nhóm xe cơ giới" (${R(8, B.f8.group)}s); bảng nhỏ nhắc lại nhóm xe cơ giới`],
    ],
    sfx: "none",
  },
  {
    scene: "Tấm biển gác cổng phân xe: bên trái là phía \"Bị cấm\", bên phải là phía \"Được đi\"; ba loại xe được trừ ra lần lượt chạy qua biển sang phải",
    sc: [
      [0, `${CHOT}; cụm "cấm các loại xe cơ giới đi vào" giữ màu đỏ, ba đối tượng được trừ ra giữ màu xanh lá`],
      [R(9, B.f9.ban) - 0.1, `dãy xe cơ giới nhỏ dưới bảng tên biển nhuốm đỏ, nhãn "bị cấm" hiện bên dưới; ba chiếc xe được trừ ra chờ ở đầu phố`],
      [R(9, B.f9.except) - 0.15, `thẻ "Được trừ ra" hiện ba dòng có dấu tích: "Xe mô tô hai bánh" (${R(9, B.f9.moto2)}s), "Xe gắn máy" (${R(9, B.f9.moped)}s), "Các xe ưu tiên theo quy định" (${R(9, B.f9.prio)}s); từng xe chạy qua biển sang phải và nhận dấu tích xanh`],
    ],
    sfx: "chime", at: 0.35,
  },
  {
    scene: "Vẫn tấm biển gác cổng: ô tô con, ô tô khách, ô tô tải xếp hàng bên bị cấm, rồi xe mô tô ba bánh chạy tới và cũng bị chặn lại",
    sc: [
      [0, `thẻ "Như vậy: Ô tô con, ô tô khách, ô tô tải đều bị cấm", từng tên sáng khi được đọc (${R(10, B.f10.car)}s, ${R(10, B.f10.bus)}s, ${R(10, B.f10.truck)}s), "đều bị cấm" sáng đỏ (${R(10, B.f10.all)}s)`],
      [R(10, B.f10.trike) - 0.1, `thẻ "Xe mô tô ba bánh cũng bị cấm" (${R(10, B.f10.too)}s) kèm hai lý do: "Vì nó là xe cơ giới" (${R(10, B.f10.why)}s), "Không nằm trong ba đối tượng được trừ ra" (${R(10, B.f10.three)}s); xe ba bánh dừng trước vạch, nhận dấu gạch đỏ`],
    ],
    sfx: "none",
  },
  {
    scene: "Con phố sau tấm biển hẹp lại và có người đi bộ; rồi ba chiếc xe của câu hỏi lúc đầu quay lại trước biển để nhận câu trả lời",
    sc: [
      [0, `thẻ nhãn hổ phách "Có thể hình dung lý do như sau": "Biển này hay đặt ở những đoạn đường hẹp hoặc đông người, nơi xe to không nên vào" (${R(11, B.f11.narrow)}s, ${R(11, B.f11.crowd)}s), "Xe hai bánh nhỏ gọn nên vẫn được đi" (${R(11, B.f11.two)}s); phố hẹp lại, người đi bộ hiện ra`],
      [R(11, B.f11.back) - 0.1, `thẻ "Trở lại câu hỏi lúc đầu": dấu tích "Người đi xe máy hai bánh được đi tiếp" (${R(11, B.f11.go)}s), dấu gạch "Xe tải và xe khách thì không" (${R(11, B.f11.no)}s); xe máy chạy qua biển, xe tải và xe khách đứng lại`],
    ],
    sfx: "pop", at: R(11, B.f11.go),
  },
  {
    scene: "Tấm biển xoay quanh cột một vòng và đổi hình bên trong thành người ngồi trên xe mô tô; xe mô tô bị chặn, xe gắn máy đi qua",
    sc: [
      [0, `nhãn mục "Biển cấm xe mô tô"; thẻ "Đổi hình bên trong: một người đang ngồi trên xe mô tô, có gạch chéo đỏ"; biển lật (${R(12, B.f12.swap)}s), hình mới hiện (${R(12, B.f12.pic)}s)`],
      [R(12, B.f12.name) - 0.1, `thẻ "Đây là: Biển cấm xe mô tô", dòng "Biển gọi đúng tên một loại xe: xe mô tô" (${R(12, B.f12.call)}s, tên sáng đỏ ở ${R(12, B.f12.moto)}s); xe mô tô dừng trước vạch`],
      [R(12, B.f12.moped) - 0.1, `thẻ "Xe gắn máy là loại xe khác" (${R(12, B.f12.other)}s), dấu tích "Biển này không cấm xe gắn máy" (${R(12, B.f12.ok)}s); xe gắn máy chạy qua biển`],
    ],
    sfx: "whoosh-short", at: R(12, B.f12.swap),
  },
  {
    scene: "Hai cổng đứng nối nhau trên cùng con phố: biển cấm xe mô tô rồi biển cấm xe ô tô; một chiếc xe gắn máy chạy qua cả hai",
    sc: [
      [0, `thẻ "Ghép với biển cấm xe ô tô: xe gắn máy đi qua được cả hai" (${R(13, B.f13.both)}s); biển thứ hai mọc lên, mũi tên xanh đứt nét chạy qua hai cổng`],
      [R(13, B.f13.g1) - 0.1, `thẻ "Ở biển cấm xe mô tô": "Nó không phải xe mô tô" (${R(13, B.f13.r1)}s); cổng một nhận dấu tích và lý do`],
      [R(13, B.f13.g2) - 0.1, `thẻ "Ở biển cấm xe ô tô": "Nó nằm trong nhóm được trừ ra" (${R(13, B.f13.r2)}s); cổng hai nhận dấu tích và lý do`],
    ],
    sfx: "none",
  },
  {
    scene: "Hai cổng vẫn đứng đó; biển cấm xe mô tô sáng lên với bảng tên, rồi xe gắn máy đi lại qua hai cổng một lần nữa",
    sc: [
      [0, `${CHOT}; tên "biển cấm xe mô tô" giữ màu tím nhạt; trên hình biển có hình người đi xe mô tô sáng lên (${R(14, B.f14.sign)}s)`],
      [R(14, B.f14.moped) - 0.1, `câu thứ hai sáng dần, "được đi vào" giữ màu xanh lá; xe gắn máy qua cổng một (${R(14, B.f14.s1)}s) rồi cổng hai (${R(14, B.f14.s2)}s)`],
    ],
    sfx: "chime", at: 0.35,
  },
  {
    scene: "Hai cổng tách thành ba con phố xếp chồng, mỗi phố một tấm biển ở giữa; ba chiếc xe hai, ba bánh đứng chờ ở đầu phố trên cùng",
    sc: [
      [0, `nhãn mục "Ba xe, ba biển"; thẻ "Xe mô tô hai bánh và xe mô tô ba bánh chở hàng cùng mang tên mô tô" (${R(15, B.f15.same)}s), "nhưng gặp biển thì khác nhau" (${R(15, B.f15.diff)}s); hai xe sáng lần lượt`],
      [R(15, B.f15.add) - 0.1, `thẻ "Thêm một tấm biển: hình một chiếc xe tải nhìn ngang bị gạch chéo" (${R(15, B.f15.pic)}s), tên "Biển cấm xe ô tô tải" hiện ở ${R(15, B.f15.name)}s; phố thứ ba mở ra với tấm biển mới`],
      [R(15, B.f15.moped) - 0.1, `dấu tích "Xe gắn máy thì cả ba biển đều đi được" (${R(15, B.f15.all)}s); xe gắn máy nhận ba dấu tích xanh ở ba phố`],
    ],
    sfx: "whoosh-short", at: 0.4,
  },
  {
    scene: "Ba con phố: xe mô tô hai bánh lần lượt gặp ba tấm biển, bị chặn ở phố có hình người đi xe mô tô, đi qua ở hai phố còn lại",
    sc: [
      [0, `${CHOT}; "bị cấm" giữ màu đỏ, "được đi vào" giữ màu xanh lá; xe dừng ở phố một với dấu gạch đỏ (${R(16, B.f16.s1)}s), chạy qua ở phố hai (${R(16, B.f16.s2)}s) và phố ba (${R(16, B.f16.s3)}s) với dấu tích xanh`],
      [R(16, B.f16.why2) - 0.15, `thẻ "Vì sao": "Ở biển có hình ô tô con, nó thuộc nhóm được trừ ra" (${R(16, B.f16.r2)}s), "Biển có hình xe tải thì nhắm vào xe tải" (${R(16, B.f16.r3)}s); lý do hiện cạnh từng dấu tích trên hình`],
    ],
    sfx: "chime", at: 0.35,
  },
  {
    scene: "Ba con phố: xe mô tô ba bánh chở hàng bị chặn ở hai phố trên, chỉ đi qua ở phố có biển hình xe tải",
    sc: [
      [0, `${CHOT}; "bị cấm" giữ màu đỏ; xe ba bánh dừng ở phố một (${R(17, B.f17.s1)}s) và phố hai (${R(17, B.f17.pic2)}s) với dấu gạch đỏ`],
      [R(17, B.f17.is) - 0.15, `thẻ "Vì sao": "Nó là xe mô tô", "nhưng không phải xe mô tô hai bánh" (${R(17, B.f17.not)}s), "nên không được trừ ra" (${R(17, B.f17.so)}s, sáng đỏ)`],
      [R(17, B.f17.s3) - 0.1, `dấu tích "Riêng biển có hình xe tải thì không cấm nó" (${R(17, B.f17.ok)}s); xe chạy qua ở phố ba`],
    ],
    sfx: "none",
  },
  {
    scene: "Ba con phố đổi biển: hình ô tô con nhìn từ phía trước, hai hình xếp chồng, xe tải kéo rơ moóc; một chiếc xe tải đứng chờ ở đầu mỗi phố",
    sc: [
      [0, `nhãn mục "Xe tải"; thẻ "Ngoài biển cấm xe ô tô tải: người lái xe tải còn phải để ý ba biển sau" (${R(18, B.f18.three)}s), dòng "Cả ba đều tròn, viền đỏ, có gạch chéo đỏ" (${R(18, B.f18.all)}s); ba biển mới thay vào, viền và gạch chéo sáng lần lượt`],
      [R(18, B.f18.s1) - 0.1, `thẻ "Biển có hình ô tô con nhìn từ phía trước": "Cấm cả nhóm xe cơ giới" (${R(18, B.f18.group)}s), dấu gạch "nên cấm xe tải" (${R(18, B.f18.ban)}s); xe tải ở phố một chạy tới và dừng trước vạch`],
    ],
    sfx: "none",
  },
  {
    scene: "Hình phóng vào tấm biển ở phố giữa để đọc hai hình xếp chồng, rồi lùi ra: xe tải bị chặn",
    sc: [
      [0, `thẻ "Biển có hai hình xếp chồng": "Xe khách ở trên, lệch về bên phải" (${R(19, B.f19.bus)}s), "Xe tải ở dưới, lệch về bên trái" (${R(19, B.f19.truck)}s); biển phóng to, nhãn chỉ vào từng hình`],
      [R(19, B.f19.ban) - 0.1, `thẻ "Cấm cả ô tô khách lẫn ô tô tải", hai tên sáng đỏ lần lượt (${R(19, B.f19.busBan)}s, ${R(19, B.f19.truckBan)}s); hình lùi ra, xe tải ở phố hai dừng với dấu gạch đỏ`],
    ],
    sfx: "none",
  },
  {
    scene: "Hình phóng vào tấm biển ở phố dưới: hai khối hộp đen nối bằng một thanh kéo; rồi trên phố, xe tải tháo rơ moóc và một mình chạy qua biển",
    sc: [
      [0, `thẻ "Biển còn lại: hình một chiếc xe tải kéo theo rơ moóc phía sau" (${R(20, B.f20.pic)}s), "Hai khối hộp đen" (${R(20, B.f20.boxes)}s), "nối với nhau bằng một thanh kéo" (${R(20, B.f20.bar)}s); biển phóng to, nhãn chỉ vào hai khối hộp và thanh kéo`],
      [R(20, B.f20.ban) - 0.15, `dấu gạch "Cấm xe đang kéo rơ moóc" (${R(20, B.f20.towing)}s): xe tải kéo rơ moóc dừng trước vạch; dấu tích "Xe tải chạy một mình không bị cấm" (${R(20, B.f20.ok)}s): rơ moóc ở lại, xe tải chạy qua biển`],
    ],
    sfx: "click", at: R(20, B.f20.alone),
  },
  {
    scene: "Ba con phố của xe tải đứng yên với ba kết quả: bị chặn, bị chặn, đi qua",
    sc: [
      [0, `${CHOT}; "bị cấm" giữ màu đỏ; dấu gạch đỏ ở phố một (${R(21, B.f21.s1)}s) và phố hai (${R(21, B.f21.s2)}s) nảy lên khi được đọc`],
      [R(21, B.f21.s3) - 0.1, `câu thứ hai sáng dần, "không cấm" giữ màu xanh lá; dấu tích xanh ở phố ba nảy lên (${R(21, B.f21.ok)}s)`],
    ],
    sfx: "chime", at: 0.35,
  },
  {
    scene: "Trở lại đầu phố: tấm biển đứng một mình, ba nhãn đánh số chỉ vào dáng và màu, hình bên trong, và chiếc xe đang chờ trước biển",
    sc: [
      [0, `nhãn mục "Ghi nhớ"; thẻ "Lần tới gặp một biển cấm: hãy đọc theo ba bước" (${R(22, B.f22.steps)}s)`],
      [R(22, B.f22.a) - 0.35, `thẻ ba dòng đánh số hiện theo giọng đọc: "Dáng và màu" (${R(22, B.f22.a)}s), "Hình bên trong" (${R(22, B.f22.b)}s), "Tên đúng của chiếc xe mình đang đi" (${R(22, B.f22.c)}s); trên hình ba nhãn cùng số hiện đúng lúc, giữ tới hết`],
    ],
    sfx: "none",
  },
];

const direction = `## Video direction

- **Palette system**
  - Lấy từ frame.md (glass-keynote): mực \`#F5F3FF\`, chữ phụ \`#AEACD6\`, thẻ chàm gần đặc \`#15163A\`, viền lilac \`rgba(196,181,253,0.28)\`.
  - Nền của video là một con phố 2D lúc chạng vạng do \`compositions/world.html\` vẽ trên canvas. Các khung chỉ là lớp chữ trong suốt đặt lên trên.
  - Tấm biển giữ đúng ba màu của nó: đỏ, trắng, đen. Ngoài ra màu chỉ mang nghĩa phán quyết, ở cả hình lẫn chữ: đỏ = bị cấm, xanh lá = được đi, hổ phách = lời rào đón và câu hỏi.
  - Tím nhạt (lilac) là màu nhấn trung tính cho tên biển và tên loại xe.
- **Type**
  - Plus Jakarta Sans 700-800 cho câu chốt, tên biển và tên loại xe; JetBrains Mono IN HOA giãn 0.14em cho nhãn nhỏ.
  - Font tiếng Việt trong \`assets/fonts/\` (frame.md § Font faces), line-height dòng lớn ≥ 1.1, không cắt chiều dọc hộp chữ.
  - Chữ trên thẻ là lời đọc rút gọn; không thêm ý nào không có trong lời đọc. Chữ trên hình từ 20 px trở lên.
- **Motion grammar**
  - Tấm biển là nhân vật chính. Nó được ghép từ bốn lớp (nền tròn trắng, viền đỏ, hình đen, gạch chéo đỏ), tách ra khi học cách đọc, rồi đứng giữa phố như người gác cổng: xe bị cấm dừng trước vạch bên trái, xe được đi chạy qua sang phải.
  - Đổi một biển thành biển khác bằng cách xoay tấm biển quanh cột và đổi hình bên trong; dáng và màu giữ nguyên.
  - Các bảng so sánh của bài không vẽ thành bảng: mỗi tấm biển là một con phố, mỗi chiếc xe chạy tới và nhận dấu tích xanh hoặc dấu gạch đỏ đúng lúc lời đọc nói tới.
  - Khi cần đọc kỹ một hình, hình phóng vào tấm biển rồi lùi ra.
  - Thẻ chữ vào bằng \`power3.out\`; từng dòng trượt nhẹ từ trái vào đúng lúc được đọc. Cụm từ khoá sáng thành ô màu rồi giữ màu của điều nó nói.
  - Câu chốt hiện mờ sẵn trong thẻ viền tím nhạt và sáng dần từng chữ theo giọng đọc; chữ trên thẻ là nguyên câu của bài.
- **Rhythm / held frames**: khung 1 mở bằng một câu hỏi ở đầu phố; khung 2-6 là ba bước đọc biển và tên các loại xe, khung 7 dừng trên câu chốt; khung 8-11 là biển cấm xe ô tô và câu trả lời cho câu hỏi; khung 12-14 là biển cấm xe mô tô; khung 15-17 đặt ba chiếc xe trước ba tấm biển; khung 18-21 là chiếc xe tải; khung 22 nhắc lại ba bước và giữ tới hết.
- **Framing variety**: chữ luôn ở cột trái (x 64-620, từ y 104, hoặc y 156 khi có ba bước); hình bên phải đổi theo nội dung: đầu phố với tấm biển, bốn lớp của biển, bảng xe cơ giới, tấm biển gác cổng, hai cổng nối nhau, ba con phố xếp chồng, cận cảnh một tấm biển.
- **Caption keep-out**
  - Phụ đề nằm ở ~17% dưới cùng (y > 896); mọi thẻ chữ kết thúc trên y 880, ở các cảnh đầu phố thì trên y 660 để nhường chỗ cho xe.
  - Khung không có nền riêng; nền là con phố ở lớp dưới cùng của index.
- **Language + Negative list**
  - Mọi chữ trên hình là tiếng Việt.
  - Video đứng một mình: không lời hay chữ nào nhắc tới số câu hỏi, kỳ kiểm tra hay tài liệu nguồn; không ghi số thứ tự bài.
  - Không gọi biển theo thứ tự hay bằng mã số; biển được gọi bằng tên hoặc bằng hình bên trong, đúng như lời đọc.
  - Tên biển và tên loại xe giữ nguyên chữ của bài. Hình trong biển vẽ theo lời tả của bài: ô tô con nhìn từ phía trước, người ngồi trên xe mô tô, xe tải nhìn ngang, xe khách xếp trên xe tải, hai khối hộp nối bằng thanh kéo.
  - Các lời rào đón được giữ trên hình: "Phần lớn", "thường", "Có thể hình dung lý do như sau", "hay đặt".
  - Không thêm kiến thức ngoài bài: không trọng tải, không giờ cấm, không mức phạt, không biển nào khác.
  - Không dữ liệu cá nhân, token hay đường dẫn riêng.
  - Không \`repeat\`/\`yoyo\`/\`Math.random\`/\`@keyframes\`.
  - Cấm cả hai kiểu hỏng: "slideshow" (hiện hết trong 25% đầu rồi đứng im) và "screensaver" (nhiều thứ trôi lung tung).
`;

writeStoryboard({
  title: "Biển cấm ô tô và biển cấm mô tô",
  music: "light, curious instrumental underscore, soft plucked nylon guitar and muted vibraphone over warm pads, an easy walking pulse with a gentle brushed rhythm, unobtrusive",
  direction,
  frames: F,
});
