import { GOAL_ROUTES } from '../routes';
import { getCoralKidBaseDescription } from '@parsers/world-7/coralReef';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'coralKid',
  label: 'Coral Kid upgrades',
  entryLabel: 'Coral Kid upgrade',
  scope: 'account',
  route: GOAL_ROUTES.coralKid,
  // the page prints the live bonus in the description, so the name comes from the catalog text
  list: ({ account }) => withUniqueNames(
    account?.coralReef?.coralKidUpgrades ?? [],
    (row) => stableText(getCoralKidBaseDescription(row.index))
  ),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  // the cards have no icon of their own, so the page's own icon stands in
  icon: () => 'data/ReefA1',
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0 }
  }
};
