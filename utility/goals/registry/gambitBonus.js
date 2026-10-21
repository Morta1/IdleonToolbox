import { holesInfo } from '@website-data';
import { GOAL_ROUTES } from '../routes';
import { withoutValue, withUniqueNames } from './names';

// The card name prints the live bonus, so the name is the catalog text ("{_Summoning_Doublers_梦(TAP_ME)")
const baseName = (index) => withoutValue((String(holesInfo?.[71]?.[index] ?? '').split('|')[3] ?? '')
  .replace(/[梦而]/g, '').replace('(TAP_ME)', ''));

export default {
  system: 'gambitBonus',
  label: 'Gambit bonuses',
  entryLabel: 'Gambit bonus',
  scope: 'account',
  route: GOAL_ROUTES.gambitBonus,
  list: ({ account }) => {
    const gambit = account?.hole?.caverns?.gambit;
    return withUniqueNames((gambit?.bonuses ?? []).map((row, index) => ({
      ...row,
      index,
      // a card lights up once the points pass its requirement
      unlocked: (gambit?.points ?? 0) > row.pointsReq ? 1 : 0
    })), (row) => baseName(row.index));
  },
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  // the cards have no art: Gambit's cavern icon stands in
  icon: () => 'etc/Cavern_13',
  metrics: {
    unlocked: { label: 'Unlocked', value: (row) => row.unlocked, boolean: true }
  }
};
