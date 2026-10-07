import React, { createContext, useContext } from 'react';

/**
 * Lets a dashboard alert open its quick edit popover.
 *
 * The alert icons are rendered at ~200 call sites nested deep inside a few big JSX trees, so a
 * callback prop would have to be threaded through every one of them. The context keeps each call
 * site to a `target` prop (plus `items` / `worlds` where the alert needs them).
 */
const DashboardSettingsContext = createContext({ openAlert: () => { }, labelFor: () => null });

// `labelFor(configType, target, extra)` names the alert for screen readers.
export const DashboardSettingsProvider = ({ onOpenAlert, labelFor = () => null, children }) => {
  return <DashboardSettingsContext.Provider value={{ openAlert: onOpenAlert, labelFor }}>
    {children}
  </DashboardSettingsContext.Provider>;
};

/**
 * Props that make an alert icon open its quick edit. `target` is a dot path naming the alert
 * (see utility/dashboard/settingsTarget); `extra` is `{ items, worlds }` for alerts about one picker
 * item or some Royal Guardian worlds.
 */
export const useAlertSettingsProps = (configType, target, extra) => {
  const { openAlert, labelFor } = useContext(DashboardSettingsContext);
  if (!target) return {};
  // Timer rows navigate on click, so the icon keeps its click to itself.
  const fire = (event) => {
    event.stopPropagation();
    openAlert(event.currentTarget, configType, target, extra);
  };
  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': `${labelFor(configType, target, extra) ?? 'Alert'} settings`,
    'aria-haspopup': 'dialog',
    onClick: fire,
    onKeyDown: (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      fire(event);
    }
  };
};

export default DashboardSettingsProvider;
