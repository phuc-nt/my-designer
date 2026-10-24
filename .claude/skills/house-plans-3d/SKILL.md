---
name: house-plans-3d
description: "Dựng mô hình 3D và bộ bản vẽ mặt bằng 2D của một ngôi nhà từ tài liệu gốc (ảnh, PDF bản vẽ): viết hình học từng tầng bằng mã, sinh bản vẽ CAD 1:100 (DXF, PDF, SVG) có số đo đúng tài liệu gốc, kho số liệu (JSON, CSV, SQLite), web xem 3D dùng được trên điện thoại, và các trang trong studio. Làm được cả phương án chia lại mặt bằng. Dùng khi người dùng nói 'dựng mô hình nhà 3D', 'vẽ mặt bằng nhà', 'vẽ lại mặt bằng theo chuẩn CAD', 'chia lại mặt bằng tầng', 'làm web xem nhà 3D', 'số hóa bản vẽ nhà', hoặc đưa ảnh bản vẽ một ngôi nhà và muốn xem từng tầng."
---

# Mô hình 3D và bản vẽ mặt bằng nhà

Skill này đóng gói cách đã làm dự án nhà đầu tiên trong repo: mô hình 3D mọi tầng, hai phương án chia lại một tầng, bộ bản vẽ CAD, kho số liệu, web xem 3D trên Cloudflare và các trang studio. Một ngôi nhà mới dùng lại toàn bộ công cụ, chỉ viết bốn file riêng của nó.

Ý chính: **ngôi nhà được viết một lần bằng mã, mọi sản phẩm dựng lại từ đó.** Vì vậy mô hình 3D, bản vẽ, bảng số liệu và web không bao giờ lệch nhau. Số ghi trên tài liệu gốc được chép riêng ra một file, và việc dựng dừng lại khi mô hình lệch khỏi các số đó.

Đọc `AGENTS.md` ở gốc repo trước. Phần studio dùng thêm `.claude/skills/my-designer-3d/SKILL.md`.

## Trong skill có gì

```
house-plans-3d/
  SKILL.md
  references/     tài liệu (bảng ở cuối tệp này)
  scripts/        new-project.sh
  kit/            phần dùng chung, chép nguyên vào mỗi dự án
    tools/lib/                 floor.mjs (tường, cửa, thang, nội thất), mesh.mjs, materials.mjs
    tools/build-plans.mjs      xuất hình học, chạy bước vẽ CAD
    tools/cad/                 bước vẽ bằng Python: project, geometry, plan, sheet, drawing,
                               dxf_out, svg_out, store, draft
    tools/build-web.mjs        dữ liệu cho web
    tools/check-web.mjs        kiểm tra web trong trình duyệt ở bốn cỡ màn hình
    tools/build-studio.mjs     các trang studio
    web/                       trình xem: index.html, styles.css, app.js, plan.js, _headers
    textures/                  7 ảnh vân: gỗ, gạch, gạch WC, gạch ngoài trời, đá lát, ngói, cỏ
    store/README.md            hướng dẫn kho số liệu cho chủ nhà
  examples/sample-house/       điểm xuất phát: nhà mẫu hai tầng, số liệu tự đặt
    project.json, store/source-dimensions.json, tools/house.mjs, web/content.js, CLAUDE.md
```

Skill không chứa số liệu của một ngôi nhà thật nào. Nhà mẫu là nhà tự đặt ra để chạy đủ mọi tính năng.

## Tái sử dụng được gì

| Mức | Thứ |
|---|---|
| **Dùng nguyên** | Toàn bộ `kit/`: thư viện dựng tầng, bước vẽ CAD, kho số liệu, trình xem web, lệnh kiểm tra trình duyệt, lệnh dựng studio, ảnh vân. `scripts/new-project.sh`. |
| **Sửa từ ví dụ** | Bốn file riêng của mỗi nhà: `store/source-dimensions.json` (số trên tài liệu gốc), `project.json` (tên, tầng, tờ bản vẽ), `tools/house.mjs` (hình học), `web/content.js` (góc nhìn và lời văn). Thêm `CLAUDE.md` của dự án. |
| **Tạo mới** | Món nội thất chưa có, kiểu mái khác hai dốc, ảnh vân mới: viết thêm trong `house.mjs` hoặc `tools/lib/`. Bố cục tờ khác, tỷ lệ khác 1:100, mặt đứng, mặt cắt: phải sửa `tools/cad/`, chưa có sẵn. |

