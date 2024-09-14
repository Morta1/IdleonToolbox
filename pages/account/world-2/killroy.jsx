import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Stack } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { notateNumber } from '@utility/helpers';
import { getKillroySchedule } from '@parsers/misc';
import Tabber from '@components/common/Tabber';
import Monsters from '@components/account/Worlds/World2/Killroy/Monsters';
import Schedule from '@components/account/Worlds/World2/Killroy/Schedule';
import Upgrades from '@components/account/Worlds/World2/Killroy/Upgrades';

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
      <CardTitleAndValue title={'Total Damage Multi'} value={`${killroy.totalDamageMulti}x`}/>
    </Stack>
    <Tabber tabs={['Schedule', 'Upgrades', 'Monsters']}>
      <Schedule schedule={schedule}/>
      <Upgrades killroy={killroy}/>
      <Monsters killroy={killroy}/>
    </Tabber>
  </>
};

export default MyComponent;
