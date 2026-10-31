---
name: app-promo-video
description: "Dựng video quảng cáo hay giới thiệu app (iOS, Android, web) tiếng Việt 1920×1080 có lời đọc: màn hình app vẽ lại bằng HTML/CSS từ mã nguồn của app (không ảnh chụp), toạ độ đo bằng Chrome, camera 3D bằng CSS, thao tác thật trong app, tiếng thật của app ghép vào giọng đọc. Chạy trên quy trình vi-explainer-video. Dùng khi người dùng nói: 'video quảng cáo app', 'video giới thiệu app', 'promo app', 'video ra mắt tính năng', 'làm video như Open Book', 'video app có màn hình chạy'. Phim ngắn không lời thì dùng short-film-video."
---

# Video quảng cáo app

Skill này là lớp đặt lên `vi-explainer-video`. Mọi bước giọng đọc, phụ đề, nhạc, lắp ráp và render vẫn làm theo skill đó. Skill này thêm phần riêng của video app:

- **Bộ giao diện app vẽ bằng code.** Màn bấm được, cuộn được, chữ sáng theo tiếng, mảnh giao diện tách ra bay trong không gian.
- **Toạ độ đo bằng trình duyệt.** Chấm chạm, bản sao bay ra và vùng sáng chữ đều nhắm theo số đo, không theo mắt.
- **Camera 3D bằng CSS.** Một ngữ pháp chung cho mọi khung, mỗi chuyển động diễn đúng ý của lời.
- **Tiếng thật của sản phẩm** ghép vào giọng đọc, với nhạc lùi xuống trong đoạn đó.

Làm ra từ video Open Book v3. Tài liệu đầy đủ của lần đó, có số đo và bảng ý từng khung: [`docs/app-promo-video-practice.md`](../../../docs/app-promo-video-practice.md). Đọc tài liệu đó một lần trước video app đầu tiên.

Skill kèm theo:

| Tệp | Việc |
|---|---|
| `scripts/new-project.sh` | tạo dự án trong `videos/<tên>`, chép font, dựng khung kit `.hyperframes/app-ui-kit/` |
| `scripts/ui-kit.mjs` | `measure`, `preview`, `doc` (tệp luật cho worker), `snippet` (đổi tiền tố), `point` (toạ độ trên khung) |
| `scripts/splice-voice.mjs` | ghép tiếng app vào giọng của một khung, dời mốc chữ, ghi mốc từng đoạn |
| `scripts/duck-bgm.mjs` | nướng đoạn lùi nhạc vào tệp nhạc, trỏ `bgm.path` sang tệp mới |
| `scripts/ui-sfx.mjs` | tạo sáu tiếng thao tác (click, tick, pop, swipe, whoosh, chime) và đặt chỗ to nhất đúng lúc chạm |
| `scripts/ref-study.mjs` | `study` nhịp cắt, đứng hình, độ động và tờ ảnh của một video; `compare` hai video; `loop` kiểm bản lặp |
| `scripts/wireframe.mjs` | bật, tắt lớp khung dây cho cả video để duyệt bố cục và nhịp trước khi lên da |
| `scripts/split-view.sh` | ghép hai video cạnh nhau: thật và khung dây, ngang và dọc, tham khảo và của mình |
| `templates/kit/` | `kit.css`, `RULES.md` và một màn mẫu để bắt đầu kit |
| `templates/camera-rig.html` | stage, world, `cam`, `applyCamera`, `leg`, `tap`, `burst` cho một khung |
| `templates/ui-morph.html` | một vật giao diện biến thành vật kế tiếp (nút, vòng tải, dấu tích, thanh trượt, công tắc, thẻ tab) bằng lò xo tính sẵn |
| `references/` | `ui-kit.md`, `camera.md`, `ideas.md`, `product-audio.md`, `video-direction.md`, `qa.md`, `variants.md` |

Script chỉ cần Node, ffmpeg và Chrome (`$CHROME`, Google Chrome, Chromium hoặc Chrome for Testing trong cache của puppeteer).

