import { commaNotation } from '@utility/helpers';
import { CardWithBreakdown } from '@components/common/Breakdown/CardWithBreakdown';

export const ExpRateCard = ({ title, expRate }) => {
  return <CardWithBreakdown title={title} value={`${commaNotation(expRate?.value)} / hr`} breakdown={expRate?.breakdown}/>;
}
