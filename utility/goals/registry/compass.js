import { masterclassDescriptor } from './masterclass';
import { GOAL_ROUTES } from '../routes';

export default masterclassDescriptor({
  system: 'compass',
  label: 'Compass',
  route: GOAL_ROUTES.compass,
  list: ({ account }) => (account?.compass?.upgrades ?? []).filter(({ description }) => description !== 'Titan_doesnt_exist'),
  icon: (row) => `data/CompassUpg${row.baseIconIndex >= 0 ? row.baseIconIndex + 106 : row.index}`
});
