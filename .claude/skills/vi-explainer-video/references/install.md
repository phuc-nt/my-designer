# Cài HyperFrames và công cụ cần thiết

Đọc tệp này khi Bước 0 của SKILL.md báo thiếu. Hãy kiểm tra trước, và chỉ cài phần còn thiếu.

## 1. Kiểm tra

```bash
node --version                                   # cần ≥ 22
npx -y hyperframes --version                     # tải CLI qua npx nếu chưa có trong cache
npx -y hyperframes doctor                        # kiểm Node, FFmpeg, FFprobe, Chrome, whisper-cpp
npx -y hyperframes skills check                  # bộ skill HyperFrames đã cài và còn mới chưa
ls ~/.claude/skills/faceless-explainer/scripts/audio.mjs ~/.claude/skills/media-use/audio/scripts/audio.mjs
```

Khi đọc kết quả `doctor`:

- **Bắt buộc phải có ✓:** Node.js, FFmpeg, FFprobe, Chrome, whisper-cpp. Whisper được dùng để lấy mốc thời gian từng từ của giọng đọc.
- **Được phép ✗:** `TTS (Kokoro)`, vì skill này dùng Gemini. `BGM (MusicGen)` cũng không bắt buộc: nó chỉ là phương án dự phòng khi không có Lyria.
- **`@google/genai` và `onnxruntime-node`** tự cài khi dùng lần đầu.

## 2. Cài phần thiếu (macOS)

| Thiếu | Lệnh |
|---|---|
| Node ≥ 22 | `brew install node` |
| FFmpeg / FFprobe | `brew install ffmpeg` |
| whisper-cpp | `brew install whisper-cpp` |
| Chrome để render | `npx -y hyperframes browser ensure` (xem `npx hyperframes browser --help`) |
| Bộ skill HyperFrames | `npx -y hyperframes skills update faceless-explainer` |

Không cần cài HyperFrames toàn cục. Mọi lệnh đều chạy qua `npx -y hyperframes …`.

Bộ skill HyperFrames luôn được cài **vào thư mục skill chung của máy**, vì CLI cài với `--global`:

- `~/.claude/skills/hyperframes*`
- `~/.claude/skills/media-use`
- `~/.claude/skills/faceless-explainer`

Đó là cách HyperFrames hoạt động. Skill `vi-explainer-video` thì nằm trong repo này và gọi các script ở đó qua `$HF`. Lệnh `npx hyperframes init` cũng tự làm mới bộ skill chung này.

Sau khi cài, chạy lại toàn bộ mục 1.

## 3. Khoá Gemini (giọng đọc và nhạc nền Lyria)

Khoá lấy tại Google AI Studio: <https://aistudio.google.com/apikey>. Chọn **Create API key**.

Lưu khoá vào shell profile của người dùng. Việc này để **người dùng tự làm**; agent không nhận, không in và không ghi khoá:

```bash
# người dùng tự thêm dòng này vào ~/.zshrc, rồi mở terminal mới
export GEMINI_API_KEY="<khoá>"
```

Agent chỉ kiểm tra khoá **có hay không**. Không bao giờ `echo` giá trị khoá:

```bash
[ -n "$GEMINI_API_KEY" ] || eval "$(grep -E '^[[:space:]]*export (GEMINI|GOOGLE)_API_KEY=' ~/.zshrc | tail -1)"
[ -n "$GEMINI_API_KEY$GOOGLE_API_KEY" ] && echo "khoá Gemini: có" || echo "khoá Gemini: chưa có"
```

Dòng `eval` cần thiết khi VS Code hoặc terminal được mở **trước** lúc thêm khoá: tiến trình khi đó chưa có biến môi trường này. Mỗi lệnh Bash là một shell mới, nên phải đặt dòng `eval` đầu **mỗi** lệnh gọi engine âm thanh.

Những việc không được làm với khoá:

- Không ghi khoá vào `.env` của dự án video. Engine âm thanh có đọc `.env` trong thư mục dự án, nhưng không được dựa vào đó.
- Không ghi khoá vào `audio_request.json` hay bất kỳ tệp nào trong repo.
- Không bảo người dùng dán khoá vào khung chat.

Nếu không có khoá, không có giọng đọc tiếng Việt tốt. Kokoro không có tiếng Việt, và HeyGen/ElevenLabs cần khoá riêng. Khi đó hãy dừng lại và hướng dẫn người dùng lấy khoá theo mục này.
