import React, { useState } from 'react';
import Library from '../account/Worlds/World3/Library';
import NextLink from 'next/link';
import { Box, Link, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, getDuration, getNextCompanionClaim, getNextResetAt, splitTime } from '@utility/helpers';
import { fillVoteText, formatGame } from '@utility/gameNotation';
import useFormatDate from '@hooks/useFormatDate';
import useInterval from '@hooks/useInterval';
import { getMiniBossesData, getRandomEvents } from '@parsers/misc';
import Timer from '../common/Timer';
import StatusText from '@components/common/StatusText';
import { isSectionFailed } from '@components/common/styles';
import CardGrid from '@components/common/cards/CardGrid';
import Panel from '@components/common/cards/Panel';
import AlertIcon from './AlertIcon';
import { alertMeta } from '@utility/dashboard/alertMeta';
import { calcHappyHours } from '@parsers/dungeons';
import { getBuildCost, getGildedBoostioBonus, getTotalGildedSlots } from '@parsers/world-3/construction';
import { getChargeWithSyphon, getClosestWorshiper } from '@parsers/world-3/worship';
import { isPast, isValid } from 'date-fns';
import RandomEvent from '@components/account/Misc/RandomEvent';
import Trade from '@components/account/Worlds/World5/Sailing/Trade';
import BossRespawns from './BossRespawns';
import { useRouter } from 'next/router';
import { calcCost, calcTimeToRankUp, getRefineryCycles } from '@parsers/world-3/refinery';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';
import { getMonumentMaxLinearTime } from '@parsers/world-5/caverns/bravery';
import { getMeritocracyBonus } from '@parsers/world-2/voteBallot';
import { CRYSTAL_ISLAND_MAX_DAYS, getCrystalIslandMobs, getIsland } from '@parsers/world-2/islands';
import { SMOKER_MAX_QUALITY_SECONDS } from '@parsers/clickers/bubba';
import { OPT } from '@parsers/accountOptions';
import { sessionQuery } from '@utility/nav-query';

const maxTimeValue = 9.007199254740992e+15;
const MINUTE = 60 * 1000;
const SERVER_WEEK = 604800 * 1000;
const VILLAGER_TABS = ['Explore', 'Engineer', 'Bonuses', 'Measure', 'Study'];
// Keys align with villager index (0-4) and match the `villagers` timer array option in baseTrackers.
const VILLAGER_KEYS = ['explore', 'engineer', 'bonuses', 'measure', 'studies'];
// The sections a row's number reads beyond its own: failed, the number isn't the player's, so the row reads "-". From
// failing each section in turn on the demo, and the helpers' reads (a building's gilded slots and boost).
const BUILDING_SECTIONS = ['towers', 'construction', 'hole', 'lab', 'atoms', 'minehead', 'legendTalents'];
const SALT_SECTIONS = ['refinery', 'alchemy', 'arcade', 'atoms', 'breeding', 'compass', 'gaming', 'lab', 'legendTalents', 'research', 'rift', 'saltLick',
  'sneaking', 'spelunking', 'stamps', 'sushiStation', 'towers'];
