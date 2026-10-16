import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable, listAt } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { spaced } from '../text.mjs';
import researchSquare from './research-square.mjs';

// UPKEEP: the account readouts the panel fills in for talents 33 and 37 (N.js:119193); each cut keeps the sentence's own punctuation.
const CUTS = [/_for_a_total_bonus_speed_of_\$x/, /_You_currently_get_\$_daily_guaranteed\./];
const DOLLAR_SENTENCE = /_*[^.!?]*\$[^.!?]*[.!?]?/;

// The talent indexes in grid order are listIndexes.legendTalentGrid (_event_Reef, N.js:119192); a talent off the grid, or every
// talent when the list is absent, has no position.
const gridOf = (index, data) => (listAt(data.generalSpelunky, data, 'legendTalentGrid') || []).map(Number).indexOf(index);
// With the groups absent no talent has a raised maximum.
const groupOf = (index, data) => gameTable(data, 'legendTalentMaxLevelGroups')?.find((group) => group.talents.includes(index));
// The research square a group's level comes from; none when the data has no such square, which raises nothing.
const squareOf = (group, data) => (group ? data.researchGridSquares?.[group.gridSquare] ?? null : null);
// UPKEEP: LegendTalent_MaxLV adds the group's research square level, which caps at its maxLv (Thingies.js:297-306, N.js:107639).
const raisedBy = (group, data) => squareOf(group, data)?.maxLv ?? 0;
// The panel names a grid square by its colour band (wikiTables.legendTalentColours, z-processing: the colour array indexed by
// floor(Spelunky[grid].indexOf(..) / perColour) in the LegendTalents panel).
const positionText = (position, data) => {
  const bands = gameTable(data, 'legendTalentColours');
  return bands && position >= 0 ? `${bands.colours[Math.floor(position / bands.perColour)]} ${(position % bands.perColour) + 1}` : null;
};

export default {
  kind: 'legendtalent',
  section: 'legendTalents',
  // UPKEEP: unreleased legend talents are named "filler".
  skip: (entry) => (entry.name === 'filler' ? 'placeholder: no talent yet' : false),
  key: (entry, index) => `LegendTalent${index}`,
  // UPKEEP: the panel loads LegendTalentIcon<p> for grid slot p, not for the talent index (N.js:119052, 119307).
  icon: (entry, index, data) => `/data/LegendTalentIcon${gridOf(index, data)}.png`,
  // The legendTalentPanel table's superTalentPoints names the talent whose `$` is Thingies SuperTalentPTS_LVgiven, and the
  // superTalentPoints table holds its neutral base (the talent 7 and Zenith 5 terms read the account). With no base the
  // sentence holding the `$` goes.
  describe: (entry, index, data) => {
    const talent = gameTable(data, 'legendTalentPanel')?.superTalentPoints?.talent;
    const points = gameTable(data, 'superTalentPoints');
    if (index !== talent) return CUTS.reduce((out, re) => out.replace(re, ''), entry.description);
    return points ? entry.description.replace('$', points.base) : entry.description.replace(DOLLAR_SENTENCE, '');
  },
  effect: (entry, index, data) => {
    // The legendTalentPanel table's levelled fill (N.js:119193, the LegendTalents panel): one talent's `$` is base + x2 L / divisor.
    const levelled = gameTable(data, 'legendTalentPanel')?.levelled;
    return {
      levelLabel: 'Talent level',
      cap: entry.x1 + raisedBy(groupOf(index, data), data),
      terms: [
        { token: '{', formula: 'linear', args: { perLevel: entry.x2 } },
        { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.x2 / 100 } },
        ...(index === levelled?.talent ? [{ token: '$', formula: 'growth', args: { func: 'bigBase', x1: levelled.base, x2: entry.x2 / levelled.divisor } }] : [])
      ]
    };
  },
  // LegendPTS_spent sums the levels: one Legend Talent Point each (Thingies.js:262-270).
  cost: () => ({ formula: 'pow', args: { base: 1, rate: 1 }, currency: 'Legend Talent Points', currencyOne: 'Legend Talent Point', note: 'One point per level.' }),
  fields: (entry, index, data) => {
    const position = gridOf(index, data);
    const group = groupOf(index, data);
    const square = squareOf(group, data);
    return [
      { label: 'Grid position', value: positionText(position, data) },
      square
        ? linked(
          {
            label: 'Base max level',
            value: `${entry.x1}, up to ${entry.x1 + raisedBy(group, data)} with the ${spaced(square.name)} research square`
          },
          'maxRaisedBy',
          nodeId(researchSquare, null, group.gridSquare)
        )
        : null
    ].filter(Boolean);
  }
};
