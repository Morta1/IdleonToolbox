import { formatNum } from 'utility/helpers';
import { formatGame, cashMultiText } from '@utility/gameNotation';
import { getAfkGain, getCashMulti, getClassExpMulti, getDropRate, getRespawnRate, notateExpMulti } from '../../parsers/character';
import { getGoldenFoodMulti } from '../../parsers/misc';
import { getMaxDamage, notateDamage } from '../../parsers/damage';
import GameIconNotation from '@components/common/GameIconNotation';

// The character screen shows crit chance as 200% once it passes 199 (display only)
const CRIT_CHANCE_DISPLAY_CAP = 200;

// One stat as every page prints it: { label, value, breakdown, notation } (notation: the breakdown's own number rule).
// A number a failed section left NaN or missing isn't the player's: it reads "-", with no unit and no breakdown.
const stat = (label, number, text, extra) => (Number.isFinite(number) ? { label, value: text(number), ...extra } : { label, value: '-' });

// A drawer of one line says the trigger's number again: it carries the trigger's unit too ("180%", not "180").
const oneLine = (breakdown, text) => (breakdown?.tree?.length === 1
  ? { ...breakdown, tree: breakdown.tree.map((line) => ({ ...line, formatted: text })) }
  : breakdown);

const respawnFact = ({ respawnRate, breakdown }) => {
  // The parser's 0 means no monster to respawn: nothing to open.
  if (respawnRate === 0) return { label: 'Respawn time', value: 'Not fighting' };
  return stat('Respawn time', respawnRate, (rate) => formatNum(rate, 'pct'),
    { breakdown: oneLine(breakdown, formatNum(respawnRate, 'pct')), notation: 'Smaller' });
};

const afkFact = ({ afkGains, breakdown }) => {
  // The game shows no rate for these targets: "-", and the drawer says why.
  if (afkGains === null) return { label: 'AFK gains', value: '-', breakdown };
  return stat('AFK gains', afkGains, (gains) => `${formatGame(gains * 100, 'AFKgainrates.Fighting')}%`, { breakdown });
};

// effectiveValue, not value: the game rolls min(cap, chance), so the raw number overstates how often a crystal spawns.
// While guaranteed crystal kills remain the game shows how many are left instead of the chance.
const crystalFact = (crystalSpawnChance) => {
  const chance = crystalSpawnChance?.effectiveValue;
  if (crystalSpawnChance?.guaranteedLeft > 0) {
    return { label: 'Crystal guaranteed', value: `${formatGame(crystalSpawnChance.guaranteedLeft, 'Thingies.GuaranteedCrystalMobs', { whole: true })} left` };
  }
  return stat('Crystal chance', chance, (value) => formatNum(value, 'odds'), {
    breakdown: crystalSpawnChance?.breakdown,
    percent: formatNum(chance * 100, 'pct'),
    capped: crystalSpawnChance?.capped,
    rowText: chance > 0 ? `${formatNum(chance, 'odds')} (${formatNum(chance * 100, 'pct')})` : undefined
  });
};

// The stats /characters and the dashboard's cards both show, in one label and one format each. The game's rule where
// gameNotation names the stat.
export const characterStatFacts = (character, characters, account, playerInfo = getMaxDamage(character, characters, account) || {}) => {
  const { crystalSpawnChance, nonConsumeChance } = character || {};
  const { cashMulti, breakdown: cashBreakdown } = getCashMulti(character, account, characters, playerInfo) || {};
  const { dropRate, breakdown: dropBreakdown } = getDropRate(character, account, characters) || {};
  return [
    stat('Damage', playerInfo?.maxDamage, () => <GameIconNotation value={notateDamage(playerInfo)} sx={{ typography: 'body2', fontWeight: 500, display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'flex-end' }}/>,
      { breakdown: playerInfo?.damageBreakdown, notation: 'ThreeDecimals' }),
    // Big from 1M, as the game's HP bar (N.js:82671): the stats panel's PlayerHPmax is bare digits up to 1e8 (N.js:81962)
    stat('HP', playerInfo?.maxHp, (hp) => formatNum(hp), { breakdown: playerInfo?.breakdowns?.maxHp }),
    stat('MP', playerInfo?.maxMp, (mp) => formatNum(mp), { breakdown: playerInfo?.breakdowns?.maxMp }),
    stat('Accuracy', playerInfo?.accuracy, (accuracy) => formatGame(accuracy, 'PlayerAccTot'), { breakdown: playerInfo?.breakdowns?.accuracy }),
    stat('Movement speed', playerInfo?.movementSpeed, (speed) => `${formatGame(speed, 'PlayerSpeedBonus')}%`, { breakdown: playerInfo?.breakdowns?.movementSpeed }),
    stat('Cash multi', cashMulti, (multi) => `${cashMultiText(multi)}x`, { breakdown: cashBreakdown, notation: 'Smaller' }),
    stat('Drop rate', dropRate, (rate) => `${formatGame(rate, 'TotalStats.Drop_Rarity')}x`, { breakdown: dropBreakdown, notation: 'ThreeDecimals' }),
    respawnFact(getRespawnRate(character, account) || {}),
    afkFact(getAfkGain(character, characters, account) || {}),
    crystalFact(crystalSpawnChance),
    stat('Non consume chance', nonConsumeChance, (chance) => formatNum(chance, 'pct'))
  ];
};

// The stats only /characters shows, under the same rule
export const characterPanelFacts = (character, characters, account, playerInfo) => {
  const { value: classExp, breakdown: classExpBreakdown } = getClassExpMulti(character, account, characters);
  const { value: goldenFoodMulti, breakdown: goldenFoodBreakdown } = getGoldenFoodMulti(character, account, characters);
  return [
    stat('Golden food', goldenFoodMulti, (multi) => formatNum(Math.max(0, 100 * (multi - 1)), 'pct'), { breakdown: goldenFoodBreakdown, notation: 'Smaller' }),
    // The game's AFK line prints this whole product (N.js:66109), and the reader keys a product by its last block
    stat('Kills per hour', playerInfo?.finalKillsPerHour, (kills) => formatGame(Math.floor(kills), 'ArbitraryCode.KillPerKill')),
    stat('Kill per kill', playerInfo?.killPerkill?.value, (kills) => formatNum(kills, 'mult'), { breakdown: playerInfo?.killPerkill?.breakdown, notation: 'ThreeDecimals' }),
    stat('Defence', playerInfo?.defence?.value, (defence) => formatGame(defence, 'TotalStats.Defence'), { breakdown: playerInfo?.defence?.breakdown }),
    stat('Weapon power', playerInfo?.weaponPower, (power) => formatNum(power), { breakdown: playerInfo?.breakdowns?.weaponPower }),
    stat('Crit chance', playerInfo?.critChance, (chance) => formatNum(Math.min(CRIT_CHANCE_DISPLAY_CAP, chance), 'pct'), { breakdown: playerInfo?.breakdowns?.critChance }),
    stat('Crit damage', playerInfo?.critDamage, (damage) => formatNum(damage, 'mult'), { breakdown: playerInfo?.breakdowns?.critDamage, notation: 'ThreeDecimals' }),
    stat('EXP multi', classExp, (multi) => <GameIconNotation value={notateExpMulti(multi)} sx={{ typography: 'body2', fontWeight: 500, display: 'inline-flex' }}/>,
      { breakdown: classExpBreakdown, notation: 'Smaller' })
  ];
};
