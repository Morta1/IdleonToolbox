import { spaced } from '../text.mjs';

// The class a class-specific system belongs to, as a page field.
export const classField = (rawName) => ({ label: 'Class', value: spaced(rawName) });

// How much of the system's own upgrade levels must be bought before the game shows a row; nothing for a row that always shows.
export const unlocksAt = (count, system) => (count > 0
  ? { label: 'Unlocks at', value: `${count.toLocaleString('en-US')} total ${system} upgrade level${count === 1 ? '' : 's'}` }
  : null);
