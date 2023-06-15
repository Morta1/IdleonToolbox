import React, { useContext, useState } from 'react';
import { Tab, Tabs, Typography, useMediaQuery } from '@mui/material';
import { AppContext } from '../../../components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import Tasks from '../../../components/account/Worlds/World4/Rift/Tasks';
import Bonuses from '../../../components/account/Worlds/World4/Rift/Bonuses';
import SkillMastery from '../../../components/account/Worlds/World4/Rift/SkillMastery';
import ConstructMastery from '../../../components/account/Worlds/World4/Rift/ConstructMastery';

const Rift = () => {
  const { state } = useContext(AppContext);
  const { rift, totalSkillsLevels, towers } = state?.account || {};

  let tabs = ['Tasks', 'Bonuses',
    'Skill Mastery', 'Construct Mastery']
    .filter((tab) => rift?.currentRift > 15 ? true : tab !== 'Skill Mastery')
    .filter((tab) => rift?.currentRift > 40 ? true : tab !== 'Construction Mastery');

  const [selectedTab, setSelectedTab] = useState(0);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const handleOnClick = (e, selected) => {
    setSelectedTab(selected);
  }

  return <>
    <NextSeo
      title="Idleon Toolbox | Rift"
      description="Keep track of your rift bonuses, tasks and more"
    />
    <Typography variant={'h2'} mb={3}>Rift</Typography>
    <Tabs centered
          sx={{ marginBottom: 3 }}
          variant={isMd ? 'fullWidth' : 'standard'}
          value={selectedTab} onChange={handleOnClick}>
      {tabs?.map((tab, index) => {
        return <Tab label={tab} key={`${tab}-${index}`}/>;
      })}
    </Tabs>
    {selectedTab === 0 ? <Tasks {...rift} characters={state?.characters}/> : null}
    {selectedTab === 1 ? <Bonuses {...rift} account={state?.account}/> : null}
    {selectedTab === 2 ? <SkillMastery {...rift} totalSkillsLevels={totalSkillsLevels}/> : null}
    {selectedTab === 3 ? <ConstructMastery {...rift} totalLevels={towers?.totalLevels}/> : null}
  </>
};

export default Rift;
