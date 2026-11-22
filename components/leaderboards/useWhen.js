import { useContext } from 'react';
import { format } from 'date-fns';
import useNow from '@hooks/useNow';
import useFormatDate from '@hooks/useFormatDate';
import { PreferencesContext } from '@components/common/context/PreferencesProvider';

// "20 Nov", with the time while it is under two days old, in the visitor's own date order and clock.
const RECENT_MS = 48 * 60 * 60 * 1000;
const useWhen = () => {
  const { dateFormat } = useContext(PreferencesContext);
  const formatDate = useFormatDate();
  const now = useNow(60000);
  return (ms, { time = true } = {}) => {
    const day = format(ms, dateFormat === 'MDY' ? 'MMM d' : 'd MMM');
    return time && now - ms < RECENT_MS ? `${day}, ${formatDate(ms, { timeOnly: true, showSeconds: false })}` : day;
  };
};

export default useWhen;
