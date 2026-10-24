# Bản vẽ CAD và kho số liệu

`tools/build-plans.mjs` xuất hình học từ `house.mjs`, rồi chạy bước vẽ bằng Python (`tools/cad/draft.py`, qua `uv`). Bước vẽ đọc `project.json` và `store/source-dimensions.json`, xem [project-files.md](project-files.md).

```bash
node projects/<name>/tools/build-plans.mjs
```

Cần `uv` trên máy. Lần chạy đầu `uv` tự tải `ezdxf`, `shapely`, `pymupdf`, `pillow`. Không cần máy chủ studio.

## 1. Sản phẩm

| Nơi ghi | Nội dung |
|---|---|
| `cad/<số tờ>.dxf`, `.pdf`, `.png` | Từng tờ bản vẽ. PNG 150 dpi để xem nhanh. |
| `cad/<slug>-plans.pdf` | Cả bộ trong một file. |
| `web/cad/` | Bản sao DXF, PDF, mỗi mặt bằng một file SVG cho web, và các bảng CSV để tải về. |
| `store/building.json` | Mọi thông số của ngôi nhà, mỗi số kèm nhãn nguồn gốc. |
| `store/tables/*.csv` | Tầng, phòng, cửa, loại cửa, trục, cao độ. UTF-8 có BOM, mở thẳng bằng Excel. |
| `store/house.sqlite` | Cùng số liệu để hỏi bằng SQL. |
| `web/data/building.json` | Bản sao cho web. |

Dòng in ra khi xong:

```
cad/KT-01: 10 documented and 21 estimated dimensions, audit clean
store/building.json: 16 rooms, 30 openings, 15 opening types
```

Các file trong `cad/`, `web/cad/`, `store/tables/` và `store/house.sqlite` là sản phẩm sinh ra. Không sửa tay.

## 2. Một tờ gồm những gì

**Tờ mặt bằng cắt** (mục `floor` trong `sheets`):

- Bên trái: "MẶT BẰNG KÍCH THƯỚC". Tường, cửa, thang, thiết bị vệ sinh, trục, chuỗi kích thước, tên phòng, cao độ, ký hiệu cửa.
- Bên phải: "MẶT BẰNG BỐ TRÍ NỘI THẤT". Cùng mặt bằng, thêm nội thất, cây, xe, không có chuỗi kích thước.
- Dưới hình: "KÝ HIỆU" và "GHI CHÚ".
- Cột phải: "BẢNG THỐNG KÊ PHÒNG", "BẢNG THỐNG KÊ CỬA", khung tên. Tờ đầu có thêm "DANH MỤC BẢN VẼ". Tờ phương án có thêm "GHI CHÚ PHƯƠNG ÁN".

**Tờ nhìn từ trên** (mục `covers`): các mặt bằng mái, sân thượng xếp cạnh nhau, chú giải, ghi chú, "BẢNG CAO ĐỘ". Tờ này chỉ ghi chuỗi kích thước ngang nhà.

Mọi tờ vẽ ở tỷ lệ 1:100 và mang dòng "BẢN DỰNG LẠI ĐỂ THAM KHẢO, KHÔNG DÙNG ĐỂ THI CÔNG".

## 3. Số đen và số xanh

Đây là điều quan trọng nhất của bộ bản vẽ. **Không được làm mờ ranh giới giữa hai loại số.**

| Loại | Trên bản vẽ | Lấy từ đâu | Lớp |
|---|---|---|---|
| Ghi trên tài liệu gốc (`documented`) | Màu đen | `source-dimensions.json`, không bao giờ lấy từ mô hình | `A-ANNO-DIMS` |
| Ước lượng (`estimated`) | Màu xanh, trong ngoặc, làm tròn 10 mm | Đo trên mô hình | `A-ANNO-DIMS-ESTM` |
| Suy ra (`derived`) | Chỉ có trong kho số liệu | Cộng trừ các số ghi trên tài liệu gốc | |

