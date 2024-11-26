export const migrateToVersion2 = (config = {}) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (dashboardConfig.account['World 2'].alchemy) {
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

export const migrateConfig = (baseTrackers, userConfig) => {
  let migratedConfig;
  if (!userConfig) {
    migratedConfig = baseTrackers;
  } else {
    if ((!userConfig?.version || userConfig?.version === 1)) {
      migratedConfig = migrateToVersion2(userConfig);
    }
  }
  return migratedConfig;
}