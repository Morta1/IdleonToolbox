import React from 'react';
import { Divider, Stack, useMediaQuery } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { fillArrayToLength, getTabs, msToDate } from '@utility/helpers';
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
import { PAGES } from '@components/constants';
import TheJars from '@components/account/Worlds/World5/Hole/Caverns/TheJars';
import Evertree from '@components/account/Worlds/World5/Hole/Caverns/Evertree';
import Wisdom from '@components/account/Worlds/World5/Hole/Caverns/Wisdom';
import Gambit from '@components/account/Worlds/World5/Hole/Caverns/Gambit';
import TheTemple from '@components/account/Worlds/World5/Hole/Caverns/TheTemple';
import { CardWithBreakdown, ExpRateCard } from '@components/account/Worlds/World5/Hole/commons';

const Explore = ({ hole }) => {
  const breakpoint = useMediaQuery('(max-width: 1600px)', { noSsr: true });
  const [explore] = hole?.villagers || [];
  const caverns = fillArrayToLength(15);
  return <>
    <Stack mb={1} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Level'} value={explore?.level}/>
      <CardTitleAndValue title={'Exp'} value={`${explore?.exp} / ${explore?.expReq}`}/>
      <ExpRateCard title={'Exp rate'} expRate={explore?.expRate}/>
      <CardTitleAndValue title={'Time to level'} value={explore?.timeLeft >= 0 && explore?.expRate?.value > 0
        ? msToDate(explore?.timeLeft)
        : '0'}/>
      <CardTitleAndValue title={'Opals invested'} value={explore?.opalInvested || '0'} icon={'data/Opal.png'}
                         imgStyle={{ width: 22, height: 22 }}/>
      <CardTitleAndValue title={'Unlocked caverns'} value={hole?.unlockedCaverns}/>
      <CardWithBreakdown title={'Total Monument Afk'} value={`${hole?.caverns?.bravery?.afkPercent?.value.toFixed(2)}%`} breakdown={hole?.caverns?.bravery?.afkPercent?.breakdown} notation={'MultiplierInfo'}/>
    </Stack>
    <Divider sx={{ mb: 3 }}/>
    <Tabber
      queryKey={'nt'}
      clearOnChange={['dnt']}
      iconsOnly
      forceScroll={breakpoint}
      tabs={getTabs(PAGES.ACCOUNT['world 5'].categories, 'hole', 'Explore')}
      icons={caverns.map((a, index) => `etc/Cavern_${index}`)}
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
      <TheJars hole={hole}/>
      <Evertree hole={hole}/>
      <Wisdom hole={hole}/>
      <Gambit hole={hole}/>
      <TheTemple hole={hole}/>
    </Tabber>
  </>
};

export default Explore;
