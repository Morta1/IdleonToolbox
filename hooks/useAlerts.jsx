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
  const [failedRows, setFailedRows] = useState([]);

  useEffect(() => {
    const anyTracker = trackers && Object.values(trackers).some((tracker) => tracker);
    if (anyTracker) {
      const tempEmptyAlertRows = {}
      const tempFailedRows = [];
      const tempAlerts = Object.entries(trackers || {}).reduce((result, [section, fields]) => {
        let sectionAlerts = {};
        // One family that throws (a failed section's default it can't read) takes only its own row, never the others
        try {
          sectionAlerts = Object.values(fields || {}).reduce((res, val) => {
            if (val?.checked) {
              if (alertsMap?.[section]) {
                const options = getOptions(fields);
                const alerts = alertsMap?.[section]?.(data, fields, options, extraData, lastUpdated, context) || {};
                return { ...res, ...alerts };
              }
            }
            return res;
          }, {});
        } catch (error) {
          tempFailedRows.push(section);
          console.error('[alerts]', section, error);
        }
        const alertsAreEmpty = Object.keys(sectionAlerts).length === 0;
        tempEmptyAlertRows[section] = checkIfSectionEmpty(fields) || alertsAreEmpty;
        return {
          ...result,
          [section]: sectionAlerts
        }
      }, {})
      const nothingToShow = !tempFailedRows.length && Object.values(tempEmptyAlertRows).every((val) => val);
      setEmptyAlertRows(tempEmptyAlertRows);
      setFailedRows(tempFailedRows);
      setAlerts(nothingToShow ? null : tempAlerts);
    } else {
      setAlerts(null)
    }
  }, [data, trackers, contextKey]);

  return { alerts, emptyAlertRows, failedRows };
};

export default useAlerts;
