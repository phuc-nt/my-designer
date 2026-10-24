# Chuyến xe và cảnh 3D

Lớp 3D là `compositions/world.html`: hai canvas 1920×1080 (cảnh three.js, và lớp 2D "trên kính"), gọi `createWorld({ canvas, fx })` của `assets/lib/world/world.js` rồi vẽ lại mỗi lần HyperFrames tua tới một thời điểm. **Mỗi khung hình là hàm thuần của thời gian**: không trạng thái tích luỹ, không `Math.random`, không `Date.now`. Tua tới giây nào cũng ra đúng một ảnh.

```
cues.js   (build-cues.mjs sinh từ giọng đọc; không sửa tay, không cat cả tệp)
   │
beats.js  buildBeats(K)        mốc có tên, tính bằng giây tuyệt đối          ← bài viết
   │
drive.js  buildDrive(CUES, B)  chuyện gì đang xảy ra ở giây t (thuần số)     ← bài viết
   │
world.js  createWorld()        dựng xe, đặt máy quay, nhãn, bảng đồng hồ     ← bài viết
   │
road.js + hud.js               sân khấu và lớp kính                          ← kit
path.js, stage.js, models.js, three-bundle.js                                ← engine chung (chuong-6-sa-hinh-va-xu-ly-tinh-huong-video)
```

Không bao giờ `grep` hay `cat` `assets/lib/three-bundle.js`.

## 1. Hệ toạ độ (`geom.js`)

Xe của người xem đứng ở `z = 0`, mũi hướng `+z`; thế giới trôi về phía sau. Bên trái xe là `+x`. Xe chạy bên phải, nên làn của mình là `x = -LANE`, làn ngược chiều là `x = +LANE`. Đơn vị là mét.

| Hằng | Giá trị | Nghĩa |
|---|---|---|
| `LANE` | 1.75 | tim làn cách tim đường |
| `HALF` | 3.5 | nửa bề rộng mặt đường |
| `BAY_X`, `BAY_HALF` | −5.2, 21 | chỗ xe đứng trong chỗ dừng xe ở lề phải, và nửa chiều dài chỗ đó |
| `BUMPER` | 2.46 | cản trước cách tâm xe |
| `EYE` | `{ left: 0.42, y: 1.3, fwd: 0.15 }` | mắt người lái so với tâm xe |
| `TRUCK_HALF` | 3.72 | nửa chiều dài xe tải |
| `SCALE_MAX` | 120 | số mét ứng với một thanh đầy của bảng đồng hồ |

`stopDist(v, react = 1.2, decel = 5)` cho quãng xe còn đi trước khi dừng hẳn (m, với `v` là m/s). **Các độ dài này là minh hoạ**: video so chúng với nhau và không in con số nào, trừ khi bài nêu.

## 2. `beats.js`

`buildBeats(K)` trả về `B`. `K` là `cueKit(CUES)` của `stage.js`:

- `K.at(n, "cụm từ", { nth, end, d })`: giây tuyệt đối lúc cụm từ được đọc trong khung `n`. `nth` chọn lần lặp thứ mấy; `end: true` lấy lúc đọc xong; `d` cộng thêm.
- `K.start(n)`: lúc khung `n` bắt đầu. `K.words(n, "câu")`: từng chữ kèm mốc.

Quy ước: `B.f<N>.<tên>` cho mốc của khung N, và `B.cut` cho các điểm cắt cảnh quay (`c5` là đầu khung 5, `c5b` là điểm cắt thứ hai trong khung 5). Mốc dẫn xuất (ví dụ lúc đạp phanh = lúc thấy nguy hiểm + 1,2 s) cũng đặt ở đây, để lớp 3D và lớp chữ dùng chung.

Cụm từ phải có nguyên văn trong lời đọc của đúng khung đó, nếu không `K.at` ném `cue not found`.

## 3. `drive.js`

`buildDrive(CUES, B)` trả về `{ at(t), total, dist, speed, cuts, SHOTS }`. Không import three.js hay DOM, nên Node chạy được để kiểm.

