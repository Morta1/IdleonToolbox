import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import Tasks from '../../../components/account/Worlds/World4/Rift/Tasks';
import Bonuses from '../../../components/account/Worlds/World4/Rift/Bonuses';
import SkillMastery from '../../../components/account/Worlds/World4/Rift/SkillMastery';
import ConstructMastery from '../../../components/account/Worlds/World4/Rift/ConstructMastery';
import Tabber from '../../../components/common/Tabber';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';
import { MissingData, isParseFailed, isSectionFailed } from '@components/common/styles';

const Rift = () => {
  const { state } = useContext(AppContext);
  const { totalSkillsLevels, towers } = state?.account || {};
  const rift = state?.account?.rift ?? {};
  const sectionFailed = isSectionFailed(state?.account, 'rift');

  const tabs = getTabs(PAGES.ACCOUNT['world 4'].categories, 'rift');

  return <>
    <NextSeo
      title="Rift | Idleon Toolbox"
      description="Track your Rift bonuses, task completion, and skill upgrades in Legends of Idleon World 4"
    />
    {sectionFailed ? <MissingData name={'the Rift'} failed atZero={!isParseFailed(state?.account)}/> : null}
    <Tabber tabs={tabs}>
      <Tasks {...rift} characters={state?.characters}/>
      <Bonuses {...rift} account={state?.account}/>
      <SkillMastery {...rift} totalSkillsLevels={totalSkillsLevels} characters={state?.characters}/>
      <ConstructMastery {...rift} totalLevels={towers?.totalLevels} account={state?.account} sectionFailed={sectionFailed}/>
    </Tabber>
  </>
};

export default Rift;
