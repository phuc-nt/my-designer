# Scene template: khung dựng sẵn

Năm khung overlay hoàn chỉnh theo đúng định dạng khung của `faceless-explainer` (`<template>`, `#root`, `window.__timelines[id]`, font `-VN`, nội dung nằm trên vùng phụ đề y > 896). Dùng khi một khung trong storyboard đúng một trong năm kiểu dưới đây. Khung cần hình riêng (sơ đồ, minh hoạ, cảnh 3D) vẫn để worker tự dựng.

Phỏng theo `templates/` của nutllwhy/hyperframes-motion-library (MIT, Copyright (c) 2026 栗噔噔). Thông báo giấy phép nằm ở `LICENSE-hyperframes-motion-library.txt`; mỗi tệp giữ dòng ghi công của nó trong comment đầu, khi chép thành khung cũng giữ nguyên.

## Chọn kiểu

| Template | Dùng khi lời đọc… | Nội dung cần điền | Mốc `T` |
|---|---|---|---|
| `big-number-card` | nêu một con số lớn | dòng dẫn, giá trị (≤ 3 ký tự) và đơn vị, một câu giải thích (≤ 3 dòng), nhãn nhỏ | `eyebrow`, `prefix`, `number`, `caption` |
| `before-after-stat` | so một số trước và sau | nhãn, hai thẻ, hai giá trị (≤ 3 ký tự) với đơn vị, một câu kết | `label`, `before`, `after`, `conclusion` |
| `myth-fact-swap` | gạch một ngộ nhận rồi nêu sự thật | hai nhãn, ngộ nhận và sự thật (mỗi bên ≤ 3 dòng, khoảng 12 ký tự một dòng), câu kết | `myth`, `turn`, `fact`, `caption` |
| `three-step-flow` | kể ba bước nối tiếp | tiêu đề, ba tên bước (≤ 18 ký tự), ba mô tả một dòng | `title`, `steps[3]` |
| `timeline-scan` | kể ba mốc thời gian | tiêu đề, ba mốc (≤ 5 ký tự), ba tên, ba mô tả một dòng | `title`, `nodes[3]` |

## Dùng một template

Trong thư mục dự án video (chỗ có `compositions/frames/`):

```bash
node "$SK"/scripts/use-scene-template.mjs big-number-card --frame 3 --id 03-thoi-gian-giam --duration 12.4
```

- `--id` là tên tệp khung trong storyboard (`- src:`), không có `.html`. Số đầu phải bằng `--frame`.
- `--duration` là `- duration:` của khung sau `sync-durations`, không phải số mẫu.
- Script đặt tiền tố `f03-` cho mọi id và class, đặt tên composition, đặt thời lượng ở ba chỗ (`#root`, lớp nền, `END`) và bỏ đoạn hướng dẫn trong comment đầu. Ba chỗ thời lượng mà để nguyên số mẫu thì nền biến mất sau số giây đó và khung ra đen.

Rồi sửa tệp vừa ghi, ba việc:

1. **Token và font.** Mỗi template khai tám token ở đầu `<style>`. Điền từ `frame.md` của dự án:

   | Token | Lấy từ |
   |---|---|
   | `--st-ground` | màu nền chính |
   | `--st-ink` | màu chữ chính |
   | `--st-muted` | chữ phụ; phải ≥ 4,5 : 1 trên nền (ink alpha ≥ 0,72 là an toàn) |
   | `--st-accent` | màu nhấn duy nhất của khung |
   | `--st-on-accent` | chữ nằm trên màu nhấn (thường bằng màu nền) |
   | `--st-line` | đường kẻ và viền: ink với alpha khoảng 0,26 |
   | `--st-display`, `--st-mono` | họ font hiển thị và font mono |

   Thay luôn hai dòng `@font-face` bằng block "Font faces (Vietnamese)" của `frame.md`. Mặc định là Inter và JetBrains Mono, đã có `-VN.woff2` trong `assets/fonts/` của skill.
2. **Lời.** Thay chữ mẫu bằng chữ của khung, theo giới hạn ở bảng trên. Số, đơn vị và tên riêng giữ đúng như lời đọc.
3. **Mốc `T`.** Dòng `var T = {…}` ghi giây tính từ đầu khung. Lấy từ `voices[].words` trong `audio_engine_meta.json`, bằng đúng các mốc ở dòng Scene của storyboard, để mỗi phần hiện ra khi lời đọc chạm tới nó. Mốc cuối phải cách `END` ít nhất 1 giây để chuyển động xong; khung dừng yên tới hết.

Sau đó làm như mọi khung khác: kiểm `grep` ở bước 8 của `SKILL.md`, `hyperframes lint`, `hyperframes check`, snapshot. Đổi `- status: outline` thành `animated`.

Trong luồng có worker: ghi `template: <tên>` vào đầu dòng Scene 1 của khung ở bước 6; mẫu prompt ở `references/worker-prompt.md` có chỗ `{TEMPLATE}` cho việc này.

## Đã thử và chưa thử

Đã thử trong một dự án thử bỏ đi, mỗi template một khung 9 giây:
- `hyperframes lint`: 0 lỗi, 0 cảnh báo; `hyperframes check`: đạt, tương phản 29/29;
- ảnh chụp ở đầu, giữa và cuối từng khung: chữ có dấu không bị cắt, không có gì vào vùng phụ đề, nền còn nguyên tới cuối.

Chưa thử: render ra MP4, xem chuyển động, và ghép với giọng đọc thật. Hãy xem lại khi dùng trong một video thật.

Hạn chế đã thấy:
- Nội dung nằm nửa trên của khung; nửa dưới để trống ở `myth-fact-swap`, `three-step-flow` và `timeline-scan`. Đó là thiết kế, vì vùng dưới dành cho phụ đề.
- Mọi cảnh đều dừng yên sau mốc cuối, nên khung dài quá khoảng 12 giây sẽ đứng hình lâu. Chia lời đọc thành hai khung hoặc để worker dựng riêng.
- Gạch ngang của `myth-fact-swap` đi qua giữa khối chữ; viết ngộ nhận thành ba dòng ngắn để nó rơi đúng dòng giữa.
- Không có animation thoát; chuyển khung do `crossfade` của storyboard lo.
