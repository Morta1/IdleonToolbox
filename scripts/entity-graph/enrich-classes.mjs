// Family bonuses on class pages. A class page has no `description` or top-level `effect` (seo.js and
// the bot print `effect` at level 1, which for a family bonus reads "+0%"), so the bonus lives in
// `familyBonus`, a node-shaped object only the class panel reads.

// UPKEEP: Beginner and the unused slots carry no bonus (N.js:126020).
const NO_BONUS = new Set(['NO_FAMILY_BONUS', 'NOPE', 'FILLER']);

// UPKEEP: the game writes MultiplierInfo's `#` as `千` (Wind Walker `{千_COINS_FROM_MOBS`, Shaman `{千@HIGHER_BONUSES_FROM_GOLDEN_FOODS`, N.js:93265); a class page reads it as "x".
const MULTIPLIER_GLYPH = /千@?_?/g;

const familyBonusOf = ({ name, func, x1, x2, x3 }) => ({
  description: name.replace(MULTIPLIER_GLYPH, 'x_'),
  effect: {
    levelLabel: 'Class level',
    cap: null,
    // UPKEEP: the game reads the level offset from ClassAccountBonus[e][1] (N.js:126028), and the extractor's x3 matches it for every row; the bonus starts one level past it.
    from: x3 + 1,
    terms: [{ token: '{', formula: 'familyBonus', args: { func, x1, x2, offset: x3 } }]
  }
});

// `classFamilyBonuses` is indexed by the game's class index, as parsers/family.ts reads it.
export const enrichClasses = (nodes, { classFamilyBonuses, classPromotions }) => {
  for (const [name, entry] of Object.entries(classPromotions || {})) {
    const node = nodes[`class:${name}`];
    const bonus = classFamilyBonuses?.[entry.index];
    if (!node || !bonus || NO_BONUS.has(bonus.name) || bonus.func === 'txt') continue;
    node.familyBonus = familyBonusOf(bonus);
  }
};
