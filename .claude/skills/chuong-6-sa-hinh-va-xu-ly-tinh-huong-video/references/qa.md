# Kiểm tra và báo cáo

Agent không nghe được âm thanh và không xem được chuyển động. Mọi phép kiểm dưới đây thay cho hai việc đó bằng số đo, phép tính và ảnh tĩnh. Báo cáo cuối phải nói rõ phần nào đã kiểm bằng cách nào, phần nào chưa.

Các lệnh chạy trong thư mục dự án (`$P`). `hyperframes` là `npx -y hyperframes` khi CLI không có trên PATH.

## 1. Thứ tự kiểm

| Lúc nào | Kiểm gì | Mục |
|---|---|---|
| Sau khi viết `SCRIPT.md`, và sau `assemble.sh` | Từ cấm của loạt: `node scripts/scan-words.mjs` phải ra `clean` | `series.md` §1 |
| Sau khi tạo giọng | Giọng nhân bản: dấu giọng tổng hợp, log từng đoạn có số. Giọng Gemini: danh sách whisper nghe khác kịch bản | §5, `series.md` §4 |
| Sau mỗi lần sửa `plan.js` | Xe chồng nhau, rẽ gấp, xe chạy ngoài tầm camera | §2 |
| Sau `assemble.sh` | Luật tệp khung (tự chạy), `lint`, `check` | §4 |
| Sau `assemble.sh` | Contact sheet giữa khung và cuối khung, rồi ảnh chụp thêm | §3 |
| Sau khi render | Số đo MP4, ảnh trích từ MP4 so với ảnh chụp | `vi-explainer-video/SKILL.md` bước 10 |
| Sau khi sửa `kit/` | Ví dụ V02 vẽ y như cũ: `vr-check.sh` | §4b |
| Khi dựng một khuôn mới | `lint-tells.mjs` (chỉ góp ý), rồi một người đọc mới theo `AGENTS.md` mục "A fresh reader for a new mould" | `vi-explainer-video/references/pitfalls.md` mục "Dấu hiệu máy làm" |

Sửa xong một lỗi thì chạy lại các phép kiểm phía sau nó, không chỉ phép đã báo lỗi.

## 2. Kiểm chuyển động

```bash
node scripts/audit-motion.mjs            # --verbose: in mọi xe
```

Script bước qua kế hoạch chuyển động ở 30 fps, không cần trình duyệt, và in ba phần:

| Phần | Đạt khi | Nghĩa |
|---|---|---|
| `overlaps (with 0.25 m of air)` | `0 pair(s)` | Không có hai xe nào chạm nhau, kể cả khi mỗi xe được nới thêm 0,25 m |
| `turning` | không dòng nào có `<-- over` | Tốc độ xoay ≤ 0,8 rad/s và gia tốc ngang ≤ 4,0 m/s² |
| `moving while the camera is on another tile` | `0` | Không xe nào còn chạy ở một ô mà camera đã rời đi |

Dòng cuối phải là `OK: no overlap, no sharp turn, nothing left moving off camera`. `FAILED: N finding(s)` thì sửa `plan.js`:

| Thấy | Thường do | Sửa |
|---|---|---|
| Hai xe chồng nhau trong một khoảng thời gian | Xe sau xuất phát khi xe trước chưa ra khỏi nút giao; xe ảo chưa tắt khi xe thật chạy | Xe sau xuất phát sau `run.t1` của xe trước ít nhất 0,3 giây; kiểm `T.slack` |
| Hai xe chồng nhau từ giây 0 | Chỗ đứng chờ quá sát nhau | Lùi điểm chờ dọc theo nhánh |
| `yaw` hoặc `lateral` vượt ngưỡng | Cua quá hẹp so với tốc độ | Nới bán kính `arc`, hoặc hạ `alat` / `vmax` của `go()` |
| Xe chạy khi camera ở ô khác | Chuyển động kéo dài quá `plan.shots` kế tiếp | Rút ngắn đường đi, tăng tốc, hoặc dời mốc chuyển cảnh |
| Xe chạy chậm lại rồi dừng ở mép ô | `go()` mặc định `v1 = 0` | Đặt `v1` bằng `vmax` và cho đường đi kết thúc ở `EDGE` |

