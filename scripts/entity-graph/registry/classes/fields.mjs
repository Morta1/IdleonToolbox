import { spaced } from '../text.mjs';
import { linked } from '../../../../utility/wiki/field-links.mjs';

// The class a class-specific system belongs to, as a page field linking the class page.
export const classField = (rawName) => linked({ label: 'Class', value: spaced(rawName) }, 'belongsTo', `class:${rawName}`);

// How much of the system's own upgrade levels must be bought before the game shows a row; nothing for a row that always shows.
export const unlocksAt = (count, system) => (count > 0
  ? { label: 'Unlocks at', value: `${count.toLocaleString('en-US')} total ${system} upgrade level${count === 1 ? '' : 's'}` }
  : null);