const MONUMENT_SECTIONS = ['hole', 'gaming', 'legendTalents'];
const Etc = ({ characters, account, lastUpdated, trackers }) => {
  const failed = (section) => isSectionFailed(account, section);
  const failedAny = (sections) => sections.some(failed);
  // Anchor timer math to `lastUpdated` (the data-fetch timestamp) rather than `new Date().getTime()`.
  // React Compiler hoists `new Date().getTime()` into a no-dep memo slot and never re-runs it, so timers
  // drifted by an extra refresh interval each time data updated. A row's time is then a real date, so its
  // Timer takes no lastUpdated, except the three the parsers anchor on their own clock (trap, salt, equinox).
  const now = lastUpdated ?? new Date().getTime();
  const [wallClock, setWallClock] = useState(() => Date.now());
  useInterval(() => setWallClock(Date.now()), MINUTE);
  const emptyAlerts = Object.entries(trackers || {}).reduce((res, [alertName, data]) => {
    const allEmpty = Object.values(data || {}).every(({ checked }) => !checked);
    return { ...res, [alertName]: allEmpty };
  }, {});
  const events = getRandomEvents(account);
  // `events[0]` is still listed while its hour is running, so it's the event happening NOW, not the
  // next one to spawn. The icon and the countdown have to resolve to the same event or the tile
  // shows one event's name above another event's timer.
  const nextEvent = events?.find(({ date }) => date > now) ?? events?.[0];
  const nextHappyHours = calcHappyHours(account?.serverVars?.HappyHours) || [];
  const nextPrinterCycle = now + (3600 - (account?.timeAway?.GlobalTime - account?.timeAway?.Printer)) * 1000;
  const nextCompanionClaim = getNextCompanionClaim(account);
  const nextFeatherRestart = now + (account?.owl?.upgrades?.[4]?.cost - account?.owl?.feathers) / account?.owl?.featherRate * 1000;
  const nextMegaFeatherRestart = now + (account?.owl?.upgrades?.[8]?.cost - account?.owl?.feathers) / account?.owl?.featherRate * 1000;
  const nextMegaFleshRestart = now + (account?.bubba?.upgrades?.[8]?.cost - account?.bubba?.meatSlices) / account?.bubba?.meatsliceRate * 60 * 1000;
  const fDuration = getDuration(now, nextFeatherRestart);
  const fLongDuration = nextFeatherRestart > maxTimeValue || fDuration?.days > 365;
  const mfDuration = getDuration(now, nextMegaFeatherRestart);
  const mfLongDuration = nextMegaFeatherRestart > maxTimeValue || mfDuration?.days > 365;
  // `totalFish` includes the fish banked since the last Poppy visit. Using the raw `fish` counter
  // froze these timers, because it only moves when the player opens the Poppy menu in game.
  const kangarooFish = account?.kangaroo?.totalFish;
  const nextFisherooReset = now + (account?.kangaroo?.upgrades?.[6]?.cost - kangarooFish) / account?.kangaroo?.fishRate * 60 * 1000;
  const nextGreatestCatch = now + (account?.kangaroo?.upgrades?.[11]?.cost - kangarooFish) / account?.kangaroo?.fishRate * 60 * 1000;
  const frDuration = getDuration(now, nextFisherooReset);
  const frLongDuration = nextFisherooReset > maxTimeValue || frDuration?.days > 365;
  const gcDuration = getDuration(now, nextGreatestCatch);
  const gcLongDuration = nextGreatestCatch > maxTimeValue || gcDuration?.days > 365;
  const cfDuration = getDuration(now, nextMegaFleshRestart);
  const cfLongDuration = nextMegaFleshRestart > maxTimeValue || cfDuration?.days > 365; 
  const smokerMaxQuality = now + (SMOKER_MAX_QUALITY_SECONDS - (account?.bubba?.smokerSeconds ?? 0)) * 1000;
  const bossOption = trackers?.Etc?.minibosses?.options?.find((opt) => opt?.name === 'bosses');
  const bossSelection = bossOption?.checked ? bossOption?.props?.value : null;
  const showBoss = (key) => bossSelection?.[key] ?? true;
  const minibosses = getMiniBossesData(account).filter(({ rawName }) => showBoss(MINIBOSS_KEYS[rawName]));
  const showDefecaus = showBoss('drDefecaus');
  const showBaba = showBoss('babaYaga');
  // Absolute times off the save time, like the Bosses card, so their cards skip Timer's lastUpdated
  // shift. Rolled on the wall clock: an old save's lastUpdated would leave them in the past, and so would a tab left open.
  const resetClock = Math.max(now, wallClock);
  const dailyReset = getNextResetAt(account, resetClock);
  const weeklyReset = getNextResetAt(account, resetClock, { days: account?.accountOptions?.[OPT.daysUntilWeeklyReset], period: 7 * 864e5 });
  const crystalIsland = getIsland(account, 'Crystal');
  const crystalDays = crystalIsland?.unclaimedDays ?? 0;
  // Each daily reset adds a day. The day before the cap spawns the most mobs, so that day is the visit window.
  const crystalBestDays = CRYSTAL_ISLAND_MAX_DAYS - 1;
  const crystalInWindow = crystalDays === crystalBestDays;
  const crystalCapped = crystalDays >= CRYSTAL_ISLAND_MAX_DAYS;
  const crystalIslandTime = dailyReset == null ? null : dailyReset + Math.max(0, crystalBestDays - 1 - crystalDays) * 86400 * 1000;
  const closestBuilding = account?.towers?.data?.reduce((closestBuilding, building) => {
    const trimmedSlots = getTotalGildedSlots(account);
    const isSlotTrimmed = building?.slot !== -1 && building?.slot < trimmedSlots;
    const buildCost = getBuildCost(account?.towers, building?.level, building?.bonusInc, building?.index);
    // for (l = r._customBlock_WorkbenchStuff("TowerBuildSlots", 0, 0) | 0; g < l; )
    const buildRate = account?.construction?.totalBuildRate;
    const speed = isSlotTrimmed ? getGildedBoostioBonus(account) * buildRate : buildRate;
    const timeLeft = (buildCost - building?.progress) / speed * 1000 * 3600;
    if (building?.inProgress && (closestBuilding?.timeLeft === 0 || timeLeft < closestBuilding?.timeLeft)) {
      return { timeLeft, icon: `ConTower${building?.index}` };
    }
    return closestBuilding;
  }, { timeLeft: 0, icon: '' });
  // Salts the user has unchecked in the timer's selection are ignored (absent option = consider all).
  const saltSelection = trackers?.['World 3']?.closestSalt?.options?.find((opt) => opt?.name === 'salts')?.props?.value;
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
    if (saltSelection && !saltSelection[rawName]) return closestSalt;
    const hasMaterialsForCycle = cost?.every(({
      rawName,
      quantity,
      totalAmount
    }) => totalAmount >= calcCost(account?.refinery, rank, quantity, rawName, saltIndex));
    const { squiresCycles } = getRefineryCycles(account, characters, lastUpdated);
    const { timeLeft, ready } = calcTimeToRankUp(account, characters, lastUpdated, { squiresCycles }, false, rank, powerCap, refined, saltIndex);
    if (!hasMaterialsForCycle) return closestSalt;
    // A salt waiting on a manual rank up would otherwise pin the timer at zero, so it only
    // shows when no other salt is still counting down.
    const isCloser = closestSalt?.timeLeft === 0
      || (closestSalt?.ready && !ready)
      || (closestSalt?.ready === ready && timeLeft < closestSalt?.timeLeft);
    return isCloser ? { timeLeft, icon: rawName, ready } : closestSalt;
  }, { timeLeft: 0, icon: '', ready: false });
  const closestTrap = account?.traps?.reduce((closestTrap, traps) => {
    const times = traps?.map(({ timeLeft }) => timeLeft);
    if (times.length === 0) return closestTrap;
    const lowest = Math.min(...times);
    if (closestTrap === 0 || lowest < closestTrap) {
      return lowest;
    }
    return closestTrap;
  }, 0);
  // Every placed flag builds at the whole board's flaggy rate, not a share of it. Board slots carry
  // their neighbour boost baked into `flagSpeed`; the small cog columns build at the plain rate.
  const closestFlag = [
    ...(account?.construction?.board || []),
    ...(account?.construction?.leftColumn || []),
    ...(account?.construction?.rightColumn || [])
  ].reduce((closestFlag, { flagPlaced, currentAmount, requiredAmount, flagSpeed }) => {
    if (!flagPlaced) return closestFlag;
    const remaining = requiredAmount - currentAmount;
    const rate = flagSpeed || account?.construction?.totalFlaggyRate;
    if (!(remaining > 0) || !(rate > 0)) return closestFlag;
    const timeLeft = remaining / rate * 3600 * 1000;
    if (closestFlag === 0 || timeLeft < closestFlag) {
      return timeLeft;
    }
    return closestFlag;
  }, 0);

  const closestWorshiper = getClosestWorshiper(characters);
  const { timeAway, voteBallot } = account || {};
  const bonusTimeLeft = timeAway ? (604800 - (timeAway?.GlobalTime + 197860 - 604800 * Math.floor((timeAway?.GlobalTime + 197860) / 604800))) * 1000 : 0;
  const meritocracyTimeLeft = timeAway ? (604800 - (timeAway?.GlobalTime + 543460 - 604800 * Math.floor((timeAway?.GlobalTime + 543460) / 604800))) * 1000 : 0;
  // Server-wide weekly boundary (weekly bosses, jewel spinner / chip repo, exotic market). Those all
  // roll on floor(GlobalTime / 604800), which is unrelated to the account's own weekly reset: the same
  // moment for every save, so it reads the clock, not how old this save is.
  const serverWeeklyReset = (Math.floor(resetClock / SERVER_WEEK) + 1) * SERVER_WEEK;
  const nextVoteBonus = now + bonusTimeLeft;
  const nextMeritocracyVote = now + meritocracyTimeLeft;
  const hasVotedBonus = !!voteBallot?.selectedBonus?.[0];
  const hasVotedMeritocracy = !!voteBallot?.selectedMeritocracyBonus?.description;

  const {
    bestWizard,
    bestChargeSyphon,
    timeToOverCharge
  } = getChargeWithSyphon(characters);

  // Helper function to calculate max linear multiplier and time until max
  const calcMonumentInfo = (t) => {
    const holesObject = account?.hole?.holesObject;
    if (!holesObject) return null;
    const maxLinearTime = getMonumentMaxLinearTime(holesObject, t, account);
    const currentTime = holesObject?.extraCalculations?.[Math.round(11 + t)] || 0;
    const maxLinearMulti = (maxLinearTime / 72e3)
      * (1 + getMeritocracyBonus(account, 7) / 100)
      * (1 + getLegendTalentBonus(account, 27) / 100);
    const timeUntilMax = Math.max(0, maxLinearTime - currentTime);
    const timeUntilMaxDate = timeUntilMax > 0 ? now + timeUntilMax * 1000 : null;

    return { maxLinearMulti, timeUntilMax, timeUntilMaxDate };
  };
  const getMonumentMultiInfo = account?.hole?.holesObject ? {
    bravery: calcMonumentInfo(0),
    justice: calcMonumentInfo(1),
    wisdom: calcMonumentInfo(2)
  } : null;

  const researchTimeToLevel = account?.research?.timeToLevel;
  const researchLevelUpTime = researchTimeToLevel != null && account?.research?.researchEXPreq > 0
    ? {
      time: now + researchTimeToLevel * 3600 * 1000,
      currentLevel: account?.research?.researchLevel ?? 0
    }
    : null;

  // Per-observation insight level-up timers: found + optical monocle lens (type 1) + actively gaining insight XP.
  // Use realInsightExpRate (actual level-up speed), NOT insightExpRate (in-game displayed rate - does not match).
  const observationInsightTimes = (account?.research?.observations ?? [])
    .filter((obs) => obs?.found && obs?.lensTypes?.includes(1) && obs?.realInsightExpRate > 0)
    .map((obs) => ({
      index: obs.index,
      name: obs.name,
      insightLevel: obs.insightLevel,
      time: now + ((obs.insightExpREQ - obs.insightExp) / obs.realInsightExpRate) * 3600 * 1000
    }));

  const fountainBars = account?.hole?.caverns?.theFountain?.fountainBars ?? [];
  const coinFillBar = fountainBars.find((b) => b.tier === 0);
  const marbleFillBar = fountainBars.find((b) => b.tier === 1);
  const coinFillIsFull = !!coinFillBar && coinFillBar.progress >= coinFillBar.req;
  const coinFillTime = coinFillBar ? (coinFillIsFull ? now : now + coinFillBar.timeToFullMs) : null;
  const marbleFillIsFull = !!marbleFillBar && marbleFillBar.progress >= marbleFillBar.req;
  const marbleFillTime = marbleFillBar ? (marbleFillIsFull ? now : now + marbleFillBar.timeToFullMs) : null;

  // seedType === -1 is an empty plot; a plot past its growthReq holds a grown crop and stops progressing.
  const growingPlots = (account?.farming?.plot ?? []).filter(({ isLocked, seedType }) => !isLocked && seedType >= 0);
  const nextCropTimeLeft = growingPlots.reduce((closest, { progress, growthReq, timeLeft }) => {
    if (progress >= growthReq) return closest;
    return closest === null || timeLeft < closest ? timeLeft : closest;
  }, null);
  const allCropsGrown = growingPlots.length > 0 && nextCropTimeLeft === null;

  // The soonest an outpost's resource runs out: past that it collects nothing until the daily
  // restock, so this is the deadline for rewiring it to a resource that still has some left.
  const royalCapHours = (account?.royalGuardian?.outposts ?? [])
    .map(({ hoursToNodeCap }) => hoursToNodeCap)
    .filter((hours) => hours != null && Number.isFinite(hours));
  const royalNodeCapTime = royalCapHours.length > 0
    ? now + Math.min(...royalCapHours) * 3600 * 1000
    : null;
  // Every wired outpost is already spent, which is a state the countdown itself cannot show.
  const royalAllNodesEmpty = (account?.royalGuardian?.outposts ?? [])
    .some(({ mode, connectedNodes }) => mode !== 1 && connectedNodes?.length > 0)
    && royalCapHours.length === 0;

  // Overstim gains at overstimRate per hour and levels when it reaches 100 * 1.3^level, so the
  // countdown is the same shape as the research one. A rate of 0 means the meter is still locked
  // (spelunking shop upgrade 6), and there is nothing to count down to.
  // Effective, not stored: the game banks overstim while you are away and only spends it into levels
  // once the spelunking screen draws, so the stored level lags behind what the meter will read.
  const spelunking = account?.spelunking;
  const overstimLevelUpTime = spelunking?.overstimRate > 0
    ? now + ((spelunking.overstimEffectiveReq - spelunking.overstimEffectiveCurrent) / spelunking.overstimRate) * 3600 * 1000
    : null;

  const sushiFuel = account?.sushiStation?.fuel;
  const sushiFuelIsFull = sushiFuel && sushiFuel.cap > 0 && sushiFuel.current >= sushiFuel.cap;
  const sushiFuelFullTime = sushiFuel && sushiFuel.generation > 0 && !sushiFuelIsFull
    ? now + ((sushiFuel.cap - sushiFuel.current) / sushiFuel.generation) * 3600 * 1000
    : null;

  return <>
    <CardGrid size={'s'} flow>
      {!emptyAlerts?.General && <Section title={'General'}>
        {trackers?.General?.daily?.checked && <TimerRow target="General.daily"
          time={dailyReset}
          icon={'etc/Daily.png'}
        />}
        {trackers?.General?.weekly?.checked && <TimerRow target="General.weekly"
          time={weeklyReset}
          icon={'etc/Weekly.png'}
        />}
        {trackers?.General?.serverWeekly?.checked && timeAway ? <TimerRow target="General.serverWeekly"
          message={(when) => <Stack gap={0.5}>
            <Typography variant="body2">Server weekly reset: {when}</Typography>
            <Typography variant="body2">Weekly bosses, jewel spinner, chip repo, exotic market</Typography>
          </Stack>}
          time={serverWeeklyReset}
          icon={'etc/Server.png'}
        /> : null}
        {trackers?.General?.companions?.checked && <TimerRow target="General.companions"
          page={'/account/prem-currency/pets'}
          failed={failed('companions')}
          time={nextCompanionClaim}
          icon={'afk_targets/Dog.png'}
          placeholder={'Claim'}
        />}
        {trackers?.General?.crystalIsland?.checked && crystalIsland?.unlocked ? <TimerRow target="General.crystalIsland"
          page={'/account/world-2/islands'}
          sub={`${crystalDays} / ${CRYSTAL_ISLAND_MAX_DAYS} days`}
          message={(when) => <Stack gap={0.5}>
            <Typography variant="body2">Crystal Island: {crystalDays}/{CRYSTAL_ISLAND_MAX_DAYS} days ({crystalIsland?.mobsWaiting} mobs waiting)</Typography>
            <Typography variant="body2">{crystalCapped
              ? `Capped: extra days are lost, visit now`
              : crystalInWindow
                ? `Visit before it caps: ${when}`
                : `${crystalBestDays} days (${getCrystalIslandMobs(crystalBestDays)} mobs): ${when}`}</Typography>
          </Stack>}
          time={crystalIslandTime}
          icon={'afk_targets/Crystal_Carrot.png'}
          placeholder={crystalInWindow || crystalCapped ? 'Capped' : 'Visit'}
          placeholderStatus={crystalInWindow || crystalCapped ? 'problem' : 'ready'}
          forcePlaceholder={crystalCapped}
          state={crystalInWindow ? <StatusText status={'ready'}>Visit</StatusText> : null}
        /> : null}
        {trackers?.General?.syphonCharge?.checked && account?.finishedWorlds?.World2 ? <TimerRow target="General.syphonCharge"
          page={'/account/world-3/worship'}
          message={(when) => `Charge Syphon overflows at ${formatNum(bestWizard?.worship?.maxCharge + bestChargeSyphon, 'whole')} charge: ${when}`}
          time={timeToOverCharge}
          icon={'data/UISkillIcon475.png'}
          placeholder={'Full'}
        /> : null}
        {trackers?.General?.closestFullWorship?.checked && account?.finishedWorlds?.World2 && closestWorshiper?.timeLeft !== 0
          ? <TimerRow target="General.closestFullWorship"
            page={'/account/world-3/worship'}
            sub={closestWorshiper?.character}
            message={(when) => (closestWorshiper?.character
              ? `Closest full worship: ${closestWorshiper?.character}, ${when}`
              : 'All characters charge is full')}
            placeholder={'Full'}
            forcePlaceholder={!isFinite(closestWorshiper?.timeLeft)}
            time={now + closestWorshiper?.timeLeft}
            icon={'data/WorshipSkull3.png'}/>
          : null}
        {trackers?.General?.dungeonHappyHour?.checked && nextHappyHours?.length > 0 ? <TimerRow target="General.dungeonHappyHour"
          page={'/account/misc/dungeons'}
          time={nextHappyHours?.[0]}
          icon={'etc/Happy_Hour.png'}
          placeholder={'Claim'}
        /> : null}
        {trackers?.General?.randomEvents?.checked && events?.length > 0 ? <TimerRow target="General.randomEvents"
          page={'/account/misc/random-events'}
          sub={cleanUnderscore(nextEvent?.eventName)}
          message={() => <RandomEvent {...nextEvent}/>}
          time={nextEvent?.date}
          placeholder={'Started'}
          icon={`etc/${nextEvent?.eventName}.png`}
        /> : null}
        {trackers?.General?.sailingTrades?.checked && account?.finishedWorlds?.World4 && account?.sailing?.trades?.length > 0
          ? <TimerRow target="General.sailingTrades"
            page={'/account/world-5/sailing'} query={{ t: 'Trades' }}
            message={() => <Trade {...account?.sailing?.trades?.[0]}/>}
            time={new Date(account?.sailing?.trades?.[0]?.date).getTime()}
            placeholder={'Open'}
            icon={`data/${account?.sailing?.trades?.[0]?.rawName}.png`}
          /> : null}
      </Section>}
      {!emptyAlerts?.Clickers && <Section title={'Clickers'}>
        {trackers?.Clickers?.featherRestart?.checked && account?.accountOptions?.[OPT.owlFeathers] > 0 ? <TimerRow target="Clickers.featherRestart"
          page={'/account/clickers/owl'}
          long={longTimer(nextFeatherRestart, fLongDuration)}
          failed={failed('owl')}
          time={nextFeatherRestart}
          icon={'etc/Owl_4.png'}
          placeholder={'Restart available'}
        /> : null}
        {trackers?.Clickers?.megaFeatherRestart?.checked && account?.accountOptions?.[OPT.owlFeathers] > 0 ? <TimerRow target="Clickers.megaFeatherRestart"
          page={'/account/clickers/owl'}
          long={longTimer(nextMegaFeatherRestart, mfLongDuration)}
          failed={failed('owl')}
          time={nextMegaFeatherRestart}
          icon={'etc/Owl_8.png'}
          placeholder={'Restart available'}
        /> : null}
        {trackers?.Clickers?.fisherooReset?.checked && kangarooFish > 0 ? <TimerRow target="Clickers.fisherooReset"
          page={'/account/clickers/kangaroo'}
          long={longTimer(nextFisherooReset, frLongDuration)}
          failed={failed('kangaroo')}
          time={nextFisherooReset}
          icon={'etc/KUpga_6.png'}
          placeholder={'Restart available'}
        /> : null}
        {trackers?.Clickers?.greatestCatch?.checked && kangarooFish > 0 ? <TimerRow target="Clickers.greatestCatch"
          page={'/account/clickers/kangaroo'}
          long={longTimer(nextGreatestCatch, gcLongDuration)}
          failed={failed('kangaroo')}
          time={nextGreatestCatch}
          icon={'etc/KUpga_11.png'}
          placeholder={'Restart available'}
        /> : null}
        {trackers?.Clickers?.megaFleshRestart?.checked && account?.bubba ? <TimerRow target="Clickers.megaFleshRestart"
          page={'/account/clickers/bubba'}
          long={longTimer(nextMegaFleshRestart, cfLongDuration)}
          failed={failed('bubba')}
          time={nextMegaFleshRestart}
          icon={'etc/Bubbo_Upgrade_8.png'}
          placeholder={'Restart available'}
        /> : null}
        {trackers?.Clickers?.smokerMax?.checked && account?.bubba?.smokerUnlocked ? <TimerRow target="Clickers.smokerMax"
          page={'/account/clickers/bubba'}
          message={(when) => <Stack gap={0.5}>
            <Typography variant="body2">Smoking for {splitTime((account?.bubba?.smokerSeconds ?? 0) / 3600)}</Typography>
            <Typography variant="body2">Max smoked meat quality: {when}</Typography>
          </Stack>}
          time={smokerMaxQuality}
          icon={'data/BubbaSmokedmeat4.png'}
          placeholder={'Smoker ready'}
        /> : null}
      </Section>}
      {(trackers?.Etc?.bonusTimeLeft?.checked || trackers?.Etc?.meritocracyTimeLeft?.checked) && timeAway && <Section title={'Vote'}>
        {trackers?.Etc?.bonusTimeLeft?.checked && <TimerRow target="Etc.bonusTimeLeft"
          page={'/account/world-2/vote-ballot'}
          message={(when) => <Stack gap={0.5}>
            {voteBallot?.selectedBonus?.[0] && <Typography variant="body2">{cleanUnderscore(fillVoteText(voteBallot.selectedBonus[0], voteBallot.selectedBonus?.bonus))}</Typography>}
            <Typography variant="body2">Next vote bonus week: {when}</Typography>
          </Stack>}
          time={nextVoteBonus}
          placeholder={'New week'}
          icon={voteBallot?.selectedBonus?.icon ? `data/${voteBallot.selectedBonus.icon}` : 'etc/Weekly.png'}
          state={!hasVotedBonus && !failed('voteBallot') ? <StatusText status={'needs'}>Not voted</StatusText> : null}
        />}
        {trackers?.Etc?.meritocracyTimeLeft?.checked && <TimerRow target="Etc.meritocracyTimeLeft"
          page={'/account/world-2/vote-ballot'}
          message={(when) => <Stack gap={0.5}>
            {voteBallot?.selectedMeritocracyBonus?.description && <Typography variant="body2">{cleanUnderscore(fillVoteText(voteBallot.selectedMeritocracyBonus.description, voteBallot.selectedMeritocracyBonus?.bonus))}</Typography>}
            <Typography variant="body2">Next meritocracy vote week: {when}</Typography>
          </Stack>}
          time={nextMeritocracyVote}
          placeholder={'New week'}
          icon={voteBallot?.selectedMeritocracyBonus?.icon ? `data/${voteBallot.selectedMeritocracyBonus.icon}` : 'etc/Weekly.png'}
          state={!hasVotedMeritocracy && !failed('voteBallot') ? <StatusText status={'needs'}>Not voted</StatusText> : null}
        />}
      </Section>}
      {!emptyAlerts?.['World 3'] && account?.finishedWorlds?.World2 && <Section title={'World 3'}>
        {trackers?.['World 3']?.printer?.checked && account?.finishedWorlds?.World2 ? <TimerRow target="World 3.printer"
          page={'/account/world-3/printer'}
          time={nextPrinterCycle} icon={'data/ConTower0.png'}/> : null}
        {trackers?.['World 3']?.closestTrap?.checked && account?.finishedWorlds?.World2 && closestTrap !== 0 ?
          <TimerRow target="World 3.closestTrap"
            page={'/account/world-3/traps'}
            lastUpdated={lastUpdated} time={closestTrap} icon={'data/TrapBoxSet1.png'}/>
          : null}
        {trackers?.['World 3']?.closestFlag?.checked && account?.finishedWorlds?.World2 && closestFlag !== 0 ?
          <TimerRow target="World 3.closestFlag"
            page={'/account/world-3/construction'}
            time={now + closestFlag} icon={'data/CogFLflag.png'}/>
          : null}
        {trackers?.['World 3']?.closestBuilding?.checked && account?.finishedWorlds?.World2 && closestBuilding?.timeLeft !== 0
          ?
          <TimerRow target="World 3.closestBuilding"
            page={'/account/world-3/buildings'}
            failed={failedAny(BUILDING_SECTIONS)}
            time={now + closestBuilding?.timeLeft}
            icon={`data/${closestBuilding?.icon}.png`}/>
          : null}
        {trackers?.['World 3']?.closestSalt?.checked && account?.finishedWorlds?.World2 && closestSalt && closestSalt?.timeLeft !== 0 ?
          <TimerRow target="World 3.closestSalt" items={[{ key: closestSalt?.icon }]}
            page={'/account/world-3/refinery'}
            failed={failedAny(SALT_SECTIONS)}
            lastUpdated={lastUpdated} time={closestSalt?.timeLeft}
            icon={`data/${closestSalt?.icon}.png`}/> : null}
        {trackers?.['World 3']?.equinox?.checked && account?.finishedWorlds?.World2 ? <TimerRow target="World 3.equinox"
          page={'/account/world-3/equinox'}
          placeholder={'Full'}
          failed={failed('equinox')}
          message={(when, over) => (over ? 'The Equinox bar is full' : `Equinox bar full: ${when}`)}
          lastUpdated={lastUpdated} time={account?.equinox?.timeToFull} icon={'data/Quest78.png'}/> : null}
      </Section>}
      {!emptyAlerts?.['World 5'] && account?.finishedWorlds?.World4 && <Section title={'World 5'}>
        {trackers?.['World 5']?.bravery?.checked && account?.finishedWorlds?.World4 ?
          <MonumentRow target="World 5.bravery"
            page={'/account/world-5/hole'}
            query={{ t: 'Explore', nt: 'Bravery' }}
            failed={failedAny(MONUMENT_SECTIONS)}
            currentMulti={account?.hole?.caverns?.bravery?.rewardMulti || 0}
            maxMulti={getMonumentMultiInfo?.bravery?.maxLinearMulti || 0}
            timeUntilMax={getMonumentMultiInfo?.bravery?.timeUntilMaxDate}
            icon={`etc/Bravery_Statue.png`}/> : null}
        {trackers?.['World 5']?.justice?.checked && account?.finishedWorlds?.World4 ?
          <MonumentRow target="World 5.justice"
            page={'/account/world-5/hole'}
            query={{ t: 'Explore', nt: 'Justice' }}
            failed={failedAny(MONUMENT_SECTIONS)}
            currentMulti={account?.hole?.caverns?.justice?.rewardMulti || 0}
            maxMulti={getMonumentMultiInfo?.justice?.maxLinearMulti || 0}
            timeUntilMax={getMonumentMultiInfo?.justice?.timeUntilMaxDate}
            icon={`data/Justice_Monument_x1.png`}/> : null}
        {trackers?.['World 5']?.wisdom?.checked && account?.finishedWorlds?.World4 ?
          <MonumentRow target="World 5.wisdom"
            page={'/account/world-5/hole'}
            query={{ t: 'Explore', nt: 'Wisdom' }}
            failed={failedAny(MONUMENT_SECTIONS)}
            currentMulti={account?.hole?.caverns?.wisdom?.rewardMulti || 0}
            maxMulti={getMonumentMultiInfo?.wisdom?.maxLinearMulti || 0}
            timeUntilMax={getMonumentMultiInfo?.wisdom?.timeUntilMaxDate}
            icon={`data/Wisdom_Monument_x1.png`}/> : null}
        {trackers?.['World 5']?.villagers?.checked && account?.finishedWorlds?.World4 && account?.hole?.villagers?.length > 0 ?
          account?.hole?.villagers?.map((villager, index) => {
            if (!villager) return null;
            // Skip villagers the user has unchecked in the timer's selection (absent option = show all).
            const villagerSelection = trackers?.['World 5']?.villagers?.options?.find((opt) => opt?.name === 'villagers')?.props?.value;
            if (villagerSelection && !villagerSelection[VILLAGER_KEYS[index]]) return null;
            const villagerTab = VILLAGER_TABS[index] ?? 'Explore';
            return <TimerRow target="World 5.villagers" items={[{ key: VILLAGER_KEYS[index], label: villager?.name }]}
              key={`villager-timer-${index}`}
              name={`${villager?.name} level up`}
              page={'/account/world-5/hole'}
              query={{ t: villagerTab }}
              time={villager?.readyToLevel ? now : now + villager?.timeLeft}
              icon={`etc/Villager_${index}.png`}
              placeholder={'Ready to level'}
              forcePlaceholder={villager?.readyToLevel}
            />
          })
          : null}
        {trackers?.['World 5']?.coinFill?.checked && coinFillBar ? <TimerRow target="World 5.coinFill"
          page={'/account/world-5/hole'}
          query={{ t: 'Explore', nt: 'The Fountain' }}
          message={(when) => `${cleanUnderscore(coinFillBar.name)}: ${when}`}
          time={coinFillTime}
          icon={'data/HoleFountainBar0.png'}
          placeholder={'Full'}
          forcePlaceholder={coinFillIsFull}
        /> : null}
        {trackers?.['World 5']?.marbleFill?.checked && marbleFillBar ? <TimerRow target="World 5.marbleFill"
          page={'/account/world-5/hole'}
          query={{ t: 'Explore', nt: 'The Fountain' }}
          message={(when) => `${cleanUnderscore(marbleFillBar.name)}: ${when}`}
          time={marbleFillTime}
          icon={'data/HoleFountainBar1.png'}
          placeholder={'Full'}
          forcePlaceholder={marbleFillIsFull}
        /> : null}
      </Section>}

      {!emptyAlerts?.['World 6'] && account?.finishedWorlds?.World5 && <Section title={'World 6'}>
        {trackers?.['World 6']?.cropsReady?.checked && (nextCropTimeLeft !== null || allCropsGrown) ? <TimerRow target="World 6.cropsReady"
          page={'/account/world-6/farming'}
          message={(when, over) => (over ? 'All crops are fully grown' : `Next crop fully grown: ${when}`)}
          time={allCropsGrown ? now : now + nextCropTimeLeft * 1000}
          icon={'data/FarmPlant6.png'}
          placeholder={'Crops ready'}
          forcePlaceholder={allCropsGrown}
        /> : null}
      </Section>}

      {!emptyAlerts?.['World 7'] && account?.finishedWorlds?.World6 && <Section title={'World 7'}>
        {trackers?.['World 7']?.researchLevelUp?.checked && researchLevelUpTime ?
          <TimerRow target="World 7.researchLevelUp"
            page={'/account/world-7/research'}
            message={(when) => `Research Lv ${researchLevelUpTime.currentLevel + 1}: ${when}`}
            time={researchLevelUpTime.time}
            icon={'data/ClassIcons61.png'}
          /> : null}
        {trackers?.['World 7']?.sushiFuelFull?.checked && (sushiFuelFullTime || sushiFuelIsFull) ?
          <TimerRow target="World 7.sushiFuelFull"
            page={'/account/world-7/sushi-station'}
            message={(when, over) => (over ? 'Sushi fuel is full' : `Sushi fuel full: ${when}`)}
            time={sushiFuelFullTime ?? now}
            icon={'etc/Fuel.png'}
            placeholder={'Full'}
            forcePlaceholder={sushiFuelIsFull}
          /> : null}
        {trackers?.['World 7']?.royalNodeCap?.checked && (royalNodeCapTime || royalAllNodesEmpty) ?
          <TimerRow target="World 7.royalNodeCap"
            page={'/account/class-specific/royal-armory'}
            message={(when, over) => (royalAllNodesEmpty ? 'Every connected resource is empty'
              : over ? 'An outpost has run out of its resource' : `Next outpost resource runs out: ${when}`)}
            time={royalNodeCapTime ?? now}
            icon={'data/UISkillIcon226.png'}
            placeholder={'Empty'}
            placeholderStatus={'problem'}
            forcePlaceholder={royalAllNodesEmpty}
          /> : null}
        {trackers?.['World 7']?.overstim?.checked && overstimLevelUpTime ?
          <TimerRow target="World 7.overstim"
            page={'/account/world-7/spelunking'}
            message={() => `Overstim Lv ${spelunking.overstimEffectiveLevel} → ${spelunking.overstimEffectiveLevel
              + 1}: ${formatGame(spelunking.overstimEffectiveCurrent, 'Spelunk.OverstimQtyREQ', { ruleValue: spelunking.overstimEffectiveReq, whole: true })} / ${formatGame(spelunking.overstimEffectiveReq, 'Spelunk.OverstimQtyREQ', { whole: true })}${spelunking.overstimPendingLevels > 0
                ? ` (${spelunking.overstimPendingLevels} level${spelunking.overstimPendingLevels > 1 ? 's' : ''} banked, they apply when you open spelunking)`
                : ''}`}
            time={overstimLevelUpTime}
            icon={'data/CaveShopUpg6.png'}
          /> : null}
        {trackers?.['World 7']?.observationInsight?.checked
          ? observationInsightTimes.map((obs) =>
            <TimerRow target="World 7.observationInsight"
              key={`observation-insight-${obs.index}`}
              name={`${cleanUnderscore(obs.name)} → insight Lv ${obs.insightLevel + 1}`}
              page={'/account/world-7/research'}
              time={obs.time}
              icon={'data/ResMagni1.png'}
            />)
          : null}
      </Section>}

      {trackers?.Etc?.minibosses?.checked && <Section title={'Bosses'}>
        {showDefecaus || showBaba
          ? <BossRespawns account={account} characters={characters} lastUpdated={lastUpdated} showDefecaus={showDefecaus} showBaba={showBaba}/>
          : null}
        {minibosses?.map((miniboss) => <MinibossRow key={`miniboss-timer-${miniboss.rawName}`} {...miniboss}/>)}
      </Section>}
      {trackers?.Etc?.library?.checked && account?.finishedWorlds?.World2
        ? <Library libraryTimes={account?.libraryTimes} failed={account?.failedSections?.length > 0}/> : null}
    </CardGrid>
  </>
};

