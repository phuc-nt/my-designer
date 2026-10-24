# Thế giới 3D: toạ độ, camera và API của engine

Engine nằm trong `assets/lib/world/` của dự án (chép từ `kit/`). Bốn tệp riêng của video (`plan.js`, `roads.js`, `beats.js`, `sites.js`) dùng các hàm dưới đây. Đọc mã của ví dụ song song với tệp này.

## 1. Luật chung

- **Mọi thứ là hàm thuần của thời gian.** `renderAt(t)` vẽ đúng khung của giây `t`, gọi theo thứ tự nào cũng ra cùng một hình. Không `Math.random()`, không `Date.now()`, không trạng thái tích luỹ giữa hai lần vẽ. Cần ngẫu nhiên thì dùng `rng(seed)` của `path.js`.
- **Mốc thời gian lấy từ lời đọc**, qua `cueKit` (§4). Không gõ số giây vào mã; đổi giọng là mọi thứ dời theo.
- `path.js` và `stage.js` không dùng three.js hay DOM, nên `scripts/audit-motion.mjs` chạy được trong Node. Giữ `plan.js` như vậy: không import `models.js`, `fx.js` hay `sitekit.js` vào `plan.js`.

## 2. Toạ độ

| Hệ | Quy ước |
|---|---|
| Ô (site) | x = đông, z = nam (bắc là −z), mét, gốc ở tâm nút giao |
| Hướng đi `h` (độ) | 0 = nam, 90 = đông, 180 = bắc, −90 = tây. Rẽ trái làm `h` tăng |
| Mô hình | mũi xe = +z, bên trái = +x, trên = +y, mét |
| Màn hình | 1920×1080, gốc ở góc trên trái (dùng cho `ox`, `oy`, và `b.off`) |

Mỗi câu là một ô tròn bán kính `RIM` = 42 m. Các ô đứng thành một hàng theo x, cách nhau `TILE_GAP` = 92 m: `TILE_X = tileRow([502, 504, 506])` cho `{ 502: -92, 504: 0, 506: 92 }`. `TILE_ROT[id]` xoay cả ô quanh trục đứng (độ) để nút giao nằm giống hình trong sách. Đường đi kết thúc ở `EDGE` = 41 m; xe mờ dần trong 5 m cuối trước khi ra khỏi ô.

## 3. Camera

Camera phối cảnh 30°, luôn nghiêng `PITCH` = 51° so với mặt đất, nhìn về phía bắc. Không có tham số xoay: góc nhìn cố định là yêu cầu của người dùng.

```js
export const VIEWS = {
  wide: { tx: 0, tz: 0, d: 315, ox: 0, oy: -60 },                   // thấy cả ba ô
  502: { tx: TILE_X[502], tz: 4, d: 118, ox: -320, oy: 100 },       // một câu
};
```

| Trường | Nghĩa |
|---|---|
| `tx`, `tz` | điểm nhìn trên mặt đất (toạ độ thế giới; ô `id` nằm ở x = `TILE_X[id]`) |
| `d` | khoảng cách camera, mét. Nhỏ hơn là gần hơn. Một mét trên đất ≈ `FOCAL / d` pixel |
| `ox`, `oy` | dời khung hình, pixel. `ox: -320` đẩy nút giao sang phải 320 px để nhường chỗ cho cột chữ bên trái; `oy` dương đẩy hình lên |

`VIEWS.wide` bắt buộc phải có: engine tính `wide = clamp((d − 130) / (VIEWS.wide.d − 130))` (0 = đang ở một câu, 1 = đang nhìn cả hàng). Vì vậy góc nhìn của từng câu phải có `d` ≤ 130 và `VIEWS.wide.d` phải lớn hơn 130.

`plan.shots` là danh sách cảnh. Camera đứng yên ở mỗi cảnh và chỉ lướt một lần sang cảnh kế:

```js
plan.shots = [
  { T: 0, view: "wide" },
  { T: C.start(2) + 0.3, view: 502, move: 2.2 },   // tới nơi lúc T, bắt đầu lướt lúc T − move
];
```

**Chọn `d`:** đủ gần để nút giao gần chạm mép vùng hình (người dùng chê bản đầu còn nhiều khoảng trống), đủ xa để xe đứng chờ ở cả các nhánh vẫn nằm trong khung. Chụp một ảnh lúc mọi xe đang đứng chờ để kiểm.