Phép kiểm này chỉ biết hình chữ nhật của từng xe. Nó **không** thấy: bánh xe, đèn, nhãn, mũi tên, kính lúp. Những thứ đó kiểm bằng ảnh.

## 3. Ảnh chụp và ảnh cắt

### Hai bộ contact sheet bắt buộc

```bash
bash scripts/snap.sh mid  "$(node scripts/frame-times.mjs mid)"      # giữa mỗi khung
bash scripts/snap.sh late "$(node scripts/frame-times.mjs late)"     # 0,35 giây trước khi hết khung
```

Read từng tệp `snapshots/<tên>/contact-sheet-*.jpg`. Kiểm ở mỗi ảnh:

- thấy trọn nút giao của câu đang xét, không bị cột chữ hay panel che;
- cảnh ban ngày, không có khung đen hay trống;
- dấu tiếng Việt không bị cắt, chữ không tràn thẻ, không gì lấn vào vùng phụ đề (y > 896);
- câu hỏi, kết luận, tên biển và mẹo nhớ đúng chữ của brief; không có số câu, phương án hay chữ nào trong danh sách cấm;
- ở bộ `late`: mọi thứ phải hiện trong khung đều đã hiện.

### Ảnh chụp thêm

Contact sheet chỉ cho thấy lúc xe đứng yên. Chụp thêm bằng `snap.sh <tên> <t1,t2,…>`, lấy thời điểm từ `node scripts/audit-motion.mjs --verbose` và từ `beats.js`:

| Chụp gì | Lúc nào | Tìm gì |
|---|---|---|
| Xe đang chạy | 3 đến 5 thời điểm trong mỗi lần chạy: lúc rời chỗ, giữa cua, lúc ra khỏi nút giao | Xe nằm trên làn, đầu xe theo hướng đi, không đè vạch hay xe khác, đèn xi nhan đúng bên |
| Xe ảo của phương án sai | Giữa lần chạy thử và ngay lúc bị chốt sai | Xe ảo nhìn khác xe thật; dấu sai hiện đúng xe |
| Từng kính lúp | Lúc kính đang mở | Xem "Kính lúp" bên dưới |
| Bánh xe lúc rẽ | Giữa một cua, với loại xe nào cũng một lần | Xem "Bánh xe" bên dưới |
| Quanh mỗi lần camera đổi câu | 0,5 giây trước, giữa, và 0,5 giây sau | Không có thẻ chữ lơ lửng; ô cũ không còn xe đang chạy; panel và cột chữ vào ra cùng nhau; không kính lúp hay đường dẫn nào đang mở (`world.md` §3, "Camera đứng yên rồi mới chỉ") |
| Mỗi lần tô sáng theo nhịp | Đúng lúc đọc một tên xe, một tên biển hay một số thứ tự | Số trên cột chữ và huy hiệu trên bản đồ sáng **cùng lúc** và nổi rõ |
| Mũi tên trên đường | Lúc đang là hướng được xét, và lúc không | Hướng đang xét nổi hẳn; hướng còn lại vẫn đọc được, không lem màu |

### Kính lúp

Kính lúp là chỗ dễ sai mà ảnh thu nhỏ không cho thấy. Với **mỗi** kính:

```bash
hyperframes snapshot --at <t> --zoom "<x>,<y>,<w>,<h>" --zoom-scale 2 --describe false -o snapshots/zoom-<tên>
```

`x, y, w, h` là hình chữ nhật quanh kính, tính bằng pixel của khung 1920×1080. Read ảnh và kiểm:

- **kính nằm ngay trên vật nó phóng to**, và vật trong kính đúng là vật cần chỉ (đúng cột đèn, đúng biển của nhánh đó);
- **từng chi tiết của vật đọc được**: mũi tên trong đèn phụ, hình vẽ trên biển, màu viền; biển có biển phụ thì cả hai tấm nằm trọn trong kính;
- **phần còn lại của bản đồ đã xám** trong lúc kính mở, còn cột chữ giữ màu;
- thẻ của biển đó ở cột chữ đang sáng và ghi đúng tên biển như trong brief;
- hai kính không đè lên nhau.

Chụp thêm hai ảnh cả khung cho mỗi khung Quy tắc: 0,5 giây trước khi kính đầu mở và 0,6 giây sau khi kính cuối đóng. **Cả hai phải có màu đầy đủ.** Thời điểm mở và đóng lấy từ `lensItems` (các mốc trong `beats.js`).

