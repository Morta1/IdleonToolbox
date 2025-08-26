import React, { useContext, useMemo } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Stack, Typography } from '@mui/material';
import BreedingUpgrades from '@components/account/Worlds/World4/Breeding/BreedingUpgrades';
import BreedingArena from '@components/account/Worlds/World4/Breeding/BreedingArena';
import Territory from '@components/account/Worlds/World4/Breeding/Territory';
import { getTabs, notateNumber, prefix } from 'utility/helpers';
import { NextSeo } from 'next-seo';
import Pets from '@components/account/Worlds/World4/Breeding/Pets/Pets';
import { getJewelBonus, getLabBonus } from '@parsers/lab';
import { getMealsBonusByEffectOrStat } from '@parsers/cooking';
import { getBubbleBonus } from '@parsers/alchemy';
import { getAchievementStatus } from '@parsers/achievements';
import { isMasteryBonusUnlocked } from '@parsers/misc';
import Timer from '../../../components/common/Timer';
import Tabber from '../../../components/common/Tabber';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { PAGES } from '@components/constants';
import { CardTitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const Breeding = () => {
  const { state } = useContext(AppContext);

  const calcTimePerEgg = () => {
    const emeraldRhinestoneBonus = getJewelBonus(state?.account?.lab?.jewels, 11);
    const mealBonus = getMealsBonusByEffectOrStat(state?.account, null, 'TimeEgg');
    const bubbleBonus = getBubbleBonus(state?.account, 'EGG_INK', false);
    const achievement = getAchievementStatus(state?.account?.achievements, 220);
    const skillMasteryBonus = isMasteryBonusUnlocked(state?.account?.rift, state?.account?.totalSkillsLevels?.breeding?.rank, 1);
    const voteBonus = getVoteBonus(state?.account, 16) || 0;

    return 7200 / (1 + (emeraldRhinestoneBonus
      + (mealBonus
        + (bubbleBonus
          + (10 * achievement
            + (15 * skillMasteryBonus
              + voteBonus))))) / 100) * 1000;
  }
  const timePerEgg = useMemo(() => calcTimePerEgg(), [state]);
  const now = new Date().getTime();
  return (
    <>
      <NextSeo
        title="Breeding | Idleon Toolbox"
        description="Keep track of your breeding upgrades, eggs and arena upgrades"
      />
      <Stack my={2} direction={'row'} alignItems={'center'} flexWrap={'wrap'} gap={1}>
        <CardTitleAndValue title={'Time to next egg'} value={<Timer type={'countdown'}
                                                                    stopAtZero
                                                                    date={now + (timePerEgg - state?.account?.breeding?.timeToNextEgg)}
                                                                    lastUpdated={state?.lastUpdated}/>}/>
        <CardTitleAndValue title={'Time per egg'}
                           value={<Timer staticTime={true} date={new Date().getTime() + timePerEgg}/>}/>
        <CardTitleAndValue title={'Egg power range'}
                           value={<Tooltip
                             title={<EggPowerRangeBreakdown powerRange={state?.account?.breeding?.eggsPowerRange}/>}>
                             <IconInfoCircleFilled size={18}/>
                           </Tooltip>}/>
        {state?.account?.breeding?.eggs?.map((eggLevel, index) => {
          return eggLevel > 0 ? <CardTitleAndValue key={`egg-${index}`} title=""
                                                   value={<img src={`${prefix}data/PetEgg${eggLevel}.png`}
                                                               alt="egg-icon"/>
                                                   }>

          </CardTitleAndValue> : null
        })}
      </Stack>
      <Typography variant={'caption'}>*Time to next egg timer will be updated only when entering world 4
        town</Typography>
      <Tabber tabs={getTabs(PAGES.ACCOUNT['world 4'].categories, 'breeding')} clearOnChange={['nt']}>
        <Pets {...state?.account?.breeding}
              lab={state?.account?.lab}
              account={state?.account}
              characters={state?.characters}
              lastUpdated={state?.lastUpdated}
        />
        <Territory {...state?.account?.breeding} spices={state?.account?.cooking?.spices}/>
        <BreedingUpgrades petUpgrades={state?.account?.breeding?.petUpgrades}
                          account={state?.account}
                          meals={state?.account?.cooking?.meals}/>
        <BreedingArena {...state?.account?.breeding} />
      </Tabber>
    </>
  );
};

const EggPowerRangeBreakdown = ({ powerRange }) => {
  return <Stack sx={{ maxWidth: 150 }}>
    <Typography variant={'caption'}>* Best breeding lv BM</Typography>
    {powerRange.map(({ minPower, maxPower }, index) => <Stack direction={'row'} alignItems={'center'}
                                                              key={`egg-power-range-${index}`}>
      <img src={`${prefix}data/PetEgg${index + 1}.png`}
           alt="egg-icon"/>
      <Typography ml={1}
                  variant={'body2'}>{notateNumber(Math.floor(minPower))} - {notateNumber(Math.floor(maxPower))}</Typography>
    </Stack>)}
  </Stack>
}

export default Breeding;
