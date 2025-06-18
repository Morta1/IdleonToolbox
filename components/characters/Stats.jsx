import InfoIcon from '@mui/icons-material/Info';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { differenceInHours, differenceInMinutes } from 'date-fns';
import {
  cashFormatter,
  getCoinsArray,
  kFormatter,
  notateNumber,
  numberWithCommas,
  pascalCase,
  prefix
} from 'utility/helpers';
import Timer from '../common/Timer';
import Tooltip from '../Tooltip';
import Activity from './Activity';
import { TitleAndValue } from '../common/styles';
import { getAfkGain, getCashMulti, getClassExpMulti, getDropRate, getRespawnRate } from '../../parsers/character';
import React, { useMemo } from 'react';
import { getMaxDamage, notateDamage } from '../../parsers/damage';
import processString from 'react-process-string';
import styled from '@emotion/styled';
import CoinDisplay from '../common/CoinDisplay';
import ProgressBar from '@components/common/ProgressBar';

const colors = {
  strength: 'error.light',
  agility: 'success.light',
  wisdom: 'secondary',
  luck: 'warning.light'
};

const Stats = ({ activityFilter, statsFilter, character, lastUpdated, account, characters }) => {
  const { name, playerId, stats, afkTime, crystalSpawnChance, nextPortal, afkTarget, nonConsumeChance } = character;
  const { cashMulti, breakdown } = useMemo(() => getCashMulti(character, account, characters) || {},
    [character, account]);
  const { dropRate, breakdown: drBreakdown } = useMemo(() => getDropRate(character, account, characters) || {},
    [character, account]);
  const { respawnRate, breakdown: rtBreakdown } = useMemo(() => getRespawnRate(character, account) || {},
    [character, account]);
  const { afkGains, breakdown: agBreakdown } = useMemo(() => getAfkGain(character, characters, account), [character,
    account]);
  const {
    value: classExp,
    breakdown: classExpBreakdown
  } = useMemo(() => getClassExpMulti(character, account, characters), [character,
    account]);
  const playerInfo = useMemo(() => getMaxDamage(character, characters, account), [character, account]);


  const isOvertime = () => {
    const hasUnendingEnergy = character?.activePrayers?.find(({ name }) => name === 'Unending_Energy');
    const timePassed = new Date().getTime() + (afkTime - lastUpdated);
    const hours = differenceInHours(new Date(), new Date(timePassed));
    return hasUnendingEnergy && hours > 10;
  };

  const isActive = () => {
    const timePassed = new Date().getTime() + (afkTime - lastUpdated);
    const minutes = differenceInMinutes(new Date(), new Date(timePassed));
    return minutes <= 5;
  };

  const getTotalStats = useMemo(() => (character) => {
    return Object.entries(character?.stats || {})?.reduce((sum, [statName, statValue]) => sum + (statName !== 'level'
      ? statValue
      : 0), 0);
  }, [character]);
  return (
    <>
      <Stack gap={2} flexWrap={'wrap'}>
        {activityFilter ?
          <Activity afkTarget={afkTarget} divStyle={character?.divStyle} playerId={playerId} account={account}/> : null}
        {statsFilter ? <>
          <Stack sx={{ minWidth: 250 }} flexWrap={'wrap'} gap={1} divider={<Divider/>}>
            <Stat title={'Total Stats'} value={getTotalStats(character)}/>
            {Object.entries(stats || {})?.map(([statName, statValue], index) => {
              return statName !== 'level' ? (
                <Stack key={`${name}-${statName}-${index}`} direction={'row'} justifyContent={'space-between'}>
                  <Typography component={'span'}
                              variant={'body1'}
                              color={colors?.[statName] || 'info.light'}>
                    {pascalCase(statName)}
                  </Typography>
                  <Typography variant={'body1'}
                              component={'span'}>{Math.floor(statValue)}</Typography>
                </Stack>
              ) : null;
            })}
            <Stat title={'Cash Multiplier'} useDoubleColumn value={`${cashFormatter(cashMulti, 2)}x`}
                  breakdown={breakdown} breakdownNotation={'Smaller'}/>
            <Stat title={'HP'} value={notateNumber(playerInfo?.maxHp)}/>
            <Stat title={'MP'} value={notateNumber(playerInfo?.maxMp)}/>
            <Stat title={'Kills Per Hour'}
                  value={playerInfo?.finalKillsPerHour > 1e6
                    ? notateNumber(playerInfo?.finalKillsPerHour)
                    : numberWithCommas(Math.floor(playerInfo?.finalKillsPerHour))}/>
            <Stat title={'Defence'} value={notateNumber(playerInfo?.defence?.value)}
                  breakdown={playerInfo?.defence?.breakdown}/>
            <Stat title={'Critical Chance'} value={`${notateNumber(playerInfo?.critChance)}%`}/>
            <Stat title={'Critical Damage'} value={`${notateNumber(playerInfo?.critDamage, 'MultiplierInfo')}x`}/>
            <Stat title={'Accuracy'} value={notateNumber(playerInfo?.accuracy)}/>
            <Stat title={'Movement Speed'} value={notateNumber(playerInfo?.movementSpeed)}/>
            <Stat title={'Mining Efficiency'} value={notateNumber(playerInfo?.miningEff)}/>
            <Stat title={'Damage'} damage value={notateDamage(playerInfo)}/>
            <Stat title={'Drop Rate'} value={`${notateNumber(dropRate, 'MultiplierInfo')}x`}
                  breakdown={drBreakdown} breakdownNotation={'Smaller'} useDoubleColumn/>
            <Stat title={'Respawn Time'}
                  value={`${notateNumber(respawnRate, 'MultiplierInfo')}%`}
                  breakdown={rtBreakdown} breakdownNotation={'Smaller'}/>
            <Stat title={'AFK Gains'}
                  useDoubleColumn
                  value={`${notateNumber(afkGains * 100, 'MultiplierInfo')}%`}
                  breakdown={agBreakdown} breakdownNotation={'Smaller'}/>
            <Stat title={'Non Consume Chance'}
                  value={`${kFormatter(nonConsumeChance, 2)}%`}
            />
            <Stack direction={'row'} gap={2}>
              <Typography color={'info.light'}>Exp</Typography>
              <ProgressBar
                boxSx={{ width: '100%' }}
                tooltipTitle={`${notateNumber(character?.skillsInfo?.character?.exp)} / ${notateNumber(character?.skillsInfo?.character?.expReq)}`}
                percent={character?.skillsInfo?.character?.exp / character?.skillsInfo?.character?.expReq * 100}/>
            </Stack>
            <Stat title={'Exp multi'} value={`${notateNumber(classExp, 'MultiplierInfo')}x`}
                  breakdown={classExpBreakdown} breakdownNotation={'Smaller'} useDoubleColumn/>
            <Stat title={'Money'}
                  value={<CoinDisplay title={''}
                                      money={getCoinsArray(character?.money ? character?.money : 0)}/>}
            />
            {nextPortal?.goal > 10 && nextPortal?.current < nextPortal?.goal ? (
              <Card variant={'outlined'}>
                <CardContent>
                  <Typography color={'info.light'}>Next Portal</Typography>
                  <Stack direction={'row'} alignItems={'center'} gap={1}>
                    <img width={32} height={32} src={`${prefix}data/${nextPortal?.currentIcon}.png`} alt=""/>
                    <Typography>{`${kFormatter(nextPortal?.current)} / ${kFormatter(nextPortal?.goal)}`}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            ) : null}
          </Stack>

          <Card variant={'outlined'}>
            <CardContent>
              <Typography color={'info.light'}>Crystal Chance</Typography>
              <Stack direction={'row'} gap={1}>
                <Typography>{`1 in ${Math.floor(1 / crystalSpawnChance?.value)}`} ({notateNumber(crystalSpawnChance?.value * 100, 'MultiplierInfo')?.replace('.00', '')}%)</Typography>
                <Tooltip title={<BreakdownTooltip titleWidth={180} breakdown={crystalSpawnChance?.breakdown}
                                                  notate={'MultiplierInfo'}/>}>
                  <InfoIcon/>
                </Tooltip>
              </Stack>
            </CardContent>
          </Card>
          <Card variant={'outlined'}>
            <CardContent>
              <Typography color={'info.light'}>Afk time</Typography>
              <Stack direction={'row'} alignItems={'center'} gap={1} color={isOvertime() ? 'error.light' : ''}>
                {isActive() ? <Typography color={'success.light'}>Active</Typography> : <Timer type={'up'}
                                                                                               date={afkTime}
                                                                                               lastUpdated={lastUpdated}/>}
                {isOvertime() ? (
                  <Tooltip title={'This character is afk more than 10 hours with Unending Energy prayer'}>
                    <InfoIcon/>
                  </Tooltip>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </> : null}
      </Stack>
    </>
  );
};

const Stat = ({ title, value, breakdown = '', breakdownNotation = 'Smaller', damage, useDoubleColumn }) => {
  return (
    (<Stack direction={'row'} justifyContent={'space-between'} alignItems={breakdown ? 'center' : 'flex-start'}>
      <Typography color={'info.light'}>{title}</Typography>
      <Tooltip maxWidth={450} title={breakdown ? <BreakdownTooltip breakdown={breakdown}
                                                                   useDoubleColumn={useDoubleColumn}
                                                                   notate={breakdownNotation}/> : ''}>
        {!damage ? <Typography component={'span'} sx={breakdown
          ? { alignItems: 'center', borderBottom: '1px dotted', lineHeight: 1 }
          : {}}
        >{value}</Typography> : <Typography color={'#fffcc9'}>
          {processString([{
            regex: /[\[!]/g,
            fn: (key, match) => {
              const modifier = match.at(0);
              return <DamageIcon key={key} src={`${prefix}etc/Damage_${modifier === '[' ? 'M' : 'T'}.png`} alt=""/>
            }
          }])(value)}
        </Typography>}
      </Tooltip>
    </Stack>)
  );
}

const BreakdownTooltip = ({ breakdown, titleWidth = 170, notate = '', useDoubleColumn }) => {
  if (!breakdown) return '';

  const renderItem = ({ name, value, title }, index, prefix = '') => {
    if (title) return <Typography sx={{ fontWeight: 500 }} key={`${prefix}${name}-${index}`}>{title}</Typography>;
    if (!name) return <Divider sx={{ my: 1 }} key={`${prefix}${name}-${index}`}/>;

    return (
      <TitleAndValue
        key={`${prefix}${name}-${index}`}
        titleStyle={{ width: titleWidth }}
        title={name}
        value={!isNaN(value) ? notateNumber(value, notate)?.replace('.00', '') : value}
      />
    );
  };

  if (!useDoubleColumn) {
    return <Stack>{breakdown.map((item, index) => renderItem(item, index))}</Stack>;
  }

  const midpoint = Math.ceil(24);
  return (
    <Stack direction="row" gap={2}>
      <Stack>{breakdown.slice(0, midpoint).map((item, index) => renderItem(item, index, 'left-'))}</Stack>
      <Stack>{breakdown.slice(midpoint).map((item, index) => renderItem(item, index, 'right-'))}</Stack>
    </Stack>
  );
}

const DamageIcon = styled.img`
  width: 16px;
  height: 16px;
  object-fit: contain;
`

export default Stats;
