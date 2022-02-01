import { useEffect, useState } from "react";
import useInterval from "./useInterval";
import styled from 'styled-components';
import { getDuration } from "../../../parser/parserUtils";
import { isPast } from "date-fns";

const Timer = ({ date, lastUpdated, type, pause, placeholder }) => {
  const [time, setTime] = useState();
  const [localType, setLocalType] = useState(type);

  useEffect(() => {
    if (date) {
      const tempTime = new Date();
      const timePassed = (tempTime.getTime() - (lastUpdated ?? 0));
      const dateIsInPast = isPast(date)
      let duration = getDuration(tempTime?.getTime(), date + (timePassed * (type === 'countdown' ? -1 : 1)));
      setTime({ ...duration, overtime: type === 'countdown' ? dateIsInPast : false });
      if (dateIsInPast) {
        setLocalType('cooldown');
      }
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
    if (localType === 'countdown') {
      tickDown();
    } else {
      tickUp();
    }
  }, !pause ? 1000 : null);

  const wrapNumber = (number) => {
    const strNumber = String(number);
    return strNumber?.length === 1 ? `0${number}` : number;
  }

  return time ? <TimerStyle
    className={`${time?.overtime ? 'overtime' : ''}`}>
    {(time?.overtime || pause) && placeholder ? placeholder : <span>
      {time?.days ? time?.days + 'd:' : ''}
      {wrapNumber(time?.hours) + 'h:'}
      {wrapNumber(time?.minutes) + `m`}
      {!time?.days ? ':' : ''}
      {!time?.days ? wrapNumber(time?.seconds) + 's' : ''}
    </span>}

  </TimerStyle> : null;
  // return time ? <TimerStyle>
  //   {time?.days ? <div className={'section'}>
  //     <div className='number'>{wrapNumber(time?.days)}</div>
  //     <div className='unit'>d</div>
  //   </div> : null}
  //   {time?.hours ? <div className={'section'}>
  //     <div className='number'>{wrapNumber(time?.hours)}</div>
  //     <div className='unit'>hr</div>
  //   </div> : null}
  //   {time?.minutes ? <div className={'section'}>
  //     <div className='number'>{wrapNumber(time?.minutes)}</div>
  //     <div className='unit'>min</div>
  //   </div> : null}
  //   {!time?.days ? <div className={'section'}>
  //     <div className='number'>{wrapNumber(time?.seconds)}</div>
  //     <div className='unit'>sec</div>
  //   </div> : null}
  // </TimerStyle> : null;
}

const TimerStyle = styled.span`
  .overtime {
    font-weight: bold;
    color: #f91d1d;
  }

  //display: flex;
  //gap: 10px;
  //
  //.section {
  //  display: flex;
  //  flex-direction: column;
  //  justify-content: center;
  //  align-items: center;
  //}
`


export default Timer;