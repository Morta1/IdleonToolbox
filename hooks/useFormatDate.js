import { useContext } from 'react';
import { format, isValid } from 'date-fns';
import { PreferencesContext } from '@components/common/context/PreferencesProvider';

export const buildFormatString = ({ dateFormat = 'DMY', timeFormat = '24h', showSeconds = true, shortYear = false, timeOnly = false } = {}) => {
  const timePart = timeFormat === '12h'
    ? (showSeconds ? 'hh:mm:ss a' : 'hh:mm a')
    : (showSeconds ? 'HH:mm:ss' : 'HH:mm');
  if (timeOnly) return timePart;
  const yearPart = shortYear ? 'yy' : 'yyyy';
  const datePart = dateFormat === 'MDY' ? `MM/dd/${yearPart}` : `dd/MM/${yearPart}`;
  return `${datePart} ${timePart}`;
};

const useFormatDate = () => {
  const { dateFormat, timeFormat } = useContext(PreferencesContext);

  const formatDate = (dateMs, options = {}) => {
    const { showSeconds = true, shortYear = false, timeOnly = false } = options;
    if (!isValid(new Date(dateMs))) return null;
    const formatString = buildFormatString({ dateFormat, timeFormat, showSeconds, shortYear, timeOnly });
    return format(dateMs, formatString);
  };

  return formatDate;
};

export default useFormatDate;
