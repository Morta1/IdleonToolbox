import { Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import Tabber from '@components/common/Tabber';
import JadeEmporium from '@components/account/Worlds/World6/sneaking/JadeEmporium';
import { notateNumber } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import Charms from '@components/account/Worlds/World6/sneaking/Charms';
import PlayersInventory from '@components/account/Worlds/World6/sneaking/PlayersInventory';
import Upgrades from '@components/account/Worlds/World6/sneaking/Upgrades';
import { NextSeo } from 'next-seo';

const Sneaking = () => {
  const { state } = useContext(AppContext);
  const { jadeEmporium, jadeCoins, players, inventory, dropList, pristineCharms, upgrades, doorsCurrentHp } = state?.account?.sneaking || {};

  return <>
    <NextSeo
      title="Sneaking | Idleon Toolbox"
      description="Keep track of your ninja and jade upgrades and much more bonuses"
    />
    <Typography sx={{ textAlign: 'center' }} variant={'h3'}>Sneaking</Typography>
    <CardTitleAndValue title={'Jade coins'} value={notateNumber(jadeCoins)} icon={`etc/jade_coin.png`}/>
    <Tabber tabs={['Inventory', 'Jade Emporium', 'Upgrades', 'Charms']}>
      <PlayersInventory players={players}
                        dropList={dropList}
                        inventory={inventory}
                        characters={state?.characters}
                        account={state?.account}
                        doorsCurrentHp={doorsCurrentHp}
      />
      <JadeEmporium upgrades={jadeEmporium}/>
      <Upgrades upgrades={upgrades}/>
      <Charms charms={pristineCharms}/>
    </Tabber>
  </>
};

export default Sneaking;
