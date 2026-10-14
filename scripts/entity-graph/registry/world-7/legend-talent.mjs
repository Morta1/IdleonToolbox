const spaced = (text) => String(text || '').replace(/_/g, ' ').trim();
// UPKEEP: generalSpelunky[26] lists the talent indexes in grid order, and the grid is 5 colours of 10 squares (N.js:119192).
const GRID_ORDER = 26;
const COLOURS = ['Yellow', 'Red', 'Brown', 'Green', 'White'];
const SQUARES_PER_COLOUR = 10;
// UPKEEP: Double Aint Enough is talent 2: its `$` is 2 + x2 L / 100 (N.js:119193).
const DOUBLE_AINT_ENOUGH = 2;
// UPKEEP: Super Talent Points is talent 39: its `$` is SuperTalentPTS_LVgiven, 50 plus talent 7 and Zenith 5 (Thingies.js:307).
const SUPER_TALENT_POINTS = 39;
const SUPER_TALENT_BASE = 50;
// UPKEEP: the account readouts the panel fills in for talents 33 and 37 (N.js:119193); each cut keeps the sentence's own punctuation.
const CUTS = [/_for_a_total_bonus_speed_of_\$x/, /_You_currently_get_\$_daily_guaranteed\./];

const gridOf = (index, data) => data.generalSpelunky[GRID_ORDER].map(Number).indexOf(index);
const groupOf = (index, data) => data.gameTables.legendTalentMaxLevelGroups.find((group) => group.talents.includes(index));
// UPKEEP: LegendTalent_MaxLV adds the group's research square level, which caps at its maxLv (Thingies.js:297-306, N.js:107639).
const raisedBy = (group, data) => (group ? data.researchGridSquares[group.gridSquare].maxLv : 0);

export default {
  kind: 'legendtalent',
  section: 'legendTalents',
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
  cost: () => ({ formula: 'pow', args: { base: 1, rate: 1 }, currency: 'Legend Talent Points', note: 'One point per level.' }),
  fields: (entry, index, data) => {
    const position = gridOf(index, data);
    const group = groupOf(index, data);
    return [
      { label: 'Grid', value: `${COLOURS[Math.floor(position / SQUARES_PER_COLOUR)]} ${(position % SQUARES_PER_COLOUR) + 1}` },
      group
        ? {
            label: 'Base max level',
            value: `${entry.x1}, up to ${entry.x1 + raisedBy(group, data)} with the ${spaced(data.researchGridSquares[group.gridSquare].name)} research square`
          }
        : null
    ].filter(Boolean);
  }
};
