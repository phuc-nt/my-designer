// Writes STORYBOARD.md from SCRIPT.md (titles and the exact narration) and the real voice timings.
// Durations start as the voice file lengths; `audio.mjs sync-durations` rewrites them from audio_meta.json.
//   node scripts/build-storyboard.mjs
import fs from "node:fs";
import path from "node:path";
import { PROJECT, plan, B, rel, at, r2, voiceDur, script, COUNT } from "./frames.ctx.mjs";
import { frameId } from "./frames.kit.mjs";

const { titles, vo } = script();
const R = (n, abs) => rel(n, abs);
const list = (n, arr) => arr.map((m) => R(n, m.s)).join(", ");
const T = { 1: plan.sites[1].T, 2: plan.sites[2].T, 3: plan.sites[3].T, 4: plan.sites[4].T };
const one = (arr, id, nth = 0) => arr.filter((m) => m.id === id)[nth];
const [b1, b2, b3, b4, rc] = [B[1], B[2], B[3], B[4], B.recap];

// per frame: scene (one line), sc: [start, text] phases, sfx + at (seconds in the frame)
const F = [
  // ---------------------------------------------------------------- tình huống 1: bốn xe
  {
    scene: "Toàn cảnh ngã tư không có đèn nhìn từ trên cao dưới trời sáng; bốn xe đứng ở bốn đầu đường, mỗi xe có nhãn tên; cột chữ bên trái nêu bối cảnh, bốn xe và điều cần trả lời",
    sc: [
      [0, `nhãn "Tình huống 1 · Bốn xe" và thanh bốn bước, bước Tình huống sáng; thẻ "Ngã tư không có đèn tín hiệu" hiện ở ${at(1, "không có đèn tín hiệu")}s`],
      [R(1, one(b1.said, "truck").s) - 0.5, `thẻ "Các xe đến ngã tư" với bốn thẻ xe tải, mô tô, khách, con; mỗi thẻ sáng thành ô vàng phát sáng đúng lúc tên xe được đọc (${list(1, b1.said)}s), cùng nhịp với nhãn tên xe trên bản đồ`],
      [R(1, b1.ask.s) - 0.35, `thẻ "Cần trả lời" hiện từng chữ theo giọng đọc: "Các xe đi qua theo thứ tự nào?"`],
      [R(1, b1.ask.e) + 0.1, `thẻ "Tự nghĩ thử trước khi xem tiếp" hiện và giữ một nhịp ngắn để người xem tự nghĩ`],
    ],
    sfx: "ping", at: R(1, b1.ask.s) - 0.1,
  },
  {
    scene: "Camera giữ nguyên góc trên cao; cột chữ hiện hai quy tắc rồi hai thẻ biển; kính lúp mở lần lượt trên biển giao nhau với đường không ưu tiên và biển giao nhau với đường ưu tiên, có bảng tên dưới kính; dải xanh tô đường ưu tiên",
    sc: [
      [0, `nhãn "Tình huống 1 · Bốn xe" và thanh bước, bước Quy tắc sáng`],
      [R(2, b1.rule1.s) - 0.1, `thẻ "Quy tắc 1": "Đường ưu tiên" đi trước (${at(2, "xe trên đường ưu tiên")}s), "Không ưu tiên" đi sau (${at(2, "xe ở đường không ưu tiên")}s)`],
      [R(2, b1.rule2.s) - 0.1, `thẻ "Quy tắc 2": "Hai xe đi ngược chiều nhau" (${R(2, b1.oncoming.s)}s); ô "Rẽ trái" nhường ô "Đi thẳng", từng ô sáng đúng lúc đọc (${R(2, b1.leftWord.s)}s, ${R(2, b1.straightWord.s)}s)`],
      [R(2, b1.look), `nhãn "Nhìn các biển", hai thẻ quy tắc mờ bớt; thẻ biển phía xe tải và xe mô tô kèm kính lúp bên phải và bảng tên (${R(2, b1.signP.s)}s); ô "Đường ưu tiên" và dải xanh trên bản đồ ở ${R(2, b1.bandP)}s`],
      [R(2, b1.signY.s) - 0.1, `thẻ biển phía xe con và xe khách kèm kính lúp bên trái và bảng tên; ô "Không ưu tiên" và hai nhánh đỏ ở ${R(2, b1.bandY)}s`],
    ],
    sfx: "chime", at: R(2, b1.bandP),
  },
  {
    scene: "Bốn xe lần lượt lăn qua ngã tư theo đúng thứ tự; mỗi xe có một thẻ số trong cột chữ kèm lý do ngắn; số sáng vàng khi xe được xét, chuyển xanh khi xe đi",
    sc: [
      [0, `nhãn bước "Xe chạy" và "Thứ tự các xe đi"; thẻ 1 Xe tải: số sáng vàng, chuyển xanh khi xe tải đi ở ${R(3, T[1].go.truck)}s; dòng "Đường ưu tiên, đi thẳng" (${R(3, b1.why.truck.s)}s); nhãn "ĐI TRƯỚC"`],
      [R(3, b1.turn.moto.s) - 0.1, `thẻ 2 Xe mô tô: "Cũng ở đường ưu tiên" (${at(3, "Nó cũng ở trên đường ưu tiên")}s) rồi "Nhưng rẽ trái: nhường xe tải" (${R(3, b1.why.moto.s)}s); xe đi ở ${R(3, T[1].go.moto)}s, nhãn "ĐI THỨ HAI"`],
      [R(3, b1.turn.bus.s) - 0.1, `thẻ 3 Xe khách: "Không ưu tiên: chờ hai xe kia" (${at(3, "Nó ở đường không ưu tiên nên chờ")}s) rồi "Đi thẳng: đi trước xe con" (${R(3, b1.why.busGo.s)}s); xe đi ở ${R(3, T[1].go.bus)}s, nhãn "ĐI THỨ BA"`],
      [R(3, b1.turn.car.s) - 0.1, `thẻ 4 Xe con: "Không ưu tiên, lại rẽ trái" (${at(3, "nó ở đường không ưu tiên và rẽ trái")}s) rồi "Nhường xe khách đi thẳng" (${R(3, b1.why.car.s)}s); xe đi ở ${R(3, T[1].go.car)}s, nhãn "ĐI SAU CÙNG"`],
    ],
    sfx: "whoosh", at: R(3, T[1].go.truck),
  },
  {
    scene: "Bốn hàng thứ tự gọn hiện theo tên xe được đọc; thẻ Mẹo nhớ có bốn dòng: đường ưu tiên trước, không ưu tiên sau, đi thẳng trước, rẽ trái sau",
    sc: [
      [0, `thanh bước chuyển sang "Chốt"; nhãn "Thứ tự các xe đi"; bốn hàng gọn Xe tải, Xe mô tô, Xe khách, Xe con hiện đúng lúc tên xe được đọc (${list(4, b1.said4)}s), số chuyển xanh`],
      [R(4, b1.tip) - 0.05, `thẻ "Mẹo nhớ" nhãn hổ phách: ô "Đường ưu tiên" trước (${R(4, b1.tipRoad.s)}s), "Không ưu tiên" sau (${R(4, b1.tipOther.s)}s), "Đi thẳng" trước (${R(4, b1.tipStraight.s)}s), "Rẽ trái" sau (${R(4, b1.tipLeft.s)}s)`],
    ],
    sfx: "sparkle", at: R(4, b1.tip),
  },
  // ---------------------------------------------------------------- tình huống 2: ba xe, xe đi cuối
  {
    scene: "Camera trên cao nhìn trọn ngã tư có biển báo; cột chữ nêu bối cảnh, ba xe với hướng rẽ của từng xe và điều cần trả lời",
    sc: [
      [0, `nhãn "Tình huống 2 · Ba xe" và thanh bước, bước Tình huống sáng; thẻ "Ngã tư có biển báo đường ưu tiên" ở ${at(5, "có biển báo đường ưu tiên")}s`],
      [R(5, b2.turnSaid.car.s) - 0.2, `ba hàng xe: Xe con "RẼ TRÁI" (${R(5, b2.turnSaid.car.s)}s), Xe tải "RẼ PHẢI" (${R(5, b2.turnSaid.truck.s)}s), Xe khách "RẼ TRÁI" (${R(5, b2.turnSaid.bus.s)}s); vòng tròn của xe đang được nhắc sáng vàng đúng lúc đọc`],
      [R(5, b2.ask.s) - 0.35, `thẻ "Cần trả lời" hiện từng chữ theo giọng đọc: "Xe nào phải đi sau cùng?"`],
      [R(5, b2.ask.e) + 0.1, `thẻ "Tự nghĩ thử trước khi xem tiếp" giữ một nhịp ngắn`],
    ],
    sfx: "ping", at: R(5, b2.ask.s) - 0.1,
  },
  {
    scene: "Cột chữ hiện hai quy tắc rồi hai thẻ biển; kính lúp mở trên biển phía xe con (đường ưu tiên) và biển phía xe khách, xe tải (đường không ưu tiên), có bảng tên dưới kính; dải xanh tô đường của xe con",
    sc: [
      [0, `nhãn "Tình huống 2 · Ba xe" và thanh bước, bước Quy tắc sáng`],
      [R(6, b2.rule1.s) - 0.1, `thẻ "Quy tắc 1": "Đường ưu tiên" đi trước (${at(6, "xe trên đường ưu tiên")}s), "Không ưu tiên" đi sau (${at(6, "xe ở đường không ưu tiên")}s)`],
      [R(6, b2.rule2.s) - 0.1, `thẻ "Quy tắc 2": "Hai xe đi ngược chiều nhau", ô "Rẽ trái" phải nhường xe kia, sáng đúng lúc đọc (${R(6, b2.leftWord.s)}s)`],
      [R(6, b2.look), `nhãn "Nhìn các biển", hai thẻ quy tắc mờ bớt; thẻ biển phía xe con và phía đối diện kèm kính lúp bên phải và bảng tên (${R(6, b2.signP.s)}s); ô "Đường ưu tiên" và dải xanh ở ${R(6, b2.bandP)}s`],
      [R(6, b2.signY.s) - 0.1, `thẻ biển phía xe khách và xe tải kèm kính lúp bên trái và bảng tên; ô "Không ưu tiên" ở ${R(6, b2.bandY)}s; dòng "Hai xe này đứng đối diện nhau"`],
    ],
    sfx: "chime", at: R(6, b2.bandP),
  },
  {
    scene: "Xe con đi trước; xe tải rẽ phải đi thứ hai; xe khách rẽ trái cắt ngang đường xe tải nên đi sau cùng; cột chữ ghi lý do từng xe và một thẻ phụ cho cặp xe còn lại",
    sc: [
      [0, `nhãn bước "Xe chạy"; thẻ 1 Xe con: "Ở trên đường ưu tiên" (${R(7, b2.carWhy.s)}s), "Hai xe kia phải nhường" (${R(7, b2.others.s)}s); xe con đi ở ${R(7, T[2].go.car)}s, nhãn "ĐI TRƯỚC"`],
      [R(7, b2.rest.s) - 0.1, `thẻ "Còn lại: xe tải và xe khách" với ba ô sáng lần lượt: cùng ở đường không ưu tiên, đi ngược chiều nhau (${R(7, b2.oncoming.s)}s), cùng vào một nhánh đường (${R(7, b2.sameRoad.s)}s)`],
      [R(7, b2.truckR.s) - 0.1, `thẻ 2 Xe tải: "Rẽ phải" rồi "Đi thứ hai" (${R(7, b2.second)}s); xe tải đi ở ${R(7, T[2].go.truck)}s`],
      [R(7, b2.busL.s) - 0.1, `thẻ 3 Xe khách: "Rẽ trái, cắt ngang đường xe tải" rồi "Phải nhường xe tải" (${R(7, b2.busYield.s)}s); xe khách đi ở ${R(7, T[2].go.bus)}s, nhãn "ĐI SAU CÙNG"`],
    ],
    sfx: "whoosh", at: R(7, T[2].go.car),
  },
  {
    scene: `Thẻ lớn "Đi sau cùng: Xe khách" phóng vào; ba hàng thứ tự gọn hiện theo tên xe được đọc; thẻ Mẹo nhớ có hai dòng`,
    sc: [
      [0, `thanh bước chuyển sang "Chốt"; thẻ lớn "ĐI SAU CÙNG · Xe khách" có vòng viền sáng`],
      [R(8, one(b2.said8, "car").s), `ba hàng gọn: Xe con "đường ưu tiên" (${R(8, one(b2.said8, "car").s)}s), Xe tải "rẽ phải" (${R(8, one(b2.said8, "truck").s)}s), Xe khách "rẽ trái, nhường cả hai" (${R(8, one(b2.said8, "bus", 1).s)}s), số chuyển xanh`],
      [R(8, b2.tip) - 0.05, `thẻ "Mẹo nhớ": ô "Đường ưu tiên" trước (${R(8, b2.tipRoad.s)}s), ô "Còn lại" rẽ trái đi sau (${R(8, b2.tipLeft.s)}s)`],
    ],
    sfx: "sparkle", at: R(8, b2.tip),
  },
  // ---------------------------------------------------------------- tình huống 3: biển Dừng lại
  {
    scene: "Camera trên cao nhìn trọn ngã tư; cột chữ nêu hai xe với hướng đi, biển Dừng lại ở phía xe mô tô và điều cần trả lời; kính lúp phải phóng to biển Dừng lại, bảng tên dưới kính",
    sc: [
      [0, `nhãn "Tình huống 3 · Biển Dừng lại" và thanh bước, bước Tình huống sáng; hai hàng xe: Xe con "RẼ TRÁI" (${R(9, b3.carL.s)}s), Xe mô tô "ĐI THẲNG" (${R(9, b3.motoS.s)}s)`],
      [R(9, b3.signSay.s) - 0.5, `thẻ biển Dừng lại hình tám cạnh "Phía xe mô tô có biển Dừng lại" phóng vào; kính lúp bên phải mở trên biển, bảng tên "Biển Dừng lại" (${R(9, b3.signSay.s) + 0.3}s)`],
      [R(9, b3.ask.s) - 0.35, `thẻ "Cần trả lời" hiện từng chữ theo giọng đọc: "Xe nào đi trước?"`],
      [R(9, b3.ask.e) + 0.1, `thẻ "Tự nghĩ thử trước khi xem tiếp" giữ một nhịp ngắn`],
    ],
    sfx: "ping", at: R(9, b3.ask.s) - 0.1,
  },
  {
    scene: "Cột chữ nêu quy tắc ba bước khi gặp biển Dừng lại, rồi thẻ biển Dừng lại với hình dạng và vị trí đặt biển, rồi thẻ phía xe con không có biển; kính lúp phải giữ trên biển",
    sc: [
      [0, `nhãn "Tình huống 3 · Biển Dừng lại" và thanh bước, bước Quy tắc sáng; thẻ "Quy tắc: gặp biển Dừng lại" với vạch dừng ở ${R(10, b3.ruleLine.s)}s`],
      [at(10, "quan sát") - 0.1, `ba bước hiện đúng lúc đọc: "Dừng hẳn trước vạch dừng", "Quan sát" (${at(10, "quan sát")}s), "Chỉ đi khi không còn xe cắt qua đường mình" (${at(10, "chỉ đi tiếp")}s); kính lúp phải mở trên biển từ ${R(10, b3.ruleSign.s) + 0.3}s`],
      [R(10, b3.one.s) - 0.1, `thẻ "Trong hình chỉ có một cột biển": biển Dừng lại, dòng "Hình tám cạnh, nền đỏ" (${R(10, b3.shape.s)}s), nhãn "Đặt bên phải xe mô tô" (${R(10, b3.right.s)}s) và "Quay mặt về xe mô tô" (${at(10, "quay mặt về xe mô tô")}s)`],
      [R(10, b3.none.s) - 0.1, `thẻ "Phía xe con: không có biển"`],
    ],
    sfx: "chime", at: R(10, b3.ruleSign.s),
  },
  {
    scene: "Xe mô tô tiến chậm tới vạch dừng rồi đứng hẳn; xe con rẽ trái đi trước; đường trống rồi xe mô tô mới đi thẳng; cột chữ ghi hai xe theo thứ tự đọc",
    sc: [
      [0, `nhãn bước "Xe chạy"; hàng Xe mô tô: "Tới vạch dừng" (${at(11, "tới vạch dừng")}s), "Gặp biển Dừng lại" (${R(11, b3.met.s)}s), nhãn "DỪNG HẲN" và dòng "Phải dừng hẳn và nhường" (${R(11, b3.mustStop.s)}s)`],
      [R(11, b3.noSign.s) - 0.1, `hàng Xe con: "Không có biển buộc dừng" (${R(11, b3.noSign.s)}s), "Rẽ trái, cắt ngang trước xe mô tô" (${R(11, b3.cuts.s)}s); xe con đi ở ${R(11, T[3].go.car)}s, nhãn "ĐI TRƯỚC" (${R(11, b3.carFirst.s)}s)`],
      [R(11, b3.clear.s) - 0.1, `hàng Xe mô tô đổi sang "Trước mặt trống: đi thẳng" và nhãn "ĐI TIẾP" ở ${R(11, T[3].go.moto)}s; xe mô tô đi thẳng`],
    ],
    sfx: "whoosh", at: R(11, T[3].go.car),
  },
  {
    scene: "Hai hàng thứ tự gọn; thẻ Mẹo nhớ có bốn bước với biểu tượng: biển tám cạnh đỏ, dừng hẳn, nhường hết, rồi mới đi",
    sc: [
      [0, `thanh bước chuyển sang "Chốt"; hàng Xe con "đi trước" (${R(12, b3.carFirst12.s)}s), hàng Xe mô tô "gặp biển Dừng lại: dừng hẳn và nhường, dù đi thẳng" (${R(12, b3.motoMust.s)}s)`],
      [R(12, b3.tip) - 0.05, `thẻ "Mẹo nhớ": biển Dừng lại (${R(12, b3.tipSign.s)}s, kính lúp phải mở lại), vạch dừng "Dừng hẳn" (${R(12, b3.tipStop.s)}s), "Nhường hết" (${R(12, b3.tipYield.s)}s), "Rồi mới đi" (${R(12, b3.tipGo.s)}s)`],
    ],
    sfx: "sparkle", at: R(12, b3.tip),
  },
  // ---------------------------------------------------------------- tình huống 4: hai xe ngang quyền
  {
    scene: "Camera trên cao nhìn trọn ngã tư; cột chữ nêu hai xe cùng đi thẳng, đường đi cắt nhau, biển tam giác đỉnh quay xuống phía trước hai xe, và điều cần trả lời; hai kính lúp trái và phải mở trên hai biển",
    sc: [
      [0, `nhãn "Tình huống 4 · Hai xe đi thẳng" và thanh bước, bước Tình huống sáng; hai hàng xe "ĐI THẲNG" (${R(13, b4.straightSay.s)}s)`],
      [R(13, b4.cross.s) - 0.1, `thẻ "Đường đi cắt nhau" (${R(13, b4.cross.s)}s)`],
      [R(13, b4.signsSay.s) - 0.3, `thẻ "Trước mặt cả hai xe: biển tam giác đỉnh quay xuống"; hai kính lúp mở trên hai biển, bảng tên "Trước mặt xe con" và "Trước mặt xe tải" (${R(13, b4.signsSay.s) + 0.3}s)`],
      [R(13, b4.ask.s) - 0.35, `thẻ "Cần trả lời" hiện từng chữ theo giọng đọc: "Xe nào phải nhường đường?"`],
      [R(13, b4.ask.e) + 0.1, `thẻ "Tự nghĩ thử trước khi xem tiếp" giữ một nhịp ngắn`],
    ],
    sfx: "ping", at: R(13, b4.ask.s) - 0.1,
  },
  {
    scene: "Cột chữ nêu hai quy tắc, rồi đổi sang thẻ biển tam giác, biển phụ chỉ hướng đường ưu tiên với nét đậm, và thẻ hai nhánh không có xe; hai kính lúp trái và phải giữ trên hai biển có biển phụ",
    sc: [
      [0, `nhãn "Tình huống 4 · Hai xe đi thẳng" và thanh bước, bước Quy tắc sáng; thẻ "Quy tắc 1": "Không ưu tiên" nhường (${at(14, "xe ở đường không ưu tiên")}s), "Đường ưu tiên" đi trước (${at(14, "xe trên đường ưu tiên")}s)`],
      [R(14, b4.rule2.s) - 0.1, `thẻ "Quy tắc 2": "Hai xe ngang quyền nhau", ô "Bên phải" sáng ở ${at(14, "bên phải mình")}s, dòng "thì xe đó phải nhường" (${at(14, "xe đó phải nhường")}s)`],
      [R(14, b4.signs.s) - 0.3, `bảng quy tắc trượt đi, thẻ biển tam giác đỉnh quay xuống vào (${R(14, b4.signs.s)}s), ô "Cả hai: không ưu tiên" ở ${R(14, b4.both.s)}s; hai kính lúp mở trên hai biển, bảng tên "Trước mặt xe con" và "Trước mặt xe tải"`],
      [R(14, b4.sub.s) - 0.1, `thẻ biển phụ "Chỉ hướng đường ưu tiên" với hình biển phụ; ô "Nét đậm = đường ưu tiên" ở ${R(14, b4.bold.s)}s, dòng "Rẽ góc, nối hai nhánh ở phía trên"`],
      [R(14, b4.empty.s) - 0.1, `thẻ "Hai nhánh đó không có xe" (${R(14, b4.empty.s)}s)`],
    ],
    sfx: "chime", at: R(14, b4.signs.s),
  },
  {
    scene: "Xe tải chạy thẳng trước, rồi xe con chạy thẳng; cột chữ nêu không có xe nào ở đường ưu tiên, quy tắc bên phải, và ghi lý do từng xe",
    sc: [
      [0, `nhãn bước "Xe chạy"; thẻ "Không có xe nào trên đường ưu tiên" (${R(15, b4.noOne.s)}s), dòng "Nên không ai đi trước nhờ đường ưu tiên" (${at(15, "nên không ai")}s)`],
      [R(15, b4.equal.s) - 0.05, `thẻ "Cùng không ưu tiên, ngang quyền" và ô "Quy tắc bên phải" ở ${at(15, "quy tắc bên phải")}s`],
      [R(15, b4.carRight.s) - 0.1, `hàng Xe con: "Bên phải: xe tải đang tới" (${R(15, b4.carRight.s)}s), nhãn "PHẢI NHƯỜNG" (${R(15, b4.carYield15.s)}s)`],
      [R(15, b4.truckRight.s) - 0.1, `hàng Xe tải: "Bên phải: trống" (${R(15, b4.truckRight.s)}s), nhãn "ĐI TRƯỚC" (${R(15, b4.truckFirst15.s)}s); xe tải đi ở ${R(15, T[4].go.truck)}s, rồi xe con đi ở ${R(15, T[4].go.car)}s và nhãn đổi thành "ĐI SAU"`],
    ],
    sfx: "whoosh", at: R(15, T[4].go.truck),
  },
  {
    scene: `Thẻ lớn "Phải nhường đường: Xe con" phóng vào; thẻ Vì sao có ba bước; thẻ Mẹo nhớ có hai dòng; cả cột chữ trượt ra khi camera lùi về toàn cảnh`,
    sc: [
      [0, `thanh bước chuyển sang "Chốt"; thẻ lớn "PHẢI NHƯỜNG ĐƯỜNG · Xe con", viền đỏ sáng`],
      [R(16, b4.why.s) - 0.1, `thẻ "Vì sao": "Cả hai ở đường không ưu tiên" (${R(16, b4.why.s)}s), "Xét bên phải" (${R(16, b4.right16.s)}s), "Xe tải tới từ bên phải xe con" (${at(16, "xe tải đi tới từ bên phải")}s)`],
      [R(16, b4.tip) - 0.05, `thẻ "Mẹo nhớ": ô "Không ưu tiên" cả hai xe (${R(16, b4.tipLine.s)}s), ô "Bên phải" nhường xe bên phải (${at(16, "quy tắc nhường bên phải")}s)`],
      [R(16, plan.side.out), `cả cột chữ trượt sang trái; camera lùi ra toàn cảnh bốn nút giao`],
    ],
    sfx: "sparkle", at: R(16, b4.tip),
  },
  // ---------------------------------------------------------------- tổng kết
  {
    scene: "Toàn cảnh bốn nút giao nhìn từ trên cao; xe ở từng nút chạy lại; bốn thẻ mẹo nhớ hiện phía trên từng nút theo lời đọc; ba dòng chốt cho cả bốn tình huống",
    sc: [
      [0, `dòng lớn "Bốn tình huống, bốn mẹo nhớ" trượt xuống giữa phía trên (${R(17, rc.open.s)}s)`],
      [R(17, rc.tip[0].s) - 0.1, `thẻ "Tình huống 1" (${R(17, rc.tip[0].s)}s), "Tình huống 2" (${R(17, rc.tip[1].s)}s), "Tình huống 3" (${R(17, rc.tip[2].s)}s), "Tình huống 4" (${R(17, rc.tip[3].s)}s) hiện lần lượt; thẻ đang được đọc có viền hổ phách; xe ở từng nút chạy lại đúng thứ tự`],
      [R(17, rc.message.s) - 0.45, `các thẻ mẹo nhớ mờ đi; dòng lớn cuối "Ở ngã tư có biển" với ba dòng: "Đường ưu tiên đi trước" (${at(17, "xe trên đường ưu tiên đi trước")}s), "Không ưu tiên: nhường xe bên phải" (${at(17, "các xe ở đường không ưu tiên")}s), "Rẽ trái đi sau cùng" (${at(17, "và rẽ trái đi sau cùng")}s)`],
    ],
    sfx: "chime", at: R(17, rc.message.s),
  },
];
if (F.length !== COUNT) throw new Error(`${F.length} frame notes for ${COUNT} frames`);

