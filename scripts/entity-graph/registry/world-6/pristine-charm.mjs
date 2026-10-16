import { linked } from '../../../../utility/wiki/field-links.mjs';
import { percentText } from '../../../../utility/wiki/odds.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { fillBonus, spaced } from '../text.mjs';
import compassUpgrade from '../classes/compass-upgrade.mjs';

// UPKEEP: PristineBon (Ninja.js:583) is x3 once collected.
const filled = (entry) => fillBonus(entry.bonus, entry.x3);

// The sneakingPristineDrop table, GenerateItem's pristine roll (N.js:106325): any of the pick range, scale x (start -
// charms found today / divisor) per charm drop, times 1 + the compass bonus / 100. No table, no field.
const foundField = (data) => {
  const drop = gameTable(data, 'sneakingPristineDrop');
  const bonus = spaced(data.compass?.[drop?.compassBonus]?.name);
  if (!drop || !bonus) return [];
  return [linked(
    {
      label: 'Found',
      value: `Replaces a sneaking charm drop: a base ${percentText(drop.roll.scale * drop.roll.start)} on the first charm of the day, falling to 0 after ${drop.roll.start * drop.roll.divisor} charms in a day (before the ${bonus} compass bonus)`
    },
    'boostedBy',
    nodeId(compassUpgrade, null, drop.compassBonus)
  )];
};

export default {
  kind: 'pristinecharm',
  section: 'pristineCharms',
  key: (entry) => entry.rawName,
  icon: (entry) => `/data/${entry.rawName}.png`,
  fallbackIcon: '/data/NjTrP0.png',
  describe: (entry) => `${filled(entry)}@${entry.description}`,
  fields: (entry, index, data) => foundField(data)
};
