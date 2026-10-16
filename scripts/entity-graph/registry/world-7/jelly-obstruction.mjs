import { listAt } from '../data.mjs';
import { fillBonus } from '../text.mjs';

export default {
  kind: 'jellyobstruction',
  // listIndexes.jellyObstructionNames names the obstruction by operation and jellyObstructionValues holds the value (N.js:122505,
  // RoG_BonusQTY, JellyOperation.js:81); clearing operation t earns it. Without the values the text is left out.
  // UPKEEP: research[46] is its Operational bonus text. Not extracted: only a numbered event reads it (_event_14), which no
  // locator may anchor on.
  section: (data) => {
    const values = listAt(data.research, data, 'jellyObstructionValues');
    return (listAt(data.research, data, 'jellyObstructionNames') || []).map((name, t) => ({
      name,
      bonus: data.research[46][t],
      value: values ? Number(values[t]) : null
    }));
  },
  key: (entry, index) => `JellyObstruction${index}`,
  icon: (entry, index) => `/data/JellyOp${index}.png`,
  fallbackIcon: '/data/JellyOp0.png',
  // UPKEEP: the unreleased operations read "Nothing_yet...".
  skip: (entry) => (/^Nothing/.test(entry.bonus) ? 'placeholder: no bonus yet' : false),
  describe: ({ bonus, value }) => (value === null ? null : fillBonus(bonus, value)),
  fields: (entry, index) => [{ label: 'Operation', value: index + 1 }]
};
