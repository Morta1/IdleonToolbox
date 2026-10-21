import { GOAL_ROUTES } from '../routes';
import { stableText } from './names';

// The game fills the mastery levels that have no bonus yet with this text
const PLACEHOLDER = /no_bonus_here_yet/i;

export default {
  system: 'ninjaMastery',
  label: 'Ninja mastery',
  entryLabel: 'mastery bonus',
  scope: 'account',
  route: GOAL_ROUTES.ninjaMastery,
  list: ({ account }) => (account?.sneaking?.ninjaMasteryBonuses ?? []).filter(({ description }) => !PLACEHOLDER.test(description ?? '')),
  key: (row) => String(row.index),
  name: (row) => stableText(`${row.description ?? ''} ${row.bonus ?? ''}`.replace('#', 'x')),
  // the Mastery cards have no art; the Sneaking skill icon stands in
  icon: () => 'data/ClassIcons58',
  metrics: {
    // the Mastery tab: a bonus is on once the mastery level reaches its position
    unlocked: {
      label: 'Unlocked',
      value: (row, { account }) => ((account?.sneaking?.ninjaMastery ?? 0) >= row.index + 1 ? 1 : 0),
      boolean: true
    }
  }
};
