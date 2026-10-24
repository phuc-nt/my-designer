# Web 3D, kiểm tra trên trình duyệt, studio và đưa lên mạng

Web và studio dùng chung một nguồn: hình học trong `tools/house.mjs` và các góc nhìn trong `web/content.js`. Sửa một trong hai file đó rồi dựng lại, không sửa sản phẩm.

## 1. `web/content.js`: góc nhìn và lời văn

File này xuất bốn tên: `VIEWS`, `LEVEL_TAGS`, `HINTS`, `PLAN`. Mọi chữ tiếng Việt riêng của căn nhà nằm ở đây. `index.html`, `styles.css`, `app.js`, `plan.js` không chứa gì về một căn nhà cụ thể.

Mỗi phần tử của `VIEWS` là một nút ở hàng nút phía trên:

| Trường | Ý nghĩa |
|---|---|
| `key` | Mã của góc nhìn. Cũng là địa chỉ: `#f1`, `#f1/plan`. |
| `chip` | Chữ trên nút. `variant: true` tô nút theo kiểu phương án. |
| `kicker`, `title`, `sub` | Dòng nhỏ viết hoa, tiêu đề, câu mô tả. |
| `floors` | Mã các tầng được vẽ. |
| `focus` | Các tầng mà máy quay lấy làm khung. Mặc định là tất cả `floors`. |
| `hide` | `{ <mã tầng>: [<mã bộ phận>…] }`: bộ phận ẩn đi ở góc nhìn này. |
| `labels` | Mã tầng có nhãn phòng được hiện. |
| `tags` | Các tầng có thẻ tên và cao độ bên cạnh, lấy chữ từ `LEVEL_TAGS`. |
| `stack` | `{ <mã tầng>: <thứ tự> }`: thứ tự tầng cho thanh "Bóc tầng". |
| `cut` | `true`: mặc định cắt tường ở 1,25 m. `false`: mặc định tường cao đủ. `null`: không có nút "Cắt tường". |
| `plan` | Mã bản vẽ 2D (`web/cad/<mã>.svg`). Có trường này thì góc nhìn có thêm chế độ "Bản vẽ". |
| `camera`, `cameraPortrait`, `cameraWide` | Góc máy đầu tiên `{ az, el }` theo độ, cho màn hình thường, màn hình dọc, màn hình ngang thấp. |
| `notes` | Các khối chữ trong bảng thông tin. |
| `actions` | Các nút bật tắt một bộ phận chuyển động, hiện ở hàng nút phía dưới mô hình. |
| `spots` | Các chỗ đứng trong nhà: bấm thì máy quay bay vào tầm mắt người. |
| `spotOnly` | `{ <mã tầng>: [<mã bộ phận>…] }`: bộ phận chỉ hiện khi đang đứng trong nhà, ví dụ trần. |
| `studio` | `false`: không tạo trang studio. `{ title, sub, note }`: lời khác cho trang studio. |

`az: 0` đặt máy quay ở phía trước nhà (`+z`), số dương quay dần sang phía `x` lớn. `el` là góc nhìn xuống.

Mỗi khối của `notes` có `heading` và một trong bốn kiểu:

```js
{ heading: 'Ghi chú', items: ['Câu một.', 'Câu hai.'] }
{ heading: 'Phần giả định', text: 'Một đoạn văn.' }
{ heading: 'So sánh', table: { head: ['', 'Bản gốc', 'Phương án A'], rows: [['Số phòng ngủ', '2', { text: '3', best: true }]] } }
{ heading: 'Tải về', links: [{ label: 'Cả bộ bản vẽ', kind: 'PDF', href: '{plans}' }, { label: 'Bảng phòng', kind: 'CSV', href: 'cad/rooms.csv', download: true }] }
```

Bộ phận chuyển động và chỗ đứng:

```js
actions: [
  { key: 'doors', label: 'Mở cửa lùa', title: 'Kéo cánh cửa kính sang bên', ms: 1400,
    moves: [{ floor: 'f1', parts: ['slide-1', 'slide-1-upper', 'slide-1-glass', 'slide-1-glass-upper'], shift: [0, 0, -1.2] }] },
  { key: 'screen', label: 'Hạ màn chiếu', uncut: true,
    moves: [{ floor: 'f1', parts: ['screen'], scale: { anchor: [0, 3.85, 0], from: [1, .012, 1], to: [1, 1, 1] } }] },
],
spots: [{ key: 'sofa', label: 'Ngồi sofa', floor: 'f1', eye: [2.5, 1.05, 7.0], look: [2.0, 1.45, 9.7], fov: 66, note: 'Một câu tả cái đang thấy.' }],
spotOnly: { f1: ['ceiling-upper'] },
```