const brief = fs.readFileSync(path.join(PROJECT, "BRIEF.md"), "utf8");
const field = (k) => (brief.match(new RegExp(`^${k}:\\s*"?(.+?)"?\\s*$`, "m")) || [])[1];
const total = r2(Array.from({ length: COUNT }, (_, i) => voiceDur(i + 1)).reduce((a, b) => a + b, 0));

const direction = `## Video direction

- **Palette system**
  - Lấy từ frame.md (glass-keynote): mực \`#F5F3FF\`, chữ phụ \`#AEACD6\`, thẻ chàm gần đặc \`#15163A\`, viền lilac \`rgba(196,181,253,0.28)\`.
  - Nền của video là cảnh 3D ban ngày (trời nhạt, mặt đường xám, cỏ xanh) do \`compositions/world.html\` vẽ; các khung chỉ là lớp chữ trong suốt đặt lên trên.
  - Màu có nghĩa cố định trong cả video: vàng hổ phách = đang xét, đỏ = dừng / nhường / không ưu tiên, xanh lá = được đi / đường ưu tiên, xanh da trời = hướng rẽ của xe.
  - Gradient hồng-tím-xanh chỉ dùng một lần mỗi khung, cho cụm chữ chốt.
- **Type**
  - Plus Jakarta Sans 700-800 cho tình huống, quy tắc và lý do; JetBrains Mono IN HOA giãn 0.14em cho nhãn nhỏ và thanh bước.
  - Font tiếng Việt trong \`assets/fonts/\` (frame.md § Font faces), line-height dòng lớn ≥ 1.1, không cắt chiều dọc hộp chữ.
  - Chữ cái trên xe (xe A, xe B) và số hướng được phép dùng làm nhãn trên cảnh; mọi chữ khác trên hình là chữ của chính tình huống.
- **Motion grammar**
  - Mỗi tình huống một góc nhìn trên cao cố định, luôn thấy cả nút giao; chỉ lướt một lần khi sang tình huống mới. Không bay, không xoay, không phóng to thu nhỏ trong lúc giải thích.
  - Xe chạy đúng thứ tự và đúng hướng, mỗi lần một xe; rẽ theo cung tròn, giảm tốc trong cua, bánh xe quay quanh trục của nó, không xe nào chồng lên xe nào.
  - Thẻ chữ vào bằng \`power3.out\` / \`expo.out\`; nhãn "ĐI TRƯỚC", "PHẢI NHƯỜNG" bật nhẹ một lần. Mỗi chi tiết hiện đúng lúc giọng đọc nói tới.
  - Khi nhắc tới một xe, vòng số hay ô chữ của xe đó sáng thành màu phát sáng, từng cái một theo nhịp đọc.
  - Chi tiết nhỏ trên bản đồ (các biển báo) được phóng to bằng kính lúp ngay trong cảnh 3D, kèm bảng tên đặt dưới kính.
- **Rhythm / held frames**: mỗi tình huống đi bốn khung Tình huống, Quy tắc, Xe chạy, Chốt. Khung Tình huống (1, 5, 9, 13) kết bằng một nhịp dừng ngắn khoảng 1,6–2 giây để người xem tự nghĩ, không có đồng hồ. Khung Xe chạy (3, 7, 11, 15) nhiều chuyển động nhất. Khung Chốt (4, 8, 12, 16) dừng để đọc thẻ mẹo nhớ. Khung 17 tóm bốn mẹo nhớ.
- **Framing variety**: khung 1-16 chia đôi, cột chữ bên trái (x 64-620), bản đồ 3D bên phải; khung 17 là toàn cảnh bốn nút giao, chữ ở dải trên. Trong cột chữ, bố cục đổi theo bước: bối cảnh và xe, thẻ quy tắc và thẻ biển, bảng lý do từng xe, thẻ chốt và mẹo nhớ.
- **Caption keep-out**
  - Phụ đề nằm ở ~17% dưới cùng (y > 896); mọi thẻ chữ kết thúc trên đường đó.
  - Khung không có nền riêng; nền là cảnh 3D ở lớp dưới cùng của index.
- **Language + Negative list**
  - Mọi chữ trên hình là tiếng Việt.
  - Video đứng một mình: vào thẳng tình huống 1, không có phần mở đầu, không giới thiệu loạt video; mọi hình đều vẽ lại, không ảnh chụp từ tài liệu nguồn.
  - Không số hiệu tình huống ngoài "Tình huống 1" đến "Tình huống 4"; không lời hay chữ nào nhắc tới nơi nguồn hay kỳ kiểm tra.
  - Không hiện hay đọc các lựa chọn trắc nghiệm; không đồng hồ đếm; không ô nào sáng xanh như một lựa chọn đúng.
  - Không dữ liệu cá nhân, token hay đường dẫn riêng.
  - Không \`repeat\`/\`yoyo\`/\`Math.random\`/\`@keyframes\`; không cảnh đêm; không camera bay vòng.
  - Cấm cả hai kiểu hỏng: "slideshow" (hiện hết trong 25% đầu rồi đứng im) và "screensaver" (nhiều thứ trôi lung tung).
`;

