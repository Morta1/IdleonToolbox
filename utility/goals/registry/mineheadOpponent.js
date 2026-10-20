import { GOAL_ROUTES } from '../routes';
import { getMineheadOpponentSpriteId } from '@parsers/world-7/minehead';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'mineheadOpponent',
  label: 'Minehead opponents',
  entryLabel: 'Minehead opponent',
  scope: 'account',
  route: GOAL_ROUTES.mineheadOpponent,
  list: ({ account }) => withUniqueNames(account?.minehead?.opponents ?? [], (row) => stableText(row.name)),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/MineH${getMineheadOpponentSpriteId(row.index)}`,
  metrics: {
    beaten: { label: 'Beaten', value: (row) => (row.beaten ? 1 : 0), boolean: true }
  }
};
