import { Stack } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import Timer from '../../../components/common/Timer';
import { getTabs, notateNumber } from '@utility/helpers';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue } from '@components/common/styles';
import { CardWithBreakdown } from '@components/account/Worlds/World5/Hole/commons';
import { PAGES } from '@components/constants';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Worlds/World3/Equinox/Upgrades';
import Challenges from '@components/account/Worlds/World3/Equinox/Challenges';

const Equinox = () => {
  const { state } = useContext(AppContext);
  const equinox = state?.account?.equinox;
  return (
    <>
      <NextSeo
        title="Equinox | Idleon Toolbox"
        description="Track your Equinox upgrades, dream bonuses, and unlockable perks for all your Legends of Idleon characters"
      />
      {equinox?.unlocked ? <Stack mb={1} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
        <CardWithBreakdown title={'Fill rate'} value={`${Math.round(equinox.chargeRate)} / hr`}
                           breakdown={equinox?.breakdown}/>
        <CardTitleAndValue title={'Equinox Progression'}
                           value={`${notateNumber(equinox.currentCharge, 'Whole')} / ${notateNumber(equinox.chargeRequired, 'Whole')}`}/>
        <CardTitleAndValue title={'Time to full'} value={<Timer type={'countdown'}
                                                                placeholder={'Upgrade is ready'}
                                                                date={equinox.timeToFull}
                                                                lastUpdated={state?.lastUpdated}/>}/>
      </Stack> : null}
      <Tabber tabs={getTabs(PAGES.ACCOUNT['world 3'].categories, 'Equinox')}>
        <Upgrades upgrades={equinox?.upgrades}/>
        <Challenges challenges={equinox?.challenges} completedClouds={equinox?.completedClouds}/>
      </Tabber>
    </>
  );
};

export default Equinox;