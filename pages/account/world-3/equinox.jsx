import { Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import Timer from '../../../components/common/Timer';
import { getTabs, notateNumber } from '../../../utility/helpers';
import { NextSeo } from 'next-seo';
import { Breakdown, CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import { PAGES } from '@components/constants';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Worlds/World3/equinox/Upgrades';
import Challenges from '@components/account/Worlds/World3/equinox/Challenges';

const Equinox = () => {
  const { state } = useContext(AppContext);
  const equinox = state?.account?.equinox;
  if (!equinox) {
    return <Typography variant={'h2'} textAlign={'center'} mt={3}>Unlock Equinox first</Typography>;
  }
  return (
    <>
      <NextSeo
        title="Equinox | Idleon Toolbox"
        description="Equinox progression"
      />
      <Stack mb={1} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
        <CardTitleAndValue title={'Fill rate'}>
          <Stack direction="row" alignItems={'center'} gap={1}>
            <Typography>{Math.round(equinox.chargeRate)} / hr</Typography>
            <Tooltip title={<Breakdown breakdown={equinox?.breakdown} notation={'MultiplierInfo'}/>} >
              <IconInfoCircleFilled size={18}/>
            </Tooltip>
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Equinox Progression'}
                           value={`${notateNumber(equinox.currentCharge, 'Whole')} / ${notateNumber(equinox.chargeRequired, 'Whole')}`}/>
        <CardTitleAndValue title={'Time to full'} value={<Timer type={'countdown'}
                                                                placeholder={'Upgrade is ready'}
                                                                date={equinox.timeToFull}
                                                                lastUpdated={state?.lastUpdated}/>}/>
      </Stack>
      <Tabber tabs={getTabs(PAGES.ACCOUNT['world 3'].categories, 'Equinox')}>
        <Upgrades upgrades={equinox?.upgrades}/>
        <Challenges challenges={equinox?.challenges} completedClouds={equinox?.completedClouds}/>
      </Tabber>
    </>
  );
};

export default Equinox;