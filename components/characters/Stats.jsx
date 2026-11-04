import { Box, Stack, Typography } from '@mui/material';
import { differenceInHours, differenceInMinutes } from 'date-fns';
import { formatNum, getCoinsArray } from 'utility/helpers';
import Timer from '../common/Timer';
import { getAfkGain, getCashMulti, getClassExpMulti, getDropRate, getRespawnRate, notateExpMulti } from '../../parsers/character';
import { getGoldenFoodMulti } from '../../parsers/misc';
import { formatGame } from '@utility/gameNotation';
import React from 'react';
import { getMaxDamage, notateDamage } from '../../parsers/damage';
import CoinDisplay from '../common/CoinDisplay';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import GameIconNotation from '@components/common/GameIconNotation';
import MultiCharLockText from '@components/common/MultiCharLockText';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import StatusText from '@components/common/StatusText';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';

// The character screen shows crit chance as 200% once it passes 199 (display only)
const CRIT_CHANCE_DISPLAY_CAP = 200;

const STAT_LABELS = { strength: 'STR', agility: 'AGI', wisdom: 'WIS', luck: 'LUK' };
const STAT_KEYS = { strength: 'TotalStats.STR', agility: 'TotalStats.AGI', wisdom: 'TotalStats.WIS', luck: 'TotalStats.LUK' };

// A percent never reads with K beside numbers that don't ("6.4K%"): from 1,000 it takes commas (the 5l walk's call)
const percentText = (value) => (value < 1000 ? formatNum(value, 'pct') : `${formatNum(value)}%`);

// The game's Cash multi fill: Big past 1e16, its own B past 1e10 and M past 1e7, MultiplierInfo under.
const cashMultiText = (value) => (value > 1e16 || value <= 1e7 ? formatGame(value, 'ArbitraryCode.MonsterCash')
  : value > 1e10 ? `${Math.floor(value / 1e8) / 10}B` : `${Math.floor(value / 1e5) / 10}M`);

// The stats /characters and the dashboard's cards both show, in one label and one format each: { label, value, breakdown,
// notation } (notation: the breakdown's own number rule). The game's rule where gameNotation names the stat.
export const characterStatFacts = (character, characters, account, playerInfo = getMaxDamage(character, characters, account) || {}) => {
  const { crystalSpawnChance, nonConsumeChance } = character || {};
  const { cashMulti, breakdown: cashBreakdown } = getCashMulti(character, account, characters, playerInfo) || {};
  const { dropRate, breakdown: dropBreakdown } = getDropRate(character, account, characters) || {};
  const { respawnRate, breakdown: respawnBreakdown } = getRespawnRate(character, account) || {};
  const { afkGains, breakdown: afkBreakdown } = getAfkGain(character, characters, account) || {};
  const guaranteed = crystalSpawnChance?.guaranteedLeft > 0;
  return [
    { label: 'Damage', value: <GameIconNotation value={notateDamage(playerInfo)} sx={{ typography: 'body2', fontWeight: 500, display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'flex-end' }}/>, breakdown: playerInfo?.damageBreakdown, notation: 'ThreeDecimals' },
    { label: 'HP', value: formatNum(playerInfo?.maxHp) },
    { label: 'MP', value: formatNum(playerInfo?.maxMp) },
    { label: 'Accuracy', value: formatNum(playerInfo?.accuracy) },
    { label: 'Movement speed', value: percentText(playerInfo?.movementSpeed) },
    { label: 'Cash multi', value: cashMulti == null ? '-' : `${cashMultiText(cashMulti)}x`, breakdown: cashBreakdown, notation: 'Smaller' },
    { label: 'Drop rate', value: dropRate == null ? '-' : `${formatGame(dropRate, 'TotalStats.Drop_Rarity')}x`, breakdown: dropBreakdown, notation: 'ThreeDecimals' },
    { label: 'Respawn time', value: formatNum(respawnRate, 'pct'), breakdown: respawnBreakdown, notation: 'Smaller' },
    { label: 'AFK gains', value: afkGains == null ? '-' : `${formatGame(afkGains * 100, 'AFKgainrates.Fighting')}%`, breakdown: afkBreakdown },
    // effectiveValue, not value: the game rolls min(cap, chance), so the raw number overstates how often a crystal spawns
    guaranteed
      ? { label: 'Crystal guaranteed', value: `${formatGame(crystalSpawnChance.guaranteedLeft, 'Thingies.GuaranteedCrystalMobs')} left` }
      : { label: 'Crystal chance', value: formatNum(crystalSpawnChance?.effectiveValue, 'odds'), breakdown: crystalSpawnChance?.breakdown },
    { label: 'Non consume chance', value: formatNum(nonConsumeChance, 'pct') }
  ];
};

// A row of the panel. A value in text heads its own drawer, so the two read alike; a drawer is named as the row is.
const Fact = ({ label, value, breakdown, notation }) => <Panel.KV label={label} value={breakdown
  ? <Breakdown asValue title={label} valueNotation={notation} data={typeof value === 'string' ? { ...breakdown, totalValue: value } : breakdown}>{value}</Breakdown>
  : value}/>;

