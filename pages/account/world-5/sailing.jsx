import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Stack, Typography } from '@mui/material';
import Artifacts from '@components/account/Worlds/World5/Sailing/Artifacts';
import LootPile from '@components/account/Worlds/World5/Sailing/LootPile';
import { getTabs, prefix } from '@utility/helpers';
import Chests from '@components/account/Worlds/World5/Sailing/Chests';
import BoatsAndCaptains from '@components/account/Worlds/World5/Sailing/BoatsAndCaptains';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
import { NextSeo } from 'next-seo';
import Trades from '@components/account/Worlds/World5/Sailing/Trades';
import Tabber from '../../../components/common/Tabber';
import { PAGES } from '@components/constants';

const Sailing = () => {
  const { state } = useContext(AppContext);
  const {
    artifacts,
    lootPile,
    maxChests,
    captains,
    boats,
    chests,
    captainsOnBoats,
    trades,
    shopCaptains,
    minimumTravelTime,
    minimumTravelTimeBreakdown
  } = state?.account?.sailing || {};
  if (!state?.account?.sailing) return <MissingData name={'sailing'}/>;

  return <>
    <NextSeo
      title="Sailing | Idleon Toolbox"
      description="Keep track of your artiacts, boats and captains and their bonuses"
    />
    <Stack mb={2} direction={'row'} gap={1}>
      <CardTitleAndValue title={'Chests'}>
        <Stack direction={'row'} gap={2}>
          <img style={{ width: 50, objectFit: 'contain' }} src={`${prefix}npcs/Chesty.png`} alt="chest-icon"/>
          <Typography>{chests?.length || 0} / {maxChests}</Typography>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Captains'}>
        <Stack direction={'row'} gap={2}>
          <img style={{ width: 28, objectFit: 'contain' }} src={`${prefix}npcs/Captain.gif`} alt="captain-icon"/>
          <Typography>{captains?.length}</Typography>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Boats'}>
        <Stack direction={'row'} gap={2}>
          <img style={{ width: 42, objectFit: 'contain' }} src={`${prefix}npcs/Boat.gif`} alt="boat-icon"/>
          <Typography>{boats?.length}</Typography>
        </Stack>
      </CardTitleAndValue>
    </Stack>

    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 5'].categories, 'sailing')}>
      <Artifacts artifacts={artifacts}/>
      <Trades trades={trades} lastUpdated={state?.lastUpdated}/>
      <BoatsAndCaptains boats={boats} captains={captains}
                        lootPile={lootPile}
                        minimumTravelTime={minimumTravelTime}
                        minimumTravelTimeBreakdown={minimumTravelTimeBreakdown}
                        captainsOnBoats={captainsOnBoats} shopCaptains={shopCaptains}
                        lastUpdated={state?.lastUpdated}/>
      <LootPile lootPile={lootPile}/>
      <Chests chests={chests}/>
    </Tabber>
  </>
};

export default Sailing;
