import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { capitalizeFirst } from './names';

export default {
  system: 'cookingMastery',
  label: 'Cooking mastery',
  entryLabel: 'mastery category',
  scope: 'account',
  route: GOAL_ROUTES.cookingMastery,
  list: ({ account }) => account?.cooking?.cookingMastery?.categories ?? [],
  key: (row) => String(row.index),
  name: (row) => capitalizeFirst(cleanUnderscore(String(row.name ?? '').toLowerCase())),
  // the category cards have no art: the Cooking page icon stands in
  icon: () => 'data/ClassIcons51',
  metrics: {
    // the card's "Lv." is the points spent in it
    level: { label: 'Level', noun: 'level', value: (row) => row.points ?? 0 }
  }
};
