# Tiếng thật của sản phẩm

Khi app có tiếng (đọc to, giọng hướng dẫn, âm báo), cho người xem nghe đúng cái app phát ra. Đó là bằng chứng mạnh hơn mọi câu giới thiệu. Một video chỉ cần một đoạn, dài khoảng 3–6 s, đặt ở khung chính.

## 1. Thu bằng chính mã của app

Không ghi màn hình, không dùng mic. Gọi đúng bộ phát tiếng của app, với giọng và tốc độ mặc định, rồi ghi ra WAV.

**iOS:** thêm một test XCTest tạm, chỉ chạy khi có biến môi trường, rồi chạy trên máy thật.

```swift
// Temporary: capture what the app speaks for a promo video. Delete after use, never commit.
func testCapturePromoAudio() throws {
    try XCTSkipUnless(ProcessInfo.processInfo.environment["PROMO_AUDIO"] == "1")
    let synth = AVSpeechSynthesizer()
    let utterance = AVSpeechUtterance(string: "Slow but steady wins the race.")   // the app's own text
    utterance.voice = AVSpeechSynthesisVoice(language: "en-US")                    // what the app picks by default
    let url = FileManager.default.temporaryDirectory.appendingPathComponent("app-en.wav")
    var file: AVAudioFile?
    let done = expectation(description: "written")
    synth.write(utterance) { buffer in
        guard let pcm = buffer as? AVAudioPCMBuffer else { return }
        if pcm.frameLength == 0 { done.fulfill(); return }
        if file == nil { file = try? AVAudioFile(forWriting: url, settings: pcm.format.settings) }
        try? file?.write(from: pcm)
    }
    wait(for: [done], timeout: 30)
    add(XCTAttachment(contentsOfFile: url))
}
```

- Nếu app có bộ đọc riêng (một engine khác cho tiếng Việt), gọi đúng hàm của app thay cho `AVSpeechSynthesizer`.
- Chạy bằng `xcodebuild test`, đặt biến `PROMO_AUDIO=1` trong scheme hoặc test plan, rồi lấy tệp WAV:
  `xcrun xcresulttool export attachments --path <.xcresult> --output-path .hyperframes/app-voice/`
- Thu xong thì **xoá test**. Không commit nó vào repo của app.
- **Android:** `TextToSpeech.synthesizeToFile` trong một instrumented test, cũng gate bằng tham số, lấy tệp bằng `adb pull`.
- **Web:** ghi luồng `AudioContext` của trang bằng `MediaRecorder` trong một trang thử.
- **Ghi rõ giọng nào được thu.** Ví dụ: máy chưa tải giọng nâng cao thì đó là giọng hệ thống bản thường. Ghi điều này vào báo cáo, vì người xem trên máy khác có thể nghe hay hơn.

## 2. Ghép vào giọng đọc của khung

Sau bước tạo giọng của `vi-explainer-video` (bước 4), trước nhạc nền (bước 5):

```bash
node "$AP"/scripts/splice-voice.mjs . --frame 7 --at 11.4 --insert .hyperframes/app-voice/app-en.wav,.hyperframes/app-voice/app-vi.wav
```

- Cấu trúc ghép: lời trước + 0,5 s + câu 1 + 0,35 s + câu 2 + 0,7 s + lời sau. Khoảng lặng chỉnh bằng `--gaps`.
- `--at` phải rơi vào khoảng nghỉ giữa hai từ. Script cảnh báo khi cắt giữa một từ. Mốc từ nằm trong `words` của `audio_engine_meta.json`.
- Script dời mốc mọi từ sau điểm cắt và cập nhật `duration_s`. Nó ghi `.hyperframes/app-voice/timing-NN.json`: mốc bắt đầu và kết thúc của từng đoạn tiếng app, tính theo giây của khung. Đây là các mốc dùng cho dòng Scene và cho chữ sáng.
- Chạy lại bao nhiêu lần cũng được. Script luôn ghép lại từ bản gốc `NN.pre-splice.wav`.
- Tiếng app to hay nhỏ hơn giọng đọc thì chỉnh bằng `--clip-db`. So hai bên bằng `ffmpeg -i <tệp> -af ebur128 -f null -`.
- Trong lời đọc, viết câu dẫn ngay trước đoạn ghép, kiểu "nghe thử nhé", để người xem biết sắp nghe app.

## 3. Mốc chữ cho hiệu ứng chữ sáng

Chữ trong app sáng theo tiếng đọc thật thì cần mốc từng chữ của tệp tiếng app:

```bash
hyperframes transcribe .hyperframes/app-voice/app-en.wav --json --model small.en && cp assets/transcript.json .hyperframes/app-voice/app-en.words.json
hyperframes transcribe .hyperframes/app-voice/app-vi.wav --json --model small --language vi && cp assets/transcript.json .hyperframes/app-voice/app-vi.words.json
```

