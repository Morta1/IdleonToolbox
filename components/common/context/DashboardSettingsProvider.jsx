import React, { createContext, useContext } from 'react';

/**
 * Lets a dashboard alert open the "Configure alerts" modal on its own setting.
 *
 * The alert icons are rendered by a single `Alert` component instantiated at ~170 call sites
 * nested deep inside one big JSX tree, so a callback prop would have to be threaded through every
 * one of them. The context keeps the call sites to a single added `target` prop.
 */
const DashboardSettingsContext = createContext(() => { });

export const DashboardSettingsProvider = ({ onOpenSettings, children }) => {
  return <DashboardSettingsContext.Provider value={onOpenSettings}>
    {children}
  </DashboardSettingsContext.Provider>;
};

/**
 * Returns a function taking `(configType, target)`, where target is a dot path naming the alert
 * (see utility/dashboard/settingsTarget).
 */
export const useOpenDashboardSettings = () => useContext(DashboardSettingsContext);

export default DashboardSettingsProvider;
