# Thực tế: video quảng cáo app, màn hình vẽ bằng code và camera 3D

Tổng hợp một lần làm thật: video quảng cáo cho một app đọc sách song ngữ trên iPhone và iPad. Chủ dự án nhận xét bản này "rất sống động". Trang này gom lại những cách làm đã dùng, để áp dụng cho video quảng cáo app, video giới thiệu sản phẩm và các video giải thích có nhiều cảnh giao diện. Mọi con số là số đo của lần chạy đó.

Cách làm từng bước nay nằm trong skill [`app-promo-video`](../.claude/skills/app-promo-video/SKILL.md), đặt trên [`vi-explainer-video`](../.claude/skills/vi-explainer-video/SKILL.md). Thư mục `videos/` không lên git, nên các đoạn mã mẫu được chép thẳng vào đây.

## Bài toán

- Lời đọc 10 khung đã được chủ dự án duyệt trước. Video phải khớp đúng bản app đang phát hành: tên sách, chữ trên nút, các màn hình.
- Chủ dự án chốt: **không dùng ảnh chụp màn hình**, kể cả để tham khảo. Mọi màn app vẽ lại bằng HTML/CSS, để màn hình chạy được và bay được trong không gian.
- Muốn có chuyển động góc máy 3D cho sống động, cộng thêm vài ý sáng tạo.
- Có một đoạn phát tiếng đọc thật của app (một câu tiếng Anh rồi câu dịch tiếng Việt), để người xem nghe được sản phẩm.

## Kết quả

| | |
|---|---|
| Video | 1920×1080, 30 fps, 161,2 giây, 10 khung, 67,5 MB; bản mạng xã hội (crf 21) 33 MB, SSIM 0,9976 |
| Âm thanh | −15,0 LUFS, LRA 2,8, true peak −3,8 dBFS; nhạc nằm dưới giọng 7,9 dB, lùi thêm 12 dB trong đoạn tiếng app |
| Kiểm | `lint` 0 lỗi; `check` đạt, tương phản 68/68 WCAG AA; `blackdetect` 0; đứng hình 5% (dài nhất 1,6 s) |
| Render | 2 phút 8 giây cho 4.835 khung hình (chụp 1 phút 11 giây, mã hoá 46 giây), CLI HyperFrames 0.8.181 |
| Màn hình app | khoảng 20 màn và mảnh giao diện vẽ bằng code: thư viện, trang đọc song ngữ, thẻ nghĩa, thanh nghe, menu, cài đặt, sổ từ, ôn tập, iPad hai cột |

## Công cụ đã dùng

| Việc | Công cụ | Ghi chú |
|---|---|---|
| Bộ giao diện app | Python sinh snippet HTML + một tệp `kit.css` | dựng từ mã SwiftUI và dữ liệu thật của app; có bảng xem trước vẽ bằng chính kit |
| Đo toạ độ trong màn | Chrome headless dựng trang kit, in toạ độ từng phần tử ra JSON | khung dùng toạ độ này để đặt chấm chạm, bản sao bay ra, vùng sáng chữ |
| Camera 3D | CSS `perspective` + `preserve-3d`, GSAP | theo rule `3d-camera-flight` và blueprint `camera-journey`, `device-surface-showcase` của skill `hyperframes-animation`; không WebGL |
| Giọng đọc | Gemini TTS (giọng Leda) | whisper nghe lại các cụm tiếng Anh trong lời Việt |
| Tiếng thật của app | một test XCTest bật bằng biến môi trường, chạy trên iPhone | ghi WAV thành attachment của xcresult; xoá test sau khi thu |
| Nhạc nền, hiệu ứng âm | Lyria; 7 hiệu ứng âm từ thư viện có sẵn, mốc theo từ (`sfx_at`) | đoạn lùi nhạc nướng sẵn vào WAV bằng ffmpeg |
| Khung, phụ đề, lắp ráp | HyperFrames `faceless-explainer`: frame packets, worker từng khung, `assemble-index`, `transitions.mjs` | 9 chuyển cảnh (blur-crossfade, zoom-through…) |
| Kiểm | `hyperframes lint`, `check`, `snapshot`; ffmpeg `ebur128`, `blackdetect`, `ssim`; `scripts/motion-audit.mjs` | |

## 1. Vẽ lại màn hình app bằng code

