# Hai file khai báo: `store/source-dimensions.json` và `project.json`

Ngoài `house.mjs` và `web/content.js`, một dự án có hai file viết tay nữa. File thứ nhất chép số từ bản vẽ gốc. File thứ hai nói bộ bản vẽ gồm những tờ nào. Mẫu để sửa: `examples/sample-house/`.

Khi hai file mâu thuẫn nhau hoặc mâu thuẫn với mô hình, `build-plans.mjs` dừng và in ra danh sách dưới dòng `The project files need correcting:`. Mỗi dòng nói rõ file nào, trường nào.

## 1. `store/source-dimensions.json`: số ghi trên bản vẽ gốc

Quy tắc duy nhất: **chỉ chép những gì in trên tài liệu gốc.** Không đo trên ảnh, không ước lượng, không làm tròn. Số nào không có trên tài liệu thì ghi vào `not_on_documents`.

Các trường mà công cụ đọc:

| Trường | Ý nghĩa |
|---|---|
| `unit` | Tên ngắn của căn nhà, chép vào kho số liệu. |
| `origin.x`, `origin.z` | Tên trạm làm gốc tọa độ của mô hình. Phải là một trạm của chuỗi tương ứng. |
| `chains[]` có `id: "across"` | Chuỗi kích thước ngang nhà, đọc theo chiều `x` tăng. |
| `chains[]` có `id: "along"` | Chuỗi kích thước dọc nhà, **đọc từ phía sau ra phía trước**. |
| `chains[].stations` | Tên các trạm, theo thứ tự. Nhiều hơn số đoạn đúng một. |
| `chains[].segments_mm` | Các đoạn in trên bản vẽ, theo mm. |
| `chains[].overall_mm` | Tổng in trên bản vẽ, hoặc `null` nếu bản vẽ không ghi tổng. Phải bằng tổng các đoạn. |
| `levels[]` | Cao độ, **xếp từ thấp lên cao**: `id`, `label` (đúng chữ in trên bản vẽ, ví dụ `FFL:+3.600`), `value_m`. |

Tên trạm quyết định cách vẽ:

| Tên trạm | Là gì | Trên bản vẽ |
|---|---|---|
| `axis-<nhãn>` | Trục định vị, ví dụ `axis-1`, `axis-C` | Đường trục và bong bóng mang nhãn. |
| `boundary-left`, `boundary-right`, `boundary-rear`, `boundary-front` | Ranh đất ở hai đầu chuỗi | Đường ranh đất. |
| tên khác | Một đường có ghi kích thước nhưng không phải trục | Chỉ là một mốc của chuỗi. |

- Hai đầu của cả hai chuỗi đều tên `boundary-*` thì dự án có ranh đất. Khi đó bộ phận `yard` của tầng khu đất phải nằm đúng trên ranh.
- Không trạm nào được trùng tên.
- Các trường còn lại (`about`, `documents`, `sources`, `note`, `boundary`, `room_names`, `unexplained`, `references_on_documents`, `not_on_documents`, `where`) là hồ sơ cho người đọc. Hãy điền đủ: chúng trả lời câu hỏi "số này lấy ở tờ nào".

Ví dụ một chuỗi:

```json
{
  "id": "across", "direction": "x", "sources": ["00"],
  "stations": ["boundary-left", "axis-1", "axis-2", "axis-3", "boundary-right"],
  "segments_mm": [1000, 3000, 3000, 100],
  "overall_mm": 7100
}
```

Với `origin.x = "axis-1"` thì trong mô hình: ranh trái ở `x = −1,0`, trục 2 ở `3,0`, trục 3 ở `6,0`, ranh phải ở `6,1`.

## 2. `project.json`: tên gọi, tầng, tờ bản vẽ

### Trường chung

| Trường | Bắt buộc | Ý nghĩa |
|---|---|---|
| `slug` | có | Tên file của bộ PDF: `cad/<slug>-plans.pdf`. `new-project.sh` đặt bằng tên thư mục. |
| `title` | có | Tên hiển thị của web và của dự án studio. |
| `description` | không | Câu mô tả của trang web và của dự án studio. Mặc định là `title`. |
| `title_block` | có | Dòng "CÔNG TRÌNH" trong khung tên. |
| `issued` | có | Ngày ghi trong khung tên, dạng `dd/mm/yyyy`. |
| `source_line` | có | Dòng "NGUỒN" trong khung tên: bản vẽ dựng lại từ tài liệu nào. |
| `paper` | không | `A3` (mặc định), `A2` hoặc `A1`, khổ ngang. |
| `status` | không | Thay câu mặc định "BẢN DỰNG LẠI ĐỂ THAM KHẢO, KHÔNG DÙNG ĐỂ THI CÔNG". |
| `level_places` | không | Tên tiếng Việt của từng cao độ trong bảng cao độ, theo id. |
| `plot` | không | `width_note`, `area_note`: ghi chú tiếng Anh về bề rộng và diện tích lô đất trong `building.json`. |

### `floors`: các mặt bằng cắt

Liệt kê theo thứ tự tầng, từ dưới lên. Phải có ít nhất một tầng.

| Trường | Ý nghĩa |
|---|---|
| `code` | Mã tầng trong `house.mjs`. |
| `level` | Id cao độ của tầng. Bỏ được khi mã tầng trùng id cao độ. |
| `above` | Id cao độ ngay phía trên, dùng để tính chiều cao tầng. Mặc định là cao độ của tầng kế tiếp. Tầng trên cùng phải ghi, ví dụ `"above": "roof"`. Không có thì chiều cao tầng là số ước lượng. |
| `below` | Mã tầng có cầu thang nhìn thấy qua ô thang. Mặc định là tầng ngay dưới. |
| `variant_of` | Mã tầng gốc, khi đây là một phương án chia lại. |
| `site` | Khu đất vẽ quanh tầng này, thường chỉ tầng 1 có. |

