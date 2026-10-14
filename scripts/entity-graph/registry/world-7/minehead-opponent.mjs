import { formatAmount } from '../../../../utility/wiki/effects.mjs';

// UPKEEP: server variable A_MineHP (u.getServerVarLoad("A_MineHP"), Minehead.js:7-23) raises the HP from slot 10 on; website-data has
// no server vars, so the value is read from the fixture saves' serverVars (__test__/fixtures/latest.json, fresh.json, highend.json:
// 1.01 on 2026-10-14). Re-check it on a game patch.
const A_MINE_HP = 1.01;
// UPKEEP: MaxHP_Opp (Minehead.js:17-23): every constant is the game's.
const hpOf = (t) => (5 + 2 * t + t * t)
  * Math.pow(1.8, t)
  * Math.pow(1.85, Math.floor(Math.max(0, t - 4) / 3))
  * Math.pow(4, Math.floor(Math.max(0, t - 5) / 7))
  * Math.pow(A_MINE_HP, Math.max(0, t - 9));
// UPKEEP: the account readouts _customEvent_MineheadStuff fills into `$` on slots 1, 4 and 18 (N.js:122849); each cut keeps the
// sentence's own punctuation.
const READOUTS = [
  /_*Current_Research_AFK_rate:_\$%\./,
  /_*Based_on_your_current_weapon,_you're_getting_\$x_Damage/,
  /,_which_build_things_\$x_faster/
];
// The same branch fills `{` with round(value) and `}` with MultiplierInfo(1 + value / 100) (N.js:122849); the wiki rounds the
// multiplier to two decimals as the pristine charm pages do ("1.1x" where the panel pads "1.10x").
const multiplierOf = (value) => Math.round((1 + value / 100) * 100) / 100;
const filled = ({ bonus, value }) => READOUTS.reduce((out, re) => out.replace(re, ''), bonus)
  .split('{').join(formatAmount(Math.round(value)))
  .split('}').join(multiplierOf(value).toLocaleString('en-US', { maximumFractionDigits: 2 }));
const spaced = (text) => String(text || '').replace(/_/g, ' ');

export default {
  kind: 'mineheadopponent',
  // UPKEEP: research[19] holds the bonus texts by opponent slot, [20] the values, [10] the MineheadID sprite (Minehead.js:204), which
  // also picks the name from the [11] pool (N.js:121569); [15] and [16] are the ordinal and the title.
  section: (data) => data.research[19].map((bonus, t) => ({
    bonus,
    value: Number(data.research[20][t]),
    sprite: Number(data.research[10][t]),
    name: data.research[11][Number(data.research[10][t])],
    ordinal: data.research[15][t],
    title: data.research[16][t]
  })),
  key: (entry, index) => `MineheadOpp${index}`,
  icon: (entry) => `/data/MineH${entry.sprite}.png`,
  fallbackIcon: '/data/MineH20.png',
  // UPKEEP: the unreleased slots read "Nothing... yet...".
  skip: (entry) => (/^Nothing/.test(entry.bonus) ? 'placeholder: no bonus yet' : false),
  describe: filled,
  fields: (entry, index) => [
    // The panel's own sentence (N.js:121550).
    { label: 'Presented as', value: `Your ${spaced(entry.ordinal)} opponent, ${spaced(entry.title)}` },
    { label: 'HP', value: formatAmount(hpOf(index)) }
  ]
};
