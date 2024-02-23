import { Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import Tabber from '@components/common/Tabber';
import JadeEmporium from '@components/account/Worlds/World6/JadeEmporium';
import { notateNumber } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import Charms from '@components/account/Worlds/World6/Charms';
import PlayersInventory from '@components/account/Worlds/World6/PlayersInventory';
import Upgrades from '@components/account/Worlds/World6/Upgrades';

const Sneaking = () => {
  const { state } = useContext(AppContext);
  const { jadeEmporium, jadeCoins, players, inventory, dropList, pristineCharms, upgrades } = state?.account?.sneaking

  return <>
    <Typography sx={{ textAlign: 'center' }} variant={'h3'}>Sneaking</Typography>
    <CardTitleAndValue title={'Jade coins'} value={notateNumber(jadeCoins)} icon={`etc/jade_coin.png`}/>
    <Tabber tabs={['Inventory', 'Jade Emporium', 'Upgrades', 'Charms']}>
      <PlayersInventory players={players} dropList={dropList} inventory={inventory} characters={state?.characters}/>
      <JadeEmporium upgrades={jadeEmporium}/>
      <Upgrades upgrades={upgrades}/>
      <Charms charms={pristineCharms}/>
    </Tabber>
  </>
};

export default Sneaking;
