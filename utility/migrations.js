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

export const migrateToVersion4 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }
  if (dashboardConfig?.account?.General?.etc?.options?.length === 6) {
    dashboardConfig.account.General.etc.options = [
      ...dashboardConfig.account.General.etc.options,
      { name: 'familyObols', checked: true }
    ]
  }

  dashboardConfig.version = 4;
  return dashboardConfig
}

export const migrateToVersion5 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }
  if (dashboardConfig?.timers?.['World 3'] && !dashboardConfig?.timers?.['World 3']?.equinox) {
    dashboardConfig.timers['World 3'] = {
      ...dashboardConfig?.timers?.['World 3'],
      equinox: { checked: true, options: [] }
    }
  }

  dashboardConfig.version = 5;
  return dashboardConfig
}

export const migrateToVersion6 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }
  if (dashboardConfig?.account?.['World 1'] && dashboardConfig?.account?.['World 1']?.stamps?.options?.length === 1) {
    dashboardConfig.account['World 1'].stamps.options = [
      ...dashboardConfig.account['World 1'].stamps.options,
      { name: 'showGildedWhenNoAtomDiscount', checked: false }
    ]
  }

  dashboardConfig.version = 6;
  return dashboardConfig
}

export const migrateToVersion7 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }
  if (dashboardConfig?.account?.['World 3'] && !dashboardConfig?.account?.['World 3']?.traps) {
    dashboardConfig.account['World 3'].traps = {
      checked: true,
      options: [{ name: 'trapsOverdue', checked: true }]
    }
  }

  dashboardConfig.version = 7;
  return dashboardConfig
}

export const migrateToVersion8 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (dashboardConfig?.account?.['World 1'] && !dashboardConfig?.account?.['World 1']?.forge) {
    dashboardConfig.account['World 1'].forge = {
      checked: true,
      options: [{ name: 'emptySlots', checked: true }]
    }
  }
  if (dashboardConfig?.account?.['World 4'] && dashboardConfig?.account?.['World 4']?.cooking?.options?.length === 1) {
    dashboardConfig.account['World 4'].cooking.options = [
      ...dashboardConfig.account['World 4'].cooking.options,
      {
        name: 'ribbons',
        type: 'input',
        props: { label: 'Ribbons threshold', value: 0, maxValue: 28, minValue: 0, helperText: 'Empty ribbon slots' },
        checked: true
      }
    ]
  }

  dashboardConfig.version = 8;
  return dashboardConfig
}
export const migrateToVersion9 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (dashboardConfig?.account?.['World 6'] && dashboardConfig?.account?.['World 6']?.summoning?.options?.length === 1) {
    dashboardConfig.account['World 6'].summoning.options = [
      ...dashboardConfig.account['World 6'].summoning.options,
      { name: 'battleAttempts', checked: true }
    ]
  }

  dashboardConfig.version = 9;
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
    }
    if (migratedConfig?.version === 2) {
      migratedConfig = migrateToVersion3(migratedConfig);
    }
    if (migratedConfig?.version === 3) {
      migratedConfig = migrateToVersion4(migratedConfig);
    }
    if (migratedConfig?.version === 4) {
      migratedConfig = migrateToVersion5(migratedConfig);
    }
    if (migratedConfig?.version === 5) {
      migratedConfig = migrateToVersion6(migratedConfig);
    }
    if (migratedConfig?.version === 6) {
      migratedConfig = migrateToVersion7(migratedConfig);
    }
    if (migratedConfig?.version === 7) {
      migratedConfig = migrateToVersion8(migratedConfig);
    }
    if (migratedConfig?.version === 8) {
      migratedConfig = migrateToVersion9(migratedConfig);
    }
  }
  return migratedConfig;
}