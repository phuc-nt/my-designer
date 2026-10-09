# Âm thanh: giọng đọc, phụ đề, nhạc nền, SFX

Không dùng `node $FX/audio.mjs generate` của faceless. Lệnh đó cố định `provider: "auto"`, thứ tự thử là HeyGen, rồi ElevenLabs, rồi Kokoro, nên không bao giờ dùng Gemini. Nhạc nền của nó cũng cần HeyGen. Thay vào đó, gọi thẳng engine `media-use`.

**Tệp phụ `audio_engine_meta.json`** ở gốc dự án là **nơi lưu chính** của giọng đọc và nhạc nền:

- Lệnh `fetch-sfx` của faceless đọc tệp phụ này, gộp thêm SFX, rồi **dựng lại** `audio_meta.json` từ nó.
- Vì vậy mọi chỉnh sửa về giọng đọc (chữ phụ đề, độ dài) phải làm **trong tệp phụ**.
- Sửa `audio_meta.json` chỉ có tác dụng sau lần `fetch-sfx` cuối cùng.

Giọng đọc có hai đường, theo `voice:` trong BRIEF.md:

- Tên giọng Gemini (`Leda`, `Orus`…): làm §1, §2, §3.
- `clone:<tên profile>`: làm **§1b thay cho cả §1, §2 và §3**.

Từ §4 trở đi hai đường giống nhau. Nhạc nền vẫn dùng Lyria, nên vẫn cần khoá Gemini.

Mọi lệnh gọi engine đều bắt đầu bằng hai dòng này (xem `install.md` §4). Không bao giờ in khoá ra:

```bash
ENGINE=$HF/media-use/audio/scripts/audio.mjs          # HF: xem "Đường dẫn" trong SKILL.md
[ -n "$GEMINI_API_KEY" ] || eval "$(grep -E '^[[:space:]]*export (GEMINI|GOOGLE)_API_KEY=' ~/.zshrc | tail -1)"
```

## §1. Tạo giọng đọc

Ghi request vào `.hyperframes/tts_request.json`. **Không** ghi vào `audio_request.json`, vì `fetch-sfx` ghi đè tệp đó.

