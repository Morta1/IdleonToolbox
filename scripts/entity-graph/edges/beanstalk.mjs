// The golden foods the World 6 Beanstalk takes. Its roster is ninjaExtraInfo[29], a flat list of
// map coordinates interleaved with item names; the names are the non-numeric entries, which is how
// parsers/misc.ts reads it too.
//
// The first rank needs 10,000 of the food (BEANSTALK_BREAKPOINTS in parsers/misc.ts, which plain
// node cannot import), and that is the cost the edge carries.
const FIRST_RANK = 10000;

export const beanstalkEdges = (ninjaExtraInfo) => (ninjaExtraInfo?.[29] || [])
  .filter((entry) => typeof entry === 'string' && Number.isNaN(Number(entry)))
  .map((rawName) => ({
    from: 'station:beanstalk',
    to: `item:${rawName}`,
    rel: 'upgradedWith',
    meta: { baseCost: FIRST_RANK },
    source: 'beanstalk'
  }));
