import { NextSeo } from 'next-seo';
import { Stack } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { getNextCompanionClaim, getTabs, numberWithCommas } from '@utility/helpers';
import Timer from '@components/common/Timer';
import { CardTitleAndValue } from '../../../components/common/styles';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import PetCollection from '@components/account/Pets/PetCollection';
import PetMart from '@components/account/Pets/PetMart';

const Pets = () => {
  const { state } = useContext(AppContext);
  const nextCompanionClaim = getNextCompanionClaim(state?.account);
  const tokens = state?.account?.companions?.tokens;

  return <>
    <NextSeo
      title="Pets | Idleon Toolbox"
      description="View your pet collection, Pet Mart+ upgrades and bonuses, trade offers, and the daily Pet Mart rotation in Legends of Idleon"
    />
    <Stack mb={3} direction={'row'} gap={3} flexWrap={'wrap'} alignItems="center">
      <CardTitleAndValue title={'Pet Crystals'} value={numberWithCommas(state?.account?.companions?.petCrystals ?? 0)} icon='data/PremiumGem.png' imgStyle={{ filter: 'hue-rotate(280deg)', width: 24, height: 24 }} />
      <CardTitleAndValue title={'Total Box Opened'} value={numberWithCommas(state?.account?.companions?.totalBoxesOpened ?? 0)} />
      <CardTitleAndValue title={'Tokens Available'} value={numberWithCommas(tokens?.remaining ?? 0)} icon='data/Quest119.png' imgStyle={{ width: 24, height: 24 }} />
      <CardTitleAndValue title={'Token Bonuses Active'} value={numberWithCommas(tokens?.used ?? 0)} icon='data/Quest119.png' imgStyle={{ width: 24, height: 24 }} />
      <CardTitleAndValue title={'Next free companion'} value={<Timer
        type={'countdown'} date={nextCompanionClaim}
        placeholder={'Go claim!'}
        lastUpdated={state?.lastUpdated} />} />
    </Stack>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['prem-currency'].categories, 'pets')}>
      <PetCollection/>
      <PetMart petMart={state?.account?.tournament?.petMart} companions={state?.account?.companions?.list}/>
    </Tabber>
  </>
};

export default Pets;
