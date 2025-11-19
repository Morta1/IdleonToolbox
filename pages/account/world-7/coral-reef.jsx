import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack, Typography } from '@mui/material';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
import { notateNumber } from '@utility/helpers';
import Tabber from '@components/common/Tabber';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';
import ReefUpgrades from '@components/account/Worlds/World7/CoralReef/ReefUpgrades';
import CoralKidUpgrades from '@components/account/Worlds/World7/CoralReef/CoralKidUpgrades';
import DancingCoral from '@components/account/Worlds/World7/CoralReef/DancingCoral';

const CoralReef = () => {
  const { state } = useContext(AppContext);
  const {
    coralKidUpgrades,
    dancingCoral,
    reefUpgrades,
    reefDayGains
  } = state?.account?.coralReef || {};

  if (!state?.account?.coralReef) return <MissingData name={'coralReef'} />;

  // Map reef index to image name

  return <>
    <NextSeo
      title="Coral Reef | Idleon Toolbox"
      description="Keep track of your coral reef upgrades, coral kid upgrades, and dancing coral"
    />

    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <CardTitleAndValue title={'Reef Day Gains'} value={`${reefDayGains || 0}`} icon={`data/Coral0.png`} imgStyle={{ width: 24, height: 24 }} />
    </Stack>

    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'coralReef')}>
      <ReefUpgrades reefUpgrades={reefUpgrades} />
      <CoralKidUpgrades coralKidUpgrades={coralKidUpgrades} />
      <DancingCoral dancingCoral={dancingCoral} />
    </Tabber>
  </>;
};

export default CoralReef;

