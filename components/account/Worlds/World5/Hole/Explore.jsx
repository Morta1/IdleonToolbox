import React from 'react';
import { Stack } from '@mui/material';
import Tabber from '@components/common/Tabber';
import TheWell from '@components/account/Worlds/World5/Hole/Caverns/TheWell';
import Motherlode from '@components/account/Worlds/World5/Hole/Caverns/Motherlode';
import TheDen from '@components/account/Worlds/World5/Hole/Caverns/TheDen';
import Bravery from '@components/account/Worlds/World5/Hole/Caverns/Bravery';
import TheBell from '@components/account/Worlds/World5/Hole/Caverns/TheBell';
import TheHarp from '@components/account/Worlds/World5/Hole/Caverns/TheHarp';
import TheLamp from '@components/account/Worlds/World5/Hole/Caverns/TheLamp';
import TheHive from '@components/account/Worlds/World5/Hole/Caverns/TheHive';
import Grotto from '@components/account/Worlds/World5/Hole/Caverns/Grotto';
import Justice from '@components/account/Worlds/World5/Hole/Caverns/Justice';
import TheJars from '@components/account/Worlds/World5/Hole/Caverns/TheJars';
import Evertree from '@components/account/Worlds/World5/Hole/Caverns/Evertree';
import Wisdom from '@components/account/Worlds/World5/Hole/Caverns/Wisdom';
import Gambit from '@components/account/Worlds/World5/Hole/Caverns/Gambit';
import TheTemple from '@components/account/Worlds/World5/Hole/Caverns/TheTemple';
import TheFountain from '@components/account/Worlds/World5/Hole/Caverns/TheFountain';
import TheBottomlessTrench from '@components/account/Worlds/World5/Hole/Caverns/TheBottomlessTrench';
import CrystalGlunkoCove from '@components/account/Worlds/World5/Hole/Caverns/CrystalGlunkoCove';
import { CAVERN_LABELS, CAVERN_TABS, villagerTiles } from '@components/account/Worlds/World5/Hole/commons';

const CAVERN_ICONS = CAVERN_TABS.map((tab, index) => `etc/Cavern_${index}`);

const Explore = ({ hole, sectionFailed }) => {
  const explore = hole?.villagers?.[0];
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>{villagerTiles(explore)}</Stack>
    <Tabber
      level={2}
      label={'Caverns'}
      clearOnChange={['dnt']}
      tabs={CAVERN_TABS}
      labels={CAVERN_LABELS}
      icons={CAVERN_ICONS}
    >
      <TheWell hole={hole}/>
      <Motherlode hole={hole}/>
      <TheDen hole={hole}/>
      <Bravery hole={hole}/>
      <TheBell hole={hole}/>
      <TheHarp hole={hole}/>
      <TheLamp hole={hole}/>
      <TheHive hole={hole}/>
      <Grotto hole={hole}/>
      <Justice hole={hole}/>
      <TheJars hole={hole} sectionFailed={sectionFailed}/>
      <Evertree hole={hole}/>
      <Wisdom hole={hole}/>
      <Gambit hole={hole}/>
      <TheTemple hole={hole}/>
      <TheFountain hole={hole} sectionFailed={sectionFailed}/>
      <TheBottomlessTrench hole={hole}/>
      <CrystalGlunkoCove hole={hole}/>
    </Tabber>
  </>
};

export default Explore;
