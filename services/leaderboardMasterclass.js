// Masterclass leaderboard values, kept free of parser and data imports so they test in isolation.
const finiteOrZero = (value) => Number.isFinite(value) ? value : 0;

export const outpostInfo = (outposts) => {
  const list = Array.isArray(outposts) ? outposts : [];
  const rates = list.map(({ resourceRate }) => finiteOrZero(resourceRate));
  return { totalOutposts: list.length, highestOutpostResourceRate: rates.length ? Math.max(...rates) : 0 };
};

// One getMaps result per character: the bonus cap reads the active character's added talent levels.
// A board ranks only values above zero, so an account with no map bonus at all reports 0, not 1x.
export const highestArcaneMapMulti = (mapsPerCharacter) => {
  const best = Math.max(0, ...mapsPerCharacter.flat().flatMap(({ mapBonuses }) => mapBonuses ?? [])
    .map(({ value }) => finiteOrZero(value)));
  return best > 0 ? 1 + best / 100 : 0;
};
