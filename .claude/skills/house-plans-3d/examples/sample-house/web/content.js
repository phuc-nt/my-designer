// Views of the house and the Vietnamese copy shown beside the model.
// Floor codes match data/house.json. Angles are degrees: az 0 looks from the street, positive turns toward axis 3.
//
// A view takes: floors (what is drawn), focus (what the camera frames, default: all of it), hide (part codes
// per floor), labels (floor whose room labels are shown), tags (floors that get a level tag), stack (storey
// order for the pull-apart slider), cut (true/false: walls cut at 1.25 m by default; null: no cut button),
// plan (code of the 2D drawing cad/<code>.svg the view can switch to), studio (false: no page in the studio;
// { title, sub, note }: other words on the studio page, where the buttons of the web viewer do not exist).

const STOREYS = ['f1', 'f2', 'roof'];
// cameraPortrait is used on upright screens, cameraWide on low wide ones (the long side of the house runs across).
const FLOOR_CAMERA = { camera: { az: 24, el: 52 }, cameraPortrait: { az: 14, el: 60 }, cameraWide: { az: 68, el: 56 } };
const CUT_NOTE = 'Tường đang cắt ở cao 1,25 m để nhìn rõ mặt bằng. Bấm "Cắt tường" để xem tường cao đủ.';

// The tag beside each storey of the whole-house view: its name and its level (or any short fact).
export const LEVEL_TAGS = {
  f1: ['Tầng 1', '±0,000'],
  f2: ['Tầng 2', '+3,600'],
  roof: ['Mái ngói', 'dốc 30°'],
};