## 4. Mốc lời đọc: `cueKit`

`scripts/build-cues.mjs` ghi `cues.js` (`CUES.frames[n-1] = { n, start, dur, words: [{ w, s, e }] }`, giây tuyệt đối của video). Trong `plan.js`:

```js
const C = cueKit(CUES);
C.at(4, "Xe tải đi", { d: 0.1 })        // giây bắt đầu cụm đó trong khung 4, cộng 0,1
C.at(1, "Mỗi câu", { nth: 2 })          // lần xuất hiện thứ hai
C.at(5, "phương án ba", { end: true })  // giây kết thúc cụm
C.words(2, "hướng hai")                 // các chữ của cụm, kèm s và e
C.mentions(8, dict)                    // mỗi lần nhắc tên xe: [{ id, s, e }]; dict = { chữ: id }
C.mentions(10, { a: "A", b: "B", tải: "T" }, ["con", "xe"])         // "xe con B": lùi mốc về chữ "xe"
C.start(n), C.end(n), C.total
```

- So khớp không phân biệt hoa thường và bỏ dấu câu `.,:;!?"“”()`. Chữ phải đúng như **lời đã đọc** (bản `say` nếu có), không phải chữ in trong `SCRIPT.md`: "Câu 502" tìm bằng "câu năm trăm lẻ hai".
- Không thấy thì ném `cue not found: frame N "…" #nth`. Đó là lỗi có ích: cụm sai chữ, sai khung, hoặc giọng đọc thiếu chữ.
- Số đọc liền nhau ("hai, ba, bốn") bị máy canh chữ dồn vào vài phần trăm giây. Đừng lấy mốc từng số bằng `C.at`; chia đều khoảng của cả phương án như `option()` trong `beats.js` của ví dụ.

## 5. Đường đi và xe: `path.js`

```js
const p = pen(x, z, headingDeg)   // bút vẽ đường: toạ độ ô, hướng theo §2
  .line(12)                       // thẳng 12 m
  .lineToZ(-5.5)                  // thẳng tới z = −5,5 (hướng phải đang chỉ về phía đó)
  .arc(9, -90)                    // cung bán kính 9 m; độ > 0 rẽ trái, < 0 rẽ phải
  .lineToX(EDGE)
  .done();                        // → { L, at(s) → { x, z, yaw, k }, kmax(s0, s1), nearest(x, z) }
```

`done({ soft: 0 })` tắt bước làm mềm chỗ nối thẳng và cung (dùng cho đường vẽ mũi tên, không dùng cho đường xe chạy).

```js
const a = new Actor("truck", "lorry");      // id, loại trong DIMS; { ghost: true } cho xe "giả sử"
a.show(t, 0.45); a.hide(t, 0.35);
a.hold(t, path, s);                          // đứng ở mét thứ s của đường, từ giây t
const run = a.go(t, path, s0, s1, { vmax: 9, alat: 2.2, acc: 2.4, dec: 2.6, v0: 0, v1: 0 });
run.t1                                       // giây chạy xong
a.pose(t)   // → { x, z, yaw, k, v, acc, dist, steer, vis, s, path }, hoặc null khi xe chưa có đoạn hold/go nào
```

- `go` tự tính tốc độ: tăng tốc `acc`, giảm tốc `dec`, và chậm lại trong cua sao cho gia tốc ngang không quá `alat`. Vì vậy xe rẽ mượt mà không cần chỉnh tay.
- **`v1` mặc định là 0: xe phanh dừng ở cuối đoạn.** Xe đi ra khỏi ô phải có `v1: vmax` và đường kết thúc ở `EDGE`, nếu không nó phanh ngay trước mép ô.
- Xe chạy bằng hai điểm cách nhau nửa chiều dài cơ sở, nên thân xe quét cua như xe thật.
- `rollUp(a, path, roll, tGo, tHand)` (`stage.js`): xe đứng lùi lại `roll` mét, lăn tới chỗ chờ lúc `tGo`, rồi giao cho đường chính lúc `tHand`. Dùng cho màn mở đầu.
- `checkClips(plan)`: gọi ở cuối `buildPlan`; ném lỗi khi các đoạn của một xe sai thứ tự thời gian.

