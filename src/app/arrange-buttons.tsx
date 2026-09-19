import { AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignHorizontalSpaceBetween, AlignStartHorizontal, AlignStartVertical, AlignVerticalSpaceBetween } from 'lucide-react';
import type { Alignment, Axis } from '../shared/alignment';

// Lucide names describe the guide line: a vertical guide at the start is "align left".
const alignButtons: { alignment: Alignment; label: string; Icon: typeof AlignStartVertical }[] = [
  { alignment: 'left', label: 'Align left', Icon: AlignStartVertical },
  { alignment: 'center', label: 'Align horizontal centres', Icon: AlignCenterVertical },
  { alignment: 'right', label: 'Align right', Icon: AlignEndVertical },
  { alignment: 'top', label: 'Align top', Icon: AlignStartHorizontal },
  { alignment: 'middle', label: 'Align vertical centres', Icon: AlignCenterHorizontal },
  { alignment: 'bottom', label: 'Align bottom', Icon: AlignEndHorizontal },
];
const distributeButtons: { axis: Axis; label: string; Icon: typeof AlignStartVertical }[] = [
  { axis: 'horizontal', label: 'Distribute horizontally', Icon: AlignHorizontalSpaceBetween },
  { axis: 'vertical', label: 'Distribute vertically', Icon: AlignVerticalSpaceBetween },
];

type Props = { count: number; disabled?: boolean; size?: number; align: (alignment: Alignment) => void; distribute: (axis: Axis) => void };
/** One layer aligns to the page; two or more align to their shared bounds; three or more can also be distributed. */
export function ArrangeButtons({ count, disabled, size = 16, align, distribute }: Props) {
  const target = count > 1 ? 'selection' : 'page';
  return <>
    {alignButtons.map(({ alignment, label, Icon }) => <button key={alignment} type="button" className="icon-button" aria-label={`${label} to ${target}`} title={`${label} · ${target}`} disabled={disabled} onClick={() => align(alignment)}><Icon size={size}/></button>)}
    {count > 2 && distributeButtons.map(({ axis, label, Icon }) => <button key={axis} type="button" className="icon-button" aria-label={label} title={label} disabled={disabled} onClick={() => distribute(axis)}><Icon size={size}/></button>)}
  </>;
}
