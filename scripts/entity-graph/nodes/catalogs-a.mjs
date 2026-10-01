// Four more catalogs that are not items: the star signs and the constellations that unlock them,
// the Post Office boxes, the alchemy sigils and the arcade shop. None of them costs an item (a
// sigil charges with particles, an arcade upgrade with balls, a box with order points), so the only
// edge is a constellation to the area it sits in.
//
// Descriptions are filled at fixed levels because a save-less page cannot know the player's: the
// base level where the game's number is the base, and the maximum where it is a rate that only
// means something once it has grown.

// The three growth curves these catalogs use. Anything else returns null, and the clause that
// needed it is dropped rather than printed with a placeholder.
export const growth = (func, level, x1, x2) => {
  switch (func) {
    case 'add':
      return x2 !== 0 ? (((x1 + x2) / x2 + 0.5 * (level - 1)) / (x1 / x2)) * level * x1 : x1 * level;
    case 'decay':
      return (x1 * level) / (level + x2);
    case 'intervalAdd':
      return x1 + Math.floor(level / x2);
    default:
      return null;
  }
};

// Two decimals is the most a bonus shows in game, and trailing zeros are noise.
const num = (value) => String(Number(Number(value).toFixed(2)));
const fill = (template, value) => String(template || '').replace(/[{}]/g, num(value));

const GLYPHS = /[船般航舞製]/g;
const clean = (text) => String(text || '').replace(GLYPHS, '');

