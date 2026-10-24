import { GOAL_ROUTES } from '../routes';
import { getCoralKidBaseDescription } from '@parsers/world-7/coralReef';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'coralKid',
  label: 'Coral Kid upgrades',
  entryLabel: 'Coral Kid upgrade',
  scope: 'account',
  route: GOAL_ROUTES.coralKid,
  groups: {
    label: 'Page',
    of: (row) => String(row.page ?? 0),
    names: { 0: 'Coral Kid', 1: 'Singularity' }
  },
  // the page prints the live bonus in the description, so the name comes from the catalog text
  list: ({ account }) => withUniqueNames(
    account?.coralReef?.coralKidUpgrades ?? [],
    (row) => stableText(getCoralKidBaseDescription(row.index))
  ),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  // the cards have no icon of their own: Singularity Mode shows its spiral, the first page stands in with the reef icon
  icon: (row) => (row.page === 1 ? 'data/CKsing' : 'data/ReefA1'),
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
