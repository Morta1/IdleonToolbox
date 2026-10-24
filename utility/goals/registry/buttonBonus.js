import { GOAL_ROUTES } from '../routes';
import { withUniqueNames } from './names';

export default {
  system: 'buttonBonus',
  label: 'The Button bonuses',
  entryLabel: 'Button bonus',
  scope: 'account',
  route: GOAL_ROUTES.buttonBonus,
  // one entry per bonus category, no filter: the position is the category
  list: ({ account }) => withUniqueNames(
    (account?.button?.bonuses ?? []).map((row, pos) => ({ ...row, pos })),
    (row) => row.name || `Bonus ${row.pos + 1}`
  ),
  key: (row) => String(row.pos),
  name: (row) => row.goalName,
  // the bonus cards have no icon of their own, so the page's own icon stands in
  icon: () => 'etc/ButtonG',
  metrics: {
    // level = completed groups of 5 presses for the category
    boosts: { label: 'Boosts', value: (row) => row.level ?? 0 }
  }
};
