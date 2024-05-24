import { useEffect, useState } from 'react';
import { getOptions } from '@utility/dashboard/account';

const useAlerts = ({ alertsMap, data, extraData, trackers }) => {
  const [alerts, setAlerts] = useState();

  useEffect(() => {
    const anyTracker = trackers && Object.values(trackers).some((tracker) => tracker);
    if (anyTracker) {
      const tempAlerts = Object.entries(trackers || {}).reduce((result, [section, fields]) => {
        const sectionAlerts = Object.values(fields || {}).reduce((res, val) => {
          if (val?.checked) {
            if (alertsMap?.[section]) {
              const options = getOptions(fields);
              const alerts = alertsMap?.[section]?.(data, fields, options, extraData) || {};
              return { ...res, ...alerts };
            }
          }
          return res;
        }, {});
        return {
          ...result,
          [section]: sectionAlerts
        }
      }, {})
      const anythingToShow = Object.values(tempAlerts).some((alert) => Array.isArray(alert) ? alert.length > 0 : alert)
      setAlerts(anythingToShow ? tempAlerts : null);
    } else {
      setAlerts(null)
    }
  }, [data, trackers]);

  return alerts;
};

export default useAlerts;