const Stats = ({ statsFilter, character, lastUpdated, account, characters }) => {
  if (!statsFilter) return null;
  const { stats, afkTime, crystalSpawnChance, nextPortal } = character;
  const portalLock = nextPortal?.multiCharLock;
  const { value: classExp, breakdown: classExpBreakdown } = getClassExpMulti(character, account, characters);
  const { value: goldenFoodMulti, breakdown: goldenFoodBreakdown } = getGoldenFoodMulti(character, account, characters);
  const playerInfo = getMaxDamage(character, characters, account);
  const facts = Object.fromEntries(characterStatFacts(character, characters, account, playerInfo).map((fact) => [fact.label, fact]));
  const isActive = differenceInMinutes(lastUpdated, afkTime) <= 5;
  const isOvertime = character?.activePrayers?.find(({ name }) => name === 'Unending_Energy') && differenceInHours(lastUpdated, afkTime) > 10;
  const totalStats = Object.entries(stats || {}).reduce((sum, [statName, statValue]) => sum + (statName !== 'level' ? statValue : 0), 0);
  const classSkill = character?.skillsInfo?.character;
  const guaranteed = crystalSpawnChance?.guaranteedLeft > 0;
  const crystalPercent = crystalSpawnChance?.effectiveValue * 100;

  return <Panel title={'Stats'}>
    <Box sx={{ py: 0.75 }}>
      <Panel.KV label={'Total stats'} value={formatNum(totalStats)}/>
      {Object.entries(stats || {}).map(([statName, statValue]) => (statName !== 'level'
        ? <Panel.KV key={statName} label={STAT_LABELS[statName] ?? statName} value={STAT_KEYS[statName] ? formatGame(statValue, STAT_KEYS[statName]) : formatNum(statValue)}/>
        : null))}
      <Fact {...facts['Cash multi']}/>
      <Fact label={'Golden food'} value={percentText(Math.max(0, 100 * (goldenFoodMulti - 1)))} breakdown={goldenFoodBreakdown} notation={'Smaller'}/>
      <Fact {...facts.HP}/>
      <Fact {...facts.MP}/>
      <Fact label={'Kills per hour'} value={formatNum(Math.floor(playerInfo?.finalKillsPerHour))}/>
      <Fact label={'Kill per kill'} value={formatNum(playerInfo?.killPerkill?.value, 'mult')} breakdown={playerInfo?.killPerkill?.breakdown} notation={'ThreeDecimals'}/>
      <Fact label={'Defence'} value={formatGame(playerInfo?.defence?.value, 'TotalStats.Defence')} breakdown={playerInfo?.defence?.breakdown}/>
      <Fact label={'Crit chance'} value={formatNum(Math.min(CRIT_CHANCE_DISPLAY_CAP, playerInfo?.critChance ?? 0), 'pct')}/>
      <Fact label={'Crit damage'} value={formatNum(playerInfo?.critDamage, 'mult')}/>
      <Fact {...facts.Accuracy}/>
      <Fact {...facts['Movement speed']}/>
      <Fact {...facts.Damage}/>
      <Fact {...facts['Drop rate']}/>
      <Fact {...facts['Respawn time']}/>
      <Fact {...facts['AFK gains']}/>
      <Fact {...facts['Non consume chance']}/>
      <Box sx={{ px: 2, py: 0.75 }}>
        <ItemCard.Progress label={'EXP'} value={formatNum(classSkill?.exp)} max={formatNum(classSkill?.expReq)}
                           percent={Math.min(100, (classSkill?.exp / classSkill?.expReq * 100) || 0)}/>
      </Box>
      <Fact label={'EXP multi'} value={<GameIconNotation value={notateExpMulti(classExp)} sx={{ typography: 'body2', fontWeight: 500, display: 'inline-flex' }}/>}
            breakdown={classExpBreakdown} notation={'Smaller'}/>
      <Panel.KV label={'Money'} value={<CoinDisplay title={''} money={getCoinsArray(character?.money ? character?.money : 0)}/>}/>
      {nextPortal?.goal > 10 && (nextPortal?.current < nextPortal?.goal || portalLock?.open === false) ? <Box>
        {nextPortal?.current < nextPortal?.goal ? <Panel.KV label={'Next portal'} value={<Stack direction={'row'} alignItems={'center'} gap={0.5}>
          <GameIcon src={`data/${nextPortal?.currentIcon}.png`} size={16} alt={''}/>
          {formatNum(nextPortal?.current)} / {formatNum(nextPortal?.goal)}
        </Stack>}/> : <Panel.KV label={'Next portal'} value={''}/>}
        <Box sx={{ px: 2 }}><MultiCharLockText lock={portalLock}/></Box>
      </Box> : null}
      {/* While guaranteed crystal kills remain the game shows how many are left instead of the chance */}
      <Panel.KV label={facts['Crystal guaranteed']?.label ?? 'Crystal chance'} value={guaranteed ? facts['Crystal guaranteed'].value : <Stack alignItems={'flex-end'}>
        {/* The game rolls min(cap, chance), so past the cap this number stops improving and the overflow turns into
            Crystal Embiggener instead. */}
        <Breakdown asValue title={'Crystal chance'} data={crystalSpawnChance?.breakdown && { ...crystalSpawnChance.breakdown, totalValue: facts['Crystal chance'].value }}>
          {facts['Crystal chance'].value}
        </Breakdown>
        <Typography variant={'caption'} color={'text.secondary'}>{formatNum(crystalPercent, 'pct')}</Typography>
        {crystalSpawnChance?.capped ? <StatusText status={'info'}>Capped</StatusText> : null}
      </Stack>}/>
      <Panel.KV label={<Stack direction={'row'} alignItems={'center'} gap={0.5} component={'span'}>
        AFK time
        {isOvertime ? <InfoButton label={'AFK time'}>This character has been AFK more than 10 hours with Unending Energy equipped.</InfoButton> : null}
      </Stack>} value={isActive ? <StatusText status={'active'}/> : <Timer type={'up'} date={afkTime} lastUpdated={lastUpdated} component={'span'}/>}/>
    </Box>
  </Panel>;
};

export default Stats;
