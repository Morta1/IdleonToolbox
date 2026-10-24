import { GOAL_ROUTES } from '../routes';
import { withUniqueNames } from './names';

// "<x Total DMG" is a multiplier the card prints as 1 + value / 100; "+{% Drop Rate" prints the value
const isMulti = (row) => String(row.bonus ?? '').startsWith('<');

export default {
  system: 'summonWinnerBonus',
  label: 'Winner bonuses',
  entryLabel: 'winner bonus',
  scope: 'account',
  route: GOAL_ROUTES.summonWinnerBonus,
  list: ({ account }) => withUniqueNames(account?.summoning?.winnerBonuses ?? [],
    (row) => String(row.bonus ?? '').replace(/^[<+{]+%?x?\s*/, '').trim()),
  key: (row) => String(row.bonusId),
  name: (row) => row.goalName,
  // the cards have no art: the Summoning page icon stands in
  icon: () => 'data/ClassIcons59',
  metrics: {
    bonus: { label: 'Bonus', value: (row) => (isMulti(row) ? 1 + (row.value ?? 0) / 100 : row.value ?? 0) }
  }
};