Ở video đầu, mũi tên của đèn phụ câu 502 biến mất trong kính (nằm sau mặt kính của đèn, dưới một lớp sáng cộng màu). Contact sheet trông vẫn ổn; chỉ ảnh cắt ở độ phân giải đầy đủ cho thấy.

### Bánh xe

Chụp phóng to một xe ở giữa cua. Thời điểm lấy từ cột `@…s` của `audit-motion.mjs --verbose` (lúc xe xoay nhanh nhất). **Chụp cả khung ở thời điểm đó trước, đọc vị trí xe trên ảnh, rồi mới đặt khung phóng to**; đoán vị trí theo chỗ xe đứng chờ thì sẽ chụp vào mặt đường trống. Kiểm: cả bốn bánh nằm trong hốc bánh, bánh trước xoay theo hướng cua, không bánh nào lệch khỏi thân xe.

Mô hình mới xuất từ studio phải qua bước này trước khi dùng (`new-cases.md` §4.3).

## 4. `lint` và `check`

```bash
hyperframes lint          # 0 error
hyperframes check         # "Check passed"; chạy nền, mất vài phút
```

Kết quả của bộ kit ở video đầu: `lint` 0 lỗi; `check` layout 0 lỗi, 0 cảnh báo, 12 thông tin; motion 0/0; contrast 76/76.

**Chấp nhận, ghi vào "Lỗi đã chấp nhận" của báo cáo:**

| Báo gì | Vì sao bỏ qua được |
|---|---|
| lint `composition_file_too_large` ở `index.html` | Do bộ lắp ráp gộp mọi khung vào một tệp |
| check thông tin `content_overlap` đúng tại các điểm chuyển khung | Hai khung chồng nhau trong lúc crossfade; chụp ảnh giữa hai khung để chắc |
| check cảnh báo phụ đề lệch 1–4 px | Như `vi-explainer-video` |

`caption_track_kind_missing` không còn: `patch-index.mjs` gắn `data-track-kind="captions"`. Thấy lại thì `assemble.sh` chưa chạy tới bước đó.

Kết quả của V02: `lint` 0 lỗi; `check` passed; contrast 84/84.

**Không chấp nhận:** mọi lỗi (`error`), và `content_overlap` hay `text_occluded` kéo dài ngoài điểm chuyển khung. Panel `#world-side` phải có `data-layout-allow-overflow` (đã có trong `kit/compositions/world.html`).

Dòng `Invalid PCM packet` của ffmpeg trong lúc chạy `mix-balance.mjs` vô hại.

## 4b. Sau khi sửa `kit/`: ví dụ phải vẽ y như cũ

`scripts/vr-check.sh` chụp ảnh cả composition (thế giới 3D, cột chữ, phụ đề) ở các mốc cho trước, rồi so từng điểm ảnh với ảnh gốc bằng `ui vr gate` (gói `ease-design`, devDependency của my-designer). Ảnh chụp dùng SwiftShader, nên hai lần chạy trên cùng máy ra cùng điểm ảnh. Làm trên một bản sao của V02, không đụng dự án đã duyệt:

```bash
ROOT=$(git rev-parse --show-toplevel); K=$ROOT/.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit
T=$ROOT/projects/sat-hach-lai-xe/videos/chuong-6-v02; P=$ROOT/projects/sat-hach-lai-xe/videos/chuong-6-kit-check
rm -rf "$P" && rsync -a --exclude renders --exclude snapshots "$T/" "$P/"
cp "$K/scripts/vr-check.sh" "$P/scripts/"                                   # dự án làm trước 2026-10-24 chưa có
(cd "$P" && bash scripts/vr-check.sh base "$(node scripts/frame-times.mjs mid)")    # ảnh của kit cũ
cp "$K/assets/lib/world/<tệp vừa sửa>" "$P/assets/lib/world/"              # chỉ chép đúng các tệp đã sửa
(cd "$P" && bash scripts/vr-check.sh check "$(node scripts/frame-times.mjs mid)")
```

