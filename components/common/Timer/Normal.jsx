import { useEffect, useState } from 'react';
import useInterval from '../../hooks/useInterval';

const NormalTimer = ({ date, done }) => {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    setTime(date);
  }, [date])
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
      {done ? <span>00:00:00</span> :
        <span>{String(time.hours).padStart(2, '0')}:{String(time.minutes).padStart(2, '0')}:{String(time.seconds).padStart(2, '0')}</span>}
    </div>
  );
}

export default NormalTimer;
