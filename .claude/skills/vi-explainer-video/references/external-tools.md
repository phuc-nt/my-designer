# Công cụ ngoài, tuỳ chọn

Hai công cụ dưới đây không nằm trong skill. Không có chúng, quy trình vẫn chạy đủ; chỉ dùng khi việc cần tới.

## 1. `ui` (gói `ease-design`)

devDependency của my-designer (`npm install` ở gốc repo), chạy bằng `node_modules/.bin/ui`. Bản HyperFrames secure không có npm, nên không có `ui`: mọi chỗ dùng nó trong các skill đều bỏ qua được và ghi "chưa kiểm" vào báo cáo.

| Lệnh | Dùng ở đâu |
|---|---|
| `ui color contrast <chữ> <nền>`, `ui color scale <màu>` | chọn màu cho bảng màu tự đặt (`pitfalls.md` mục "Dấu hiệu máy làm") |
| `ui vr gate <thư mục ảnh gốc> <thư mục ảnh mới>` | `vr-check.sh` của các kit chương: chứng minh sửa kit không đổi hình của ví dụ |
| `ui vr diff a.png b.png --out d.png` | xem vùng nào đổi giữa hai ảnh, thay vì đọc kỹ cả hai |
| `ui gate <trang.html> --json` | phần kiểm tĩnh của `interactive-lesson-web` và `house-plans-3d` |

Giấy phép PolyForm Shield 1.0.0: dùng công cụ thì được, **không chép code hay văn bản của nó** vào repo này.

## 2. `trace-line-art-centerline.py` (repo `jangtrinh/design-os-svg-animation`)

Biến một hình vẽ nét (ảnh scan, ảnh chụp tranh tay) thành các nét SVG theo đường tâm của nét bút. Nét SVG thì cho `stroke-dashoffset` vẽ dần ra được, còn đường viền do các công cụ trace thường tạo ra thì không.

- Giấy phép PolyForm Shield 1.0.0. **Chạy từ bản clone ở ngoài repo, không chép script vào đây**, không đưa vào skill.
- Cần Python với `numpy`, `pillow`, `scikit-image`, `scipy`, `skan`. Cài vào một venv dùng một lần, ngoài repo, từ `scripts/requirements-line-art.txt` của bản clone:

```bash
git clone --depth 1 https://github.com/jangtrinh/design-os-svg-animation ~/src/design-os-svg-animation
python3 -m venv ~/.venvs/trace && ~/.venvs/trace/bin/pip install -r ~/src/design-os-svg-animation/scripts/requirements-line-art.txt
~/.venvs/trace/bin/python -I ~/src/design-os-svg-animation/scripts/trace-line-art-centerline.py --help
```

- Đọc `--help` và README của repo trước khi chạy: tham số có thể đổi theo phiên bản.
- Kết quả là một tệp SVG của dự án video (`assets/images/…`); tệp đó là của người dùng, không phải code của công cụ.
- Hợp với: hình minh hoạ vẽ tay cần "tự vẽ ra" trong khung. Không cần cho icon hay hình đã là vector.
