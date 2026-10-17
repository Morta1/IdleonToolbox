import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack, Typography } from '@mui/material';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { CardTitleAndValue } from '@components/common/styles';
import { commaNotation, getTabs } from '@utility/helpers';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import { calcTotalItemOwned } from '@parsers/storage';
import Missions from '@components/account/Worlds/World7/Menagerie/Missions';
import Unlocks from '@components/account/Worlds/World7/Menagerie/Unlocks';
import Boosts from '@components/account/Worlds/World7/Menagerie/Boosts';
import Jellies from '@components/account/Worlds/World7/Menagerie/Jellies';
import { formatLumi, LUMI_ICON, SHELL_ICON } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

// The Yellow Jellyfish builds in the 8th construction slot while no building sits there
const EIGHTH_BUILD_SLOT = 7;

const Menagerie = () => {
  const { state } = useContext(AppContext);
  const menagerie = state?.account?.menagerie;
  const {
    unlocked,
    rank,
    shells,
    shellReq,
    lumi,
    lumiRate,
    lumiRateBreakdown,
    missions,
    unlocks,
    boosts
  } = menagerie || {};
  const unlocksOwned = unlocks?.filter(({ owned }) => owned)?.length ?? 0;
  const boostLevels = boosts?.reduce((sum, { level }) => sum + (level ?? 0), 0) ?? 0;
  const claimableMissions = unlocked ? missions?.filter(({ canClaim, visible }) => canClaim && visible)?.length ?? 0 : 0;

  return <>
    <NextSeo
      title="Luminous Menagerie | Idleon Toolbox"
      description="Track your Luminous Menagerie missions, unlocks, boosts, jellyfish and Lumi gains in Legends of Idleon World 7"
    />
    {!unlocked ? <Typography variant={'body2'} color={'text.secondary'} mb={2}>
      Your account has not reached the Luminous Menagerie yet. It is found in the Molten Edge map in World 7.
    </Typography> : null}
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <CardTitleAndValue title={'Menagerie Rank'} value={commaNotation(rank ?? 0)}/>
      <CardTitleAndValue title={'Shells'} icon={SHELL_ICON} imgStyle={{ width: 24, height: 24 }}
                         value={`${commaNotation(shells ?? 0)} / ${commaNotation(shellReq ?? 0)}`}/>
      <CardTitleAndValue title={'Lumi'} icon={LUMI_ICON} imgStyle={{ width: 14, height: 26 }}
                         value={formatLumi(lumi ?? 0)}/>
      <CardTitleAndValue title={'Lumi per hour'}>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          {formatLumi(lumiRate ?? 0)}
          <Breakdown data={lumiRateBreakdown}>
            <IconInfoCircleFilled size={18} style={{ cursor: 'pointer', display: 'block' }}/>
          </Breakdown>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Claimable missions'} value={commaNotation(claimableMissions)}/>
      <CardTitleAndValue title={'Unlocks owned'} value={`${unlocksOwned} / ${unlocks?.length ?? 0}`}/>
      <CardTitleAndValue title={'Total Boost LV'} value={commaNotation(boostLevels)}/>
    </Stack>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'menagerie')}>
      <Missions missions={missions} unlocked={unlocked}/>
      <Unlocks unlocks={unlocks} menagerie={menagerie}/>
      <Boosts boosts={boosts} doublers={menagerie?.doublers}/>
      <Jellies jellies={menagerie?.jellies}
               ladlesOwned={calcTotalItemOwned(state?.account?.storage, state?.characters, 'Ladle')}
               buildSlotOpen={!state?.account?.towers?.data?.some(({ slot }) => slot === EIGHTH_BUILD_SLOT)}/>
    </Tabber>
  </>;
};

export default Menagerie;
