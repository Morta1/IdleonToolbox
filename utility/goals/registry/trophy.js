import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'trophy',
  label: 'Gallery trophies',
  entryLabel: 'trophy',
  scope: 'account',
  route: GOAL_ROUTES.trophy,
  // the page sorts owned trophies first, so the position moves; rawName is the key
  list: ({ account }) => withUniqueNames(
    account?.gallery?.allTrophies ?? [],
    (row) => stableText(row.displayName || row.rawName)
  ),
  key: (row) => row.rawName,
  name: (row) => row.goalName,
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    acquired: { label: 'Acquired', value: (row) => (row.isAcquired ? 1 : 0), boolean: true, verb: 'own' }
  }
};
