export const migrateToVersion2 = (config = {}) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (dashboardConfig?.account?.['World 2']?.alchemy) {
    let alchemyOptions = dashboardConfig.account['World 2'].alchemy.options.map((option) => {
      const { name, category } = option;
      if (name === 'bargainTag' && !category) {
        return { ...option, category: 'liquidShop' };
      }
      if (name === 'sigils' && !category) {
        return { ...option, category: 'sigils' };
      }
      return option;
    });
    const alchemyGemsExist = alchemyOptions.find(({ name }) => name === 'gems');
    if (!alchemyGemsExist) {
      alchemyOptions = alchemyOptions.toSpliced(1, 0, { name: 'gems', checked: true });
    }
    dashboardConfig.account['World 2'].alchemy.options = alchemyOptions;
  }
  dashboardConfig.version = 2;
  return dashboardConfig;
}
export const migrateToVersion3 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }
  if (dashboardConfig?.account?.['World 5']?.hole?.options?.length === 7) {
    dashboardConfig.account['World 5'].hole.options = [
      ...dashboardConfig?.account?.['World 5']?.hole?.options,
      {
        name: 'justice',
        checked: true,
        type: 'input',
        props: { label: 'Reward multi threshold', value: 1, minValue: 1, helperText: '' }
      }
    ]
  }

  if (dashboardConfig?.timers?.['World 5'] && !dashboardConfig?.timers?.['World 5']?.justice) {
    dashboardConfig.timers['World 5'] = {
      ...dashboardConfig.timers['World 5'],
      justice: { checked: true, options: [] }
    }
  }
  dashboardConfig.version = 3;
  return dashboardConfig
}
export const migrateConfig = (baseTrackers, userConfig) => {
  if (baseTrackers?.version === userConfig?.version) return userConfig;
  let migratedConfig = userConfig;
  if (!Object.keys(userConfig || {}).length) {
    migratedConfig = baseTrackers;
  } else {
    if ((!userConfig?.version || userConfig?.version === 1)) {
      migratedConfig = migrateToVersion2(userConfig);
    } else if (migratedConfig?.version === 2) {
      migratedConfig = migrateToVersion3(migratedConfig);
    }
  }
  return migratedConfig;
}