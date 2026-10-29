import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue, MissingData, isSectionFailed } from '@components/common/styles';
import { Stack } from '@mui/material';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import { getTabs } from '@utility/helpers';
import Companions from '@components/account/Worlds/World7/Tournament/Companions';
import Matches from '@components/account/Worlds/World7/Tournament/Matches';
import Leaderboard from '@components/account/Worlds/World7/Tournament/Leaderboard';

const Tournament = () => {
  const { state } = useContext(AppContext);
  const router = useRouter();

  // The Pet Mart tab moved to the Pets page; old bookmarks and search results still carry ?t=Pet Mart.
  // Client redirect because the site is a static export (same approach as royal-guardian.jsx).
  useEffect(() => {
    if (router.isReady && router.query.t === 'Pet Mart') {
      router.replace({ pathname: '/account/prem-currency/pets', query: router.query });
    }
  }, [router.isReady, router.query]);
  const tournament = state?.account?.tournament;
  const companions = state?.account?.companions?.list;

  const sectionFailed = isSectionFailed(state?.account, 'tournament');
  if (!tournament || sectionFailed) return <MissingData name={'Tournament'} failed={sectionFailed}/>;

  const { divisionName, tournamentDay, registrationCount, matchDay } = tournament;

  return <>
    <NextSeo
      title="Tournament | Idleon Toolbox"
      description="Track your companion tournament division, team lineup, match results, and rankings in Legends of Idleon"
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
