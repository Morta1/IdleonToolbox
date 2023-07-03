import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import Artifacts from 'components/account/Worlds/World5/Sailing/Artifacts';
import LootPile from '../../../components/account/Worlds/World5/Sailing/LootPile';
import { prefix } from '../../../utility/helpers';
import Chests from '../../../components/account/Worlds/World5/Sailing/Chests';
import BoatsAndCaptains from '../../../components/account/Worlds/World5/Sailing/BoatsAndCaptains';
import { MissingData } from '../../../components/common/styles';
import { NextSeo } from 'next-seo';
import Trades from '../../../components/account/Worlds/World5/Sailing/Trades';
import Tabber from '../../../components/common/Tabber';

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
    shopCaptains
  } = state?.account?.sailing || {};
  if (!state?.account?.sailing) return <MissingData name={'sailing'}/>;

  return <>
    <NextSeo
      title="Idleon Toolbox | Sailing"
      description="Keep track of your artiacts, boats and captains and their bonuses"
    />
    <Typography variant={'h2'} textAlign={'center'} mb={3}>Sailing</Typography>
    <Stack mb={2} direction={'row'} gap={1}>
      <Card>
        <CardContent>
          <Stack direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'}>
            <img style={{ width: 50, objectFit: 'contain' }} src={`${prefix}npcs/Chesty.gif`} alt=""/>
            <Typography>Chests: {chests?.length || 0} / {maxChests}</Typography>
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Stack direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'}>
            <img style={{ width: 28, objectFit: 'contain' }} src={`${prefix}npcs/Captain.gif`} alt=""/>
            <Typography>Captains: {captains?.length}</Typography>
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Stack direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'}>
            <img style={{ width: 42, objectFit: 'contain' }} src={`${prefix}npcs/Boat.gif`} alt=""/>
            <Typography>Boats: {boats?.length}</Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>

    <Tabber tabs={['Artifacts', 'Trades', 'Boats and Captains', 'Loot Pile', 'Chests']}>
      <Artifacts artifacts={artifacts}/>
      <Trades trades={trades} lastUpdated={state?.lastUpdated}/>
      <LootPile lootPile={lootPile}/>
      <BoatsAndCaptains boats={boats} captains={captains}
                        lootPile={lootPile}
                        captainsOnBoats={captainsOnBoats} shopCaptains={shopCaptains}
                        lastUpdated={state?.lastUpdated}/>
      <Chests chests={chests}/>
    </Tabber>
  </>
};

export default Sailing;
