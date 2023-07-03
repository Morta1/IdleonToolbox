import React, { useContext } from 'react';
import { Typography } from '@mui/material';
import { AppContext } from '../../../components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import Tasks from '../../../components/account/Worlds/World4/Rift/Tasks';
import Bonuses from '../../../components/account/Worlds/World4/Rift/Bonuses';
import SkillMastery from '../../../components/account/Worlds/World4/Rift/SkillMastery';
import ConstructMastery from '../../../components/account/Worlds/World4/Rift/ConstructMastery';
import Tabber from '../../../components/common/Tabber';

const Rift = () => {
  const { state } = useContext(AppContext);
  const { rift, totalSkillsLevels, towers } = state?.account || {};

  let tabs = ['Tasks', 'Bonuses',
    'Skill Mastery', 'Construct Mastery']
    .filter((tab) => rift?.currentRift > 15 ? true : tab !== 'Skill Mastery')
    .filter((tab) => rift?.currentRift > 40 ? true : tab !== 'Construction Mastery');

  return <>
    <NextSeo
      title="Idleon Toolbox | Rift"
      description="Keep track of your rift bonuses, tasks and more"
    />
    <Typography variant={'h2'} mb={3}>Rift</Typography>
    <Tabber tabs={tabs}>
      <Tasks {...rift} characters={state?.characters}/>
      <Bonuses {...rift} account={state?.account}/>
      <SkillMastery {...rift} totalSkillsLevels={totalSkillsLevels}/>
      <ConstructMastery {...rift} totalLevels={towers?.totalLevels}/>
    </Tabber>
  </>
};

export default Rift;
