import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack } from '@mui/material';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
import { commaNotation, getTabs, notateNumber } from '@utility/helpers';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import Sushi from '@components/account/Worlds/World7/SushiStation/Sushi';
import Upgrades from '@components/account/Worlds/World7/SushiStation/Upgrades';
import Bonuses from '@components/account/Worlds/World7/SushiStation/Bonuses';

const SushiStation = () => {
  const { state } = useContext(AppContext);
  const sushiStation = state?.account?.sushiStation;

  if (!sushiStation) return <MissingData name={'sushi station'}/>;

  const {
    uniqueSushi,
    fuel,
    currency,
    upgrades,
    knowledge,
    rogBonuses,
    slots,
    fireplaces,
    shakerUses
  } = sushiStation;

  return <>
    <NextSeo
      title="Sushi Station | Idleon Toolbox"
      description="Track your Sushi Station upgrades, sushi collection, fuel, and Ring of Gains bonuses in Legends of Idleon World 7"
    />

    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <CardTitleAndValue
        title={'Unique Sushi'}
        value={uniqueSushi ?? 0}
      />
      <CardTitleAndValue
        title={'Bucks'}
        value={notateNumber(Math.floor(currency?.bucks ?? 0))}
        icon={'etc/Bucks.png'}
      />
      <CardTitleAndValue
        title={'Bucks/hr'}
        value={Math.floor(currency?.currencyPerHR ?? 0) < 1e8
          ? commaNotation(Math.floor(currency?.currencyPerHR ?? 0))
          : notateNumber(Math.floor(currency?.currencyPerHR ?? 0), 'Big')}
        icon={'etc/Bucks.png'}
      />
      <CardTitleAndValue
        title={'Fuel'}
        value={`${notateNumber(fuel?.current ?? 0, 'Big')} / ${notateNumber(fuel?.cap ?? 0, 'Big')}`}
        icon={'etc/Fuel.png'}
      />
      <CardTitleAndValue
        title={'Fuel/hr'}
        icon={'etc/Fuel.png'}
        value={notateNumber(fuel?.generation ?? 0, 'Big')}
      />
      {uniqueSushi < rogBonuses?.length && knowledge?.[uniqueSushi] && (() => {
        const tier = uniqueSushi;
        const fuelCost = tier === 5 ? 176 : 10 * Math.pow(1.83, tier) - Math.pow(tier, 2);
        return <CardTitleAndValue
          title={'Next Unlock'}
          icon={`data/Sushi${uniqueSushi}.png`}
          imgStyle={{ width: 24, height: 24 }}
          value={`${knowledge[uniqueSushi].name} (${notateNumber(Math.ceil(fuelCost), 'Big')} fuel)`}
          tooltipTitle={`Cook a Tier ${tier} sushi to discover ${knowledge[uniqueSushi].name}`}
        />;
      })()}
      <CardTitleAndValue
        title={'Salt Shaker'}
        value={shakerUses?.[0] || '0'}
        tooltipTitle={'Chance to tier-up all sushi'}
      />
      <CardTitleAndValue
        title={'Pepper Shaker'}
        value={shakerUses?.[1] || '0'}
        tooltipTitle={'Chance to Perfecto sushi (2x knowledge bonus)'}
      />
      <CardTitleAndValue
        title={'Saffron Shaker'}
        value={shakerUses?.[2] || '0'}
        tooltipTitle={'Generate 1 hour\'s worth of Bucks instantly'}
      />
    </Stack>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'sushiStation')}>
      <Sushi slots={slots} knowledge={knowledge} fireplaces={fireplaces}/>
      <Upgrades upgrades={upgrades}/>
      <Bonuses rogBonuses={rogBonuses} uniqueSushi={uniqueSushi} knowledge={knowledge}/>
    </Tabber>
  </>;
};

export default SushiStation;