const MINIBOSS_KEYS = {
  mini3b: 'dilapidatedSlush',
  mini4b: 'mutatedMush',
  mini5a: 'domeoMagmus',
  mini6a: 'dementedSpiritlord'
};

// Past a year (or never) a countdown says so instead of counting: the same cut-off for every Clickers timer.
const longTimer = (time, long) => !isFinite(time) || (!isPast(time) && long);

const TIMER_ICON_SIZE = 32;

// A row with nothing to say isn't drawn: no time (its data is missing), and no word or value in its place.
const hasValue = ({ long, forcePlaceholder, value, time }) => long || forcePlaceholder || value !== undefined || Number.isFinite(time);

// A group of timers under its title. Draws nothing when no timer renders (toArray strips null, false and true), so
// checked alerts whose data yields nothing never leave a bare title.
const Section = ({ title, children }) => {
  const rows = React.Children.toArray(children).filter((child) => child.type !== TimerRow || hasValue(child.props));
  if (!rows.length) return null;
  return <Panel title={title}>{rows}</Panel>;
};

// When a row's time ends. A time the parsers anchored on their own clock has the save's age off it, as its Timer takes.
// Plain functions so React Compiler reads the clock each time the row's values change, never only once.
const deadlineOf = (time, lastUpdated) => (lastUpdated ? time - (Date.now() - lastUpdated) : time);
const isOver = (deadline) => deadline <= Date.now();