Dựng từ các đường theo thời gian của `timeline.js`:

| Hàm | Dùng cho |
|---|---|
| `linear([[t, v], …])` | giá trị nối thẳng giữa các mốc: tốc độ (m/s). Hai mốc cùng `t` là một bước nhảy (dùng ở điểm cắt cảnh) |
| `stepped([[t, v, ramp], …], ramp = 0.4)` | giá trị giữ nguyên rồi chuyển sang mức mới trong `ramp` giây: độ dày sương, tầm nhìn |
| `inside(t, a, b)` | `a ≤ t < b` |
| `on(list, t, e = 0.16)` | 0..1: `t` có nằm trong một khoảng `[a, b]` của `list` không, có viền mềm: đèn bật tắt |
| `span(list, t, e = 0.3)` | như `on`, viền dài hơn: nhãn và vạch hiện rồi tắt |
| `shotTable(SHOTS, total)` | `SHOTS = [[lúc bắt đầu, kiểu cảnh], …]` → `(t) => { i, kind, t0, t1 }` |
| `cutDip(cuts, t, half = 0.3)` | 0..1: tối nhanh quanh mỗi điểm cắt |
| `odometer(speed, total)` | `(t) =>` số mét đã đi |
| `lateralMoves(MOVES, dist, home)` | xe dạt ngang: `MOVES = [{ t0, t1, to, until }]` → `(t) => { x, yaw, kappa }`, đường cong trơn, vô lăng không giật |

`path.js` cho `clamp, lerp, smooth, seg(t, a, b), win(t, a, b, fade)`.

**Trạng thái `at(t)` trả về.** `road.js` và `hud.js` đọc các trường sau; tên phải đúng:

| Trường | Ai đọc | Nghĩa |
|---|---|---|
| `s` | road, hud | mét đã đi (mặt đường, cây, cọc tiêu trôi theo) |
| `x`, `yaw` | road | vị trí ngang và góc của xe mình |
| `fog`, `fogAmt` | road | mật độ sương (0.0075 là trời quang) và mức sương 0..1 để đổi màu trời |
| `bay` | road | z của tâm chỗ dừng xe so với xe, hoặc `null` |
| `low`, `high`, `fogLamp` | road | đèn chiếu gần, chiếu xa, đèn sương mù, mỗi cái 0..1 |
| `wetRoad`, `rain`, `t` | road | mặt đường ướt 0..1 (tối đi và phản chiếu trời, rõ hơn khi nhìn sát mặt đường); mưa (vòng gợn trên vũng nước); thời gian |
| `puddle` | road | vũng nước trên mặt đường `{ x, z, hw, hl, a, tint, tintA }` (tâm, nửa rộng, nửa dài theo mét so với xe; `tint` là một `TONE` phủ lên với tỉ lệ `tintA`), hoặc `null` |
| `t`, `rain`, `wet`, `motes`, `dazzle`, `blind`, `dip` | hud | thời gian; mưa; mặt đường ướt; hạt sương bay trong chùm đèn; mức chói; mức "không thấy gì"; tối ở điểm cắt |
| `wipe`, `wipeT` | hud | số lần gạt đã xong kể từ khi bật gạt nước, và giây mỗi lần gạt: để bài đổi nhịp gạt (chậm, nhanh, tắt). Không có thì gạt đều theo `WIPE.T` |

Mọi trường khác là của riêng bài, `world.js` của bài tự đọc: ví dụ Bài 5 có `kind, shot, v, acc, kappa, hazard, vis, stop, ok, onc, lead, band, edge, guides, reticle, label, hud, recover`. Bài mới thêm trường của mình (độ dốc, số đang gài, làn đang đi…), không cần sửa kit trừ khi sân khấu phải vẽ nó.

Sau khi sửa `drive.js`, thử nhanh bằng Node (cần `cues.js`):