export const VIEWS = [
  {
    key: 'all', chip: 'Toàn nhà', kicker: 'NHÀ MẪU · HAI TẦNG',
    title: 'Toàn cảnh ngôi nhà',
    sub: 'Hai tầng, mái ngói hai mái. Kéo thanh "Bóc tầng" để tách từng tầng ra xem bên trong.',
    floors: ['site', ...STOREYS], focus: STOREYS, tags: STOREYS, cut: false,
    stack: { site: 0, f1: 0, f2: 1, roof: 2 },
    studio: { sub: 'Hai tầng, mái ngói hai mái. Cốt sàn: ±0,000 · +3,600. Mặt trên sàn mái: +6,900.' },
    camera: { az: 38, el: 16 }, cameraPortrait: { az: 34, el: 20 },
    notes: [
      { heading: 'Cốt sàn', table: { head: ['Tầng', 'Cốt sàn', 'Cao tầng'], rows: [['Sân', '−0,300', ''], ['Tầng 1', '±0,000', '3,6 m'], ['Tầng 2', '+3,600', '3,3 m'], ['Sàn mái', '+6,900', '']] } },
      { heading: 'Cách xem', items: ['Chọn từng tầng ở hàng nút phía trên để xem mặt bằng có tên phòng.', 'Ở mỗi tầng, bấm "Bản vẽ" để xem mặt bằng có số đo và tra diện tích từng phòng.', 'Tầng 2 có thêm một phương án chia lại phòng ngủ phía trước.', 'Nút "Chú thích" bật hoặc tắt toàn bộ nhãn trên mô hình.'] },
      { heading: 'Bản vẽ và số liệu', links: [
        { label: 'Cả bộ bản vẽ mặt bằng', kind: 'PDF', href: '{plans}' },
        { label: 'Bảng phòng của các tầng', kind: 'CSV', href: 'cad/rooms.csv', download: true },
        { label: 'Bảng cửa của các tầng', kind: 'CSV', href: 'cad/openings.csv', download: true },
        { label: 'Toàn bộ thông số ngôi nhà', kind: 'JSON', href: 'data/building.json', download: true },
      ] },
      { heading: 'Phần giả định', text: 'Đây là nhà mẫu của bộ công cụ, số liệu không phải của một ngôi nhà thật. Độ dốc mái, chiều cao cửa và nội thất là giả định.' },
    ],
  },
  {
    key: 'f1', chip: 'Tầng 1', kicker: 'TẦNG 1 · ±0,000',
    title: 'Tầng 1',
    sub: 'Bếp và bàn ăn phía sau, phòng khách phía trước, kho dưới gầm thang. Nền nhà cao hơn sân 0,3 m.',
    floors: ['site', 'f1'], labels: 'f1', plan: 'f1', cut: true, hide: { site: ['base', 'road', 'pavement', 'trees-outside'] }, ...FLOOR_CAMERA,
    notes: [{ heading: 'Ghi chú', items: ['Sân trước đỗ được một ô tô, sân hông trồng cỏ.', CUT_NOTE] }],
  },
  {
    key: 'f2', chip: 'Tầng 2 gốc', kicker: 'TẦNG 2 · +3,600',
    title: 'Tầng 2, bản gốc',
    sub: 'Phòng ngủ 2 và vệ sinh phía sau. Phòng ngủ 1 phía trước, mở ra ban công.',
    floors: ['f2'], labels: 'f2', plan: 'f2', cut: true, ...FLOOR_CAMERA,
    notes: [{ heading: 'Ghi chú', items: ['Đây là mặt bằng theo bản vẽ gốc, dùng để so với phương án chia lại.', CUT_NOTE] }],
  },
  {
    key: 'f2a', chip: 'Tầng 2 · PA A', variant: true, kicker: 'TẦNG 2 · PHƯƠNG ÁN A',
    title: 'Phương án A: chia đôi phòng ngủ trước',
    sub: 'Một vách nhẹ trên trục 2 chia phòng ngủ 1 thành hai phòng. Hành lang mở thêm một cửa.',
    floors: ['f2a'], labels: 'f2a', plan: 'f2a', cut: true, ...FLOOR_CAMERA,
    notes: [
      { heading: 'Thay đổi so với bản gốc', items: ['Xây một vách nhẹ dài khoảng 4,4 m trên trục 2.', 'Mở thêm một ô cửa 0,8 m trên vách hành lang cho phòng ngủ 1.', 'Mặt tiền giữ nguyên: phòng ngủ 1 có cửa ra ban công, phòng ngủ 3 có cửa sổ.'] },
      { heading: 'So sánh', table: { head: ['', 'Bản gốc', 'Phương án A'], rows: [['Số phòng ngủ', '2', { text: '3', best: true }], ['Phòng ngủ phía trước', { text: '≈ 23 m²', best: true }, '≈ 12 m² và ≈ 10 m²']] } },
      { heading: 'Ghi chú', items: [CUT_NOTE] },
    ],
  },
  {
    key: 'roof', chip: 'Mái', kicker: 'MÁI · +6,900',
    title: 'Mái ngói',
    sub: 'Hai mặt mái dốc về phía trước và phía sau, bờ nóc chạy ngang nhà trên trục B. Mái đua ra khỏi tường trước và tường sau 0,5 m.',
    floors: ['f2', 'roof'], plan: 'roof', cut: null, camera: { az: 34, el: 40 }, cameraPortrait: { az: 28, el: 46 },
    notes: [{ heading: 'Phần giả định', text: 'Chưa có bản vẽ mặt cắt nên độ dốc mái 30° là giả định.' }],
  },
];

// Wording of the viewer that does not depend on a view. Change it only when the house needs other words.
export const HINTS = {
  model: 'Kéo để xoay · chụm hoặc cuộn để phóng to · hai ngón để dời',
  plan: { touch: 'Kéo để dời · chụm để phóng to · chạm phòng để xem số liệu', mouse: 'Kéo để dời · cuộn để phóng to · bấm vào phòng để xem số liệu' },
};

