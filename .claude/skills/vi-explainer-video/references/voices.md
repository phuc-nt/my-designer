# Giọng đọc

Có hai nguồn giọng:

- **Gemini TTS** (mặc định), qua engine âm thanh của HyperFrames (`media-use`). Cách gọi nằm trong `audio.md` §1.
- **Giọng nhân bản chạy trên máy** (VoiceStudio, engine OmniVoice): giọng của một người thật, tạo ngay trên máy, không qua mạng. Xem mục "Giọng nhân bản" bên dưới và `audio.md` §1b.

## Chọn giọng

| Giọng | Giới | Vai trò | Ghi chú |
|---|---|---|---|
| **Leda** | nữ | **mặc định** | Người dùng chọn làm mặc định sau khi nghe mẫu (2026-10-07). Câu mẫu 10.0 s. Chưa kiểm thuật ngữ tiếng Anh bằng whisper. |
| Orus | nam | tuỳ chọn | Nhịp nhanh và gọn nhất: câu mẫu 9.8 s. Đọc đúng Python, SQLite. Sai một số tên tiếng Anh (xem bên dưới). |
| Kore | nam | tuỳ chọn | Người dùng nghe mẫu `gemini-3.8-flash-tts` và xác nhận là giọng nam (cao độ đo khoảng 130 Hz). Đọc đúng mọi thuật ngữ tiếng Anh trong câu mẫu. Nên chọn khi kịch bản dày thuật ngữ. Câu mẫu 10.4 s. |
| Aoede | nữ | tuỳ chọn | Gần như đúng hết; "model" bị nghe thành "mô đồ". Câu mẫu 11.0 s. |
| Charon | nam | tuỳ chọn | Trầm và chậm hơn Orus: câu mẫu 11.5 s. Lỗi thuật ngữ tương tự Orus. |

Người dùng chọn giọng ở dòng `voice:` trong BRIEF.md. Nếu không ghi, dùng `Leda`. Giá trị này được đưa vào trường `"voice"` của request TTS.

Số liệu trên đến từ **một** câu mẫu: "my-agent-crew là một harness như thế: chạy ngay trên máy bạn. Một tiến trình Python. Một tệp SQLite. Một thư mục home. Model chỉ xin. Harness quyết định."

- **Cách đánh giá:** kiểm bằng whisper `small` tiếng Việt. Đây chỉ là **ước lượng gián tiếp**: whisper cũng nghe sai, nhất là chữ tiếng Anh xen trong câu tiếng Việt.
- **Đánh giá thật:** người dùng tự nghe.
- **Mẫu nghe thử (nếu còn):** `videos/voice-samples/`: `4-gemini-Kore.mp3` … `7-gemini-Orus.mp3`, và `gemini-<Tên>.mp3` cho các giọng khác (Leda, Sulafat, Achernar, Erinome, Zephyr, Despina, Autonoe, Laomedeia, Callirrhoe đo ra ở vùng giọng nữ).

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

## Giọng nhân bản chạy trên máy (VoiceStudio)

Dùng khi BRIEF.md ghi `voice: clone:<tên profile>`. Giọng là bản sao giọng một người thật (chủ giọng), lưu thành *profile* trong app VoiceStudio trên chính máy này. `scripts/clone-voice.mjs` gọi app qua `http://127.0.0.1:3900` và làm trọn phần giọng đọc (`audio.md` §1b).

### Điều khoản của chủ giọng (bắt buộc)

- **Chỉ tạo trên máy này.** Không tải tệp giọng, clip mẫu hay profile lên bất kỳ dịch vụ nào, kể cả dịch vụ voice AI khác. Script từ chối mọi địa chỉ không phải `127.0.0.1`/`localhost`.
- **Mỗi kịch bản cần chủ giọng đồng ý trước khi tạo.** Không dùng giọng để nói điều chủ giọng chưa duyệt. Nếu người yêu cầu không phải chủ giọng, hỏi trước.
- **Không chuyển tệp giọng cho người khác.** Tệp `assets/voice/*.wav` và thư mục `.hyperframes/clone-voice/` nằm trong `videos/`, không vào git.
- **Giữ nguyên dấu nhận biết giọng tổng hợp** mà app gắn vào audio. Không lọc, không nén lại, không đổi tần số lấy mẫu của tệp giọng. Script chỉ nối thêm khoảng lặng. Trộn nhạc nền bình thường không bị coi là gỡ dấu, nhưng kèm ba việc bắt buộc (`audio.md` §1b): mọi tệp giọng chưa trộn phải dò ra dấu trước khi trộn; giữ `assets/voice/` và `.hyperframes/clone_request.json` chừng nào video còn được đăng; mô tả video ghi rõ giọng đọc là giọng tổng hợp.
- **OmniVoice có giấy phép CC-BY-NC: không dùng cho video thương mại.** Video thương mại thì dừng lại, báo chủ giọng đổi sang engine khác (VoxCPM2) trong app.
- **Gửi bản ghép cho chủ giọng duyệt trước khi xuất bản.** Ghi điều này vào báo cáo cuối.
- **Giọng nghe không giống chủ giọng thì dừng và báo.** Không tự chỉnh tham số khác để "sửa".