- **Mã 0:** mọi ảnh giống. Ghi "ví dụ vẽ y như cũ, `vr gate` N/N" vào báo cáo.
- **Mã 1:** có ảnh khác. Chỉ mở ảnh trong `snapshots/vr-diff/` (vùng khác được tô), không đọc lại cả hai bộ ảnh. Sửa có chủ ý đổi hình thì xác nhận chỉ vùng muốn đổi bị tô.
- **Mã 3:** không có `ui` (bản secure không có npm). Ghi "chưa kiểm điểm ảnh" vào báo cáo, rồi so contact sheet bằng mắt như §3.
- Sửa script dựng khung (`frames.*`, `assemble.sh`) thì chép cả script đó và chạy lại `assemble.sh` trong `$P` trước `check`.
- Thêm mốc giữa lúc kính lúp hay xe đang chạy nếu tệp đã sửa liên quan tới chúng; `mid` chỉ chụp giữa khung.

Xong thì xoá `$P`. `vr-check.sh` chưa chạy trên một lần sửa kit thật: lần đầu dùng, ghi kết quả vào đây.

## 5. Giọng: số, chữ cái và ghim `seed`/`cfg`

```bash
bash scripts/check-watermark.sh          # mọi tệp phải "is_watermarked": true
```

Thiếu dấu ở bất kỳ tệp nào: **dừng và báo người dùng**. Không lọc, không nén lại, không đổi tần số lấy mẫu của tệp giọng.

`clone-voice.mjs` tự chọn lần tạo tốt nhất bằng cách cho whisper nghe lại. Cách chấm đó **không tin được với số và chữ cái**: whisper viết "năm trăm lẻ bốn" thành "504" hay "2004", nên một lần đọc đúng bị trừ điểm còn một lần đọc sai có thể được chọn.

Vì vậy, sau khi tạo giọng, đọc log của **từng đoạn có số câu, số phương án, số hướng đi hay chữ cái tên xe**:

1. Tìm dòng `seed … cfg …` của đoạn đó và phần whisper nghe được.
2. Chọn lần mà whisper nghe ra đúng số, đúng chữ cái, đủ chữ.
3. Ghim vào đoạn đó trong `.hyperframes/clone_request.json`: `"seed": 42, "cfg": 2`.
4. Chạy lại riêng khung đó, rồi dựng lại mốc:

```bash
node "$SK"/scripts/clone-voice.mjs --only 06
node scripts/build-cues.mjs
```

Những chỗ đã gặp ở video đầu:

| Kịch bản | whisper nghe lần bị chọn | Cách xử lý |
|---|---|---|
| "Câu năm trăm lẻ bốn." | "Câu năm 2004." | ghim `seed 42 cfg 2` |
| "Câu năm trăm lẻ sáu." | "Câu 5 chấp lại sau." | ghim `seed 43 cfg 2` |
| "Hai: xe con, bê." | "Hai xe con đi" | ghim `seed 44 cfg 2` |
| "Vậy ta áp dụng quy tắc." | mất chữ "áp" | sửa `say` thành "Vậy, ta áp dụng quy tắc." |

- Một cụm bị nuốt ở mọi seed: viết lại cụm đó trong `say` (thêm dấu phẩy, đổi cách viết số), không đổi `script`.
- Vài seed đầu của một đoạn có thể hỏng và script tự thử seed kế. Đó là bình thường.
- Giọng nghe ra không giống chủ giọng (theo nhận xét của người dùng): dừng và báo, không tự chỉnh tham số khác.
- Không lần tạo nào nghe ra đúng số: nói rõ trong báo cáo đoạn nào, để người dùng nghe lại.

**Mốc của số.** Bộ canh chữ dồn các số đọc liền nhau vào vài phần trăm giây, nên mốc từng số không dùng trực tiếp được. `beats.js` của ví dụ lấy khoảng của mỗi phương án từ chữ số thứ tự của nó tới 0,3 giây trước phương án kế, rồi chia đều cho các phần được đọc tên. Chữ trong `cues.js` còn dính dấu câu ("2,", "4."), nên so bằng `/^([1-4])[.,]?$/`.

## 6. Lỗi đã gặp

Mỗi dòng là một lỗi có thật ở video đầu. Đọc trước khi dựng câu mới.

### Chuyển động

