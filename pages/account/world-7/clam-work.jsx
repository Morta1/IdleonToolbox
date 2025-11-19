import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack } from '@mui/material';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
import { notateNumber, commaNotation } from '@utility/helpers';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Worlds/World7/ClamWork/Upgrades';
import Compensations from '@components/account/Worlds/World7/ClamWork/Compensations';

const ClamWork = () => {
  const { state } = useContext(AppContext);
  const clamWork = state?.account?.clamWork || {};
  const account = state?.account;

  if (!state?.account?.clamWork) return <MissingData name={'clamWork'} />;

  const {
    workerClass,
    promotionChance,
    promotionCost,
    clamHp,
    mobs,
    pearlValue,
    blackPearlValue,
    upgrades,
    ownedPearls,
    compensations,
    respawn
  } = clamWork;

  return <>
    <NextSeo
      title="Clam Work | Idleon Toolbox"
      description="Keep track of your clam work upgrades and bonuses"
    />

    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <CardTitleAndValue
        title={'Worker Class'}
        value={`Lv. ${workerClass ?? 0}`}
      />
      <CardTitleAndValue
        title={'Owned Pearls'}
        value={notateNumber(ownedPearls ?? 0, 'Big')}
        icon={'data/ClamPearl0.png'}
        imgStyle={{ width: 24, height: 24 }}
      />
      <CardTitleAndValue
        title={'Promotion Chance'}
        value={`${((promotionChance ?? 0) * 100).toFixed(2)}%`}
      />
      <CardTitleAndValue
        title={'Promotion Cost'}
        value={promotionCost ?? '0'}
      />
      <CardTitleAndValue
        title={'Pearl Value Multiplier'}
        value={notateNumber(pearlValue ?? 1, 'Big')}
      />
      <CardTitleAndValue
        title={'Black Pearl Value'}
        value={notateNumber(blackPearlValue ?? 50, 'Big')}
      />
      <CardTitleAndValue
        title={'Clam Mobs'}
        value={commaNotation(mobs ?? 0)}
      />
      <CardTitleAndValue
        title={'Clam HP'}
        value={notateNumber(clamHp ?? 0, 'Big')}
      />
      <CardTitleAndValue
        title={'Respawn Time'}
        value={`${respawn ?? 60}s`}
      />
    </Stack>

    <Tabber tabs={['Upgrades', 'Compensations']}>
      <Upgrades upgrades={upgrades} account={account} />
      <Compensations compensations={compensations} />
    </Tabber>
  </>;
};

export default ClamWork;
