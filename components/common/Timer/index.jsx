import { forwardRef, useEffect, useState } from 'react';
import useInterval from '@hooks/useInterval';
import { getDuration } from 'utility/helpers';
import { Typography } from '@mui/material';
import StatusText from '@components/common/StatusText';
import { timeText } from './timeText';

// Past the last date a Date can hold there is nothing to count to: it reads "> 999d".
const MAX_DATE = 8.64e15;
const TOO_FAR = { days: 1000, hours: 0, minutes: 0, seconds: 0 };

// date: when it ends, on the page's clock. lastUpdated: pass it only for a date read off the clock at the parse with an
// amount left at the save (date = now + time left), so the save's age comes off it once. A date already anchored on the
// save, or a date of its own, takes no lastUpdated: the age would come off twice.
// A countdown past its end stops counting and reads placeholder, the row's own word, or Ready: never a count-up.
// prefix leads only the running time ("Next in 3d"), so a placeholder reads on its own.
const Timer = forwardRef(({
                            date,
                            lastUpdated,
                            type,
                            pause,
                            staticTime,
                            placeholder,
                            prefix,
                            variant = 'inherit',
                            ...rest
                          }, ref) => {
  const [time, setTime] = useState();

  useEffect(() => {
    if (date) {
      if (staticTime) {
        if (!isFinite(date)) return;
        let duration = getDuration(new Date().getTime(), date);
        return setTime({ ...duration });
      }
      const clock = new Date().getTime();
      const timePassed = lastUpdated ? clock - lastUpdated : 0;
      const target = date + (timePassed * (type === 'countdown' ? -1 : 1));
      if (type === 'countdown' && target <= clock) return setTime({ overtime: true });
      setTime(target > MAX_DATE ? TOO_FAR : { ...getDuration(clock, target) });
    }
  }, [date, lastUpdated]);

  const tickUp = () => {
    let { days, hours, minutes, seconds } = time;
    seconds += 1;
    if (seconds === 60) {
      seconds = 0;
      minutes += 1;
      if (minutes === 60) {
        minutes = 0;
        hours += 1;
        if (hours === 24) {
          days += 1;
        }
      }
    }
    setTime({ ...time, days, hours, minutes, seconds });
  }
  const tickDown = () => {
    let { days, hours, minutes, seconds } = time;
    if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
      return setTime({ overtime: true });
    }
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
  }

  useInterval(() => {
    if (!time || time.overtime) return null;
    if (type === 'countdown') {
      tickDown();
    } else {
      tickUp();
    }
  }, !pause && !staticTime ? 1000 : null);

  if (!time) return null;
  return <Typography {...rest} ref={ref} variant={variant} component={'span'}>
    {time.overtime ? placeholder ?? <StatusText status={'ready'}/>
      : pause && placeholder ? placeholder
        : <>{prefix}{timeText(time, type === 'countdown')}</>}
  </Typography>;
})


export default Timer;