```json
{
  "provider": "gemini",
  "tts_model": "gemini-3.8-flash-tts",
  "voice": "Leda",
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
- `voice` lấy từ `voice:` trong BRIEF.md. Mặc định `Leda`; các lựa chọn khác xem `voices.md`.

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

## §1b. Giọng nhân bản chạy trên máy (thay §1–§3)

Đọc mục "Giọng nhân bản" trong `voices.md` trước: điều khoản của chủ giọng, và cách viết chữ cho giọng đọc. App VoiceStudio phải đang mở (`install.md` §5).

Ghi request vào `.hyperframes/clone_request.json`:

```json
{
  "profile": "<tên profile, đúng như lệnh --profiles in ra>",
  "gap_s": 0.3,
  "tail_s": 0.4,
  "lines": [
    { "id": "01", "segments": [
      "Bật máy lên nào!",
      { "script": "Kho có hơn 8.600 đầu sách.", "say": "Kho có hơn tám ngàn sáu trăm đầu sách." }
    ] },
    { "id": "02", "tail_s": 2.2, "segments": [
      { "script": "Còn lại nằm cả trong nút Start:", "say": "Còn lại, nằm cả trong nút Start." },
      { "script": "tủ sách, hướng dẫn và mẹo sử dụng.", "gap_s": 0.22 }
    ] }
  ]
}
```

- **`segments`: mỗi đoạn một câu.** Ghép các `script` của một khung lại phải ra đúng lời đọc của khung đó trong SCRIPT.md; script kiểm điều này và dừng nếu lệch. Câu dài có dấu `:` hoặc `;` có thể tách tại đó. Hai câu rất ngắn (dưới khoảng 8 âm tiết mỗi câu) có thể để chung một đoạn.
- **`say`** chỉ ghi khi chữ đưa cho giọng khác chữ phụ đề (số, chữ viết tắt, tên riêng; bảng trong `voices.md`). Đoạn chỉ là một chuỗi thì `say` bằng `script`.
- **`gap_s`** là khoảng lặng **trước** đoạn đó: mặc định 0.3 s, dùng 0.22 s khi tách giữa câu.
- **`tail_s`** là khoảng lặng cuối khung (thay §3): mặc định 0.4 s, 1.5–2.5 s cho khung cuối.
- **`seed`, `cfg`** (tuỳ chọn, trong một đoạn): ép dùng đúng một lần tạo, khi đã biết seed nào đọc tốt.

```bash
node "$SK"/scripts/clone-voice.mjs --profiles                 # tên các profile đang có
node "$SK"/scripts/clone-voice.mjs                            # mọi khung; chạy nền, 6–10 phút cho 10 khung
node "$SK"/scripts/clone-voice.mjs --only 03,07               # chỉ tạo lại vài khung
```

Script làm những việc sau cho từng đoạn và từng khung:

1. Tạo giọng với seed 42. Cho whisper nghe lại, so với `say` (bỏ qua thanh điệu, vì whisper nghe sai dấu rất thường xuyên).
2. Một lần tạo **đạt** khi không có chữ nào của `say` bị mất hẳn (dòng log không có `dropped`) và tỉ lệ khớp từ 0.7. Chữ bị nghe thành chữ khác không tính là mất. Chưa đạt thì thử seed 43, 44, rồi 45, 46 với `guidance_scale` 2.5. Giữ lần đầu tiên đạt; không lần nào đạt thì giữ lần khớp nhất và ghi vào danh sách cần nghe.
3. Nối các đoạn bằng khoảng lặng, ghi `assets/voice/NN.wav` (24 kHz, mono, 24 bit; phần tiếng không bị xử lý gì).
4. Ghi `voices[]` vào `audio_engine_meta.json`: `words` là **chữ kịch bản** trên mốc thời gian whisper của từng đoạn (theo luật §2). Các khung không nằm trong lần chạy được giữ nguyên, nên `--only` ghi thẳng vào tệp phụ được.
5. In danh sách "whisper nghe khác", cùng dạng với §2. Đưa danh sách này vào báo cáo cuối.

Các lần tạo được lưu ở `.hyperframes/clone-voice/` và dùng lại khi `say` không đổi, nên chạy lại lệnh sau khi sửa một khung chỉ tốn thời gian cho khung đó.

Khi một đoạn không đạt ở cả năm lần:

- **Một cụm bị nuốt ở mọi seed** (thường là số): viết lại cụm đó trong `say` (`voices.md`), ví dụ "nghìn" thành "ngàn".
- **Đoạn quá dài:** tách thêm ở dấu phẩy lớn, `gap_s` 0.22.
- **Chỉ là whisper nghe sai** (tên riêng, chữ tiếng Anh): giữ nguyên, ghi vào báo cáo để người dùng nghe.

**Dò dấu nhận biết giọng tổng hợp.** App gắn một dấu không nghe thấy vào mọi audio nó tạo. Sau khi tạo giọng, và một lần nữa sau khi render, hỏi app (endpoint chỉ đọc WAV mono):

```bash
for f in assets/voice/*.wav; do printf '%s ' "$f"; curl -s -F "file=@$f" http://127.0.0.1:3900/watermark/detect; echo; done
ffmpeg -v error -y -i renders/video.mp4 -vn -ac 1 .hyperframes/video-mono.wav && curl -s -F "file=@.hyperframes/video-mono.wav" http://127.0.0.1:3900/watermark/detect
```

- **Tệp giọng trong `assets/voice/` phải báo có dấu** (`is_watermarked: true`) trước khi trộn. Không có thì dừng và báo người dùng.
- **MP4 đã trộn nhạc không cần dò ra dấu.** Trộn nhạc thường che mất dấu và hạ nhạc không cứu được, nên chủ giọng không yêu cầu. Kết quả trên MP4 chỉ ghi vào báo cáo cho biết.
- **Giữ `assets/voice/` và `.hyperframes/clone_request.json`** (chữ và seed) cùng dự án chừng nào video còn được đăng.
- **Mô tả video phải ghi rõ giọng đọc là giọng tổng hợp.** Nhắc người dùng điều này trong báo cáo cuối.

Sau §1b, đi tiếp §4. Không làm §2 và §3.

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

Viết một đoạn Python tạm trong scratchpad để làm việc này. Không lưu đoạn code đó vào skill hay vào dự án. (Bản Node của các luật này nằm ở `scripts/lib/align.mjs`, `clone-voice.mjs` dùng nó.) Sau khi sửa, kiểm tra lại: số từ mỗi khung phải bằng số từ của kịch bản.

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

Khi bật khớp nhịp (§6), prompt phải ghi rõ nhịp và có tiếng trống đều, ví dụ: `"upbeat electronic tech pulse, steady 4/4 with a clear kick on every beat, exactly 110 BPM, no tempo changes, no long intro"`. Nếu không có trống, `beat-grid` không bắt được nhịp. Chạy `beat-snap --reserve` **trước** lệnh dưới đây.

```bash
node "$ENGINE" --request ./.hyperframes/bgm_request.json --hyperframes . --out ./audio_engine_meta.json --only bgm
```

- **Chạy ghi thẳng vào tệp phụ.** `--only bgm` giữ nguyên `voices`. Độ dài nhạc (`bgm_target_duration_s`) bằng tổng `duration_s` của giọng đọc, nên phải chạy **sau** §3.
- **Nhạc chạy nền.** Kết quả ghi ra `assets/bgm/track.wav`, nhật ký ở `assets/bgm/bgm-*.log`.
- **Nhạc cũ bị thay.** Chạy lại lệnh này thì nhạc cũ bị thay bằng bài mới.

Dòng `bgm: launched lyria` trong kết quả nghĩa là đang dùng Lyria. Nếu dòng đó ghi `musicgen`, nghĩa là engine không thấy khoá Gemini hoặc gói `google-genai`. Khi đó nhạc chỉ dài khoảng 30 s và sẽ được lặp. Bản secure không có MusicGen: thiếu khoá hoặc thiếu `google-genai` thì không có nhạc, và engine ghi lý do vào `anomalies`. `"mode": "generate"` trong request là cách bật nhạc nền ở bản secure (mặc định tắt).

## §5. Chốt âm thanh (sau khi có STORYBOARD.md)

**Bước 1. Chờ nhạc nền.** Kết quả phải là `ready`:

```bash
node "$HF"/media-use/audio/scripts/wait-bgm.mjs --audio-meta ./audio_engine_meta.json --hyperframes . --timeout-ms 300000 --out ./.hyperframes/bgm_status.json
```

- Nếu kết quả là `failed` hoặc `timeout`: đọc tệp log, sửa nguyên nhân rồi chạy lại §4.
- Không được lắp video khi chưa có `track.wav`. Nếu thiếu tệp, `assemble-index` âm thầm bỏ nhạc; nó chỉ ghi một cảnh báo.

**Bước 2. SFX.** Lệnh này dựng lại `audio_meta.json` từ tệp phụ, gồm giọng đọc, nhạc nền và SFX:

```bash
node "$FX"/audio.mjs fetch-sfx --storyboard ./STORYBOARD.md --hyperframes .
```

- **Tên SFX:** chỉ dùng tên có trong `$HF/media-use/audio/assets/sfx/*.mp3`. Tên sai bị bỏ qua mà không báo gì. Hãy đối chiếu tên trước khi chạy, và đếm số `sfx` trong kết quả.
- **Không có cảnh báo nào khi nhạc chưa xong.** `fetch-sfx` không kiểm tra nhạc nền đã xong hay chưa, nên luôn phải qua bước 1 trước.

**Bước 3. Sửa `audio_meta.json`.** Làm sau lần `fetch-sfx` cuối cùng:

- **`sfx[].offset_s`:** `fetch-sfx` luôn ghi 0, tức là SFX kêu ngay đầu khung. Hãy ghi số giây theo `- sfx_at:` của khung:
  - `sfx_at` là số: dùng số đó.
  - `sfx_at` là từ hoặc cụm từ: dùng `start` của từ đầu cụm đó, trong `words` của khung.
- **`sfx[].volume`:** `0.22`. Mặc định 0.35 là quá to so với giọng đọc.
- **`bgm.volume`:** để tạm `0.3` (với nhạc Lyria đã đo, mức này cho khoảng 12 dB). Giá trị thật được đo bằng `mix-balance.mjs` sau khi lắp ráp (SKILL.md bước 9). Mức cũ 0.1 đã đo được là nằm dưới giọng đọc khoảng 22 dB: gần như không nghe thấy nhạc. Mục tiêu là 12 dB cho video giải thích, 6–8 dB cho video khớp nhịp.
- **`bgm_pending`:** `false`, sau khi bước 1 báo `ready`.
- **Kiểm tra:** `voices` còn đủ số khung, và chữ trong `words` là chữ kịch bản.

**Bước 4. Ghi thời lượng thật vào storyboard.**

```bash
node "$FX"/audio.mjs sync-durations --audio-meta ./audio_meta.json --storyboard ./STORYBOARD.md
```

Lệnh chỉ sửa `- duration:` của từng khung. Hãy tự sửa `duration:` ở frontmatter thành tổng các khung.

**Khi phải làm lại giọng đọc sau bước này**, làm theo thứ tự: §1 (tạo lại khung), §2, §3, rồi §5 từ bước 2. Không cần tạo lại nhạc nền, trừ khi tổng độ dài thay đổi nhiều. Nếu đang khớp nhịp, chạy lại `beat-snap --grid … --apply` trước bước 2.

## §6. Khớp nhịp (tuỳ chọn)

Bật khi BRIEF.md có `beat_sync: <BPM>`. Mọi điểm cắt khung rơi đúng một nhịp của nhạc. `beat-snap` làm việc này bằng cách thêm khoảng lặng vào cuối tệp giọng đọc, nên nguyên tắc "thời lượng lấy từ âm thanh thật" vẫn đúng.

**Vì sao phải dự trữ trước.** Lyria tạo nhạc dài bằng tổng `duration_s` lúc gửi request. Khớp nhịp làm mỗi khung dài thêm tới một nhịp. Nếu không dự trữ, video dài hơn bài nhạc, và `assemble-index` lặp lại bài nhạc ở đoạn cuối.

Thứ tự, chạy trong thư mục dự án video (`SK` là thư mục skill này):

```bash
# 1. Sau §3, trước §4: dự trữ độ dài ở khung cuối
node "$SK"/scripts/beat-snap.mjs --reserve --bpm 110 --apply

# 2. §4 với prompt có "exactly 110 BPM", rồi §5 bước 1 (wait-bgm) cho tới "ready"

# 3. Đo lưới nhịp của bài nhạc thật
node "$SK"/scripts/beat-grid.mjs assets/bgm/track.wav --bpm 110 --json .hyperframes/beat-grid.json

# 4. Khớp: xem kế hoạch, rồi áp dụng
node "$SK"/scripts/beat-snap.mjs --grid .hyperframes/beat-grid.json
node "$SK"/scripts/beat-snap.mjs --grid .hyperframes/beat-grid.json --apply

# 5. Tiếp §5 từ bước 2 (fetch-sfx, …, sync-durations)
```

Cách đọc kết quả:

- **`beat-grid`** in BPM và BEAT0 đo được, rồi mỗi ô nhịp (4 phách) một dòng. Cột `K.K.` là phách có tiếng trống kick. Cột dB là độ to.
  - Chỗ dB tăng vọt là đoạn nhạc "vào". Nên đặt khung chính (cover, luận điểm) ở đó, và ghi mốc đó vào Video direction.
  - Nếu có dòng `note: few kicks detected`, bài nhạc không có nhịp rõ. Tạo lại nhạc với prompt nhấn mạnh trống, hoặc tắt khớp nhịp.
  - BPM đo được có thể lệch vài phần trăm so với BPM đã yêu cầu. Luôn dùng tệp `--json`, không dùng số trong BRIEF.
- **`beat-snap`** in mỗi khung một dòng: độ dài cũ → mới, số giây thêm vào, và phách mà điểm cắt rơi vào.
  - `--every 2` hoặc `--every 4` chỉ cắt ở mỗi 2 hoặc 4 phách. Khung dài thêm nhiều hơn, nhưng nhịp cắt đều hơn.
  - Khung cuối kết thúc đúng lúc nhạc hết. Nếu báo `the music … ends … before the last frame can`, nghĩa là quên bước 1: khôi phục giọng đọc (chạy lại §1 hoặc chép từ `.hyperframes/beat-snap-backup/`), rồi làm lại từ bước 1.
- **Chạy lại an toàn.** Bản gốc của giọng đọc nằm ở `.hyperframes/beat-snap-backup/`, và mỗi lần chạy đều tính lại từ bản gốc. Giọng đọc tạo lại sau lần chạy trước được coi là bản gốc mới.
- **Độ chính xác.** Điểm cắt được làm tròn theo khung hình 30 fps, nên lệch nhịp tối đa khoảng ±16 ms. Tai người không nhận ra mức này.

Khi viết các khung, đặt hiệu ứng mạnh (flash, slam) ở giây 0 của khung: đó chính là phách. Hai preset `glass-keynote` và `comic-multiverse` có mục "Beat-sync videos" hướng dẫn cụ thể.

## §7. Đổi giọng cho video đã dựng

Dùng khi video đã có đủ khung và người dùng muốn **giọng khác cho cùng kịch bản** (đổi giọng Gemini, hoặc sang giọng nhân bản). Không dựng lại khung: `retime-frames.mjs` giữ nguyên timeline của từng khung và phát nó qua một bản đồ thời gian cũ → mới, neo theo mốc bắt đầu của từng từ. Điều kiện: lời đọc không đổi (số từ mỗi khung như cũ). Sửa chữ thì phải dựng lại khung đó.

```bash
# 1. Lưu bản hiện tại (giọng, nhạc, meta, storyboard, khung, bản render). Đặt tên theo giọng cũ.
node "$SK"/scripts/retime-frames.mjs backup orus

# 2. Tạo giọng mới vào audio_engine_meta.json: §1b, hoặc §1–§3 với giọng Gemini khác.

# 3. Kéo khung, SFX và storyboard theo giọng mới
node "$SK"/scripts/retime-frames.mjs apply orus
```

`apply` luôn tính lại từ bản lưu, nên chạy lại được sau mỗi lần sửa giọng mới. Nó làm ba việc:

- **Khung:** ghi lại `compositions/frames/*.html` từ bản lưu, đổi `data-duration`, và bọc timeline bằng một timeline ngoài chạy theo bản đồ thời gian. Khung có khoảng giữ dài hơn giọng (để crossfade) được giữ nguyên khoảng đó.
- **`audio_meta.json`:** `voices` lấy từ tệp phụ; `sfx[].offset_s` đi qua cùng bản đồ. **Không** chạy lại `fetch-sfx` (nó đặt lại offset về 0).
- **`STORYBOARD.md`:** `- duration:`, khoảng thời gian của từng Scene, các mốc `(1.2s)`, `sfx_at` dạng số, và `duration:` ở frontmatter. Mốc viết ngoài ngoặc trong lời mô tả ("Holds from 8.3s") giữ số cũ; chúng chỉ là ghi chú, khung không đọc lại storyboard.

**4. Nhạc nền theo độ dài mới.** Dòng cuối của `apply` in tổng mới.

- **Ngắn hơn:** cắt bài cũ từ bản lưu, mờ dần 3 s cuối:

  ```bash
  T=85.54   # tổng mới
  ffmpeg -v error -y -i .hyperframes/backup-orus/track.wav -t $T -af "afade=t=out:st=$(echo "$T - 3" | bc):d=3" assets/bgm/track.wav
  ```

- **Dài hơn** quá khoảng 1 s, hoặc video đang khớp nhịp: tạo lại nhạc (§4, rồi §5 bước 1). Video khớp nhịp còn phải chạy lại `beat-snap` (§6) **trước** bước 3, vì `beat-snap` đổi độ dài tệp giọng.

**5. Lắp ráp và kiểm lại** như SKILL.md bước 9–10: `captions.mjs build`, `regroup-vi.mjs`, `assemble-index`, `transitions.mjs inject` và `verify`, `mix-balance`, `lint`, `check`, snapshot, render. Snapshot lần này chụp **tại các mốc từ khoá** của từng khung (mốc `(…s)` mới trong storyboard, cộng 0.3 s): hình phải đúng với chữ phụ đề đang hiện. Đây là cách duy nhất agent kiểm được việc hình còn khớp lời.

Cập nhật dòng `voice:` và ghi chú giọng trong BRIEF.md. Báo cáo ghi rõ bản cũ nằm ở `.hyperframes/backup-<tên>/`.