- Số ước lượng gồm: chuỗi mép cửa trên bốn mặt ngoài, thông thủy của phòng ở, diện tích, kích thước cửa.
- Diện tích luôn có dấu `≈` phía trước.
- Chuỗi mép cửa chỉ đo các mặt tường thẳng theo trục. Tường xiên không được ghi kích thước.
- Một số có trên tài liệu gốc nhưng chưa chép vào `source-dimensions.json` thì vẫn bị coi là ước lượng. Muốn nó thành số đen thì thêm trạm vào chuỗi.

## 4. Ký hiệu cửa

| Loại ô cửa | Ký hiệu | Tên trong bảng |
|---|---|---|
| `door` | D1, D2… | Cửa đi cánh mở |
| `glassDoor` | DK1… | Cửa kính lùa (từ 1500 mm) hoặc Cửa kính mở |
| `window` | S1… | Cửa sổ |
| `opening` | O1… | Ô trống không cánh |

Hai ô cửa cùng loại, cùng rộng, cùng cao, cùng bệ thì mang cùng ký hiệu trên mọi tờ. Cửa sổ có bệ cao hơn mặt cắt vẽ nét đứt.

## 5. Lớp của file DXF

Tên lớp theo cách đặt của US National CAD Standard. Bảng gốc là `LAYERS` trong `tools/cad/drawing.py`.

| Lớp | Nội dung |
|---|---|
| `S-GRID`, `S-GRID-IDEN` | Trục định vị, ký hiệu trục |
| `L-SITE-BNDY` | Ranh lô đất |
| `L-SITE`, `L-SITE-VEHC`, `L-PLNT` | Sân, bậc thềm, hàng rào; chỗ đỗ xe; cây |
| `A-FLOR-OTLN` | Mép sàn, mép ô trống |
| `A-WALL`, `A-WALL-PATT` | Tường bị cắt và phần tô |
| `A-WALL-NEW` | Vách nhẹ xây mới, màu cam |
| `A-WALL-DEMO` | Tường tháo dỡ, nét đứt đỏ |
| `A-WALL-SILL` | Bệ cửa sổ, gờ, lan can xây dưới mặt cắt |
| `A-DOOR`, `A-DOOR-IDEN` | Cửa đi và ký hiệu |
| `A-GLAZ`, `A-GLAZ-IDEN` | Cửa sổ, cửa kính, vách kính và ký hiệu |
| `A-FLOR-STRS`, `A-FLOR-HRAL` | Cầu thang, lan can |
| `A-FLOR-FIXT`, `A-FURN` | Thiết bị vệ sinh, nội thất |
| `A-ROOF` | Mái |
| `A-AREA` (không in), `A-AREA-IDEN` | Ranh phòng để đo diện tích; tên phòng |
| `A-ANNO-DIMS`, `A-ANNO-DIMS-ESTM` | Kích thước theo tài liệu gốc; kích thước ước lượng |
| `A-ANNO-SYMB`, `A-ANNO-TEXT`, `A-ANNO-SCHD`, `A-ANNO-TTLB` | Cao độ và mũi tên thang; chữ; bảng; khung |
| `A-ANNO-NPLT` (không in) | Khung nhìn |

Kiểu nét riêng: `PLAN-AXIS`, `PLAN-HIDDEN`, `PLAN-PHANTOM`. File SVG cho web giữ mỗi lớp trong một nhóm có `data-layer`, và mỗi phòng là một vùng bấm được có `data-room`.

## 6. Khổ giấy và giới hạn

- Hai mặt bằng nằm cạnh nhau ở 1:100, nên bề ngang lô đất bị giới hạn. Trên A3, lô rộng khoảng 7,5 m là vừa. Nhà mẫu rộng 7,1 m, sâu 15 m, vừa cả A3 lẫn A2.
- Lô rộng hơn thì đặt `"paper": "A2"` hoặc `"A1"` trong `project.json`.
- Tỷ lệ không đổi được. Nhà rất lớn cần sửa `tools/cad/sheet.py`.

## 7. Công cụ tự kiểm tra gì

Trước khi vẽ (`check_model`):

- Mọi cao độ của tài liệu gốc bằng đúng `LEVELS` của mô hình.
- Bộ phận `yard` nằm trên ranh đất ghi trong tài liệu, sai số dưới 1 mm.
- `overall_mm` bằng tổng các đoạn.

