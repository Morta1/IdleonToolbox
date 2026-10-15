import { linked } from '../../../../utility/wiki/field-links.mjs';
import { nodeId } from '../links.mjs';
import { fillBonus } from '../text.mjs';
import compassUpgrade from '../classes/compass-upgrade.mjs';

// UPKEEP: PristineBon (Ninja.js:583) is x3 once collected.
const filled = (entry) => fillBonus(entry.bonus, entry.x3);
// UPKEEP: compass upgrade 54 is Pristine Collector, the bonus the drop-chance formula below multiplies by.
const PRISTINE_COLLECTOR = 54;

export default {
  kind: 'pristinecharm',
  section: 'pristineCharms',
  key: (entry) => entry.rawName,
  icon: (entry) => `/data/${entry.rawName}.png`,
  fallbackIcon: '/data/NjTrP0.png',
  describe: (entry) => `${filled(entry)}@${entry.description}`,
  // UPKEEP: N.js:106325, randomInt(0, 22): any of the 23, 0.1% x (1.5 - charms found today / 80) per charm drop, times 1 + Compass 54 (Pristine Collector) / 100.
  fields: () => [linked(
    { label: 'Found', value: 'Replaces a sneaking charm drop: a base 0.15% on the first charm of the day, falling to 0 after 120 (before the Pristine Collector compass bonus)' },
    'boostedBy',
    nodeId(compassUpgrade, null, PRISTINE_COLLECTOR)
  )]
};
