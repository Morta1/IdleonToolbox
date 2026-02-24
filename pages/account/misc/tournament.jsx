import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
import { Stack } from '@mui/material';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import { getTabs } from '@utility/helpers';
import Companions from '@components/account/Worlds/World7/Tournament/Companions';
import Matches from '@components/account/Worlds/World7/Tournament/Matches';
import Leaderboard from '@components/account/Worlds/World7/Tournament/Leaderboard';

const Tournament = () => {
  const { state } = useContext(AppContext);
  const tournament = state?.account?.tournament;
  const companions = state?.account?.companions?.list;

  if (!tournament) return <MissingData name={'tournament'}/>;

  const { divisionName, tournamentDay, registrationCount, matchDay } = tournament;

  return <>
    <NextSeo
      title="Tournament | Idleon Toolbox"
      description="Track your companion tournament division and team"
    />

    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <CardTitleAndValue title={'Division'} value={divisionName}/>
      <CardTitleAndValue title={'Match Day'} value={matchDay}/>
      <CardTitleAndValue title={'Tournament Day'} value={tournamentDay}/>
      <CardTitleAndValue title={'Registrations'} value={registrationCount}/>
    </Stack>

    <Tabber tabs={getTabs(PAGES.ACCOUNT['misc'].categories, 'tournament')}>
      <Companions companions={companions}/>
      <Matches tournament={tournament} companions={companions}/>
      <Leaderboard tournament={tournament}/>
    </Tabber>
  </>;
};

export default Tournament;
