# STORYBOARD.md: quy tắc và mẫu

Viết **một** tệp gồm cả phần kế hoạch (faceless-explainer Step 3) lẫn phần thiết kế hình (Step 4). Các lệnh
`frame-packets`, `fetch-sfx`, `sync-durations`, `captions` và `assemble-index` của faceless đọc đúng các trường này,
nên hãy tự kiểm theo danh sách ở SKILL.md bước 6 trước khi đi tiếp.

## Frontmatter

```yaml
---
format: 1920x1080
duration: 101s              # tự sửa = tổng các khung sau sync-durations
message: "<câu chủ đề của BRIEF>"
arc: concept-explainer with process
audience: <như BRIEF>
mode: autonomous
music: calm minimal tech underscore, warm, unobtrusive
---
```

## Video direction (bắt buộc, đặt trước `## Frame 1`)

Bảy mục. Mỗi mục là một gạch đầu dòng in đậm, viết cụ thể cho video này:

- **Palette system**
  - Lấy từ frame.md, không tự bịa màu.
  - Nói rõ màu nền, màu thẻ, màu mực.
  - Màu tối (navy) chỉ xuất hiện khi hiện code, tệp hay terminal.
  - Màu nhấn (coral) chỉ một lần mỗi khung, ghi theo từng khung ở trường `coral:`.
- **Type**
  - Serif cho tiêu đề (EB Garamond 400, chữ thường, giãn chữ âm).
  - Inter cho nhãn.
  - JetBrains Mono IN HOA, giãn 0.16em, có ✱ phía trước, cho kicker và tên tệp.
  - Ghi rõ: "font tiếng Việt trong `assets/fonts/` (frame.md § Font faces), line-height tiêu đề ≥ 1.1, không cắt chiều dọc hộp chữ".
- **Motion grammar**
  - Vào cảnh bằng `power3` / `expo.out`; không nảy (bounce), không co giãn (elastic).
  - Mỗi chi tiết hiện ra đúng lúc giọng đọc nói tới; sau lần hiện cuối thì đứng yên.
- **Rhythm / held frames**: khung nào là khung dừng để đọc (luận điểm, câu chốt), khung nào nhanh nhất.
- **Framing variety**: bố cục của từng khung. Không lặp cùng một bố cục ở hai khung liền nhau.
- **Caption keep-out**
  - Phụ đề nằm ở ~17% dưới cùng (y > 896).
  - Nội dung chính phải ở trên đường đó.
  - Nền full-bleed đặt trên lớp `.clip`.
- **Language + Negative list**
  - Mọi chữ trên hình là tiếng Việt, trừ định danh nguyên văn (tên tệp, lệnh, URL).
  - Không dữ liệu cá nhân, token hay đường dẫn riêng.
  - Không gradient tím/xanh kiểu "AI", không robot/não, không `repeat`/`yoyo`/`Math.random`/`@keyframes`.
  - Cấm cả hai kiểu hỏng: "slideshow" (hiện hết trong 25% đầu rồi đứng im) và "screensaver" (nhiều thứ trôi lung tung).

## Mẫu một khung

```markdown
## Frame 1 — Model chỉ biết một việc

- scene: Một khối "model" đơn độc trên nền kem; tin nhắn trượt vào, một tin nhắn trượt ra; ba năng lực hiện ra rồi bị gạch bỏ từng cái
- voiceover: "Một model AI chỉ làm được đúng một việc — nhận tin nhắn, trả tin nhắn. Nó không nhớ. Không chạm được vào đĩa. Không chạy được lệnh nào."
- duration: 10.09s
- transition_in: cut
- status: outline
- src: compositions/frames/01-model-chi-biet-mot-viec.html
- type: hook
- persuasion: Counterintuitive claim + Subtractive framing
- beat: Surprise + recognition
- blueprint: kinetic-type-beats (Adapt)
- focal: the "model" block — a rounded tile-strong card with the serif word "model" inside, centered
- roles: model block = foreground subject · two message pills = supporting · three capability words with drawn strike lines = supporting · cream field + faint hairline grid = background
- coral: the strike line through the third capability ("chạy lệnh")
- sfx: click-soft
- sfx_at: lệnh nào

narrativeRole: Mở khoảng trống nhận thức: thứ người xem tưởng là "agent thông minh" thực ra chỉ là một hàm message-vào/message-ra.
keyMessage: Tự thân model không nhớ, không làm, không chạm vào gì cả.

Adapt: keep the multi-beat statement build on a fixed center anchor; beat 1's payload is the model block with its in/out pills, the escalation is three subtractive strike-throughs.
Scene 1 (0.0–2.8s): the model block rises into upper-center (~34% width) on a smooth settle; a mono kicker "✱ MÔ HÌNH NGÔN NGỮ" fades up above it.
Scene 2 (2.8–4.9s): on "nhận tin nhắn" (2.9s) a pill "tin nhắn" slides in from the left and docks; on "trả tin nhắn" (4.0s) a second pill slides out right. Hairline arrows draw on between them.
Scene 3 (4.9–10.09s): three serif words land one per cue — "nhớ" (5.4s), "chạm đĩa" (6.6s), "chạy lệnh" (8.3s) — each immediately struck through by a hand-drawn line (ink, ink, coral), the struck word dimming to ~45%. Holds still from ~9.3s.
```

## Quy tắc từng trường

| Trường | Quy tắc |
|---|---|
| `## Frame N — Tiêu đề` | N chạy từ 1, khớp `(Frame N)` trong SCRIPT.md |
| `voiceover` | Bản sao chính xác lời đọc của khung trong SCRIPT.md, đặt trong ngoặc kép thẳng |
| `duration` | Để `sync-durations` ghi; không bao giờ sửa tay |
| `transition_in` | Khung 1 dùng `cut`; các khung sau dùng tên trong `cut-catalog.md` (vd `blur-crossfade`) |
| `status` | Ghi `outline`; đổi thành `animated` khi tệp khung qua bước kiểm (SKILL.md bước 8) |
| `src` | `compositions/frames/NN-slug.html`, slug ASCII chữ thường (bỏ dấu) |
| `sfx` | `none`, hoặc tên có sẵn: chime, click-soft, click, error, glitch-1..3, impact-bass-1/2, key-press, notification, ping, pop, riser, sparkle, typing, whoosh-cinematic, whoosh-short, whoosh |
| `sfx_at` | Bắt buộc khi có sfx. Là số giây trong khung (vd `6.8`) hoặc từ/cụm từ trong lời thoại (vd `quyết định`); dùng để ghi `offset_s` (audio.md §5) |
| `hero_text` | Không bắt buộc. Câu thoại được phép hiện nguyên văn trên hình (khung luận điểm hoặc khung chốt) |
| Dòng `Scene k (a–bs):` | Thời gian thật lấy từ `words` của khung trong `audio_engine_meta.json` (đã sửa chữ, audio.md §2); ghi mốc của từ khoá trong ngoặc; Scene cuối kết thúc bằng `duration` |
| Tên rule trong backtick | Tối đa ~1 tên mỗi khung. Mỗi tên kéo cả rule vào packet, và packet giới hạn 48 KB |

SFX nên thưa: khoảng 1 cái mỗi khung ở những khoảnh khắc có "va chạm" (gạch bỏ, thẻ rơi xuống, kết nối khép lại). Khung dừng để đọc thì dùng `none`.
