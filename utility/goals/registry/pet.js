import { getMaxShinyLevel, getPetPassiveName, MAX_BREEDABILITY_LEVEL, PET_PASSIVE_NAMES } from '@parsers/world-4/breeding';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { monsterImage } from '@utility/spriteImages';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'pet',
  label: 'Pets',
  entryLabel: 'pet',
  scope: 'account',
  route: GOAL_ROUTES.pet,
  // A passive's name is its id, so it never meets a world id (World1)
  groups: [{
    label: 'World',
    of: (row) => row.world,
    names: Object.fromEntries([1, 2, 3, 4].map((n) => [`World${n}`, `World ${n}`]))
  }, {
    label: 'Passive',
    of: (row) => getPetPassiveName(row.rawPassive),
    names: Object.fromEntries(PET_PASSIVE_NAMES.map((name) => [name, name]))
  }],
  list: ({ account }) => (account?.breeding?.pets ?? []).flat(),
  key: (row) => row.monsterRawName,
  name: (row) => cleanUnderscore(row.monsterName),
  // Mface icons are placeholders: the breeding page draws the monster sprite for those pets instead
  icon: (row) => row.icon?.startsWith('Mface')
    ? monsterImage(row.monsterRawName).slice(prefix.length).replace(/\.\w+$/, '')
    : `data/${row.icon}`,
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
