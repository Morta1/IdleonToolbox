import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Stack } from '@mui/material';
import { notateNumber } from '@utility/helpers';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
import HatRack from '@components/account/Worlds/World3/HatRack';

const HatRackPage = () => {
  const { state } = useContext(AppContext);
  const {
    bonusMulti,
    hatBonuses,
    hatsUsed,
    totalHats,
    allPremiumHelmets
  } = state?.account?.hatRack || {};

  if (!state?.account?.hatRack) return <MissingData name={'hatRack'} />;

  return (
    <>
      <NextSeo
        title="Hat Rack | Idleon Toolbox"
        description="Keep track of your hat rack bonuses and premium hats"
      />

      <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
        <CardTitleAndValue title={'Total Hats'} value={totalHats || 0} />
        <CardTitleAndValue title={'Bonus Multiplier'} value={`${notateNumber(bonusMulti, 'MultiplierInfo')}x`} />
      </Stack>

      <HatRack
        hatsUsed={hatsUsed}
        hatBonuses={hatBonuses}
        totalHats={totalHats}
        bonusMulti={bonusMulti}
        allPremiumHelmets={allPremiumHelmets}
      />
    </>
  );
};

export default HatRackPage;

