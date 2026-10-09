# Cài HyperFrames và công cụ cần thiết

Đọc tệp này khi Bước 0 của SKILL.md báo thiếu, hoặc khi video dùng giọng nhân bản (mục 5). Hãy kiểm tra trước, và chỉ cài phần còn thiếu. Xác định trước đang ở bản nào (bảng "Hai bản HyperFrames" trong SKILL.md): bản gốc cài theo mục 2, bản secure theo mục 3.

## 1. Kiểm tra (cả hai bản)

```bash
node --version                                   # cần ≥ 22
hyperframes --version                            # bản gốc: npx -y hyperframes --version
hyperframes doctor                               # kiểm Node, FFmpeg, FFprobe, Chrome, whisper-cpp
ls "$HF"/faceless-explainer/scripts/audio.mjs "$HF"/media-use/audio/scripts/audio.mjs   # HF: Bước 0 của SKILL.md
```

Khi đọc kết quả `doctor`:

- **Bắt buộc phải có ✓:** Node.js, FFmpeg, FFprobe, Chrome, whisper-cpp. Whisper được dùng để lấy mốc thời gian từng từ của giọng đọc.
- **Được phép ✗:** `TTS (Kokoro)`, vì skill này dùng Gemini. `BGM (MusicGen)` cũng không bắt buộc: nó chỉ là phương án dự phòng khi không có Lyria. Bản secure không có hai dòng này.
- **Bản gốc:** `@google/genai` và `onnxruntime-node` tự cài khi dùng lần đầu. **Bản secure** không tự cài gì: mọi thứ phải có sẵn, xem mục 3.

## 2. Bản gốc: cài phần thiếu (macOS)

| Thiếu | Lệnh |
|---|---|
| Node ≥ 22 | `brew install node` |
| FFmpeg / FFprobe | `brew install ffmpeg` |
| whisper-cpp | `brew install whisper-cpp` |
| Chrome để render | `npx -y hyperframes browser ensure` (xem `npx hyperframes browser --help`) |
| Bộ skill HyperFrames | `npx -y hyperframes skills update faceless-explainer` (kiểm: `npx -y hyperframes skills check`) |

Không cần cài HyperFrames toàn cục. Mọi lệnh đều chạy qua `npx -y hyperframes …`.

Bộ skill HyperFrames luôn được cài **vào thư mục skill chung của máy**, vì CLI cài với `--global`:

- `~/.claude/skills/hyperframes*`
- `~/.claude/skills/media-use`
- `~/.claude/skills/faceless-explainer`

Đó là cách HyperFrames hoạt động. Skill `vi-explainer-video` thì nằm trong repo và gọi các script ở đó qua `$HF`. Lệnh `npx hyperframes init` cũng tự làm mới bộ skill chung này.

Sau khi cài, chạy lại toàn bộ mục 1.

## 3. Bản secure (bundle nội bộ)

Bản này do IT cài theo `SECURE-INSTALL.md` (nằm cạnh các skill, trong `.claude/skills/` hoặc `.kiro/skills/`). Agent **không cài gì** ở bản này: không có `npx`, `brew`, `skills update`, `browser ensure`, và CLI không tự tải Chrome, model hay gói Python. Mạng chỉ mở tới Gemini.

Nếu mục 1 báo thiếu, dừng lại và báo cho người dùng đúng thứ thiếu, kèm tham chiếu tới mục tương ứng của `SECURE-INSTALL.md`:

| Thiếu | Ai xử lý | Ghi chú |
|---|---|---|
| `hyperframes` không có trên PATH | IT | `export PATH="<bundle>/prefix/bin:$PATH"` |
| Chrome | IT | biến `HYPERFRAMES_BROWSER_PATH` trỏ tới chrome-headless-shell đã duyệt |
| whisper-cpp, model whisper | IT | cài sẵn trên máy |
| Lyria (`google-genai` cho python3) | IT | không bắt buộc; thiếu thì bỏ nhạc nền |
| `$HF/faceless-explainer`, `$HF/media-use` | IT | `cp -R kiro-skills/* <dự-án>/.kiro/skills/` (Kiro) hoặc `<dự-án>/.claude/skills/` (Claude Code) |
| `GEMINI_API_KEY` | người dùng | mục 4 dưới đây; bản secure chỉ đọc biến này, không đọc `GOOGLE_API_KEY` hay `.env` |

Nhạc nền ở bản secure mặc định **tắt**; request `"mode": "generate"` trong `audio.md` §4 là cách bật.

## 4. Khoá Gemini (giọng đọc và nhạc nền Lyria)

Khoá do người dùng có sẵn (ở bản secure: khoá công ty cấp). Với bản gốc, khoá lấy tại Google AI Studio: <https://aistudio.google.com/apikey>, chọn **Create API key**.

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

Dòng `eval` cần thiết khi VS Code, Kiro hoặc terminal được mở **trước** lúc thêm khoá: tiến trình khi đó chưa có biến môi trường này. Mỗi lệnh Bash là một shell mới, nên phải đặt dòng `eval` đầu **mỗi** lệnh gọi engine âm thanh.

Những việc không được làm với khoá:

- Không ghi khoá vào `.env` của dự án video. Engine âm thanh bản gốc có đọc `.env` trong thư mục dự án, nhưng không được dựa vào đó; bản secure không đọc `.env`.
- Không ghi khoá vào `audio_request.json` hay bất kỳ tệp nào trong repo.
- Không bảo người dùng dán khoá vào khung chat.

Nếu không có khoá, không có giọng đọc tiếng Việt tốt. Kokoro không có tiếng Việt, và HeyGen/ElevenLabs cần khoá riêng (bản secure đã bỏ cả ba). Khi đó hãy dừng lại và hướng dẫn người dùng lấy khoá theo mục này.

## 5. VoiceStudio (chỉ khi dùng giọng nhân bản)

Chỉ cần khi BRIEF.md ghi `voice: clone:<tên profile>`. VoiceStudio là app chạy trên máy của người dùng; agent không cài, không tạo profile và không đụng tới tệp giọng mẫu. Bản secure không có app này.

```bash
node "$SK"/scripts/clone-voice.mjs --profiles     # in tên các profile; lỗi nghĩa là app chưa mở
```

- **`VoiceStudio does not answer`:** nhờ người dùng mở app VoiceStudio rồi chạy lại. App nghe ở `http://127.0.0.1:3900`.
- **Không thấy tên profile cần dùng:** dừng lại và hỏi người dùng. Profile do chủ giọng tạo trong app.
- Whisper (`hyperframes transcribe`) dùng để nghe lại từng câu: mục 1 phải có ✓ ở whisper-cpp.

Nhạc nền vẫn do Lyria tạo, nên mục 4 (khoá Gemini) vẫn cần. Điều khoản dùng giọng nằm ở `voices.md`.
