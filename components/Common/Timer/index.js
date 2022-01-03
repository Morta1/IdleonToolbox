import { useEffect, useState } from "react";
import useInterval from "./useInterval";
import { intervalToDuration } from 'date-fns';
import { CropLandscapeOutlined } from "@material-ui/icons";

const parseTime = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return { hours, minutes, seconds };
}

const Timer = ({ date, type }) => {
  const [time, setTime] = useState();

  useEffect(() => {
    if (date) {
      const time = parseTime(date);
      setTime(time);
    }
  }, [date]);

  const tickUp = () => {
    let { hours, minutes, seconds } = time;
    seconds += 1;
    if (seconds === 60) {
      seconds = 0;
      minutes += 1;
      if (minutes === 60) {
        minutes = 0;
        hours += 1;
      }
    }
    setTime({ hours, minutes, seconds });
  }
  const tickDown = () => {
    let { hours, minutes, seconds } = time;
    seconds -= 1;
    if (seconds == -1) {
      seconds = 59;
      minutes -= 1;
      if (minutes === -1) {
        minutes = 59;
        hours -= 1;
        if (hours === -1) {
          hours = 0;
        }
      }
    }
    setTime({ hours, minutes, seconds });
  }

  useInterval(() => {
    if (!time) return null;
    if (type === 'countdown') {
      tickDown();
    } else {
      tickUp();
    }
  }, 1000);

  const wrapNumber = (number) => {
    const strNumber = String(number);
    return strNumber?.length === 1 ? `0${number}` : number;
  }

  return `${wrapNumber(time?.hours)}:${wrapNumber(time?.minutes)}:${wrapNumber(time?.seconds)}`;
}

export default Timer;