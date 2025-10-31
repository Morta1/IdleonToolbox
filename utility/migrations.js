import { getPrinterExclusions } from '@parsers/printer';
import { getCrystalCountdownSkills } from '@parsers/talents';

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
export const migrateToVersion10 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  const anvilOptions = dashboardConfig?.characters?.anvil?.options?.filter(({ name }) => name !== 'anvilOverdue' && name !== 'showAlertBeforeFull');
  if (dashboardConfig?.characters?.anvil) {
    dashboardConfig.characters.anvil.options = [
      ...anvilOptions,
      {
        name: 'anvilOverdue',
        type: 'input',
        props: { label: 'Minutes', value: 30, minValue: 1, helperText: 'alert X minutes before full' },
        checked: true
      }
    ]
  }

  const printerOptions = dashboardConfig?.account?.['World 3']?.printer?.options?.filter(({ name }) => name !== 'includeOakAndCopper');
  if (dashboardConfig?.account?.['World 3']?.printer?.options?.length === 2) {
    dashboardConfig.account['World 3'].printer.options = [
      { name: 'includeOakTree', category: 'atoms', checked: false },
      { name: 'includeCopper', checked: false },
      { name: 'includeSporeCap', checked: true },
      ...printerOptions
    ]
  }

  dashboardConfig.version = 10;
  return dashboardConfig
}

export const migrateToVersion11 = (config, baseTrackers) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (dashboardConfig?.characters?.anvil) {
    dashboardConfig.characters.anvil.options = baseTrackers?.characters?.anvil?.options;
  }

  if (dashboardConfig?.account?.['World 3']?.printer) {
    dashboardConfig.account['World 3'].printer.options = baseTrackers?.account['World 3']?.printer?.options
  }

  dashboardConfig.version = 11;
  return dashboardConfig
}

export const migrateToVersion12 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (dashboardConfig?.account?.etc?.options?.length === 6) {
    dashboardConfig.account.etc.options = [
      ...dashboardConfig?.account?.etc?.options,
      { name: 'freeCompanion', checked: true }
    ];
  }

  if (dashboardConfig?.account?.['World 4']?.cooking?.options?.length === 2) {
    dashboardConfig.account['World 4'].cooking.options = [
      ...dashboardConfig.account['World 4'].cooking.options,
      { name: 'meals', checked: true }
    ];
  }

  const unspentPointsField = dashboardConfig?.characters?.anvil?.options?.find(({ name }) => name === 'unspentPoints');
  if (unspentPointsField?.type !== 'input') {
    dashboardConfig.characters.anvil.options = dashboardConfig.characters.anvil.options?.map((option) => {
      if (option?.name === 'unspentPoints') {
        return {
          name: 'unspentPoints',
          type: 'input',
          props: { label: 'Points Threshold', value: 1, minValue: 1, helperText: '' },
          checked: true
        }
      }
      return option;
    });
  }

  dashboardConfig.version = 12;
  return dashboardConfig
}

export const migrateToVersion13 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  const updatedPrinter = dashboardConfig?.account?.['World 3']?.printer?.options?.filter(({ name }) => name === 'showAlertWhenFull');
  if (dashboardConfig?.account?.['World 3']?.printer?.options?.length > 2) {
    dashboardConfig.account['World 3'].printer.options = [
      {
        name: 'includeResource',
        type: 'array',
        props: { value: getPrinterExclusions(), type: 'img' },
        checked: true,
        category: 'atoms'
      },
      ...updatedPrinter
    ]
  }

  dashboardConfig.version = 13;
  return dashboardConfig
}

export const migrateToVersion14 = (config, baseTrackers) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (!dashboardConfig.timers) {
    dashboardConfig.timers = {};
    if (!dashboardConfig?.timers?.['World 5']) {
      dashboardConfig.timers['World 5'] = baseTrackers?.timers?.['World 5'];
    }
  }

  const cookingOptions = dashboardConfig.account['World 4'].cooking.options.map((meal) => {
    if (meal?.name === 'meals') return { name: 'meals', checked: true, category: 'meals' };
    return meal;
  })
  if (dashboardConfig?.account?.['World 4'] && dashboardConfig?.account?.['World 4']?.cooking?.options) {
    dashboardConfig.account['World 4'].cooking.options = [
      ...cookingOptions,
      { name: 'alertOnlyCookedMeal', checked: false }
    ]
  }

  dashboardConfig.version = 14;
  return dashboardConfig
}

