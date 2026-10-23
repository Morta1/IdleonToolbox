import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { REEF_IMAGE_LETTERS } from '@parsers/world-7/coralReef';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'reefUpgrade',
  label: 'Reef upgrades',
  entryLabel: 'reef upgrade',
  scope: 'account',
  route: GOAL_ROUTES.reefUpgrade,
  // row.name is the catalog text; the parser's description has the live numbers filled in
  list: ({ account }) => withUniqueNames(account?.coralReef?.reefUpgrades ?? [], (row) => stableText(row.name)),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/Reef${REEF_IMAGE_LETTERS[row.index] || 'A'}1`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(row.x1) }
  }
};
