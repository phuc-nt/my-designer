# Kiểm trước khi giao

Phần chung (lint, check, snapshot, render, ebur128, blackdetect, ảnh trích từ MP4, bản social) làm đúng bước 9–10 của `vi-explainer-video`. Tệp này chỉ thêm những gì riêng của video app.

## 1. Chụp dày ở chỗ dễ hỏng

Lỗi của video app chỉ lộ ở chỗ có lật, đổi máy, bứt ra và ẩn hiện. Chụp giữa khung không bắt được.

```bash
hyperframes snapshot --at <t−1.2,t−0.6,t,t+0.3,t+0.6,t+1.2> --no-end --describe false -o snapshots/flip-NN
```

Cứ mỗi chỗ có lật, đổi máy hay bứt ra, chụp 5–6 ảnh trong khoảng 3 s quanh nó. Đọc từng contact sheet và kiểm:

- vật có biến mất từ đầu khung không (lỗi `tl.set` visibility);
- bản sao có khởi đầu đúng chỗ bản gốc không (lệch thì toạ độ đo sai, hoặc font chưa nạp lúc đo);
- chấm chạm có nằm đúng nút không;
- máy có lún xuống vùng phụ đề không;
- tiêu đề đã mờ hết trước khi máy khác tới chưa.

## 2. Đối chiếu với app

- Chữ trên màn app trong ảnh chụp khớp kit, và kit khớp mã nguồn của app (tên nút, thứ tự, chữ in đậm).
- Đoạn tiếng app: không có phụ đề trong khoảng `timing-NN.json`. Chữ sáng đi đúng thứ tự.
- Không còn gì trong danh sách cấm của BRIEF: logo, huy hiệu, số liệu tự bịa, chữ cấm.
- Mọi con số và lời khẳng định trong lời đọc, trên hình và trong chữ chốt đều có dòng trong `facts.md` (`ideas.md`, mục "Tệp sự thật"). Câu nào không có nguồn thì sửa câu, không thêm nguồn cho vừa.

## 3. Âm thanh

- `mix-balance --target 7`: nhạc nằm dưới giọng 6–8 dB, mức hợp với video quảng bá.
- Trong đoạn demo, nhạc thấp thêm khoảng 12 dB. Kiểm bằng `ffmpeg -ss <A> -t <B−A> -i renders/video.mp4 -af ebur128 -f null -`, so với một đoạn có lời đọc.
- Bản render to hơn mục tiêu thì hạ cả tiếng mà không mã hoá lại hình:
  `ffmpeg -i video-raw.mp4 -c:v copy -af volume=-2.5dB -c:a aac -b:a 192k -movflags +faststart renders/video.mp4`

## 4. Chuyển động

- Chạy `node "$SK"/scripts/motion-audit.mjs` (đọc `renders/video.mp4`), hoặc `node "$AP"/scripts/ref-study.mjs study renders/video.mp4` để có thêm nhịp cắt và độ động theo từng phần mười. Hai lệnh cùng một cách đo đứng hình.
- Mức của video quảng cáo: **đứng hình tối đa khoảng 1 s trên mỗi 30 s**, không tính đoạn tiếng app (đoạn đó cố ý gần như đứng yên). Open Book đo được 1,5 s/30 s. Quá mức thì xem chỗ đứng dài nhất trong `sheets.txt`: thêm một chuyển động nhỏ có nghĩa (con trỏ, chữ sáng, máy trôi chậm), không thêm rung vô cớ.
- Nhìn vào ô đầu tiên của `overview.jpg`: **khung đầu phải là một hình đã xong**, có chữ hay vật đọc được, không phải nền trống đang chờ phần tử bay vào. Nền tảng mạng xã hội lấy khung này làm ảnh xem trước.
- **Hiểu được khi tắt tiếng.** Đọc lần lượt các ô của `overview.jpg`, chỉ nhìn hình và phụ đề: vẫn phải biết app là gì, làm được gì và gọi hành động gì. Ô nào chỉ có nghĩa khi nghe lời thì thêm chữ lên hình.
- Agent chỉ thấy ảnh tĩnh. Báo rõ rằng chuyển động chưa được xem bằng mắt.

So với một video tham khảo chủ dự án thích (tuỳ chọn):

```bash
node "$AP"/scripts/ref-study.mjs compare <ref.mp4> renders/video.mp4 --sheets --out snapshots/compare
```

Lệnh in số cắt mỗi phút, độ dài cảnh, tỉ lệ đứng hình và độ động của hai bản cạnh nhau. Số chỉ tả nhịp, không chấm hay dở; dùng để biết nên dồn nhịp hay giãn ra ở đoạn nào.

Bản cắt để lặp (khung cuối nối về khung đầu): `node "$AP"/scripts/ref-study.mjs loop renders/video.mp4`, SSIM phải ≥ 0.97. Cách làm bản lặp ở `variants.md`.

## 5. Một vòng soát bằng mắt mới

Agent dựng video đã quen ý định của mình nên nhìn đâu cũng thấy đúng. Một agent mới, chưa đọc storyboard, nhìn ra những gì người xem lần đầu thấy. Chỉ chạy vòng này cho **video theo khuôn mới**, hoặc khi chủ dự án yêu cầu: mỗi vòng tốn một agent đọc vài chục ảnh.

1. Giao cho một Agent chạy nền (`general-purpose`) prompt sau, điền đường dẫn tuyệt đối. Không gửi STORYBOARD, kịch bản hay ghi chú dựng.

   ```text
   You are reviewing a finished app promo video as a first-time viewer would see it. You get only the render and the brief.
   Render: <PROJECT>/renders/video.mp4. Brief: <PROJECT>/BRIEF.md (read it for audience, goal and the banned list).
   Pull your own frames: node <AP>/scripts/ref-study.mjs study <PROJECT>/renders/video.mp4 --out <PROJECT>/snapshots/critic-<N>
   then Read overview.jpg and every sheet it lists; take more with --around t1,t2 where something looks off.
   Return at most 10 problems, worst first. Each: timestamp, what a viewer would notice, why it hurts the goal in the brief,
   a concrete fix. Only things visible in frames: no guesses about sound or motion between frames.
   End with one line: "SHIP" or "ONE MORE PASS".
   ```

2. Ghi kết quả vào `CRITIC.md` ở gốc dự án: mỗi vòng một mục, mỗi lỗi một dòng với cột "đã sửa / không sửa, vì sao".
3. Sửa những lỗi có thật, lắp ráp và render lại, rồi chạy vòng 2 với một agent mới (`critic-2`). **Tối đa hai vòng.** Lỗi còn lại sau vòng 2 đưa vào mục EYE của báo cáo cho chủ dự án quyết.

## 6. Bản gửi qua chat

Chat thường giới hạn tệp khoảng 30 MiB. Làm thêm bản 720p:

```bash
ffmpeg -hide_banner -v error -y -i renders/video.mp4 -vf scale=1280:-2 -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart -c:a copy renders/video-720p.mp4
```

## 7. Báo cáo

Dùng năm đầu mục của `AGENTS.md`, mục "Reporting finished work":
- BUILD: MP4, độ dài, kích thước;
- CHECK: lint, check, LUFS, peak, black;
- LOOK: các contact sheet đã đọc, gồm cả các ảnh chụp dày; số đứng hình trên 30 s; kết luận của vòng soát mới nếu có chạy;
- EYE: những gì chủ dự án cần xem và nghe;
- NOT_VERIFIED: tiếng, nhịp, chuyển động, giọng app nào được thu.

Luôn nhờ một người nghe trước khi đăng, nhất là đoạn tiếng app và các cụm tiếng Anh trong lời Việt.
