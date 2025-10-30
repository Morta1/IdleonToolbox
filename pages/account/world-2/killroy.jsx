import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Stack } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { getTabs, notateNumber } from '@utility/helpers';
import { getKillroySchedule } from '@parsers/misc';
import Tabber from '@components/common/Tabber';
import Monsters from '@components/account/Worlds/World2/Killroy/Monsters';
import Schedule from '@components/account/Worlds/World2/Killroy/Schedule';
import Upgrades from '@components/account/Worlds/World2/Killroy/Upgrades';
import PermanentUpgrades from '@components/account/Worlds/World2/Killroy/PermanentUpgrades';
import { PAGES } from '@components/constants';

const MyComponent = () => {
  const { state } = useContext(AppContext);
  const { killroy } = state?.account || { deathNote: {} };
  const schedule = getKillroySchedule(state?.account, state?.characters, state?.account?.serverVars);

  return <>
    <NextSeo
      title="Killroy | Idleon Toolbox"
      description="Keep track of kill roy kills progression"
    />
    <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
      <CardTitleAndValue title={'Skulls'} value={notateNumber(killroy?.skulls)} icon={'etc/Killroy_Skull.png'}/>
      <CardTitleAndValue title={'Total Kills'} value={notateNumber(killroy.totalKills)} />
      <CardTitleAndValue title={'Total Damage Multi'} value={`${Math.floor(100 * killroy.totalDamageMulti) / 100}x`}/>
    </Stack>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 2'].categories, 'killroy')}>
      <Schedule killroy={killroy} schedule={schedule}/>
      <Upgrades killroy={killroy}/>
      <PermanentUpgrades killroy={killroy}/>
      <Monsters killroy={killroy}/>
    </Tabber>
  </>
};

export default MyComponent;
