import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { spaced } from '../text.mjs';

// The guild panel's hover branch (the guildBonusHover table, N.js:85395). The timer row's hover line finishes its "..."
// up to "_Next_in_", since the timer is account data. The small-guild row (Bonus GP for small guilds) ends in a full
// stop; its `}` is FormatBonuses of 100 minus its own decay, `]` the member cap round(L + memberCap)
// (contributeGP.js:5-17), and its hover line, `@` read as a space, is the note. No table, none of these.
const HOVER_LEAD = /^\.\.\./;
const hoverEnd = (index, hover) => {
  if (!hover) return null;
  if (index === hover.smallGuildRow) return '.';
  if (index !== hover.timerRow) return null;
  const line = String(hover.hover?.[index] ?? '').replace(HOVER_LEAD, '');
  const at = line.indexOf('_Next_in_');
  return at < 0 ? null : `_${line.slice(0, at)}`;
};
const smallGuildNote = (hover) => {
  const line = hover.hover?.[hover.smallGuildRow];
  return line ? `${spaced(line.replace(HOVER_LEAD, '').replace(/@/g, '_'))}.` : null;
};

const row = {
  kind: 'guildbonus',
  section: 'guildBonuses',
  key: (entry, index) => `Gbonus${index}`,
  icon: (entry, index) => `/data/Gbonus${index}.png`,
  fallbackIcon: '/etc/Guild.png',
  // UPKEEP: the unreleased row reads "+{%_Nothing_Yet" with max level 0.
  skip: (entry) => (entry.maxLevel < 1 ? 'placeholder: Nothing Yet, max level 0' : false),
  describe: (entry, index, data) => {
    const end = hoverEnd(index, gameTable(data, 'guildBonusHover'));
    return end ? entry.bonus.replace(/\.\.\.$/, end) : entry.bonus;
  },
  effect: (entry, index, data) => {
    const hover = gameTable(data, 'guildBonusHover');
    return {
      levelLabel: 'Bonus level',
      cap: entry.maxLevel,
      terms: [
        { token: '{', formula: 'formatBonuses', args: { formula: 'growth', args: { func: entry.func, x1: entry.x1, x2: entry.x2 }, func: entry.func, x2: entry.x2 } },
        ...(hover && index === hover.smallGuildRow ? [
          { token: '}', formula: 'formatBonuses', args: { formula: 'growth', args: { func: 'special1', x1: entry.x1, x2: entry.x2 }, func: entry.func, x2: entry.x2 } },
          // The game's bare round(L + memberCap): a bigBase growth of memberCap and 1.
          { token: ']', formula: 'growth', args: { func: 'bigBase', x1: hover.memberCap, x2: 1 } }
        ] : [])
      ]
    };
  },
  cost: (entry) => ({ formula: 'growth', args: { func: 'bigBase', x1: entry.gpBaseCost, x2: entry.gpIncrease }, currency: 'GP', note: 'No discounts apply.' }),
  fields: (entry, index, data) => {
    const hover = gameTable(data, 'guildBonusHover');
    return [
      entry.reqLevel > 0
        ? linked({ label: 'Unlocked by', value: `${spaced(data.guildBonuses[entry.reqIndex].name)} at level ${entry.reqLevel}` }, 'unlockedBy', nodeId(row, null, entry.reqIndex))
        : null,
      hover && index === hover.smallGuildRow ? { label: 'Note', value: smallGuildNote(hover) } : null
    ].filter(Boolean);
  }
};

export default row;