| `DIMS` | Mô hình | Tỉ lệ | Dài × rộng (m) | Ghi chú |
|---|---|---|---|---|
| `car` | car-red, car-purple | 1,2 | 4,9 × 2,1 | |
| `truck` | truck-teal, truck-dark | 1,0 | 7,45 × 2,4 | |
| `lorry` | truck-teal, truck-dark | 1,3 | 9,7 × 3,1 | xe tải đứng một mình trên đường rộng |
| `bus` | bus | 0,9 | 9,4 × 2,25 | |
| `moto` | moto | 2,0 | 4,1 × 1,6 | phóng to cho dễ thấy; tự nghiêng khi vào cua |

Tỉ lệ không theo đời thật: mỗi loại được chỉnh để đọc rõ từ góc nhìn trên cao. Xe sẫm màu trên mặt đường xám khó thấy; ưu tiên `truckTeal`, `carRed`, `carPurple`.

## 6. Mô hình: `models.js`

`T = await loadTemplates(base)` do engine gọi; mỗi hàm dựng ô nhận `T`.

```js
const v = makeVehicle(T, "lorry", "truckTeal");          // loại trong DIMS, tên trong FILES; { ghost: true } = bản mờ
v.set(a.pose(t), t, { blinkL, blinkR, brake, alpha });   // đặt xe, quay bánh, bẻ lái, đèn
v.tilt.add(roofLetter("A", 1.5));                        // gắn chữ cái lên nóc

const s = makeSignal(T, { scale: 4.4, sink: 7.6 });      // cột đèn; s.set({ red, aux, redGlow, auxGlow })
s.headPos()                                              // điểm để kính lúp nhắm vào

const g = makeSign(T, "yield", { sub: "left" });         // "yield" | "priority" | "stop" | "diamond"; g.set(k): k = 0–1 phóng biển to thêm tới 22% khi đang được chỉ vào
g.center()                                               // điểm để kính lúp nhắm vào
```

- `FILES`: `carRed`, `carPurple`, `truckTeal`, `truckDark`, `bus`, `moto`, `signal`, `post`, `lamp`, `tree`, `cone`, `bollard`. Thứ không có rig riêng (cột đèn đường, nón, trụ chắn) dùng `instance(T.cone)` rồi tự đặt vị trí.
- **`makeSignal` đang vẽ cứng tình huống của câu 502:** đèn chính đỏ, đèn phụ là mũi tên xanh chỉ sang phải. Trạng thái hay hướng mũi tên khác cần sửa hàm đó (`new-cases.md` §4).
- `makeSign(T, kind, { size, post, lean, sub, back })` có bốn mặt biển: `"yield"` (tam giác vàng viền đỏ, đỉnh chúc xuống), `"priority"` (tam giác đỉnh lên, mũi tên đậm cắt vạch ngang), `"stop"` (bát giác đỏ), `"diamond"` (hình thoi vàng). `sub: "left" | "right" | "blank"` treo biển phụ hướng đường ưu tiên bên dưới. `back: true` cho thấy mặt sau màu xám (biển của nhánh đi về phía camera). Mặt biển khác: `new-cases.md` §4.
- Biển và đèn được vẽ **to hơn thật và ngả về phía camera** (`lean`), vì nhìn từ trên xuống một tấm biển thẳng đứng chỉ còn là một vạch.

## 7. Mặt đường: `ground.js`

Mặt đường là một canvas 2D vẽ bằng mét rồi dán lên ô, nên vạch sơn nằm đúng chỗ `plan.js` tính.

```js
function paint502() {
  const { c, g, r } = sheet(502);             // nền cỏ; g = context đã đổi sang mét; r = rng
  lay(g, [outline], r);                       // vỉa hè, bó vỉa, nhựa đường cho mỗi đường viền
  zebra(g, ox, oz, ux, uz, W, D);             // vạch người đi bộ
  line(g, x0, z0, x1, z1, 0.22, [3, 3]);      // vạch kẻ, liền hoặc đứt [vẽ, hở]; tham số thứ tám là màu (mặc định COL.mark)
  return c;
}
```

