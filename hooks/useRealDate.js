import { isValid } from 'date-fns';
import { getTimeAsDays, isUnknownTime, notateNumber, UNKNOWN_TIME } from '@utility/helpers';
import useFormatDate from '@hooks/useFormatDate';

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