// Star signs. A sign's bonus is a list of fragments, some of which are the second half of a
// sentence ("+15%_to_get_a_Time" then "Candy_when_claiming"). A fragment starting with a sign or
// "{+" opens a new bonus; the rest continue the one before it. A negative bonus prints its own
// minus in the template, so it is filled with the magnitude.
const opensBonus = (template) => /^(\+|-|\{\+)/.test(template);
const starSignBonuses = (bonuses) => (bonuses || []).reduce((text, { rawName, bonus }, index) => {
  const value = rawName.includes('-{') ? Math.abs(bonus) : bonus;
  const piece = String(rawName).replace('{.{', num(value)).replace(/[{}]/g, num(value));
  if (index === 0) return piece;
  return `${text}${opensBonus(rawName) ? ', ' : ' '}${piece}`;
}, '');

// The unreachable sign and the padding rows share cost 999; the filler names are the game's own.
const isDeadSign = (sign) => !sign?.starName || /^Filler/i.test(sign.starName) || sign.cost >= 999;

const TREE_NAMES = { chronus: 'Chronus', hydron: 'Hydron', seraph: 'Seraph' };
// No sign has art of its own: the game draws each as a star in its tree's colour, SignStar1a/1b/1c
// for Chronus blue, Hydron red and Seraph green.
const TREE_STARS = { chronus: '/data/SignStar1a.png', hydron: '/data/SignStar1b.png', seraph: '/data/SignStar1c.png' };

export const starSignNodes = (starSigns) => Object.fromEntries((starSigns || [])
  .filter((sign) => !isDeadSign(sign) && sign.bonuses?.length)
  .map((sign) => [`starsign:${sign.starName}`, {
    kind: 'starsign',
    rawName: sign.starName,
    name: sign.starName,
    icon: TREE_STARS[sign.tree] || '/data/SignStar1b.png',
    category: TREE_NAMES[sign.tree] || 'Star Signs',
    description: clean(starSignBonuses(sign.bonuses))
  }]));

// A constellation's category is the world of the map it sits on, which is how the game letters
// them: A is World 1, B is World 2.
const worldOf = (mapIndex) => `World ${Math.floor(Number(mapIndex) / 50) + 1}`;
const sentence = (text) => String(text || '').replace(/[.\s_]+$/, '');

export const constellationNodes = (constellations) => Object.fromEntries((constellations || [])
  .filter((entry) => entry?.name && entry.mapIndex != null)
  .map((entry) => [`constellation:${entry.name}`, {
    kind: 'constellation',
    rawName: entry.name,
    name: `Constellation_${entry.name}`,
    // Cut from the StarSign actor's sheet (sprite-54-41, lit frame 2i+1 for StarQuests index i):
    // the game ships no standalone file per constellation.
    icon: `/etc/Constellation_${entry.rawIndex}.png`,
    // The game's own order, so the listing reads A-1, A-2 ... A-10 rather than A-1, A-10, A-2.
    order: entry.rawIndex,
    category: worldOf(entry.mapIndex),
    description: clean(`${sentence(entry.requirement)}. Worth ${entry.points} points.`)
  }]));

// Boxes level up to 400, and each of the three bonuses starts counting above a threshold (25 and
// 100 for the first two). The value shown is the maximum, since a box at level 1 reads as zero for
// two of its three lines. The thresholds are stored as 24.9 and 99.9 so the game's rounding lands
// on whole levels.
export const postBoxNodes = (postOffice) => Object.fromEntries((postOffice || [])
  .map((box, index) => [box, index])
  .filter(([box]) => box?.name && box.name !== 'Filler' && box.upgrades?.length)
  .map(([box, index]) => {
    const clauses = box.upgrades.map(({ bonus, func, x1, x2 }, bonusIndex) => {
      const threshold = bonusIndex === 0 ? 0 : box.upgradeLevels?.[bonusIndex - 1];
      const level = Math.round(box.maxLevel - (threshold || 0));
      const value = growth(func, level, x1, x2);
      if (value == null) return null;
      const from = bonusIndex > 0 && threshold ? ` (above level ${Math.ceil(threshold)})` : '';
      return `+${num(value)}${bonus}${from}`;
    }).filter(Boolean);
    return [`postbox:UIboxUpg${index}`, {
      kind: 'postbox',
      rawName: `UIboxUpg${index}`,
      name: box.name,
      icon: `/data/UIboxUpg${index}.png`,
      // The Post Office sits in YumYum Desert's town, where Bandit Bob's delivery quest sends you.
      category: 'World 2',
      description: clean(`Level ${box.maxLevel} (max): ${clauses.join(', ')}.`)
    }];
  }));

// The game names sigils in capitals; a page title in capitals shouts.
const KEEP_UPPER = new Set(['VIP']);
const titleCase = (name) => String(name).split('_')
  .map((word) => (KEEP_UPPER.has(word) ? word : word.charAt(0) + word.slice(1).toLowerCase()))
  .join('_');

export const sigilNodes = (sigils) => Object.fromEntries((sigils || [])
  .map((sigil, index) => [sigil, index])
  .filter(([sigil]) => sigil?.name && sigil.effect)
  .map(([sigil, index]) => {
    const tiers = [
      ['unlocked', sigil.unlockBonus], ['boosted', sigil.boostBonus], ['jade', sigil.jadeBonus],
      ['ethereal', sigil.etherealBonus], ['eclectic', sigil.eclecticBonus]
    ].filter(([, bonus]) => bonus != null);
    return [`sigil:aSiga${index}`, {
      kind: 'sigil',
      rawName: `aSiga${index}`,
      name: titleCase(sigil.name),
      icon: `/data/aSiga${index}.png`,
      category: 'World 2',
      description: clean(`${fill(sigil.effect, sigil.unlockBonus)}. By tier: ${tiers.map(([tier, bonus]) => `${tier} ${num(bonus)}`).join(', ')}.`)
    }];
  }));

// Upgrades are named by what they boost, and two pairs boost the same thing (Cash from Mobs,
// Artifact Find), so a repeat takes a number rather than sharing a page title.
const ARCADE_MAX_LEVEL = 100;
const arcadeName = (effect) => String(effect).replace(/^[+-]?\{%?_?/, '');

export const arcadeNodes = (arcadeShop) => {
  const seen = new Map();
  return Object.fromEntries((arcadeShop || [])
    .map((upgrade, index) => [upgrade, index])
    .filter(([upgrade]) => upgrade?.effect)
    .flatMap(([upgrade, index]) => {
      const first = growth(upgrade.func, 1, upgrade.x1, upgrade.x2);
      const max = growth(upgrade.func, ARCADE_MAX_LEVEL, upgrade.x1, upgrade.x2);
      if (first == null || max == null) return [];
      const base = arcadeName(upgrade.effect);
      const count = (seen.get(base) || 0) + 1;
      seen.set(base, count);
      return [[`arcade:PachiShopICON${index}`, {
        kind: 'arcade',
        rawName: `PachiShopICON${index}`,
        name: count > 1 ? `${base}_${count}` : base,
        icon: `/data/PachiShopICON${index}.png`,
        category: 'World 2',
        description: clean(`Level 1: ${fill(upgrade.effect, first)}. Level ${ARCADE_MAX_LEVEL} (max): ${fill(upgrade.effect, max)}.`)
      }]];
    }));
};
