# Câu mới: sửa từ cái có sẵn, tạo cái chưa có

Thứ tự ưu tiên: **dùng nguyên**, rồi **sửa từ ví dụ**, cuối cùng mới **tạo mới**. API nhắc tới ở đây được tả trong `world.md`. Danh sách thứ đã có (biển, icon, nút giao, hàm thẻ chữ) nằm ở `series.md` §6.

Có hai ví dụ. `v02-nga-tu-co-bien` là khuôn của loạt và là điểm xuất phát mặc định. `cau-502-504-506` là khuôn cũ: §2.1–§2.3 tả ba ô của nó, và chỉ phần thế giới 3D (số đo, đường đi, hàm dựng ô) còn dùng được; khung đề, phương án, đếm ngược, bảng tên dưới kính lúp của nó thì không.

## 1. Xếp loại câu

Sau khi mở ảnh cắt (`brief-contract.md` §4), xếp câu vào một dòng:

| Trong ảnh có | Điểm xuất phát | Phải làm thêm |
|---|---|---|
| Đèn tín hiệu, một xe, vài mũi tên đánh số hỏi "được đi hướng nào" | 502 | đổi hình nút giao, số hướng; trạng thái đèn khác thì sửa `makeSignal` (§4.2) |
| Vòng xuyến, không biển, nhiều xe, hỏi thứ tự đi | 504 | đổi số nhánh, góc từng nhánh, loại xe |
| Ngã tư có biển (ưu tiên, nhường đường, Dừng lại, biển phụ hướng đường ưu tiên), hỏi thứ tự đi hay xe nào nhường | V02 (§2.4) | một dòng trong `SIT`, các `placeSign`, lượt chạy theo lời đọc |
| Ngã ba có biển | V02 | bỏ một nhánh trong `roads.js` và `ARM`; chưa thử |
| Nút giao không đèn không biển, đường cùng cấp, hỏi thứ tự đi | mặt đường và `route` của V02, vùng "bên phải" (`zone`) của 504 | bỏ biển; tình huống 4 của V02 đã có luật nhường bên phải |
| Biển khác (cấm, hiệu lệnh, chỉ dẫn), vạch kẻ làn, xe ưu tiên, người điều khiển, người đi bộ, xe đạp, đường sắt | chưa có | §3, §4; báo người dùng trước khi nhận |

Câu có thứ "chưa có" vẫn làm được, nhưng tốn thêm việc và thêm vòng kiểm. Nói rõ điều đó ở tin nhắn nhận việc.

## 2. Câu cùng kiểu với ví dụ

Bắt đầu bằng `new-project.sh <tên> --example v02-nga-tu-co-bien`, rồi sửa theo thứ tự dưới. Chạy `node scripts/audit-motion.mjs` sau mỗi lần đổi `plan.js`.

| Tệp | Sửa gì |
|---|---|
| `plan.js` | `TILE_X` (số câu mới làm id), `TILE_ROT` (xoay ô cho giống hình trong sách), bảng số đo `G…`, hàm đường đi, khối của từng câu trong `buildPlan` (cụm từ neo mốc), `VIEWS`, `GLASS`, `shots` |
| `roads.js` | hàm vẽ và hàm "trên đường" theo số đo mới; đổi khoá của `PAINT`, `ROAD` |
| `beats.js` | các cụm từ, theo lời đọc mới; số khung nếu bố cục khung đổi |
| `sites.js` | bảng `KEY` (xe nào dùng mô hình nào), `NAME` (nhãn), `OFF` (nhãn lệch bao nhiêu pixel), vị trí biển và đèn; phần `update` phần lớn giữ được |
| `scripts/build-frames.mjs` | `SIT_LABEL`, câu hỏi, thẻ xe, thẻ biển và quy tắc, danh sách thứ tự, kết luận, mẹo nhớ, dòng tổng kết |
| `scripts/build-storyboard.mjs` | mảng `F`: cảnh, các pha, SFX của từng khung |

Tìm chữ của video cũ trước khi chạy: `grep -n "Dừng lại\|xe khách\|ưu tiên" scripts/build-*.mjs assets/lib/world/beats.js` (đổi các từ theo ví dụ đã chép), rồi đọc lại từng chỗ.

### 2.1 Kiểu 502: đèn tín hiệu, một xe, nhiều hướng

- Một xe thật đứng ở vạch dừng; một **xe mờ** (`{ ghost: true }`) chạy thử từng hướng sai rồi biến mất, xe thật đi hướng đúng.
- Mỗi lần thử có hai mốc trong lời đọc: lúc nêu hướng ("Thử hướng bốn") và lúc kết luận ("nên sai"). Hàm `mk` trong ví dụ lùi kết luận tới sau khi xe mờ chạy xong, và không cho lần thử sau bắt đầu trước khi lần trước dọn xong. Viết lời đọc đủ dài giữa hai mốc: xem `tries[].slack` (âm là lời đọc kết luận trước khi xe tới nơi).
- Mũi tên các hướng có số trên đường; kết quả từng hướng hiện bằng nhãn `"v"` / `"x"`.
- Kính lúp soi cụm đèn. Đọc ảnh cắt của kính ở độ phân giải đầy đủ.

