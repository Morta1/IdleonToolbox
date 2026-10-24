import { constructionMasteryThresholds } from '@parsers/world-3/construction';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'constructMastery',
  label: 'Construct mastery',
  entryLabel: 'construct mastery',
  scope: 'account',
  route: GOAL_ROUTES.constructMastery,
  list: ({ account }) => (account?.towers ? [{ totalLevels: account.towers.totalLevels ?? 0 }] : []),
  key: () => 'construct',
  name: () => 'Construct mastery',
  // the tab has no art of its own; the Construction skill icon stands in
  icon: () => 'data/ClassIcons49',
  metrics: {
    level: { label: 'Construct LV', value: (row) => row.totalLevels, steps: constructionMasteryThresholds },
    rank: {
      label: 'Mastery',
      value: (row) => constructionMasteryThresholds.filter((lv) => row.totalLevels >= lv).length,
      tiers: ['None', ...constructionMasteryThresholds.map((lv) => `Lv. ${lv}`)]
    }
  }
};
