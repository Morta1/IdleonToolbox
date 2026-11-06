import React, { useContext } from 'react';
import { Box, MenuItem, TextField } from '@mui/material';
import { useLocalStorage } from '@mantine/hooks';
import { NextSeo } from 'next-seo';
import { AppContext } from '@components/common/context/AppProvider';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { PageHeaderControl } from '@components/common/NavBar/PageHeader';
import { isParseFailed, isSectionFailed, MissingData } from '@components/common/styles';
import { checkCharClass, CLASSES } from '@parsers/talents';
import { getPortalProgressBreakdown, getSpeedrunPlan, getSpeedrunStats } from '@parsers/class-specific/speedrun';
import { getMaxDamage } from '@parsers/damage';
import { formatDuration, formatNum } from '@utility/helpers';
import Portals from '@components/account/Misc/class-specific/Speedrun/Portals';
import Bosses from '@components/account/Misc/class-specific/Speedrun/Bosses';

// The portal progress tree with its Kill per kill line, and any group holding it, read "-"
const dashKillPerKill = (nodes) => (nodes ?? []).map((node) => {
  if (!node?.children) return node?.name === 'Kill per kill' ? { ...node, formatted: '-' } : node;
  const children = dashKillPerKill(node.children);
  return children.some((child, index) => child !== node.children[index] && child?.formatted === '-')
    ? { ...node, children, formatted: '-' }
    : { ...node, children };
});

