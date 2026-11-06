import { useState } from 'react';
import { getOptions } from '@utility/dashboard/account';


const checkIfSectionEmpty = (fields) => {
  return Object.entries(fields)?.reduce((res, [, val]) => res && !val?.checked, true);
}

// `context` carries alert inputs that live outside the save (e.g. tracker state in local storage);
// it's compared by value, so a fresh object each render doesn't recompute every alert.
const computeAlerts = (alertsMap, data, extraData, trackers, lastUpdated, context) => {
  const anyTracker = trackers && Object.values(trackers).some((tracker) => tracker);
  if (!anyTracker) return { alerts: null, emptyAlertRows: {}, failedRows: [] };
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
  return { alerts: nothingToShow ? null : tempAlerts, emptyAlertRows: tempEmptyAlertRows, failedRows: tempFailedRows };
};

const useAlerts = ({ alertsMap, data, extraData, trackers, lastUpdated, context }) => {
  const contextKey = JSON.stringify(context ?? null);
  // One object per value of the context, so the compiler's memo of computeAlerts holds across renders.
  const [heldContext, setHeldContext] = useState({ contextKey, context });
  let current = heldContext;
  if (heldContext.contextKey !== contextKey) {
    current = { contextKey, context };
    setHeldContext(current);
  }
  return computeAlerts(alertsMap, data, extraData, trackers, lastUpdated, current.context);
};

export default useAlerts;
