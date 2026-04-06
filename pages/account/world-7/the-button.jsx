import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack } from '@mui/material';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
import { notateNumber } from '@utility/helpers';
import Tasks from '@components/account/Worlds/World7/TheButton/Tasks';
import Bonuses from '@components/account/Worlds/World7/TheButton/Bonuses';

const TheButton = () => {
  const { state } = useContext(AppContext);
  const button = state?.account?.button;

  if (!button) return <MissingData name={'theButton'} />;

  const { totalPresses, instaSkipsLeft, instaSkipsPerWeek, taskSequence, bonuses, bonusMulti, activeBonusIndex, pressesIntoCurrentBonus } = button;

  return <>
    <NextSeo
      title="The Button | Idleon Toolbox"
      description="Track your Button presses, task progress, and bonus multipliers in Legends of Idleon World 7"
    />

    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <CardTitleAndValue title={'Total Presses'} value={totalPresses || '0'} />
      <CardTitleAndValue title={'Insta Skips Left'} value={instaSkipsLeft || '0'} />
      <CardTitleAndValue title={'Insta Skips/Week'} value={instaSkipsPerWeek || '0'} />
      <CardTitleAndValue title={'Bonus Multiplier'} value={`${notateNumber(bonusMulti, 'MultiplierInfo')}x`} />
      <CardTitleAndValue title={'Cycle'} value={Math.floor(totalPresses / 45) + 1} />
      <CardTitleAndValue title={'Next Boost'} value={`${bonuses?.[activeBonusIndex]?.name} (${pressesIntoCurrentBonus}/5)`} />
    </Stack>

    <Stack gap={3}>
      <Bonuses bonuses={bonuses} activeBonusIndex={activeBonusIndex} pressesIntoCurrentBonus={pressesIntoCurrentBonus} />
      <Tasks taskSequence={taskSequence} bonuses={bonuses} totalPresses={totalPresses} pressesIntoCurrentBonus={pressesIntoCurrentBonus} />
    </Stack>
  </>;
};

export default TheButton;
