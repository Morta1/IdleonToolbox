import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'nametag',
  label: 'Gallery nametags',
  entryLabel: 'nametag',
  scope: 'account',
  route: GOAL_ROUTES.nametag,
  // the page sorts owned nametags first, so the position moves; rawName is the key
  list: ({ account }) => withUniqueNames(
    account?.gallery?.allNametags ?? [],
    (row) => stableText(row.displayName || row.rawName)
  ),
  key: (row) => row.rawName,
  name: (row) => row.goalName,
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    // only owned nametags carry a level
    level: { label: 'Level', value: (row) => row.level ?? 0 }
  }
};
