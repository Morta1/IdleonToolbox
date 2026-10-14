import { formatAmount } from '../../../../utility/wiki/effects.mjs';
import { dropReadout } from '../text.mjs';

// UPKEEP: Holes("SchematicsAvailable") (Holes.js:205): at most 105 offered, 1 + 3 per Engineer level + 1 per 5 levels.
const MAX_OFFERED = 105;
const offeredAt = (level) => Math.min(MAX_OFFERED, Math.round(1 + 3 * level + Math.floor(level / 5)));
const engineerLevelFor = (position) => {
  // offeredAt stops growing at the cap, so the search is bounded rather than run until it passes it.
  for (let level = 0; level <= MAX_OFFERED; level++) if (offeredAt(level) > position) return level;
  return null;
};

// UPKEEP: Holes("BuildCost") (Holes.js:210-224): fixed when x4 is 1, else by creation position and resource family.
const buildCost = (entry, p) => {
  if (Number(entry.x4) === 1) return entry.x3;
  if (entry.x2 < 10) return 50 * Math.pow(1.28, p + Math.floor(p / 2.7));
  if (entry.x2 < 20) return 50 * Math.pow(1.28, p - 16 + Math.floor((p - 16) / 2.7)) * Math.pow(1.23, Math.min(Math.max(0, (p - 16) / 2), 14));
  return 40 * Math.pow(1.34, p - 54 + Math.floor((p - 54) / 2.7)) * Math.pow(1.26, Math.min(Math.max(0, (p - 54) / 2), 14));
};

// UPKEEP: the game's fountain coin names (the-fountain.ts CURRENCY_NAMES); Task 7 reads this list too.
export const COIN_NAMES = ['Bronze Coins', 'Silver Coins', 'Golden Coins', 'Dollar Bills', 'Credit Bills', 'Treasury Bills', 'Moolah Stacks', 'Shilling Stacks', 'Greane Stacks'];
// UPKEEP: one resource index space (hole.ts getHoleResourceIcon): 0-9 well, 10-19 harp, 20-29 jars, 30+ fountain coins; only coins have names.
const resourceName = (slot) => (slot < 10 ? `Well sediment ${slot + 1}` : slot < 20 ? `Harp note ${slot - 9}` : slot < 30 ? `Jar rupie ${slot - 19}` : COIN_NAMES[slot - 30]);

// UPKEEP: three texts carry a live readout outside the "Total Bonus" line; each is cut where it starts.
const READOUTS = [/_I_see_you_currently_have.*$/, /_You_have_mined_#_so_far!/, /_*尬.*$/];
const cleaned = (text) => READOUTS.reduce((out, re) => out.replace(re, ''), dropReadout(text));

// UPKEEP: holesInfo[40] is the creation order; position, cost and Engineer level all follow it, not the table index.
const CREATION_ORDER = 40;
const positionOf = (index, data) => (data.holesInfo?.[CREATION_ORDER] || []).map(Number).indexOf(index);

export default {
  kind: 'schematic',
  section: 'holesBuildings',
  key: (entry, index) => `Schematic${index}`,
  icon: (entry, index) => `/data/HoleUIbuildUpg${index}.png`,
  fallbackIcon: '/etc/Villager_1.png',
  // UPKEEP: a schematic outside holesInfo[40] is never offered (NameNameName); one past position 104 is never reached (Bee_String).
  skip: (entry, index, data) => {
    const position = positionOf(index, data);
    if (position < 0) return 'placeholder: not in the creation order';
    return position >= MAX_OFFERED ? 'never offered: past the 105-schematic limit' : false;
  },
  describe: (entry) => cleaned(entry.description),
  fields: (entry, index, data) => {
    const position = positionOf(index, data);
    const level = engineerLevelFor(position);
    return [
      { label: 'Cost to create (before the lamp wish discount)', value: `${formatAmount(buildCost(entry, position))} ${resourceName(entry.x2)}` },
      ...(level > 0 ? [{ label: 'Engineer level needed', value: level }] : [])
    ];
  }
};
