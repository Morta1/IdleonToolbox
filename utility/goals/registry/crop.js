import { GOAL_ROUTES } from '../routes';
import { seedInfo } from '@website-data';
import { cleanUnderscore, createRange } from '@utility/helpers';

const SEED_NAMES = Object.fromEntries(seedInfo.map(({ seedId, name }) => [String(seedId),
  cleanUnderscore(name.toLowerCase()).replace(/^./, (c) => c.toUpperCase())]));

export default {
  system: 'crop',
  label: 'Crops',
  entryLabel: 'crop',
  scope: 'account',
  route: GOAL_ROUTES.crop,
  groups: {
    label: 'Seed',
    of: (row) => String(row.seedId),
    names: SEED_NAMES
  },
  // the Crop tab loops every seed's id range; the game names no crop, so the name is the seed plus its place in the range
  list: ({ account }) => seedInfo.flatMap(({ seedId, cropIdMin, cropIdMax }) =>
    createRange(cropIdMin, cropIdMax).map((id) => ({
      id,
      seedId,
      goalName: `${SEED_NAMES[String(seedId)]} crop ${id - cropIdMin + 1}`,
      count: account?.farming?.crop?.[id] ?? 0
    }))),
  key: (row) => String(row.id),
  name: (row) => row.goalName,
  icon: (row) => `data/FarmCrop${row.id}`,
  metrics: {
    count: { label: 'Stock', value: (row) => (Number.isFinite(row.count) ? row.count : 0) }
  }
};
