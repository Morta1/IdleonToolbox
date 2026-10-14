import { spaced } from '../text.mjs';

// UPKEEP: the panel's hover lines finish rows 0 and 9 (N.js:85395); row 0's timer is account data.
const HOVER_END = { 0: '_Storage_Chest_every_week.', 9: '.' };
// UPKEEP: Bonus GP for small guilds is row 9; its `}` is FormatBonuses of 100 minus its own decay and `]` the member cap round(L + 10) (N.js:85395, contributeGP.js:5-17).
const SMALL_GUILD = 9;
// UPKEEP: the member cap of row 9 is round(L + 10), a bigBase growth of 10 and 1 (N.js:85395).
const MEMBER_CAP = { func: 'bigBase', x1: 10, x2: 1 };
// UPKEEP: the game's hover line for row 9, its `@` read as a space (N.js:85395).
const SMALL_GUILD_NOTE = 'Upgrading this DECREASES the bonus % GP, but raises the Cap.';

export default {
  kind: 'guildbonus',
  section: 'guildBonuses',
  key: (entry, index) => `Gbonus${index}`,
  icon: (entry, index) => `/data/Gbonus${index}.png`,
  fallbackIcon: '/etc/Guild.png',
  // UPKEEP: the unreleased row reads "+{%_Nothing_Yet" with max level 0.
  skip: (entry) => (entry.maxLevel < 1 ? 'placeholder: Nothing Yet, max level 0' : false),
  describe: (entry, index) => (HOVER_END[index] ? entry.bonus.replace(/\.\.\.$/, HOVER_END[index]) : entry.bonus),
  effect: (entry, index) => ({
    levelLabel: 'Bonus level',
    cap: entry.maxLevel,
    terms: [
      { token: '{', formula: 'formatBonuses', args: { formula: 'growth', args: { func: entry.func, x1: entry.x1, x2: entry.x2 }, func: entry.func, x2: entry.x2 } },
      ...(index === SMALL_GUILD ? [
        { token: '}', formula: 'formatBonuses', args: { formula: 'growth', args: { func: 'special1', x1: entry.x1, x2: entry.x2 }, func: entry.func, x2: entry.x2 } },
        { token: ']', formula: 'growth', args: MEMBER_CAP }
      ] : [])
    ]
  }),
  cost: (entry) => ({ formula: 'growth', args: { func: 'bigBase', x1: entry.gpBaseCost, x2: entry.gpIncrease }, currency: 'GP', note: 'No discounts apply.' }),
  fields: (entry, index, data) => [
    entry.reqLevel > 0 ? { label: 'Requires', value: `${spaced(data.guildBonuses[entry.reqIndex].name)} level ${entry.reqLevel}` } : null,
    index === SMALL_GUILD ? { label: 'Note', value: SMALL_GUILD_NOTE } : null
  ].filter(Boolean)
};
