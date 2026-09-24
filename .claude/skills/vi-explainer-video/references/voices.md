# Giọng đọc

Giọng đọc được tạo bằng Gemini TTS, qua engine âm thanh của HyperFrames (`media-use`). Cách gọi engine nằm trong `audio.md`.

## Chọn giọng

| Giọng | Giới | Vai trò | Ghi chú |
|---|---|---|---|
| **Orus** | nam | **mặc định** | Nhịp nhanh và gọn nhất: câu mẫu 9.8 s. Đọc đúng Python, SQLite. Sai một số tên tiếng Anh (xem bên dưới). |
| Kore | nữ | tuỳ chọn | Đọc đúng mọi thuật ngữ tiếng Anh trong câu mẫu. Nên chọn khi kịch bản dày thuật ngữ. Câu mẫu 10.4 s. |
| Aoede | nữ | tuỳ chọn | Gần như đúng hết; "model" bị nghe thành "mô đồ". Câu mẫu 11.0 s. |
| Charon | nam | tuỳ chọn | Trầm và chậm hơn Orus: câu mẫu 11.5 s. Lỗi thuật ngữ tương tự Orus. |

Người dùng chọn giọng ở dòng `voice:` trong BRIEF.md. Nếu không ghi, dùng `Orus`. Giá trị này được đưa vào trường `"voice"` của request TTS.

Số liệu trên đến từ **một** câu mẫu: "my-agent-crew là một harness như thế: chạy ngay trên máy bạn. Một tiến trình Python. Một tệp SQLite. Một thư mục home. Model chỉ xin. Harness quyết định."

- **Cách đánh giá:** kiểm bằng whisper `small` tiếng Việt. Đây chỉ là **ước lượng gián tiếp**: whisper cũng nghe sai, nhất là chữ tiếng Anh xen trong câu tiếng Việt.
- **Đánh giá thật:** người dùng tự nghe.
- **Mẫu nghe thử (nếu còn):** `~/workspace/videos/voice-samples/4-gemini-Kore.mp3` … `7-gemini-Orus.mp3`.

## Lỗi phát âm đã biết của Orus (và Charon)

| Chữ trong kịch bản | Whisper nghe thành |
|---|---|
| my-agent-crew | "My Asian crew" |
| harness | "Hannis", "Hân eens" |
| home | "hôm" |

Cách xử lý, theo thứ tự ưu tiên:

1. **Viết lại câu** để tên đó đứng ở chỗ dễ đọc, hoặc dùng từ tiếng Việt nếu được.
2. **Thêm vào prompt phong cách:** `Pronounce "harness" as the English word /ˈhɑːrnɪs/.`
3. **Đổi chữ chỉ trong lời gửi TTS** (trường `text` của request), ví dụ `my-agent-crew` thành `mai ây-giần cru`. Phụ đề vẫn giữ chữ gốc, vì bước sửa chữ phụ đề (`audio.md` §2) căn theo SCRIPT.md, không theo chữ gửi TTS.
4. **Đổi sang giọng Kore.**

## Prompt phong cách (mặc định)

```
Speak Vietnamese with a natural Northern (Hanoi) accent. Calm and clear, like an engineer explaining at a whiteboard to a colleague. Pronounce English technical terms (<liệt kê thuật ngữ của video>) the English way.
```

Viết prompt bằng tiếng Anh. Hãy liệt kê cụ thể các thuật ngữ tiếng Anh có trong kịch bản của video.

## Model

- **TTS:** `gemini-3.8-flash-tts` (mặc định của skill). Các model khác khoá này dùng được: `gemini-3.8-flash-lite-tts`, `gemini-3.1-flash-tts-preview`, `gemini-2.5-pro-preview-tts`, `gemini-2.5-flash-preview-tts`.
- **Nhạc nền:** engine dùng `lyria-realtime-exp` qua `lyria-recipe.py`. Nhạc được tạo theo thời gian thực: mất khoảng đúng bằng độ dài bài, ra một bài liền, không lặp. Khi không có khoá hoặc không có gói `google-genai`, engine tự chuyển sang MusicGen chạy máy, ra đoạn khoảng 30 s và `assemble-index` sẽ lặp nó.

## Những điều cần biết

- **Kết quả không cố định.** Mỗi lần tạo lại, cùng một câu có thể ra độ dài và cách nhấn khác. Tạo lại một khung thì phải chạy lại các bước sau nó: sửa chữ phụ đề, `sync-durations`, và các mốc thời gian Scene của khung đó.
- **Mỗi lần gọi tốn hạn mức (quota) của khoá.** Chỉ tạo lại những khung cần tạo lại. Engine chạy tối đa 4 câu song song (`HYPERFRAMES_TTS_CONCURRENCY`).
- **Có câu lỗi thì engine vẫn chạy tiếp.** Câu lỗi chỉ được liệt kê ở mục "anomalies (non-fatal)" và **không có** trong `voices`. Luôn đếm lại số giọng bằng số khung.
- **Các phương án đã thử và bỏ:**
  - `say -v Linh` của macOS: đọc thuật ngữ tiếng Anh theo âm Việt, phải dùng bảng phiên âm dài.
  - edge-tts HoaiMy và NamMinh: đọc sai tiếng Anh.
  - Kokoro: không có tiếng Việt.
