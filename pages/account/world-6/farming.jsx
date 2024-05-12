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
  const { market, plot, crop, cropDepot = {}, instaGrow, beanTrade } = state?.account?.farming || {};
  return <>
    <NextSeo
      title="Farming | Idleon Toolbox"
      description="Keep track of your garden with all its bonuses"
    />
    <Stack direction={'row'} gap={1}>
      <CardTitleAndValue title={'Bean Trade'} value={Math.round(beanTrade)} icon={'data/Quest80_x1.png'} imgStyle={{width: 24}}/>
      <CardTitleAndValue title={'Insta Grow'} value={instaGrow}/>
    </Stack>
    <Typography variant={'h5'}>Crop depot</Typography>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      {Object.entries(cropDepot).map(([stat, { name, value }], index) => {
        const isMulti = stat === 'gamingEvo' || stat === 'cookingSpeed';
        const isBase = stat === 'critters';
        const val = notateNumber(value, isMulti ? 'MultiplierInfo' : 'Big');
        return <CardTitleAndValue key={stat} title={name} value={`${isBase ? '+':''}${val}${isBase ? '' :isMulti ? 'x':'%'}`} icon={`etc/Pen_${index}.png`}>
        </CardTitleAndValue>
      })}
    </Stack>
    <Tabber tabs={['Plot', 'Market', 'Crop']}>
      <Plot plot={plot} crop={crop} lastUpdated={state?.lastUpdated}/>
      <Market market={market} crop={crop}/>
      <Crop crop={crop}/>
    </Tabber>
  </>
};

export default Farming;
