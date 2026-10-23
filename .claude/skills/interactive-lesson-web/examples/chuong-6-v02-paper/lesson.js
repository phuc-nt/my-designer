// Interactive page for "Đường ưu tiên ở ngã tư có biển" (sa hình, video chuong-6-v02-paper).
// Every sentence is copied from the video's SCRIPT.md, so the page teaches nothing the lesson does not.
export const META = {
  video: "../../videos/chuong-6-v02-paper",
  title: "Ngã tư có biển",
  kicker: "Sa hình · Bài giảng tương tác",
  heading: "Đường ưu tiên ở ngã tư có biển",
  description: "Bài giảng sa hình tương tác: bốn tình huống ở ngã tư có biển báo đường ưu tiên.",
  world: { centre: true, callouts: false },
  view: [0, 0, 1920, 1080],
  hint: "Chạm vào một xe trên hình để xem vì sao nó đi trước hay phải nhường.",
};

export const NAME = { truck: "Xe tải", moto: "Xe mô tô", bus: "Xe khách", car: "Xe con" };

export const PARTS = [
  {
    label: "Tình huống 1",
    site: 1,
    frames: [1, 2, 3, 4],
    explain: 3,
    ask: { question: "Các xe đi qua theo thứ tự nào?", kind: "order", answer: ["truck", "moto", "bus", "car"] },
    verdict: "Xe tải đi trước, rồi tới xe mô tô, sau đó là xe khách, cuối cùng là xe con.",
    tip: "Đường ưu tiên trước, đường không ưu tiên sau; trong mỗi cặp, đi thẳng trước, rẽ trái sau.",
    why: {
      truck: ["Xe tải đi trước: nó ở trên đường ưu tiên và đi thẳng."],
      moto: ["Xe mô tô đi thứ hai.", "Nó cũng ở trên đường ưu tiên, nhưng rẽ trái, nên phải nhường xe tải đi thẳng từ phía ngược chiều."],
      bus: ["Xe khách đi thứ ba.", "Nó ở đường không ưu tiên nên chờ hai xe kia, và nó đi thẳng nên đi trước xe con."],
      car: ["Xe con đi sau cùng: nó ở đường không ưu tiên và rẽ trái, phải nhường xe khách đi thẳng từ phía ngược chiều."],
    },
  },
  {
    label: "Tình huống 2",
    site: 2,
    frames: [5, 6, 7, 8],
    explain: 7,
    ask: { question: "Xe nào phải đi sau cùng?", kind: "one", answer: "bus" },
    verdict: "Xe khách đi sau cùng.",
    tip: "Đường ưu tiên trước; còn lại, rẽ trái đi sau.",
    why: {
      car: ["Xe con đi trước: nó ở trên đường ưu tiên, nên hai xe kia đều phải nhường nó."],
      truck: ["Xe tải rẽ phải.", "Xe tải đi thứ hai."],
      bus: ["Xe khách rẽ trái, cắt ngang đường của xe tải, nên xe khách phải nhường.", "Xe khách đi sau cùng."],
    },
  },
  {
    label: "Tình huống 3",
    site: 3,
    frames: [9, 10, 11, 12],
    explain: 11,
    ask: { question: "Xe nào đi trước?", kind: "one", answer: "car" },
    verdict: "Xe con đi trước.",
    tip: "Thấy biển tám cạnh màu đỏ, dừng hẳn, nhường hết, rồi mới đi.",
    why: {
      moto: ["Xe mô tô tới vạch dừng thì gặp biển Dừng lại.", "Nó phải dừng hẳn và nhường các xe khác đang qua nút giao."],
      car: ["Xe con không gặp biển nào buộc dừng, và đường rẽ trái của nó cắt ngang trước mặt xe mô tô.", "Xe con đi trước."],
    },
  },
  {
    label: "Tình huống 4",
    site: 4,
    frames: [13, 14, 15, 16],
    explain: 15,
    ask: { question: "Xe nào phải nhường đường?", kind: "one", answer: "car" },
    verdict: "Xe con phải nhường đường.",
    tip: "Cùng ở đường không ưu tiên thì quay về quy tắc nhường bên phải.",
    why: {
      car: ["Bên phải của xe con là xe tải đang đi tới, nên xe con phải nhường."],
      truck: ["Bên phải của xe tải đang trống, nên xe tải đi trước."],
    },
  },
];

export const SUMMARY = {
  label: "Tổng kết",
  frames: [17],
  closing: "Ở ngã tư có biển, xe trên đường ưu tiên đi trước; các xe ở đường không ưu tiên đi sau, nhường xe bên phải, và rẽ trái đi sau cùng.",
};
