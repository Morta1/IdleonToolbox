import React, { useMemo } from 'react';
import Library from '../account/Worlds/World3/Library';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import styled from '@emotion/styled';
import { cleanUnderscore, getRealDateInMs, getTimeAsDays, notateNumber, prefix } from '@utility/helpers';
import { getGiantMobChance, getMiniBossesData, getRandomEvents } from '@parsers/misc';
import Tooltip from '../Tooltip';
import Timer from '../common/Timer';
import { calcHappyHours } from '@parsers/dungeons';
import { getBuildCost } from '@parsers/construction';
import { getChargeWithSyphon, getClosestWorshiper } from '@parsers/worship';
import { getAtomBonus } from '@parsers/atomCollider';
import Grid from '@mui/material/Unstable_Grid2';
import { CardTitleAndValue } from '@components/common/styles';
import { format, isValid } from 'date-fns';
import RandomEvent from '@components/account/Misc/RandomEvent';
import Trade from '@components/account/Worlds/World5/Sailing/Trade';
import { useRouter } from 'next/router';
import { calcCost, calcTimeToRankUp, getRefineryCycles } from '@parsers/refinery';

const maxTimeValue = 9.007199254740992e+15;
const Etc = ({ characters, account, lastUpdated }) => {
  const router = useRouter();
  const giantMob = getGiantMobChance(characters?.[0], account);
  const events = useMemo(() => getRandomEvents(account), [characters, account, lastUpdated]);
  const nextHappyHours = useMemo(() => calcHappyHours(account?.serverVars?.HappyHours) || [], [account]);
  const nextPrinterCycle = new Date().getTime() + (3600 - (account?.timeAway?.GlobalTime - account?.timeAway?.Printer)) * 1000;
  const nextCompanionClaim = new Date().getTime() + Math.max(0, 594e6 - (1e3 * account?.timeAway?.GlobalTime - account?.companions?.lastFreeClaim));
  const nextFeatherRestart = new Date().getTime() + (account?.owl?.upgrades?.[4]?.cost - account?.owl?.feathers) / account?.owl?.featherRate * 1000;
  const nextMegaFeatherRestart = new Date().getTime() + (account?.owl?.upgrades?.[8]?.cost - account?.owl?.feathers) / account?.owl?.featherRate * 1000;
  const nextFisherooReset = new Date().getTime() + (account?.kangaroo?.upgrades?.[6]?.cost - account?.kangaroo?.progress) / account?.kangaroo?.fishRate / 60 * 1000;
  const nextGreatestCatch = new Date().getTime() + (account?.kangaroo?.upgrades?.[11]?.cost - account?.kangaroo?.progress) / account?.kangaroo?.fishRate / 60 * 1000;
  const allPetsAcquired = account?.companions?.list?.every(({ acquired }) => acquired);
  const atomBonus = getAtomBonus(account, 'Nitrogen_-_Construction_Trimmer');
  const minibosses = getMiniBossesData(account);
  const dailyReset = new Date().getTime() + account?.timeAway?.ShopRestock * 1000;
  const weeklyReset = new Date().getTime() + (account?.timeAway?.ShopRestock + 86400 * account?.accountOptions?.[39]) * 1000;
  const allBossesMax = minibosses.every(({ maxed }) => maxed);
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
  const closestSalt = account?.refinery?.salts?.reduce((closestSalt, {
    active,
    rank,
    cost,
    rawName,
    powerCap,
    refined,
    autoRefinePercentage
  }, saltIndex) => {
    if (!active || autoRefinePercentage !== 0) return closestSalt;
    const hasMaterialsForCycle = cost?.every(({
                                                rawName,
                                                quantity,
                                                totalAmount
                                              }) => totalAmount >= calcCost(account?.refinery, rank, quantity, rawName, saltIndex));
    const { squiresCycles } = getRefineryCycles(account, characters, lastUpdated);
    const { timeLeft } = calcTimeToRankUp(account, characters, lastUpdated, { squiresCycles }, false, rank, powerCap, refined, saltIndex);
    if ((closestSalt?.timeLeft === 0 || timeLeft < closestSalt?.timeLeft) && hasMaterialsForCycle) {
      return { timeLeft, icon: rawName }
    }
    return closestSalt
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
      <Stack gap={2}>
        <CardTitleAndValue cardSx={{ my: 0, width: 172 }} title={'Daily Reset'}>
          <Timer type={'countdown'} lastUpdated={lastUpdated}
                 date={dailyReset}/>
        </CardTitleAndValue>
        <CardTitleAndValue cardSx={{ my: 0, width: 172 }} title={'Weekly Reset'}>
          <Timer type={'countdown'} lastUpdated={lastUpdated}
                 date={weeklyReset}/>
        </CardTitleAndValue>
      </Stack>
      <Section title={'General'}>
        <TimerCard
          tooltipContent={'Next companion claim: ' + getRealDateInMs(nextCompanionClaim)}
          lastUpdated={lastUpdated} time={nextCompanionClaim}
          icon={'afk_targets/Dog.png'}
          timerPlaceholder={'Go claim!'}
          showAsError={!allPetsAcquired}
        />
        {account?.finishedWorlds?.World2 ? <>
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
        </> : null}
        {account?.finishedWorlds?.World2 ? <>
          <TimerCard
            tooltipContent={`Overflow syphon Charge (${bestWizard?.worship?.maxCharge + bestChargeSyphon}): ` + getRealDateInMs(timeToOverCharge)}
            lastUpdated={lastUpdated} time={timeToOverCharge}
            icon={'data/UISkillIcon475.png'}
            timerPlaceholder={'Overflowing charge'}
          />
        </> : null}
        {nextHappyHours?.length > 0 ? <>
          <TimerCard
            tooltipContent={'Next happy hour: ' + getRealDateInMs(nextHappyHours?.[0])}
            lastUpdated={lastUpdated} time={nextHappyHours?.[0]}
            icon={'etc/Happy_Hour.png'}
            timerPlaceholder={'Go claim!'}
          />
        </> : null}
        {events?.length > 0 || (account?.finishedWorlds?.World4 && account?.sailing?.trades.length > 0) ? <Stack
          gap={1}>
          {events?.length > 0 ? <Tooltip dark title={<RandomEvent {...events?.[0]} />}>
            <Stack sx={{ cursor: 'pointer' }} onClick={() => router.push({ pathname: '/account/misc/random-events' })}
                   direction={'row'} gap={2}>
              <IconImg src={`${prefix}etc/${events?.[0]?.eventName}.png`} alt=""/>
              {isValid(events?.[0]?.date) ? format(events?.[0]?.date, 'dd/MM/yyyy HH:mm:ss') : null}
            </Stack>
          </Tooltip> : null}
          <Divider/>
          {account?.finishedWorlds?.World4 && account?.sailing?.trades.length > 0 ? <Tooltip
            title={<Trade {...account?.sailing?.trades?.[0]}/>}>
            <Stack sx={{ cursor: 'pointer' }} onClick={() => router.push({ pathname: '/account/world-5/sailing' })}
                   direction={'row'}
                   gap={.5}>
              <Stack direction={'row'}>
                <img src={`${prefix}data/${account?.sailing?.trades?.[0]?.rawName}.png`} alt=""/>/
                <img src={`${prefix}data/SailT0.png`} alt=""/>
              </Stack>
              {isValid(new Date(account?.sailing?.trades?.[0]?.date))
                ? format(new Date(account?.sailing?.trades?.[0]?.date), 'dd/MM/yyyy HH:mm:ss')
                : null}
            </Stack>
          </Tooltip> : null}
        </Stack> : null}
      </Section>
      <Section title={'World 1'}>
        {account?.accountOptions?.[253] > 0 ? <>
          {nextFeatherRestart < maxTimeValue ? <TimerCard
            tooltipContent={'Next feather restart: ' + getRealDateInMs(nextFeatherRestart)}
            lastUpdated={lastUpdated}
            time={nextFeatherRestart}
            icon={'etc/Owl_4.png'}
            timerPlaceholder={'Restart available'}
          /> : <Stack direction={'row'} gap={1} alignItems={'center'}>
            <IconImg src={`${prefix}etc/Owl_8.png`}/>
            {notateNumber(getTimeAsDays(nextMegaFeatherRestart))} days
          </Stack>}
        </> : null}
        {account?.accountOptions?.[253] > 0 ? <>
          {nextMegaFeatherRestart < maxTimeValue ? <TimerCard
            tooltipContent={'Next mega feather: ' + getRealDateInMs(nextMegaFeatherRestart)}
            lastUpdated={lastUpdated}
            time={nextMegaFeatherRestart}
            icon={'etc/Owl_8.png'}
            timerPlaceholder={'Mega feather restart available'}
          /> : <Stack direction={'row'} gap={1} alignItems={'center'}>
            <IconImg src={`${prefix}etc/Owl_8.png`}/>
            {notateNumber(getTimeAsDays(nextMegaFeatherRestart))} days
          </Stack>}
        </> : null}
      </Section>
      {account?.kangaroo?.fish > 0 ? <Section title={'World 2'}>
        {nextFisherooReset < maxTimeValue ? <TimerCard
          tooltipContent={'Next fisheroo reset: ' + getRealDateInMs(nextFisherooReset)}
          lastUpdated={lastUpdated}
          time={nextFisherooReset}
          icon={'etc/KUpga_6.png'}
          timerPlaceholder={'Restart available'}
        /> : <Stack direction={'row'} gap={1} alignItems={'center'}>
          <IconImg src={`${prefix}etc/KUpga_6.png`}/>
          {notateNumber(getTimeAsDays(nextFisherooReset))} days
        </Stack>}
        {nextGreatestCatch < maxTimeValue ? <TimerCard
          tooltipContent={'Next fisheroo reset: ' + getRealDateInMs(nextGreatestCatch)}
          lastUpdated={lastUpdated}
          time={nextGreatestCatch}
          icon={'etc/KUpga_11.png'}
          timerPlaceholder={'Restart available'}
        /> : <Stack direction={'row'} gap={1} alignItems={'center'}>
          <IconImg src={`${prefix}etc/KUpga_11.png`}/>
          {notateNumber(getTimeAsDays(nextGreatestCatch))} days
        </Stack>}
      </Section> : null}
      <Section title={'World 3'}>
        {account?.finishedWorlds?.World2 ? <TimerCard
          tooltipContent={'Next printer cycle: ' + getRealDateInMs(nextPrinterCycle)}
          lastUpdated={lastUpdated} time={nextPrinterCycle} icon={'data/ConTower0.png'}/> : null}
        {account?.finishedWorlds?.World2 && closestTrap !== 0 ? <Grid>
          <TimerCard
            tooltipContent={'Closest trap: ' + getRealDateInMs(closestTrap)}
            lastUpdated={lastUpdated} time={closestTrap} icon={'data/TrapBoxSet1.png'}/>
        </Grid> : null}
        {account?.finishedWorlds?.World2 && closestBuilding?.timeLeft !== 0 ?
          <TimerCard
            tooltipContent={'Closest building: ' + getRealDateInMs(new Date().getTime() + closestBuilding?.timeLeft)}
            lastUpdated={lastUpdated} time={new Date().getTime() + closestBuilding?.timeLeft}
            icon={`data/${closestBuilding?.icon}.png`}/> : null}
        {account?.finishedWorlds?.World2 && closestWorshiper?.timeLeft !== 0 ? <>
          {closestWorshiper?.timeLeft !== 0 ? <TimerCard
            tooltipContent={closestWorshiper?.character
              ? `Closest full worship - ${closestWorshiper?.character}: ` + getRealDateInMs(new Date().getTime() + closestWorshiper?.timeLeft)
              : 'All characters charge is full'}
            timerPlaceholder={'Full!'}
            forcePlaceholder={!isFinite(closestWorshiper?.timeLeft)}
            lastUpdated={lastUpdated} time={new Date().getTime() + closestWorshiper?.timeLeft}
            icon={'data/WorshipSkull3.png'}/> : null}
        </> : null}
        {account?.finishedWorlds?.World2 && closestSalt?.timeLeft !== 0 ?
          <TimerCard
            tooltipContent={'Closest salt: ' + getRealDateInMs(closestSalt?.timeLeft)}
            lastUpdated={lastUpdated} time={closestSalt?.timeLeft}
            icon={`data/${closestSalt?.icon}.png`}/> : null}
      </Section>
      <Section title={'Bosses'}>
        {minibosses?.length > 0 ? <Stack gap={1} sx={{ width: allBossesMax ? 200 : 250 }}>
          <Stack gap={2}>
            {minibosses.map(({ rawName, name, current, daysTillNext, maxed }) => {
              return <Stack key={`miniboss-timer-${rawName}`}>
                <Stack direction={'row'} alignItems={'center'} gap={1}>
                  <IconImg src={`${prefix}etc/${rawName}.png`} alt={''}/>
                  <Stack>
                    <Typography>{cleanUnderscore(name)}</Typography>
                    <Stack direction={'row'} alignItems={'center'} gap={1}
                           divider={<Divider sx={{ bgcolor: 'text.secondary' }} orientation={'vertical'}
                                             flexItem/>}>
                      <Typography component={'span'} color="text.secondary">Current: <Typography
                        color={maxed ? 'error.light' : 'inherit'} component={'span'}>{maxed
                        ? `Maxed (${current})`
                        : current}</Typography></Typography>
                      {!maxed ? <Typography color="text.secondary">+1 in {daysTillNext} days</Typography> : null}
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            })}
          </Stack>
        </Stack> : null}

      </Section>
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
  width: 26px;
  height: 26px;
  object-fit: contain;
`;

const SectionTitle = ({ title }) => <Typography textAlign={'center'}>{title}</Typography>;

const Section = ({ title, children }) => <Card>
  <CardContent>
    <Stack flexWrap={'wrap'} gap={1} sx={{ maxHeight: 350 }} divider={<Divider flexItem/>}>
      <SectionTitle title={title}/>
      <Stack flexWrap={'wrap'} gap={1} divider={<Divider/>}>
        {children}
      </Stack>
    </Stack>
  </CardContent>
</Card>;

const TimerCard = ({
                     tooltipContent,
                     icon,
                     lastUpdated,
                     time,
                     timerPlaceholder = '',
                     forcePlaceholder,
                     showAsError
                   }) => {
  return <Tooltip title={tooltipContent}>
    <Stack direction={'row'} gap={1} alignItems={'center'}>
      <IconImg src={`${prefix}${icon}`}/>
      {forcePlaceholder ? <Typography color={'error.light'}>{timerPlaceholder}</Typography> : <Timer
        type={'countdown'} date={time}
        sx={{ color: showAsError ? '#f91d1d' : ' ' }}
        placeholder={timerPlaceholder}
        lastUpdated={lastUpdated}/>}
    </Stack>
  </Tooltip>
}

export default Etc;
