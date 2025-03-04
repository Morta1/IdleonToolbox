import React, { useContext, useMemo } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Card, CardContent, IconButton, Stack, Typography } from '@mui/material';
import BreedingUpgrades from '@components/account/Worlds/World4/Breeding/BreedingUpgrades';
import BreedingArena from '@components/account/Worlds/World4/Breeding/BreedingArena';
import Territory from '@components/account/Worlds/World4/Breeding/Territory';
import { getTabs, handleCopyToClipboard, prefix, tryToParse } from 'utility/helpers';
import { NextSeo } from 'next-seo';
import Pets from '../../../components/account/Worlds/World4/Breeding/Pets';
import { getJewelBonus, getLabBonus } from '@parsers/lab';
import { getMealsBonusByEffectOrStat } from '@parsers/cooking';
import { getBubbleBonus } from '@parsers/alchemy';
import { getAchievementStatus } from '@parsers/achievements';
import { isMasteryBonusUnlocked } from '@parsers/misc';
import Timer from '../../../components/common/Timer';
import Tabber from '../../../components/common/Tabber';
import Tooltip from '@components/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Button from '@mui/material/Button';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { PAGES } from '@components/constants';

const Breeding = () => {
  const { state } = useContext(AppContext);
  const calcTimePerEgg = () => {
    const spelunkerObolMulti = getLabBonus(state?.account?.lab?.labBonuses, 8); // gem multi
    const blackDiamondRhinestone = getJewelBonus(state?.account?.lab?.jewels, 16, spelunkerObolMulti);
    const emeraldRhinestoneBonus = getJewelBonus(state?.account?.lab?.jewels, 11, spelunkerObolMulti);
    const mealBonus = getMealsBonusByEffectOrStat(state?.account, null, 'TimeEgg', blackDiamondRhinestone);
    const bubbleBonus = getBubbleBonus(state?.account?.alchemy?.bubbles, 'kazam', 'EGG_INK', false);
    const achievement = getAchievementStatus(state?.account?.achievements, 220);
    const skillMasteryBonus = isMasteryBonusUnlocked(state?.account?.rift, state?.account?.totalSkillsLevels?.breeding?.rank, 1);
    const voteBonus = getVoteBonus(state?.account, 16) || 1;
    return 7200 / (1 +
      (emeraldRhinestoneBonus
        + (mealBonus
          + (bubbleBonus
            + (10 * achievement + 15 * skillMasteryBonus * voteBonus)))) / 100) * 1000;
  }
  const handleCopy = async () => {
    const data = tryToParse(localStorage.getItem('rawJson'));
    const breedingData = tryToParse(data?.data?.Breeding);
    await handleCopyToClipboard(breedingData, false)
  }
  const timePerEgg = useMemo(() => calcTimePerEgg(), [state]);
  const now = new Date().getTime();
  return (
    <>
      <NextSeo
        title="Breeding | Idleon Toolbox"
        description="Keep track of your breeding upgrades, eggs and arena upgrades"
      />
      <Stack direction={'row'} gap={2} alignItems={'center'}>
        <Button onClick={handleCopy}><ContentCopyIcon sx={{mr: 1}}/>Copy breeding data</Button>
      </Stack>
      <Stack my={2} direction={'row'} alignItems={'center'} flexWrap={'wrap'} gap={2}>
        {state?.account?.breeding?.eggs?.map((eggLevel, index) => {
          return eggLevel > 0 ? <Card key={`egg-${index}`}>
            <CardContent sx={{ '&:last-child': { padding: '8px' }, display: 'flex', alignItems: 'center' }}>
              <img src={`${prefix}data/PetEgg${eggLevel}.png`} alt=""/>
            </CardContent>
          </Card> : null;
        })}
      </Stack>
      <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
        <Card>
          <CardContent>
            <Typography variant={'subtitle2'}>Time to next egg</Typography>
            <Timer type={'countdown'}
                   stopAtZero
                   date={now + (timePerEgg - state?.account?.breeding?.timeToNextEgg)}
                   lastUpdated={state?.lastUpdated}/>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant={'subtitle2'}>Time per egg</Typography>
            <Timer staticTime={true} date={new Date().getTime() + timePerEgg}/>
          </CardContent>
        </Card>
      </Stack>
      <Typography variant={'caption'}>*Time to next egg timer will be updated only when entering world 4
        town</Typography>
      <Tabber tabs={getTabs(PAGES.ACCOUNT['world 4'].categories, 'breeding')}>
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

export default Breeding;
