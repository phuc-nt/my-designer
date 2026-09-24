# Font tiếng Việt

Skill kèm sẵn ba font trong `assets/fonts/`: subset latin + vietnamese, dạng woff2 variable, giấy phép OFL. Chúng được ghép với preset `code-editorial`:

| Tệp | Họ font | Trục weight |
|---|---|---|
| `EBGaramond-VN.woff2` | EB Garamond (serif tiêu đề) | 400–800 |
| `Inter-VN.woff2` | Inter (chữ thân) | 100–900 |
| `JetBrainsMono-VN.woff2` | JetBrains Mono (nhãn, tên tệp, lệnh) | 100–800 |

Phạm vi glyph:

- Basic Latin, Latin-1, Latin Extended-A/B.
- Latin Extended Additional: toàn bộ chữ có dấu tiếng Việt.
- Dấu kết hợp và General Punctuation.
- Ký hiệu ₫ €.
- Mũi tên (U+2190–21FF), toán tử (U+2200–22FF), hình học (U+25A0–25FF).
- ✓ ✗ ✱.

## Cài vào dự án video

**Bước 1. Chép font vào dự án.**

```bash
mkdir -p assets/fonts && cp "$SK"/assets/fonts/*.woff2 assets/fonts/
```

**Bước 2. Nối block sau vào cuối `frame.md`.** Làm việc này **sau** khi chạy `build-frame.mjs`, vì lệnh đó ghi lại toàn bộ frame.md. Nếu frame.md đã có block này thì không thêm lần nữa.

````markdown
## Font faces (Vietnamese — project override)

This video is narrated and captioned in **Vietnamese**. The preset's bundled faces are Latin-only
subsets, so the project ships latin + vietnamese variable WOFF2 files in `assets/fonts/`.
Every composition MUST declare exactly this block and reference families by these names.
Paths are **root-relative** (`assets/fonts/…`) in every file, including frames under
`compositions/frames/` — compositions are served with the project root as base URL, so
`../../assets/…` fails lint (`invalid_parent_traversal_in_asset_path`) and 404s in Studio.

```css
@font-face { font-family: "EB Garamond"; src: url("assets/fonts/EBGaramond-VN.woff2") format("woff2"); font-weight: 400 800; font-style: normal; font-display: block; }
@font-face { font-family: "Inter"; src: url("assets/fonts/Inter-VN.woff2") format("woff2"); font-weight: 100 900; font-style: normal; font-display: block; }
@font-face { font-family: "JetBrains Mono"; src: url("assets/fonts/JetBrainsMono-VN.woff2") format("woff2"); font-weight: 100 800; font-style: normal; font-display: block; }
```

Vietnamese stacks diacritics above and below the line: keep display `line-height` ≥ 1.1 and never
clip text containers vertically (`overflow: hidden` on a one-line box shaves tone marks).
EB Garamond has no italic file; italic is the browser's synthesized slant.
````

`captions.mjs` tự lấy `@font-face` trong frame.md cho phụ đề, nên phụ đề không cần làm thêm gì.

## Preset dùng họ font khác

Tạo subset cho font của preset đó theo cùng công thức:

1. **Tải font.** Lấy bản variable TTF từ `https://github.com/google/fonts/raw/main/ofl/<ho-font>/<Ten>[wght].ttf`. Chỉ lấy font có giấy phép OFL.
2. **Tạo subset.** Python hệ thống không có fontTools, nên dùng `uv`:

```bash
uv run --with fonttools --with brotli pyftsubset "<Ten>[wght].ttf" \
  --unicodes="U+0000-00FF,U+0100-024F,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1E00-1EFF,U+2000-206F,U+20AB,U+20AC,U+2122,U+2190-21FF,U+2200-22FF,U+25A0-25FF,U+2713,U+2717,U+2731,U+FEFF,U+FFFD" \
  --layout-features='*' --flavor=woff2 --output-file=assets/fonts/<Ten>-VN.woff2
```

3. **Khai báo font.** Thêm dòng `@font-face` tương ứng vào block ở trên, và vào mẫu `worker-prompt.md`.
   - Đường dẫn luôn tính từ gốc dự án: `url("assets/fonts/<Ten>-VN.woff2")`.
   - Tên tệp kết thúc bằng `-VN.woff2`, vì bước kiểm khung trong SKILL.md tìm đúng mẫu tên này.
   - Muốn dùng lâu dài thì chép tệp woff2 vào `assets/fonts/` của skill.
4. **Kiểm tra.** Chạy `fc-scan --format "%{charset}\n" <tệp>`, hoặc chụp một khung có các chữ "ỗ ệ ữ Ặ ỹ" rồi xem ảnh.
