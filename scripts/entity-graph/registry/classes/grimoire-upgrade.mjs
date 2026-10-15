import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { spaced } from '../text.mjs';
import { formClassField, helpNote, multiplierTerm, unlocksAt } from './fields.mjs';

// UPKEEP: the ladder rows end in "_Target:$", which is an account readout (N.js:111974).
const LADDER_TAIL = /_Target:\$$/;

// The ladder this row fills `$` from, if it is a ladder row: the grimoireLadder table, the panel's `13 == <row>` tests
// that read RANDOlist[104] (N.js:111974).
const ladderOf = (index, data) => {
  const ladder = gameTable(data, 'grimoireLadder');
  return ladder?.rows.includes(index) ? ladder : null;
};

// The bone a row costs: item Bone<type> without its "_(Dungeon)" tag, and the plural the "<bones>_owned" descriptions
// use, else the singular alone.
const boneOf = (type, data) => {
  const one = String(data.items?.[`Bone${type}`]?.displayName ?? '').replace(/_\(Dungeon\)$/, '');
  if (!one) return {};
  const many = data.grimoire
    .map(({ description }) => String(description).split('_'))
    .map((words) => words.find((word, at) => words[at + 1] === 'owned' && word.startsWith(one)))
    .find(Boolean) ?? one;
  return { currency: many, ...(many !== one ? { currencyOne: one } : {}) };
};

// The row Writhing Grimoire boosts this one from: the grimoireNotWrithed table, GrimoireUpgBonus's leading
// `9 == t || 11 == t || ...` (rows it does not multiply) and its self-call (N.js:106384).
const writhingOf = (index, data) => {
  const writhed = gameTable(data, 'grimoireNotWrithed');
  return writhed && !writhed.notMultiplied.includes(index) && data.grimoire[writhed.multiplierRow] ? writhed.multiplierRow : null;
};

const row = {
  kind: 'grimoireupgrade',
  section: 'grimoire',
  key: (entry, index) => `GrimoireUpg${index}`,
  // UPKEEP: the numbered rows carry a "_(#)" stack count readout (N.js:111965).
  name: (entry) => entry.name.replace(/_\(#\)$/, ''),
  icon: (entry, index) => `/data/GrimoireUpg${index}.png`,
  fallbackIcon: '/data/GrimoireUpg18.png',
  // UPKEEP: unreleased rows are named Ripped_Page ("These pages are missing...").
  skip: (entry) => (entry.name === 'Ripped_Page' ? 'placeholder: missing page' : false),
  describe: (entry, index, data) => (ladderOf(index, data) ? entry.description.replace(LADDER_TAIL, '') : entry.description),
  effect: (entry, index, data) => ({
    levelLabel: 'Upgrade level',
    // UPKEEP: the buy check is level < x4 (N.js:111301, 111983), so 999999 is a real cap even though the panel prints "Lv x/max" only
    // below 999 (N.js:111979).
    cap: entry.x4,
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.x5 } },
      multiplierTerm(data, 'grimoire', entry.x5)
    ].filter(Boolean)
  }),
  // The grimoireUpgradeCost table, GrimoireUpgCost (N.js:106375): scale x indexRate^t x (L + (x1 + L) x (x2 + rateBump)^L),
  // before the masterclass discounts. No table, no price.
  cost: (entry, index, data) => {
    const price = gameTable(data, 'grimoireUpgradeCost');
    return price
      ? {
        formula: 'notateBig',
        args: {
          formula: 'affinePowPlusLevel',
          args: { scale: price.scale * Math.pow(price.indexRate, index), base: entry.x1, rate: entry.x2 + price.rateBump }
        },
        ...boneOf(entry.boneType, data)
      }
      : null;
  },
  costs: (entry) => [{ item: `Bone${entry.boneType}` }],
  fields: (entry, index, data) => {
    const writhing = writhingOf(index, data);
    const ladder = ladderOf(index, data);
    const targets = ladder ? data.randomList?.[ladder.list] : null;
    const first = targets?.length ? data.monsters?.[targets[0]]?.Name : null;
    return [
      // The Grimoire is the shop of Wraith Form (GrimoireWraith).
      formClassField(data, 'GrimoireWraith'),
      // UPKEEP: GrimoireUpgUNLOCKED counts the rows by unlockLevel against the total; the panel's locked line is N.js:111986.
      unlocksAt(entry.unlockLevel, 'Grimoire'),
      writhing === null ? null : linked({ label: 'Boosted by', value: spaced(data.grimoire[writhing].name) }, 'boostedBy', nodeId(row, null, writhing)),
      first ? { label: 'Targets', value: `${targets.length} targets in turn, starting with ${spaced(first)}` } : null,
      // The (?) help the panel shows beside a row (N.js:111988).
      helpNote(data, 'grimoire', index)
    ].filter(Boolean);
  }
};

export default row;
