import { GOAL_ROUTES } from '../routes';
import { getMenagerieUnlockText } from '@parsers/world-7/menagerie';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'menagerieUnlock',
  label: 'Menagerie unlocks',
  entryLabel: 'Menagerie unlock',
  scope: 'account',
  route: GOAL_ROUTES.menagerieUnlock,
  // the parser's name has the live drop chance filled in, so the name comes from the catalog text
  list: ({ account }) => withUniqueNames(
    account?.menagerie?.unlocks ?? [],
    (row) => stableText(getMenagerieUnlockText(row.index))
  ),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/MenaIconO${row.index}`,
  metrics: {
    owned: {
      label: 'Owned',
      value: (row) => (row.owned ? 1 : 0),
      boolean: true,
      verb: 'buy',
      cost: { label: 'lumi', icon: () => 'etc/Lumi', have: ({ account }) => account?.menagerie?.lumi ?? 0, price: (row) => row.cost }
    }
  }
};
