# Kho số liệu của ngôi nhà

Thư mục này giữ mọi thông số của ngôi nhà ở dạng tra cứu và tính toán được: trục, cao độ, tầng, phòng, cửa, cầu thang, danh mục bản vẽ.

## Số liệu đi từ đâu đến đâu

1. **Tài liệu gốc.** Ảnh hoặc file bản vẽ trong `original-drawings/`. Các số in trên đó được chép tay vào `source-dimensions.json`.
2. **Mô hình.** `tools/house.mjs` mô tả ngôi nhà bằng tọa độ. Muốn đổi nhà thì sửa ở đây.
3. **Sản phẩm sinh ra.** Bản vẽ CAD (`cad/`), web 3D (`web/`) và kho số liệu này. Tất cả dựng lại bằng lệnh, nên không bao giờ lệch nhau.

Khi dựng, chương trình so mô hình với `source-dimensions.json`. Nếu mô hình lệch khỏi số ghi trên bản vẽ gốc thì việc dựng dừng lại và báo lỗi.

## Các file

| File | Nội dung | Sửa tay? |
|---|---|---|
| `source-dimensions.json` | Số chép từ bản vẽ gốc: hai chuỗi kích thước, cao độ, tên phòng, những gì bản vẽ gốc không ghi. | Có. Đây là file nhập duy nhất của thư mục này. |
| `building.json` | Toàn bộ thông số trong một file, mỗi số kèm nhãn nguồn gốc. | Không, file sinh ra. |
| `tables/*.csv` | Cùng số liệu ở dạng bảng: tầng, phòng, cửa, loại cửa, trục, cao độ. Mở bằng Excel, Numbers hay Google Sheets. | Không. |
| `house.sqlite` | Cùng số liệu ở dạng cơ sở dữ liệu SQLite, để hỏi bằng SQL. | Không. |

## Nhãn nguồn gốc

Mỗi số trong `building.json` có trường `provenance`:

- `documented`: in trên bản vẽ gốc, ví dụ khoảng cách giữa hai trục hay cốt sàn.
- `derived`: cộng trừ từ các số in trên bản vẽ gốc, ví dụ bề rộng lô đất bằng tổng các đoạn.
- `estimated`: ước lượng theo tỷ lệ hình vẽ, hoặc giả định trong mô hình. **Phải đo thực tế trước khi dùng.**

Kích thước phòng, diện tích và kích thước cửa luôn tính từ mô hình nên luôn là `estimated`. Trên bản vẽ CAD, số ước lượng có màu xanh và nằm trong ngoặc. Số màu đen là số chép đúng bản vẽ gốc.

## Đơn vị và hệ tọa độ

- Chiều dài tính bằng mm, diện tích bằng m², cao độ bằng m.
- Gốc tọa độ và hướng của hai trục `x`, `z` ghi ở trường `coordinates` của `building.json`. `z` luôn chạy từ phía sau nhà ra phía trước.
- Mã tầng nằm ở cột `Mã` của `tables/floors.csv`. Phương án chia lại của một tầng có mã riêng.

## Tra cứu

Mở bảng tính: `tables/rooms.csv` và `tables/openings.csv` là hai bảng dùng nhiều nhất.

Hỏi bằng SQL (máy Mac có sẵn lệnh `sqlite3`). Thay `f1` bằng mã tầng cần xem:

```sh
# Các phòng của một tầng, lớn trước
sqlite3 -header -column house.sqlite "select name, area_m2, clear_width_mm, clear_depth_mm from rooms where floor='f1' order by area_m2 desc;"

# Tổng diện tích phòng ở của từng tầng
sqlite3 -header -column house.sqlite "select floor, round(sum(area_m2), 2) as m2 from rooms where kind='room' group by floor;"

# Cửa đi của một tầng, kèm hai phòng mà cửa nối
sqlite3 -header -column house.sqlite "select o.mark, t.name, o.width_mm, o.height_mm, o.room_a, o.room_b from openings o join opening_types t using (mark) where o.floor='f1' and o.type='door';"
```

Các bảng trong `house.sqlite`: `levels`, `grid`, `source_segments`, `floors`, `rooms`, `opening_types`, `openings`, `stairs`, `sheets`. Trong SQLite chỉ bảng `levels` và `grid` có cột `provenance`. Muốn xem nhãn của từng phòng hay từng cửa thì đọc `building.json`.

## Dựng lại

Chạy từ thư mục gốc của repo, cần cài `uv`. Thay `<name>` bằng tên thư mục của dự án:

```sh
node project/<name>/tools/build-plans.mjs
```

Lệnh này ghi lại `cad/`, thư mục này (trừ `source-dimensions.json` và file này), `web/cad/` và `web/data/building.json`.

## Khi nào cần hơn thế này

Với một ngôi nhà, file có quản lý phiên bản là đủ, không cần máy chủ cơ sở dữ liệu. Nên nghĩ tới cơ sở dữ liệu trực tuyến khi có nhiều công trình, hoặc khi cần sửa số liệu ngay trên web. Nên nghĩ tới định dạng IFC khi phải trao đổi mô hình với kiến trúc sư hay nhà thầu dùng phần mềm BIM.
