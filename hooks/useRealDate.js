import { isValid } from 'date-fns';
import { getTimeAsDays, notateNumber } from '@utility/helpers';
import useFormatDate from '@hooks/useFormatDate';

const useRealDate = () => {
  const formatDate = useFormatDate();

  return (ms, shouldFormat = true) => {
    if (!shouldFormat) return ms;
    return isValid(new Date(ms))
      ? formatDate(ms)
      : `${notateNumber(getTimeAsDays(ms))} days`;
  };
};

export default useRealDate;
