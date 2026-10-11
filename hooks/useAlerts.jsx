import { useEffect, useState } from 'react';
import { getOptions } from '@utility/dashboard/account';


const checkIfSectionEmpty = (fields) => {
  return Object.entries(fields)?.reduce((res, [, val]) => res && !val?.checked, true);
}

// `context` carries alert inputs that live outside the save (e.g. tracker state in local storage);
// it's compared by value, so a fresh object each render doesn't recompute every alert.
const useAlerts = ({ alertsMap, data, extraData, trackers, lastUpdated, context }) => {
  const contextKey = JSON.stringify(context ?? null);

  const [alerts, setAlerts] = useState();
  const [emptyAlertRows, setEmptyAlertRows] = useState({});

  useEffect(() => {
    const anyTracker = trackers && Object.values(trackers).some((tracker) => tracker);
    if (anyTracker) {
      const tempEmptyAlertRows = {}
      const tempAlerts = Object.entries(trackers || {}).reduce((result, [section, fields]) => {
        const sectionAlerts = Object.values(fields || {}).reduce((res, val) => {
          if (val?.checked) {
            if (alertsMap?.[section]) {
              const options = getOptions(fields);
              const alerts = alertsMap?.[section]?.(data, fields, options, extraData, lastUpdated, context) || {};
              return { ...res, ...alerts };
            }
          }
          return res;
        }, {});
        const alertsAreEmpty = Object.keys(sectionAlerts).length === 0;
        tempEmptyAlertRows[section] = checkIfSectionEmpty(fields) || alertsAreEmpty;
        return {
          ...result,
          [section]: sectionAlerts
        }
      }, {})
      const nothingToShow = Object.values(tempEmptyAlertRows).every((val) => val);
      setEmptyAlertRows(tempEmptyAlertRows);
      setAlerts(nothingToShow ? null : tempAlerts);
    } else {
      setAlerts(null)
    }
  }, [data, trackers, contextKey]);

  return { alerts, emptyAlertRows };
};

export default useAlerts;
