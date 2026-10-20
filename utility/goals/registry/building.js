import { getExtraMaxLevels } from '@parsers/world-3/construction';
import { cleanUnderscore } from '@utility/helpers';
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';

const CARBON_ATOM_NAME = 'Carbon_-_Wizard_Maximizer';

// The page adds the extra levels to the catalog cap (buildings.jsx)
const buildingMax = (row, { account }) => {
  const atom = account?.atoms?.atoms?.find(({ name }) => name === CARBON_ATOM_NAME);
  const extra = getExtraMaxLevels(account, row.maxLevel, atom?.level ?? 0, row.index);
  return realCap((row.maxLevel ?? 0) + (Number.isFinite(extra) ? extra : 0));
};

export default {
  system: 'building',
  label: 'Buildings',
  entryLabel: 'building',
  scope: 'account',
  route: GOAL_ROUTES.building,
  list: ({ account }) => account?.towers?.data ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/ConTower${row.index}`,
  metrics: {
    level: {
      label: 'Level',
      value: (row) => row.level ?? 0,
      max: buildingMax,
      steps: [10, 50]
    }
  }
};