### 2.2 Kiểu 504: vòng xuyến, đi lần lượt

- `G504.arms` là góc của từng nhánh (độ); `ORDER504` là thứ tự đi; `RIGHT_OF[id]` là nhánh bên phải của mỗi xe.
- Mỗi xe có bốn cụm trong lời đọc: gọi tên, nhìn bên phải, bên phải trống, đi. Xe sau không bao giờ xuất phát trước khi xe trước ra khỏi hình 0,3 giây (`T.go = max(mốc, prev + 0.3)`). `T.slack` âm nghĩa là lời đọc đi nhanh hơn xe: thêm chữ hoặc tăng `vmax`.
- Đường vào và ra vòng xuyến là các cung nối nhau (`ringPath`); bán kính nhỏ quá thì `audit-motion` báo cua gắt. Xe dài (xe khách) cần bán kính lớn hơn xe con.
- Không có kính lúp; điểm nhấn là vùng "bên phải" (`zone`) đổi từ hổ phách sang xanh.

### 2.3 Kiểu 506: biển ưu tiên, một xe đi trước

- Biển đặt bằng `b.facing(x, z, makeSign(T, kind).root)`, ở góc phải phía trước của xe tương ứng, như trong hình.
- Dải xanh (`straight` rộng, `flow: 0, chev: 0`) tô đường ưu tiên.
- Mỗi biển một kính lúp. Ví dụ này còn đặt kính ở vị trí cố định và có bảng tên `PLATE`: cách đó đã bỏ, làm theo `series.md` §5.
- Chỉ xe được ưu tiên chạy; các xe kia đứng yên với nhãn "Nhường", "Chờ". Brief hỏi cả thứ tự của các xe còn lại thì thêm các lượt chạy theo cách của 504.

### 2.4 Kiểu V02: ngã tư có biển, viết theo tham số

- Cả bốn ô dùng chung một mặt đường (`roads.js`: `paint(id)`, `road`) và một bảng số đo `G`. `ARM` tả bốn nhánh, `CORNER` là chỗ biển của mỗi nhánh đứng.
- `SIT[n]` liệt kê xe: `{ car: ["N", 15.2, "left"] }` là xe con ở nhánh N, tâm xe cách tâm ngã tư 15,2 m, rẽ trái. `route(arm, dist, turn)` cho đường đi; `homeOf` cho chỗ đứng. Xe dài đứng xa hơn (xe tải 17,2; xe khách 17,6) để mũi xe không chạm vạch dừng.
- Biển: `placeSign(b, T, arm, kind, { sub, back })`. Biển của nhánh đi về phía camera (N, E) đặt `back: true`.
- Một xe nhích tới vạch rồi dừng hẳn (tình huống 3, `S_STOP`): hai lượt chạy nối nhau trên cùng một đường đi.
- Thứ tự chạy lấy từ cụm từ trong lời đọc. Xe sau không xuất phát trước khi xe trước rời vùng giao cắt; `audit-motion.mjs` bắt mọi lần hai xe chạm nhau.
- Mỗi biển một kính lúp, mở lúc lời đọc nêu tên biển: `glass(key, t0, t1, sign, col)` với `key` trong `GLASS` (`series.md` §5).

## 3. Kiểu nút giao mới

Làm theo thứ tự này, kiểm xong bước trước mới sang bước sau.

1. **Số đo.** Thêm một bảng `G<số>` vào `plan.js`: nửa bề rộng đường, tim làn, bán kính bo góc, vị trí vạch dừng, vạch người đi bộ. Lấy tỉ lệ giữa các phần từ ảnh. Đường trong ví dụ rộng 10,4 m (506) và 19 m (502), tim làn nằm giữa mỗi nửa đường: mọi thứ vẽ to hơn thật để đọc rõ từ trên cao. Giữ cùng cỡ đó, kẻo xe có sẵn lạc tỉ lệ.
2. **Mặt đường.** Trong `roads.js`: một hàm đường viền lòng đường cho `lay`, một hàm vẽ (`sheet`, `lay`, `zebra`, `line`), một hàm `road(x, z, m)`. Đăng ký vào `PAINT` và `ROAD`. Hàm `road` phải khớp với đường viền, nếu không cây mọc giữa đường.
3. **Đường đi.** Mỗi xe một `pen(...)…done()`, đi giữa làn của nó, rẽ bằng `arc`. Bán kính rẽ phải khoảng 6–9 m, rẽ trái rộng hơn. Đường ra kết thúc ở `EDGE`.
4. **Ô trống trước.** Viết `site<số>` chỉ có `tile`, `planting` và xe đứng yên; thêm vào `SITES`, `TILE_X`, `VIEWS`. Chụp một ảnh và so với ảnh trong sách: hướng các nhánh, vị trí xe, phía tay lái.
5. **Chuyển động.** Thêm các `go` theo mốc lời đọc; chạy `audit-motion.mjs`.
6. **Lớp chỉ dẫn.** Mũi tên, nhãn, vòng sáng, kính lúp, và các mốc trong `beats.js`.

