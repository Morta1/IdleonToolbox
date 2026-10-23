import { getMaxShinyLevel, MAX_BREEDABILITY_LEVEL } from '@parsers/world-4/breeding';
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'pet',
  label: 'Pets',
  entryLabel: 'pet',
  scope: 'account',
  route: GOAL_ROUTES.pet,
  groups: {
    label: 'World',
    of: (row) => row.world,
    names: Object.fromEntries([1, 2, 3, 4].map((n) => [`World${n}`, `World ${n}`]))
  },
  list: ({ account }) => (account?.breeding?.pets ?? []).flat(),
  key: (row) => row.monsterRawName,
  name: (row) => cleanUnderscore(row.monsterName),
  // the breeding page draws the Mface sprite for these pets
  icon: (row) => `data/${row.icon}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0
    },
    shiny: {
      label: 'Shiny level',
      noun: 'level',
      value: (row) => row.shinyLevel ?? 0,
      max: (row, { account }) => getMaxShinyLevel(account)
    },
    breedability: {
      label: 'Breedability',
      value: (row) => row.breedingLevel ?? 0,
      max: () => MAX_BREEDABILITY_LEVEL
    }
  }
};
