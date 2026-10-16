import { titleCase } from '../registry/text.mjs';
import { gameTable } from '../registry/data.mjs';

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
// sentence ("+15%_to_get_a_Time" then "Candy_when_claiming"). A fragment starting with a sign opens a new
// bonus; the rest continue the one before it ("{+_Hour_AFK_gains" is Gum Drop's "8+ hours", not a bonus). A negative bonus prints its own
// minus in the template, so it is filled with the magnitude. `{.{` is a number the game prints with
// its decimals (Blue Hedgehog's 0.0001% Ring Drop), which two decimals would round to 0.
const opensBonus = (template) => /^(\+|-)/.test(template);
const signValue = ({ rawName, bonus }) => (rawName.includes('-{') ? Math.abs(bonus) : bonus);
const fillFragment = (fragment) => String(fragment.rawName)
  .replace('{.{', String(Number(signValue(fragment))))
  .replace(/[{}]/g, num(signValue(fragment)));
const signGroups = (bonuses) => (bonuses || []).reduce((groups, fragment, index) => {
  if (index === 0 || opensBonus(fragment.rawName)) groups.push([fragment]);
  else groups[groups.length - 1].push(fragment);
  return groups;
}, []);
const starSignBonuses = (bonuses) => signGroups(bonuses).map((group) => group.map(fillFragment).join(' ')).join(', ');

// A bonus led by its number ("+{%_Total_Damage", "{+_Hour_AFK_gains") reads as a row: the stat, then the signed number.
// One whose number sits mid-sentence (the Cosmos signs) has no stat to name, so it is a row of its own sentence.
const LEADING_NUMBER = /^(?:\{(\+)|([+-]?)\{(\.\{)?([%x]?))_?/;
const signRow = (group) => {
  const [first, ...rest] = group;
  const lead = LEADING_NUMBER.exec(first.rawName);
  if (!lead || /[{}]/.test(first.rawName.slice(lead[0].length))) {
    return { label: 'Bonus', value: clean(group.map(fillFragment).join(' ')).replace(/_/g, ' ') };
  }
  const [, plus, sign = '', decimals, unit = ''] = lead;
  const value = signValue(first);
  // A continuation may carry a number of its own (the Major signs' "(If_Lv&{)"), which stays in the label.
  const label = [first.rawName.slice(lead[0].length), ...rest.map(fillFragment)].join(' ');
  return {
    label: clean(label).replace(/_/g, ' ').trim(),
    value: `${plus || sign}${decimals ? String(Number(value)) : num(value)}${unit}`
  };
};

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
    description: clean(starSignBonuses(sign.bonuses)),
    fieldsLabel: 'Bonuses',
    fields: signGroups(sign.bonuses).map(signRow),
    // The description is these rows as one sentence: it stays for search and the bot, the page shows the box.
    hideDescription: true
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
    description: clean(`${sentence(entry.requirement)}. Worth ${entry.points} points.`),
    fields: [
      { label: 'Requirement', value: clean(`${sentence(entry.requirement)}.`).replace(/_/g, ' ') },
      { label: 'Points', value: entry.points },
      { label: 'World', value: worldOf(entry.mapIndex) }
    ],
    // The description is the requirement and points again: it stays for search and the bot, the page shows the box.
    hideDescription: true
  }]));

// A box levels to its max (400 for most), and its second and third bonus only count above a threshold (25 and 100 for
// most), stored as 24.9 and 99.9 so the game's rounding lands on whole levels. Each bonus is its own line of the Effect
// box, filled at the typed level; the joined sentence is the description the bot and the meta description read.
const BOX_TOKENS = ['{', '}', '$'];

export const postBoxNodes = (postOffice) => Object.fromEntries((postOffice || [])
  .map((box, index) => [box, index])
  .filter(([box]) => box?.name && box.name !== 'Filler' && box.upgrades?.length)
  .map(([box, index]) => {
    const bonuses = box.upgrades.slice(0, BOX_TOKENS.length).map(({ bonus, func, x1, x2 }, bonusIndex) => {
      const threshold = bonusIndex === 0 ? 0 : box.upgradeLevels?.[bonusIndex - 1] ?? 0;
      return {
        term: { token: BOX_TOKENS[bonusIndex], formula: 'growthAbove', args: { func, x1, x2, offset: threshold } },
        label: threshold ? `Above level ${Math.ceil(threshold)}` : null,
        text: clean(`+${BOX_TOKENS[bonusIndex]}${bonus}`)
      };
    });
    return [`postbox:UIboxUpg${index}`, {
      kind: 'postbox',
      rawName: `UIboxUpg${index}`,
      name: box.name,
      icon: `/data/UIboxUpg${index}.png`,
      // The Post Office sits in YumYum Desert's town, where Bandit Bob's delivery quest sends you.
      category: 'World 2',
      registry: true,
      description: bonuses.map(({ label, text }) => `${label ? `${label}:_` : ''}${text}.`).join('_'),
      effect: {
        levelLabel: 'Box level',
        cap: box.maxLevel ?? null,
        // Two of a box's three bonuses start at level 25 and 100, so level 1 reads +0 on them: the page and its summary
        // open at the max, as the old sentence did.
        summaryAtCap: true,
        terms: bonuses.map(({ term }) => term),
        lines: bonuses.map(({ label, text }) => ({ label, text }))
      }
    }];
  }));

