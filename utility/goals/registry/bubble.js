import { CAULDRON_INFO, getBubbleEffectPercent } from '@parsers/world-2/alchemy';
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'bubble',
  label: 'Bubbles',
  entryLabel: 'bubble',
  scope: 'account',
  route: GOAL_ROUTES.bubble,
  groups: {
    label: 'Cauldron',
    of: (row) => row.cauldron,
    names: Object.fromEntries(CAULDRON_INFO.map(({ name, displayName }) => [name, displayName]))
  },
  list: ({ account }) => account?.alchemy?.bubblesFlat ?? [],
  key: (row) => row.bubbleIndex,
  name: (row) => cleanUnderscore(row.bubbleName),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    level: {
      label: 'Level',
      value: (row) => row.level,
      percentOfMax: (row, { account }) => getBubbleEffectPercent(account, row),
      steps: [100, 1000]
    }
  }
};