Sau khi vẽ mỗi tờ (`check_sheet`):

- Đọc lại file DXF vừa ghi và chạy kiểm tra của `ezdxf`.
- Mọi kích thước trên lớp `A-ANNO-DIMS` phải đo ra đúng các đoạn đã chép từ tài liệu gốc.

Công cụ **không** kiểm tra được: phòng có đúng hình dạng trên bản vẽ gốc không, cửa có đúng chỗ không, chữ có đè lên nét nào không. Sau mỗi lần dựng, mở PNG của từng tờ đã đổi và so với ảnh trong `original-drawings/`.

## 8. Lỗi khi dựng

| Thông báo | Nguyên nhân và cách sửa |
|---|---|
| `Could not start uv (…)` | Chưa cài `uv`. Cài theo https://docs.astral.sh/uv/ rồi chạy lại. |
| `The project files need correcting:` | Hai file khai báo sai hoặc mâu thuẫn. Sửa theo từng dòng liệt kê. |
| `The model disagrees with store/source-dimensions.json: …` | Mô hình lệch số của tài liệu gốc. Sửa `house.mjs`. |
| `<tầng>: the point of room '…' is inside a wall or outside the slab` | Dời điểm của `room()`. |
| `<tầng>: rooms '…' and '…' are one open space; add a separator between them` | Thêm `separator()`. |
| `Sheet <n>: … is N mm wide at 1:100, M mm more than its place on A3. Choose a larger "paper"…` | Đổi `paper` sang khổ lớn hơn. |
| `The legend of sheet … does not fit below the plan` | Lô đất quá sâu so với khổ giấy. Đổi khổ lớn hơn. |
| `The schedules of sheet … run into the title block` | Quá nhiều phòng hoặc loại cửa cho cột bảng. Đổi khổ lớn hơn. |
| `The notes of sheet … do not fit their block` | Rút ngắn câu trong `notes`. |
| `Text does not fit N mm on sheet …` | Một dòng chữ quá dài, thường là `title_block`, `source_line` hoặc tên tờ. Rút ngắn. |
| `project.json: cover "…" names part … of floor "…"; that floor has …` | Sai mã bộ phận trong `covers`. Chọn trong danh sách được in ra. |
| `project.json: notes.<khối> asks for {x}; …` | Chỗ giữ chỗ không có ở khối đó. |
| `project.json: paper "…" is not one of A3, A2, A1` | Khổ giấy không được hỗ trợ. |

## 9. Kho số liệu

`store/README.md` giải thích kho cho chủ nhà bằng tiếng Việt, kèm ba câu hỏi SQL mẫu. Điều agent cần nhớ:

- `store/source-dimensions.json` là file nhập duy nhất của thư mục. Các file khác sinh ra.
- `building.json` có các khóa `about`, `unit`, `units`, `coordinates`, `provenance`, `grid`, `levels`, `plot`, `floors`, `opening_types`, `stairs`, `sheets`.
- Trong SQLite chỉ bảng `levels` và `grid` có cột `provenance`. Nhãn của từng phòng, từng cửa nằm trong `building.json`.
- Chiều cao tầng là số `derived` khi có cao độ phía trên. Không có thì lấy chiều cao tường của mô hình và ghi `estimated`.
- Số trên nhãn 3D và trong các bảng so sánh của `web/content.js` là chữ viết tay. Sau khi đổi mặt bằng, chép lại từ `store/tables/rooms.csv`.

## 10. Điều chưa kiểm chứng

Nói rõ với người dùng khi có liên quan:

- File DXF qua được kiểm tra của `ezdxf` và được đọc lại khi dựng, nhưng **chưa mở bằng một phần mềm CAD trên máy tính** (AutoCAD, BricsCAD…).
- Quy ước vẽ (nét, bong bóng trục, dấu gạch 45°, cỡ chữ, khung tên, theo TCVN 5570, 5671, 4614, 4455, 4608, 5571) lấy từ tài liệu thứ cấp, **chưa đối chiếu với văn bản tiêu chuẩn chính thức**.
- Bộ bản vẽ là bản dựng lại để tham khảo. Không dùng để xin phép hay thi công.