### Thông số (script đã đặt sẵn, không đổi)

| Trường | Giá trị |
|---|---|
| `engine` | `omnivoice` |
| `language` | `Vietnamese` |
| `num_step` | 32 |
| `guidance_scale` | 2.0; lên 2.5 khi giọng nuốt chữ |
| `speed` | 1.0 |
| `seed` | 42; đổi 43, 44… khi một lần tạo bị lỗi |
| `wav_bits` | 24 (WAV 24 kHz mono) |
| `max_chunk_chars` | 0 |

`profile_id` khác nhau trên từng máy. Request chỉ ghi **tên** profile; script tra id qua `GET /profiles` (`node "$SK"/scripts/clone-voice.mjs --profiles` in danh sách tên).

### Cách giọng này khác Gemini

- **Một lần gọi chỉ nên chứa một câu.** Đưa cả lời của một khung (hai câu trở lên) thì giọng hay bỏ mất một vế. Vì vậy request chia mỗi khung thành các `segments`, mỗi đoạn một câu; script nối lại bằng khoảng lặng 0.3 s.
- **Kết quả cố định theo `seed`.** Cùng chữ, cùng seed, cùng `guidance_scale` cho ra cùng một tệp. Câu bị lỗi thì đổi seed, không gọi lại y nguyên.
- **Không có prompt phong cách.** Ngữ điệu đến từ clip mẫu của profile và dấu câu. Chỉ có ba thẻ: `[pause 500ms]`, `[laughter]`, `[sigh]`.
- **Đọc nhanh hơn Orus khoảng 9%** (video đã làm: 94.2 s thành 85.5 s). Ước lượng độ dài theo đó.
- **Chậm:** 13–20 s cho mỗi câu, cộng thời gian whisper nghe lại. Video 10 khung mất khoảng 6–10 phút.

### Cách viết chữ cho giọng đọc (trường `say`)

`script` là chữ của SCRIPT.md, dùng cho phụ đề. `say` là chữ đưa cho giọng, chỉ ghi khi cần viết khác đi:

| Trong kịch bản | Viết trong `say` | Ghi chú |
|---|---|---|
| Drive, Kindle, Start, Nobel, Booker, Murakami, email | giữ nguyên | đọc được |
| manga | `man ga` | chủ giọng đã nghe và duyệt |
| app | `áp` | chủ giọng đã nghe và duyệt |
| PIN | `pin` | chủ giọng đã nghe và duyệt |
| OPDS và các chữ viết tắt | đánh vần: `ô pê đê ét` | OPDS: chủ giọng đã nghe và duyệt; whisper vẫn chép sai chữ này |
| EPUB | `i-pắp` | chủ giọng đã nghe và duyệt |
| 8.600 | `tám ngàn sáu trăm` | viết "ngàn": ở một câu, "tám nghìn sáu trăm" bị nuốt thành "tám sáu" ở mọi seed. Lỗi không lặp lại ở các câu thử khác, nhưng "ngàn" chưa gây lỗi ở câu nào |
| 19 | `mười chín` | số luôn viết thành chữ |
| "co don" (chữ không dấu trong ngoặc kép) | bỏ ngoặc kép: `co don` | |
| câu kết bằng dấu `:` rồi sang đoạn khác | đổi `:` thành `.` | để giọng xuống giọng dứt đoạn |

Chữ nào chưa có trong bảng: tạo thử, xem whisper nghe ra gì, và mời chủ giọng nghe trước khi thêm vào bảng này.

App cũng nhận cú pháp `[[EPUB|i-pắp]]` trong chữ gửi đi; nó cho ra đúng tệp như khi viết thẳng `i-pắp`. Trong `say`, cứ viết thẳng phiên âm: `clone-voice.mjs` so `say` với bản whisper theo từng chữ và không hiểu cú pháp ngoặc vuông.

## Những điều cần biết (Gemini)

- **Kết quả không cố định.** Mỗi lần tạo lại, cùng một câu có thể ra độ dài và cách nhấn khác. Tạo lại một khung thì phải chạy lại các bước sau nó: sửa chữ phụ đề, `sync-durations`, và các mốc thời gian Scene của khung đó.
- **Mỗi lần gọi tốn hạn mức (quota) của khoá.** Chỉ tạo lại những khung cần tạo lại. Engine chạy tối đa 4 câu song song (`HYPERFRAMES_TTS_CONCURRENCY`).
- **Có câu lỗi thì engine vẫn chạy tiếp.** Câu lỗi chỉ được liệt kê ở mục "anomalies (non-fatal)" và **không có** trong `voices`. Luôn đếm lại số giọng bằng số khung.
- **Các phương án đã thử và bỏ:**
  - `say -v Linh` của macOS: đọc thuật ngữ tiếng Anh theo âm Việt, phải dùng bảng phiên âm dài.
  - edge-tts HoaiMy và NamMinh: đọc sai tiếng Anh.
  - Kokoro: không có tiếng Việt.
