import { GOAL_ROUTES } from '../routes';
import { portalsDescriptor } from './portals';

export default portalsDescriptor({
  system: 'compassPortal',
  label: 'Compass portals',
  route: GOAL_ROUTES.compassPortal,
  list: ({ account }) => account?.compass?.maps ?? []
});
