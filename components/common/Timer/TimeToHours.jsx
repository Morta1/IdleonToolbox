import { formatDuration } from 'utility/helpers';

// Hours until a target, as Time left (Numbers board): the two largest units, "> 999d" past 999 days
const TimeToHours = ({ hours }) => {
  if (!Number.isFinite(hours)) return 'Never';
  return formatDuration(hours * 3600);
};

export default TimeToHours;
