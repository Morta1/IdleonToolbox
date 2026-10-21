import { getMaps } from '@parsers/class-specific/tesseract';
import { GOAL_ROUTES } from '../routes';
import { portalsDescriptor } from './portals';

export default portalsDescriptor({
  system: 'tesseractMap',
  label: 'Tesseract maps',
  route: GOAL_ROUTES.tesseractMap,
  // the Maps tab card per map; its portals open the map
  list: ({ account, characters }) => (account?.tesseract ? getMaps(account, characters ?? [], undefined) ?? [] : [])
});
