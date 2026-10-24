import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { cleanText } from './names';

export default {
  system: 'statueFlair',
  label: 'Statue flair',
  entryLabel: 'statue flair',
  scope: 'account',
  route: GOAL_ROUTES.statueFlair,
  list: ({ account }) => account?.royalGuardian?.statueFlair?.statues ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanText(row.name),
  // the page draws no picture per statue: the marble the flair costs
  icon: (row) => `data/${row.costItem}`,
  metrics: {
    // maxLevel is the current cap, raised by a Menagerie unlock
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(row.maxLevel) }
  }
};
