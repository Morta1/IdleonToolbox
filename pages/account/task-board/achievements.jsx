import { useContext, useState } from 'react';
import { Box, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import styled from '@emotion/styled';
import HtmlTooltip from 'components/Tooltip';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, notateNumber, prefix, worldsArray } from 'utility/helpers';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import { CardTitleAndValue } from '@components/common/styles';
import EmptyState from '@components/common/EmptyState';
import useTabIndex from '@hooks/useTabIndex';

const achievementsPerWorld = 70;
// Every world reserves 70 slots, but the unused ones are fillers that the grid never renders.
const isRealAchievement = ({ name, visualIndex }) => visualIndex !== -1 && !name?.includes('FILLER');

const Achievements = () => {
  const { state } = useContext(AppContext);
  const [world] = useTabIndex(worldsArray);
  const [hideCompleted, setHideCompleted] = useState(false);

  const getWorldAchievements = (worldIndex) => {
    const start = worldIndex * achievementsPerWorld;
    const achievements = state?.account?.achievements?.slice(start, start + achievementsPerWorld);
    achievements?.sort((a, b) => a?.visualIndex - b?.visualIndex);
    return achievements;
  }

  const worldTotals = worldsArray.map((worldName, worldIndex) => {
    const achievements = getWorldAchievements(worldIndex)?.filter(isRealAchievement) ?? [];
    return {
      worldName,
      total: achievements.length,
      completed: achievements.filter(({ completed }) => completed).length
    };
  }).filter(({ total }) => total > 0);
  const combined = worldTotals.reduce((acc, { completed, total }) => ({
    completed: acc.completed + completed,
    total: acc.total + total
  }), { completed: 0, total: 0 });

  const worldAchievements = getWorldAchievements(world)?.filter(isRealAchievement) ?? [];
  const localAchievements = worldAchievements.filter(({ completed }) => !(hideCompleted && completed));

  return (
    <Box>
      <NextSeo
        title="Achievements | Idleon Toolbox"
        description="Track your achievement completion, reward tiers, and unlockable bonuses in Legends of Idleon"
      />
      <Stack mb={3} direction={'row'} alignItems={'center'} gap={2} flexWrap={'wrap'}>
        {worldTotals.map(({ worldName, completed, total }) => <CardTitleAndValue key={`total-${worldName}`}
                                                                                title={worldName}
                                                                                value={`${completed} / ${total}`}/>)}
        <CardTitleAndValue title={'Total'} value={`${combined.completed} / ${combined.total}`}/>
        <FormControlLabel
          control={<Checkbox checked={hideCompleted}
                             onChange={(e) => setHideCompleted(e.target.checked)}/>}
          label={'Hide completed'}/>
      </Stack>
      <Tabber tabs={worldsArray} keepChildren>
        <Box display={'flex'} justifyContent={'center'}>
          {localAchievements?.length > 0 ?
            <Stack sx={{ width: { lg: 900 } }} justifyContent={'center'} mt={3} flexWrap={'wrap'} direction={'row'}
                   gap={3}>
              {localAchievements?.map((achievement, index) => {
                const { name, rawName, completed, currentQuantity, quantity } = achievement;
                return <Stack sx={{ position: 'relative' }} key={`${name}-${index}`}>
                  <HtmlTooltip title={<AchievementTooltip {...achievement}/>}>
                    <Achievement completed={completed} src={`${prefix}data/${rawName}.png`}
                                 alt={cleanUnderscore(name)}/>
                  </HtmlTooltip>
                  {currentQuantity ? <Quantity>
                    {notateNumber(currentQuantity)} {quantity > 1 ?
                    <span> / {notateNumber(quantity, 'Big')}</span> : null}
                  </Quantity> : null}
                </Stack>
              })}
            </Stack> : <EmptyState hideCompleted={hideCompleted && worldAchievements.length > 0}
                                   label={'achievements'}/>}
        </Box>
      </Tabber>
    </Box>
  );
};

const Quantity = styled.span`
  position: absolute;
  font-size: 14px;
  z-index: 1;
  bottom: -24px;
  pointer-events: none;
  width: 80px;
  left: -4px;
`

const Achievement = styled.img`
  filter: ${({ completed }) => completed ? 'grayscale(0)' : 'grayscale(.8)'};
  opacity: ${({ completed }) => completed ? '1' : '0.3'};
  margin-left: -4px;
  object-fit: contain;
  width: 60px;
`;

const AchievementTooltip = ({ name, desc, rewards, currentQuantity, quantity }) => {
  return <>
    <Typography variant={'h5'} fontWeight={500}>{cleanUnderscore(name)}</Typography>
    <Typography variant={'body1'}>{cleanUnderscore(desc)}</Typography>
    {currentQuantity ? <Box mt={1} mb={1}>
      <Typography variant={'body1'}>Progress: {currentQuantity} {quantity > 1 ?
        <span> / {quantity}</span> : null}</Typography>
    </Box> : null}
    <Box mt={1}>
      <Typography variant={'body1'} fontWeight={'bold'}>Rewards:</Typography>
      <Typography variant={'body1'}>{cleanUnderscore(rewards.join(', '))}</Typography>
    </Box>
  </>
}

export default Achievements;
