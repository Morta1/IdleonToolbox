import { masterclassDescriptor } from './masterclass';
import { GOAL_ROUTES } from '../routes';

export default masterclassDescriptor({
  system: 'grimoire',
  label: 'Grimoire',
  route: GOAL_ROUTES.grimoire,
  list: ({ account }) => account?.grimoire?.upgrades ?? [],
  icon: (row) => `data/GrimoireUpg${row.index}`
});
