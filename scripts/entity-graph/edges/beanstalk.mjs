// The golden foods the World 6 Beanstalk takes. Its roster is ninjaExtraInfo[29], a flat list of
// map coordinates interleaved with item names; the names are the non-numeric entries, which is how
// parsers/misc.ts reads it too.
//
// The first rank needs the first of beanstalkRanks (the food counts that raise a food's rank, read
// beside the roster's indexOf in N.js), and that is the cost the edge carries.
import { gameTable } from '../registry/data.mjs';

// UPKEEP: ninjaExtraInfo[29] is the Beanstalk roster; re-check the index if a patch reorders ninjaExtraInfo.
export const beanstalkEdges = (ninjaExtraInfo, data) => {
  const firstRank = gameTable(data, 'beanstalkRanks')?.[0];
  return (ninjaExtraInfo?.[29] || [])
    .filter((entry) => typeof entry === 'string' && Number.isNaN(Number(entry)))
    .map((rawName) => ({
      from: 'station:beanstalk',
      to: `item:${rawName}`,
      rel: 'upgradedWith',
      meta: firstRank == null ? {} : { baseCost: firstRank },
      source: 'beanstalk'
    }));
};