Mỗi đường viền trong `lay` là một hàm `(g) => { g.moveTo…; g.lineTo…; g.arc… }` vẽ phần lòng đường; làn đường kéo dài tới `FAR` = 60 m, quá mép ô. `COL` giữ màu cỏ, vỉa hè, bó vỉa, nhựa, sơn.

## 8. Thứ vẽ trên đường: `fx.js`

| Hàm | Vẽ gì | `set` |
|---|---|---|
| `ribbon(path, s0, s1, { width, color, y, head, dash, pitch, border, order })` | mũi tên chạy theo đường đi | `{ k, alpha, color, flow, chev, glow, lift, dim }` |
| `straight(x0, z0, x1, z1, o)` | mũi tên thẳng (cùng tuỳ chọn) | như trên |
| `tag(text, { h, kind, base, hot, glow })` | nhãn cỡ cố định trên màn hình | `.at(x, y, z)`, `.set({ k, hot, ppm, alpha })` |
| `zone(len, wid)` | khung đứt nét trên mặt đất | `{ alpha, color, k }` |
| `halo(r)` | vòng sáng dưới xe | `{ alpha, color, t, x, z }` |
| `slab(len, wid, color)` | chữ nhật trên đường (vạch dừng nháy) | `set(alpha)` |
| `roofLetter(ch, size)` | chữ cái trên đĩa trắng, gắn lên nóc xe | |

- `ribbon.set`: `k` = phần đã vẽ (0–1, đầu mũi tên chạy theo); `flow` = mét mà hoa văn chữ V trôi tới (truyền một giá trị tăng theo `t`); `chev: 0` tắt chữ V; `glow` = quầng sáng; `lift` = nâng lên trên các mũi tên khác; `dim` = nhạt dần về màu sơn đường, dùng cho hướng đang không được nhắc. Dùng `dim`, đừng dùng `alpha` để làm nhạt: mũi tên nửa trong suốt trông bẩn.
- Dải màu phủ cả một con đường (đường ưu tiên của 506): `flow: 0, chev: 0`, kẻo chữ V đọc thành hướng đi.
- `tag`: `kind` là `"pill"` (chữ) hay `"badge"` (số, hoặc `"v"`, `"x"` vẽ thành dấu). `base`, `hot` chọn trong `base` (chàm), `hot` (hổ phách), `num` (trắng), `red`, `green`, `sky`; `hot: null` khi nhãn không cần sáng lên. `set({ hot })` 0–1 phủ kiểu `hot` lên kèm quầng sáng: đây là cách làm số phương án sáng mạnh theo nhịp đọc.
- `INK`: `amber`, `red`, `green`, `navy`, `white`, `sky`, `ink`, `grey`. Hổ phách = đang nói tới; xanh lá = được đi, đúng; đỏ = dừng, nhường, sai; xanh trời = chỉ dẫn phụ.

## 9. Kính lúp: `lens.js`

Kính lúp vẽ lại cảnh thật qua một ống kính hẹp của cùng camera, nên hình trong kính sắc nét chứ không phải ảnh phóng to. Mỗi ô trả về danh sách:

```js
{ t0, t1,                       // mở và đóng (giây)
  pos: signal.headPos,          // hàm trả điểm thế giới cần soi
  r: 124,                       // bán kính kính trên màn hình (pixel)
  zoom: 3.0,
  acc: accent(INK.amber),       // màu viền
  hand: HAND }                  // tay cầm chỉ xuống phải (HAND) hay lên phải (HAND_UP)
```

- **Kính vẽ ngay tại điểm `pos` chiếu lên màn hình**, tức là trên chính vật nó phóng to. Không có tham số vị trí; trường `glass: [x, y]` của mã cũ bị bỏ qua.
- **Trong lúc có kính mở, cả cảnh 3D chuyển xám.** `lens.js` vẽ lại cảnh vào một lớp phủ xám toàn màn hình; lớp này hiện lên trong 0,3 giây khi kính mở và tan đi khi kính đóng. Nhãn vẫn thấy trong lớp xám, và bị ẩn trong kính. Cột chữ HTML không đổi màu.
- Nhiều nhất **ba** kính mở cùng lúc. Kính của hai biển gần nhau sẽ đè lên nhau: mở lần lượt.
- Cỡ, độ phóng và hướng tay cầm để trong `GLASS` của `plan.js` (`series.md` §5). Tay cầm chỉ về phía bãi cỏ.
- Không có bảng tên trên bản đồ; tên biển nằm ở thẻ của cột chữ.
- Kính che một phần xe đứng cạnh biển; đừng mở kính trong lúc xe chạy.
- **Luôn cắt ảnh kính ở độ phân giải đầy đủ để đọc** (`qa.md` §3). Chi tiết nằm sau một lớp trong suốt có thể biến mất trong kính mà ảnh thu nhỏ không cho thấy.

