import { spaced } from '../text.mjs';
import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';

// The class a class-specific system belongs to, as a page field linking the class page.
export const classField = (rawName) => linked({ label: 'Class', value: spaced(rawName) }, 'belongsTo', `class:${rawName}`);

// The class whose talent tab lists talent `id`; null when no tab or several do.
const classOfTalent = (data, id) => {
  const owners = Object.keys(data.talents ?? {})
    .filter((tab) => Object.values(data.talents[tab] ?? {}).some((talent) => talent?.skillIndex === id));
  return owners.length === 1 ? owners[0] : null;
};

// The class of a class form's shop, through the talent that gates the form: wikiTables.classTalentGates, the
// `0 < GetBuffBonuses(<talent>, 1) && 1 == <Block>("<form>", 0, 0)` drop checks (N.js:63970). No table, no field.
export const formClassField = (data, form) => {
  const talent = gameTable(data, 'classTalentGates')?.[form];
  const owner = Number.isInteger(talent) ? classOfTalent(data, talent) : null;
  return owner ? classField(owner) : null;
};

// A class shop panel's `}`: the multiplier base + bonus / divisor, floored from a bonus of `below` on. The rule is
// wikiTables.upgradePanelMultiplierPrint, the `1e3 > <Block>("<Key>Bonus", ...)` test before the `}` replace (Grimoire
// N.js:111973, Arcane 118290, Armory 122337). No table, no term: the `}` is left as written.
export const multiplierTerm = (data, panel, perLevel) => {
  const print = gameTable(data, 'upgradePanelMultiplierPrint')?.[panel];
  return print
    ? {
      token: '}',
      formula: 'rounded',
      args: {
        formula: 'growth',
        args: { func: 'bigBase', x1: print.base, x2: perLevel / print.divisor },
        mode: 'floor',
        from: print.base + print.below / print.divisor
      }
    }
    : null;
};

// How much of the system's own upgrade levels must be bought before the game shows a row; nothing for a row that always shows.
export const unlocksAt = (count, system) => (count > 0
  ? { label: 'Unlocks at', value: `${count.toLocaleString('en-US')} total ${system} upgrade level${count === 1 ? '' : 's'}` }
  : null);