```bash
(cd "$P" && node -e 'import("./assets/lib/world/cues.js").then(async ({CUES}) => { const {cueKit} = await import("./assets/lib/world/stage.js"); const {buildBeats} = await import("./assets/lib/world/beats.js"); const {buildDrive} = await import("./assets/lib/world/drive.js"); const d = buildDrive(CUES, buildBeats(cueKit(CUES))); for (let t = 0; t < d.total; t += 10) { const s = d.at(t); console.log(t, s.kind, s.v.toFixed(1), s.x.toFixed(2)); } })')
```

## 4. `road.js`: sân khấu

```js
const road = createRoad({ canvas, fx, palette: "day", trees: 34, posts: 26 });
```

`palette` là `"night"`, `"day"` hoặc `"overcast"` (chiều âm u có mưa, ánh sáng dẹt; Bài 5 ý 4) (`PALETTES` trong tệp; thêm bảng màu mới ở đó). Hằng xuất ra: `W, H` (1920, 1080), `FOCAL` (tiêu cự tính bằng pixel), `PITCH` (góc nhìn xuống của người lái).

Một khung hình vẽ theo đúng thứ tự này (xem `world.js` của ví dụ):

| Bước | Lệnh | Việc |
|---|---|---|
| dựng một lần | `road.start((T) => { … }, (t) => renderAt(t))` | tải mô hình; trong hàm đầu dựng xe bằng `road.vehicle(T, "car" \| "truck", tênMôHình)` và vật bằng `road.prop(T, "cone", scale)`; trả về promise `ready` |
| 1 | `if (!road.begin(t, d, { driver, wall })) return;` | trời, sương, ánh sáng, mặt đường. `driver`: đang nhìn từ một ghế lái. `wall` 0..1: đèn chiếu xa hắt lại từ sương |
| 2 | `xe.set(pose, t, { alpha, brake, blinkL, blinkR })` | đặt từng xe. `pose = { x, z, yaw, dist, steer, v, k, acc, vis }`; `set(null, …)` để ẩn. `alpha: 0` ẩn thân xe mình khi nhìn từ ghế lái |
| 3 | `road.lights(egoPose, other \| null, [reachOurs, reachTheirs])` | vệt đèn trên mặt đường của xe mình và một xe thứ hai `{ x, z, yaw, high, fade }` |
| 4 | `road.seat(egoPose, d.s)` hoặc `road.aim(px, py, pz, tx, ty, tz)` | máy quay ở ghế lái, hoặc đặt tay |
| 5 | `road.side({ hideRight, clearBehind, lit, facing })` | cây và cọc tiêu. `hideRight` khi máy quay đứng ở lề phải |
| 6 | `road.stopBand`, `edgeMark`, `laneGuides`, `gapMark`, `road.put(strip, …)` | vạch phẳng trên mặt đường (không bị sương che) |
| 7 | `const G = road.glass({ gain })` | lấy bộ hàm vẽ lên kính; gọi sau khi máy quay đã đặt |
| 8 | `G.vehLamps`, `G.mark`, `G.note`, `G.beam`, `G.bracket` | quầng đèn, nhãn, chùm sáng, thước đo |
| 9 | `road.finish(G, { exterior, steer, reticle, veil, haze, panel, progress })` | vẽ cảnh rồi vẽ kính |

Tên mô hình (từ `models.js`): `carPurple`, `carRed`, `truckTeal`, `truckDark`, `bus`, `moto`; vật: `cone`, `bollard`, `tree`, `lamp` (cột đèn đường), `post` (cột biển), `signal` (cột đèn tín hiệu). Danh sách nằm ở đầu `models.js`. `xe.points` là vị trí đèn (`head`, `tail`; thêm `fog` hay điểm khác bằng tay như ví dụ).

**Vạch trên đường.**