| Lỗi | Nguyên nhân | Cách tránh |
|---|---|---|
| Bánh xe bay vòng quanh xe | Bánh quay quanh gốc toạ độ của mô hình thay vì trục của chính nó | `makeVehicle` treo lại từng bánh vào một trục đặt ở tâm bánh. Mô hình mới: đặt tên nút `wheel_*`, rồi kiểm ảnh bánh xe (§3) |
| Xe xoay tại chỗ khi rẽ | Đường đi gãy góc | Dựng đường bằng `pen` với `arc`; `makePath` làm mềm khớp nối; `audit-motion` chặn tốc độ xoay |
| Hai xe đè lên nhau | Xe sau xuất phát theo mốc lời đọc trong khi xe trước chưa đi hết | Mốc xuất phát lấy giá trị lớn hơn giữa mốc lời đọc và lúc xe trước đi khuất cộng 0,3 giây |
| Xe phanh lại ở mép ô | `v1` mặc định là 0 | `v1 = vmax`, đường đi kết thúc ở `EDGE` |
| Xe ảo còn chạy khi lời đọc đã chốt "sai" | Lần chạy thử dài hơn câu lời | Rút ngắn đường chạy thử (`sEnd`) hoặc tăng tốc; kiểm `tries[].slack` không âm |
| Xe hiện lại đè lên xe đang ra | Lần hiện lại không chờ xe cuối đi khuất | Mốc hiện lại lấy sau lần ra cuối cùng |

### Hình

| Lỗi | Nguyên nhân | Cách tránh |
|---|---|---|
| Camera bay, xoay, zoom làm mất toàn cảnh | Dựng theo kiểu phim | Mỗi câu một góc nhìn cố định trên cao; chi tiết nhỏ dùng kính lúp |
| Cảnh đêm khó nhìn | Chọn tông tối cho đẹp | Luôn ban ngày |
| Còn nhiều khoảng trống quanh nút giao | `d` của góc nhìn quá xa | Chọn `d` nhỏ nhất mà vẫn thấy trọn nút giao và chỗ xe chờ (`world.md` §3) |
| Mũi tên trên đường không nổi | Mũi tên mảnh, cùng tông mặt đường | `ribbon` có viền tối và màu đậm; hướng đang xét sáng hẳn |
| Mũi tên lúc không được xét trông lem | Làm mờ bằng alpha trên mặt đường | Dùng `dim` (đổi màu), không dùng `alpha` |
| Hoa văn mũi tên trên dải ưu tiên trông như chỉ ngược chiều | Hoạ tiết chạy trên dải rộng | Dải ưu tiên của kiểu 506: `flow: 0, chev: 0` |
| Xe tải gần đen không thấy trên mặt đường | Màu mô hình trùng màu nhựa đường | Dùng `lorry` (xe tải xanh, phóng 1,3 lần); mô hình mới kiểm độ tương phản với mặt đường |
| Xe mô tô quá nhỏ | Tỉ lệ thật quá bé ở góc nhìn này | `moto` phóng 2,0 lần; vật nhỏ cần phóng to có chủ ý |
| Chi tiết trong kính lúp biến mất | Nằm sau một lớp trong suốt | Ảnh cắt đầy đủ độ phân giải của từng kính (§3) |
| Nhãn của xe này nằm trên làn ra của xe khác | Vị trí nhãn tính theo xe đứng yên | Chụp ảnh lúc xe đang chạy; dời nhãn |
| Số phương án sáng lên quá nhẹ | Chỉ đổi độ mờ | `TONE` và `PILL`: đổi màu nền và phát sáng |
| Ô sáng che mất dấu phẩy đứng trước | Ô sáng rộng hơn chữ | Giữ `padding` và `margin` của `§dg`, `§hl` như trong kit |
| Thẻ chữ lơ lửng trên bản đồ khi panel đã trượt ra | Cột chữ không rời cùng panel | `extra.leave` ở khung đáp án cuối |
| Kính lúp hay bảng tên che đầu mũi tên, biển | `GLASS` và `PLATE` chỉnh riêng | Chỉnh cả hai rồi chụp lại |

### Công cụ

