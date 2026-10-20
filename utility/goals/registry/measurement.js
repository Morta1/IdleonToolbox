import { GOAL_ROUTES } from '../routes';
import { capitalizeFirst, withUniqueNames } from './names';
import { cleanUnderscore } from '@utility/helpers';

// "+{%_BELL_RING|访_PING_RATE": drop the value markers, the glyph is the game's ampersand
const label = (description) => capitalizeFirst(cleanUnderscore(String(description ?? '')
  .replace('访', '&').replace(/[+{}%]/g, '').replace('|', '_').toLowerCase()).trim());

export default {
  system: 'measurement',
  label: 'Measurements',
  entryLabel: 'measurement',
  scope: 'account',
  route: GOAL_ROUTES.measurement,
  // the page hides the "i" placeholder rows, the key stays the catalog position
  list: ({ account }) => withUniqueNames(
    (account?.hole?.measurements ?? []).map((row, pos) => ({ ...row, pos })).filter((row) => row.description !== 'i'),
    (row) => label(row.description)
  ),
  key: (row) => String(row.pos),
  name: (row) => row.goalName,
  icon: (row) => `etc/Measure_${row.pos}`,
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0 }
  }
};
