import React from 'react';
import { Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import Charge from '../../../components/account/Worlds/World3/Charge';
import Totems from '../../../components/account/Worlds/World3/Totems';

const Worship = () => {
  return (
    <>
      <NextSeo
        title="Worship | Idleon Toolbox"
        description="Keep track of your worship charge and charge rate for all of your characters"
      />
      <Typography variant={'h2'}>Worship</Typography>

      <Tabber tabs={['Charge', 'Totems']}>
        <Charge/>
        <Totems/>
      </Tabber>
    </>
  );
};


export default Worship;
