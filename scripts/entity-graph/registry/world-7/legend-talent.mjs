import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { spaced } from '../text.mjs';
import researchSquare from './research-square.mjs';

// UPKEEP: generalSpelunky[26] lists the talent indexes in grid order (N.js:119192).
const GRID_ORDER = 26;
// UPKEEP: Double Aint Enough is talent 2: its `$` is 2 + x2 L / 100 (N.js:119193).
const DOUBLE_AINT_ENOUGH = 2;
// UPKEEP: Super Talent Points is talent 39: its `$` is SuperTalentPTS_LVgiven, 50 plus talent 7 and Zenith 5 (Thingies.js:307).
const SUPER_TALENT_POINTS = 39;
const SUPER_TALENT_BASE = 50;
// UPKEEP: the account readouts the panel fills in for talents 33 and 37 (N.js:119193); each cut keeps the sentence's own punctuation.
const CUTS = [/_for_a_total_bonus_speed_of_\$x/, /_You_currently_get_\$_daily_guaranteed\./];

const gridOf = (index, data) => data.generalSpelunky[GRID_ORDER].map(Number).indexOf(index);
// A talent in no group, or in a group whose research square the data lacks, has no raised maximum.
const groupOf = (index, data) => gameTable(data, 'legendTalentMaxLevelGroups')
  ?.find((group) => group.talents.includes(index) && data.researchGridSquares[group.gridSquare]);
// UPKEEP: LegendTalent_MaxLV adds the group's research square level, which caps at its maxLv (Thingies.js:297-306, N.js:107639).
const raisedBy = (group, data) => (group ? data.researchGridSquares[group.gridSquare].maxLv : 0);
// The panel names a grid square by its colour band (wikiTables.legendTalentColours, z-processing: the colour array indexed by
// floor(Spelunky[26].indexOf(..) / perColour) in the LegendTalents panel).
const positionText = (position, data) => {
  const bands = gameTable(data, 'legendTalentColours');
  return bands ? `${bands.colours[Math.floor(position / bands.perColour)]} ${(position % bands.perColour) + 1}` : null;
};

export default {
  kind: 'legendtalent',
  section: 'legendTalents',
  // UPKEEP: unreleased legend talents are named "filler".
  skip: (entry) => (entry.name === 'filler' ? 'placeholder: no talent yet' : false),
  key: (entry, index) => `LegendTalent${index}`,
  // UPKEEP: the panel loads LegendTalentIcon<p> for grid slot p, not for the talent index (N.js:119052, 119307).
  icon: (entry, index, data) => `/data/LegendTalentIcon${gridOf(index, data)}.png`,
  describe: (entry, index) => (index === SUPER_TALENT_POINTS
    ? entry.description.replace('$', SUPER_TALENT_BASE)
    : CUTS.reduce((out, re) => out.replace(re, ''), entry.description)),
  effect: (entry, index, data) => ({
    levelLabel: 'Talent level',
    cap: entry.x1 + raisedBy(groupOf(index, data), data),
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.x2 } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.x2 / 100 } },
      ...(index === DOUBLE_AINT_ENOUGH ? [{ token: '$', formula: 'growth', args: { func: 'bigBase', x1: 2, x2: entry.x2 / 100 } }] : [])
    ]
  }),
  // LegendPTS_spent sums the levels: one Legend Talent Point each (Thingies.js:262-270).
  cost: () => ({ formula: 'pow', args: { base: 1, rate: 1 }, currency: 'Legend Talent Points', currencyOne: 'Legend Talent Point', note: 'One point per level.' }),
  fields: (entry, index, data) => {
    const position = gridOf(index, data);
    const group = groupOf(index, data);
    return [
      { label: 'Grid position', value: positionText(position, data) },
      group
        ? linked(
          {
            label: 'Base max level',
            value: `${entry.x1}, up to ${entry.x1 + raisedBy(group, data)} with the ${spaced(data.researchGridSquares[group.gridSquare].name)} research square`
          },
          'maxRaisedBy',
          nodeId(researchSquare, null, group.gridSquare)
        )
        : null
    ].filter(Boolean);
  }
};