let md = `---
format: 1920x1080
duration: ${total}s
message: "${field("message")}"
arc: concept-explainer with process
audience: ${field("audience")}
mode: autonomous
music: curious, bright and friendly educational underscore, plucked marimba and soft pads, unobtrusive
---

# Đường ưu tiên ở ngã tư có biển: bốn tình huống

${direction}
`;
F.forEach((f, i) => {
  const n = i + 1, d = voiceDur(n);
  md += `## Frame ${n} — ${titles[i]}\n\n`;
  md += `- scene: ${f.scene}\n`;
  md += `- voiceover: "${vo[i].join(" ")}"\n`;
  md += `- duration: ${d}s\n`;
  md += `- transition_in: ${n === 1 ? "cut" : "crossfade"}\n`;
  md += `- status: outline\n`;
  md += `- src: compositions/frames/${frameId(n)}.html\n`;
  md += `- blueprint: compose\n`;
  md += `- sfx: ${f.sfx}\n`;
  if (f.sfx !== "none") md += `- sfx_at: ${r2(f.at)}\n`;
  md += `\n`;
  f.sc.forEach(([s, text], k) => {
    const e = k + 1 < f.sc.length ? f.sc[k + 1][0] : d;
    md += `Scene ${k + 1} (${r2(Math.max(0, s)).toFixed(1)}–${r2(e).toFixed(k + 1 < f.sc.length ? 1 : 2)}s): ${text}.\n`;
  });
  md += `\n`;
});
fs.writeFileSync(path.join(PROJECT, "STORYBOARD.md"), md);
fs.mkdirSync(path.join(PROJECT, ".hyperframes/frame-packets"), { recursive: true });
fs.writeFileSync(path.join(PROJECT, ".hyperframes/frame-packets/_video-direction.md"), direction);
console.log(`STORYBOARD.md: ${COUNT} frames, ${total}s`);
