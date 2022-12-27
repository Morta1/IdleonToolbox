import { useEffect, useState } from "react";
import useInterval from "components/hooks/useInterval";
import { isPast } from "date-fns";
import { getDuration } from "utility/helpers";
import styled from "@emotion/styled";
import { Typography } from "@mui/material";

const Timer = ({ date, startDate, lastUpdated, type, pause, staticTime, placeholder, loop }) => {
  const [time, setTime] = useState();
  // const [localType, setLocalType] = useState(type);

  useEffect(() => {
    if (date) {
      if (staticTime) {
        let duration = getDuration(new Date().getTime(), date);
        return setTime({ ...duration });
      }
      const tempTime = new Date();
      const timePassed = (tempTime.getTime() - (lastUpdated ?? 0));
      const dateIsInPast = isPast(date)
      let duration = getDuration(tempTime?.getTime(), date + (timePassed * (type === 'countdown' ? -1 : 1)));
      setTime({ ...duration, overtime: type === 'countdown' ? dateIsInPast : false });
      // if (dateIsInPast) {
      //   setLocalType('countdown');
      // }
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
    if ((days === 0 && hours === 0 && minutes === 0 && seconds === 0) && loop) {
      let duration = getDuration(new Date().getTime(), startDate);
      return setTime({ ...duration });
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
    if (!time) return null;
    if (type === 'countdown' && !time?.overtime) {
      tickDown();
    } else {
      tickUp();
    }
  }, !pause && !staticTime ? 1000 : null);

  const wrapNumber = (number) => {
    const strNumber = String(number);
    return strNumber?.length === 1 ? `0${number}` : number;
  }

  return time ? <TimerStyle>
    {(time?.overtime || pause) && placeholder ? placeholder :
      <Typography className={`${time?.overtime && !loop ? 'overtime' : ''}`} component={'span'}>
        {time?.days ? wrapNumber(time?.days) + 'd:' : ''}
        {wrapNumber(time?.hours) + 'h:'}
        {wrapNumber(time?.minutes) + `m`}
        {!time?.days ? ':' : ''}
        {!time?.days ? wrapNumber(time?.seconds) + 's' : ''}
      </Typography>}

  </TimerStyle> : null;
}

const TimerStyle = styled.span`
  .overtime {
    color: #f91d1d;
  }
`


export default Timer;