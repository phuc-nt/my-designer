# Khung dây, bản dọc, bản lặp

Ba việc làm thêm quanh một video app đã có storyboard. Cả ba dùng lại âm thanh và nhịp của bản chính, không làm lại giọng hay nhạc.

## 1. Duyệt khung dây trước khi lên da

Lỗi đắt nhất là bố cục và nhịp: máy đặt sai chỗ, tiêu đề vào muộn, khung đứng quá lâu. Những lỗi đó lộ rõ khi chưa có màu, ánh sáng hay hoạ tiết làm người xem phân tâm. Bản khung dây giữ nguyên mọi chuyển động, ẩn hiện và cắt cảnh, chỉ bỏ lớp da: mọi hộp thành viền xám trên nền giấy sáng, chữ thành chữ viền, ảnh mờ đi.

Làm khi worker đã dựng xong khung (bước 9 của SKILL.md) và đã lắp ráp lần đầu (bước 10):

```bash
node "$AP"/scripts/wireframe.mjs on .
hyperframes render --quality draft --output renders/wireframe.mp4
node "$AP"/scripts/wireframe.mjs off .
bash "$AP"/scripts/split-view.sh renders/video.mp4 renders/wireframe.mp4 renders/split.mp4   # nếu đã có bản render thật
```

- `wireframe.mjs` chỉ chèn một khối `<style>` vào `index.html`, không đụng `compositions/`. `assemble-index` viết lại `index.html` nên cũng xoá khối đó; cần thì chạy `on` lại.
- **Luôn chạy `off` trước bản render thật.** `wireframe.mjs status .` cho biết đang bật hay tắt.
- Gửi chủ dự án `renders/wireframe.mp4` (hoặc `split.mp4`, bản thật bên trái, khung dây bên phải, tiếng của bản thật) kèm câu hỏi cụ thể: chỗ đặt máy, thứ tự vào của chữ, khung nào quá dài. Duyệt xong bố cục và nhịp mới sửa màu, ánh sáng, hoạ tiết.
- Agent tự xem thì trích ảnh như mọi bản render: `ref-study.mjs study renders/wireframe.mp4`. Trên khung dây dễ thấy chữ chồng nhau, vật lấn vào vùng phụ đề và hai vật tranh chỗ.

## 2. Bản dọc 9:16

Bản dọc là **dựng lại bố cục**, không phải cắt giữa bản ngang: cắt giữa thì mất tiêu đề hai bên, chữ còn quá nhỏ. Cùng giọng, nhạc, phụ đề, cùng mốc giây của từng khung; chỉ hình được đặt lại.

### Dựng

```bash
cd "$ROOT/videos"
rsync -a --exclude renders --exclude snapshots --exclude 'compositions/frames' <ten-du-an>/ <ten-du-an>-doc/
cd <ten-du-an>-doc && mkdir -p compositions/frames
```

1. Trong frontmatter của `STORYBOARD.md`, đặt `format: 1080x1920`. Các script của faceless đọc khổ từ đây.
2. Viết lại block `## Video direction` theo khổ dọc (bảng dưới). Các dòng Scene giữ nguyên mốc giây, chỉ sửa chỗ đặt.
3. Chạy lại `frame-packets.mjs`, `ui-kit.mjs doc`, chép `_camera-rig.html`, rồi giao lại worker như bước 9 của SKILL.md, thêm vào `{EXTRA}` dòng:

   ```text
   - Portrait 1080×1920: this is a re-layout of the landscape frame <đường dẫn tệp khung bản ngang>, same beats and same seconds. Read it first, keep every idea, move and tap; change only placement and sizes as Video direction says. Captions own y ≥ 1600: nothing stops there.
   ```

4. Lắp ráp, kiểm, render như bản ngang. `ui-kit.mjs point` dùng lại được, chỉ đổi `--left`, `--top` và `--scale` theo chỗ đặt mới.

### Số đo khổ dọc

| | Ngang 1920 × 1080 | Dọc 1080 × 1920 |
|---|---|---|
| Vùng phụ đề | y ≥ 896 (1/6 dưới) | y ≥ 1600 (320 px dưới); nội dung dừng ở y ≤ 1580 |
| Stage của camera (`#fNN-vp`) | 1920 × 888 | 1080 × 1600 |
| `perspective-origin` | 960px 444px | 540px 800px |
| iPhone 6.9" | scale 0.86, `left:760; top:26`, đáy 869 | scale 1.3 → 603 × 1274, `left:238; top:250`, đáy 1524 |
| Tiêu đề | cạnh máy | trên máy, y 80–230, hoặc thẻ đè lên nửa dưới máy |
| Cỡ chữ ngoài app | theo `frame.md` | khoảng × 1.3, tối đa khoảng 14 ký tự một dòng tiêu đề |

- Hai vật đặt cạnh nhau ở bản ngang thì xếp trên dưới ở bản dọc, hoặc lần lượt vào. Ba thẻ một hàng thường phải thành ba thẻ một cột.
- Camera lia ngang ở bản ngang thường đổi thành lia dọc hay đẩy vào ở bản dọc, để vật đi theo chiều dài của khung.
- iPad ngang không vừa khổ dọc ở cỡ đọc được: dùng iPhone, hoặc xoay iPad dọc nếu kit có màn dọc.
- **Đăng Reels, TikTok, Shorts:** nút và tên kênh của nền tảng che khoảng 400 px dưới và 140 px bên phải. Kéo phụ đề lên cho đáy chữ cách mép dưới khoảng 600 px (sửa trong `.hyperframes/caption-skin.html`), và giữ chữ quan trọng ngoài cột phải. Cách này chưa được thử trên một bản thật; kiểm bằng ảnh chụp trước khi đăng.

### Duyệt

```bash
bash "$AP"/scripts/split-view.sh ../<ten-du-an>/renders/video.mp4 renders/video.mp4 renders/ngang-doc.mp4 720
```

Hai bản đặt cạnh nhau cùng chiều cao, chạy cùng tiếng: nhìn một lượt là thấy khung nào ở bản dọc vào trễ, thiếu ý hay chật.

## 3. Bản lặp

Video ngắn tự phát lại trên mạng xã hội. Khi khung cuối nối êm về khung đầu, người xem không thấy chỗ lặp và thường xem thêm một vòng.

- Thiết kế từ storyboard: khung cuối kết thúc **đúng tư thế khung đầu bắt đầu**: cùng màn app, cùng chỗ đặt máy, cùng camera. Chữ chốt và lời mời hiện rồi rời đi trước khoảng 0,5 s cuối.
- Âm thanh: nhạc cần một đoạn kết nối được về đoạn đầu. Với Lyria, xin nhạc có "seamless loop" trong prompt, rồi `afade` 0,3 s ở hai đầu nếu vẫn còn vấp.
- Khung đầu không dùng `transition_in` mờ dần từ đen: lặp lại sẽ thấy nháy đen.
- Kiểm bằng số:

  ```bash
  node "$AP"/scripts/ref-study.mjs loop renders/video.mp4            # SSIM khung đầu và khung cuối, phải ≥ 0.97
  ```

  Lệnh trả mã 2 khi chưa đạt, và để lại `renders/loop-first-last.jpg` (khung đầu | khung cuối). Đọc ảnh đó, xem vật nào lệch, rồi sửa khung cuối, không sửa khung đầu.

Bản lặp thường là bản dọc ngắn (15–30 s) cắt từ storyboard chính. Viết thành storyboard riêng; không cắt bằng ffmpeg từ bản dài, vì chỗ cắt sẽ rơi giữa câu.
