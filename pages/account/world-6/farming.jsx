import { Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import Tabber from '@components/common/Tabber';
import Market from '@components/account/Worlds/World6/farming/Market';
import { AppContext } from '@components/common/context/AppProvider';
import Plot from '@components/account/Worlds/World6/farming/Plot';
import Crop from '@components/account/Worlds/World6/farming/Crop';
import { CardTitleAndValue } from '@components/common/styles';
import { commaNotation, getTabs, notateNumber } from '@utility/helpers';
import RankDatabase from '@components/account/Worlds/World6/farming/RankDatabase';
import { PAGES } from '@components/constants';

const Farming = () => {
  const { state } = useContext(AppContext);
  const {
    market,
    plot,
    crop,
    maxTimes,
    cropDepot = {},
    instaGrow,
    beanTrade,
    ranks,
    totalPoints,
    usedPoints
  } = state?.account?.farming || {};
  return <>
    <NextSeo
      title="Farming | Idleon Toolbox"
      description="Keep track of your garden with all its bonuses"
    />
    <Stack direction={'row'} gap={1}>
      <CardTitleAndValue title={'Bean Trade'} value={commaNotation(Math.round(beanTrade))} icon={'data/Quest80_x1.png'}
                         imgStyle={{ width: 24 }}/>
      <CardTitleAndValue title={'Insta Grow'} value={instaGrow}/>
      <CardTitleAndValue title={'Ranks pts'} value={`${usedPoints}/${totalPoints}`}/>
    </Stack>
    <Typography variant={'h5'}>Crop depot</Typography>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      {Object.entries(cropDepot).map(([stat, { name, value }], index) => {
        const isMulti = stat === 'gamingEvo' || stat === 'cookingSpeed';
        const isBase = stat === 'critters';
        const val = notateNumber(value, isMulti ? 'MultiplierInfo' : 'Big');
        return <CardTitleAndValue key={stat} title={name}
                                  value={`${isBase ? '+' : ''}${val}${isBase ? '' : isMulti ? 'x' : '%'}`}
                                  icon={`etc/Pen_${index}.png`}>
        </CardTitleAndValue>
      })}
    </Stack>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 6'].categories, 'farming')}>
      <Plot plot={plot} crop={crop} market={market} ranks={ranks} lastUpdated={state?.lastUpdated} account={state?.account}/>
      <Market market={market} crop={crop}/>
      <RankDatabase ranks={ranks}/>
      <Crop crop={crop} maxTimes={maxTimes}/>
    </Tabber>
  </>
};

export default Farming;
