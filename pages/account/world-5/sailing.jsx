import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Alert, Stack, Typography } from '@mui/material';
import Artifacts from '@components/account/Worlds/World5/Sailing/Artifacts';
import LootPile from '@components/account/Worlds/World5/Sailing/LootPile';
import { getTabs, prefix } from '@utility/helpers';
import Chests from '@components/account/Worlds/World5/Sailing/Chests';
import BoatsAndCaptains from '@components/account/Worlds/World5/Sailing/BoatsAndCaptains';
import { CardTitleAndValue } from '@components/common/styles';
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
    minimumTravelTimeBreakdown,
    unlocked
  } = state?.account?.sailing || {};

  // The parser now hands back the artifact catalog even when sailing is locked, so instead of a
  // dead-end "missing data" notice the page still shows what sailing contains - all 41 artifacts and
  // their bonuses - with the player's own numbers at zero. `unlocked === false` is the flag to
  // branch on; never truthiness on `state.account.sailing`, which is always an object now.
  const isLocked = unlocked === false;

  return <>
    <NextSeo
      title="Sailing | Idleon Toolbox"
      description="Keep track of your artiacts, boats and captains and their bonuses"
    />
    {isLocked ? <Alert severity={'info'} sx={{ mb: 2 }}>
      Sailing isn&apos;t unlocked on this account yet. The artifacts below are the full list and what
      each one does — your own progress will fill in once you&apos;ve unlocked it.
    </Alert> : null}
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