// A timer as the Cards board draws a Panel row: its icon, which opens the alert's quick edit, its name (the alert's, or
// name), one muted line, and at the right its countdown or its state, a link to the page. The muted line is sub, or state
// (what qualifies a countdown), or the exact time while it counts. message(when, over): the quick edit's words, with when
// the row's own state (the exact time, its word, or "A long time"), so they never contradict it.
// placeholderStatus: "ready" for a state to act on, "problem" for one that costs something; past its time a row with no
// word reads Ready. lastUpdated: only a time the parsers anchor on their own clock (see Timer). failed: read from a failed
// section's default. value: a row that shows something else than a countdown.
const TimerRow = ({
  target, items, name, sub, icon, message, page, query, time, placeholder = 'Ready', placeholderStatus = 'ready', forcePlaceholder,
  state, value: ownValue, lastUpdated, long, failed
}) => {
  const router = useRouter();
  const formatDate = useFormatDate();
  const title = name ?? alertMeta[`timers.${target}`]?.label;
  const word = <StatusText status={placeholderStatus}>{placeholder}</StatusText>;
  // No time to count to (a save with no reset countdown): the row says what a failed one says, never a state
  const noTime = failed || (time == null && ownValue === undefined && !forcePlaceholder);
  const deadline = deadlineOf(time, lastUpdated);
  // A date past what a Date can hold has no exact time either
  const farOff = long || (Number.isFinite(deadline) && !isValid(new Date(deadline)));
  const over = !farOff && (forcePlaceholder || isOver(deadline));
  const when = farOff ? 'A long time' : over ? placeholder : formatDate(deadline, { showSeconds: false });
  const words = noTime ? undefined : message ? message(when, over) : `${title}: ${when}`;
  const shown = noTime ? '-'
    : ownValue !== undefined ? ownValue
      : farOff ? 'A long time'
        : forcePlaceholder ? word
          : <Timer type={'countdown'} date={time} lastUpdated={lastUpdated} component={'span'} placeholder={word}/>;
  const href = page ? { pathname: page, query: { ...sessionQuery(router.query), ...query } } : null;
  const line = noTime ? null : state ?? sub ?? (farOff || over ? null : when);
  return <Panel.Row name={title} sub={line}
                    icon={<AlertIcon configType={'timers'} target={target} extra={items ? { items } : undefined} message={words}
                                     label={typeof words === 'string' ? undefined : title} icon={icon} size={TIMER_ICON_SIZE}/>}
                    value={href && !noTime ? <Link component={NextLink} href={href} color={'inherit'} variant={'body2'}>{shown}</Link> : shown}/>;
};

