import { formatDuration } from '@utility/helpers';

// Numbers board, "Time left": the two largest units, "> 999d" past 999 days. A count-up starts at 1s, never Ready.
export const timeText = ({ days = 0, hours = 0, minutes = 0, seconds = 0 } = {}, countdown) => {
  const total = ((days * 24 + hours) * 60 + minutes) * 60 + seconds;
  return formatDuration(countdown ? total : Math.max(total, 1));
};
