import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'gamingImport',
  label: 'Gaming imports',
  entryLabel: 'import',
  scope: 'account',
  route: GOAL_ROUTES.gamingImport,
  list: ({ account }) => account?.gaming?.imports ?? [],
  // the parser drops the empty box, so the position is not stable: the game index sits in the sprite name
  key: (row) => /\d+/.exec(row.rawName)?.[0] ?? row.rawName,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0 }
  }
};