| Lỗi | Cách tránh |
|---|---|
| Mô hình GLB xuất từ studio ghi phép biến đổi trong `matrix`, không phải vị trí, xoay, tỉ lệ rời | `node scripts/glbdump.mjs <tệp>` của skill in ra `matrix`; đọc kích thước và tên nút từ đó |
| Cụm từ lặp trong một khung trả về mốc của lần đầu | `{ nth: 2 }` |
| `mentions()` bắt nhầm chữ "A" trong một từ khác | truyền danh sách chữ đứng trước (`["con", "xe"]`) |
| Tên SFX sai bị bỏ qua không báo | Đếm số SFX `lock-audio.mjs` in ra, so với số khung có `sfx` |
| Nhạc gần như không nghe thấy | `mix-balance.mjs`; video đầu: 0,3 cho nhạc dưới giọng 18 dB, 0,6 cho 12 dB |
| Lệnh `cd` trần làm lệch thư mục của các lệnh sau | Bọc trong ngoặc: `(cd "$P" && …)` |
| zsh không tách chữ trong biến | Gõ thẳng `npx -y hyperframes …`, không cất vào biến |
| `grep` báo lỗi trên log có ký tự lạ | `LC_ALL=C grep …` |

## 7. Mẫu báo cáo

Viết bằng tiếng Việt. Sáu mục đầu theo `vi-explainer-video`; hai mục cuối riêng cho video sa hình.

```markdown
**Kết quả:** projects/sat-hach-lai-xe/videos/<tên dự án>/renders/video.mp4 — 1920×1080, 30 fps, <thời lượng>, <dung lượng>.
Các tình huống: <danh sách>. Số khung: <N>. Mục tiêu <phút>; dài hơn <giây> vì <lý do>; cách rút: <…>.

**Giọng đọc:** Gemini <tên giọng>, <số> đoạn; chỗ whisper nghe khác kịch bản: <…>.
(Giọng nhân bản thì ghi:) giọng nhân bản <tên profile>, tạo trên máy bằng VoiceStudio; <số> đoạn,
<số> đoạn ghim seed. Dấu giọng tổng hợp: có ở mọi tệp.
Đây là giọng tổng hợp; mô tả video cần ghi rõ. Không dùng cho mục đích thương mại.
Chủ giọng cần nghe bản ghép trước khi xuất bản.

**Âm thanh:** <LUFS>, true peak <dBFS>; nhạc dưới giọng <dB>; <số> SFX.

**Đã kiểm:**
- chuyển động: audit-motion OK (0 xe chồng nhau, không rẽ gấp, không xe chạy ngoài tầm camera);
- hình: <số> contact sheet, <số> ảnh chụp thêm (xe đang chạy, từng kính lúp, bánh xe, chuyển câu);
- lint 0 lỗi; check passed; blackdetect 0; ảnh trích từ MP4 khớp ảnh chụp;
- câu hỏi, kết luận, tên biển so với brief: khớp; scan-words: clean;
- thứ tự xe và kết luận so với "Đối chiếu nguồn" của brief: khớp đáp án gốc ở cả <N> tình huống.

**Chưa kiểm:**
- chưa nghe âm thanh: cách phát âm, ngữ điệu, độ tự nhiên của giọng, độ hợp của nhạc;
- chưa xem chuyển động: độ mượt, nhịp, cảm giác tốc độ;
- phần giải thích luật: làm theo brief, <đã / chưa> được bên soạn brief đối chiếu với luật;
- <điều khác, ví dụ: số câu khác ba lần đầu chạy>.

**Lỗi đã chấp nhận:** <cảnh báo lint/check còn lại và lý do>.

**Đối chiếu brief** (chuyển cho bên sat-hach-lai-xe):
- <câu nào>: brief ghi <…>, ảnh cho thấy <…>, video dựng theo <…>;
- <nghi vấn về luật hay đáp án>;
- <điều lời đọc nói thêm ngoài brief>.
Không có gì thì ghi "Không có chỗ lệch".

**Tài sản:**
- dùng lại: <kiểu nút giao, mô hình, mặt biển>;
- sửa từ ví dụ: <…>;
- tạo mới: <mô hình, mặt biển, kiểu nút giao>, đã <chép / chưa chép> về skill.
```

Quy tắc khi viết báo cáo:

- Số đo lấy từ lệnh vừa chạy, không chép từ video trước.
- Bước nào bỏ qua thì ghi là bỏ qua. Phép kiểm nào còn báo lỗi thì dán dòng lỗi.
- "Chưa kiểm" không bao giờ trống: hai dòng đầu luôn đúng.
- Tạo mới thứ gì mà brief sau dùng lại được thì cập nhật danh sách "đã có" (`new-cases.md` §6).