export const migrateToVersion15 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (dashboardConfig?.account?.['World 5']?.hole?.options?.length === 8) {
    dashboardConfig.account['World 5'].hole.options = [
      ...dashboardConfig?.account?.['World 5']?.hole?.options,
      { name: 'villagersLevelUp', checked: true }
    ]
  }

  if (!dashboardConfig?.timers?.['World 5']?.wisdom) {
    dashboardConfig.timers['World 5'] = {
      ...dashboardConfig.timers['World 5'],
      wisdom: { checked: true, options: [] }
    }
  }

  dashboardConfig.version = 15;
  return dashboardConfig
}

export const migrateToVersion16 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (dashboardConfig?.account?.['World 5']?.hole?.options?.length === 9) {
    dashboardConfig.account['World 5'].hole.options = [
      ...dashboardConfig?.account?.['World 5']?.hole?.options,
      {
        name: 'wisdom',
        checked: true,
        type: 'input',
        props: { label: 'Reward multi threshold', value: 1, minValue: 1, helperText: '' }
      }
    ]
  }

  dashboardConfig.version = 16;
  return dashboardConfig
}

export const migrateToVersion17 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (dashboardConfig?.account?.['World 6']?.farming?.options?.length === 3) {
    dashboardConfig.account['World 6'].farming.options = [
      ...dashboardConfig?.account?.['World 6']?.farming?.options,
      {
        name: 'beanTrade',
        type: 'input',
        props: { label: 'Bean trade value', value: 1, minValue: 1, helperText: '' },
        checked: false
      }
    ]
  }

  dashboardConfig.version = 17;
  return dashboardConfig
}

export const migrateToVersion18 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (dashboardConfig?.account?.['World 5']?.hole?.options?.length === 10) {
    dashboardConfig.account['World 5'].hole.options = [
      ...dashboardConfig.account['World 5'].hole.options,
      {
        name: 'jars',
        checked: true,
        type: 'input',
        props: { label: 'Jars threshold', value: 120, minValue: 1, maxValue: 120, helperText: 'Max of 120 jars' }
      }
    ]
  }

  if (dashboardConfig?.account?.['World 4']?.breeding?.options?.length === 3) {
    dashboardConfig.account['World 4'].breeding.options = [
      ...dashboardConfig.account['World 4'].breeding.options,
      { name: 'breedability', type: 'input', props: { label: 'Level threshold', value: 5 }, checked: true }
    ]
  }

  dashboardConfig.version = 18;
  return dashboardConfig
}
export const migrateToVersion19 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (dashboardConfig?.account?.['World 2']?.islands?.options?.length === 2) {
    dashboardConfig.account['World 2'].islands.options = [
      ...dashboardConfig.account['World 2'].islands.options,
      { name: 'garbageUpgrade', checked: true }
    ]
  }

  dashboardConfig.version = 19;
  return dashboardConfig
}

export const migrateToVersion20 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (dashboardConfig?.account?.['World 5']?.hole?.options?.length === 11) {
    dashboardConfig.account['World 5'].hole.options = [
      ...dashboardConfig?.account?.['World 5']?.hole?.options,
      { name: 'studyLevelUp', checked: true }
    ]
  }

  dashboardConfig.version = 20;
  return dashboardConfig
}

