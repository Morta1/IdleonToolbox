import { getValidTrackedMaterials } from '@utility/materialTracker';
import { createGoal } from './store';
import { greenstackGoal, GREENSTACK_AMOUNT } from './registry/greenstack';

// The page stores '' for an unset bound and checkBound is truthiness-based, so only a positive finite number counts
const toBound = (value) => {
  const n = parseInt(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// "Track missing greenstacks" used to add one 10M entry per item; those are now the single greenstack goal
const folds = (entry, greenstackKeys) => toBound(entry.lowerBound) === GREENSTACK_AMOUNT && toBound(entry.upperBound) === null
  && !(typeof entry.note === 'string' && entry.note) && greenstackKeys.has(entry.item.rawName);

// The tracker entries materialTrackerToGoals merges into the greenstack goal
export const foldedGreenstackKeys = (tracked, { greenstackKeys = new Set() } = {}) =>
  Object.values(getValidTrackedMaterials(tracked)).filter((entry) => folds(entry, greenstackKeys)).map(({ item }) => item.rawName);

export const materialTrackerToGoals = (tracked, { greenstackKeys = new Set() } = {}) => {
  const goals = [];
  let folded = false;
  for (const entry of Object.values(getValidTrackedMaterials(tracked))) {
    if (folds(entry, greenstackKeys)) {
      folded = true;
      continue;
    }
    const key = entry.item.rawName;
    const lower = toBound(entry.lowerBound);
    const upper = toBound(entry.upperBound);
    const note = typeof entry.note === 'string' ? entry.note : '';
    const base = { system: 'item', kind: 'entry', key, metric: 'quantity', note, nearAlert: Boolean(entry.includeNearly) };
    if (lower === null && upper === null) goals.push(createGoal({ ...base, op: '>=', target: 0, watch: true }));
    if (lower !== null) goals.push(createGoal({ ...base, op: '>=', target: lower }));
    if (upper !== null) goals.push(createGoal({ ...base, op: '<=', target: upper }));
  }
  if (folded) goals.push(greenstackGoal());
  return goals;
};

// "Keep as separate goals": the folded entries as the item goals they were before the fold
export const unfoldedGreenstackGoals = (tracked, { greenstackKeys = new Set() } = {}) => {
  const folded = Object.entries(getValidTrackedMaterials(tracked)).filter(([, entry]) => folds(entry, greenstackKeys));
  return materialTrackerToGoals(Object.fromEntries(folded));
};
