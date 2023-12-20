import { useEffect, useState } from 'react';

const useAlerts = ({ alertsMap, data, extraData, trackers }) => {
  const [alerts, setAlerts] = useState();

  useEffect(() => {
    const anyTracker = trackers && Object.values(trackers).some((tracker) => tracker);
    if (anyTracker) {
      const tempAlerts = Object.entries(trackers || {}).reduce((res, [trackerName, val]) => {
        if (val?.checked) {
          if (alertsMap?.[trackerName]) {
            const optionObject = val?.options?.reduce((result, option) => ({
              ...result,
              [option?.name]: option
            }), {});
            res[trackerName] = alertsMap?.[trackerName](data, optionObject, extraData) || {};
          }
        }
        return res;
      }, {});
      const anythingToShow = Object.values(tempAlerts).some((alert) => Array.isArray(alert) ? alert.length > 0 : alert)
      setAlerts(anythingToShow ? tempAlerts : null);
    } else {
      setAlerts(null)
    }
  }, [data, trackers]);

  return alerts;
};

export default useAlerts;
