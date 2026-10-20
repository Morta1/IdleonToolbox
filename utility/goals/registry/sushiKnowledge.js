import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'sushiKnowledge',
  label: 'Sushi knowledge',
  entryLabel: 'sushi',
  scope: 'account',
  route: GOAL_ROUTES.sushiKnowledge,
  // one entry per sushi type, no filter: the position is the tier the page draws Sushi<pos> for
  list: ({ account }) => withUniqueNames(
    (account?.sushiStation?.knowledge ?? []).map((row, pos) => ({ ...row, pos })),
    (row) => stableText(row.name) || `Sushi ${row.pos}`
  ),
  key: (row) => row.rawName,
  name: (row) => row.goalName,
  icon: (row) => `data/Sushi${row.pos}`,
  metrics: {
    level: { label: 'Knowledge level', value: (row) => row.level ?? 0 }
  }
};
