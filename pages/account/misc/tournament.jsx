import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { MissingData, isSectionFailed } from '@components/common/styles';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import { formatNum, getTabs } from '@utility/helpers';
import { tournyStuff } from '@website-data';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Companions from '@components/account/Worlds/World7/Tournament/Companions';
import Matches from '@components/account/Worlds/World7/Tournament/Matches';
import Leaderboard from '@components/account/Worlds/World7/Tournament/Leaderboard';
import useTabIndex from '@hooks/useTabIndex';

const Tournament = () => {
  const { state } = useContext(AppContext);
  const tabs = getTabs(PAGES.ACCOUNT['misc'].categories, 'tournament');
  const [tabIndex] = useTabIndex(tabs);
  const router = useRouter();

  // The Pet Mart tab moved to the Pets page; old bookmarks and search results still carry ?t=Pet Mart.
  // Client redirect because the site is a static export (same approach as royal-guardian.jsx).
  useEffect(() => {
    if (router.isReady && router.query.t === 'Pet Mart') {
      router.replace({ pathname: '/account/prem-currency/pets', query: router.query });
    }
  }, [router.isReady, router.query]);

  // The page renders under its note: a failed tournament section keeps the companions and the divisions (game data)
  const tournamentFailed = isSectionFailed(state?.account, 'tournament');
  const companionsFailed = isSectionFailed(state?.account, 'companions');
  const tournament = tournamentFailed ? null : state?.account?.tournament;
  const companions = companionsFailed ? [] : state?.account?.companions?.list;
  const failedNames = [tournamentFailed && 'Tournament', companionsFailed && 'Companions'].filter(Boolean);
  const shown = (value) => (tournament ? formatNum(value ?? 0) : '-');

  return <>
    <NextSeo
      title="Tournament | Idleon Toolbox"
      description="Track your companion tournament division, team lineup, match results, and rankings in Legends of Idleon"
    />
    {failedNames.length ? <MissingData name={failedNames.join(' and ')} failed atZero={companionsFailed && tabs[tabIndex] === 'Companions'}/> : null}
    <PageSummary>
      <StatTile label={'Division'} value={tournament?.divisionName ?? '-'}/>
      <StatTile label={'Match day'} value={shown(tournament?.matchDay)}/>
      <StatTile label={'Tournament day'} value={shown(tournament?.tournamentDay)}/>
      <StatTile label={'Registrations'} value={shown(tournament?.registrationCount)}/>
    </PageSummary>

    <Tabber tabs={tabs}>
      <Companions companions={companions} sectionFailed={companionsFailed}/>
      <Matches tournament={tournament} companions={companions} sectionFailed={tournamentFailed} companionsFailed={companionsFailed}/>
      <Leaderboard tournament={tournament ?? { divisionNames: tournyStuff?.divisionNames ?? [] }}/>
    </Tabber>
  </>;
};

export default Tournament;