// A miniboss: its icon opens the alert's quick edit, its name links to the Death Note, and it reads how many wait.
const MinibossRow = ({ rawName, name, current, daysTillNext, maxed }) => {
  const router = useRouter();
  return <Stack direction={'row'} alignItems={'center'} gap={1.5} sx={{ px: 2, py: 1.25 }}>
    <AlertIcon configType={'timers'} target="Etc.minibosses" extra={{ items: [{ key: MINIBOSS_KEYS[rawName] }] }}
               icon={`etc/${rawName}.png`} size={TIMER_ICON_SIZE}/>
    <Stack sx={{ minWidth: 0 }}>
      <Link component={NextLink} href={{ pathname: '/account/world-3/death-note', query: sessionQuery(router.query) }}
            color={'inherit'} variant={'body2'} sx={{ fontWeight: 500 }}>{cleanUnderscore(name)}</Link>
      {maxed
        ? <StatusText status={'ready'}>{`Maxed (${formatNum(current)})`}</StatusText>
        : <Typography variant={'body2'} color={'text.secondary'}>
          {`Current ${formatNum(current)} · +1 in ${formatNum(daysTillNext)} day${daysTillNext === 1 ? '' : 's'}`}
        </Typography>}
    </Stack>
  </Stack>;
};

// A monument's reward multi against its max linear growth; past that max it's time to fight.
const MonumentRow = ({ page, query, currentMulti, maxMulti, timeUntilMax, icon, target, items, failed }) => {
  const formatDate = useFormatDate();
  const current = formatNum(currentMulti, 'mult');
  const max = formatNum(maxMulti, 'mult');
  const isOverMax = Math.round(100 * currentMulti) > Math.round(100 * maxMulti);
  const line = timeUntilMax
    ? `Max linear growth: ${formatDate(timeUntilMax, { showSeconds: false })}`
    : 'At max linear growth';
  const pair = `${current} / ${max}`;
  return <TimerRow target={target} items={items} icon={icon} page={page} query={query} failed={failed}
                   message={() => (isOverMax ? `Past its max linear growth: ${pair}` : line)} sub={isOverMax ? pair : line}
                   value={isOverMax ? <StatusText status={'ready'}>Fight</StatusText> : <Box component={'span'} sx={{ whiteSpace: 'nowrap' }}>{pair}</Box>}/>;
};

export default Etc;