const Speedrun = () => {
  const { state } = useContext(AppContext);
  const sectionFailed = isSectionFailed(state?.account, 'speedrun');
  // Remembered per page; no default, so a pick that was never made keeps following the first Voidwalker
  const [selectedChar, setSelectedChar] = useLocalStorage({ key: 'speedrun:selectedChar' });
  const voidwalkers = (state?.characters ?? []).filter((character) => checkCharClass(character?.class, CLASSES.Voidwalker));
  const selectedVoidwalker = voidwalkers.find((character) => character?.playerId === selectedChar) ?? voidwalkers[0];

  const {
    highscore,
    runUnlocked,
    runDuration,
    runCooldown,
    voidPointsPerPortal,
    voidPointsPerRun,
    multiKillPerFiveMaps,
    multiKillBonus,
    portalsToNextStep,
    voidRadiusBonus,
    equinoxGoal,
    portalsToEquinoxGoal,
    equinoxGoalReached
  } = getSpeedrunStats(state?.account, state?.characters, selectedVoidwalker);
  // The plan re-runs the damage parser once per map, bare and buffed, so it stays at page level.
  const plan = getSpeedrunPlan(state?.account, state?.characters, selectedVoidwalker);
  const playerInfo = selectedVoidwalker ? getMaxDamage(selectedVoidwalker, state?.characters, state?.account) : null;
  const killPerKill = playerInfo?.killPerkill;
  // Both extra terms only pay out while actively playing, which a run always is, and both are easy
  // to miss - hence a breakdown rather than a bare number.
  const progress = getPortalProgressBreakdown(state?.account, killPerKill?.value ?? 1);
  // Each drawer is named and headed as its tile reads
  const killPerKillText = formatNum(killPerKill?.value ?? 1, 'mult');
  const damageText = formatNum(playerInfo?.maxDamage ?? 0);
  // "-" marks a tile the missing Voidwalker feeds
  const ofVoidwalker = (value) => (selectedVoidwalker ? value : '-');
  // With no Voidwalker the progress rests on a stand-in kill per kill of 1: the tile, the drawer's heading, its Kill per
  // kill line and the group that line sums into all dash, as the Kill per kill tile does. A list: no share of a total
  // that is not there.
  const progressText = ofVoidwalker(formatNum(progress?.perKill ?? 0));
  const progressBreakdown = progress?.breakdown && !selectedVoidwalker
    ? { ...progress.breakdown, combine: 'list', tree: dashKillPerKill(progress.breakdown.tree) }
    : progress?.breakdown;

  return <>
    <NextSeo
      title="Speedrun | Idleon Toolbox"
      description="Track your voidwalker speedrun highscore, the bonuses it feeds and what every portal costs"
    />
    {sectionFailed ? <MissingData name={'Speedrun'} failed/> : null}
    {voidwalkers.length > 1 ? <PageHeaderControl>
      <TextField select value={selectedVoidwalker?.playerId ?? ''} onChange={(event) => setSelectedChar(event.target.value)}
                 sx={{ minWidth: 180 }}
                 slotProps={{
                   select: {
                     renderValue: (id) => <><Box component={'span'} sx={{ color: 'text.secondary', mr: 0.75 }}>Character</Box>
                       {voidwalkers.find((character) => character?.playerId === id)?.name}</>,
                     SelectDisplayProps: { 'aria-label': 'Voidwalker' }
                   }
                 }}>
        {voidwalkers.map((character) => <MenuItem key={character?.playerId} value={character?.playerId}>{character?.name}</MenuItem>)}
      </TextField>
    </PageHeaderControl> : null}
    {/* Each note hangs off the label's i (StatTile's info), as the Info board draws it */}
    <PageSummary failed={isParseFailed(state?.account)}>
      <StatTile label={'Portal highscore'} icon={'data/UISkillIcon45.png'} value={formatNum(highscore ?? 0)}/>
      <StatTile label={'Run duration'} value={ofVoidwalker(runUnlocked ? formatDuration(runDuration) : 'Talent not learned')}
                info={runUnlocked
                  ? `Void Trial Rerun lasts this long, once every ${formatDuration(runCooldown)}`
                  : 'Level Void Trial Rerun to start a speedrun'}/>
      <StatTile label={'Void talent points per run'} value={ofVoidwalker(formatNum(voidPointsPerRun ?? 0))}
                info={`${formatNum(voidPointsPerPortal ?? 0)} per portal unlocked`}/>
      <StatTile label={'Multikill per tier'} value={formatNum(multiKillBonus ?? 0, 'pct')}
                info={`${formatNum(multiKillPerFiveMaps ?? 0, 'pct')} per 5 maps of highscore, applied to every character`}/>
      <StatTile label={'Portals to next step'} value={formatNum(portalsToNextStep ?? 0)}
                info={'Multikill per tier only goes up every 5 portals of highscore'}/>
      <StatTile label={'Void radius'} icon={'data/UISkillIcon46.png'} value={ofVoidwalker(formatNum(voidRadiusBonus ?? 0, 'pct'))}
                info={'Extra multikill per tier for 20s per cast, only during a speedrun'}/>
      <StatTile label={'Equinox goal'} sub={`${formatNum(equinoxGoal ?? 0)} portals in one run`}
                value={equinoxGoalReached ? 'Done' : `${formatNum(portalsToEquinoxGoal ?? 0)} to go`}
                info={'Unlock 75 or more portals on a single speedrun'}/>
      <StatTile label={'Kill per kill'} value={ofVoidwalker(killPerKillText)} breakdownTitle={'Kill per kill'}
                breakdown={killPerKill?.breakdown ? { ...killPerKill.breakdown, totalValue: killPerKillText } : undefined}/>
      <StatTile label={'Portal progress per kill'} value={progressText} breakdownTitle={'Portal progress per kill'}
                breakdown={progressBreakdown ? { ...progressBreakdown, totalValue: progressText } : undefined}/>
      <StatTile label={'Multikill tiers'} value={ofVoidwalker(formatNum(playerInfo?.multiKillTiers ?? 0))}/>
      <StatTile label={'Damage'} value={ofVoidwalker(damageText)} breakdownTitle={'Damage'}
                breakdown={playerInfo?.damageBreakdown ? { ...playerInfo.damageBreakdown, totalValue: damageText } : undefined}/>
    </PageSummary>
    <Bosses bosses={plan?.bosses} bossPortals={plan?.bossPortals} runUnlocked={plan?.runUnlocked}
            hasVoidwalker={Boolean(selectedVoidwalker)} emptyAccount={state?.emptyAccount}/>
    <Portals character={selectedVoidwalker} plan={plan} emptyAccount={state?.emptyAccount} parseFailed={isParseFailed(state?.account)}/>
  </>
};

export default Speedrun;