## 9b. Đường dẫn, viền mực, camera trực giao (`STYLE`, bản thử)

Thử trên V02 ở dự án `chuong-6-v02-paper` (2026-10-23), **chưa được duyệt làm kiểu mặc định**. Không có `STYLE` thì thế giới vẽ y như cũ: đã so ảnh của V02 với kit cũ, 5/5 khung giống từng byte.

`plan.js` có thể xuất `STYLE`; mọi khoá đều tuỳ chọn:

```js
export const STYLE = {
  ortho: true,      // camera trực giao, cùng góc nghiêng; d là chiều cao vùng nhìn (FOCAL / d pixel một mét ở mọi chỗ)
  paper: true,      // trời, nền, ánh sáng màu giấy kem #f6eddd
  ground: { grass, walk, kerb, road, mark, edge },   // ghi đè COL của ground.js; edge = nét mực dọc lề
  ink: { color: "#18213d", skip: [] },               // viền mực trên mọi mô hình GLB; skip = khoá mẫu không viền
  callout: { ink: "#18213d", halo: "#fffaf0" },      // màu nét đường dẫn và viền sáng quanh nó
};
```

- **Viền mực** là `EdgesGeometry(geom, 30)` gắn vào mỗi mesh có `userData.ink` (khoá mẫu, do `loadTemplates` gắn). Xe ảo không viền. Nét mờ theo độ mờ của xe. Mặt đường, vạch sơn và cỏ không viền.
- **Đường dẫn:** mỗi ô trả thêm `calloutItems`, `callout.js` vẽ sau kính lúp:

```js
{ t0, t1,                       // hiện và tắt (giây); nét tự vẽ ra trong 0,3 s, tắt trong 0,25 s
  pos: () => Vector3,           // điểm thế giới của vật
  to: [x, y],                   // mép thẻ trong cột chữ, toạ độ 1920×1080
  acc: accent(INK.amber) }      // màu chấm và vòng trên vật
```

  - Nhiều nhất hai đường cùng lúc. Không vẽ khi có kính mở: `lens.render()` trả về số kính đang mở.
  - Nét đứt tự ngắt ở chỗ đi qua một nhãn `tag()`, nên tên trên đường không bị gạch ngang.
  - Mốc lấy từ lời đọc, và **không bắt đầu khi xe còn chạy**. `sites.js` của dự án thử có hàm `pointAt()`:
    - mỗi lần chỉ một đường, nên hai đường không cắt nhau;
    - đường bắt đầu ở mốc muộn nhất trong ba mốc: lúc xe được gọi tên, lúc xe dừng hẳn + 0,15 s, và lúc đường trước bắt đầu + 1,4 s.
  - Toạ độ `y` của từng dòng thẻ phải đo trên ảnh chụp, vì cột chữ là HTML và không chia sẻ toạ độ với thế giới 3D.

**Phát thế giới trên một trang web** (bản thử: `projects/sat-hach-lai-xe/web/chuong-6-v02`). Video chỉ truyền `canvas`, nên các tuỳ chọn dưới đây không đổi gì trong video:

- `createWorld({ canvas, centre: true, callouts: false })`:
  - `centre` bỏ độ lệch khung nhìn dành cho cột chữ, để ô nằm giữa canvas;
  - `callouts: false` bỏ đường dẫn, vì đầu kia của chúng nằm trong cột chữ, mà trang không có cột chữ.
- `setLabels(on)` ẩn hoặc hiện mọi nhãn bằng một nút.
- `actorsOnScreen()` trả về `[{ site, id, x, y }]` theo toạ độ canvas 1920×1080. Một ô muốn cho chạm vào xe thì trả thêm `actors: [{ id, obj }]`.
- Trang gọi `renderAt(audio.currentTime)` trong vòng rAF. Âm thanh là track của MP4 đã render, chép bằng `-c:a copy`.
- Cloudflare Pages trả cả tệp cho yêu cầu Range, nên trang tải âm thanh về thành blob rồi mới phát.

