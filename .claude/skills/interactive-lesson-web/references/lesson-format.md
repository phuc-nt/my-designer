# lesson.js

Một module ES, đặt ở `<web-root>/<bai>/lesson.js`. `build.mjs` chép nó nguyên vào bản dựng, `app.js` import nó. Ví dụ đủ mọi phần: `examples/chuong-6-v02-paper/lesson.js`.

```js
export const META = {
  code: "C3-B05",                           // (site có curriculum) mã bài trong curriculum.json; chỉ mã chương ("C6") = "Luyện thêm"
  video: "../../videos/<du-an-video>",     // đường dẫn tới dự án video, tính từ thư mục bài web
  title: "…",                               // <title> của tab, 2–5 chữ
  kicker: "Sa hình · Bài giảng tương tác",   // dòng nhỏ trên tiêu đề
  heading: "…",                             // tiêu đề trang = tên bài của video
  description: "…",                         // một câu cho thẻ mục lục và <meta description>
  layers: ["canvas"],                       // tên các canvas createWorld nhận, theo thứ tự xếp lớp (xem engines.md)
  world: {},                                // tuỳ chọn thêm cho createWorld (chỉ khi thế giới có)
  view: [x, y, w, h],                       // vùng của khung 1920×1080 mà sân khấu hiện (mặc định cả khung)
  portraitShape: 4 / 3,                     // (tuỳ) sân khấu trên điện thoại dọc không rộng hơn tỉ lệ này; 16 / 9 = không cắt
  hint: "…",                                // dòng gợi ý cuối bảng bên phải (chỉ khi có chạm)
  captions: true,                           // false khi video không có caption_groups.json
  opening: "Mở đầu",                        // tên thẻ cho các khung đứng trước phần đầu tiên
};

export const NAME = { truck: "Xe tải", … };  // tên hiển thị của các thứ chạm được / phương án theo id

export const PARTS = [
  {
    label: "Tình huống 1",            // tên thẻ (tab); tiền tố "<label>: " trong tên khung bị bỏ khi hiện bước
    prefix: "Câu 502",                // (tuỳ) tiền tố bỏ khỏi tên khung thay cho label, khi tiêu đề SCRIPT.md mở bằng chữ khác
    frames: [1, 2, 3, 4],             // khung của phần (số Frame trong SCRIPT.md, bắt đầu từ 1)
    explain: 3,                       // khung bắt đầu giải: trước đó thẻ Lời giải và lý do trên thẻ chạm bị khoá
    verdict: "…",                     // câu kết luận, nguyên văn
    tip: "…",                         // câu Chốt / mẹo nhớ, nguyên văn (cũng vào thẻ Ghi nhớ cuối bài)
    cardTitle: "Chốt",                // tiêu đề thẻ (mặc định "Lời giải" nếu có ask, không thì "Chốt")
    ask: {                            // câu bài hỏi người xem; trang dừng ở cuối câu đó
      question: "…",                  // nguyên văn câu hỏi trong lời đọc
      after: "…",                     // (tuỳ) đoạn lời đọc mà trang dừng sau nó, khi khác chữ question
      frame: 2,                       // (tuỳ) khung có câu hỏi, mặc định khung đầu của phần
      kind: "one",                    // "one": chọn một; "order": chạm theo thứ tự
      options: [["a", "Hướng 2, 3, 4"], ["b", "Chỉ hướng 1"]],  // (tuỳ) phương án; mặc định các id trong why
      answer: "b",                    // id đúng; "order" thì mảng id theo thứ tự đúng
      how: "…",                       // (tuỳ) dòng hướng dẫn thay cho mặc định
      reveal: "…",                    // (tuỳ) câu hiện sau khi kiểm, mặc định verdict
    },
    site: 1,                          // (chỉ khi thế giới có actorsOnScreen) nút giao của phần
    why: { truck: ["câu 1", "câu 2"] },  // lý do cho thẻ chạm, mỗi câu nguyên văn; câu đầu dùng để tìm đoạn "Nghe đoạn này"
  },
];

export const SUMMARY = {             // hoặc null
  label: "Tổng kết",
  frames: [17],
  title: "Ghi nhớ",                  // (tuỳ)
  lines: ["…"],                      // (tuỳ) các dòng ghi nhớ; mặc định là các tip của PARTS
  closing: "…",                      // (tuỳ) câu kết, nguyên văn
};
```

## Cách chia một video thành phần

- Đọc tiêu đề `## Line N — <tên> (Frame N)` của `SCRIPT.md`: mỗi khung là một bước trong danh sách, tên bước là `<tên>`.
- Một phần mỗi **ý lớn** (bài lý thuyết: chương 1, 3, 4, 5), mỗi **tình huống / câu** (sa hình), hay mỗi **hoạt động** (Toán). Hai đến sáu phần là vừa; nhiều hơn thì thẻ tràn hai dòng trên điện thoại.
- Khung mở đầu không thuộc phần nào thì tự vào thẻ "Mở đầu". Khung ghi nhớ cuối vào `SUMMARY`.
- `verdict` và `tip` chỉ đặt khi lời đọc có câu kết luận / câu Chốt rõ ràng; chép nguyên văn, kể cả dấu câu. Bài lý thuyết thường chỉ có `tip` (thẻ "Chốt").

## Câu hỏi

- Chỉ đặt `ask` khi lời đọc **hỏi người xem** ("Xe nào đi trước?", "Theo bạn…?") và sau đó **tự trả lời**. Câu hỏi tu từ được trả lời ngay trong cùng câu thì không đặt.
- Trang dừng ở cuối nhóm phụ đề chứa `after ?? question` trong khung `frame`, cộng 0,15 s. So sánh bỏ dấu câu và hoa thường, nhưng giữ dấu tiếng Việt: chép đúng chữ lời đọc.
- `explain` của phần phải là khung mà lời giải bắt đầu; đáp án hiện trong thẻ Lời giải chỉ sau đó.
- Phương án: lấy từ chính bài. Sa hình: các xe của tình huống (mặc định là các id trong `why`). Câu có phương án hiện trên khung video (đọc `scripts/build-frames.mjs` của dự án video): chép chữ phương án đó vào `options`.
- Trẻ em (Toán): không có phụ đề nên không có câu hỏi dừng; đừng đặt `ask`.

## Tự kiểm trước khi dựng

- Mỗi câu trong `verdict`, `tip`, `why`, `closing`, `question`, `options` tìm thấy được trong `SCRIPT.md` hoặc `build-frames.mjs` của video (grep một đoạn 20 ký tự).
- Mọi khung từ 1 tới khung cuối thuộc đúng một phần, `SUMMARY`, hoặc đứng trước phần đầu (vào "Mở đầu"). `build.mjs` báo lỗi khi số khung vượt quá.
