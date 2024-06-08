import React, { useContext, useMemo } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Badge, Card, CardContent, Stack, Typography } from '@mui/material';
import { fillArrayToLength, notateNumber, prefix } from 'utility/helpers';
import Timer from 'components/common/Timer';
import styled from '@emotion/styled';
import { calcTotals, getPlayerAnvil, getTimeTillCap } from '../../../parsers/anvil';
import { NextSeo } from 'next-seo';
import Tooltip from '../../../components/Tooltip';
import ProgressBar from '../../../components/common/ProgressBar';

const Anvil = () => {
  const { state } = useContext(AppContext);
  const { anvil } = state?.account || {};

  const totals = useMemo(() => calcTotals(state?.account, state?.characters), [state?.account, state?.characters]);

  return <>
    <NextSeo
      title="Anvil | Idleon Toolbox"
      description="Keep track of your characters anvil production"
    />
    <Stack direction={'row'} alignItems={'baseline'} gap={1}>
      <Typography variant={'h4'}>Totals</Typography>
      <Typography variant={'caption'}>per hour</Typography>
    </Stack>
    <Stack direction={'row'} gap={2} sx={{ mt: 2, mb: 5 }} flexWrap={'wrap'}>
      {Object.entries(totals || {}).map(([rawName, value], index) => {
        return <Card key={'total' + rawName + index}>
          <Tooltip title={<>
            <Typography>{notateNumber(value * 24, 'Big')} / day</Typography>
            <Typography variant={'caption'}>In case you're claiming before full</Typography>
          </>}>
            <CardContent>
              <Stack alignItems={'center'} gap={1}>
                <img width={25} height={25} src={`${prefix}data/${rawName}.png`} alt={''}/>
                <Typography>{notateNumber(value, 'Big')}</Typography>
              </Stack>
            </CardContent>
          </Tooltip>
        </Card>
      })}
    </Stack>
    <Stack gap={3}>
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
        return <Card key={`printer-row-${index}`} sx={{ width: { xs: '100%', lg: 700 } }}>
          <CardContent>
            <Stack sx={{ flexDirection: { xs: 'column', md: 'row' } }} alignItems={'center'} gap={2}>
              <Stack sx={{ width: 175, textAlign: 'center', flexDirection: { xs: 'column', md: 'row' } }}
                     alignItems={'center'} gap={2}>
                <Stack alignItems={'center'} justifyContent={'center'}>
                  <img className={'class-icon'} src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
                </Stack>
                <Stack>
                  <Typography data-cy={`player-name-${playerName}`} className={'character-name'}>{playerName}</Typography>
                  <Typography variant={'caption'}>Smithing lv. {smithingLevel}</Typography>
                  <Typography variant={'caption'}
                              color={color}>Points {pointsFromCoins + pointsFromMats - availablePoints + smithingLevel} / {pointsFromCoins + pointsFromMats + smithingLevel}</Typography>
                </Stack>
              </Stack>
              <Stack sx={{ justifyContent: { xs: 'center', md: 'flex-start' } }} direction={'row'} alignItems={'center'}
                     flexWrap={'wrap'} gap={3}>
                {realProduction?.map((slot, slotIndex) => {
                  const { rawName, hammers, currentAmount, currentProgress, requiredAmount, currentXP } = slot;
                  const timePassed = (new Date().getTime() - afkTime) / 1000;
                  const futureProduction = Math.min(Math.round(currentAmount + ((currentProgress + (timePassed * stats?.anvilSpeed / 3600)) / requiredAmount) * (hammers ?? 0)), stats?.anvilCapacity);
                  const percentOfCap = Math.round(futureProduction / stats?.anvilCapacity * 100);
                  const timeTillCap = getTimeTillCap({ ...slot, stats, afkTime });
                  const timeFromZeroTillCap = getTimeTillCap({
                    ...slot,
                    stats,
                    afkTime,
                    currentAmount: 0,
                    currentProgress: 0
                  });
                  return <Card elevation={5}
                               sx={{ boxShadow: hammers > 0 ? 'inherit' : '0px 0px 5px #ff0707' }}
                               key={`${rawName}-${slotIndex}`}>
                    <Tooltip title={<>
                      <Typography>Max from zero</Typography>
                      <Timer date={new Date().getTime() + (timeFromZeroTillCap * 1000)}
                             staticTime={true}
                             type={'countdown'}
                             placeholder={<Typography color={'error.light'}>Full</Typography>}
                             lastUpdated={state?.lastUpdated}/>
                    </>}>
                      <CardContent>
                        {hammers > 0 ? <Stack justifyContent={'flex-start'}>
                          <Badge anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                          }} color="secondary" variant={'standard'} badgeContent={hammers > 1 ? hammers : 0}>
                            <ItemIcon src={`${prefix}data/${rawName}.png`} alt=""/>
                          </Badge>
                          <Timer date={new Date().getTime() + (timeTillCap * 1000)}
                                 staticTime={true}
                                 type={'countdown'}
                                 placeholder={<Typography color={'error.light'}>Full</Typography>}
                                 lastUpdated={state?.lastUpdated}/>
                          <Typography>Exp: {notateNumber(currentXP, 'Big')}</Typography>
                          <ProgressBar percent={percentOfCap} label={false}/>
                        </Stack> : <Stack sx={{ width: 90, height: 65 }} alignItems={'center'}
                                          justifyContent={'center'}>
                          <Typography variant={'caption'}>EMPTY</Typography>
                        </Stack>}
                      </CardContent>
                    </Tooltip>
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
