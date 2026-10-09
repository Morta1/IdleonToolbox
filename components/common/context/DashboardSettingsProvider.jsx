import React, { createContext, useContext } from 'react';

/**
 * Lets a dashboard alert open its quick edit popover.
 *
 * The alert icons are rendered at ~200 call sites nested deep inside a few big JSX trees, so a
 * callback prop would have to be threaded through every one of them. The context keeps each call
 * site to a `target` prop (plus `items` / `worlds` where the alert needs them).
 */
const DashboardSettingsContext = createContext({ openAlert: () => { }, labelFor: () => null, hrefFor: () => null });

// `labelFor(configType, target, extra)` names the alert for screen readers; `hrefFor(configType, target)`
// is the URL of the page the alert is about, or null.
export const DashboardSettingsProvider = ({ onOpenAlert, labelFor = () => null, hrefFor = () => null, children }) => {
  return <DashboardSettingsContext.Provider value={{ openAlert: onOpenAlert, labelFor, hrefFor }}>
    {children}
  </DashboardSettingsContext.Provider>;
};

/**
 * Props that make an alert icon open its quick edit. `target` is a dot path naming the alert
 * (see utility/dashboard/settingsTarget); `extra` is `{ items, worlds }` for alerts about one picker
 * item or some Royal Guardian worlds.
 *
 * An alert with a page is also a real link to it: a plain click still opens the quick edit, while
 * Ctrl/Cmd/Shift+click and middle click are left to the browser, which opens the page in a new tab.
 */
export const useAlertSettingsProps = (configType, target, extra) => {
  const { openAlert, labelFor, hrefFor } = useContext(DashboardSettingsContext);
  if (!target) return {};
  const href = hrefFor(configType, target);
  const browserHandles = (event) => Boolean(href) && (event.ctrlKey || event.metaKey || event.shiftKey);
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
    ...(href ? { component: 'a', href, style: { color: 'inherit', textDecoration: 'none' } } : {}),
    onClick: (event) => {
      if (browserHandles(event)) {
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      fire(event);
    },
    onKeyDown: (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.key === 'Enter' && browserHandles(event)) return;
      event.preventDefault();
      fire(event);
    }
  };
};

export default DashboardSettingsProvider;