Đã chạy thật: nhà phố ba tầng có sân thượng và mái (6 tờ A3, hai phương án chia lại), và nhà mẫu hai tầng mái ngói (4 tờ, A3 và A2).

## Yêu cầu cố định

Đây là các điểm người dùng đã yêu cầu hoặc đã sửa khi làm ngôi nhà đầu tiên. Coi là yêu cầu, không phải phần trang trí:

1. **Số đo đúng tài liệu gốc.** Số nào in trên tài liệu thì chép nguyên, vẽ màu đen. Số nào ước lượng thì phải nhận ra được: màu xanh, trong ngoặc, có `≈` trước diện tích. Không trộn hai loại.
2. **Xem được từng tầng và cả ngôi nhà.**
3. **Nhãn bám theo mô hình.** Xoay, phóng, dời mô hình thì nhãn phòng đi theo.
4. **Một nút bật tắt toàn bộ chú thích**, để xem mô hình không có nhãn.
5. **Web dùng được trên điện thoại**, cả khi cầm dọc lẫn xoay ngang.
6. **Bố trí nội thất phải nghĩ tới công năng.** Cửa mở ra không đụng giường hay tủ. Có lối đi. Mỗi phòng ngủ có chỗ cho giường, tủ, bàn. Yêu cầu riêng của chủ nhà (an toàn cho trẻ nhỏ, chỗ học…) viết thành danh sách và giữ ở mọi phương án.
7. **Tên file, mã, chú thích trong mã viết bằng tiếng Anh.** Chỉ chữ hiện ra cho người xem viết bằng tiếng Việt.
8. **Kho số liệu phải tra cứu được bởi người không rành kỹ thuật**: có bảng mở bằng Excel và một file hướng dẫn tiếng Việt.

## Nguyên tắc nội dung

- **Nói rõ cái gì là giả định.** Khi không có mặt cắt thì chiều cao cửa, độ dốc mái, số bậc thang đều là giả định. Ghi vào `CLAUDE.md` của dự án, vào ghi chú trên tờ và vào phần "Phần giả định" trên web.
- **Không sửa số của tài liệu gốc cho khớp mô hình.** Khi hai bên lệch nhau thì mô hình sai, hoặc tài liệu gốc tự mâu thuẫn. Trường hợp sau: ghi vào `unexplained` của `source-dimensions.json` và báo người dùng.
- **Nhìn rồi mới khẳng định.** Sau mỗi lần dựng, mở PNG của tờ bản vẽ và ảnh chụp màn hình web. Lệnh báo đạt chưa có nghĩa là hình đúng.
- **Bản vẽ là bản dựng lại để tham khảo.** Không dùng để xin phép hay thi công. Dòng này in trên mọi tờ, đừng bỏ.
- **Nhà của người dùng là dữ liệu riêng.** Không chép số liệu, địa chỉ, tên chủ nhà vào skill hay vào ví dụ. Thư mục `projects/` nằm trong `.gitignore`, không `git add -f` gì ở đó. Hỏi trước khi đưa lên một địa chỉ công khai.
- Chữ tiếng Việt viết câu ngắn, giọng tự nhiên, không dùng dấu gạch ngang dài.

## Đường dẫn

Mỗi lệnh Bash là một shell mới, nên đặt lại biến ở đầu mỗi lệnh hoặc dùng đường dẫn đầy đủ. Mọi lệnh chạy từ gốc repo.

```bash
SK=.claude/skills/house-plans-3d
NAME=<tên thư mục dự án, tiếng Anh, chữ thường, gạch nối>
P=projects/$NAME
```

## Quy trình

### 0. Trước khi bắt đầu

```bash
node --version && uv --version              # uv cần cho bản vẽ CAD
npm ls three playwright                     # thiếu thì chạy npm install ở gốc repo
node bootstrap.mjs --status                 # máy chủ studio, chỉ cần cho bước 6
```

- Hỏi người dùng nếu chưa rõ: tài liệu gốc nằm ở đâu, cần những tầng nào, có cần phương án chia lại không, có đưa lên mạng không.
- Không có `uv` thì vẫn làm được mô hình 3D và web 3D. Không có bản vẽ, kho số liệu và chế độ "Bản vẽ" trên web. Nói rõ điều đó.

### 1. Tạo dự án

```bash
bash $SK/scripts/new-project.sh $NAME
node $P/tools/build-plans.mjs && node $P/tools/build-web.mjs && node $P/tools/check-web.mjs
```

