import { Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import Tabber from '@components/common/Tabber';
import Market from '@components/account/Worlds/World6/farming/Market';
import { AppContext } from '@components/common/context/AppProvider';
import Plot from '@components/account/Worlds/World6/farming/Plot';
import Crop from '@components/account/Worlds/World6/farming/Crop';
import { CardTitleAndValue } from '@components/common/styles';
import { notateNumber } from '@utility/helpers';

const Farming = () => {
  const { state } = useContext(AppContext);
  const { market, plot, crop, cropDepot = {} } = state?.account?.farming;
  return <>
    <NextSeo
      title="Farming | Idleon Toolbox"
      description="Keep track of your garden with all its bonuses"
    />
    <Typography variant={'h5'}>Crop depot</Typography>
    <Stack direction={'row'} gap={1}>
      {Object.entries(cropDepot).map(([stat, { name, value }], index) => {
        const val = notateNumber(value, stat === 'gamingEvo' ? 'MultiplierInfo' : 'Big');
        return <CardTitleAndValue key={stat} title={name} value={`${val}%`} icon={`etc/Pen_${index}.png`}>
        </CardTitleAndValue>
      })}
    </Stack>
    <Tabber tabs={['Plot', 'Market', 'Crop']}>
      <Plot plot={plot} crop={crop}/>
      <Market market={market} crop={crop}/>
      <Crop crop={crop}/>
    </Tabber>
  </>
};

export default Farming;
