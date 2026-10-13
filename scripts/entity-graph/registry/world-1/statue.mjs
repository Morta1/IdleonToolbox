import { titleCase } from '../text.mjs';

// The game writes a statue's effect as "@BASE_DAMAGE", with a `%` in front for a percentage
// ("%@MOVE_SPEED"); the app's Statues page reads it the same way (Statues.jsx).
const statueTemplate = (effect) => titleCase(String(effect || '').replace(/^(%?)@_?/, '+{$1_'));

// UPKEEP: slot n's art is Statue<n> and its item is EquipmentStatues<n>; re-check both if the
// game inserts a statue anywhere but the end of the table.
const itemOf = (index) => `EquipmentStatues${index + 1}`;

export default {
  kind: 'statue',
  section: 'statues',
  key: (entry, index) => `Statue${index + 1}`,
  name: (entry, index, data) => data.items?.[itemOf(index)]?.displayName ?? `${titleCase(entry.name)}_Statue`,
  icon: (entry, index) => `/data/Statue${index + 1}.png`,
  describe: (entry) => statueTemplate(entry.effect),
  // No level cap. The bonus is the level times the base (statues.ts), before the talent, onyx and
  // zenith multipliers a save supplies.
  effect: (entry) => ({ terms: [{ token: '{', formula: 'linear', args: { perLevel: entry.bonus } }] }),
  // Levelled by depositing copies of its own statue item.
  costs: (entry, index) => [{ item: itemOf(index) }]
};