- `road.stopBand({ a, stop, vis, ok, pov })`: dải quãng dừng xe phía trước mũi xe (xanh khi `ok`, đỏ khi không) và vạch ngang ở cuối đoạn nhìn thấy rõ. Đây là hình của mạch "nhìn thấy tới đâu, chạy nhanh tới đó".
- `road.edgeMark(a, tone)`: vạch mép đường bên phải nhấp nháy. `road.laneGuides(a, tone)`: hai vạch của làn mình. `road.gapMark(z0, z1, tone, a)`: thước đo dọc lề phải, ví dụ khoảng cách tới xe trước.
- Vạch riêng của bài: `const m = road.strip()` một lần (thêm `{ ego: true }` để gắn theo xe), rồi mỗi khung `road.put(m, x0, x1, z0, z1, tone, a, y)`. Mọi vạch tự ẩn ở đầu mỗi khung; không `put` thì không hiện.

**Trên kính** (`G` từ `road.glass`):

- `road.proj(x, y, z)`: điểm của thế giới thành pixel, `null` khi ở sau máy quay.
- `G.mark(p, dx, dy, "CHỮ", TONE.x, a, { size, line })`: nhãn bám theo điểm `p`, lệch `(dx, dy)` pixel, có đường dẫn. `G.note(x, y, "CHỮ", tone, a, { size, ink })`: nhãn ở chỗ cố định của khung.
- `G.vehLamps(xe, pose, "head" | "tail" | "fog", ±1, G.head(high) | G.tail(brake) | { k, max, c, a })`: quầng đèn của một xe; trả về các điểm đã chiếu, `G.centre(...)` lấy tâm (dùng cho `veil`).
- `G.beam(pose, target, far, high, a)`: chùm đèn vẽ dẹt cho cảnh nhìn ngang. `G.bracket(p0, p1, y, text, tone, a)`: thước ngang có tên.
- `G.lamps.push({ x, y, r, c, a, star })`: một quầng sáng tự đặt.

`TONE` (từ `hud.js`): `ink, mute, lilac, sky, pos, warn, neg, lamp, amber, tail`.

## 5. Các kiểu cảnh quay của ví dụ

`drive.js` đặt tên kiểu cảnh trong `SHOTS`; `world.js` quyết định mỗi kiểu trông thế nào. Bảy kiểu Bài 5 dùng, chép lại được:

| Kiểu | Máy quay | Dùng để |
|---|---|---|
| `pov` | `road.seat(egoPose, d.s)` | mặc định: ghế lái, có ca-pô, vô lăng, kính |
| `them` | ghế lái của xe ngược chiều | cho thấy mình trông thế nào trong mắt người kia |
| `side` | đứng bên lề phải, nhìn ngang, đi theo xe | đo quãng trên mặt đường (quãng phản ứng, quãng phanh) |
| `diagram` | nhìn ngang, thấp, hai xe đối đầu | so hai chùm đèn |
| `duel` | nhìn ngang, ống kính khép dần theo hai xe | hai xe lao về phía nhau |
| `chase` | trên cao phía sau xe | thấy dải dừng xe so với đoạn nhìn rõ |
| `front`, `rear` | sát đầu xe, hoặc phía sau xe đang đỗ | chi tiết ở ngoài xe: đèn sương mù, đèn dừng khẩn cấp |
| `pond`, `puddle` | đứng yên bên lề, nhìn xe chạy vào vũng nước (ví dụ `bai-05-p2-troi-mua`) | xe đi vào nước đọng; dấu trên đường đứng yên tại chỗ việc xảy ra |

Cảnh ngoài xe: truyền `exterior: true` cho `finish` (không vẽ ca-pô), `driver: false` cho `begin` (cảnh được nâng sáng theo `palette.lift`), và `hideRight: true` cho `side` nếu máy quay ở lề phải. Chữ ở cột trái che x 64–620, nên đặt vật chính ở nửa phải khung hình (ví dụ lùi tâm ngắm về −z một đoạn `80 / ppm`).

## 6. Bảng đồng hồ và thanh chờ (`hud.js`)

Truyền qua `road.finish(G, { panel, progress, … })`:

```js
panel = {
  a,                                  // 0..1 cả bảng
  head: [                             // tối đa hai mục, hàng trên cùng
    { icon: "beamLow", text: "ĐÈN CHIẾU GẦN", tone: TONE.pos },
    { icon: "fog", text: "ĐÈN SƯƠNG MÙ", tone: TONE.warn, a: d.fogLamp },
  ],
  bars: {
    a,
    rows: [{ label: "TẦM NHÌN", m: d.vis, tone: TONE.sky }, { label: "QUÃNG DỪNG XE", m: d.stop, tone }],
    limit: d.vis,                     // vạch mốc mà thanh sau không được vượt
    chip: { text: "DỪNG KỊP", tone, blink, icon },
  },
};
progress = { u, text, tone };         // thanh đầy dần 0..1 kèm dòng chữ; u < 0 thì ẩn
```

Icon có sẵn: `beamHigh`, `beamLow`, `fog`, `warn`, `wiper`. `m` tính bằng mét trên thang `SCALE_MAX`; thanh không in số. Bảng nằm góc trên phải (x 1366, y 34, rộng 520). Bài khác đổi nhãn và ý nghĩa của hai thanh (ví dụ "KHOẢNG CÁCH" so với "QUÃNG DỪNG XE") mà không sửa `hud.js`.

Các mục khác của `finish`: `steer` (góc vô lăng), `reticle { x, y, a, g }` (dấu ngắm "mắt đang nhìn đâu"), `veil { x, y }` (tâm quầng chói), `haze` 0..1 (quầng sương trước mũi xe).

Nhãn trên kính tự mờ đi khi điểm neo trượt vào dưới cột chữ (x 600–690), và hộp nhãn được giữ trong khung hình.

## 7. Thêm thứ mới vào sân khấu

Làm trong dự án trước, trong `world.js` của bài; khi chạy đúng và bài khác cũng cần thì chuyển về `kit/`.

- **Vật có mô hình** (nón, cọc, cột biển, cột đèn): `road.prop(T, tên, scale)` trong `road.start`, rồi mỗi khung đặt `visible` và `position`. Vị trí z tính theo `d.s` để vật đứng yên trên đường trong khi xe chạy (xem các nón của cảnh `side`).
- **Xe thứ ba, xe đi cùng chiều**: `road.vehicle(…)`, đường đi của nó là một hàm thuần trong `drive.js` (như `onc`, `lead`, `pass` của ví dụ).
- **Vật chưa có mô hình** (thanh chắn, ray, tàu, rơ moóc, thùng xe ben): dựng bằng hình khối three.js qua `road.THREE` và `road.scene` cho thứ đơn giản; thứ cần đẹp thì làm mô hình bằng `my-designer-3d`, xuất GLB theo `chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/references/new-cases.md`, đặt vào `assets/models/` và đăng ký trong `models.js` của dự án.
- **Mặt đường khác** (nhiều làn, làn dừng khẩn cấp, ổ gà, vạch mới; mặt ướt và vũng nước đã có qua `wetRoad`, `puddle`): mặt đường được vẽ bằng shader trong `road.js` theo `x` và quãng đã đi. Thứ phẳng và tạm thời thì dùng `road.strip()` + `put()`. Thứ thuộc về con đường (số làn, dải phân cách) thì thêm tham số cho `createRoad` và giữ mặc định cũ.
- **Dốc**: chưa có. Hướng ít rủi ro nhất là giữ đường phẳng trong toạ độ của nó và nghiêng máy quay cùng đường chân trời, vì mọi phép chiếu nhãn đi qua `road.proj`. Thử trên một cảnh trước khi viết cả bài.
- **Hình 2D trong ca-bin** (bàn đạp, cần số, đèn báo): vẽ trong `hud.js` như `cockpit()` và `panel()`, điều khiển bằng một mục mới của `finish`.
- **Bảng màu**: thêm một mục vào `PALETTES`.

Sau khi sửa bất kỳ tệp nào của `kit/`, chạy phép kiểm ở `qa.md` §4: ví dụ Bài 5 phải ra ảnh giống hệt.
