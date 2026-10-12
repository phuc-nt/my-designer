// Writes STORYBOARD.md from SCRIPT.md (titles and the exact narration) and the real voice timings.
// Durations start as the voice file lengths; `audio.mjs sync-durations` rewrites them from audio_meta.json.
//   node scripts/build-storyboard.mjs
import fs from "node:fs";
import path from "node:path";
import { PROJECT, plan, B, K, rel, at, r2, voiceDur, script, COUNT } from "./frames.ctx.mjs";
import { frameId } from "./frames.kit.mjs";

const { titles, vo } = script();
const s502 = plan.sites[502], s504 = plan.sites[504], s506 = plan.sites[506];
const R = (n, abs) => rel(n, abs);

// per frame: scene (one line), sc: [start, text] phases, sfx + at (seconds in the frame)
const F = [
  {
    scene: "Toàn cảnh ba ô sa hình 3D dưới trời sáng: lúc đầu phủ màu giấy như ảnh in trong sách, rồi các xe lăn bánh; nhãn từng câu và bốn bước học hiện theo lời đọc",
    sc: [
      [0, `ba ô sa hình đứng yên dưới lớp màu giấy và bốn góc khung ảnh; thẻ "Sa hình trong sách" hiện ngay, dòng "một tấm hình đứng yên" theo lời đọc (${at(1, "một tấm hình")}s), hai nhãn "Mũi tên vẽ sẵn" (${at(1, "Mũi tên vẽ sẵn")}s) và "Xe chạy thế nào? Tự tưởng tượng" (${at(1, "còn xe chạy")}s)`],
      [R(1, B.intro.live), `"Hôm nay": lớp giấy tan, các xe lăn vào vị trí, mũi tên bắt đầu chạy; tiêu đề "Xe chạy thật" phóng vào giữa phía trên`],
      [R(1, B.intro.three), `ba nhãn "Câu 502 / 504 / 506" bật lên trên từng ô, rồi tên kiểu tình huống (đèn tín hiệu, vòng xuyến, biển báo) ở ${R(1, B.intro.kinds)}s`],
      [R(1, B.intro.four), `tiêu đề đổi thành "Mỗi câu · bốn bước"; bốn thẻ bước hiện lần lượt đúng từng cụm lời đọc (${B.intro.steps.map((t) => R(1, t)).join(", ")}s); nhãn ô tắt trước khi camera lướt sang câu 502`],
    ],
    sfx: "whoosh-short", at: R(1, B.intro.live) - 0.05,
  },
  {
    scene: "Camera cố định trên cao nhìn trọn ngã ba có đèn; cột chữ bên trái hiện đề bài từng chữ và bốn phương án nguyên văn",
    sc: [
      [0, `nhãn "Câu 502 · Đèn tín hiệu" và thanh bốn bước (bước 1 sáng); thẻ đề bài hiện từng chữ theo lời đọc từ ${R(2, B[502].tQ)}s; xe tải nháy vòng sáng khi được nhắc (${R(2, B[502].truckSay)}s)`],
      [R(2, B[502].opts[0].s), `bốn thẻ phương án trượt vào đúng lúc đọc số (${B[502].opts.map((o) => R(2, o.s)).join(", ")}s); mỗi chữ số hướng đi sáng thành ô vàng phát sáng đúng lúc được đọc, cùng nhịp với huy hiệu số trên bản đồ`],
      [R(2, B[502].ask), `thẻ "Bạn chọn phương án nào?" và vòng đếm ngược 3-2-1 đến hết khung`],
    ],
    sfx: "ping", at: 0.15,
  },
  {
    scene: "Kính lúp phóng to cột đèn trên bản đồ; cột chữ lần lượt hiện đèn chính đỏ, đèn phụ mũi tên xanh và quy tắc",
    sc: [
      [0, `thanh bước chuyển sang "Quy tắc"; nhãn "Nhìn cột đèn" và kính lúp mở trên cột đèn`],
      [R(3, B[502].red[0]), `thẻ "Đèn chính": đèn đỏ bật sáng, chữ "Đang đỏ"; nhãn "DỪNG" đập vào khi đọc "phải dừng" (${R(3, B[502].stop)}s)`],
      [R(3, B[502].aux[0]), `thẻ "Đèn phụ": mũi tên xanh bật sáng ở ${R(3, B[502].arrow)}s, chữ "chỉ sang phải"`],
      [R(3, B[502].allow), `thẻ quy tắc "Chỉ đi đúng hướng mũi tên" trượt lên, viền sáng ở ${R(3, B[502].hint)}s`],
    ],
    sfx: "chime", at: R(3, B[502].arrow),
  },
  {
    scene: "Xe tải bóng mờ chạy thử lần lượt hướng 4, 3, 2 và bị đánh dấu sai; rồi xe tải thật rẽ phải theo hướng 1",
    sc: [
      [0, `thanh bước chuyển sang "Xe chạy"; thẻ nhắc quy tắc; hàng "Hướng 4" hiện, xe bóng mờ vòng sang trái, dấu ✕ đỏ và lý do ở ${R(4, s502.tries[0].tWrong)}s`],
      [R(4, s502.tries[1].t0), `hàng "Hướng 3": xe bóng mờ đi thẳng, dấu ✕ ở ${R(4, s502.tries[1].tWrong)}s`],
      [R(4, s502.tries[2].t0), `hàng "Hướng 2": xe bóng mờ vào giữa nút giao rồi mới rẽ, dấu ✕ ở ${R(4, s502.tries[2].tWrong)}s`],
      [R(4, s502.T.blink), `hàng "Hướng 1": dấu ✓ xanh ở ${R(4, s502.T.green)}s, kính lúp cho thấy đèn phụ; nhãn "XE TẢI ĐI" bật lên và xe tải thật rẽ phải ở ${R(4, s502.T.go)}s`],
    ],
    sfx: "whoosh", at: R(4, s502.T.go),
  },
  {
    scene: "Bốn phương án quay lại, phương án 2 sáng xanh; thẻ ghi nhớ hai ý về đèn chính và đèn phụ",
    sc: [
      [0, `thanh bước chuyển sang "Đáp án"; bốn phương án nguyên văn trượt vào`],
      [R(5, B[502].ansSay), `phương án 2 "Chỉ hướng 1." đổi sang xanh, phát sáng, có dấu ✓; ba phương án còn lại mờ đi`],
      [R(5, B[502].rem), `thẻ "Nhớ nhé": "Đèn chính đỏ → dừng" (${R(5, B[502].red5[0])}s), "Đèn phụ cho phép → đi đúng hướng mũi tên" (${R(5, B[502].only)}s)`],
    ],
    sfx: "sparkle", at: R(5, B[502].ansSay) - 0.2,
  },
  {
    scene: "Camera lướt sang vòng xuyến bốn xe; đề bài hiện từng chữ, bốn phương án nguyên văn, tên xe sáng theo lời đọc",
    sc: [
      [0, `nhãn "Câu 504 · Vòng xuyến", bước 1 sáng; thẻ đề bài hiện từng chữ từ ${R(6, B[504].tQ)}s`],
      [R(6, B[504].opts[0].s), `bốn thẻ phương án trượt vào (${B[504].opts.map((o) => R(6, o.s)).join(", ")}s); mỗi tên xe sáng thành ô vàng đúng lúc được đọc, cùng nhịp với nhãn xe trên bản đồ`],
      [R(6, B[504].ask), `thẻ "Bạn chọn phương án nào?" và vòng đếm ngược`],
    ],
    sfx: "ping", at: 0.15,
  },
  {
    scene: "Vòng xuyến nhìn từ trên cao; cột chữ hiện ba ý: không có biển vòng xuyến, nhường xe bên phải, bên phải trống thì đi trước",
    sc: [
      [0, `thanh bước chuyển sang "Quy tắc"; thẻ "Vòng xuyến · bốn xe cùng muốn vào" (${R(7, B[504].four)}s)`],
      [R(7, B[504].noSign), `thẻ biển vòng xuyến bị gạch đỏ: "Không có biển đi theo vòng xuyến"`],
      [R(7, B[504].apply), `thẻ quy tắc "Nhường đường cho xe đi đến từ bên phải", cụm "bên phải" sáng ở ${R(7, B[504].rule)}s`],
      [R(7, B[504].free), `thẻ "Bên phải trống → đi trước" trượt lên`],
    ],
    sfx: "none",
  },
  {
    scene: "Bốn xe lần lượt vào vòng xuyến, mỗi lần một xe; trước khi đi, phía bên phải của xe được chiếu sáng; cột chữ ghi thứ tự",
    sc: [
      [0, `thanh bước chuyển sang "Xe chạy"; hàng "Xe mô tô": xét bên phải (${R(8, s504.T.right.moto)}s), trống (${R(8, s504.T.free.moto)}s), nhãn "ĐI" và số 1 xanh ở ${R(8, s504.T.go.moto)}s`],
      [R(8, s504.T.say.truck), `hàng "Xe tải": bên phải là mô tô (${R(8, s504.T.right.truck)}s), mô tô đã đi (${R(8, s504.T.free.truck)}s), "ĐI" ở ${R(8, s504.T.go.truck)}s`],
      [R(8, s504.T.say.bus), `hàng "Xe khách": bên phải là xe tải (${R(8, s504.T.right.bus)}s), xe tải đã đi (${R(8, s504.T.free.bus)}s), "ĐI" ở ${R(8, s504.T.go.bus)}s`],
      [R(8, s504.T.say.car), `hàng "Xe con": bên phải là xe khách (${R(8, s504.T.right.car)}s), xe khách đã đi (${R(8, s504.T.free.car)}s), "ĐI" ở ${R(8, s504.T.go.car)}s; xe con chạy hết vòng`],
    ],
    sfx: "whoosh", at: R(8, s504.T.go.moto),
  },
  {
    scene: "Bốn phương án quay lại, phương án 3 sáng xanh và từng tên xe sáng theo lời đọc; thẻ mẹo nhớ",
    sc: [
      [0, `thanh bước chuyển sang "Đáp án"; bốn phương án nguyên văn trượt vào`],
      [R(9, B[504].ans) + 1.0, `phương án 3 đổi sang xanh, có dấu ✓; bốn tên xe trong đó sáng lần lượt (${B[504].say9.map((m) => R(9, m.s)).join(", ")}s)`],
      [R(9, B[504].tip), `thẻ "Mẹo nhớ": "Bên phải trống → đi trước", rồi "Xe đi xong mở đường cho xe kế tiếp" (${R(9, B[504].next)}s)`],
    ],
    sfx: "sparkle", at: R(9, B[504].ans) + 0.9,
  },
  {
    scene: "Camera lướt sang ngã tư có biển báo; đề bài hiện từng chữ, ba phương án nguyên văn",
    sc: [
      [0, `nhãn "Câu 506 · Biển báo", bước 1 sáng; thẻ đề bài hiện từng chữ từ ${R(10, B[506].tQ)}s`],
      [R(10, B[506].opts[0].s), `ba thẻ phương án trượt vào (${B[506].opts.map((o) => R(10, o.s)).join(", ")}s); tên xe sáng thành ô vàng đúng lúc được đọc, cùng nhịp với nhãn xe trên bản đồ`],
      [R(10, B[506].ask), `thẻ "Bạn chọn phương án nào?" và vòng đếm ngược`],
    ],
    sfx: "ping", at: 0.15,
  },
  {
    scene: "Kính lúp phóng to từng biển báo, có bảng tên biển ngay dưới kính; tuyến đường ưu tiên được tô xanh",
    sc: [
      [0, `thanh bước chuyển sang "Quy tắc"; thẻ "Không có đèn tín hiệu → nhìn biển báo" (${R(11, B[506].signs)}s)`],
      [R(11, B[506].A), `kính lúp mở trên biển phía xe A và phía xe tải; thẻ biển tam giác ngược, bảng tên "Giao nhau với đường ưu tiên" dưới hai kính (${R(11, B[506].nameY)}s), nhãn "NHƯỜNG" ở ${R(11, B[506].yield)}s`],
      [R(11, B[506].B), `kính lúp mở trên biển phía xe B; thẻ biển tam giác, bảng tên "Giao nhau với đường không ưu tiên" (${R(11, B[506].nameP)}s), nhãn "ƯU TIÊN" và dải đường ưu tiên tô xanh ở ${R(11, B[506].pri)}s`],
      [R(11, B[506].first), `thẻ chốt "Đường ưu tiên → đi trước" trượt lên`],
    ],
    sfx: "chime", at: R(11, B[506].pri),
  },
  {
    scene: "Xe B đi thẳng qua ngã tư trên dải đường ưu tiên; xe A và xe tải đứng chờ",
    sc: [
      [0, `thanh bước chuyển sang "Xe chạy"; ba hàng xe hiện; xe B chạy, nhãn "ĐI TRƯỚC" ở ${R(12, s506.T.go)}s`],
      [R(12, B[506].wait), `nhãn "CHỜ" bật lên ở hàng Xe con (A) rồi hàng Xe tải; xe B ra khỏi ngã tư`],
    ],
    sfx: "whoosh", at: R(12, s506.T.go),
  },
  {
    scene: "Ba phương án quay lại, phương án 2 sáng xanh; thẻ ghi nhớ hai ý về đường ưu tiên",
    sc: [
      [0, `thanh bước chuyển sang "Đáp án"; ba phương án nguyên văn trượt vào`],
      [R(13, B[506].ansSay), `phương án 2 "Xe con (B)." đổi sang xanh, phát sáng, có dấu ✓`],
      [R(13, B[506].rem), `thẻ "Nhớ nhé": "Gặp biển giao nhau với đường ưu tiên → nhường" (${R(13, B[506].yield13)}s, kính lúp mở lại trên biển phía xe A), "Xe trên đường ưu tiên → đi trước" (${R(13, B[506].pri13)}s)`],
    ],
    sfx: "sparkle", at: R(13, B[506].ansSay) - 0.2,
  },
  {
    scene: "Camera lùi ra toàn cảnh ba ô; ba thẻ quy tắc hiện trên từng ô khi xe ở ô đó chạy lại; lời chúc cuối",
    sc: [
      [0, `tiêu đề "Ba câu, ba cách nhìn" trượt xuống giữa phía trên`],
      [R(14, B.recap.r502), `thẻ trên ô 502 "Có đèn tín hiệu → theo đèn"; thẻ trên ô 506 "Không có đèn → nhìn biển báo" (${R(14, B.recap.r506)}s); thẻ trên ô 504 "Không đèn, không biển → nhường xe đến từ bên phải" (${R(14, B.recap.r504)}s); xe ở từng ô chạy lại đúng đáp án`],
      [R(14, B.recap.bye), `tiêu đề đổi thành "Chúc bạn ôn thi thật vững."; nhãn nhỏ "Giọng đọc tổng hợp bằng AI"`],
    ],
    sfx: "chime", at: R(14, B.recap.bye),
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
  - Màu có nghĩa cố định trong cả video: vàng hổ phách = đang xét, đỏ = sai / dừng / nhường, xanh lá = đúng / được đi.
  - Gradient hồng-tím-xanh chỉ dùng một lần mỗi khung, cho cụm chữ chốt.
- **Type**
  - Plus Jakarta Sans 700-800 cho đề bài, phương án, quy tắc; JetBrains Mono IN HOA giãn 0.14em cho nhãn nhỏ và thanh bước.
  - Font tiếng Việt trong \`assets/fonts/\` (frame.md § Font faces), line-height tiêu đề ≥ 1.1, không cắt chiều dọc hộp chữ.
  - Đề bài, phương án và đáp án hiện nguyên văn như trong sách, kể cả số thứ tự phương án.
- **Motion grammar**
  - Camera 3D đứng yên trên cao, mỗi câu một góc nhìn trọn nút giao; chỉ lướt một lần khi đổi câu. Không bay, không xoay, không zoom.
  - Xe chạy đúng thứ tự và đúng hướng, mỗi lần một xe; rẽ theo cung tròn, giảm tốc trong cua, không xe nào chồng lên xe nào.
  - Thẻ chữ vào bằng \`power3.out\` / \`expo.out\`; dấu ✓ ✕ và nhãn "ĐI" bật nhẹ một lần. Mỗi chi tiết hiện đúng lúc giọng đọc nói tới.
  - Khi nhắc tới một con số hay một tên xe, chữ đó sáng thành ô màu phát sáng, từng cái một theo nhịp đọc.
  - Chi tiết nhỏ trên bản đồ (cột đèn, biển báo) được phóng to bằng kính lúp ngay trong cảnh 3D.
- **Rhythm / held frames**: khung đề bài (2, 6, 10) có 2,6 giây đếm ngược để người xem tự chọn; khung xe chạy (4, 8, 12) dài nhất và nhiều chuyển động nhất; khung đáp án (5, 9, 13) dừng để đọc.
- **Framing variety**: khung 1 và 14 là toàn cảnh ba ô, chữ ở dải trên; khung 2-13 chia đôi: cột chữ bên trái (x 64-620), bản đồ 3D bên phải. Trong cột chữ, bố cục đổi theo bước: đề bài + phương án, thẻ quy tắc có hình, danh sách chạy thử, đáp án + ghi nhớ.
- **Caption keep-out**
  - Phụ đề nằm ở ~17% dưới cùng (y > 896); mọi thẻ chữ kết thúc trên đường đó.
  - Khung không có nền riêng; nền là cảnh 3D ở lớp dưới cùng của index.
- **Language + Negative list**
  - Mọi chữ trên hình là tiếng Việt.
  - Không dùng ảnh chụp trang sách; mọi hình đều vẽ lại.
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

# Sa hình 3D: câu 502, 504, 506

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
    md += `Scene ${k + 1} (${r2(s).toFixed(1)}–${r2(e).toFixed(k + 1 < f.sc.length ? 1 : 2)}s): ${text}.\n`;
  });
  md += `\n`;
});
fs.writeFileSync(path.join(PROJECT, "STORYBOARD.md"), md);
fs.mkdirSync(path.join(PROJECT, ".hyperframes/frame-packets"), { recursive: true });
fs.writeFileSync(path.join(PROJECT, ".hyperframes/frame-packets/_video-direction.md"), direction);
console.log(`STORYBOARD.md: ${COUNT} frames, ${total}s`);
