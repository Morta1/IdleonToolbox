import { gameTable, listAt } from '../data.mjs';
import { fillBonus, spaced } from '../text.mjs';

// UPKEEP: server variable A_MineHP (u.getServerVarLoad("A_MineHP"), Minehead.js:7-23) raises the HP from slot 10 on; website-data has
// no server vars, so the value is read from the fixture saves' serverVars (__test__/fixtures/latest.json, fresh.json, highend.json:
// 1.01 on 2026-10-14). Re-check it on a game patch. Not extracted: it is a server variable; N.js holds only its max(1, ...) floor.
const A_MINE_HP = 1.01;
// The mineheadOpponentHP table, Minehead:MaxHP_Opp (N.js:107681), x A_MineHP per slot past serverFrom. No table, no HP.
const hpOf = (t, data) => {
  const hp = gameTable(data, 'mineheadOpponentHP');
  return hp
    ? (hp.base + hp.perIndex * t + Math.pow(t, hp.indexPower))
      * Math.pow(hp.rate, t)
      * Math.pow(hp.firstRate, Math.floor(Math.max(0, t - hp.firstFrom) / hp.firstStep))
      * Math.pow(hp.secondRate, Math.floor(Math.max(0, t - hp.secondFrom) / hp.secondStep))
      * Math.pow(A_MINE_HP, Math.max(0, t - hp.serverFrom))
    : null;
};
// UPKEEP: the account readouts _customEvent_MineheadStuff fills into `$` on slots 1, 4 and 18 (N.js:122849); each cut keeps the
// sentence's own punctuation.
const READOUTS = [
  /_*Current_Research_AFK_rate:_\$%\./,
  /_*Based_on_your_current_weapon,_you're_getting_\$x_Damage/,
  /,_which_build_things_\$x_faster/
];
const filled = ({ bonus, value }) => fillBonus(READOUTS.reduce((out, re) => out.replace(re, ''), bonus), value);

export default {
  kind: 'mineheadopponent',
  // listIndexes names the values (mineheadBonusValues), the MineheadID sprite (mineheadSprites, Minehead.js:204), which also picks
  // the name from the mineheadNames pool (N.js:121569). An absent one leaves out the text, the art or the name.
  // UPKEEP: research[19] holds the bonus texts by opponent slot, [15] and [16] the ordinal and the title. Not extracted: only a
  // numbered event reads them (_event_3), which no locator may anchor on.
  section: (data) => {
    const values = listAt(data.research, data, 'mineheadBonusValues');
    const sprites = listAt(data.research, data, 'mineheadSprites');
    const names = listAt(data.research, data, 'mineheadNames');
    return data.research[19].map((bonus, t) => {
      const sprite = sprites ? Number(sprites[t]) : null;
      return {
        bonus,
        value: values ? Number(values[t]) : null,
        sprite,
        name: sprite === null ? undefined : names?.[sprite],
        ordinal: data.research[15][t],
        title: data.research[16][t]
      };
    });
  },
  key: (entry, index) => `MineheadOpp${index}`,
  icon: (entry) => (entry.sprite === null ? null : `/data/MineH${entry.sprite}.png`),
  fallbackIcon: '/data/MineH20.png',
  // UPKEEP: the unreleased slots read "Nothing... yet...".
  skip: (entry) => (/^Nothing/.test(entry.bonus) ? 'placeholder: no bonus yet' : false),
  describe: (entry) => (entry.value === null ? null : filled(entry)),
  fields: (entry, index, data) => [
    // The panel's own sentence (N.js:121550).
    { label: 'Presented as', value: `Your ${spaced(entry.ordinal)} opponent, ${spaced(entry.title)} ${spaced(entry.name)}` },
    { label: 'HP', value: hpOf(index, data), format: 'amount' }
  ]
};