// Wording of the drawing mode. The figures themselves come from data/building.json.
export const PLAN = {
  kicker: sheet => `TỜ ${sheet.number} · TỶ LỆ ${sheet.scale} · ${sheet.paper}`,
  sub: 'Bản vẽ mặt bằng dựng lại từ mô hình, có số đo. Chạm vào một phòng để xem diện tích và kích thước.',
  subNoRooms: 'Bản vẽ mặt bằng dựng lại từ mô hình. Tờ này chỉ ghi các số đo có trên bản vẽ gốc.',
  more: 'Xem số liệu',
  failed: 'Không tải được bản vẽ. Hãy tải lại trang.',
  headings: { reading: 'Cách đọc số đo', floor: 'Thông số tầng', rooms: 'Bảng phòng', openings: 'Bảng cửa', downloads: 'Tải về' },
  reading: [
    'Số màu đen là số ghi trên bản vẽ gốc: khoảng cách giữa các trục, từ trục tới ranh đất, và cốt sàn.',
    'Số màu xanh trong ngoặc là số ước lượng theo tỷ lệ hình vẽ, làm tròn tới 10 mm. Cần đo lại tại nhà trước khi dùng.',
    'Bản vẽ gốc không ghi kích thước phòng, bề dày tường và kích thước cửa. Vì vậy diện tích trong các bảng dưới đây cũng là số ước lượng.',
    'Kích thước phòng là kích thước thông thủy, tức đo lọt lòng giữa hai mặt tường. Rộng đo theo chiều ngang nhà, sâu đo theo chiều dọc nhà.',
  ],
  readingVariant: 'Vách tô màu cam là vách nhẹ xây mới. Nét đứt màu đỏ là đoạn tường cần tháo dỡ.',
  readingNoRooms: [
    'Các số trên tờ này đều là số ghi trên bản vẽ gốc: khoảng cách giữa các trục và từ trục tới ranh đất.',
    'Hình dạng mái vẽ theo mô hình. Bản vẽ gốc không có mặt cắt nên độ dốc mái là giả định.',
  ],
  floorHead: ['', 'Giá trị', 'Nguồn'],
  floorRows: { level: 'Cốt sàn', storey: 'Chiều cao tầng', slab: 'Diện tích mặt sàn', indoor: 'Tổng diện tích các phòng', outdoor: 'Tổng diện tích ban công, sân thượng' },
  sources: { documented: 'Bản vẽ gốc', derived: 'Hiệu hai cốt sàn', estimated: 'Ước lượng' },
  slabNote: 'Diện tích mặt sàn tính cả tường và ban công, đã trừ ô thang.',
  roomHead: ['Phòng', 'Diện tích', 'Rộng × sâu (mm)'],
  pickNote: 'Bấm vào một dòng để tô phòng đó trên bản vẽ.',
  oddNote: 'Dấu * là phòng không phải hình chữ nhật: rộng và sâu đo qua giữa phòng.',
  openingHead: ['Ký hiệu', 'Loại cửa', 'Rộng × cao', 'Bệ', 'Số lượng'],
  openingNote: 'Kích thước tính bằng mm và là số ước lượng. Bệ là chiều cao từ mặt sàn tới mép dưới ô cửa.',
  downloads: {
    sheetPdf: (number, paper) => `Tờ ${number}, khổ ${paper}`, sheetDxf: number => `Tờ ${number} cho phần mềm CAD`, set: paper => `Cả bộ bản vẽ khổ ${paper}`,
    rooms: 'Bảng phòng, mở bằng Excel', openings: 'Bảng cửa, mở bằng Excel', building: 'Toàn bộ thông số ngôi nhà',
  },
  card: { area: 'Diện tích', size: 'Rộng × sâu', perimeter: 'Chu vi', finish: 'Sàn', openings: 'Cửa', odd: 'Phòng không phải hình chữ nhật: rộng và sâu đo qua giữa phòng.', note: 'Số ước lượng theo tỷ lệ bản vẽ gốc, cần đo lại tại nhà.' },
};
