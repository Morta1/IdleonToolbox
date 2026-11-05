import { Box, Stack, Typography } from '@mui/material';
import { differenceInHours, differenceInMinutes } from 'date-fns';
import { formatNum, getCoinsArray } from 'utility/helpers';
import Timer from '../common/Timer';
import { formatGame } from '@utility/gameNotation';
import React from 'react';
import { getMaxDamage } from '../../parsers/damage';
import CoinDisplay from '../common/CoinDisplay';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { characterPanelFacts, characterStatFacts } from './statFacts';
import MultiCharLockText from '@components/common/MultiCharLockText';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import StatusText from '@components/common/StatusText';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';

const STAT_LABELS = { strength: 'STR', agility: 'AGI', wisdom: 'WIS', luck: 'LUK' };
const STAT_KEYS = { strength: 'TotalStats.STR', agility: 'TotalStats.AGI', wisdom: 'TotalStats.WIS', luck: 'TotalStats.LUK' };

// A row of the panel. A value in text heads its own drawer, so the two read alike; a drawer is named as the row is.
const Fact = ({ label, value, breakdown, notation }) => <Panel.KV label={label} value={breakdown
  ? <Breakdown asValue title={label} valueNotation={notation} data={typeof value === 'string' ? { ...breakdown, totalValue: value } : breakdown}>{value}</Breakdown>
  : value}/>;

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
  const totalStats = Object.entries(stats || {}).reduce((sum, [statName, statValue]) => sum + (statName !== 'level' ? statValue : 0), 0);
  const classSkill = character?.skillsInfo?.character;
  const crystal = facts['Crystal guaranteed'] ?? facts['Crystal chance'];

  return <Panel title={'Stats'}>
    <Box>
      <Panel.KV label={'Total stats'} value={formatNum(totalStats)}/>
      {Object.entries(stats || {}).map(([statName, statValue]) => (statName !== 'level'
        ? <Panel.KV key={statName} label={STAT_LABELS[statName] ?? statName} value={STAT_KEYS[statName] ? formatGame(statValue, STAT_KEYS[statName]) : formatNum(statValue)}/>
        : null))}
      <Fact {...facts['Cash multi']}/>
      <Fact {...facts['Golden food']}/>
      <Fact {...facts.HP}/>
      <Fact {...facts.MP}/>
      <Fact {...facts['Kills per hour']}/>
      <Fact {...facts['Kill per kill']}/>
      <Fact {...facts.Defence}/>
      <Fact {...facts['Crit chance']}/>
      <Fact {...facts['Crit damage']}/>
      <Fact {...facts.Accuracy}/>
      <Fact {...facts['Movement speed']}/>
      <Fact {...facts.Damage}/>
      <Fact {...facts['Drop rate']}/>
      <Fact {...facts['Respawn time']}/>
      <Fact {...facts['AFK gains']}/>
      <Fact {...facts['Non consume chance']}/>
      <Box sx={{ py: 0.75 }}>
        <ItemCard.Progress label={'EXP'} value={formatNum(classSkill?.exp, 'whole')} max={formatNum(classSkill?.expReq, 'whole')}
                           percent={Math.min(100, (classSkill?.exp / classSkill?.expReq * 100) || 0)}/>
      </Box>
      <Fact {...facts['EXP multi']}/>
      <Panel.KV label={'Money'} value={<CoinDisplay title={''} money={getCoinsArray(character?.money ? character?.money : 0)}/>}/>
      {nextPortal?.goal > 10 && (nextPortal?.current < nextPortal?.goal || portalLock?.open === false) ? <Box>
        {nextPortal?.current < nextPortal?.goal ? <Panel.KV label={'Next portal'} value={<Stack direction={'row'} alignItems={'center'} gap={0.5}>
          <GameIcon src={`data/${nextPortal?.currentIcon}.png`} size={16} alt={''}/>
          {formatNum(nextPortal?.current, 'whole')} / {formatNum(nextPortal?.goal, 'whole')}
        </Stack>}/> : <Panel.KV label={'Next portal'} value={''}/>}
        <MultiCharLockText lock={portalLock}/>
      </Box> : null}
      <Panel.KV label={crystal.label} value={crystal.breakdown ? <Stack alignItems={'flex-end'}>
        {/* The game rolls min(cap, chance), so past the cap this number stops improving and the overflow turns into
            Crystal Embiggener instead. */}
        <Breakdown asValue title={crystal.label} data={{ ...crystal.breakdown, totalValue: crystal.value }}>
          {crystal.value}
        </Breakdown>
        <Typography variant={'caption'} color={'text.secondary'}>{crystal.percent}</Typography>
        {crystal.capped ? <StatusText status={'info'}>Capped</StatusText> : null}
      </Stack> : crystal.value}/>
      <Panel.KV label={<Stack direction={'row'} alignItems={'center'} gap={0.5} component={'span'}>
        AFK time
        {isOvertime ? <InfoButton label={'AFK time'}>This character has been AFK more than 10 hours with Unending Energy equipped.</InfoButton> : null}
      </Stack>} value={isActive ? <StatusText status={'active'}/> : <Timer type={'up'} date={afkTime} lastUpdated={lastUpdated} component={'span'}/>}/>
    </Box>
  </Panel>;
};

export default Stats;
