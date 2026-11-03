import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Stack } from '@mui/material';
import { commaNotation, notateNumber } from '@utility/helpers';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue, MissingData, isSectionFailed } from '@components/common/styles';
import CapeVine from '@components/account/Worlds/World4/CapeVine';

const CapeVinePage = () => {
  const { state } = useContext(AppContext);
  const {
    bonusMulti,
    capeBonuses,
    capesUsed,
    allCapes,
    totalCapes,
    totalEligibleCapes,
    goldenVines,
    nextGoldenVineClassLevel
  } = state?.account?.capeVine || {};

  const sectionFailed = isSectionFailed(state?.account, 'capeVine');

  return (
    <>
      <NextSeo
        title="Cape Vine | Idleon Toolbox"
        description="Keep track of your Cape Vine bonuses, Golden Vines and every cape you still need"
      />
      {!state?.account?.capeVine || sectionFailed ? <MissingData name={'Cape Vine'} failed={sectionFailed}/> : <>
        <Stack mb={3} direction={'row'} gap={2} flexWrap={'wrap'}>
          <CardTitleAndValue title={'Capes Collected'} value={`${totalCapes || 0} / ${totalEligibleCapes || 0}`}/>
          <CardTitleAndValue title={'Bonus Multiplier'} value={`${notateNumber(bonusMulti, 'MultiplierInfo')}x`}/>
          <CardTitleAndValue title={'Golden Vines'} value={goldenVines || 0}/>
          <CardTitleAndValue title={'Next Golden Vine'} value={`Class Lv. ${commaNotation(nextGoldenVineClassLevel || 0)}`}/>
        </Stack>
        <CapeVine capesUsed={capesUsed} capeBonuses={capeBonuses} allCapes={allCapes}/>
      </>}
    </>
  );
};

export default CapeVinePage;