- `shift` dời bộ phận theo mét. `scale` co giãn quanh điểm `anchor`: mô hình dựng bộ phận ở trạng thái mở hết, `from` là trạng thái lúc chưa bấm. `uncut: true` tắt cắt tường khi bật, dùng cho bộ phận nằm trên mặt cắt.
- `eye` và `look` là tọa độ trong tầng `floor`, trình xem tự cộng cao độ của tầng. `fov` tính cho màn hình ngang. Đặt `eye` cách tường và cánh cửa ít nhất 0,3 m. Ở chỗ đứng, tường hiện cao đủ, nhãn phòng ẩn đi, kéo để nhìn quanh. Trên màn hình dọc góc mở tự rộng thêm.
- Xem ảnh từng chỗ đứng ở cả màn hình dọc lẫn ngang trước khi báo: chỗ đứng đặt sai sẽ chỉ thấy một mảng tường.

`'{plans}'` trong `href` là file PDF của cả bộ. `best: true` tô đậm ô tốt hơn trong bảng so sánh.

`HINTS` là dòng hướng dẫn thao tác. `PLAN` là lời của chế độ bản vẽ: tiêu đề bảng, cách đọc số đo, tên các nút tải về. Số liệu trong chế độ bản vẽ lấy từ `web/data/building.json`, không viết trong `content.js`.

Cách viết: câu ngắn, giọng tự nhiên, không dùng dấu gạch ngang dài. Con số nào là ước lượng thì giữ dấu `≈`.

## 2. Dựng dữ liệu cho web

```bash
node projects/<name>/tools/build-web.mjs
python3 -m http.server 8080 --directory projects/<name>/web     # xem tại http://localhost:8080
```

`build-web.mjs` ghi `web/data/house.json`, chép ảnh vân vào `web/textures/` và three.js vào `web/vendor/`. Nó cũng ghi lại `<title>` và câu mô tả của `web/index.html` theo `project.json`. Chạy `build-plans.mjs` trước: chế độ bản vẽ cần `web/cad/` và `web/data/building.json`.

## 3. Những gì trình xem phải giữ

Đây là các điểm người dùng đã yêu cầu hoặc đã sửa. Đổi giao diện thì vẫn phải giữ đủ.

1. **Nhãn bám theo mô hình.** Nhãn phòng là phần tử HTML, chiếu lại từ một điểm 3D ở mỗi khung hình. Xoay, phóng, dời mô hình thì nhãn đi theo.
2. **Nút "Chú thích" bật tắt toàn bộ nhãn** để xem mô hình trần.
3. Khi hai nhãn chồng nhau, phòng nhỏ hơn bỏ dòng thứ hai, rồi ẩn hẳn. Thứ hạng lấy từ `≈ N m²` trong dòng phụ của nhãn.
4. **Dùng được trên điện thoại.** Điện thoại dọc: bảng thông tin trượt từ dưới lên. Màn hình rộng và điện thoại xoay ngang: bảng nằm bên cạnh. Trang không bao giờ cuộn ngang.
5. "Cắt tường" đổi giữa tường cắt 1,25 m và tường cao đủ. "Từ trên" nhìn thẳng xuống. "Góc đầu" về góc máy ban đầu.
6. Chế độ "Bản vẽ": kéo để dời, chụm hoặc cuộn để phóng. Bốn công tắc "Số đo", "Chú thích", "Nội thất", "Trục" ẩn hiện từng nhóm nét. "Vừa khung" đưa cả bản vẽ về giữa. Chạm một phòng mở thẻ có diện tích và thông thủy.
7. **Số ước lượng phải nhận ra được**: màu xanh và trong ngoặc trên bản vẽ, dấu `≈` trước diện tích, và phần "Cách đọc số đo".
8. Địa chỉ giữ trạng thái: `#f2a` là mô hình, `#f2a/plan` là bản vẽ. Gửi địa chỉ cho người khác thì họ mở đúng chỗ đó.

`window.viewer` trong trình duyệt cho phép thử nhanh: `setView(key)`, `setMode('plan')`, `setExplode(0.6)`, `pose()`, `setPose(…)`, `showRoom(code)`.

## 4. Kiểm tra trên trình duyệt

```bash
node projects/<name>/tools/check-web.mjs                          # tự phục vụ web/ và kiểm tra
node projects/<name>/tools/check-web.mjs https://<địa chỉ>/        # kiểm tra bản đã đưa lên mạng
VERBOSE=1 node projects/<name>/tools/check-web.mjs --sizes phone --views f1,f2
```

Chạy trong Chromium không màn hình ở bốn cỡ: `phone` 390 × 844, `small` 360 × 740, `landscape` 844 × 390, `desktop` 1440 × 900. Với mỗi góc nhìn nó kiểm tra:

- Thanh nút nằm trong màn hình và các nút không đè nhau. Trang không cuộn.
- Nhãn di chuyển khi xoay máy quay. Một nút ẩn và hiện được toàn bộ nhãn.
- Chế độ bản vẽ mở được, bốn công tắc hoạt động, thẻ phòng mở ra không bị che và đóng lại được, phóng to rồi "vừa khung" trả về đúng chỗ.
- Mọi đường tải về và đường dẫn trong ghi chú trả lời 200. Không có lỗi trong console.

