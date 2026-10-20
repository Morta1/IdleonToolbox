import { GOAL_ROUTES } from '../routes';
import { cleanUpgradeName } from './names';

const LISTS = [
  { list: 'upgrades', letter: 'a' },
  { list: 'tarUpgrades', letter: 'b' }
];

export default {
  system: 'kangaroo',
  label: 'Poppy upgrades',
  entryLabel: 'Poppy upgrade',
  scope: 'account',
  route: GOAL_ROUTES.kangaroo,
  groups: {
    label: 'Page',
    of: (row) => row.list,
    names: { upgrades: 'Upgrades', tarUpgrades: 'Tar pit' }
  },
  // both lists are built 1:1 from their catalogs in the parser, so the position is the key
  list: ({ account }) => LISTS.flatMap(({ list, letter }) => (account?.kangaroo?.[list] ?? [])
    .map((upgrade, pos) => ({ ...upgrade, list, pos, letter }))),
  key: (row) => `${row.list}:${row.pos}`,
  name: (row) => cleanUpgradeName(row.name),
  icon: (row) => `etc/KUpg${row.letter}_${row.pos}`,
  metrics: {
    level: {
      label: 'Level',
      value: (row) => row.level ?? 0,
      steps: [10, 50]
    }
  }
};
