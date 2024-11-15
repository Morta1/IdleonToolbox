import React from 'react';
import { Divider, Stack } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { commaNotation, fillArrayToLength } from '@utility/helpers';
import Tabber from '@components/common/Tabber';
import { cavernNames } from '@parsers/world-5/hole';
import TheWell from '@components/account/Worlds/World5/Hole/Caverns/TheWell';
import Motherlode from '@components/account/Worlds/World5/Hole/Caverns/Motherlode';
import TheDen from '@components/account/Worlds/World5/Hole/Caverns/TheDen';
import Bravery from '@components/account/Worlds/World5/Hole/Caverns/Bravery';
import TheBell from '@components/account/Worlds/World5/Hole/Caverns/TheBell';
import TheHarp from '@components/account/Worlds/World5/Hole/Caverns/TheHarp';
import TheLamp from '@components/account/Worlds/World5/Hole/Caverns/TheLamp';
import TheHive from '@components/account/Worlds/World5/Hole/Caverns/TheHive';
import Grotto from '@components/account/Worlds/World5/Hole/Caverns/Grotto';

const getCavernColor = (index) => {
  if (index >= 0 && index < 5) {
    return 'purple';
  } else if (index >= 5 && index < 10) {
    return 'yellow';
  }
}

const Explore = ({ hole }) => {
  const caverns = fillArrayToLength(10);
  return <>
    <Stack mb={1} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Level'} value={hole?.villagers?.[0]?.level}/>
      <CardTitleAndValue title={'Exp'} value={`${hole?.villagers?.[0]?.exp} / ${hole?.villagers?.[0]?.expReq}`}/>
      <CardTitleAndValue title={'Exp rate'} value={`${commaNotation(hole?.villagers?.[0]?.expRate)} / hr`}/>
      <CardTitleAndValue title={'Opals invested'} value={hole?.villagers?.[0]?.opalInvested} icon={'data/Opal.png'}
                         imgStyle={{ width: 22, height: 22 }}/>
      <CardTitleAndValue title={'Unlocked caverns'} value={hole?.unlockedCaverns}/>
    </Stack>
    <Divider sx={{ mb: 3 }}/>
    <Tabber
      iconsOnly
      tabs={cavernNames}
      icons={caverns.map((a, index) => `etc/Cavern_${index}`)}
    >
      <TheWell hole={hole}/>
      <Motherlode hole={hole}/>
      <TheDen hole={hole}/>
      <Bravery hole={hole} />
      <TheBell hole={hole} />
      <TheHarp hole={hole} />
      <TheLamp hole={hole} />
      <TheHive hole={hole} />
      <Grotto hole={hole} />
    </Tabber>
  </>
};

export default Explore;
