import React, { useContext } from 'react';
import { Typography } from '@mui/material';
import { AppContext } from '../../../components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import Tasks from '../../../components/account/Worlds/World4/Rift/Tasks';
import Bonuses from '../../../components/account/Worlds/World4/Rift/Bonuses';
import SkillMastery from '../../../components/account/Worlds/World4/Rift/SkillMastery';
import ConstructMastery from '../../../components/account/Worlds/World4/Rift/ConstructMastery';
import Tabber from '../../../components/common/Tabber';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';

const Rift = () => {
  const { state } = useContext(AppContext);
  const { rift, totalSkillsLevels, towers } = state?.account || {};

  let tabs = getTabs(PAGES.ACCOUNT['world 4'].categories, 'rift');

  return <>
    <NextSeo
      title="Rift | Idleon Toolbox"
      description="Keep track of your rift bonuses, tasks and more"
    />
    <Tabber tabs={tabs}>
      <Tasks {...rift} characters={state?.characters}/>
      <Bonuses {...rift} account={state?.account}/>
      <SkillMastery {...rift} totalSkillsLevels={totalSkillsLevels} characters={state?.characters}/>
      <ConstructMastery {...rift} totalLevels={towers?.totalLevels}/>
    </Tabber>
  </>
};

export default Rift;
