import { commaNotation } from '@utility/helpers';
import { CardWithBreakdown } from '@components/common/Breakdown/CardWithBreakdown';
import { IconValueRow } from '@components/common/UpgradeCard';

export const ExpRateCard = ({ title, expRate }) => {
  return <CardWithBreakdown title={title} value={`${commaNotation(expRate?.value)} / hr`} breakdown={expRate?.breakdown}/>;
}

// Cost row for a hole resource icon from getHoleResourceIcon. Well sediment sprites are a tall 62x128 fill
// bar with the sediment in the middle, so they're cropped instead of shrunk.
export const HoleCostRow = ({ icon, children }) => {
  return <IconValueRow src={icon ? `data/${icon}.png` : 'afk_targets/Nothing.png'} alt={icon}
                       fit={icon?.startsWith('HoleWellFill') ? 'cover' : 'contain'}>
    {children}
  </IconValueRow>
}