`site` gồm `floor` (mã tầng khu đất trong mô hình), `level` (id cao độ của sân) và `names`, là danh sách `{ "text": "SÂN TRƯỚC", "x": 4.3, "z": 11.6 }` đặt tên sân tại tọa độ mô hình.

### `covers`: các mặt bằng nhìn từ trên

Dùng cho mái, sân thượng, mái bằng. Mỗi mục lấy bộ phận của một tầng trong mô hình và nói cách vẽ từng nhóm.

| Trường | Ý nghĩa |
|---|---|
| `code` | Mã của mặt bằng này. Cũng là tên file `web/cad/<code>.svg`. |
| `floor` | Mã tầng trong mô hình chứa các bộ phận. |
| `title` | Tên ghi dưới hình. |
| `planes` | Mã các bộ phận là mặt mái dốc. Bản vẽ tìm mép, bờ nóc, bờ chảy và vẽ mũi tên dốc. |
| `thin` | Mã các bộ phận nhỏ nằm trên mái. |
| `edges` | Mã các bộ phận phẳng, vẽ theo mép. |
| `walls` | Mã các bộ phận là tường, tô đặc. `wall_label` đổi tên trong chú giải. |
| `fixtures` | Mã các bộ phận chỉ vẽ đường bao. |
| `under` | `[{ "floor": "f3", "parts": ["slab"] }]`: bộ phận của tầng khác lộ ra quanh mái. |
| `names` | `[{ "text": "SÂN THƯỢNG", "x": 2, "z": 3 }]`. |
| `level` | `{ "id": "roof", "x": 3, "z": 4 }`: ký hiệu cao độ đặt tại điểm đó. |

Một mục phải có ít nhất một trong `planes`, `edges`, `walls`, `fixtures`. Ghi sai mã bộ phận thì lỗi in ra danh sách mã mà tầng đó có.

### `sheets`: các tờ bản vẽ

```json
{ "number": "KT-01", "floor": "f1", "title": "MẶT BẰNG TẦNG 1" },
{ "number": "KT-03", "covers": ["roof"], "title": "MẶT BẰNG MÁI" }
```

- Mỗi tờ có `number`, `title` và một trong hai: `floor` (một mặt bằng cắt) hoặc `covers` (một hay nhiều mặt bằng nhìn từ trên, xếp cạnh nhau).
- **Mỗi tầng trong `floors` và mỗi mục trong `covers` phải nằm trên đúng một tờ.**
- `number` là tên file: `cad/KT-01.dxf`, `.pdf`, `.png`.
- Danh mục bản vẽ in trên tờ mặt bằng cắt đầu tiên.

### `notes`: ghi chú trên tờ

| Khóa | Dùng cho | Mặc định |
|---|---|---|
| `floor` | Tờ mặt bằng cắt | `{units}`, `{documented}`, `{estimated}`, `{cut}`, `{illustration}` |
| `cover` | Tờ nhìn từ trên | `{units}`, `{documented}`, `{slope}` |
| `variant` | Khối "GHI CHÚ PHƯƠNG ÁN" | Câu về màu cam và nét đứt đỏ |
| `levels_foot` | Dòng dưới bảng cao độ | "Cột cuối là hiệu hai cao độ…" |

Mỗi khóa là một danh sách câu (riêng `levels_foot` là một câu). Câu viết thẳng bằng tiếng Việt. Riêng hai khối `floor` và `cover` nhận thêm chỗ giữ chỗ để công cụ tự viết câu:

| Chỗ giữ chỗ | Câu sinh ra |
|---|---|
| `{units}` | Kích thước ghi bằng mm, cao độ ghi bằng m. |
| `{documented}` | Số màu đen là số trên bản vẽ gốc, kèm chính các số của hai chuỗi. |
| `{estimated}` | Số xanh trong ngoặc là số ước lượng, cần đo lại. |
| `{cut}` | Mặt cắt ở cao 1,25 m. |
| `{illustration}` | Nội thất (và cây, xe nếu có khu đất) vẽ để minh họa. |
| `{slope}` | Mũi tên chỉ hướng nước chảy trên mái. |

- `{cut}` và `{illustration}` chỉ có ở khối `floor`. `{slope}` chỉ có nghĩa ở khối `cover`. Dùng một chỗ giữ chỗ mà khối đó không có thì lỗi in ra danh sách hợp lệ.
- Điều gì là giả định riêng của căn nhà thì viết thành một câu thường, ví dụ "Độ dốc mái 30° là giả định vì chưa có bản vẽ mặt cắt."
- Ghi chú dài quá khung thì việc dựng dừng với lỗi `The notes of sheet … do not fit their block`. Rút ngắn câu.

## 3. Những gì không khai được

- Tỷ lệ luôn là 1:100.
- Khổ giấy chỉ có A3, A2, A1 và luôn nằm ngang.
- Cách bố trí tờ là cố định: hai mặt bằng cạnh nhau, chú giải, ghi chú, bảng thống kê, khung tên. Muốn khác thì sửa `tools/cad/draft.py` và `sheet.py`.
- Chữ trên bản vẽ viết bằng tiếng Việt và giả định có tài liệu gốc ("bản vẽ gốc"). Nhà vẽ mới hoàn toàn thì sửa các câu trong `notes` và `source_line` cho đúng.