- Lệnh đầu chép `kit/` và nhà mẫu vào `projects/$NAME`. Lệnh thứ hai dựng nhà mẫu để biết máy đã đủ công cụ trước khi sửa gì.
- Chép tài liệu gốc của người dùng vào `$P/original-drawings/`, đặt tên file tiếng Anh có số thứ tự.

### 2. Chép số từ tài liệu gốc

Sửa `$P/store/source-dimensions.json`. Chi tiết: `references/project-files.md` §1.

- Đọc từng ảnh. Tìm tờ có chuỗi kích thước tổng thể và lấy nó làm chuẩn.
- Chép hai chuỗi: `across` (ngang nhà) và `along` (từ sau ra trước). Chép cao độ từng sàn, tên phòng từng tầng.
- Chọn gốc tọa độ tại giao của hai trục có ghi tên.
- Liệt kê vào `not_on_documents` những gì tài liệu không ghi. Danh sách này là phần "cần đo lại" khi báo cáo.
- **Chỉ chép, không đo trên ảnh.** Số đo trên ảnh thuộc về mô hình và sẽ là số xanh.

### 3. Khai `project.json`

Chi tiết: `references/project-files.md` §2.

- Điền `title`, `title_block`, `issued`, `source_line`.
- Khai `floors` theo thứ tự tầng, `covers` cho mái, và mỗi mặt bằng một tờ trong `sheets`.
- Lúc đầu chỉ khai tầng đang làm. Thêm dần từng tầng, vì tầng nào đã khai thì phải có trong mô hình.

### 4. Viết mô hình, từng tầng một

Sửa `$P/tools/house.mjs`. Chi tiết: `references/model.md`.

```bash
node $P/tools/build-plans.mjs        # sau mỗi tầng
```

- Bắt đầu bằng `LEVELS` và tầng khu đất. Sau đó mỗi tầng một hàm: sàn, tường ngoài, tường trong, cửa, thang, thiết bị vệ sinh, nội thất, phòng, nhãn.
- Tọa độ trục lấy từ chuỗi kích thước. Vị trí tường trong và cửa ước lượng theo tỷ lệ ảnh: đo số điểm ảnh giữa hai trục đã biết khoảng cách, suy ra tỷ lệ, rồi quy đổi các vị trí khác.
- Sau mỗi tầng, mở `cad/<số tờ>.png` và đặt cạnh ảnh gốc. So từng phòng: hình dạng, cửa ở tường nào, mở về phía nào, thang đi lên theo hướng nào.
- Chép diện tích từ `store/tables/rooms.csv` vào các `label(...)`, giữ dấu `≈`.
- Lỗi khi dựng và cách sửa: `references/model.md` §8 và `references/plans.md` §8.

### 5. Web 3D

Sửa `$P/web/content.js`. Chi tiết: `references/viewer-studio.md` §1 tới §4.

```bash
node $P/tools/build-web.mjs && node $P/tools/check-web.mjs
```

- Một góc nhìn toàn nhà, mỗi tầng một góc nhìn, mỗi phương án một góc nhìn, thêm mái nếu có.
- Viết lại mọi câu chữ cho ngôi nhà này. Đừng để sót câu nào của nhà mẫu.
- Mở ảnh trong `$P/tmp/check-web/`. Xem ít nhất một ảnh dọc, một ảnh ngang và một ảnh chế độ "Bản vẽ" cho mỗi tầng. Chỉnh `camera`, `cameraPortrait`, `cameraWide` tới khi nhà nằm gọn trong khung.

### 6. Trang studio

Chi tiết: `references/viewer-studio.md` §5.

```bash
node $P/tools/build-studio.mjs
bin/dsa projects inspect <id> --mode page --page 1 --max-dimension 1600 --output $P/tmp/studio-page.png
```

- Bỏ qua bước này nếu người dùng chỉ cần web và bản vẽ.
- Mỗi lần chạy thay toàn bộ các trang của dự án studio. Chụp từng trang và xem trước khi báo.

### 7. Phương án chia lại

Chỉ làm khi người dùng yêu cầu. Chi tiết: `references/model.md` §6.