Đây là quyết định làm video sống động hơn cả. Ảnh chụp màn hình chỉ phóng, trượt và nghiêng được. Màn vẽ bằng code thì bấm được, cuộn được, chữ sáng theo tiếng đọc, và một mảnh có thể tách ra bay về phía người xem.

- **Dựng từ mã nguồn và dữ liệu của app, không từ ảnh.** Đọc View SwiftUI để lấy cỡ chữ, khoảng cách, màu, bo góc; lấy chữ nguyên văn từ tệp dữ liệu và tệp chuỗi của app. Kết quả là chữ trên hình đúng với bản phát hành, không có câu nào tự bịa.
- **Kích thước theo điểm iOS gốc.** Màn iPhone 440 × 956, iPad 1180 × 820. Không đổi cỡ từng mảnh; muốn to nhỏ thì scale cả máy. Vì thế mọi toạ độ đo một lần là dùng được ở mọi khung.
- **Một bộ kit dùng chung, mỗi khung đổi tiền tố.** Snippet dùng tiền tố `kx-`, khung chép vào thì đổi thành `fNN-`. Không sửa số của rule đã giữ. Mười khung do mười worker dựng vẫn ra cùng một app.
- **Một tệp luật cho worker** (`_app-ui-kit.md`): luật cứng, cách đặt máy, bảng toạ độ, gợi ý chuyển động, rồi các snippet. Liệt kê luôn những chỗ dễ sai: chữ nào in đậm, bìa sách nào phải cắt, xám của app chỉ đặt trên nền đen của app.
- **Đo toạ độ bằng trình duyệt, không ước lượng.** Script dựng một trang chứa các màn của kit, chờ `document.fonts.ready`, rồi in hình chữ nhật của từng phần tử ra JSON. Phải có `<base href>` trỏ về gốc dự án, nếu không font không nạp và mọi số đo chữ lệch theo font dự phòng (lần này sửa xong thì 57/105 toạ độ thay đổi).
- **Chạm là một chấm đặt đúng toạ độ đo được**, đúng lúc lời đọc nói tới thao tác đó. Mỗi khung có ít nhất một thao tác thật trong app.
- **Vật "bứt ra khỏi màn" là bản sao đặt ngoài thiết bị.** Màn app có `overflow: hidden` nên mọi thứ bên trong phẳng theo máy. Muốn thẻ nghĩa nổi lên trước máy, đặt một bản sao trong `.world`, khởi đầu đúng chỗ của bản gốc (tính từ toạ độ đo), ẩn bản gốc rồi mới cho bản sao tiến theo `translateZ`.
- **Chữ sáng theo tiếng đọc.** Snippet bọc mỗi chữ trong một `<span>`; mốc từng chữ lấy từ mốc thời gian của chính tệp tiếng (whisper word timestamps), rồi bật lớp sáng chữ theo mốc đó.
- **Có bảng xem trước vẽ bằng kit** (ảnh PNG render từ snippet). Worker nhìn đó thay cho ảnh chụp.
- **Không khung máy, không huy hiệu Apple.** Thiết bị chỉ là khối bo góc viền mảnh.

## 2. Camera 3D bằng CSS

Ngữ pháp chung cho cả mười khung. Ghi vào block `## Video direction` của storyboard để mọi worker theo cùng một cách.

```html
<div id="fNN-stage3d">   <!-- ống kính: perspective tĩnh, không bao giờ tween -->
  <div id="fNN-world">   <!-- thế giới: preserve-3d, chỉ applyCamera() được ghi transform -->
    … các vật thể, mỗi vật có translate3d / rotate riêng …
  </div>
</div>
```

```css
#fNN-stage3d { position: absolute; inset: 0; perspective: 1000px; perspective-origin: 960px 440px; }
#fNN-world   { position: absolute; inset: 0; transform-style: preserve-3d; transform-origin: 960px 440px 0; }
```

```js
const cam = { x: 0, y: 0, z: 0, rx: 0, ry: 0 };
function applyCamera() {
  // tịnh tiến bên ngoài, xoay bên trong: thứ tự cố định
  world.style.transform = "translate3d(" + cam.x + "px," + cam.y + "px," + cam.z + "px) rotateX(" + cam.rx + "deg) rotateY(" + cam.ry + "deg)";
  // vật quá gần ống kính thì mờ dần theo z, khỏi chắn hình khi camera bay qua
  for (const n of near) {
    const eff = cam.z + n.z;
    n.el.style.opacity = String(Math.max(0, Math.min(1, (n.n1 - eff) / (n.n1 - n.n0))));
  }
}
applyCamera();
tl.eventCallback("onUpdate", applyCamera);
tl.to(cam, { z: 1800, duration: 1.1, ease: "power4.out" }, 6.2);       // lao vào
tl.to(cam, { x: -120, duration: 1.2, ease: "power2.inOut" }, 12.68);   // đổi vị trí
```

