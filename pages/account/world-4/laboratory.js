import { Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import Mainframe from 'components/account/Worlds/World4/Mainframe';
import Console from 'components/account/Worlds/World4/Console';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import LabRotation from '../../../components/account/Worlds/World4/LabRotation';

const Laboratory = () => {
  const { state } = useContext(AppContext);
  const { lab } = state?.account;

  return (
    <>
      <NextSeo
        title="Idleon Toolbox | Laboratory"
        description="Keep track of your lab upgrades, lab connected players, chips and more"
      />
      <Typography variant={'h2'} textAlign={'center'} mb={3}>Laboratory</Typography>

      <Tabber tabs={['Main frame', 'Console', 'Chips And Jewels Rotation']}>
        <Mainframe {...lab} characters={state?.characters} divinity={state?.account?.divinity}/>
        <Console {...lab} characters={state?.characters}/>
        <LabRotation/>
      </Tabber>
    </>
  );
};

export default Laboratory;
