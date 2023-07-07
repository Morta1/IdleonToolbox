import React, { Fragment, useMemo } from 'react';
import Library from '../account/Worlds/World3/Library';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import styled from '@emotion/styled';
import { getRealDateInMs, notateNumber, prefix } from '../../utility/helpers';
import { getGiantMobChance, getRandomEvents } from '../../parsers/misc';
import Tooltip from '../Tooltip';
import Timer from '../common/Timer';
import Trade from '../account/Worlds/World5/Sailing/Trade';
import RandomEvent from '../account/Misc/RandomEvent';
import { calcHappyHours } from '../../parsers/dungeons';
import { getBuildCost } from '../../parsers/construction';
import { getClosestWorshiper } from '../../parsers/worship';
import { getAtomBonus } from '../../parsers/atomCollider';

const Etc = ({ characters, account, lastUpdated }) => {
  const giantMob = getGiantMobChance(characters?.[0], account);

  const dailyReset = new Date().getTime() + account?.timeAway?.ShopRestock * 1000;
  const weeklyReset = new Date().getTime() + (account?.timeAway?.ShopRestock + 86400 * account?.accountOptions?.[39]) * 1000;
  const events = useMemo(() => getRandomEvents(account), [characters, account, lastUpdated]);
  const nextHappyHours = useMemo(() => calcHappyHours(account?.serverVars?.HappyHours) || [], [account]);
  const nextPrinterCycle = new Date().getTime() + (3600 - (account?.timeAway?.GlobalTime - account?.timeAway?.Printer)) * 1000;
  const nextCompanionClaim = new Date().getTime() + Math.max(0, 594e6 - (1e3 * account?.timeAway?.GlobalTime - account?.companions?.lastFreeClaim))
  const atomBonus = getAtomBonus(account, 'Nitrogen_-_Construction_Trimmer');

  const closestBuilding = account?.towers?.data?.reduce((closestBuilding, building) => {
    const allBlueActive = account?.lab.jewels?.slice(3, 7)?.every(({ active }) => active) ? 1 : 0;
    const jewelTrimmedSlot = account?.lab.jewels?.[3]?.active ? 1 + allBlueActive : 0;
    const trimmedSlots = jewelTrimmedSlot + (atomBonus ? 1 : 0);
    const isSlotTrimmed = building?.slot !== -1 && building?.slot < trimmedSlots;
    const buildCost = getBuildCost(account?.towers, building?.level, building?.bonusInc, building?.index);
    let timeLeft;
    if (isSlotTrimmed) {
      const trimmedSlotSpeed = (3 + atomBonus / 100) * account?.construction?.totalBuildRate;
      timeLeft = (buildCost - building?.progress) / (trimmedSlotSpeed) * 1000 * 3600;
    } else {
      timeLeft = (buildCost - building?.progress) / account?.construction?.totalBuildRate * 1000 * 3600;
    }
    if (building?.inProgress && (closestBuilding?.timeLeft === 0 || timeLeft < closestBuilding?.timeLeft)) {
      return { timeLeft, icon: `ConTower${building?.index}` };
    }
    return closestBuilding;
  }, { timeLeft: 0, icon: '' });

  const closestTrap = account?.traps?.reduce((closestTrap, traps) => {
    const times = traps?.map(({ timeLeft }) => timeLeft);
    if (times.length === 0) return closestTrap;
    const lowest = Math.min(...times);
    if (closestTrap === 0 || lowest < closestTrap) {
      return lowest;
    }
    return closestTrap;
  }, 0);

  const closestWorshiper = getClosestWorshiper(characters);

  return <>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      {events?.length > 0 ? <Card sx={{ width: 'fit-content', height: 'fit-content' }}>
        <CardContent>
          <Stack gap={2}>
            {events?.map((event, index) => {
              if (index > 1) return;
              return <Fragment key={'events' + index}>
                <RandomEvent {...event} />
                <Divider flexItem/>
              </Fragment>
            })}
          </Stack>
        </CardContent>
      </Card> : null}
      {account?.finishedWorlds?.World4 ? <Card sx={{ width: 'fit-content', height: 'fit-content' }}>
        <CardContent>
          <Stack alignItems={'center'} gap={2}>
            {account?.sailing?.trades?.map((trade, index) => {
              if (index > 2) return;
              return <Fragment key={'trade' + index}>
                <Trade {...trade}/>
                <Divider flexItem/>
              </Fragment>
            })}
          </Stack>
        </CardContent>
      </Card> : null}
      {account?.finishedWorlds?.World2 ?
        <Card sx={{ width: 'fit-content', height: 'fit-content' }}>
          <CardContent>
            <Library libraryTimes={account?.libraryTimes} lastUpdated={lastUpdated}/>
          </CardContent>
        </Card> : null}
      <Stack gap={1}>
        {account?.finishedWorlds?.World2 ? <Card sx={{ height: 'fit-content' }}>
          <CardContent>
            <Tooltip title={'Next printer cycle: ' + getRealDateInMs(nextPrinterCycle)}>
              <Stack gap={1} direction={'row'} alignItems={'center'}>
                <IconImg src={`${prefix}data/ConTower0.png`}/>
                <Timer lastUpdated={lastUpdated}
                       type={'countdown'}
                       date={nextPrinterCycle}/>
              </Stack>
            </Tooltip>
          </CardContent>
        </Card> : null}
        {account?.finishedWorlds?.World2 && closestTrap !== 0 ? <Card sx={{ height: 'fit-content' }}>
          <CardContent>
            <Tooltip title={'Closest trap: ' + getRealDateInMs(closestTrap)}>
              <Stack gap={1} direction={'row'} alignItems={'center'}>
                <IconImg src={`${prefix}data/TrapBoxSet1.png`}/>
                <Timer lastUpdated={lastUpdated}
                       type={'countdown'}
                       date={closestTrap}/>
              </Stack>
            </Tooltip>
          </CardContent>
        </Card> : null}
        {account?.finishedWorlds?.World2 && closestBuilding?.timeLeft !== 0 ? <Card sx={{ height: 'fit-content' }}>
          <CardContent>
            <Tooltip title={'Closest building: ' + getRealDateInMs(new Date().getTime() + closestWorshiper?.timeLeft)}>
              <Stack gap={1} direction={'row'} alignItems={'center'}>
                <IconImg src={`${prefix}data/${closestBuilding?.icon}.png`}/>
                <Timer lastUpdated={lastUpdated}
                       type={'countdown'}
                       date={new Date().getTime() + closestBuilding?.timeLeft}/>
              </Stack>
            </Tooltip>
          </CardContent>
        </Card> : null}
        {account?.finishedWorlds?.World2 && closestWorshiper?.timeLeft !== 0 ? <Card sx={{ height: 'fit-content' }}>
          <CardContent>
            <Tooltip
              title={`Closest full worship - ${closestWorshiper?.character}: ` + getRealDateInMs(new Date().getTime() + closestWorshiper?.timeLeft)}>
              <Stack gap={1} direction={'row'} alignItems={'center'}>
                <IconImg src={`${prefix}data/WorshipSkull3.png`}/>
                <Timer lastUpdated={lastUpdated}
                       type={'countdown'}
                       date={new Date().getTime() + closestWorshiper?.timeLeft}/>
              </Stack>
            </Tooltip>
          </CardContent>
        </Card> : null}
        <Card>
          <CardContent>
            <Tooltip title={'Next companion claim: ' + getRealDateInMs(nextCompanionClaim)}>
              <Stack direction={'row'} gap={1} alignItems={'center'}>
                <IconImg src={`${prefix}afk_targets/Dog.png`}/>
                {nextCompanionClaim > 0 ?
                  <Timer type={'countdown'} date={nextCompanionClaim}
                         placeholder={'Go claim!'}
                         lastUpdated={lastUpdated}/> : null}
              </Stack>
            </Tooltip>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Tooltip title={'Next happy hour: ' + getRealDateInMs(nextHappyHours?.[0])}>
              <Stack direction={'row'} gap={1} alignItems={'center'}>
                <IconImg src={`${prefix}etc/Happy_Hour.png`}/>
                {nextHappyHours?.length > 0 ?
                  <Timer type={'countdown'} date={nextHappyHours?.[0]}
                         lastUpdated={lastUpdated}/> : 'waiting for lava to set them'}
              </Stack>
            </Tooltip>
          </CardContent>
        </Card>
      </Stack>
      <Stack gap={1}>
        <Card sx={{ height: 'fit-content' }}>
          <CardContent>
            <Stack sx={{ height: 'fit-content' }}>
              <Typography sx={{ fontWeight: 'bold', mb: 1, color: '#bfff77' }}>Daily Reset</Typography>
              <Timer type={'countdown'} lastUpdated={lastUpdated}
                     date={dailyReset}/>
            </Stack>
            <Stack sx={{ mt: 2 }}>
              <Typography sx={{ fontWeight: 'bold', mb: 1, color: '#b2ecfd' }}>Weekly Reset</Typography>
              <Timer type={'countdown'} lastUpdated={lastUpdated}
                     date={weeklyReset}/>
            </Stack>
          </CardContent>
        </Card>
        {account?.finishedWorlds?.World2 ? <Card sx={{ width: 'fit-content', height: 'fit-content' }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'center'} gap={2}>
              <Tooltip title={<Stack>
                <Typography sx={{ fontWeight: 'bold' }}>Giant Mob Chance</Typography>
                <Typography>+{giantMob?.crescentShrineBonus}% from Crescent shrine</Typography>
                <Typography>+{giantMob?.giantMobVial}% from Shaved Ice vial</Typography>
                {giantMob?.glitterbugPrayer > 0 ?
                  <Typography>-{giantMob?.glitterbugPrayer}% from Glitterbug prayer</Typography> : null}
              </Stack>}>
                <Stack gap={1} direction={'row'} alignItems={'center'}>
                  <IconImg src={`${prefix}data/Prayer5.png`}/>
                  <Typography>1
                    in {notateNumber(Math.floor(1 / giantMob?.chance))}</Typography>
                </Stack>
              </Tooltip>
            </Stack>
          </CardContent>
        </Card> : null}
      </Stack>
    </Stack>
  </>
};


const IconImg = styled.img`
  width: 35px;
  height: 35px;
  object-fit: contain;
`;

export default Etc;
