import React, { createContext, useContext, useState } from 'react';
import NextLink from 'next/link';
import { Box, Button, Collapse, Link, Stack, Typography } from '@mui/material';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { cleanUnderscore, formatDuration, formatNum, getDuration, getNextCompanionClaim, getNextResetAt, splitTime } from '@utility/helpers';
import { fillVoteText, formatGame } from '@utility/gameNotation';
import useFormatDate from '@hooks/useFormatDate';
import useNow from '@hooks/useNow';
import { getBooksReachedAt, getMiniBossesData, getRandomEvents } from '@parsers/misc';
import Timer from '../common/Timer';
import StatusText from '@components/common/StatusText';
import { isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { cardSurface } from '@components/common/cards/tokens';
import CardGrid from '@components/common/cards/CardGrid';
import { LinkMark } from '@components/common/cards/ItemCard';
import ViewSwitch from '@components/common/ViewSwitch';
import useToolbarState from '@hooks/useToolbarState';
import InfoButton from '@components/common/InfoButton';
import AlertIcon, { counted } from './AlertIcon';
import { alertMeta } from '@utility/dashboard/alertMeta';
import { calcHappyHours } from '@parsers/dungeons';
import { getBuildCost, getGildedBoostioBonus, getTotalGildedSlots } from '@parsers/world-3/construction';
import { getChargeWithSyphon, getClosestWorshiper } from '@parsers/world-3/worship';
import { isPast, isValid } from 'date-fns';
import RandomEvent from '@components/account/Misc/RandomEvent';
import Trade from '@components/account/Worlds/World5/Sailing/Trade';
import { BabaNote, DefecausNote, KilledButton, UndoKill } from './BossRespawns';
import useBossRespawns from '@hooks/useBossRespawns';
import { isMinibossReady } from '@utility/dashboard/bossRespawns';
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
const SECOND = 1000;
const MINUTE = 60 * 1000;
const DAY = 864e5;
const WEEK = 7 * DAY;
const YEAR = 365 * DAY;
const DEATH_NOTE = '/account/world-3/death-note';
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
// bookAlert, bossAlert: the Talent library and Miniboss kills stacked alerts' trackers, whose numbers the rows read, the alert on or off.
export const useTimerRows = ({ characters, account, lastUpdated, trackers, bookAlert, bossAlert }) => {
  const failed = (section) => isSectionFailed(account, section);
  const failedAny = (sections) => sections.some(failed);
  // Anchor timer math to `lastUpdated` (the data-fetch timestamp) rather than `new Date().getTime()`.
  // React Compiler hoists `new Date().getTime()` into a no-dep memo slot and never re-runs it, so timers
  // drifted by an extra refresh interval each time data updated. A row's time is then a real date, so its
  // Timer takes no lastUpdated, except the three the parsers anchor on their own clock (trap, salt, equinox).
  const now = lastUpdated ?? new Date().getTime();
  const wallClock = useNow(MINUTE);
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
  const killsWanted = bossAlert?.options?.find(({ name }) => name === 'miniBosses')?.props?.value;
  const {
    tracked,
    nextReset,
    defecausStatus,
    babaUp,
    babaRespawnAt,
    babaKilledAt,
    killDefecaus,
    undoDefecaus,
    killBaba,
    undoBaba
  } = useBossRespawns({ account, characters, lastUpdated });
  const defecausUp = defecausStatus === 'up';
  const dailyReset = getNextResetAt(account, Math.max(now, wallClock));
  const books = account?.libraryTimes?.bookCount;
  const booksWanted = Number(bookAlert?.options?.find(({ name }) => name === 'books')?.props?.value);
  const booksShort = books < booksWanted;
  const booksAt = booksShort ? getBooksReachedAt(account, booksWanted) : null;
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
  // Vote weeks run on a fixed weekly schedule, so an old save still has a next one: read from the clock, not the save.
  const voteWeekEnds = (offset) => {
    const clock = Math.max(now, wallClock) / 1000;
    return (clock + 604800 - (clock + offset) % 604800) * 1000;
  };
  const nextVoteBonus = voteWeekEnds(197860);
  const nextMeritocracyVote = voteWeekEnds(543460);
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

  const rows = [
    ...inWorld('General', !emptyAlerts?.General && <>
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
          actNow={crystalInWindow}
        /> : null}
        {trackers?.General?.syphonCharge?.checked && account?.finishedWorlds?.World2 && bestWizard ? <TimerRow target="General.syphonCharge"
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
    </>),
    ...inWorld('Bosses', trackers?.Etc?.minibosses?.checked && <>
        {showBoss('drDefecaus') ? <TimerRow target="Etc.minibosses" items={[{ key: 'drDefecaus', label: 'Dr Defecaus' }]}
          name={'Dr Defecaus'}
          page={DEATH_NOTE}
          icon={'monsters/poopBig/static.png'}
          info={<DefecausNote tracked={tracked}/>}
          {...bossProps({ name: 'Dr Defecaus', up: defecausUp, onKill: killDefecaus, onUndo: undoDefecaus, waitDate: nextReset })}
        /> : null}
        {showBoss('babaYaga') ? <TimerRow target="Etc.minibosses" items={[{ key: 'babaYaga', label: 'Baba Yaga' }]}
          name={'Baba Yaga'}
          page={DEATH_NOTE}
          icon={'monsters/babayaga/static.png'}
          info={<BabaNote tracked={tracked} up={babaUp} killedAt={babaKilledAt}/>}
          {...bossProps({ name: 'Baba Yaga', up: babaUp, onKill: killBaba, onUndo: undoBaba, waitDate: babaRespawnAt })}
        /> : null}
        {minibosses?.map((miniboss) => <TimerRow target="Etc.minibosses"
          key={`miniboss-timer-${miniboss.rawName}`}
          items={[{ key: MINIBOSS_KEYS[miniboss.rawName], label: cleanUnderscore(miniboss.name) }]}
          name={cleanUnderscore(miniboss.name)}
          page={DEATH_NOTE}
          icon={`etc/${miniboss.rawName}.png`}
          {...minibossProps(miniboss, dailyReset, killsWanted)}
        />)}
    </>),
    ...inWorld('Clickers', !emptyAlerts?.Clickers && <>
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
    </>),
    ...inWorld('Vote', (trackers?.Etc?.bonusTimeLeft?.checked || trackers?.Etc?.meritocracyTimeLeft?.checked) && timeAway && <>
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
    </>),
    ...inWorld('World 3', !emptyAlerts?.['World 3'] && account?.finishedWorlds?.World2 && <>
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
    </>),
    ...inWorld('World 3', trackers?.Etc?.library?.checked && account?.finishedWorlds?.World2 && Number.isFinite(booksWanted) && <>
        <TimerRow target="Etc.library" key={'library'}
          name={'Library'}
          page={'/account/misc/general'}
          failed={account?.failedSections?.length > 0 || !Number.isFinite(books)}
          state={booksShort ? `${formatNum(books, 'whole')} / ${formatNum(booksWanted, 'whole')} books` : null}
          message={(when, over) => (over ? `Library: ${counted(Math.max(books, booksWanted), 'book')}` : `${counted(booksWanted, 'book')} in the library: ${when}`)}
          time={booksAt}
          icon={'data/Libz.png'}
          placeholder={counted(Math.max(books, booksWanted), 'book')}
          forcePlaceholder={!booksShort}
          long={booksShort && !(booksAt - Math.max(now, wallClock) < YEAR)}
        />
    </>),
    ...inWorld('World 5', !emptyAlerts?.['World 5'] && account?.finishedWorlds?.World4 && <>
        {trackers?.['World 5']?.bravery?.checked && account?.finishedWorlds?.World4 ?
          <TimerRow target="World 5.bravery"
            page={'/account/world-5/hole'}
            query={{ t: 'Explore', nt: 'Bravery' }}
            failed={failedAny(MONUMENT_SECTIONS)}
            {...monumentProps(account?.hole?.caverns?.bravery?.rewardMulti || 0, getMonumentMultiInfo?.bravery)}
            icon={`etc/Bravery_Statue.png`}/> : null}
        {trackers?.['World 5']?.justice?.checked && account?.finishedWorlds?.World4 ?
          <TimerRow target="World 5.justice"
            page={'/account/world-5/hole'}
            query={{ t: 'Explore', nt: 'Justice' }}
            failed={failedAny(MONUMENT_SECTIONS)}
            {...monumentProps(account?.hole?.caverns?.justice?.rewardMulti || 0, getMonumentMultiInfo?.justice)}
            icon={`data/Justice_Monument_x1.png`}/> : null}
        {trackers?.['World 5']?.wisdom?.checked && account?.finishedWorlds?.World4 ?
          <TimerRow target="World 5.wisdom"
            page={'/account/world-5/hole'}
            query={{ t: 'Explore', nt: 'Wisdom' }}
            failed={failedAny(MONUMENT_SECTIONS)}
            {...monumentProps(account?.hole?.caverns?.wisdom?.rewardMulti || 0, getMonumentMultiInfo?.wisdom)}
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
    </>),
    ...inWorld('World 6', !emptyAlerts?.['World 6'] && account?.finishedWorlds?.World5 && <>
        {trackers?.['World 6']?.cropsReady?.checked && (nextCropTimeLeft !== null || allCropsGrown) ? <TimerRow target="World 6.cropsReady"
          page={'/account/world-6/farming'}
          message={(when, over) => (over ? 'All crops are fully grown' : `Next crop fully grown: ${when}`)}
          time={allCropsGrown ? now : now + nextCropTimeLeft * 1000}
          icon={'data/FarmPlant6.png'}
          placeholder={'Crops ready'}
          forcePlaceholder={allCropsGrown}
        /> : null}
    </>),
    ...inWorld('World 7', !emptyAlerts?.['World 7'] && account?.finishedWorlds?.World6 && <>
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
    </>)
  ];

  return rows;
};

// By time answers "what's next?", by world "where's my salt?": players asked for both, so the board keeps both. The switch
// ends the resets' row rather than a sticky bar of its own: alone on two rows, the resets and the switch floated in space,
// and nobody needs the switch to follow them down the page.
const TIMERS_VIEW = { group: 'soonest' };
const GROUP_OPTIONS = [['soonest', 'By time'], ['world', 'By world']];
const HEAD_SX = { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 };
const Etc = ({ characters, account, lastUpdated, trackers, bookAlert, bossAlert }) => {
  const rows = useTimerRows({ characters, account, lastUpdated, trackers, bookAlert, bossAlert });
  const [view, setView] = useToolbarState('dashboard-timers', TIMERS_VIEW);
  const head = <Box sx={HEAD_SX}>
    <Resets account={account} trackers={trackers} lastUpdated={lastUpdated}/>
    {rows.length ? <Box sx={{ ml: 'auto' }}>
      <ViewSwitch size={'medium'} label={'Group timers'} options={GROUP_OPTIONS} value={view?.group}
                  onChange={(group) => setView({ group })}/>
    </Box> : null}
  </Box>;
  return <TimerBoard rows={rows} byWorld={view?.group === 'world'} head={head}/>;
};

const MINIBOSS_KEYS = {
  mini3b: 'dilapidatedSlush',
  mini4b: 'mutatedMush',
  mini5a: 'domeoMagmus',
  mini6a: 'dementedSpiritlord'
};

// Past a year (or never) a countdown says so instead of counting: the same cut-off for every Clickers timer.
const longTimer = (time, long) => !isFinite(time) || (!isPast(time) && long);

const ROW_ICON_SIZE = 24;

// A row with nothing to say isn't drawn: no time (its data is missing), and no word or value in its place.
const hasValue = ({ long, forcePlaceholder, value, time }) => long || forcePlaceholder || value !== undefined || Number.isFinite(time);

// A world's rows off its fragment, tagged with the world and keyed to stay apart from the other worlds' in one list.
const inWorld = (world, rows) => (rows ? React.Children.toArray(rows.props.children)
  .filter(({ props }) => hasValue(props))
  .map((row) => React.cloneElement(row, { world, key: `${world}${row.key}` })) : []);

// When a row's time ends. A time the parsers anchored on their own clock has the save's age off it, as its Timer takes.
// Plain functions so React Compiler reads the clock each time the row's values change, never only once.
const deadlineOf = (time, lastUpdated) => (lastUpdated ? time - (Date.now() - lastUpdated) : time);
const isOver = (deadline) => deadline <= Date.now();

// What a row's props say right now, read by the row and by the board that places it, so the two never disagree.
const readRow = ({ failed, time, value, forcePlaceholder, long, lastUpdated }) => {
  // No time to count to (a save with no reset countdown): the row says what a failed one says, never a state
  const noTime = failed || (time == null && value === undefined && !forcePlaceholder);
  const deadline = deadlineOf(time, lastUpdated);
  // A date past what a Date can hold has no exact time either
  const farOff = long || (Number.isFinite(deadline) && !isValid(new Date(deadline)));
  const over = !farOff && (forcePlaceholder || isOver(deadline));
  return { noTime, deadline, farOff, over };
};

// The shape a TimerRow draws, from the band that holds it: a Ready now cell or a Coming up row.
const RowShape = createContext('coming');

// A timer: its icon, which opens the alert's quick edit, its name (the alert's, or name), which is the link to the page and says
// so with a mark, a muted sub, or a state (what qualifies a countdown, gone once it reads its word), and its countdown or its
// word, plain: a state reads as a state, and nobody expects one to leave the page. Counting, it carries its exact
// time too. message(when, over): the quick edit's words, with when the row's own state (the exact time, its
// word, or "A long time"), so they never contradict it. placeholderStatus: "ready" for a state to act on, "problem" for one
// that costs something; past its time a row with no word reads Ready. lastUpdated: only a time the parsers anchor on their
// own clock (see Timer). failed: read from a failed section's default. value: a row that shows something else than a
// countdown. world: the label it carries in Coming up. actNow: ready while it still counts, reading its state (a window to
// visit in). info: a note off a button beside its name. control: a button that moves the row, beside its word or its time.
// look: a state the sprite shows (AlertIcon's), with its word in state.
const TimerRow = ({
  target, items, name, sub, icon, message, page, query, time, placeholder = 'Ready', placeholderStatus = 'ready', forcePlaceholder,
  state, value: ownValue, lastUpdated, long, failed, world, actNow, info, control, look
}) => {
  const shape = useContext(RowShape);
  const router = useRouter();
  const formatDate = useFormatDate();
  const title = name ?? alertMeta[`timers.${target}`]?.label;
  const word = <StatusText status={placeholderStatus}>{placeholder}</StatusText>;
  const { noTime, deadline, farOff, over } = readRow({ failed, time, value: ownValue, forcePlaceholder, long, lastUpdated });
  const when = farOff ? 'A long time' : over ? placeholder : formatDate(deadline, { showSeconds: false });
  const words = noTime ? undefined : message ? message(when, over) : `${title}: ${when}`;
  const shown = noTime ? '-'
    : ownValue !== undefined ? ownValue
      : farOff ? 'A long time'
        : forcePlaceholder ? word
          : <Timer type={'countdown'} date={time} lastUpdated={lastUpdated} component={'span'} placeholder={word}/>;
  const href = page ? { pathname: page, query: { ...sessionQuery(router.query), ...query } } : null;
  const label = href && !noTime
    ? <Link component={NextLink} href={href} color={'inherit'} underline={'hover'} variant={'body2'} sx={{ fontWeight: 'inherit' }}>{title}<LinkMark sx={{ ml: 0.5 }}/></Link>
    : title;
  const sprite = <AlertIcon configType={'timers'} target={target} extra={items ? { items } : undefined} message={words}
                            label={typeof words === 'string' ? undefined : title} icon={icon} look={look}
                            size={ROW_ICON_SIZE}/>;
  const note = info ? <InfoButton label={title}><Stack gap={1}>{info}</Stack></InfoButton> : null;
  if (shape === 'box') {
    const acting = actNow && !over;
    return <BoxRow icon={sprite} name={label} note={note} sub={noTime ? null : acting ? sub : state ?? sub}
                   value={acting ? state : shown} control={control}/>;
  }
  if (shape === 'ready') {
    return <ReadyCell icon={sprite} name={label} note={note} sub={sub} value={actNow && !over ? state : word} control={control}/>;
  }
  return <ComingRow icon={sprite} name={label} note={note} sub={noTime ? null : state ?? sub} world={world}
                    date={noTime || farOff || over ? null : when} value={shown} control={control}/>;
};

// The board's width sets its columns, not the window's: a side ad leaves it 540 px at 900. Ready now's first column and a
// Coming up row's name and time share one line down the table, so the eye crosses a cell, not the full width, from a name to
// its time. One across also caps Ready now, so a stale save never buries the rest.
const ONE_ACROSS = '@container (max-width: 699.95px)';
const TWO_ACROSS = '@container (min-width: 700px)';
const THREE_ACROSS = '@container (min-width: 1100px)';
const READY_CAP = 6;
const READY_GRID_SX = {
  display: 'grid', gap: '1px', bgcolor: 'divider', gridTemplateColumns: 'minmax(0, 1fr)',
  [TWO_ACROSS]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  [THREE_ACROSS]: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }
};
const READY_CAPPED_SX = { [ONE_ACROSS]: { [`& > :nth-of-type(n+${READY_CAP + 1})`]: { display: 'none' } } };
// A row's first cell, a Ready now cell or the front of a Coming up row
const LEAD_CELL_SX = { minHeight: 39, pl: 1.5, pr: '14px', minWidth: 0 };
const READY_CELL_SX = { ...LEAD_CELL_SX, bgcolor: 'background.paper', [ONE_ACROSS]: { minHeight: 43 } };
const READY_SUB_SX = { fontSize: 13, minWidth: 0, fontVariantNumeric: 'tabular-nums' };
// wrap: a world's box is too narrow for a long name on one line ("Next outpost resource runs out")
const RowName = ({ name, note, wrap, sx }) => <Stack direction={'row'} alignItems={'center'} gap={0.5} sx={[{ minWidth: 0 }, sx]}>
  <Typography variant={'body2'} component={'div'} noWrap={!wrap} sx={{ fontWeight: 500, minWidth: 0 }}>{name}</Typography>
  {note}
</Stack>;
// A row with a sub gives its room from there: any shrink at all puts an ellipsis on the name
const ReadyCell = ({ icon, name, note, sub, value, control }) => <Stack direction={'row'} alignItems={'center'} gap={'10px'} sx={READY_CELL_SX}>
  {icon}
  <RowName name={name} note={note} sx={{ flexShrink: sub ? 0 : 1 }}/>
  {sub ? <Typography variant={'body2'} component={'div'} color={'text.secondary'} noWrap sx={READY_SUB_SX}>{sub}</Typography> : null}
  <Stack direction={'row'} alignItems={'center'} gap={1} sx={{ flexShrink: 0, ml: 'auto' }}>{value}{control}</Stack>
</Stack>;

// Blank cells close the block's last row, so its lines run to the board's edge: as many as each column count leaves open.
const blanksLeft = (count, across) => (across - (count % across)) % across;
const blankCell = (index, count) => <Box key={`blank-${index}`} aria-hidden sx={{
  bgcolor: 'background.paper', display: 'none',
  [TWO_ACROSS]: { display: index < blanksLeft(count, 2) ? 'block' : 'none' },
  [THREE_ACROSS]: { display: index < blanksLeft(count, 3) ? 'block' : 'none' }
}}/>;

// One across, a row is its first cell with a second line. Wider, its sub, world and date take the width past Ready's first
// column: the same width as that column, less the 1 px line between Ready's cells.
const COMING_ROW_SX = {
  display: 'grid', alignItems: 'center', gridTemplateColumns: 'minmax(0, 1fr)',
  [TWO_ACROSS]: { columnGap: 1.5, gridTemplateColumns: 'calc((100% - 1px) / 2) minmax(0, 1fr) 64px 150px' },
  [THREE_ACROSS]: { gridTemplateColumns: 'calc((100% - 2px) / 3) minmax(0, 1fr) 64px 150px' }
};
const COMING_LEAD_SX = { ...LEAD_CELL_SX, [ONE_ACROSS]: { minHeight: 51 } };
const COMING_LINE_SX = { fontSize: 13, lineHeight: '18px', [TWO_ACROSS]: { display: 'none' } };
// Each part whole: a line with a sub and a date wraps between them, and never cuts the date
const COMING_PART_SX = { whiteSpace: 'nowrap' };
const COMING_TIME_SX = { typography: 'body2', fontWeight: 500, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' };
const WIDE_ONLY_SX = { display: 'none', [TWO_ACROSS]: { display: 'block' } };
const COMING_SUB_SX = { ...WIDE_ONLY_SX, ...READY_SUB_SX, color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const COMING_WORLD_SX = { ...WIDE_ONLY_SX, fontSize: 12, lineHeight: '16px', color: 'text.muted', whiteSpace: 'nowrap' };
const COMING_DATE_SX = {
  ...WIDE_ONLY_SX, fontSize: 13, lineHeight: '18px', color: 'text.secondary', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
  textAlign: 'right', pr: '14px'
};
const ComingRow = ({ icon, name, note, sub, world, date, value, control }) => <Box sx={COMING_ROW_SX}>
  <Stack direction={'row'} alignItems={'center'} gap={'10px'} sx={COMING_LEAD_SX}>
    {icon}
    <Box sx={{ minWidth: 0 }}>
      <RowName name={name} note={note}/>
      <Typography variant={'body2'} component={'div'} color={'text.secondary'} sx={COMING_LINE_SX}>
        {sub ? <><Box component={'span'} sx={COMING_PART_SX}>{sub}</Box>{' · '}</> : null}
        <Box component={'span'} sx={COMING_PART_SX}>{world}</Box>
        {date ? <>{' · '}<Box component={'span'} sx={COMING_PART_SX}>{date}</Box></> : null}
      </Typography>
    </Box>
    <Stack direction={'row'} alignItems={'center'} gap={0.5} sx={{ flexShrink: 0, ml: 'auto' }}>
      {control}
      <Box sx={COMING_TIME_SX}>{value}</Box>
    </Stack>
  </Stack>
  <Box sx={COMING_SUB_SX}>{sub}</Box>
  <Box sx={COMING_WORLD_SX}>{world}</Box>
  <Box sx={COMING_DATE_SX}>{date}</Box>
</Box>;

// A row in its world's box: the box is narrow, so the time sits close to the name. No exact date, which the icon's note holds.
const BOX_SUB_SX = { fontSize: 13, lineHeight: '18px', fontVariantNumeric: 'tabular-nums' };
const BoxRow = ({ icon, name, note, sub, value, control }) => <Stack direction={'row'} alignItems={'center'} gap={'10px'} sx={LEAD_CELL_SX}>
  {icon}
  <Box sx={{ minWidth: 0, py: 0.5 }}>
    <RowName name={name} note={note} wrap/>
    {sub ? <Typography variant={'body2'} component={'div'} color={'text.secondary'} noWrap sx={BOX_SUB_SX}>{sub}</Typography> : null}
  </Box>
  <Stack direction={'row'} alignItems={'center'} gap={0.5} sx={{ flexShrink: 0, ml: 'auto' }}>
    {control}
    <Box sx={COMING_TIME_SX}>{value}</Box>
  </Stack>
</Stack>;

// A band of the board: its label on the tint, what it says about itself across from it, every row under its own line.
const BAND_LABEL_SX = { minHeight: 28, pl: 1.5, pr: '14px', bgcolor: 'background.tint' };
const BAND_NOTE_SX = { fontSize: 12, lineHeight: '20px', color: 'text.secondary', whiteSpace: 'nowrap' };
const BAND_ROWS_SX = { '& > *': { borderTop: 1, borderColor: 'divider' } };
const Band = ({ label, note, children }) => <Box>
  <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={1.5} sx={BAND_LABEL_SX}>
    <Typography variant={'groupLabel'} component={'h2'} color={'text.secondary'}>{label}</Typography>
    {note ? <Box sx={BAND_NOTE_SX}>{note}</Box> : null}
  </Stack>
  <Box sx={BAND_ROWS_SX}>{children}</Box>
</Box>;

// Where a row sits right now. A monument's ratio, or anything else with no time left to count, waits at the end of Later. A
// row that prints a value never reads Ready: a miniboss's +1 keeps its place until the next reset moves it on.
const placeOf = ({ props }, clock) => {
  const { noTime, deadline, farOff, over } = readRow(props);
  if (noTime) return 'unread';
  if ((over && props.value === undefined) || props.actNow) return 'ready';
  if (farOff || !(deadline - clock < WEEK)) return 'later';
  return deadline - clock < DAY ? 'next' : 'week';
};
const soonestKey = ({ props }) => {
  const { deadline, farOff } = readRow(props);
  return farOff || !Number.isFinite(deadline) ? Infinity : deadline;
};
// Infinity less Infinity is NaN, and two rows with no time keep their order
const soonestFirst = (a, b) => soonestKey(a) - soonestKey(b) || 0;
const problemFirst = (a, b) => (b.props.placeholderStatus === 'problem') - (a.props.placeholderStatus === 'problem');

// The board in brief, for the What's new story: placed as the board places them, so its count is the board's.
const briefRow = ({ key, props }) => {
  const { deadline, over } = readRow(props);
  return {
    key,
    title: props.name ?? alertMeta[`timers.${props.target}`]?.label,
    icon: typeof props.icon === 'string' ? props.icon : null,
    word: props.actNow && !over ? props.state : props.placeholder ?? 'Ready',
    problem: props.placeholderStatus === 'problem',
    value: props.value,
    deadline
  };
};
export const timersInBrief = (rows, clock) => {
  const at = (place) => rows.filter((row) => placeOf(row, clock) === place);
  const ready = at('ready').sort(problemFirst);
  const next = at('next').sort(soonestFirst);
  const coming = next.length ? next : at('week').sort(soonestFirst);
  return {
    readyCount: ready.length,
    ready: ready.slice(0, 3).map(briefRow),
    comingLabel: next.length ? 'Next 24 hours' : 'This week',
    coming: coming.slice(0, 2).map(briefRow)
  };
};

const BOARD_SX = { overflow: 'hidden', '& > * + *': { borderTop: 1, borderColor: 'divider' } };
const FOLD_BUTTON_SX = { mx: 1, my: 0.5, minHeight: { xs: 44, sm: 'auto' } };
const SOONEST_NOTE = 'Soonest first, all worlds';

// The board ticks by the second, apart from Etc's heavy reads, so a row that hits zero reads Ready on the next tick.
const TimerBoard = ({ rows, byWorld, head }) => {
  const clock = useNow(SECOND);
  if (byWorld) {
    return <Stack gap={1.5} sx={{ containerType: 'inline-size' }}>
      {head}
      {rows.length ? <WorldBoard rows={rows} clock={clock}/> : null}
    </Stack>;
  }
  return <SoonestBoard rows={rows} clock={clock} head={head}/>;
};

// Each world's timers in a box of its own, in the alerts' order, so a timer keeps its place whatever its time. A ready one
// reads its word where it sits, and the box's head counts them. The boxes flow down columns, so a long world leaves no gap
// beside a short one.
const WorldBoard = ({ rows, clock }) => {
  const worlds = [...new Set(rows.map(({ props }) => props.world))];
  return <CardGrid size={'m'} flow component={'section'} data-tour={'timers'} aria-label={'Timers'}>
    {worlds.map((world) => {
      const own = rows.filter(({ props }) => props.world === world);
      const ready = own.filter((row) => placeOf(row, clock) === 'ready').length;
      return <Box key={world} sx={[(theme) => cardSurface(theme), { overflow: 'hidden' }]}>
        <Band label={world} note={ready ? `${formatNum(ready, 'whole')} ready` : null}>
          <RowShape value={'box'}>{own}</RowShape>
        </Band>
      </Box>;
    })}
  </CardGrid>;
};

// The timers as what they ask of the player, in one table: everything to act on now, then what's next across all worlds. A
// row that hits zero moves to Ready now, and a band with nothing in it isn't drawn. The soonest note sits on whichever band
// starts that order.
const SoonestBoard = ({ rows, clock, head }) => {
  const [readyOpen, setReadyOpen] = useState(false);
  const [laterOpen, setLaterOpen] = useState(false);
  const at = (place) => rows.filter((row) => placeOf(row, clock) === place);
  const ready = at('ready').sort(problemFirst);
  const next = at('next').sort(soonestFirst);
  const week = at('week').sort(soonestFirst);
  const later = at('later').sort(soonestFirst);
  const unread = at('unread');
  // A cap that hides one row costs more than the row: its button takes the room of the row it hides
  const capped = ready.length > READY_CAP + 1;
  return <Stack gap={1.5} sx={{ containerType: 'inline-size' }}>
    {head}
    {rows.length ? <Box component={'section'} data-tour={'timers'} aria-label={'Timers'} sx={[(theme) => cardSurface(theme), BOARD_SX]}>
      {ready.length ? <Band label={'Ready now'} note={`${formatNum(ready.length, 'whole')} to act on`}>
        <Box sx={[READY_GRID_SX, capped && !readyOpen && READY_CAPPED_SX]}>
          <RowShape value={'ready'}>{ready}</RowShape>
          {[0, 1].map((index) => blankCell(index, ready.length))}
        </Box>
        {capped ? <Stack alignItems={'center'} sx={{ display: 'none', [ONE_ACROSS]: { display: 'flex' } }}>
          <Button size={'small'} aria-expanded={readyOpen} onClick={() => setReadyOpen(!readyOpen)}
                  endIcon={readyOpen ? <IconChevronUp size={16}/> : <IconChevronDown size={16}/>} sx={FOLD_BUTTON_SX}>
            {readyOpen ? 'Show fewer' : `Show ${formatNum(ready.length - READY_CAP, 'whole')} more`}
          </Button>
        </Stack> : null}
      </Band> : null}
      <RowShape value={'coming'}>
        {next.length ? <Band label={'Next 24 hours'} note={SOONEST_NOTE}>{next}</Band> : null}
        {week.length ? <Band label={'This week'} note={next.length ? null : SOONEST_NOTE}>{week}</Band> : null}
        {later.length ? <Band label={'Later'} note={next.length || week.length ? null : SOONEST_NOTE}>
          <Box>
            <Button size={'small'} aria-expanded={laterOpen} onClick={() => setLaterOpen(!laterOpen)}
                    endIcon={laterOpen ? <IconChevronUp size={16}/> : <IconChevronDown size={16}/>} sx={FOLD_BUTTON_SX}>
              {laterOpen ? 'Hide later' : `Show ${formatNum(later.length, 'whole')} later`}
            </Button>
            <Collapse in={laterOpen}><Box sx={BAND_ROWS_SX}>{later}</Box></Collapse>
          </Box>
        </Band> : null}
        {unread.length ? <Band label={'No reading'}>{unread}</Band> : null}
      </RowShape>
    </Box> : null}
  </Stack>;
};

// The account's own resets come round on a fixed schedule, so they hold a fixed place above the table. Absolute times off the
// save time, rolled on the clock by the second, so a reset goes straight to the next one and its tile never reads Ready: an old
// save's lastUpdated would leave them in the past, and so would a tab left open. A phone's three share a row, as the summary's
// list does its two, with the date free to wrap at its space.
const RESET_STRIP_SX = { mb: 0, columnGap: { xs: 1 } };
const Resets = ({ account, trackers, lastUpdated }) => {
  const clock = Math.max(lastUpdated ?? 0, useNow(SECOND));
  const formatDate = useFormatDate();
  // Server-wide weekly boundary (weekly bosses, jewel spinner / chip repo, exotic market). Those all
  // roll on floor(GlobalTime / 604800), which is unrelated to the account's own weekly reset: the same
  // moment for every save, so it reads the clock, not how old this save is.
  const serverWeeklyReset = (Math.floor(clock / SERVER_WEEK) + 1) * SERVER_WEEK;
  const tiles = [
    trackers?.General?.daily?.checked && {
      target: 'General.daily', label: 'Daily', icon: 'etc/Daily.png',
      time: getNextResetAt(account, clock, { fallbackSavedAt: lastUpdated })
    },
    trackers?.General?.weekly?.checked && {
      target: 'General.weekly', label: 'Weekly', icon: 'etc/Weekly.png',
      time: getNextResetAt(account, clock, { fallbackSavedAt: lastUpdated, days: account?.accountOptions?.[OPT.daysUntilWeeklyReset], period: WEEK })
    },
    trackers?.General?.serverWeekly?.checked && account?.timeAway && {
      target: 'General.serverWeekly', label: 'Server weekly', icon: 'etc/Server.png', time: serverWeeklyReset,
      resets: 'Weekly bosses, jewel spinner, chip repo, exotic market'
    }
  ].filter(Boolean);
  if (!tiles.length) return null;
  return <PageSummary label={'Resets'} sx={[RESET_STRIP_SX, { gridTemplateColumns: { xs: `repeat(${tiles.length}, minmax(0, 1fr))` } }]}>
    {tiles.map(({ target, label, icon, time, resets }) => {
      const noTime = time == null;
      const title = alertMeta[`timers.${target}`]?.label;
      const date = noTime ? undefined : formatDate(time, { showSeconds: false });
      const words = noTime ? undefined : resets
        ? <Stack gap={0.5}>
          <Typography variant={'body2'}>{title}: {date}</Typography>
          <Typography variant={'body2'}>{resets}</Typography>
        </Stack>
        : `${title}: ${date}`;
      // The exact time in the tile's note, not a third line: two lines keep the strip the height of the switch beside it
      return <StatTile key={target} label={label} failed={noTime} info={words}
                       value={formatDuration(Math.ceil((time - clock) / SECOND))}
                       icon={<AlertIcon configType={'timers'} target={target} message={words} icon={icon} size={24}
                                        label={typeof words === 'string' ? undefined : title}/>}/>;
    })}
  </PageSummary>;
};

// A boss that respawns, as a row's props: up it waits in Ready now with its Killed button, killed it counts down in Coming up
// with its undo. The sprite dims with the word beside it.
const bossProps = ({ name, up, onKill, onUndo, waitDate }) => ({
  state: up ? null : 'Killed',
  look: up ? undefined : { opacity: 0.45 },
  time: waitDate,
  placeholder: 'Up',
  forcePlaceholder: up,
  control: up ? <KilledButton onClick={onKill}/> : <UndoKill onClick={onUndo}/>,
  message: (when, over) => (over ? `${name} is up` : `${name} is back: ${when}`)
});

// A miniboss, as a row's props: maxed or at the player's number it waits in Ready now. Below that its next one comes on a daily
// reset, so that reset is its place in the list, and it prints the days as the save has them.
const minibossProps = (miniboss, dailyReset, killsWanted) => {
  const { current, daysTillNext, maxed } = miniboss;
  const count = `Current ${formatNum(current)}`;
  const next = `+1 in ${formatNum(daysTillNext)} day${daysTillNext === 1 ? '' : 's'}`;
  if (maxed) return { placeholder: `Maxed (${formatNum(current)})`, forcePlaceholder: true };
  if (isMinibossReady(miniboss, killsWanted)) {
    return { sub: next, placeholder: `${formatNum(current)} kills`, forcePlaceholder: true, message: () => `${count}, ${next}` };
  }
  return { sub: count, value: next, time: dailyReset == null ? undefined : dailyReset + (daysTillNext - 1) * DAY, message: () => `${count}, ${next}` };
};

// A monument's reward multi against its max linear growth, as a row's props. Past that max it's time to fight. Below it the
// date it gets there is a deadline like any other, so it sorts with them and counts down to it, with the ratio as its muted
// line, and at zero it moves to Ready now. One with neither (no date, not past it) has nothing to count and nothing to act on.
const monumentProps = (currentMulti, { maxLinearMulti, timeUntilMaxDate } = {}) => {
  const maxMulti = maxLinearMulti || 0;
  const pair = `${formatNum(currentMulti, 'mult')} / ${formatNum(maxMulti, 'mult')}`;
  const past = `Past its max linear growth: ${pair}`;
  if (Math.round(100 * currentMulti) > Math.round(100 * maxMulti)) {
    return { sub: pair, placeholder: 'Fight', forcePlaceholder: true, message: () => past };
  }
  if (timeUntilMaxDate) {
    return { sub: pair, placeholder: 'Fight', time: timeUntilMaxDate, message: (when, over) => (over ? past : `Max linear growth: ${when}`) };
  }
  return { sub: 'At max linear growth', value: pair, message: () => 'At max linear growth' };
};

export default Etc;
