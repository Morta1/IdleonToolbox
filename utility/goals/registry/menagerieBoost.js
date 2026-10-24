import { GOAL_ROUTES } from '../routes';
import { getMenagerieBoostText } from '@parsers/world-7/menagerie';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'menagerieBoost',
  label: 'Menagerie boosts',
  entryLabel: 'Menagerie boost',
  scope: 'account',
  route: GOAL_ROUTES.menagerieBoost,
  // the parser's description has the live value filled in, so the name comes from the catalog text
  list: ({ account }) => withUniqueNames(
    account?.menagerie?.boosts ?? [],
    (row) => stableText(getMenagerieBoostText(row.index))
  ),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/MenaIconP${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
