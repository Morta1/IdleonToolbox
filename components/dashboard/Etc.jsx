import React, { useMemo } from 'react';
import Library from '../account/Worlds/World3/Library';
import { Card, CardContent, Link, Stack, Typography } from '@mui/material';
import styled from '@emotion/styled';
import { getRealDateInMs, notateNumber, prefix } from '@utility/helpers';
import { getGiantMobChance, getRandomEvents } from '@parsers/misc';
import Tooltip from '../Tooltip';
import Timer from '../common/Timer';
import Trade from '../account/Worlds/World5/Sailing/Trade';
import RandomEvent from '../account/Misc/RandomEvent';
import { calcHappyHours } from '@parsers/dungeons';
import { getBuildCost } from '@parsers/construction';
import { getChargeWithSyphon, getClosestWorshiper } from '@parsers/worship';
import { getAtomBonus } from '@parsers/atomCollider';
import Grid from '@mui/material/Unstable_Grid2';

const Etc = ({ characters, account, lastUpdated }) => {
  const giantMob = getGiantMobChance(characters?.[0], account);
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

  const {
    bestWizard,
    bestChargeSyphon,
    timeToOverCharge
  } = useMemo(() => getChargeWithSyphon(characters), [characters]);

  return <>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      <Grid sx={{ width: 360 }} container spacing={1}>
        <Grid xs={6}>{account?.finishedWorlds?.World2 ? <TimerCard
          tooltipContent={'Next printer cycle: ' + getRealDateInMs(nextPrinterCycle)}
          lastUpdated={lastUpdated} time={nextPrinterCycle} icon={'data/ConTower0.png'}/> : null}
        </Grid>
        <Grid xs={6}>
          {account?.finishedWorlds?.World2 && closestTrap !== 0 ? <TimerCard
            tooltipContent={'Closest trap: ' + getRealDateInMs(closestTrap)}
            lastUpdated={lastUpdated} time={closestTrap} icon={'data/TrapBoxSet1.png'}/> : null}
        </Grid>
        <Grid xs={6}>
          {account?.finishedWorlds?.World2 && closestBuilding?.timeLeft !== 0 ? <TimerCard
            tooltipContent={'Closest building: ' + getRealDateInMs(new Date().getTime() + closestBuilding?.timeLeft)}
            lastUpdated={lastUpdated} time={new Date().getTime() + closestBuilding?.timeLeft}
            icon={`data/${closestBuilding?.icon}.png`}/> : null}
        </Grid>
        <Grid xs={6}>
          {account?.finishedWorlds?.World2 && closestWorshiper?.timeLeft !== 0 ? <TimerCard
            tooltipContent={`Closest full worship - ${closestWorshiper?.character}: ` + getRealDateInMs(new Date().getTime() + closestWorshiper?.timeLeft)}
            timerPlaceholder={'Full!'}
            forcePlaceholder={!isFinite(closestWorshiper?.timeLeft)}
            lastUpdated={lastUpdated} time={new Date().getTime() + closestWorshiper?.timeLeft}
            icon={'data/WorshipSkull3.png'}/> : null}
        </Grid>
        <Grid xs={6}>
          <TimerCard
            tooltipContent={'Next companion claim: ' + getRealDateInMs(nextCompanionClaim)}
            lastUpdated={lastUpdated} time={nextCompanionClaim}
            icon={'afk_targets/Dog.png'}
            timerPlaceholder={'Go claim!'}
          /></Grid>
        <Grid xs={6}>
          {nextHappyHours?.length > 0 ? <TimerCard
            tooltipContent={'Next happy hour: ' + getRealDateInMs(nextHappyHours?.[0])}
            lastUpdated={lastUpdated} time={nextHappyHours?.[0]}
            icon={'etc/Happy_Hour.png'}
            timerPlaceholder={'Go claim!'}
          /> : null}
        </Grid>
        <Grid xs={6}>
          {account?.finishedWorlds?.World2 ? <TimerCard
            tooltipContent={`Overflow syphon Charge (${bestWizard?.worship?.maxCharge + bestChargeSyphon}): ` + getRealDateInMs(timeToOverCharge)}
            lastUpdated={lastUpdated} time={timeToOverCharge}
            icon={'data/UISkillIcon475.png'}
            timerPlaceholder={'Overflowing charge'}
          /> : null}
        </Grid>
        <Grid xs={6}>
          {account?.finishedWorlds?.World2 ? <Card sx={{ width: '100%', height: 'fit-content' }}>
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
        </Grid>
      </Grid>
      <Stack gap={1} sx={{ width: 250 }}>
        {events?.length > 0 ? <Card sx={{ width: '100%', height: 'fit-content' }}>
          <CardContent>
            <Stack gap={2}>
              <RandomEvent {...events?.[0]} />
              <Link underline={'none'}
                    href={'https://idleontoolbox.com/account/misc/random-events'}>{'See more...'}</Link>
            </Stack>
          </CardContent>
        </Card> : null}
        {account?.finishedWorlds?.World4 ? <Card sx={{ width: '100%', height: 'fit-content' }}>
          <CardContent>
            <Stack gap={2}>
              <Trade {...account?.sailing?.trades?.[0]}/>
              <Link underline={'none'}
                    href={'https://idleontoolbox.com/account/world-5/sailing'}>{'See more...'}</Link>
            </Stack>
          </CardContent>
        </Card> : null}
      </Stack>
      {account?.finishedWorlds?.World2 ?
        <Card sx={{ width: 'fit-content', height: 'fit-content' }}>
          <CardContent>
            <Library libraryTimes={account?.libraryTimes} lastUpdated={lastUpdated}/>
          </CardContent>
        </Card> : null}

    </Stack>
  </>
};

const IconImg = styled.img`
  width: 35px;
  height: 35px;
  object-fit: contain;
`;

const TimerCard = ({ tooltipContent, icon, lastUpdated, time, timerPlaceholder = '', forcePlaceholder }) => {
  return <Card sx={{ height: 'fit-content' }}>
    <CardContent>
      <Tooltip title={tooltipContent}>
        <Stack direction={'row'} gap={1} alignItems={'center'}>
          <IconImg src={`${prefix}${icon}`}/>
          {forcePlaceholder ? <Typography color={'error.light'}>{timerPlaceholder}</Typography> : <Timer
            type={'countdown'} date={time}
            placeholder={timerPlaceholder}
            lastUpdated={lastUpdated}/>}
        </Stack>
      </Tooltip>
    </CardContent>
  </Card>
}

export default Etc;
