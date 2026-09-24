# Âm thanh: giọng Gemini, phụ đề, nhạc nền, SFX

Không dùng `node $FX/audio.mjs generate` của faceless. Lệnh đó cố định `provider: "auto"`, thứ tự thử là HeyGen, rồi ElevenLabs, rồi Kokoro, nên không bao giờ dùng Gemini. Nhạc nền của nó cũng cần HeyGen. Thay vào đó, gọi thẳng engine `media-use`.

**Tệp phụ `audio_engine_meta.json`** ở gốc dự án là **nơi lưu chính** của giọng đọc và nhạc nền:

- Lệnh `fetch-sfx` của faceless đọc tệp phụ này, gộp thêm SFX, rồi **dựng lại** `audio_meta.json` từ nó.
- Vì vậy mọi chỉnh sửa về giọng đọc (chữ phụ đề, độ dài) phải làm **trong tệp phụ**.
- Sửa `audio_meta.json` chỉ có tác dụng sau lần `fetch-sfx` cuối cùng.

Mọi lệnh gọi engine đều bắt đầu bằng hai dòng này (xem `install.md` §3). Không bao giờ in khoá ra:

```bash
ENGINE=~/.claude/skills/media-use/audio/scripts/audio.mjs
[ -n "$GEMINI_API_KEY" ] || eval "$(grep -E '^[[:space:]]*export (GEMINI|GOOGLE)_API_KEY=' ~/.zshrc | tail -1)"
```

## §1. Tạo giọng đọc

Ghi request vào `.hyperframes/tts_request.json`. **Không** ghi vào `audio_request.json`, vì `fetch-sfx` ghi đè tệp đó.

```json
{
  "provider": "gemini",
  "tts_model": "gemini-3.8-flash-tts",
  "voice": "Orus",
  "lang": "vi",
  "style": "Speak Vietnamese with a natural Northern (Hanoi) accent. Calm and clear, like an engineer explaining at a whiteboard to a colleague. Pronounce English technical terms (harness, SQLite, Python, model) the English way.",
  "lines": [
    { "id": "01", "text": "<lời đọc khung 1, lấy từ SCRIPT.md>" },
    { "id": "02", "text": "<lời đọc khung 2>" }
  ],
  "bgm": { "mode": "none" }
}
```

- `id` là số khung, viết hai chữ số (`"01"`). `fetch-sfx` đổi nó thành `frame: 1`.
- `text` là các dòng thụt lề của khung đó trong SCRIPT.md, nối lại bằng dấu cách.
- `voice` lấy từ `voice:` trong BRIEF.md. Mặc định `Orus`; các lựa chọn khác xem `voices.md`.

```bash
node "$ENGINE" --request ./.hyperframes/tts_request.json --hyperframes . --out ./audio_engine_meta.json --only tts
```

Lệnh ghi `assets/voice/NN.wav` và `voices[]` trong tệp phụ. Sau khi chạy xong:

- **Đếm số giọng.** Số phần tử `voices` phải bằng số khung.
- **Đọc mục "anomalies".** Câu nào TTS lỗi thì bị bỏ, không có trong `voices`. Tạo lại riêng câu đó (xem bên dưới).

**Tạo lại một vài khung.** Mỗi lần chạy `--only tts`, engine **thay toàn bộ** `voices` bằng những câu có trong lần chạy đó. Vì vậy **không** chạy thẳng vào tệp phụ với một request chỉ có vài câu. Hãy làm như sau:

1. Ghi `.hyperframes/tts_redo.json`, chỉ chứa các câu cần tạo lại.
2. Chạy engine với `--out ./.hyperframes/tts_redo_meta.json`.
3. Chép từng phần tử `voices` mới vào `audio_engine_meta.json`, thay phần tử cùng `id`.
4. Làm lại §2 và §3 cho các khung đó.

Tệp WAV `assets/voice/NN.wav` được ghi đè tại chỗ.

## §2. Sửa chữ phụ đề cho khớp kịch bản