Nếu nút giao mới dùng lại được cho câu khác, giữ số đo trong bảng `G…` và đừng gõ số vào giữa mã.

## 4. Biển, đèn, xe, vật thể mới

### 4.1 Mặt biển báo mới

Đã có bốn mặt biển và một biển phụ (`series.md` §6). Mặt biển là một canvas 512×512 nền trong suốt, vẽ trong `models.js`. Thêm một hàm vẽ cạnh `texStop` và `texDiamond`, một hình viền trong `SHAPE` (dùng cho mặt sau), rồi đăng ký vào `FRONTS`, `PLATE_Y`, `SYMBOL_Y`, `HANG_Y`; gọi `makeSign(T, "<tên>")`. Thêm luôn một icon cùng hình vào `ICON` của `frames.kit.mjs` cho thẻ biển ở cột chữ.

- Vẽ đúng hình dạng và màu của biển trong quy chuẩn; brief phải cho tên chính thức, ảnh trong sách cho hình. Không chép ảnh của sách vào làm texture.
- `SYMBOL_Y` là độ lệch của tâm hình so với giữa tấm (biển tam giác lệch 12% về phía đáy; biển tròn, vuông, bát giác là 0). `center()` dùng số này để kính lúp nhắm đúng.
- Kiểm bằng kính lúp ở độ phân giải đầy đủ: ở góc nhìn của một câu, biển chỉ cao khoảng 60–75 px, nên nét vẽ phải đậm và ít chi tiết.

### 4.2 Trạng thái đèn khác

`makeSignal` vẽ đúng tình huống của câu 502: đèn đỏ sáng, vàng và xanh tắt, đèn phụ là mũi tên xanh chỉ sang phải. Mô hình có sẵn các phần `lamp_red`, `lamp_yellow`, `lamp_green`, `lamp_aux`. Tình huống khác thì thêm tham số cho hàm (đèn nào sáng, mũi tên chỉ hướng nào, có đèn phụ hay không) thay vì chép hàm. Giữ mặc định là hành vi hiện tại để ví dụ vẫn chạy.

Mũi tên của đèn phụ nằm **trước** mặt kính của đèn (z = 0,381 so với 0,373) và vẽ sau quầng sáng. Đổi gì ở đây thì cắt ảnh kính lúp ra đọc: lỗi "mũi tên biến mất trong kính" đã xảy ra đúng ở chỗ này.

### 4.3 Loại xe mới, hay vật thể cần mô hình

Mô hình dựng bằng studio 3D của repo này. Đọc `.claude/skills/my-designer-3d/SKILL.md` trước.

```bash
node bootstrap.mjs --status                                   # studio phải đang chạy
bin/dsa projects export <id> --format glb --output videos/<ten-du-an>/assets/models/<ten>.glb
node .claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/scripts/glbdump.mjs videos/<ten-du-an>/assets/models/<ten>.glb
```

Rig trong `models.js` nhận mô hình theo **tên node**, nên mô hình mới phải theo đúng quy ước:

| Quy ước | Lý do |
|---|---|
| Mũi xe hướng +z, bên trái +x, đáy ở y = 0, đơn vị mét | xe chạy đúng hướng, bánh chạm đất |
| Mỗi bánh là một node cấp cao tên bắt đầu bằng `wheel_` | rig treo bánh lên một trục ở **tâm của chính bánh đó**; bánh có tâm z > 0 là bánh trước (bẻ lái) |
| Đèn pha `light_head…`, đèn hậu `light_tail…`, xi nhan `signal_…` (tên kết thúc bằng `l` là bên trái) | rig bật sáng và nháy đèn |
| Màu thân sáng, khác màu nhựa đường (`#676e79`) | xe sẫm màu chìm vào mặt đường khi nhìn từ trên |
| Chi tiết to, ít mảnh nhỏ | xe chỉ dài khoảng 80–160 px trên hình |

Rồi:

