import { formatAmount } from '../../../../utility/wiki/effects.mjs';
import { gameTable } from '../data.mjs';
import { dropReadout } from '../text.mjs';

// The schematicsAvailable table (Holes SchematicsAvailable): at most `max` offered, base + perLevel per Engineer level
// + 1 per bonusEvery levels.
const offeredAt = (level, offer) => Math.min(offer.max, Math.round(offer.base + offer.perLevel * level + Math.floor(level / offer.bonusEvery)));
const engineerLevelFor = (position, offer) => {
  // offeredAt stops growing at the cap, so the search is bounded rather than run until it passes it.
  for (let level = 0; level <= offer.max; level++) if (offeredAt(level, offer) > position) return level;
  return null;
};

// The holesBuildCost table (Holes BuildCost): fixed when x4 is 1, else by creation position in the band of the
// resource family; a band's offset shifts the position, and its growth term is capped.
const buildCost = (entry, p, bands) => {
  if (Number(entry.x4) === 1) return entry.x3;
  const band = bands.find(({ below }) => below === null || entry.x2 < below);
  if (!band.offset) return band.base * Math.pow(band.rate, p + Math.floor(p / band.step));
  const q = p - band.offset;
  return band.base * Math.pow(band.rate, q + Math.floor(q / band.step)) * Math.pow(band.growth, Math.min(Math.max(0, q / band.per), band.cap));
};

// The fountain coin names as the game's HoleFountUPG unlock texts write them ("You can now find Golden Coins"), by the
// unlocking upgrade's currency; fountain-upgrade.mjs reads them too.
// UPKEEP: Bronze Coins are there from the start. Not extracted: no unlock text names them.
const BRONZE = 'Bronze Coins';
const UNLOCK = /^You_can_now_find_([^.]+)\./;
export const coinNames = (data) => {
  const names = [BRONZE];
  for (const upgrade of (data.holeFountUpg || []).flat()) {
    const coin = UNLOCK.exec(String(upgrade.description))?.[1];
    if (coin) names[upgrade.currencyType] = coin.replace(/_/g, ' ');
  }
  return names;
};
// One resource index space (hole.ts getHoleResourceIcon): well below the first band, harp below the second, then jars
// and from 30 the fountain coins; only coins have names.
// UPKEEP: the jars band ends at 30. Not extracted: BuildCost prices jars and coins alike, so no game code writes it.
const JARS_BELOW = 30;
const resourceName = (slot, bands, data) => {
  if (slot < bands[0].below) return `Well sediment ${slot + 1}`;
  if (slot < bands[1].below) return `Harp note ${slot - bands[0].below + 1}`;
  return slot < JARS_BELOW ? `Jar rupie ${slot - bands[1].below + 1}` : coinNames(data)[slot - JARS_BELOW];
};

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
  // UPKEEP: a schematic outside holesInfo[40] is never offered (NameNameName); one past the schematic limit is never reached (Bee_String).
  skip: (entry, index, data) => {
    const position = positionOf(index, data);
    if (position < 0) return 'placeholder: not in the creation order';
    const offer = gameTable(data, 'schematicsAvailable');
    return offer && position >= offer.max ? `never offered: past the ${offer.max}-schematic limit` : false;
  },
  describe: (entry) => cleaned(entry.description),
  fields: (entry, index, data) => {
    const position = positionOf(index, data);
    const offer = gameTable(data, 'schematicsAvailable');
    const level = offer ? engineerLevelFor(position, offer) : null;
    const bands = gameTable(data, 'holesBuildCost')?.bands;
    return [
      { label: 'Cost to create (before the lamp wish discount)', value: bands ? `${formatAmount(buildCost(entry, position, bands))} ${resourceName(entry.x2, bands, data)}` : null },
      ...(level > 0 ? [{ label: 'Engineer level needed', value: level }] : [])
    ];
  }
};
