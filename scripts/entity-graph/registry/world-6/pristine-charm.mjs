import { fillBonus } from '../text.mjs';

// UPKEEP: PristineBon (Ninja.js:583) is x3 once collected.
const filled = (entry) => fillBonus(entry.bonus, entry.x3);

export default {
  kind: 'pristinecharm',
  section: 'pristineCharms',
  key: (entry) => entry.rawName,
  icon: (entry) => `/data/${entry.rawName}.png`,
  fallbackIcon: '/data/NjTrP0.png',
  describe: (entry) => `${filled(entry)}@${entry.description}`,
  // UPKEEP: N.js:106325, randomInt(0, 22): any of the 23, 0.1% x (1.5 - charms found today / 80) per charm drop, times 1 + Compass 54 (Pristine Collector) / 100.
  fields: () => [{ label: 'Found', value: 'Replaces a sneaking charm drop: a base 0.15% on the first charm of the day, falling to 0 after 120 (before the Pristine Collector compass bonus)' }]
};
