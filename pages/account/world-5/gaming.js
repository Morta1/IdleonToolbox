import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { Typography } from '@mui/material';
import { MissingData } from '../../../components/common/styles';
import { NextSeo } from 'next-seo';
import General from '../../../components/account/Worlds/World5/Gaming/General';
import Superbits from '../../../components/account/Worlds/World5/Gaming/Superbits';
import Tabber from '../../../components/common/Tabber';

const Gaming = () => {
  const { state } = useContext(AppContext);
  const { superbitsUpgrades } = state?.account?.gaming || {};
  if (!state?.account?.gaming) return <MissingData name={'gaming'}/>;
  return <>
    <NextSeo
      title="Idleon Toolbox | Gaming"
      description="Keep track of your gaming upgrades including dirty shovel and autumn squirrel timers"
    />
    <Typography variant={'h2'} textAlign={'center'} mb={3}>Gaming</Typography>
    <Tabber tabs={['General', 'Superbits']}>
      <General account={state?.account} lastUpdated={state?.lastUpdated}/>
      <Superbits superbits={superbitsUpgrades}/>
    </Tabber>
  </>
};


export default Gaming;
