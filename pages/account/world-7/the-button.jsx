import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack } from '@mui/material';
import { MissingData, NotReached, isParseFailed, isSectionFailed } from '@components/common/styles';
import { formatNum } from '@utility/helpers';
import PageSummary, { SummaryFailed } from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Tasks from '@components/account/Worlds/World7/TheButton/Tasks';
import Bonuses, { PRESSES_PER_BONUS } from '@components/account/Worlds/World7/TheButton/Bonuses';

const TheButton = () => {
  const { state } = useContext(AppContext);
  const section = state?.account?.button;
  const sectionFailed = isSectionFailed(state?.account, 'button');
  const parseFailed = isParseFailed(state?.account);
  const {
    totalPresses,
    instaSkipsLeft,
    instaSkipsPerWeek,
    taskSequence,
    bonuses,
    bonusMulti,
    activeBonusIndex,
    pressesIntoCurrentBonus
  } = section ?? {};
  // A cycle is 5 presses per bonus
  const cycleLength = PRESSES_PER_BONUS * (bonuses?.length ?? 0);
  const activeBonus = bonuses?.[activeBonusIndex];

  return <SummaryFailed value={sectionFailed}>
    <NextSeo
      title="The Button | Idleon Toolbox"
      description="Track your Button presses, task progress, and bonus multipliers in Legends of Idleon World 7"
    />
    {!section || sectionFailed ? <MissingData name={'The Button'} failed={sectionFailed} atZero={!parseFailed}/>
      : <NotReached name={'the Button'} reached={totalPresses > 0}/>}
    <PageSummary failed={sectionFailed}>
      <StatTile label={'Total presses'} icon={'etc/ButtonG.png'} value={totalPresses ?? 0} kind={'amount'}/>
      <StatTile label={'Insta skips left'} value={instaSkipsLeft ?? 0} kind={'amount'}/>
      <StatTile label={'Insta skips per week'} value={instaSkipsPerWeek ?? 0} kind={'amount'}/>
      <StatTile label={'Bonus multi'} value={formatNum(bonusMulti ?? 1, 'mult')}/>
      <StatTile label={'Cycle'} value={cycleLength ? Math.floor((totalPresses ?? 0) / cycleLength) + 1 : 1}
                kind={'amount'}/>
      <StatTile label={'Next boost'}
                value={`${activeBonus?.name ?? '-'} (${formatNum(pressesIntoCurrentBonus ?? 0)}/${PRESSES_PER_BONUS})`}
                info={`Every ${PRESSES_PER_BONUS} presses boost the next bonus in the rotation.`}/>
    </PageSummary>
    <Stack gap={3}>
      <Bonuses bonuses={bonuses} activeBonusIndex={activeBonusIndex} pressesIntoCurrentBonus={pressesIntoCurrentBonus}/>
      {parseFailed ? null : <Tasks taskSequence={taskSequence} bonuses={bonuses} totalPresses={totalPresses} cycleLength={cycleLength}
             pressesIntoCurrentBonus={pressesIntoCurrentBonus}/>}
    </Stack>
  </SummaryFailed>;
};

export default TheButton;