## Nguyên tắc cố định

Các nguyên tắc của `vi-explainer-video` vẫn giữ nguyên. Thêm:

1. **Không ảnh chụp màn hình app**, trừ khi chủ dự án cho phép. Mọi màn là HTML/CSS dựng từ mã nguồn và dữ liệu của app.
2. **Chữ trên màn app là chữ của app**, chép nguyên văn. Không bịa tên, số đếm hay câu nào gán cho app.
3. **Không khung máy của hãng, không huy hiệu cửa hàng, không logo công ty khác.** Thiết bị chỉ là khối bo góc viền mảnh.
4. **Mỗi khung có một chuyển động camera mang nghĩa và một thao tác thật trong app**, đúng lúc lời đọc nhắc tới.
5. **Giao diện cần đọc thì phẳng ít nhất 1 s.** Chỉ nghiêng khi đang bay hay đổi máy.
6. **Video quảng cáo là video thương mại.** Không dùng giọng nhân bản OmniVoice (giấy phép CC-BY-NC). Dùng giọng Gemini, mặc định Leda.
7. **Test thu tiếng app là đồ tạm.** Thu xong thì xoá, không commit vào repo của app.

## Đường dẫn

```bash
ROOT=$(git rev-parse --show-toplevel)
AP=<thư mục chứa SKILL.md này>
SK=$AP/../vi-explainer-video                     # skill nền
# HF, FX, ENGINE: như bước 0 của vi-explainer-video
```

## Quy trình

### 0. Kiểm máy

Làm bước 0 của `vi-explainer-video`, rồi kiểm thêm Chrome: `node "$AP"/scripts/ui-kit.mjs` báo `no Chrome found` thì đặt `CHROME=`.

### 1. Dự án và brief

```bash
bash "$AP"/scripts/new-project.sh <ten-du-an>      # cd vào videos/<ten-du-an> sau lệnh này
```

Viết `BRIEF.md` theo `$SK/references/brief-template.md` với:
- `angle: product-promo`;
- `voice: Leda` (hoặc giọng Gemini khác);
- `style: glass-keynote`: preset đã dùng cho Open Book, hợp với video ra mắt điềm tĩnh. `win95-pixel` hợp với app retro.

Thêm vào mục Notes:
- danh sách cấm của chủ dự án;
- video tham khảo chủ dự án thích, nếu có;
- nguồn mã giao diện và dữ liệu của app (đường dẫn repo, phiên bản phát hành);
- app có tiếng không, và tiếng đó ở khung nào.

### 2. Bộ kit giao diện

Làm theo `references/ui-kit.md`:

1. Dựng `kit.css` và `screens/*.html` từ mã nguồn của app, theo điểm gốc của thiết bị. Gắn `data-m` vào mọi thứ sẽ được chạm, bứt ra hay làm sáng.
2. Viết `RULES.md`: những chỗ dễ sai của app này.
3. Chạy `node "$AP"/scripts/ui-kit.mjs preview .`, đọc (Read) `.hyperframes/app-ui-kit/preview.png`, rồi soát theo `ui-kit.md` §5.

Làm kit **trước** storyboard: danh sách màn có sẵn quyết định khung nào làm được.

### 3. Hệ thiết kế

Làm bước 2 của `vi-explainer-video` (`build-frame`, preset, font).

### 4. Kịch bản

Làm bước 3 của `vi-explainer-video`. Video app thường đã có lời được duyệt. Khi đó chỉ chuyển sang định dạng SCRIPT.md, không sửa ý.

Trước khi viết hay chuyển lời, lập `facts.md` ở gốc dự án (`references/ideas.md`, mục "Tệp sự thật"): mỗi số liệu, tên tính năng và lời khẳng định một dòng, kèm nguồn trong mã hay tài liệu của app. Lời đọc chỉ nói những gì có trong tệp đó.