## 10. Dựng một ô: `sitekit.js`

```js
const tile = (id) => base({ x: TILE_X[id], rot: TILE_ROT[id], ground: PAINT[id]() });

export function site502(T, plan, B) {
  const b = tile(502);
  planting(b, ROAD[502], T, 5021, [g.signal]);   // cây và bụi, tránh lòng đường và các điểm trong danh sách
  // … dựng xe, mũi tên, nhãn, đèn; b.root.add(…)
  function update(t, { ppm, wide }) { /* đặt mọi thứ theo t */ }
  return { id: 502, root: b.root, x: TILE_X[502], update, lensItems };
}
export const SITES = [site502, site504, site506];
```

| `b.` | Việc |
|---|---|
| `root` | nhóm của ô; thêm mọi thứ vào đây, bằng toạ độ ô |
| `label(text, o)` | tạo một `tag` đã gắn vào ô |
| `facing(x, z, obj)` | đặt biển hay đèn ở (x, z), quay mặt về camera |
| `off(dx, dy, ppm)` | đổi một khoảng lệch tính bằng pixel màn hình thành mét trong ô (đã tính góc xoay của ô) |

Hàm phụ: `blend(a, b, k)` trộn hai màu; `hit(list, id, t)` = 0–1, xe `id` có đang được nhắc tên không (theo danh sách của `C.mentions`); `beat(t)` nhịp đập nhẹ. Từ `path.js`: `seg`, `win`, `pop`, `flash`, `easeOut`, `easeInOut`, `lerp`, `clamp` để biến mốc thời gian thành giá trị 0–1.

Trong `update`:

- `ppm` = pixel mỗi mét lúc này; truyền vào mọi `tag.set`.
- `wide` = 0 khi đang ở câu này, 1 khi nhìn cả hàng. Nhãn chi tiết nhân với `1 - wide` để tự ẩn ở toàn cảnh.
- Nhãn đi theo xe lấy vị trí từ `pose`, và nhân `alpha` với `pose.vis` để mờ cùng xe.

## 11. Hợp đồng giữa bốn tệp

```
cues.js ──► plan.js ──► beats.js ──► sites.js   (lớp 3D)
               │            └──────► build-frames.mjs (lớp chữ)
               └──► audit-motion.mjs
```

**`plan.js`** xuất `TILE_X`, `TILE_ROT`, `VIEWS`, `GLASS`, các bảng số đo, và:

```js
export function buildPlan(CUES) → {
  C,                                   // cueKit
  sites: { [id]: { paths, actors, byId, T, … } },   // T = các mốc của ô: go, gone, say…
  shots: [{ T, view, move }],
  live,                                // giây thế giới bắt đầu "sống" (mũi tên bắt đầu trôi)
  side: { in, out },                   // giây tấm nền cột chữ trượt vào và trượt ra
}
```

**`beats.js`** xuất `buildBeats(plan)` → một đối tượng mốc theo từng câu (`B[502].opts`, `B[502].red`…). Mọi mốc mà **cả hình lẫn chữ** cùng phản ứng phải nằm ở đây, để hai lớp không lệch nhau.

**`roads.js`** xuất `PAINT[id]()` (canvas mặt đường) và `ROAD[id](x, z, m)` (điểm có nằm trên đường hay sát đường trong vòng `m` mét không; `planting` dùng để không trồng cây giữa đường).

**`sites.js`** xuất `SITES`: mảng hàm `(T, plan, beats) => { id, root, x, update, lensItems, calloutItems? }`, theo thứ tự các ô.

## 12. Xem thử

- `node scripts/audit-motion.mjs --verbose`: bảng từng xe (tốc độ quay lớn nhất, gia tốc ngang, tốc độ cao nhất) và các cặp xe chạm nhau, không cần trình duyệt.
- `bash scripts/snap.sh <tên> <t1,t2,…>`: ảnh của các giây đó, vào `snapshots/<tên>/`.
- `hyperframes snapshot --at <t> --zoom "x,y,w,h" --zoom-scale 2 -o snapshots/zoom`: phóng một vùng.