1. GLB nằm trong `assets/models/` của dự án; thêm một dòng vào `FILES` trong `models.js`.
2. Loại xe mới (kích thước khác các loại đã có): thêm một dòng vào `DIMS` trong `path.js`, với `length`, `width`, `wheelbase` đo từ `glbdump` nhân với `scale`. `audit-motion` dùng đúng các số này để xét va chạm.
3. Chụp ảnh xe lúc đang rẽ, phóng to: bánh nằm trong hốc bánh, bánh trước bẻ theo hướng rẽ. Chụp ở đúng chỗ xe đang đứng tại giây đó.
4. Vật không chạy (người điều khiển giao thông, rào chắn, cổng đường sắt): `instance(T.<tên>)` rồi đặt vị trí, hoặc viết một hàm `make…` riêng nếu nó có trạng thái (tay giơ, rào hạ).

`glbdump` in ma trận của từng node: GLB từ studio lưu vị trí trong `matrix`, không phải `translation`. Đừng kết luận "mọi node ở gốc toạ độ" khi chỉ nhìn `translation`.

Không dựng được mô hình (studio không chạy, hay hình quá phức tạp): báo người dùng. Không thay bằng một khối hộp rồi lặng lẽ giao video.

### 4.4 Người đi bộ, xe đạp, xe ưu tiên

Chưa có mô hình nào và chưa có rig cho dáng đi. Đây là việc mới thật sự: cần mô hình, cần quyết định cách thể hiện (đứng yên có nhãn, hay di chuyển), và xe ưu tiên cần cả đèn chớp. Ước lượng công, nói với người dùng, rồi mới làm.

## 5. Số tình huống khác bốn

**Đã chạy thật: bốn tình huống (V02, 17 khung, `VIEWS.wide.d` = 400) và ba câu (khuôn cũ, 14 khung, `d` = 315).** Engine không giới hạn số ô. Bảng dưới viết từ khuôn ba câu; với khuôn của loạt, đọc "14 khung" thành 4N + 1 khung và bỏ khung mở đầu. V01 có ba tình huống: `tileRow([1, 2, 3])`, `d` khoảng 315, 13 khung.

| Chỗ | Đang giả định | Số câu khác thì |
|---|---|---|
| `plan.js` `TILE_X = tileRow([...])` | ba id | `tileRow` nhận số id bất kỳ |
| `VIEWS.wide.d` = 315 | thấy vừa ba ô | hai ô: giảm (ước tính khoảng 210, chưa thử); bốn ô: tăng, ô sẽ nhỏ và khó đọc; trên bốn ô nên chia hai video |
| Số khung trong `C.at(n, …)`, `C.start(n)` khắp `plan.js`, `beats.js` | khung 1 mở đầu, 2–5, 6–9, 10–13, 14 tổng kết | đánh số lại: N câu cho 4N + 2 khung |
| `build-frames.mjs`: `f1`, `f14` đặt nhãn ô ở x = 368, 960, 1552; `build = [...]` có 14 phần tử | ba ô, 14 khung | tính lại vị trí nhãn theo `TILE_X` và `VIEWS.wide`; viết lại mảng `build` |
| `build-storyboard.mjs`: mảng `F` 14 phần tử | 14 khung | viết lại |
| `world.js`: bóng nắng và việc ẩn ô xa | hàng ngang theo x | giữ hàng ngang; chưa có lưới hai hàng |

Một câu một video là trường hợp gọn nhất: bỏ toàn cảnh nhiều ô, `VIEWS.wide` đặt bằng chính góc nhìn của câu nhưng xa hơn (`world.md` §3: `VIEWS.wide.d` phải lớn hơn 130), khung mở đầu và tổng kết dùng bố cục cột chữ.

Nhận brief có số tình huống khác ba và bốn thì nói trước với người dùng: việc này chưa có tiền lệ, cần thêm thời gian, và các phép kiểm ở `qa.md` phải chạy lại đầy đủ. Làm xong và người dùng đã duyệt thì cập nhật bảng này.

## 6. Đưa cái mới về skill

Sau khi người dùng duyệt video:

- Mô hình mới: chép GLB vào `kit/assets/models/`, thêm id của dự án studio vào `scripts/export-models.sh`.
- Sửa ở engine (`models.js`, `path.js`, `fx.js`…): chép về `kit/assets/lib/world/` nếu ví dụ cũ vẫn chạy đúng. Kiểm bằng cách tạo một dự án thử từ ví dụ, chạy `audit-motion.mjs` và `assemble.sh`, rồi xoá dự án thử.
- Kiểu nút giao mới: thêm một thư mục vào `examples/` (cách chép ở cuối `SKILL.md`), và thêm một dòng vào bảng §1.
- Mọi thứ mới: thêm vào `series.md` §6 và một dòng vào bảng "Đã làm" ở §8 của tệp đó.
- Mặt biển, trạng thái đèn, loại xe mới: cập nhật `world.md` §5–§6 và danh sách "đã có" trong `VIDEO-HANDOFF.md` của repo `sat-hach-lai-xe`, để brief sau biết.