Nếu tự viết:
- Mạch theo `references/ideas.md`: móc câu, bước ngoặt, tin cậy, tính năng, khung chính, đổi nhịp, chốt. Video dưới khoảng 45 s dùng một trong hai mạch ngắn ở mục "Hai mạch khác".
- Câu nào nói về tính năng cũng gọi đúng tên trên nút của app.
- Ngay trước đoạn tiếng app, có một câu dẫn kiểu "nghe thử nhé".

### 5. Giọng đọc và tiếng app

1. Làm bước 4 của `vi-explainer-video` (giọng Gemini).
2. Nếu app có tiếng: thu và ghép theo `references/product-audio.md` §1–§3 (`splice-voice.mjs`), **trước** nhạc nền, vì độ dài khung thay đổi.

### 6. Nhạc nền

Làm bước 5 của `vi-explainer-video`. Khớp nhịp tuỳ chọn, hợp với video ngắn dưới khoảng 60 s.

### 7. Ý từng khung và STORYBOARD.md

0. Nếu có video tham khảo: `node "$AP"/scripts/ref-study.mjs study <ref.mp4> --out snapshots/ref`, đọc `overview.jpg` và các tờ cắt cảnh. Ghi vào Video direction nhịp muốn theo (số cắt mỗi phút, độ dài cảnh) và các chuyển cảnh muốn mượn, tả bằng lời của mình.
1. Với mỗi khung, tìm ý theo `references/ideas.md`: một mẫu camera diễn đúng ý của lời (bảng trong `references/camera.md`), một thao tác thật trong app, một cầu nối sang khung sau nếu có. Chuyển cảnh ưu tiên kiểu mang theo vật (mục "Chuyển cảnh mang theo vật"), và soát ý với mục "Không làm".
2. Viết STORYBOARD.md theo bước 6 của `vi-explainer-video`. Block `## Video direction` lấy khung từ `references/video-direction.md` và điền đủ.
3. Mỗi dòng Scene ghi:
   - mẫu camera và tư thế dừng để đọc;
   - tên màn kit và khoá `data-m` của thao tác;
   - mốc giây của chữ kích hoạt.
   Ví dụ: `Scene 2 (6.2–9.5): lặn vào chi tiết; chạm reader.word[4] lúc 6.4 ("chạm"); thẻ nghĩa bứt ra 6.9; dừng phẳng 7.5–9.5`.
4. Khung có tiếng app: ghi khoảng `clips` của `timing-NN.json` và "không lời đọc, không phụ đề, hình gần như đứng yên, chỉ chữ sáng theo tiếng".

### 8. Chốt âm thanh

Làm bước 7 của `vi-explainer-video`.

### 9. Dựng khung

Làm bước 8 của `vi-explainer-video`, thêm ba việc trước khi giao cho worker:

```bash
node "$AP"/scripts/ui-kit.mjs preview . && node "$AP"/scripts/ui-kit.mjs doc . --title "<Tên app>"
cp "$AP"/templates/camera-rig.html .hyperframes/frame-packets/_camera-rig.html
cp "$AP"/templates/ui-morph.html .hyperframes/frame-packets/_ui-morph.html     # chỉ khi có khung dùng ui-morph
```

Nếu `frame-packets.mjs` hỏng ở bước `_role.md` vì thiếu `references/frame-worker-core.md`, chép `_role.md` từ một dự án trước (`docs/app-promo-video-practice.md` §6).

Ở chỗ `{EXTRA}` của `$SK/references/worker-prompt.md`, thêm các dòng sau (điền `<AP>` bằng đường dẫn tuyệt đối), cho **mọi** khung có màn app hay camera 3D:

```text
- App screens: read {PROJECT_DIR}/.hyperframes/frame-packets/_app-ui-kit.md (in parts: rules, placing a device, the screens you use) and look at {PROJECT_DIR}/.hyperframes/app-ui-kit/preview.png before drawing any app screen. Paste kit HTML and CSS renamed to your prefix with `node <AP>/scripts/ui-kit.mjs snippet <screen|css> f{NN} {PROJECT_DIR}`. Never redraw a screen from memory, never change a kit number, never use an <img> of an app screen.
- Aim every tap dot, pop-out copy and highlight with `node <AP>/scripts/ui-kit.mjs point <screen> <key> --left L --top T --scale 0.86 [--index i] [--anchor tl] {PROJECT_DIR}`, never by eye.
- 3D camera: start from {PROJECT_DIR}/.hyperframes/frame-packets/_camera-rig.html (rename fNN to f{NN}): one static lens, one preserve-3d world, one cam object written only by applyCamera on the tweens' onUpdate. No filter, opacity or overflow on the stage or the world. App UI the viewer must read holds flat for at least 1 s.
- To hide something mid-frame use a 0.02 s opacity tween, never a later tl.set of visibility (it hides the element from the frame's start).
```

Khung có một vật giao diện biến hình liên tục (nút thành vòng tải thành dấu tích…) thêm dòng:

```text
- UI morph: start from {PROJECT_DIR}/.hyperframes/frame-packets/_ui-morph.html (rename fNN to f{NN}). Keep the spring maths and the single clock tween; change only the beats in T, the labels (copy them from the kit) and which states you use. Delete states you do not need from render() and T, never add a second tween on the same element.
```

Motion blur chỉ cho 1–3 nhịp lao tới mỗi video, theo `references/camera.md` mục "Motion blur"; ghi rõ khung nào trong Video direction.

Khi worker xong và đã lắp ráp lần đầu, với video theo khuôn mới hay khi chủ dự án muốn duyệt sớm: render bản khung dây theo `references/variants.md` §1 và gửi duyệt bố cục, nhịp trước khi sửa màu và ánh sáng.

### 10. Lắp ráp

Làm bước 9 của `vi-explainer-video`, với hai điểm riêng:

- **Khung có tiếng app:** sau `captions.mjs build` và `regroup-vi.mjs`, kiểm rằng không nhóm phụ đề nào rơi vào đoạn demo (`product-audio.md` §4). Sau đó lùi nhạc bằng `duck-bgm.mjs` (`product-audio.md` §5).
- **Tiếng thao tác:** đặt bằng `ui-sfx.mjs` theo `product-audio.md` §6, sau `fetch-sfx`.
- **Đo cân bằng nhạc:** chạy `mix-balance.mjs --target 7`, mức của video quảng bá.

### 11. Kiểm, render, báo cáo

1. Kiểm theo `references/qa.md`: chụp dày quanh mọi chỗ lật, đổi máy hay bứt ra; đối chiếu chữ với app và `facts.md`; đo đoạn lùi nhạc.
2. Render và đo theo bước 10 của `vi-explainer-video`, rồi kiểm chuyển động theo `qa.md` §4: khung đầu đã là hình xong, đứng hình tối đa khoảng 1 s mỗi 30 s, hiểu được khi tắt tiếng.
3. Video theo khuôn mới, hoặc khi chủ dự án yêu cầu: một vòng soát bằng mắt mới theo `qa.md` §5, tối đa hai vòng.
4. Làm bản 720p nếu cần gửi qua chat. Bản dọc 9:16 và bản lặp: `references/variants.md` §2–§3.
5. Báo cáo theo năm đầu mục của `AGENTS.md`. Ghi rõ:
   - giọng app nào được thu;
   - chuyển động và âm thanh chưa được xem, nghe bằng mắt và tai.

## Khi nào không dùng skill này

- **Video không có lời đọc**, chỉ hình và nhạc: dùng `short-film-video`. Vẫn có thể mượn `ui-kit.mjs`, `camera-rig.html`, `ui-morph.html`, `ui-sfx.mjs` và `ref-study.mjs`.
- **Quay màn hình thật hay dùng ảnh chụp được phép:** dùng `vi-explainer-video` với các cách xử lý ảnh của `media-use`.
- **Giới thiệu một trang web có URL:** cân nhắc `/product-launch-video` của HyperFrames, vì nó chụp được hình của trang.
