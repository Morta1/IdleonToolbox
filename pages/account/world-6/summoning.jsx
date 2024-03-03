import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import Tabber from '@components/common/Tabber';
import WinnerBonuses from '@components/account/Worlds/World6/summoning/WinnerBonuses';
import { AppContext } from '@components/common/context/AppProvider';
import Upgrades from '@components/account/Worlds/World6/summoning/Upgrades';
import { notateNumber } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import { Stack } from '@mui/material';

const Summoning = () => {
  const { state } = useContext(AppContext);
  const { winnerBonuses, upgrades, essences } = state?.account?.summoning || {};
  return <>
    <NextSeo
      title="Summoning | Idleon Toolbox"
      description="Keep track of your summoning bonuses"
    />
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      {essences?.map((value, index) => {
        if (index > 5) return null;
        return <CardTitleAndValue key={index} value={notateNumber(value)} icon={`data/SummC${index + 1}.png`}>
        </CardTitleAndValue>
      })}
    </Stack>
    <Tabber tabs={['Upgrades', 'Winner Bonuses']}>
      <Upgrades upgrades={upgrades}/>
      <WinnerBonuses winnerBonuses={winnerBonuses}/>
    </Tabber>
  </>
};

export default Summoning;
