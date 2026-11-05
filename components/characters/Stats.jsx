import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { differenceInHours, differenceInMinutes } from 'date-fns';
import { formatNum, getCoinsArray } from 'utility/helpers';
import Timer from '../common/Timer';
import { formatGame } from '@utility/gameNotation';
import React from 'react';
import { getMaxDamage } from '../../parsers/damage';
import CoinDisplay from '../common/CoinDisplay';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { characterPanelFacts, characterStatFacts } from './statFacts';
import { totalStats } from './sectionSummary';
import MultiCharLockText from '@components/common/MultiCharLockText';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import StatusText from '@components/common/StatusText';
import Panel from '@components/common/cards/Panel';

const STAT_LABELS = { strength: 'STR', agility: 'AGI', wisdom: 'WIS', luck: 'LUK' };
const STAT_KEYS = { strength: 'TotalStats.STR', agility: 'TotalStats.AGI', wisdom: 'TotalStats.WIS', luck: 'TotalStats.LUK' };

// A row of the panel. A value in text heads its own drawer, so the two read alike; a drawer is named as the row is.
const Fact = ({ label, value, breakdown, notation }) => <Panel.KV label={label} value={breakdown
  ? <Breakdown asValue title={label} valueNotation={notation} data={typeof value === 'string' ? { ...breakdown, totalValue: value } : breakdown}>{value}</Breakdown>
  : value}/>;

// EXP with its bar under the number. Heads its group, so no line above; its number ends where the column's values do.
const ExpRow = ({ value, max, percent }) => <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={1} sx={{ minHeight: 36 }}>
  <Typography variant={'body2'} color={'text.secondary'} component={'div'}>EXP</Typography>
  <Stack alignItems={'flex-end'} sx={{ flex: 1, minWidth: 0, gap: '3px', pr: '22px' }}>
    <Typography component={'div'} sx={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{value} / {max}</Typography>
    <LinearProgress variant={'determinate'} value={percent} color={percent >= 100 ? 'success' : 'primary'} aria-label={'EXP'}
                    sx={{ width: '100%', maxWidth: 170, height: 4, borderRadius: 2, bgcolor: 'divider' }}/>
  </Stack>
</Stack>;

const Stats = ({ statsFilter, character, lastUpdated, account, characters }) => {
  if (!statsFilter) return null;
  const { stats, afkTime, nextPortal } = character;
  const portalLock = nextPortal?.multiCharLock;
  const playerInfo = getMaxDamage(character, characters, account);
  const facts = Object.fromEntries([
    ...characterStatFacts(character, characters, account, playerInfo),
    ...characterPanelFacts(character, characters, account, playerInfo)
  ].map((fact) => [fact.label, fact]));
  const isActive = differenceInMinutes(lastUpdated, afkTime) <= 5;
  const isOvertime = character?.activePrayers?.find(({ name }) => name === 'Unending_Energy') && differenceInHours(lastUpdated, afkTime) > 10;
  const classSkill = character?.skillsInfo?.character;
  const crystal = facts['Crystal guaranteed'] ?? facts['Crystal chance'];

  return <Panel title={'Stats'}>
    <Panel.Group label={'Attributes'}>
      <Panel.KV label={'Total stats'} value={formatNum(totalStats(stats))}/>
      {Object.entries(stats || {}).map(([statName, statValue]) => (statName !== 'level'
        ? <Panel.KV key={statName} label={STAT_LABELS[statName] ?? statName} value={STAT_KEYS[statName] ? formatGame(statValue, STAT_KEYS[statName]) : formatNum(statValue)}/>
        : null))}
    </Panel.Group>
    <Panel.Group label={'Combat'}>
      <Fact {...facts.Damage}/>
      <Fact {...facts.Defence}/>
      <Fact {...facts.HP}/>
      <Fact {...facts.MP}/>
      <Fact {...facts.Accuracy}/>
      <Fact {...facts['Crit chance']}/>
      <Fact {...facts['Crit damage']}/>
      <Fact {...facts['Movement speed']}/>
      <Fact {...facts['Respawn time']}/>
    </Panel.Group>
    <Panel.Group label={'Gains'}>
      <Fact {...facts['Drop rate']}/>
      <Fact {...facts['Cash multi']}/>
      <Fact {...facts['Golden food']}/>
      <Fact {...facts['AFK gains']}/>
      <Panel.KV label={<Stack direction={'row'} alignItems={'center'} gap={0.5} component={'span'}>
        AFK time
        {isOvertime ? <InfoButton label={'AFK time'}>This character has been AFK more than 10 hours with Unending Energy equipped.</InfoButton> : null}
      </Stack>} value={isActive ? <StatusText status={'active'}/> : afkTime ? <Timer type={'up'} date={afkTime} lastUpdated={lastUpdated} component={'span'}/> : '-'}/>
      <Fact {...facts['Kill per kill']}/>
      <Fact {...facts['Kills per hour']}/>
      <Fact {...facts['Non consume chance']}/>
      {/* The game rolls min(cap, chance), so past the cap this number stops improving and the overflow turns into
          Crystal Embiggener instead. */}
      <Panel.KV label={crystal.label} value={crystal.breakdown
        ? <Breakdown asValue title={crystal.label} data={{ ...crystal.breakdown, totalValue: crystal.value }}>
          {crystal.value}
          {crystal.capped ? <Box component={'span'} sx={{ ml: 0.5, fontWeight: 400, color: 'text.success' }}>Capped</Box> : null}
        </Breakdown>
        : crystal.value}/>
    </Panel.Group>
    <Panel.Group label={'Progress'}>
      <ExpRow value={formatNum(classSkill?.exp, 'whole')} max={formatNum(classSkill?.expReq, 'whole')}
              percent={Math.min(100, (classSkill?.exp / classSkill?.expReq * 100) || 0)}/>
      <Fact {...facts['EXP multi']}/>
      <Panel.KV label={'Money'} value={<CoinDisplay title={''} money={getCoinsArray(character?.money ? character?.money : 0)}/>}/>
      {nextPortal?.goal > 10 && nextPortal?.current < nextPortal?.goal ? <Panel.KV label={'Next portal'} value={<Stack direction={'row'} alignItems={'center'} gap={0.5} justifyContent={'flex-end'}>
        <GameIcon src={`data/${nextPortal?.currentIcon}.png`} size={16} alt={''}/>
        {formatNum(nextPortal?.current, 'whole')} / {formatNum(nextPortal?.goal, 'whole')}
      </Stack>}/> : nextPortal?.goal > 10 && portalLock?.open === false ? <Panel.KV label={'Next portal'} value={''}/> : null}
      {nextPortal?.goal > 10 && (nextPortal?.current < nextPortal?.goal || portalLock?.open === false) ? <MultiCharLockText lock={portalLock}/> : null}
    </Panel.Group>
  </Panel>;
};

export default Stats;
