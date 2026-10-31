import { commaNotation } from '@utility/helpers';
import { CardWithBreakdown } from '@components/common/Breakdown/CardWithBreakdown';

// A hole resource's sprite (getHoleResourceIcon) as an ItemCard.Cost icon, or the empty sprite when there is none
export const holeCostIcon = (icon) => icon ? `data/${icon}.png` : 'afk_targets/Nothing.png';

export const ExpRateCard = ({ title, expRate }) => {
  return <CardWithBreakdown title={title} value={`${commaNotation(expRate?.value)} / hr`} breakdown={expRate?.breakdown}/>;
}
