import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import Tasks from '../../../components/account/Worlds/World4/Rift/Tasks';
import Bonuses from '../../../components/account/Worlds/World4/Rift/Bonuses';
import SkillMastery from '../../../components/account/Worlds/World4/Rift/SkillMastery';
import ConstructMastery from '../../../components/account/Worlds/World4/Rift/ConstructMastery';
import Tabber from '../../../components/common/Tabber';
import { PAGES } from '@components/constants';
import { MissingData, isParseFailed, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { cleanUnderscore, formatNum, getTabs } from '@utility/helpers';
import { getRiftCount } from '@parsers/world-4/rift';
import { isCookingMasteryUnlocked } from '@components/account/Worlds/World4/CookingMastery';

const Rift = () => {
  const { state } = useContext(AppContext);
  const { totalSkillsLevels, towers } = state?.account || {};
  const rift = state?.account?.rift ?? {};
  const sectionFailed = isSectionFailed(state?.account, 'rift');

  const tabs = getTabs(PAGES.ACCOUNT['world 4'].categories, 'rift');
  const currentRift = rift?.currentRift ?? 0;
  const riftCount = getRiftCount(rift?.list);
  // The first bonus still locked past the rift you are on; Cooking Mastery by its own rule, as the Bonuses tab reads it
  const nextIndex = (rift?.list ?? []).findIndex(({ riftBonus }, index) => riftBonus && index > currentRift
    && !(riftBonus === 'Cooking_Mastery' && isCookingMasteryUnlocked(state?.account)));
  const nextBonus = nextIndex >= 0 ? rift.list[nextIndex] : null;

  return <>
    <NextSeo
      title="Rift | Idleon Toolbox"
      description="Track your Rift bonuses, task completion, and skill upgrades in Legends of Idleon World 4"
    />
    {sectionFailed ? <MissingData name={'the Rift'} failed atZero={!isParseFailed(state?.account)}/> : null}
    {sectionFailed ? null : <PageSummary>
      <StatTile label={'Rift'} value={`${formatNum(Math.min(currentRift + 1, riftCount))} / ${formatNum(riftCount)}`}/>
      {nextBonus ? <StatTile label={'Next bonus'} icon={`etc/${nextBonus.riftBonusIcon}.png`}
                             value={cleanUnderscore(nextBonus.riftBonus)} sub={`At rift ${formatNum(nextIndex + 1)}`}/> : null}
    </PageSummary>}
    <Tabber tabs={tabs}>
      <Tasks {...rift} characters={state?.characters}/>
      <Bonuses {...rift} account={state?.account}/>
      <SkillMastery {...rift} totalSkillsLevels={totalSkillsLevels} characters={state?.characters}/>
      <ConstructMastery {...rift} totalLevels={towers?.totalLevels} account={state?.account} sectionFailed={sectionFailed}/>
    </Tabber>
  </>
};

export default Rift;
