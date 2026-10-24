import { masterclassDescriptor } from './masterclass';
import { GOAL_ROUTES } from '../routes';

export default masterclassDescriptor({
  system: 'tesseract',
  label: 'Tesseract',
  route: GOAL_ROUTES.tesseract,
  list: ({ account }) => account?.tesseract?.upgrades ?? [],
  icon: (row) => `data/ArcaneUpg${row.index}`
});