- **Một ống kính tĩnh, một object `cam`, một hàm ghi.** Mọi tween camera tween `cam`, không tween `.world` trực tiếp. Seek tới giây bất kỳ cũng ra đúng hình.
- **Không `filter`, `opacity`, `overflow: hidden` trên `.world` và các lớp 3D cha:** chúng làm phẳng cả cảnh. Muốn mờ thì đặt opacity lên từng vật.
- **Ease theo việc:** lao tới hay lặn sâu dùng `power4.out`; đổi vị trí dùng `power2.inOut` trong 0,9 đến 1,4 s.
- **Giới hạn góc:** |rx| ≤ 65°, |ry| ≤ 30°.
- **Chữ cần đọc phải gần như đối diện camera ít nhất 1 s.** Giao diện app chỉ nghiêng khi đang bay vào, bay ra hoặc đổi máy; lúc người xem cần đọc thì phẳng. Tiêu đề của video cũng vậy.
- **Nền phẳng nằm ngoài thế giới 3D.** Tối đa ba quả cầu glow mờ, trôi chậm bằng tween tường minh (không lặp vô hạn).
- **Giữ dưới khoảng 40 phần tử dùng `radial-gradient`, `blur`, `clip-path`** cùng lúc trên hình, để không ra khung đen (pitfalls mục 28).

## 3. Những ý sáng tạo đã dùng

| Khung | Ý | Vì sao hợp |
|---|---|---|
| 1 | trang vở chép từ nằm nghiêng như mặt bàn, camera lướt dọc dòng; các từ mờ dần, riêng từ "miser" bứt khỏi trang bay vào bức tranh | hình hoá "chép rồi quên"; chính từ bay đi làm cầu nối sang khung sau |
| 2 | tranh minh hoạ cổ có thẻ thành ngữ nối bằng đường kẻ; camera lặn xuống đường hầm hang thỏ (các vòng viền xếp theo chiều sâu, quân bài bay qua, Alice rơi xoay) | thành ngữ "down the rabbit hole" được diễn bằng chính chuyển động camera |
| 3 | hành lang bìa sách đứng trong không gian, camera bay dọc, dừng ở dấu "hết thời hạn bảo hộ bản quyền" | cho thấy "cả một tủ sách" mà không phải xếp lưới |
| 4 | đoạn tiếng Anh, bản dịch lật ra từ phía sau quanh bản lề; nhãn trình độ hiện trên bìa | "bản dịch đi kèm" thành một thao tác thấy được |
| 5 | máy lật sang iPad hai cột khi lời nói "hai cột song song trên iPad" | đổi máy ngay giữa câu, không cần cắt cảnh |
| 6 | chạm từ, thẻ nghĩa tách khỏi màn, nổi lên trước máy (`translateZ`), có nhãn chú thích chỉ vào phiên âm | người xem nhìn thấy đúng tính năng lúc lời nhắc tới |
| 7 | trang ngụ ngôn, thanh nghe "Anh rồi Việt", chữ sáng theo tiếng đọc thật của app, menu tốc độ, danh sách giọng | khung chính: nghe được sản phẩm, không chỉ nhìn |
| 8 | chồng thẻ ôn lật 3D; đám mây iCloud bay ra từ hàng cài đặt; iPhone lùi vào sâu, iPad tiến ra cùng trang đang đọc | "đọc tiếp trên máy khác" diễn bằng hai thiết bị đổi chỗ trong không gian |
| 9 | dải ô video ngắn chung chung (không logo) cuộn nhanh, chậm lại, đổ ra sau; trang sách hiện lên, đang đọc to | đối lập "lướt video" và "đọc sách" chỉ bằng nhịp chuyển động |
| 10 | biểu tượng app giữa bốn ý (miễn phí, không quảng cáo…), cuốn sách mở ra phát sáng nhẹ | khép video bằng một hình đơn giản, dễ nhớ |

Rút ra cho video khác:

- **Diễn ẩn dụ của lời bằng camera.** Lời nói "rơi xuống hang thỏ" thì camera rơi; lời nói "cả một tủ sách" thì camera bay qua tủ. Chuyển động đó mang nghĩa, nên sống động mà không thành trang trí.
- **Vật ở cuối khung trước làm cầu nối sang khung sau** (từ bay vào tranh, máy lật thành iPad). Đỡ phải crossfade ở mọi chỗ cắt.
- **Bay, rồi dừng để đọc, rồi bay tiếp.** Mỗi chặng bay kết thúc ở một tư thế phẳng có chữ, giữ đủ lâu để đọc.
- **Tính năng nào cũng có một thao tác thật** đúng lúc lời đọc nhắc tới: chạm, mở menu, chọn giọng, lật thẻ.

## 4. Tiếng thật của sản phẩm trong video

- **Thu bằng chính mã của app.** Một test XCTest chỉ chạy khi có biến môi trường, gọi đúng bộ đọc của app (tiếng Anh qua `AVSpeechSynthesizer.write`, tiếng Việt qua bộ đọc riêng của app) với giọng và tốc độ mặc định, rồi ghi WAV thành attachment của xcresult. Chạy trên máy thật, lấy tệp bằng `xcresulttool export attachments`. Không cần ghi màn hình, không cần mic. Test là đồ tạm: thu xong thì xoá, không commit.
- **Ghép vào giọng đọc của khung:** lời trước + 0,5 s lặng + câu Anh + 0,35 s + câu Việt + 0,7 s + lời sau. Khung đó có mốc chữ chính xác ngay trong tệp giọng.
- **Nhạc lùi xuống trong đoạn demo.** `assemble-index` không giảm nhạc theo từng đoạn, nên nướng sẵn vào tệp nhạc bằng biểu thức volume của ffmpeg (−12 dB, dốc 0,4 s):

  ```sh
  A=95.93 B=100.63 R=0.4 G=0.25   # bắt đầu, kết thúc (giây trên cả video), độ dài dốc, mức giữ (0.25 ≈ −12 dB)
  ffmpeg -i track.wav -af "volume='if(lt(t,$A-$R),1,if(lt(t,$A),1-(1-$G)*(t-($A-$R))/$R,if(lt(t,$B),$G,if(lt(t,$B+$R),$G+(1-$G)*(t-$B)/$R,1))))':eval=frame" track-duck.wav
  ```

  Rồi trỏ `bgm.path` trong `audio_meta.json` sang `track-duck.wav`, chạy lại `mix-balance` để đặt `bgm.volume`.
- **Không phụ đề trong đoạn demo.** Tách nhóm phụ đề để khoảng đó trống; trên hình đã có chữ của app sáng theo tiếng đọc.
- **Ghi rõ giọng nào được thu.** Lần này máy chưa tải giọng tiếng Anh nâng cao, nên câu Anh là giọng hệ thống bản thường. Người xem nghe đúng cái app phát ra trên một máy bình thường.

## 5. Lời đọc và nhịp

- **Chốt lời trước khi dựng.** Lời đã duyệt thì storyboard đặt mốc giây theo giọng thật (word timestamps), không theo ước lượng.
- **Thời lượng do lời quyết định.** Ước 110 s, thực tế 161 s vì giọng đọc rõ và khung 7 có 4 s nghe thử. Báo cho chủ dự án thay vì nén giọng.
- **Whisper nghe lại các cụm tiếng Anh nằm trong lời Việt** ("a Scrooge", "down the rabbit hole"). Chữ whisper nghe khác là chỗ cần người nghe, chưa phải lỗi.
- **Hiệu ứng âm đặt theo từ** (`sfx_at`), không theo giây, để lời có đổi thì tiếng vẫn khớp hình.

## 6. Bẫy kỹ thuật gặp lần này

Chi tiết từng mục ở [`pitfalls.md`](../.claude/skills/vi-explainer-video/references/pitfalls.md), mục 49 đến 53.

- **`tl.set(el, { visibility: "hidden" }, t)` ở một giây về sau làm phần tử ẩn ngay từ đầu khung** trong snapshot và render. Điện thoại khung 5 mất 3 s đầu, thẻ nghĩa khung 6 mất lúc đang trượt lên. Muốn ẩn ở giữa khung thì dùng tween opacity rất ngắn:

  ```js
  tl.fromTo("#fNN-x", { opacity: 1 }, { opacity: 0, duration: 0.02, ease: "none", immediateRender: false }, t);
  ```

  `visibility: "inherit"` để *hiện* ra thì vẫn đúng.
