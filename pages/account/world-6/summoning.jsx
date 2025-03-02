import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import Tabber from '@components/common/Tabber';
import WinnerBonuses from '@components/account/Worlds/World6/summoning/WinnerBonuses';
import { AppContext } from '@components/common/context/AppProvider';
import Upgrades from '@components/account/Worlds/World6/summoning/Upgrades';
import { notateNumber } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import { Divider, Stack } from '@mui/material';
import Battles from '@components/account/Worlds/World6/summoning/Battles';

const Summoning = () => {
  const { state } = useContext(AppContext);
  const {
    winnerBonuses,
    upgrades,
    essences,
    allBattles,
    armyHealth,
    armyDamage,
    highestEndlessLevel
  } = state?.account?.summoning || {};
  return <>
    <NextSeo
      title="Summoning | Idleon Toolbox"
      description="Keep track of your summoning bonuses"
    />
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} my={3} alignItems={'center'}>
      <CardTitleAndValue value={highestEndlessLevel}
                         icon={'etc/Endless_Summoning.png'} imgStyle={{ width: 25 }} cardSx={{ my: 0, mb: 0 }}/>
      <Divider flexItem orientation={'vertical'}/>
      {essences?.map((value, index) => {
        if (index > 6) return null;
        return <CardTitleAndValue key={index} value={notateNumber(value)} icon={`data/SummC${index + 1}.png`}
                                  cardSx={{ my: 0, mb: 0 }}/>
      })}
    </Stack>
    <Tabber tabs={['Upgrades', 'Winner Bonuses', 'Battles']}>
      <Upgrades upgrades={upgrades}/>
      <WinnerBonuses winnerBonuses={winnerBonuses}/>
      <Battles battles={allBattles} armyHealth={armyHealth} armyDamage={armyDamage} highestEndlessLevel={highestEndlessLevel}/>
    </Tabber>
  </>
};

export default Summoning;