Engine không lấy mốc thời gian từ Gemini. Nó cho whisper nghe lại tệp WAV, nên `words[].text` là **chữ whisper nghe được**, không phải chữ trong kịch bản. Ví dụ, "Harness là phần còn lại. Nó chạy ngay trên máy bạn." được ghi thành "Hân eens là phần con lạ. Nó chạy ngay chết mấy bạc." Nếu để nguyên, phụ đề sẽ hiện đúng những chữ sai này.

Với mỗi phần tử trong `voices` của `audio_engine_meta.json`, thay `words` bằng danh sách từ của **kịch bản**, giữ mốc thời gian của lời đọc thật.

**Chuẩn bị hai dãy từ:**
- **Dãy kịch bản:** tách lời đọc của khung (chữ SCRIPT.md, không phải chữ đã đổi để gửi TTS) theo khoảng trắng, dấu câu dính theo từ, ví dụ `"việc:"`. Bỏ những "từ" chỉ là dấu câu, như `—`.
- **Dãy nghe được:** là `words` hiện có.

Để so khớp, chuẩn hoá cả hai dãy: chữ thường, bỏ dấu câu.

**So khớp** hai dãy đã chuẩn hoá bằng `difflib.SequenceMatcher(None, a, b, autojunk=False)`, rồi xử lý từng đoạn:

- **`equal`**: từ kịch bản lấy đúng `start`/`end` của từ nghe được tương ứng.
- **`replace`**: gộp khoảng thời gian của các từ nghe được, từ `start` đầu đến `end` cuối. Chia khoảng đó cho các từ kịch bản theo trọng số `len(từ) + 2`.
- **`delete`** (từ kịch bản không có bên nghe được): nội suy giữa `end` của từ trước và `start` của từ sau, chia đều.
- **`insert`** (whisper nghe thừa): bỏ qua.

**Kết quả** mỗi từ có dạng `{ "id": "w<n>", "text": "<từ kịch bản, giữ dấu câu>", "start", "end" }`:
- `n` chạy từ 0 trong từng khung.
- Làm tròn 3 chữ số.
- `start` không giảm dần.
- `end` > `start`.
- Không có từ nào vượt `duration_s`.

Viết một đoạn Python tạm trong scratchpad để làm việc này. Không lưu đoạn code đó vào skill hay vào dự án. Sau khi sửa, kiểm tra lại: số từ mỗi khung phải bằng số từ của kịch bản.

**Danh sách "whisper nghe khác kịch bản".** Trong lúc so khớp, in các đoạn `replace`/`delete` theo dạng `khung N: kịch bản «…» ↔ nghe «…»`.

- Danh sách này chỉ là **gợi ý**: whisper nghe sai tiếng Việt khá thường xuyên.
- Chú ý nhất là thuật ngữ tiếng Anh và tên riêng. Nếu nghi đọc sai, xử lý theo `voices.md` rồi tạo lại khung đó.
- Ghi danh sách này vào báo cáo cuối, để người dùng biết chỗ nên nghe kỹ.

Mốc thời gian để viết các dòng Scene trong storyboard lấy từ `words` đã sửa. Đó là số giây tính từ đầu khung.

## §3. Khoảng lặng cuối khung

Độ dài khung bằng độ dài tệp giọng đọc. Muốn khung dừng lại sau câu cuối (khung chốt, khung luận điểm), hãy thêm khoảng lặng vào tệp WAV. **Không** sửa `duration` trong storyboard.

```bash
ffmpeg -loglevel error -y -i assets/voice/11.wav -af apad=pad_dur=2.0 assets/voice/11.pad.wav && mv assets/voice/11.pad.wav assets/voice/11.wav
ffprobe -v error -show_entries format=duration -of csv=p=0 assets/voice/11.wav
```

Mức gợi ý:
- Khoảng 0.3 s cho các khung thường, nếu thấy câu dứt quá sát.
- 1.5–2.5 s cho khung cuối.

Sau khi thêm, cập nhật `duration_s` của khung đó trong `audio_engine_meta.json` bằng số `ffprobe` vừa đo. Làm bước này **trước** §4, vì nhạc nền lấy độ dài theo tổng các `duration_s`.

## §4. Nhạc nền (Lyria)

Ghi request vào `.hyperframes/bgm_request.json`:

```json
{ "lines": [], "bgm": { "mode": "generate", "prompt": "calm minimal tech underscore, warm piano and soft pads, no drums, unobtrusive" } }
```

Prompt lấy từ `music:` trong STORYBOARD/BRIEF, viết bằng tiếng Anh.

```bash
node "$ENGINE" --request ./.hyperframes/bgm_request.json --hyperframes . --out ./audio_engine_meta.json --only bgm
```

- **Chạy ghi thẳng vào tệp phụ.** `--only bgm` giữ nguyên `voices`. Độ dài nhạc (`bgm_target_duration_s`) bằng tổng `duration_s` của giọng đọc, nên phải chạy **sau** §3.
- **Nhạc chạy nền.** Kết quả ghi ra `assets/bgm/track.wav`, nhật ký ở `assets/bgm/bgm-*.log`.
- **Nhạc cũ bị thay.** Chạy lại lệnh này thì nhạc cũ bị thay bằng bài mới.

Dòng `bgm: launched lyria` trong kết quả nghĩa là đang dùng Lyria. Nếu dòng đó ghi `musicgen`, nghĩa là engine không thấy khoá Gemini hoặc gói `google-genai`. Khi đó nhạc chỉ dài khoảng 30 s và sẽ được lặp.

## §5. Chốt âm thanh (sau khi có STORYBOARD.md)

**Bước 1. Chờ nhạc nền.** Kết quả phải là `ready`:

```bash
node ~/.claude/skills/media-use/audio/scripts/wait-bgm.mjs --audio-meta ./audio_engine_meta.json --hyperframes . --timeout-ms 300000 --out ./.hyperframes/bgm_status.json
```

- Nếu kết quả là `failed` hoặc `timeout`: đọc tệp log, sửa nguyên nhân rồi chạy lại §4.
- Không được lắp video khi chưa có `track.wav`. Nếu thiếu tệp, `assemble-index` âm thầm bỏ nhạc; nó chỉ ghi một cảnh báo.

**Bước 2. SFX.** Lệnh này dựng lại `audio_meta.json` từ tệp phụ, gồm giọng đọc, nhạc nền và SFX:

```bash
node "$FX"/audio.mjs fetch-sfx --storyboard ./STORYBOARD.md --hyperframes .
```

- **Tên SFX:** chỉ dùng tên có trong `~/.claude/skills/media-use/audio/assets/sfx/*.mp3`. Tên sai bị bỏ qua mà không báo gì. Hãy đối chiếu tên trước khi chạy, và đếm số `sfx` trong kết quả.
- **Không có cảnh báo nào khi nhạc chưa xong.** `fetch-sfx` không kiểm tra nhạc nền đã xong hay chưa, nên luôn phải qua bước 1 trước.

**Bước 3. Sửa `audio_meta.json`.** Làm sau lần `fetch-sfx` cuối cùng:

- **`sfx[].offset_s`:** `fetch-sfx` luôn ghi 0, tức là SFX kêu ngay đầu khung. Hãy ghi số giây theo `- sfx_at:` của khung:
  - `sfx_at` là số: dùng số đó.
  - `sfx_at` là từ hoặc cụm từ: dùng `start` của từ đầu cụm đó, trong `words` của khung.
- **`sfx[].volume`:** `0.22`. Mặc định 0.35 là quá to so với giọng đọc.
- **`bgm.volume`:** `0.1`.
- **`bgm_pending`:** `false`, sau khi bước 1 báo `ready`.
- **Kiểm tra:** `voices` còn đủ số khung, và chữ trong `words` là chữ kịch bản.

**Bước 4. Ghi thời lượng thật vào storyboard.**

```bash
node "$FX"/audio.mjs sync-durations --audio-meta ./audio_meta.json --storyboard ./STORYBOARD.md
```

Lệnh chỉ sửa `- duration:` của từng khung. Hãy tự sửa `duration:` ở frontmatter thành tổng các khung.

**Khi phải làm lại giọng đọc sau bước này**, làm theo thứ tự: §1 (tạo lại khung), §2, §3, rồi §5 từ bước 2. Không cần tạo lại nhạc nền, trừ khi tổng độ dài thay đổi nhiều.