- **Linter không đọc được vars bọc trong hàm phụ** (`L({...})` gán `immediateRender`). Viết `immediateRender: false` thẳng vào object; `fromTo` trên phần tử đang ẩn phải có `opacity: 1` ở đích.
- **Chữ trang sách cuộn dưới thanh công cụ là đúng như app thật**, nhưng `check` báo `content_overlap`. Đặt `data-layout-allow-overlap` lên `.screen` của máy (không phải lên gốc khung).
- **Màu hệ thống của app chưa chắc đủ tương phản trong video.** Huy hiệu đỏ iOS `#FF453A` với chữ trắng chỉ 3,41:1; đổi `#D42F28` (4,96:1) vẫn trông như huy hiệu.
- **Chữ tiêu đề còn trên hình khi thiết bị khác bay vào.** Cho chữ mờ đi xong trước khi vật mới tới (ease `power2.out`, bắt đầu sớm hơn khoảng 0,25 s), thay vì mờ cùng lúc.
- **Bản render to hơn mục tiêu** (−12,5 LUFS sau khi tăng `bgm.volume`). Đo rồi hạ cả tiếng mà không mã hoá lại hình: `ffmpeg -i video-raw.mp4 -c:v copy -af volume=-2.5dB -c:a aac -b:a 192k -movflags +faststart video.mp4`.
- **Bản cài skill thiếu `references/frame-worker-core.md`**, nên `frame-packets.mjs` hỏng ở bước `_role.md`. Dùng lại `_role.md` của một dự án trước.

## 7. Kiểm trước khi giao

1. `lint` 0 lỗi; `check` đạt. Đọc kỹ cảnh báo `content_overlap` và tương phản, sửa thật hoặc ghi lý do chấp nhận.
2. Snapshot nhiều thời điểm và **đọc contact sheet**. Riêng chỗ có lật, đổi máy, ẩn hiện thì chụp dày (5 đến 6 ảnh trong 3 giây), vì lỗi chỉ lộ ở đó.
3. Chụp thêm ở cuối từng khung (`--at <cuối khung − 0,35 s>`).
4. Render, rồi đo: ffprobe, `ebur128` (−14 đến −16 LUFS, đỉnh ≤ −1 dBTP), `blackdetect`.
5. **Trích ảnh từ chính tệp MP4** (hai ảnh mỗi khung, ghép lưới) và đọc lại: snapshot đúng chưa chứng minh MP4 đúng.
6. `motion-audit` (lần này 5% đứng hình).
7. Bản mạng xã hội crf 21, SSIM ≥ 0,98. Cần gửi qua chat thì làm thêm bản 720p (lần này 13,6 MB), vì giới hạn gửi tệp là 30 MiB.

## Chưa kiểm và còn tồn tại

- Agent không nghe được. Giọng đọc, đoạn tiếng app và nhịp nhạc phải do người nghe. Whisper nghi một chữ đọc méo ("phiêu lưu" nghe ra "Filial").
- Chuyển động chỉ được xem qua ảnh tĩnh và số đo `motion-audit`, chưa xem bằng mắt trước khi giao. Chủ dự án xem bản cuối và duyệt.
- Còn vài `content_overlap` mức info ở khung cuối, lúc các thẻ đang bay vào; ảnh chụp cho thấy chữ vẫn đọc được.

## Làm lại với app khác

1. Lấy mã nguồn giao diện và dữ liệu thật của app. Dựng bộ kit HTML/CSS theo điểm iOS gốc, kèm bảng xem trước và tệp luật cho worker.
2. Đo toạ độ bằng Chrome headless (có `<base href>`, chờ font).
3. Chốt lời. Tạo giọng, rồi đặt mốc storyboard theo giọng thật.
4. Viết `## Video direction`: bảng màu, ngữ pháp camera, luật giao diện app phẳng khi cần đọc, giới hạn hiệu ứng.
5. Với mỗi khung, tìm một chuyển động camera diễn đúng ý của lời, và một thao tác thật trong app.
6. Nếu app có tiếng, thu tiếng thật bằng test tạm, ghép vào giọng, nướng đoạn lùi nhạc.
7. Kiểm theo mục 7, báo rõ điều chưa kiểm, nhờ người nghe trước khi đăng.
