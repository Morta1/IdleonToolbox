import { isValid } from 'date-fns';
import { getTimeAsDays, isUnknownTime, notateNumber, UNKNOWN_TIME } from '@utility/helpers';
import useFormatDate from '@hooks/useFormatDate';

// Mirrors getRealDateInMs, including its NaN/Infinity guard - see the comment there. This is the
// path the dashboard's timer tooltips actually take, which is where "NaNENaN days" showed up.
const useRealDate = () => {
  const formatDate = useFormatDate();

  return (ms, shouldFormat = true) => {
    if (!shouldFormat) return ms;
    if (isUnknownTime(ms)) return UNKNOWN_TIME;
    return isValid(new Date(ms))
      ? formatDate(ms)
      : `${notateNumber(getTimeAsDays(ms))} days`;
  };
};

export default useRealDate;
