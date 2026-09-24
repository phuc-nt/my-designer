# Mẫu BRIEF.md

Tạo `BRIEF.md` ở gốc dự án (`hyperframes init` không tạo tệp này). `flow: automation` và `mode: autonomous` (trong storyboard)
nghĩa là không dừng ở các checkpoint. `storyboard: no` nghĩa là không có vòng phác thảo.

```markdown
---
workflow: faceless-explainer
flow: automation
storyboard: no
message: "<một câu: người xem cần nhớ điều gì>"
destination: youtube
aspect: 1920x1080
language: vi
audience: "<ai sẽ xem, họ đã biết gì>"
length: <ước lượng>s          # ~3 từ/giây lời đọc
angle: concept            # concept | how-to | listicle | story
narration: yes
voice: Orus               # Orus (mặc định) | Kore | Aoede | Charon — xem references/voices.md
---

## Intent

<2–4 câu: video giải thích gì, giọng điệu ra sao (vd "như một buổi whiteboard ngắn, kỹ thuật nhưng dễ hiểu").>
Nội dung lấy từ <tệp đầu vào>. Được viết lại cho dễ nghe, giữ đúng ý và thuật ngữ.

## Notes

- Giọng Gemini TTS (`gemini-3.8-flash-tts`), giọng ở `voice:`. Phụ đề căn theo chữ kịch bản; nhạc nền Lyria dài bằng lời đọc.
- Không nêu số liệu cá nhân, token hay đường dẫn riêng.
- <ràng buộc riêng: màu thương hiệu, thuật ngữ phải giữ nguyên, URL/lệnh được phép hiện…>
```
