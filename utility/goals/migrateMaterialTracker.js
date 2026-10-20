import { getValidTrackedMaterials } from '@utility/materialTracker';
import { createGoal } from './store';
import { greenstackGoal, GREENSTACK_AMOUNT } from './registry/greenstack';

// The page stores '' for an unset bound and checkBound is truthiness-based, so only a positive finite number counts
const toBound = (value) => {
  const n = parseInt(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const materialTrackerToGoals = (tracked, { greenstackKeys = new Set() } = {}) => {
  const goals = [];
  let folded = false;
  for (const entry of Object.values(getValidTrackedMaterials(tracked))) {
    const key = entry.item.rawName;
    const lower = toBound(entry.lowerBound);
    const upper = toBound(entry.upperBound);
    const note = typeof entry.note === 'string' ? entry.note : '';
    // "Track missing greenstacks" used to add one 10M entry per item; those are now the single greenstack goal
    if (lower === GREENSTACK_AMOUNT && upper === null && !note && greenstackKeys.has(key)) {
      folded = true;
      continue;
    }
    const base = { system: 'item', kind: 'entry', key, metric: 'quantity', note, nearAlert: Boolean(entry.includeNearly) };
    if (lower === null && upper === null) goals.push(createGoal({ ...base, op: '>=', target: 0, watch: true }));
    if (lower !== null) goals.push(createGoal({ ...base, op: '>=', target: lower }));
    if (upper !== null) goals.push(createGoal({ ...base, op: '<=', target: upper }));
  }
  if (folded) goals.push(greenstackGoal());
  return goals;
};