Ảnh chụp nằm trong `tmp/check-web/`. Lệnh thoát với mã 1 khi có mục hỏng. Thiếu `playwright` thì nó nói cách cài.

Khi kiểm `web/` trên máy (không phải địa chỉ mạng), trước trình duyệt nó chạy phần kiểm tĩnh `ui gate` (gói `ease-design`, devDependency của my-designer, tìm `node_modules/.bin/ui` từ dự án đi lên):

- Dòng `static`: lỗi a11y (tương phản, nhãn) và layout là mục hỏng. `STATIC_ALLOW` ở đầu tệp liệt kê báo nhầm đã biết: chữ trắng trên thẻ tối trong suốt đặt trên canvas (`#hint`), vì `gate` bỏ qua độ trong suốt của nền.
- Dòng `note static`: góp ý (taste, tell, `heading-empty` do tiêu đề được điền lúc chạy). Không chặn.
- Dòng `skip static`: không tìm thấy `ui`. Ghi "chưa kiểm tĩnh" vào báo cáo.

Thêm vào `STATIC_ALLOW` chỉ khi đã nhìn ảnh và thấy chữ đọc được, kèm một dòng chú thích vì sao.

**Lệnh này kiểm tra hành vi, không kiểm tra hình thức.** Sau khi nó báo đạt, vẫn phải mở ảnh chụp: mô hình có nằm giữa khung không, nhãn có đè lên nhau không, bảng thông tin có che mất nhà không.

## 5. Trang studio

```bash
node bootstrap.mjs --status                                   # máy chủ studio phải đang chạy, xem AGENTS.md
node projects/<name>/tools/build-studio.mjs
bin/dsa projects inspect <id> --mode page --page 1 --max-dimension 1600 --output view.png
```

- Lần chạy đầu tạo dự án studio (tên và mô tả lấy từ `project.json`), tải ảnh vân lên, ghi `studio.json`. Các lần sau ghi vào đúng dự án đó.
- Mỗi góc nhìn của `content.js` thành một trang 1600 × 1000: mô hình, khối tiêu đề, nhãn phòng.
- Trên trang tầng, phần tường trên mặt cắt nằm trong nhóm "Phần trên mặt cắt 1,25 m" và đang ẩn. Nhãn nằm trong nhóm "Chú thích". Người dùng bật tắt hai nhóm đó trong danh sách lớp.
- Lệnh in ra `Saved, revision N. In the studio: /?project=<id>`. Mở địa chỉ đó trên máy chủ studio.
- `--dump <file>` chỉ ghi tài liệu ra file, không lưu vào studio.

Giới hạn, nói rõ khi bàn giao:

| Giới hạn | Hệ quả |
|---|---|
| **Mỗi lần chạy thay toàn bộ các trang.** | Sửa tay trong studio sẽ mất. Sửa `house.mjs` hoặc `content.js` rồi dựng lại. |
| Không có thanh "Bóc tầng", không có chuyển động. | Trang toàn nhà là một hình tĩnh. |
| Chỉ dùng `camera`, bỏ qua `cameraPortrait` và `cameraWide`. | Trang studio có một tỷ lệ khung. |
| Nhãn trên trang studio là chữ 2D. | Xoay máy quay trong studio thì nhãn không đi theo. Muốn nhãn bám mô hình thì dùng web. |
| Tương tác (interaction) không chạy trên trang 3D. | Đừng hứa nút bấm trong studio. |
| Bóng đổ chỉ phủ khoảng ±5 đơn vị quanh gốc. | Công cụ đã tự thu mô hình cho vừa. Đừng phóng mô hình lên. |
| Xuất mp4 chạy theo thời gian thực. | Cần video thì xuất chuỗi PNG rồi ghép bằng ffmpeg. |

Quy tắc chung của studio (kiểm tra số phiên bản khi ghi, `update-node` thay cả trường, xem ảnh trước khi khẳng định) nằm trong `AGENTS.md` và `.claude/skills/my-designer-3d/SKILL.md`.

## 6. Đưa lên Cloudflare Pages

Chỉ làm khi người dùng yêu cầu. **Địa chỉ `*.pages.dev` là công khai**: ai có địa chỉ đều mở được. Với một ngôi nhà thật, nói điều đó và chờ người dùng đồng ý trước khi đưa lên.

```bash
wrangler pages project create <tên pages> --production-branch main        # một lần
wrangler pages deploy projects/<name>/web --project-name <tên pages> --branch main --commit-dirty=true 2>&1 | grep -v "@\|account"
```

- `grep` ở cuối bỏ các dòng có địa chỉ email và tên tài khoản khỏi kết quả in ra.
- `web/_headers` đã chặn máy tìm kiếm lập chỉ mục. Đó không phải là mật khẩu.
- Trước khi đưa lên: `build-plans.mjs`, `build-web.mjs`, `check-web.mjs` đều đạt. Sau khi đưa lên: chạy `check-web.mjs <địa chỉ>` và mở trang trên điện thoại thật nếu có thể.
- Ghi địa chỉ và tên dự án Pages vào `CLAUDE.md` của dự án.