- Lệnh `transcribe` ghi đè `assets/transcript.json` mỗi lần chạy, nên chép tệp đó đi ngay sau mỗi lần.
- Với tiếng Việt, luôn ghi rõ `--model small --language vi`. Model mặc định `small.en` sẽ dịch tiếng Việt sang tiếng Anh.
- Cộng `start` của đoạn đó trong `timing-NN.json` vào mỗi mốc, rồi bật lớp sáng theo các mốc đã cộng.
- Chữ whisper nghe ra có thể khác chữ trong app. Khi đó lấy chữ từ app, chỉ giữ mốc thời gian.

## 4. Không phụ đề trong đoạn demo

- Trên hình đã có chữ của app sáng theo tiếng, nên phụ đề sẽ thừa và đè lên nhau.
- Sau `captions.mjs build` và `regroup-vi.mjs`: kiểm trong `caption_groups.json` rằng không nhóm nào chồng lên khoảng `clips[].start`–`clips[].end` của khung đó, tính cả offset của khung trên toàn video.
- Nếu một nhóm vắt qua khoảng đó, tách nhóm tại điểm cắt, sửa cả `GROUPS` trong `compositions/captions.html` cho khớp.

## 5. Lùi nhạc trong đoạn demo

`assemble-index` phát nhạc ở một mức suốt video, nên đoạn lùi phải nướng thẳng vào tệp nhạc:

```bash
node "$AP"/scripts/duck-bgm.mjs . --at 95.93-100.63            # giây trên cả video; mặc định −12 dB, dốc 0,4 s
node "$FX"/assemble-index.mjs --storyboard ./STORYBOARD.md --hyperframes .
node "$FX"/transitions.mjs inject --storyboard ./STORYBOARD.md --hyperframes .
node "$SK"/scripts/mix-balance.mjs --target 7
```

- Mốc trên cả video bằng offset của khung (tổng `duration` các khung trước) cộng mốc trong `timing-NN.json`. Nới mỗi đầu thêm khoảng 0,1 s.
- Script giữ nguyên tệp nhạc gốc và ghi ra `track-duck.wav`, rồi trỏ `bgm.path` sang tệp đó. Chạy lại thì tệp được tạo lại từ bản gốc.
- Đổi nhạc hay đổi thời lượng khung thì chạy lại lệnh với mốc mới.

## 6. Tiếng thao tác trên giao diện

Chạm, gạt, bật, thẻ bật ra và chuyển cảnh nghe được thì giao diện thấy "thật" hơn. `ui-sfx.mjs` tạo sẵn sáu tiếng bằng công thức của ffmpeg (không cần thư viện tiếng, không lo giấy phép), rồi đặt từng tiếng sao cho **chỗ to nhất** rơi đúng lúc chạm, không phải mẫu đầu tiên.

```bash
node "$AP"/scripts/ui-sfx.mjs synth .                       # assets/sfx/ui-{click,tick,pop,swipe,whoosh,chime}.wav
node "$AP"/scripts/ui-sfx.mjs place . --dry \
  --cue 3:6.4:click --cue 3:6.9:pop --cue 5:0.2:whoosh --cue 9:4.1:chime
node "$AP"/scripts/ui-sfx.mjs place . --cue …               # bỏ --dry khi danh sách đã đúng
node "$FX"/assemble-index.mjs --storyboard ./STORYBOARD.md --hyperframes .
node "$FX"/transitions.mjs inject --storyboard ./STORYBOARD.md --hyperframes .
```

- Một `--cue` là `khung:giây:tên[:âm lượng]`. Giây tính từ đầu khung, cùng đồng hồ với dòng Scene: lấy đúng mốc chạm của `tap` hay mốc bứt ra trong khung đó.
- Dùng tiếng nào cho việc gì: `click` cho chạm nút, `tick` cho bật tắt và bước danh sách, `pop` cho thẻ hay chip hiện ra, `swipe` cho lật trang, `whoosh` cho đổi máy và cắt cảnh, `chime` cho xong hay lưu. Một tệp khác trong dự án cũng đặt được bằng đường dẫn; `ui-sfx.mjs peak <tệp>` cho biết chỗ to nhất của nó.
- `whoosh` to nhất ở 0,4 s. Đặt nó ở đầu khung thì nó vào muộn: lệnh báo `!` và gợi ý đặt ở cuối khung trước.
- Ít thôi: khoảng một tiếng cho mỗi thao tác thật, không đặt cho mọi vật bay vào. Không đặt tiếng trong đoạn tiếng app.
- Chạy `place` **sau** `fetch-sfx`, vì `fetch-sfx` đặt mọi `offset_s` về 0. Sau cùng chạy `mix-balance --target 7`: dòng `louder than the voice` là tiếng nào cần hạ `volume`.