- Viết yêu cầu của chủ nhà thành danh sách đánh số trong `CLAUDE.md` của dự án trước khi vẽ.
- Thêm tham số phương án cho hàm tầng, mã tầng mới (`f2a`, `f2b`), `variant_of` trong `project.json`, một tờ và một góc nhìn mới.
- Kiểm từng phòng trên bản vẽ nội thất: cửa mở hết góc không chạm đồ, lối đi từ cửa tới giường và tủ rộng ít nhất 0,6 m, phòng nào cũng có cửa sổ hoặc nói rõ là không có.
- Thêm bảng so sánh với bản gốc vào `notes` của góc nhìn, và nêu việc xây sửa mà phương án đòi hỏi.

### 8. Đưa lên mạng

Chỉ làm khi người dùng yêu cầu. Chi tiết: `references/viewer-studio.md` §6. Địa chỉ `*.pages.dev` là công khai, nên nói điều đó trước khi đưa nhà thật lên.

### 9. Bàn giao

- Sửa `$P/CLAUDE.md`: thay mọi điều nói về nhà mẫu bằng sự thật của ngôi nhà này, rồi xóa ghi chú ở đầu file. File này là thứ agent sau đọc đầu tiên.
- Báo cáo bằng tiếng Việt: đã dựng những gì, xem ở đâu, số nào là số của tài liệu gốc, số nào là ước lượng cần đo lại, điều gì là giả định, điều gì chưa làm hoặc chưa kiểm chứng.

### Sau khi xong

- Nếu đã sửa lỗi hay thêm tính năng trong `tools/lib/`, `tools/cad/`, `tools/build-*.mjs`, `tools/check-web.mjs` hoặc `web/` (trừ `content.js`) của dự án, chép phần sửa về `kit/` của skill. Sau đó dựng lại nhà mẫu trên một dự án nháp để chắc nó vẫn chạy, rồi xóa dự án nháp.
- Không chép `__pycache__`, `cad/`, `web/data/`, `web/cad/`, `web/vendor/`, `web/textures/`, `studio.json` hay bất cứ thứ gì của ngôi nhà thật về skill.
- Món nội thất hay kiểu mái mới đáng dùng lại thì đưa vào `kit/tools/lib/floor.mjs` và ghi một dòng vào `references/model.md`.

## Giới hạn

Nói rõ khi có liên quan, đừng để người dùng tự phát hiện:

- Chỉ có mặt bằng. Không có mặt đứng, mặt cắt, bản vẽ kết cấu, điện nước.
- Tỷ lệ 1:100, khổ ngang A3, A2 hoặc A1, hai mặt bằng cạnh nhau. Trên A3, lô đất rộng khoảng 7,5 m là vừa.
- Chuỗi mép cửa chỉ ghi cho tường thẳng theo trục. Tường xiên vẽ được nhưng không được ghi kích thước.
- Mọi kích thước bên trong nhà là số ước lượng, trừ khi tài liệu gốc in ra và đã được chép vào chuỗi.
- File DXF chưa được mở bằng phần mềm CAD trên máy tính. Quy ước vẽ theo TCVN lấy từ tài liệu thứ cấp.
- Trang studio là hình tĩnh, nhãn không bám theo máy quay, và mỗi lần dựng thay toàn bộ các trang.
- `check-web.mjs` kiểm tra hành vi, và phần tĩnh chỉ bắt tương phản, nhãn và tràn khung (`references/viewer-studio.md`); bố cục có đẹp không vẫn phải nhìn ảnh.
- Chữ trên bản vẽ giả định có tài liệu gốc. Nhà thiết kế mới hoàn toàn cần sửa lời trong `project.json` và `content.js`.

## Tham khảo

| Tệp | Đọc khi |
|---|---|
| `references/model.md` | Viết hoặc sửa `house.mjs`: hệ tọa độ, hàm của `Floor`, mã bộ phận mà bản vẽ dựa vào, mái, phương án, lỗi hay gặp |
| `references/project-files.md` | Chép số vào `source-dimensions.json`, khai tầng, mặt bằng mái, tờ bản vẽ và ghi chú trong `project.json` |
| `references/plans.md` | Cần biết một tờ gồm gì, số đen và số xanh, lớp DXF, khổ giấy, lỗi khi dựng, kho số liệu, điều chưa kiểm chứng |
| `references/viewer-studio.md` | Viết `content.js`, đổi trình xem, chạy kiểm tra trình duyệt, dựng trang studio, đưa lên Cloudflare |
| `kit/store/README.md` | Cần giải thích kho số liệu cho chủ nhà |
| `examples/sample-house/CLAUDE.md` | Viết file bàn giao của một dự án mới |