// A sigil's five tiers, each with its bonus and the Sigil EXP it takes to reach (alchemy.ts getSigilNextCost reads the
// same columns). The game's sentence at the unlocked tier says what the sigil does; the box holds every tier's number.
const SIGIL_TIERS = [
  ['Unlocked', 'unlockBonus', 'unlockCost'], ['Boosted', 'boostBonus', 'boostCost'], ['Jade', 'jadeBonus', 'jadeCost'],
  ['Ethereal', 'etherealBonus', 'etherealCost'], ['Eclectic', 'eclecticBonus', 'eclecticCost']
];
// The sign and unit the effect writes around its number ("+{%", "-{%", "{x"), so a tier's bonus reads as it does in game.
const sigilUnit = (effect) => {
  const [, sign = '', unit = ''] = /([+-]?)\{(%|x)?/.exec(String(effect)) || [];
  return (value) => `${sign}${num(value)}${unit}`;
};

export const sigilNodes = (sigils) => Object.fromEntries((sigils || [])
  .map((sigil, index) => [sigil, index])
  .filter(([sigil]) => sigil?.name && sigil.effect)
  .map(([sigil, index]) => {
    const unit = sigilUnit(sigil.effect);
    const fields = SIGIL_TIERS
      .filter(([, bonus]) => sigil[bonus] != null)
      .map(([label, bonus, cost]) => ({
        label,
        value: unit(sigil[bonus]),
        ...(sigil[cost] != null ? { cost: { value: sigil[cost], currency: 'Sigil EXP' } } : {})
      }));
    return [`sigil:aSiga${index}`, {
      kind: 'sigil',
      rawName: `aSiga${index}`,
      // The game names sigils in capitals; a page title in capitals shouts.
      name: titleCase(sigil.name),
      icon: `/data/aSiga${index}.png`,
      category: 'World 2',
      description: clean(`${fill(sigil.effect, sigil.unlockBonus)}.`),
      fieldsLabel: 'Bonus by tier',
      fields
    }];
  }));

// Upgrades are named by what they boost, and two pairs boost the same thing (Cash from Mobs,
// Artifact Find), so a repeat takes a number rather than sharing a page title.
const arcadeName = (effect) => String(effect).replace(/^[+-]?\{%?_?/, '');

// The max level is arcadeMaxLevel (DungeonCalc:ArcadeCost); without it the level field has no cap.
export const arcadeNodes = (arcadeShop, data) => {
  const seen = new Map();
  const maxLevel = gameTable(data, 'arcadeMaxLevel');
  return Object.fromEntries((arcadeShop || [])
    .map((upgrade, index) => [upgrade, index])
    .filter(([upgrade]) => upgrade?.effect)
    .flatMap(([upgrade, index]) => {
      if (growth(upgrade.func, 1, upgrade.x1, upgrade.x2) == null) return [];
      const base = arcadeName(upgrade.effect);
      const count = (seen.get(base) || 0) + 1;
      seen.set(base, count);
      return [[`arcade:PachiShopICON${index}`, {
        kind: 'arcade',
        rawName: `PachiShopICON${index}`,
        name: count > 1 ? `${base}_${count}` : base,
        icon: `/data/PachiShopICON${index}.png`,
        category: 'World 2',
        registry: true,
        description: clean(upgrade.effect),
        effect: {
          levelLabel: 'Upgrade level',
          cap: maxLevel ?? null,
          // The listing and the search snippet quote the maxed bonus, as the old "Level 100 (max)" sentence did.
          summaryAtCap: true,
          terms: [{ token: '{', formula: 'growth', args: { func: upgrade.func, x1: upgrade.x1, x2: upgrade.x2 } }]
        }
      }]];
    }));
};
