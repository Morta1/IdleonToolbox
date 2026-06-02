import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Badge, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, fillArrayToLength, notateNumber, numberWithCommas, prefix } from 'utility/helpers';
import Timer from 'components/common/Timer';
import styled from '@emotion/styled';
import { calcTotals, getPlayerAnvil, getTimeTillCap } from '@parsers/world-1/anvil';
import { NextSeo } from 'next-seo';
import Tooltip from '../../../components/Tooltip';
import ProgressBar from '../../../components/common/ProgressBar';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const Anvil = () => {
  const { state } = useContext(AppContext);
  const { anvil } = state?.account || {};

  const totals = calcTotals(state?.account, state?.characters);

  // Per-item per-character contributions for the Totals tooltips.
  const contributions = {};
  (anvil || []).forEach((_, index) => {
    const character = state?.characters?.[index];
    const { stats, production } = getPlayerAnvil(character, state?.characters, state?.account);
    production?.filter(({ hammers }) => hammers > 0)?.forEach(({ rawName, hammers, requiredAmount }) => {
      const perHour = Math.min(stats?.anvilSpeed * hammers / requiredAmount, stats?.anvilCapacity);
      (contributions[rawName] = contributions[rawName] || []).push({ name: character?.name, perHour });
    });
  });
  Object.values(contributions).forEach((arr) => arr.sort((a, b) => b.perHour - a.perHour));

  return <>
    <NextSeo
      title="Anvil | Idleon Toolbox"
      description="Monitor your characters' anvil production rates, craft queues, and smithing progress in Legends of Idleon"
    />
    <Stack direction={'row'} gap={2} sx={{ mb: 3 }} flexWrap={'wrap'}>
      {Object.entries(totals || {}).map(([rawName, value], index) => {
        const breakdown = contributions[rawName] || [];
        return <Card key={'total' + rawName + index}>
          <Tooltip title={<>
            <Typography variant={'body2'}>{notateNumber(value * 24, 'Big')} / day</Typography>
            <Divider sx={{ my: 1 }}/>
            <Typography variant={'caption'}>Produced by:</Typography>
            {breakdown.map(({ name, perHour }) => (
              <Stack key={name} direction={'row'} justifyContent={'space-between'} gap={2}>
                <Typography variant={'body2'}>{name}</Typography>
                <Typography variant={'body2'}>{notateNumber(perHour, 'Big')}/hr</Typography>
              </Stack>
            ))}
          </>}>
            <CardContent>
              <Stack alignItems={'center'} gap={1} direction={'row'}>
                <img width={25} height={25} src={`${prefix}data/${rawName}.png`} alt={''}/>
                <Stack>
                  <Typography>{notateNumber(value, 'Big')}<Typography component={'span'} variant={'caption'} color={'text.secondary'}> /hr</Typography></Typography>
                  <Typography variant={'caption'} color={'text.secondary'}>{notateNumber(value * 24, 'Big')} /day</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Tooltip>
        </Card>
      })}
    </Stack>
    <Stack gap={2}>
      {anvil?.map((anvil, index) => {
        const classIndex = state?.characters?.[index]?.classIndex;
        const playerName = state?.characters?.[index]?.name;
        const smithingLevel = state?.characters?.[index].skillsInfo?.smithing?.level;
        const {
          stats,
          production: prod
        } = getPlayerAnvil(state?.characters?.[index], state?.characters, state?.account)
        const {
          availablePoints,
          pointsFromCoins,
          pointsFromMats
        } = stats || {};
        const color = availablePoints === 0 ? '' : availablePoints > 0 ? 'error.light' : 'secondary';
        const afkTime = state?.characters?.[index]?.afkTime;
        const hammerBubble = state?.characters?.[index]?.equippedBubbles?.find(({ bubbleName }) => bubbleName === 'HAMMER_HAMMER');
        const maxProducts = hammerBubble ? 3 : 2;
        const production = prod?.filter(({ hammers }) => hammers > 0);
        const numOfHammers = production?.reduce((res, { hammers }) => res + hammers, 0);
        const realProduction = numOfHammers >= maxProducts ? production : fillArrayToLength(numOfHammers, production);
        return <Card key={`printer-row-${index}`}
                     sx={{
                       width: { xs: '100%', lg: 900 },
                       transition: 'box-shadow .15s ease, transform .15s ease',
                       '&:hover': { boxShadow: 6 }
                     }}>
          <CardContent>
            <Stack sx={{ flexDirection: { xs: 'column', md: 'row' } }} alignItems={'center'} gap={2}
                   divider={<Divider orientation={'vertical'} flexItem sx={{ display: { xs: 'none', md: 'block' } }}/>}>
              <Stack sx={{ width: 175, flexDirection: { xs: 'column', md: 'row' } }}
                     alignItems={'center'} gap={2}>
                <img className={'class-icon'} src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
                <Stack gap={.25}>
                  <Typography data-cy={`player-name-${playerName}`}
                              className={'character-name'}>{playerName}</Typography>
                  <Typography variant={'caption'} color={'text.secondary'}>Smithing lv. {smithingLevel}</Typography>
                  <Typography variant={'caption'}
                              color={color || 'text.secondary'}>Points {pointsFromCoins + pointsFromMats - availablePoints + smithingLevel} / {pointsFromCoins + pointsFromMats + smithingLevel}</Typography>
                </Stack>
              </Stack>
              <Stack sx={{ justifyContent: { xs: 'center', md: 'flex-start' } }} direction={'row'} alignItems={'center'}
                     flexWrap={'wrap'} gap={3}>
                {realProduction?.map((slot, slotIndex) => {
                  const {
                    rawName,
                    hammers,
                    currentAmount,
                    currentProgress,
                    requiredAmount,
                    currentXP,
                    displayName,
                    exp
                  } = slot;
                  const timePassed = (new Date().getTime() - afkTime) / 1000;
                  const futureProduction = Math.min(Math.round(currentAmount + ((currentProgress + (timePassed * stats?.anvilSpeed / 3600)) / requiredAmount) * (hammers ?? 0)), stats?.anvilCapacity);
                  const productionPerDay = ((currentProgress + 24 * stats.anvilSpeed) / requiredAmount) * hammers
                  const percentOfCap = Math.round(futureProduction / stats?.anvilCapacity * 100);
                  const timeTillCap = getTimeTillCap({ ...slot, stats, afkTime });
                  const timeFromZeroTillCap = getTimeTillCap({
                    ...slot,
                    stats,
                    afkTime,
                    currentAmount: 0,
                    currentProgress: 0,
                    fromZero: true
                  });
                  const isFull = percentOfCap >= 100;
                  return <Card elevation={3}
                               sx={{
                                 borderRadius: 2,
                                 boxShadow: hammers > 0 ? 'inherit' : '0px 0px 5px #ff0707',
                                 transition: 'transform .15s ease',
                               }}
                               key={`${rawName}-${slotIndex}`}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      {hammers > 0 ? <Stack direction={'row'} gap={1.5} alignItems={'center'}>
                        <Badge anchorOrigin={{
                          vertical: 'top',
                          horizontal: 'left'
                        }} color="secondary" variant={'standard'} badgeContent={hammers > 1 ? hammers : 0}>
                          <ItemIcon src={`${prefix}data/${rawName}.png`} alt=""/>
                        </Badge>
                        <Stack gap={.4} sx={{ minWidth: 165 }}>
                          <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={1}>
                            <Typography variant={'subtitle2'} noWrap>{cleanUnderscore(displayName)}</Typography>
                            <Tooltip title={<>
                              <Typography variant={'body1'}>{cleanUnderscore(displayName)}</Typography>
                              <Divider sx={{ my: 1 }}/>
                              <Typography variant={'body2'}>Time until max from zero:</Typography>
                              <Timer date={new Date().getTime() + (timeFromZeroTillCap * 1000)}
                                     staticTime={true}
                                     type={'countdown'}
                                     placeholder={<Typography component={'span'}
                                                              color={'error.light'}>Full</Typography>}
                                     lastUpdated={state?.lastUpdated}/>
                              <Divider sx={{ my: 1 }}/>
                              <Typography variant={'body2'}>Income: {notateNumber(productionPerDay)} / day</Typography>
                              <Divider sx={{ my: 1 }}/>
                              <Typography variant={'body2'}>Exp per craft: {numberWithCommas(exp)}</Typography>
                            </>}>
                              <IconInfoCircleFilled size={16} style={{ flexShrink: 0, opacity: .6 }}/>
                            </Tooltip>
                          </Stack>
                          <Stack direction={'row'} alignItems={'center'} gap={.75}>
                            <Typography variant={'caption'} color={'text.secondary'}>Done in</Typography>
                            <Timer date={new Date().getTime() + (timeTillCap * 1000)}
                                   type={'countdown'}
                                   placeholder={<Typography component={'span'}
                                                            color={'error.light'}>Full</Typography>}
                                   lastUpdated={state?.lastUpdated}/>
                          </Stack>
                          <ProgressBar percent={percentOfCap}
                                       bgColor={isFull ? '#ef5350' : undefined}
                                       label={false}
                                       sx={{ height: 8 }}/>
                          <Stack direction={'row'} justifyContent={'space-between'} gap={1}>
                            <Typography variant={'caption'} color={'text.secondary'}>Cap</Typography>
                            <Typography variant={'caption'} color={isFull ? 'error.light' : 'inherit'}>
                              {notateNumber(futureProduction)} / {notateNumber(stats?.anvilCapacity)}
                            </Typography>
                          </Stack>
                          <Stack direction={'row'} justifyContent={'space-between'} gap={1}>
                            <Typography variant={'caption'} color={'text.secondary'}>Exp</Typography>
                            <Typography variant={'caption'}>{notateNumber(currentXP, 'Big')}</Typography>
                          </Stack>
                        </Stack>
                      </Stack> : <Stack sx={{ width: 90, height: 65 }} alignItems={'center'}
                                        justifyContent={'center'}>
                        <Typography variant={'caption'}>EMPTY</Typography>
                      </Stack>}
                    </CardContent>
                  </Card>
                })}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

const ItemIcon = styled.img`
  width: 42px;
  height: 42px;
`

export default Anvil;