export const migrateToVersion21 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (dashboardConfig?.characters?.crystalCountdown?.options?.length === 2) {
    dashboardConfig.characters.crystalCountdown.options = [
      ...dashboardConfig.characters.crystalCountdown.options,
      {
        category: 'skills',
        name: 'skills',
        type: 'array',
        props: { value: getCrystalCountdownSkills(), type: 'img' },
        checked: true
      }
    ]
  }

  dashboardConfig.version = 21;
  return dashboardConfig
}
export const migrateToVersion22 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (dashboardConfig?.characters?.crystalCountdown?.options?.length === 3) {
    dashboardConfig.characters.crystalCountdown.options = dashboardConfig.characters.crystalCountdown.options.map((item, index) => {
      if (index === 1) {
        return { name: 'showNonMaxed', checked: true }
      }
      return item;
    })
  }

  dashboardConfig.version = 22;
  return dashboardConfig
}
export const migrateToVersion23 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (!dashboardConfig?.account?.['World 6']?.etc) {
    dashboardConfig.account['World 6'].etc = {
      checked: true,
      options: [
        {
          name: 'emperor',
          type: 'input',
          props: { label: 'Attempts', value: 20 },
          checked: true
        }
      ]
    }
  }

  dashboardConfig.version = 23;
  return dashboardConfig
}
export const migrateToVersion24 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (!dashboardConfig?.characters?.classSpecific) {
    dashboardConfig.characters.classSpecific = {
      checked: true, options: [
        { name: 'wrongItems', checked: true, helperText: 'Alert when using class-specific form items while outside form' },
        {
          name: 'betterWeapon',
          checked: true,
          helperText: 'Alert when there\'s a better form class-specific weapon in your inventory'
        }
      ]
    }
  }

  dashboardConfig.version = 24;
  return dashboardConfig
}

export const migrateToVersion25 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  const options = dashboardConfig?.account?.['World 2']?.killRoy?.options;
  if (Array.isArray(options)) {
    if (options.length === 0) {
      dashboardConfig.account['World 2'].killRoy.options = [
        { name: 'general', checked: true, helperText: 'Alert when Killroy is available' },
        { name: 'underHundredKills', checked: true, helperText: 'Alert when current Killroy has monsters below 100 kills (for equinox)' }
      ]
    }
  }

  dashboardConfig.version = 25;
  return dashboardConfig
}

export const migrateToVersion26 = (config) => {
  let dashboardConfig = { ...config };
  if (!dashboardConfig) {
    dashboardConfig = {};
  }

  if (!dashboardConfig?.account) {
    dashboardConfig.account = {};
  }
  if (!dashboardConfig?.account?.['World 7']) {
    dashboardConfig.account['World 7'] = {};
  }

  dashboardConfig.version = 26;
  return dashboardConfig
}


export const migrateConfig = (baseTrackers, userConfig) => {
  if (baseTrackers?.version === userConfig?.version) return userConfig;
  let migratedConfig = userConfig;
  if (!Object.keys(userConfig || {}).length) {
    migratedConfig = baseTrackers;
  }
  else {
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
    if (migratedConfig?.version === 9) {
      migratedConfig = migrateToVersion10(migratedConfig);
    }
    if (migratedConfig?.version === 10) {
      migratedConfig = migrateToVersion11(migratedConfig, baseTrackers);
    }
    if (migratedConfig?.version === 11) {
      migratedConfig = migrateToVersion12(migratedConfig);
    }
    if (migratedConfig?.version === 12) {
      migratedConfig = migrateToVersion13(migratedConfig);
    }
    if (migratedConfig?.version === 13) {
      migratedConfig = migrateToVersion14(migratedConfig, baseTrackers);
    }
    if (migratedConfig?.version === 14) {
      migratedConfig = migrateToVersion15(migratedConfig, baseTrackers);
    }
    if (migratedConfig?.version === 15) {
      migratedConfig = migrateToVersion16(migratedConfig, baseTrackers);
    }
    if (migratedConfig?.version === 16) {
      migratedConfig = migrateToVersion17(migratedConfig);
    }
    if (migratedConfig?.version === 17) {
      migratedConfig = migrateToVersion18(migratedConfig);
    }
    if (migratedConfig?.version === 18) {
      migratedConfig = migrateToVersion19(migratedConfig);
    }
    if (migratedConfig?.version === 19) {
      migratedConfig = migrateToVersion20(migratedConfig);
    }
    if (migratedConfig?.version === 20) {
      migratedConfig = migrateToVersion21(migratedConfig);
    }
    if (migratedConfig?.version === 21) {
      migratedConfig = migrateToVersion22(migratedConfig);
    }
    if (migratedConfig?.version === 22) {
      migratedConfig = migrateToVersion23(migratedConfig);
    }
    if (migratedConfig?.version === 23) {
      migratedConfig = migrateToVersion24(migratedConfig);
    }
    if (migratedConfig?.version === 24) {
      migratedConfig = migrateToVersion25(migratedConfig);
    }
    if (migratedConfig?.version === 25) {
      migratedConfig = migrateToVersion26(migratedConfig);
    }

  }
  return migratedConfig;
}