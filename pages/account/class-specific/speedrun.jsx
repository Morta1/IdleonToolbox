import React, { useContext, useState } from 'react';
import { Divider, Select, Stack, Typography } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import { NextSeo } from 'next-seo';
import { AppContext } from '@components/common/context/AppProvider';
import { CardTitleAndValue } from '@components/common/styles';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { checkCharClass, CLASSES } from '@parsers/talents';
import { getPortalProgressBreakdown, getSpeedrunPlan, getSpeedrunStats } from '@parsers/class-specific/speedrun';
import { getMaxDamage } from '@parsers/damage';
import { notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Portals from '@components/account/Misc/class-specific/Speedrun/Portals';
import Bosses from '@components/account/Misc/class-specific/Speedrun/Bosses';

// Tooltip and Breakdown both attach their handlers to this child, so it has to take the ref and
// the props they hand down rather than swallowing them.
const InfoIcon = React.forwardRef((props, ref) => <Stack ref={ref} justifyContent={'center'} {...props}>
  <IconInfoCircleFilled size={16} style={{ cursor: 'pointer' }}/>
</Stack>);
InfoIcon.displayName = 'InfoIcon';

const ValueWithInfo = ({ value, info }) => <Stack direction={'row'} alignItems={'center'} gap={1}>
  <Typography component={'span'}>{value}</Typography>
  <Tooltip title={info}><InfoIcon/></Tooltip>
</Stack>;

const ValueWithBreakdown = ({ value, breakdown }) => <Stack direction={'row'} alignItems={'center'} gap={1}>
  <Typography component={'span'}>{value}</Typography>
  {breakdown ? <Breakdown data={breakdown}><InfoIcon/></Breakdown> : null}
</Stack>;

const Speedrun = () => {
  const { state } = useContext(AppContext);
  const [selectedChar, setSelectedChar] = useState(null);
  const voidwalkers = state?.characters?.filter((character) => checkCharClass(character?.class, CLASSES.Voidwalker)) ?? [];
  // Derived rather than stored, so accounts with more than one voidwalker don't read their stats
  // off whoever happens to sit first in the account.
  const selectedVoidwalker = voidwalkers?.find((character) => character?.playerId === selectedChar)
    ?? voidwalkers?.[0];

  const {
    highscore,
    runUnlocked,
    runDuration,
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
  const progress = getPortalProgressBreakdown(state?.account, killPerKill?.value ?? 1);
  // Both extra terms only pay out while actively playing, which a run always is, and both are easy
  // to miss - hence a breakdown rather than a bare number.
  const progressBreakdown = {
    statName: 'Portal progress per kill',
    totalValue: progress.perKill,
    categories: [{
      name: 'Sources',
      sources: [
        { name: 'Kill per kill', value: progress.killPerKill },
        { name: 'Seawater vial', value: progress.vialBonus / 100 },
        {
          name: 'Active Murdering (vault 43)',
          value: 1 + progress.vaultBonus / 100,
          formatted: `x${notateNumber(1 + progress.vaultBonus / 100, 'MultiplierInfo')}`
        }
      ]
    }]
  };

  return <>
    <NextSeo
      title="Speedrun | Idleon Toolbox"
      description="Track your voidwalker speedrun highscore, the bonuses it feeds and what every portal costs"
    />
    <Stack mb={3} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      {voidwalkers.length > 1 ? <CardTitleAndValue title={'Character'}
                                                   value={<Select size={'small'}
                                                                  value={selectedVoidwalker?.playerId ?? ''}
                                                                  onChange={(e) => setSelectedChar(e.target.value)}>
                                                     {voidwalkers?.map((character, index) => <MenuItem
                                                       key={character?.name + index}
                                                       value={character?.playerId}>
                                                       <Stack direction={'row'} alignItems={'center'} gap={2}>
                                                         <img src={`${prefix}data/ClassIcons${character?.classIndex}.png`}
                                                              alt="" width={32} height={32}/>
                                                         <Typography>{character?.name}</Typography>
                                                       </Stack>
                                                     </MenuItem>)}
                                                   </Select>}/> : null}
      <CardTitleAndValue title={'Portal highscore'} value={numberWithCommas(highscore)}
                         icon={'data/UISkillIcon45.png'} imgStyle={{ width: 32 }}/>
      <CardTitleAndValue title={'Run duration'}
                         value={<ValueWithInfo
                           value={runUnlocked ? `${numberWithCommas(runDuration)}s` : 'Talent not learned'}
                           info={runUnlocked
                             ? 'Void Trial Rerun lasts this long, once every 19h 27m'
                             : 'Level Void Trial Rerun to start a speedrun'}/>}/>
      <CardTitleAndValue title={'Void talent pts / run'}
                         value={<ValueWithInfo value={numberWithCommas(voidPointsPerRun)}
                                               info={`${voidPointsPerPortal} per portal unlocked`}/>}/>
      <CardTitleAndValue title={'Multikill per tier'}
                         value={<ValueWithInfo value={`${notateNumber(multiKillBonus, 'MultiplierInfo')}%`}
                                               info={`${notateNumber(multiKillPerFiveMaps, 'MultiplierInfo')}% per 5 maps of highscore, applied to every character`}/>}/>
      <CardTitleAndValue title={'Portals to next step'}
                         value={<ValueWithInfo value={numberWithCommas(portalsToNextStep)}
                                               info={'Multikill per tier only goes up every 5 portals of highscore'}/>}/>
      <CardTitleAndValue title={'Void radius'}
                         value={<ValueWithInfo value={`${notateNumber(voidRadiusBonus, 'MultiplierInfo')}%`}
                                               info={'Extra multikill per tier for 20s per cast, only during a speedrun'}/>}
                         icon={'data/UISkillIcon46.png'} imgStyle={{ width: 32 }}/>
      <CardTitleAndValue title={`Equinox goal (${equinoxGoal})`}
                         value={<ValueWithInfo
                           value={equinoxGoalReached ? 'Done' : `${numberWithCommas(portalsToEquinoxGoal)} to go`}
                           info={'Unlock 75 or more portals on a single speedrun'}/>}/>
      <CardTitleAndValue title={'Kill per kill'}
                         value={<ValueWithBreakdown value={notateNumber(killPerKill?.value ?? 0, 'Big')}
                                                    breakdown={killPerKill?.breakdown}/>}/>
      <CardTitleAndValue title={'Portal progress / kill'}
                         value={<ValueWithBreakdown value={notateNumber(progress.perKill, 'Big')}
                                                    breakdown={progressBreakdown}/>}/>
      <CardTitleAndValue title={'Multikill tiers'} value={numberWithCommas(playerInfo?.multiKillTiers ?? 0)}/>
      <CardTitleAndValue title={'Damage'}
                         value={<ValueWithBreakdown value={notateNumber(playerInfo?.maxDamage ?? 0, 'Big')}
                                                    breakdown={playerInfo?.damageBreakdown}/>}/>
    </Stack>
    <Divider sx={{ mb: 3 }}/>
    <Bosses bosses={plan.bosses} bossPortals={plan.bossPortals}/>
    <Portals character={selectedVoidwalker} plan={plan}/>
  </>
};

export default Speedrun;
