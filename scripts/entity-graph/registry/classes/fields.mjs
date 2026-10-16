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

// The class of a class form's shop, through the talent that gates the form: the classTalentGates table, the
// `0 < GetBuffBonuses(<talent>, 1) && 1 == <Block>("<form>", 0, 0)` drop checks (N.js:63970). No table, no field.
export const formClassField = (data, form) => {
  const talent = gameTable(data, 'classTalentGates')?.[form];
  const owner = Number.isInteger(talent) ? classOfTalent(data, talent) : null;
  return owner ? classField(owner) : null;
};

// The class of character class id `id` (the game's CharacterClass), as a page field. No such class, no field.
export const classIdField = (data, id) => {
  const name = Number.isInteger(id) ? data.classes?.[id] : null;
  return name && data.talents?.[name] ? classField(name) : null;
};

// The one class a game text names, as a page field: an item that says which class opens a shop. None or several, no field.
export const classNamedField = (data, text) => {
  const named = Object.keys(data.talents ?? {}).filter((name) => data.classes?.includes(name) && String(text ?? '').includes(name));
  return named.length === 1 ? classField(named[0]) : null;
};

// The (?) help a class shop panel shows beside a row: the upgradeHelp section, else the help the game keeps for a row it
// draws no (?) on (the upgradeHelpUnmarked table: Arcane 10, Armory 79). Each `@` is a line break; a line holding a
// {placeholder} is an account readout and goes. A help that opens on a break only ends an account list the panel draws
// above it (Armory 75), so it is no note.
export const helpNote = (data, panel, index) => {
  const help = data.upgradeHelp?.[panel]?.[index] ?? gameTable(data, 'upgradeHelpUnmarked')?.[panel]?.[index];
  if (typeof help !== 'string' || /^_*@/.test(help)) return null;
  const lines = help.split('@').map(spaced).filter((line) => line && !line.includes('{'));
  return lines.length ? { label: 'Note', value: lines.join(' ') } : null;
};

// A class shop panel's `}`: the multiplier base + bonus / divisor, floored from a bonus of `below` on. The rule is
// the upgradePanelMultiplierPrint table, the `1e3 > <Block>("<Key>Bonus", ...)` test before the `}` replace (Grimoire
// N.js:111973, Arcane 118290, Armory 122337). No table, no term: the sentence holding the `}` goes (the build's
// dropUnfilledSentences pass).
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
