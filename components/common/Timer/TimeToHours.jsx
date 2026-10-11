import Timer from 'components/common/Timer';
import { getTimeAsDays, notateNumber } from 'utility/helpers';

// Largest timestamp a JS Date can hold
const MAX_DATE_MS = 8.64e15;

// Hours until a target, as a countdown when it fits in a Date, otherwise as a notated day count
const TimeToHours = ({ hours }) => {
  if (!Number.isFinite(hours)) return 'Never';
  const date = new Date().getTime() + hours * 3600 * 1000;
  return date < MAX_DATE_MS
    ? <Timer date={date} staticTime={true}/>
    : `${notateNumber(getTimeAsDays(hours), 'Big')} days`;
};

export default TimeToHours;
