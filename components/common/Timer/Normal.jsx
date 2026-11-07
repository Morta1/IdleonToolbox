import { useState } from 'react';
import useInterval from '@hooks/useInterval';
import { Typography } from '@mui/material';
import { formatDuration } from '@utility/helpers';
import { timeText } from './timeText';

const NormalTimer = ({ date, done }) => {
  const [time, setTime] = useState(date);
  const [seenDate, setSeenDate] = useState(date);
  if (seenDate !== date) {
    setSeenDate(date);
    setTime(date);
  }
  const updateTimer = () => {
    let { days, hours, minutes, seconds } = time;
    seconds -= 1;
    if (seconds === -1) {
      seconds = 59;
      minutes -= 1;
      if (minutes === -1) {
        minutes = 59;
        hours -= 1;
        if (hours === -1) {
          hours = 0;
          days -= 1;
        }
      }
    }
    setTime({ ...time, days, hours, minutes, seconds });
  };
  useInterval(() => {
    updateTimer()
  }, 1000);

  return (
    <div>
      {done ? <Typography variant={'body2'}>{formatDuration(0)}</Typography> :
        <Typography variant={'body2'}>{timeText(time, true)}</Typography>}
    </div>
  );
}

export default NormalTimer;
